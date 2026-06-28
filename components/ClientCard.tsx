'use client';

import { useEffect, useMemo, useState } from 'react';

type Reservation = {
  id: string;
  categoryId: string;
  categoryName: string;
  serviceId: string;
  serviceName: string;
  duration: number;
  date: string;
  time: string;
  endTime: string;
  name: string;
  phone: string;
  email: string;
  note?: string;
  createdAt: string;
  status?: 'confirmed' | 'cancelled' | 'no_show' | 'checked_in';
  checkedInAt?: string;
};

type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  note?: string;
  vip?: boolean;
  banned?: boolean;
  createdAt: string;
  updatedAt: string;
};

type Category = {
  id: string;
  name: string;
  services: { id: string; price: number }[];
};

type ClientCardProps = {
  reservation: Reservation;
  client: Client | null;
  reservations: Reservation[];
  categories: Category[];
  onClose: () => void;
  onSaveClient: (client: Client) => void;
};

function normalizeEmail(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function normalizePhone(value: unknown) {
  return String(value || '').trim();
}

function formatDate(iso?: string) {
  if (!iso) return '-';
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('cs-CZ');
}

function formatDateTimeCZ(iso?: string) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusLabel(status?: Reservation['status']) {
  if (status === 'checked_in') return 'Odbaveno';
  if (status === 'no_show') return 'Nedorazil';
  if (status === 'cancelled') return 'Storno';
  return 'Potvrzeno';
}

function statusMark(status?: Reservation['status']) {
  if (status === 'checked_in') return '✓';
  if (status === 'no_show') return '✕';
  if (status === 'cancelled') return '↺';
  return '•';
}

function getReservationPrice(r: Reservation, categories: Category[]) {
  return categories.find(c => c.id === r.categoryId)?.services.find(s => s.id === r.serviceId)?.price || 0;
}

function percent(part: number, total: number) {
  if (!total) return '0 %';
  return `${Math.round((part / total) * 100)} %`;
}

function csvCell(v: unknown) {
  return `"${String(v ?? '').replaceAll('"', '""')}"`;
}

function cleanFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'klient';
}

