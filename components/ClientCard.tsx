'use client';

import { useMemo, useState } from 'react';
import { X, User, CalendarDays, History, Save, Tag, BarChart3, ClipboardList, FileDown } from 'lucide-react';

type ReservationStatus = 'confirmed' | 'cancelled' | 'no_show' | 'checked_in';

type SubService = {
  id: string;
  name: string;
  duration: number;
  price: number;
  capacity: number;
  description: string;
  image?: string;
  detailImage?: string;
};

type Category = {
  id: string;
  name: string;
  description: string;
  image?: string;
  icon: 'target' | 'user' | 'shield' | 'users';
  services: SubService[];
};

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
  status?: ReservationStatus;
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

type Props = {
  reservation: Reservation;
  client: Client | null;
  reservations: Reservation[];
  categories: Category[];
  onClose: () => void;
  onSaveClient: (client: Client) => void;
};

function normEmail(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function normPhone(value: unknown) {
  return String(value || '').trim();
}

function statusLabel(status?: ReservationStatus) {
  if (status === 'checked_in') return 'Odbaveno';
  if (status === 'no_show') return 'Nedorazil';
  if (status === 'cancelled') return 'Storno';
  return 'Potvrzeno';
}

function statusColor(status?: ReservationStatus) {
  if (status === 'checked_in') return '#9cff38';
  if (status === 'no_show') return '#ff6b6b';
  if (status === 'cancelled') return '#ffae2b';
  return '#ffffff';
}

function formatDateCZ(value?: string) {
  if (!value) return '—';
  const [y, m, d] = String(value).split('-');
  if (!y || !m || !d) return value;
  return `${Number(d)}. ${Number(m)}. ${y}`;
}

function formatDateTimeCZ(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getReservationPrice(r: Reservation, categories: Category[]) {
  return categories.find(c => c.id === r.categoryId)?.services.find(s => s.id === r.serviceId)?.price || 0;
}

function money(value: number) {
  return `${Number(value || 0).toLocaleString('cs-CZ')} Kč`;
}

function csvCell(v: unknown) {
  return `"${String(v ?? '').replaceAll('"', '""')}"`;
}

export default function ClientCard({
  reservation,
  client,
  reservations,
  categories,
  onClose,
  onSaveClient,
}: Props) {
  const now = new Date().toISOString();

  const initialClient: Client =
    client || {
      id: `CL-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 99)}`,
      name: reservation.name || '',
      email: normEmail(reservation.email),
      phone: normPhone(reservation.phone),
      note: '',
      vip: false,
      banned: false,
      createdAt: now,
      updatedAt: now,
    };

  const [draft, setDraft] = useState<Client>({
    ...initialClient,
    note: initialClient.note || '',
    vip: !!initialClient.vip,
    banned: !!initialClient.banned,
  });

  const clientReservations = useMemo(() => {
    const email = normEmail(draft.email || reservation.email);
    const phone = normPhone(draft.phone || reservation.phone);

    return reservations
      .filter(r => {
        const sameEmail = email && normEmail(r.email) === email;
        const samePhone = phone && normPhone(r.phone) === phone;
        return sameEmail || samePhone;
      })
      .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  }, [reservations, draft.email, draft.phone, reservation.email, reservation.phone]);

  const stats = useMemo(() => {
    const total = clientReservations.length;
    const active = clientReservations.filter(r => (r.status || 'confirmed') === 'confirmed').length;
    const checked = clientReservations.filter(r => r.status === 'checked_in').length;
    const cancelled = clientReservations.filter(r => r.status === 'cancelled').length;
    const noShow = clientReservations.filter(r => r.status === 'no_show').length;
    const today = new Date().toISOString().slice(0, 10);
    const past = clientReservations.filter(r => String(r.date || '') < today).length;
    const totalSpent = clientReservations
      .filter(r => r.status !== 'cancelled')
      .reduce((sum, r) => sum + getReservationPrice(r, categories), 0);
    const maxSpent = clientReservations.reduce((max, r) => Math.max(max, getReservationPrice(r, categories)), 0);
    const avgSpent = total ? Math.round(totalSpent / total) : 0;
    const success = total ? Math.round((checked / total) * 1000) / 10 : 0;
    const dates = clientReservations.map(r => r.date).filter(Boolean).sort();

    return {
      total,
      active,
      checked,
      cancelled,
      noShow,
      past,
      totalSpent,
      maxSpent,
      avgSpent,
      success,
      firstVisit: dates[0],
      lastVisit: dates[dates.length - 1],
    };
  }, [clientReservations, categories]);

  const rating = useMemo(() => {
    if (draft.banned) return { label: 'Zakázaný klient', color: '#ff6b6b' };
    if (stats.noShow >= 2) return { label: 'Rizikový klient', color: '#ff6b6b' };
    if (stats.noShow === 1) return { label: 'Pozor – 1× nedorazil', color: '#ffae2b' };
    if (draft.vip) return { label: 'VIP klient', color: '#9cff38' };
    return { label: 'Spolehlivý klient', color: '#9cff38' };
  }, [draft.banned, draft.vip, stats.noShow]);

  const tags = useMemo(() => {
    const result = [];
    if (draft.vip) result.push('VIP');
    if (draft.banned) result.push('Zakázaný klient');
    const note = String(draft.note || '').toLowerCase();
    if (note.includes('levák')) result.push('Levák');
    if (note.includes('firem')) result.push('Firemní zákazník');
    if (note.includes('glock')) result.push('Glock');
    if (note.includes('faktur')) result.push('Platba fakturou');
    return result.length ? result : ['Bez štítků'];
  }, [draft.vip, draft.banned, draft.note]);

  function save() {
    onSaveClient({
      ...draft,
      name: draft.name.trim(),
      email: normEmail(draft.email),
      phone: normPhone(draft.phone),
      updatedAt: new Date().toISOString(),
    });
  }

  function exportClientCsv() {
    const lines = [
      ['Datum', 'Od', 'Do', 'Kategorie', 'Služba', 'Stav', 'Cena', 'ID', 'Poznámka'].map(csvCell).join(';'),
      ...clientReservations.map(r =>
        [
          r.date,
          r.time,
          r.endTime,
          r.categoryName,
          r.serviceName,
          statusLabel(r.status),
          getReservationPrice(r, categories),
          r.id,
          r.note || '',
        ].map(csvCell).join(';')
      ),
    ];
    const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `klient-${(draft.name || draft.email || draft.phone || 'export').replace(/[^a-zA-Z0-9_-]+/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="skis-client-overlay">
      <div className="skis-client-modal">
        <button type="button" className="skis-client-close" onClick={onClose} aria-label="Zavřít">
          <X size={20} />
        </button>

        <h2 className="skis-client-title">Karta klienta</h2>

        <div className="skis-client-grid">
          <section className="skis-client-card">
            <h3 className="skis-section-title"><User size={19} /> Údaje klienta</h3>
            <p className="skis-muted">ID klienta: {draft.id}</p>

            <div className="skis-fields-4">
              <Field label="Jméno">
                <input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
              </Field>
              <Field label="Telefon">
                <input value={draft.phone} onChange={e => setDraft({ ...draft, phone: e.target.value })} />
              </Field>
              <Field label="E-mail">
                <input value={draft.email} onChange={e => setDraft({ ...draft, email: e.target.value })} />
              </Field>
              <Field label="VIP">
                <select value={draft.vip ? 'yes' : 'no'} onChange={e => setDraft({ ...draft, vip: e.target.value === 'yes' })}>
                  <option value="no">Ne</option>
                  <option value="yes">Ano</option>
                </select>
              </Field>
            </div>

            <div className="skis-field-short">
              <Field label="Zakázaný klient">
                <select value={draft.banned ? 'yes' : 'no'} onChange={e => setDraft({ ...draft, banned: e.target.value === 'yes' })}>
                  <option value="no">Ne</option>
                  <option value="yes">Ano</option>
                </select>
              </Field>
            </div>

            <Field label="Interní poznámka ke klientovi">
              <textarea
                maxLength={300}
                value={draft.note || ''}
                onChange={e => setDraft({ ...draft, note: e.target.value })}
                placeholder="Zkušený střelec, levák, půjčuje Glock 17, platba fakturou, firemní zákazník..."
              />
            </Field>
            <div className="skis-counter">{String(draft.note || '').length} / 300</div>
          </section>

          <section className="skis-client-card">
            <h3 className="skis-section-title"><CalendarDays size={19} /> Aktuální rezervace <span className="skis-pill">1 / {Math.max(clientReservations.length, 1)}</span></h3>
            <DetailRow label="Datum" value={formatDateCZ(reservation.date)} />
            <DetailRow label="Čas" value={`${reservation.time} – ${reservation.endTime}`} />
            <DetailRow label="Kategorie" value={reservation.categoryName} />
            <DetailRow label="Služba" value={reservation.serviceName} />
            <DetailRow label="Cena" value={money(getReservationPrice(reservation, categories))} />
            <DetailRow label="Poznámka k rezervaci" value={reservation.note || '—'} />
            <DetailRow label="Vytvořeno" value={formatDateTimeCZ(reservation.createdAt)} />
          </section>

          <section className="skis-client-card">
            <h3 className="skis-section-title"><ClipboardList size={19} /> Souhrn rezervací</h3>
            <MiniTable rows={[
              ['Aktivní', stats.active, stats.checked],
              ['Minulých', stats.past, '—'],
              ['Storno', stats.cancelled, '—'],
              ['Nedorazil', stats.noShow, '—'],
              ['Celkem', stats.total, stats.checked],
              ['Úspěšnost', `${stats.success} %`, '—'],
            ]} />
          </section>

          <section className="skis-client-card">
            <h3 className="skis-section-title"><BarChart3 size={19} /> Statistiky klienta</h3>
            <DetailRow label="Hodnocení" value={rating.label} className="rating" style={{ color: rating.color }} />
            <DetailRow label="Počet návštěv" value={String(stats.total)} />
            <DetailRow label="První návštěva" value={formatDateCZ(stats.firstVisit)} />
            <DetailRow label="Poslední návštěva" value={formatDateCZ(stats.lastVisit)} />
            <DetailRow label="Celkem utratil" value={money(stats.totalSpent)} className="money" />
            <DetailRow label="Průměrná útrata" value={money(stats.avgSpent)} />
            <DetailRow label="Nejvíce utratil" value={money(stats.maxSpent)} />
            <DetailRow label="No-show" value={String(stats.noShow)} />
          </section>

          <section className="skis-client-card">
            <h3 className="skis-section-title"><Tag size={19} /> Poznámky & štítky</h3>
            <div className="skis-tags">
              {tags.map(t => <span key={t}>{t}</span>)}
            </div>
          </section>

          <section className="skis-client-card skis-history">
            <h3 className="skis-section-title"><History size={19} /> Historie klienta <small>{clientReservations.length} rezervací</small></h3>
            <div className="skis-history-table">
              <table>
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
                    <tr><td colSpan={5}>Zatím není žádná historie.</td></tr>
                  )}
                  {clientReservations.slice(0, 12).map(r => (
                    <tr key={r.id}>
                      <td>{formatDateCZ(r.date)}</td>
                      <td>{r.time} – {r.endTime}</td>
                      <td><strong>{r.serviceName}</strong><br /><small>{r.id}</small></td>
                      <td style={{ color: statusColor(r.status), fontWeight: 900 }}>{statusLabel(r.status)}</td>
                      <td>{money(getReservationPrice(r, categories))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" className="skis-secondary-btn" onClick={exportClientCsv}>
              <FileDown size={16} /> Export klienta CSV
            </button>
          </section>

          <section className="skis-client-card">
            <h3 className="skis-section-title">Akce</h3>
            <button type="button" className="skis-save-btn" onClick={save}>
              <Save size={17} /> Uložit změny
            </button>
          </section>
        </div>
      </div>

      <style jsx>{`
        .skis-client-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(0, 0, 0, .74);
          backdrop-filter: blur(6px);
          padding: 18px;
          overflow: auto;
        }

        .skis-client-modal {
          max-width: 1180px;
          margin: 18px auto;
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 18px;
          background: linear-gradient(135deg,#1d2020,#101313 55%,#0b0e0d);
          color: #fff;
          box-shadow: 0 20px 80px rgba(0,0,0,.62);
          padding: 22px;
          position: relative;
        }

        .skis-client-close {
          position: absolute;
          right: 14px;
          top: 14px;
          width: 38px;
          height: 38px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.12);
          background: rgba(255,255,255,.08);
          color: #fff;
          cursor: pointer;
          display: grid;
          place-items: center;
        }

        .skis-client-title {
          margin: 0 0 18px;
          font-size: 24px;
        }

        .skis-client-grid {
          display: grid;
          grid-template-columns: 1.45fr 1fr;
          gap: 14px;
        }

        .skis-client-card {
          border: 1px solid rgba(255,255,255,.11);
          border-radius: 13px;
          background: linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.025));
          padding: 16px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.04);
        }

        .skis-section-title {
          margin: 0 0 14px;
          display: flex;
          align-items: center;
          gap: 9px;
          font-size: 17px;
        }

        .skis-section-title svg {
          color: #9cff38;
        }

        .skis-section-title small {
          margin-left: auto;
          opacity: .75;
          font-size: 13px;
        }

        .skis-muted {
          opacity: .72;
          margin: 0 0 14px;
        }

        .skis-fields-4 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr .8fr;
          gap: 12px;
        }

        .skis-field-short {
          max-width: 260px;
          margin: 12px 0 14px;
        }

        label {
          display: block;
          font-weight: 800;
          font-size: 13px;
        }

        label span {
          display: block;
          margin-bottom: 7px;
        }

        input,
        select,
        textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid rgba(255,255,255,.14);
          border-radius: 9px;
          background: #151818;
          color: #fff;
          padding: 11px 12px;
          outline: none;
        }

        textarea {
          min-height: 86px;
          resize: vertical;
        }

        .skis-counter {
          text-align: right;
          opacity: .75;
          font-size: 12px;
          margin-top: 4px;
        }

        .skis-row {
          display: grid;
          grid-template-columns: 135px 1fr;
          gap: 12px;
          padding: 7px 0;
        }

        .skis-row .value {
          color: #fff;
        }

        .skis-row .value.money {
          color: #9cff38;
          font-weight: 900;
        }

        .skis-row .value.rating {
          font-weight: 900;
        }

        .skis-pill {
          margin-left: auto;
          background: rgba(156,255,56,.18);
          border: 1px solid rgba(156,255,56,.22);
          color: #d8ffbc;
          border-radius: 999px;
          padding: 5px 10px;
          font-size: 12px;
          font-weight: 900;
        }

        .skis-mini-table,
        .skis-history-table table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        th {
          text-align: left;
          padding: 8px 6px;
          font-weight: 900;
          color: rgba(255,255,255,.64);
          text-transform: uppercase;
          font-size: 11px;
        }

        td {
          padding: 10px 6px;
          vertical-align: top;
        }

        tr {
          border-top: 1px solid rgba(255,255,255,.08);
        }

        .skis-tags {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .skis-tags span {
          border: 1px solid rgba(156,255,56,.25);
          background: rgba(156,255,56,.13);
          color: #fff;
          border-radius: 9px;
          padding: 8px 12px;
          font-weight: 800;
          font-size: 13px;
        }

        .skis-history {
          grid-column: 2 / 3;
          grid-row: 2 / span 3;
        }

        .skis-history-table {
          overflow: auto;
          max-height: 505px;
        }

        .skis-save-btn,
        .skis-secondary-btn {
          border-radius: 9px;
          padding: 11px 14px;
          font-weight: 900;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .skis-save-btn {
          width: 100%;
          background: linear-gradient(90deg,#b8ff42,#83df32);
          color: #102000;
          border: 0;
          box-shadow: 0 12px 30px rgba(156,255,56,.22);
        }

        .skis-secondary-btn {
          width: 100%;
          margin-top: 14px;
          border: 1px solid rgba(255,255,255,.14);
          background: rgba(255,255,255,.05);
          color: #fff;
        }

        @media (max-width: 980px) {
          .skis-client-grid,
          .skis-fields-4 {
            grid-template-columns: 1fr;
          }

          .skis-history {
            grid-column: auto;
            grid-row: auto;
          }
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label>
      <span>{label}</span>
      {children}
    </label>
  );
}

function DetailRow({
  label,
  value,
  className,
  style,
}: {
  label: string;
  value: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className="skis-row">
      <strong>{label}:</strong>
      <span className={`value ${className || ''}`} style={style}>{value}</span>
    </div>
  );
}

function MiniTable({ rows }: { rows: Array<[string, string | number, string | number]> }) {
  return (
    <table className="skis-mini-table">
      <thead>
        <tr>
          <th>Typ</th>
          <th>Rezervací</th>
          <th>Odbaveno</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([a, b, c]) => (
          <tr key={a}>
            <td>{a}</td>
            <td>{b}</td>
            <td>{c}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