function downloadClientCsv(client: Client, list: Reservation[], categories: Category[]) {
  const lines = [
    ['jméno', 'telefon', 'email', 'datum', 'od', 'do', 'kategorie', 'služba', 'číslo rezervace', 'stav', 'cena', 'poznámka'].map(csvCell).join(';'),
    ...list
      .slice()
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
      .map(r => [
        client.name || r.name,
        client.phone || r.phone,
        client.email || r.email,
        r.date,
        r.time,
        r.endTime,
        r.categoryName,
        r.serviceName,
        r.id,
        statusLabel(r.status),
        getReservationPrice(r, categories),
        r.note || '',
      ].map(csvCell).join(';')),
  ];

  const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${cleanFileName(client.name || client.email || client.phone || 'klient')}-historie.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function ClientCard({ reservation, client, reservations, categories, onClose, onSaveClient }: ClientCardProps) {
  const now = new Date().toISOString();
  const fallbackClient: Client = client || {
    id: `CL-${Date.now().toString().slice(-6)}`,
    name: reservation.name || '',
    email: normalizeEmail(reservation.email),
    phone: normalizePhone(reservation.phone),
    note: '',
    vip: false,
    banned: false,
    createdAt: now,
    updatedAt: now,
  };

  const [draft, setDraft] = useState<Client>(fallbackClient);
  const [saved, setSaved] = useState('');

  useEffect(() => {
    setDraft(fallbackClient);
    setSaved('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client?.id, reservation.id]);

  const clientReservations = useMemo(() => {
    const email = normalizeEmail(draft.email || reservation.email);
    const phone = normalizePhone(draft.phone || reservation.phone);

    return reservations
      .filter(r => {
        const sameEmail = email && normalizeEmail(r.email) === email;
        const samePhone = phone && normalizePhone(r.phone) === phone;
        return sameEmail || samePhone;
      })
      .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  }, [draft.email, draft.phone, reservation.email, reservation.phone, reservations]);

  const stats = useMemo(() => {
    const total = clientReservations.length;
    const checkedIn = clientReservations.filter(r => r.status === 'checked_in').length;
    const cancelled = clientReservations.filter(r => r.status === 'cancelled').length;
    const noShow = clientReservations.filter(r => r.status === 'no_show').length;
    const confirmed = clientReservations.filter(r => !r.status || r.status === 'confirmed').length;
    const revenue = clientReservations.filter(r => r.status !== 'cancelled').reduce((sum, r) => sum + getReservationPrice(r, categories), 0);
    const checkedRevenue = clientReservations.filter(r => r.status === 'checked_in').reduce((sum, r) => sum + getReservationPrice(r, categories), 0);
    const dates = clientReservations.map(r => r.date).filter(Boolean).sort();

    return {
      total,
      checkedIn,
      cancelled,
      noShow,
      confirmed,
      revenue,
      checkedRevenue,
      averageRevenue: total ? Math.round(revenue / total) : 0,
      successRate: percent(checkedIn, total),
      firstVisit: dates[0] || '',
      lastVisit: dates[dates.length - 1] || '',
    };
  }, [clientReservations, categories]);

  const rating = draft.banned
    ? { label: '⛔ Zakázaný klient', text: 'obsluha má klienta prověřit před rezervací', border: 'rgba(255,80,80,.55)' }
    : draft.vip
      ? { label: '⭐ VIP klient', text: 'označený jako VIP', border: 'rgba(255,215,80,.65)' }
      : stats.noShow >= 2
        ? { label: '🔴 Rizikový klient', text: `${stats.noShow}× nedorazil`, border: 'rgba(255,80,80,.55)' }
        : stats.noShow === 1
          ? { label: '🟡 Pozor', text: '1× nedorazil', border: 'rgba(255,210,80,.55)' }
          : { label: '🟢 Spolehlivý klient', text: 'bez no-show záznamu', border: 'rgba(156,255,56,.45)' };

  function save() {
    const updated: Client = {
      ...draft,
      name: draft.name || reservation.name || '',
      email: normalizeEmail(draft.email || reservation.email),
      phone: normalizePhone(draft.phone || reservation.phone),
      updatedAt: new Date().toISOString(),
      createdAt: draft.createdAt || new Date().toISOString(),
    };

    setDraft(updated);
    onSaveClient(updated);
    setSaved('Uloženo');
    setTimeout(() => setSaved(''), 1600);
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
      }}
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="admin-card"
        style={{
          width: 'min(1080px, 100%)',
          maxHeight: '92vh',
          overflow: 'auto',
          border: `1px solid ${rating.border}`,
          boxShadow: '0 0 50px rgba(0,0,0,.55)',
        }}
      >
        <div className="section-title" style={{ marginTop: 0 }}>
          <div>
            <h2>👤 Karta klienta</h2>
            <p>{rating.label} · {rating.text}</p>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="small-btn" type="button" onClick={() => downloadClientCsv(draft, clientReservations, categories)}>
              Export historie CSV
            </button>
            <button className="small-btn" type="button" onClick={onClose}>
              Zavřít
            </button>
          </div>
        </div>

        <div className="stats stats-four" style={{ marginTop: 12 }}>
          <div className="stat"><p>Celkem rezervací</p><strong>{stats.total}</strong><small>úspěšnost {stats.successRate}</small></div>
          <div className="stat"><p>Odbaveno</p><strong>{stats.checkedIn}</strong><small>čeká {stats.confirmed}</small></div>
          <div className="stat"><p>Nedorazil / storno</p><strong>{stats.noShow} / {stats.cancelled}</strong><small>{rating.label}</small></div>
          <div className="stat"><p>Útrata odhad</p><strong>{stats.revenue.toLocaleString('cs-CZ')} Kč</strong><small>průměr {stats.averageRevenue.toLocaleString('cs-CZ')} Kč</small></div>
        </div>

        <div className="stats stats-four" style={{ marginTop: 12 }}>
          <div className="stat"><p>První návštěva</p><strong>{formatDate(stats.firstVisit)}</strong></div>
          <div className="stat"><p>Poslední návštěva</p><strong>{formatDate(stats.lastVisit)}</strong></div>
          <div className="stat"><p>Odbavená tržba</p><strong>{stats.checkedRevenue.toLocaleString('cs-CZ')} Kč</strong></div>
          <div className="stat"><p>Klient od</p><strong>{formatDateTimeCZ(draft.createdAt)}</strong></div>
        </div>

        <div className="admin-grid" style={{ marginTop: 16 }}>
          <div>
            <div className="section-title" style={{ marginTop: 0 }}>
              <div>
                <h2>Údaje klienta</h2>
                <p>ID klienta: {draft.id}</p>
              </div>
            </div>

            <div className="admin-settings">
              <div className="field">
                <label>Jméno</label>
                <input value={draft.name || ''} onChange={e => setDraft({ ...draft, name: e.target.value })} />
              </div>
              <div className="field">
                <label>Telefon</label>
                <input value={draft.phone || ''} onChange={e => setDraft({ ...draft, phone: e.target.value })} />
              </div>
              <div className="field">
                <label>E-mail</label>
                <input value={draft.email || ''} onChange={e => setDraft({ ...draft, email: e.target.value })} />
              </div>
              <div className="field">
                <label>VIP</label>
                <select value={draft.vip ? 'ano' : 'ne'} onChange={e => setDraft({ ...draft, vip: e.target.value === 'ano' })}>
                  <option value="ne">Ne</option>
                  <option value="ano">Ano</option>
                </select>
              </div>
              <div className="field">
                <label>Zakázaný klient</label>
                <select value={draft.banned ? 'ano' : 'ne'} onChange={e => setDraft({ ...draft, banned: e.target.value === 'ano' })}>
                  <option value="ne">Ne</option>
                  <option value="ano">Ano</option>
                </select>
              </div>
              <div className="field wide">
                <label>Interní poznámka ke klientovi</label>
                <textarea
                  rows={6}
                  value={draft.note || ''}
                  onChange={e => setDraft({ ...draft, note: e.target.value })}
                  placeholder="Např. VIP, levák, půjčuje Glock 17, platba fakturou, firemní zákazník..."
                />
              </div>
            </div>

            <button className="primary-btn" type="button" onClick={save} style={{ marginTop: 12 }}>
              {saved || 'Uložit kartu klienta'}
            </button>
          </div>

          <div>
            <div className="section-title" style={{ marginTop: 0 }}>
              <div>
                <h2>Aktuální rezervace</h2>
                <p>{reservation.id} · {statusLabel(reservation.status)}</p>
              </div>
            </div>

            <div className="summary-card">
              <p><strong>Datum:</strong> {formatDate(reservation.date)}</p>
              <p><strong>Čas:</strong> {reservation.time}–{reservation.endTime}</p>
              <p><strong>Kategorie:</strong> {reservation.categoryName}</p>
              <p><strong>Služba:</strong> {reservation.serviceName}</p>
              <p><strong>Cena:</strong> {getReservationPrice(reservation, categories).toLocaleString('cs-CZ')} Kč</p>
              <p><strong>Poznámka k rezervaci:</strong> {reservation.note || '-'}</p>
              <p><strong>Vytvořeno:</strong> {formatDateTimeCZ(reservation.createdAt)}</p>
              {reservation.checkedInAt && <p><strong>Odbaveno:</strong> {formatDateTimeCZ(reservation.checkedInAt)}</p>}
            </div>

            <div className="section-title" style={{ marginTop: 18 }}>
              <div>
                <h2>Historie klienta</h2>
                <p>{stats.total} rezervací · první {formatDate(stats.firstVisit)} · poslední {formatDate(stats.lastVisit)}</p>
              </div>
            </div>

            <div className="table-wrap" style={{ maxHeight: 380, overflow: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Datum</th>
                    <th>Čas</th>
                    <th>Služba</th>
                    <th>Stav</th>
                    <th>Cena</th>
                  </tr>
                </thead>
                <tbody>
                  {clientReservations.length === 0 && (
                    <tr><td colSpan={5}>Zatím žádná historie.</td></tr>
                  )}
                  {clientReservations.map(r => (
                    <tr key={r.id}>
                      <td>{formatDate(r.date)}</td>
                      <td>{r.time}–{r.endTime}</td>
                      <td>{r.serviceName}<br /><small>{r.id}</small>{r.note && <><br /><small>{r.note}</small></>}</td>
                      <td><strong>{statusMark(r.status)} {statusLabel(r.status)}</strong></td>
                      <td>{getReservationPrice(r, categories).toLocaleString('cs-CZ')} Kč</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
