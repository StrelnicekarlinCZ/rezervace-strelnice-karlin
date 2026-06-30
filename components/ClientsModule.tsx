use client';

import { useMemo, useState } from 'react';
import { Search, Users, Star, AlertTriangle, Ban, Download, Eye, Database } from 'lucide-react';

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
  clients: Client[];
  reservations: Reservation[];
  categories: Category[];
  onOpenClient: (client: Client) => void;
};

type ClientWithStats = Client & {
  reservationCount: number;
  checkedIn: number;
  cancelled: number;
  noShow: number;
  confirmed: number;
  totalSpent: number;
  lastVisit?: string;
  firstVisit?: string;
  risk: 'ok' | 'watch' | 'risk' | 'banned';
};

function normEmail(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function normPhone(value: unknown) {
  return String(value || '').trim();
}

function getReservationPrice(r: Reservation, categories: Category[]) {
  return categories.find(c => c.id === r.categoryId)?.services.find(s => s.id === r.serviceId)?.price || 0;
}

function formatDateCZ(value?: string) {
  if (!value) return '—';
  const [y, m, d] = String(value).split('-');
  if (!y || !m || !d) return value;
  return `${Number(d)}. ${Number(m)}. ${y}`;
}

function money(value: number) {
  return `${Number(value || 0).toLocaleString('cs-CZ')} Kč`;
}

function csvCell(v: unknown) {
  return `"${String(v ?? '').replaceAll('"', '""')}"`;
}

function clientKey(client: Pick<Client, 'email' | 'phone' | 'id'>) {
  const email = normEmail(client.email);
  const phone = normPhone(client.phone);
  return email || phone || client.id;
}

function matchesClient(r: Reservation, client: Client) {
  const email = normEmail(client.email);
  const phone = normPhone(client.phone);
  return Boolean((email && normEmail(r.email) === email) || (phone && normPhone(r.phone) === phone));
}

function buildVirtualClients(clients: Client[], reservations: Reservation[]) {
  const map = new Map<string, Client>();

  for (const c of clients) {
    map.set(clientKey(c), c);
  }

  for (const r of reservations) {
    const email = normEmail(r.email);
    const phone = normPhone(r.phone);
    const key = email || phone;
    if (!key || map.has(key)) continue;

    map.set(key, {
      id: `AUTO-${key.replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 36)}`,
      name: r.name || '',
      email,
      phone,
      note: '',
      vip: false,
      banned: false,
      createdAt: r.createdAt || new Date().toISOString(),
      updatedAt: r.createdAt || new Date().toISOString(),
    });
  }

  return Array.from(map.values());
}

function enrichClient(client: Client, reservations: Reservation[], categories: Category[]): ClientWithStats {
  const list = reservations.filter(r => matchesClient(r, client));
  const sortedDates = list.map(r => r.date).filter(Boolean).sort();
  const noShow = list.filter(r => r.status === 'no_show').length;
  const checkedIn = list.filter(r => r.status === 'checked_in').length;
  const cancelled = list.filter(r => r.status === 'cancelled').length;
  const confirmed = list.filter(r => (r.status || 'confirmed') === 'confirmed').length;
  const totalSpent = list
    .filter(r => r.status !== 'cancelled')
    .reduce((sum, r) => sum + getReservationPrice(r, categories), 0);
  const risk: ClientWithStats['risk'] = client.banned ? 'banned' : noShow >= 2 ? 'risk' : noShow === 1 ? 'watch' : 'ok';

  return {
    ...client,
    reservationCount: list.length,
    checkedIn,
    cancelled,
    noShow,
    confirmed,
    totalSpent,
    firstVisit: sortedDates[0],
    lastVisit: sortedDates[sortedDates.length - 1],
    risk,
  };
}

function riskLabel(client: ClientWithStats) {
  if (client.risk === 'banned') return 'Zakázaný';
  if (client.risk === 'risk') return 'Rizikový';
  if (client.risk === 'watch') return 'Pozor';
  return 'OK';
}

function riskStyle(client: ClientWithStats) {
  if (client.risk === 'banned' || client.risk === 'risk') return { color: '#ff6b6b', fontWeight: 900 };
  if (client.risk === 'watch') return { color: '#ffae2b', fontWeight: 900 };
  return { color: '#9cff38', fontWeight: 900 };
}

export default function ClientsModule({ clients, reservations, categories, onOpenClient }: Props) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'vip' | 'risk' | 'banned' | 'no_reservations'>('all');

  const enrichedClients = useMemo(() => {
    return buildVirtualClients(clients, reservations)
      .map(c => enrichClient(c, reservations, categories))
      .sort((a, b) => {
        const byLast = String(b.lastVisit || '').localeCompare(String(a.lastVisit || ''));
        if (byLast !== 0) return byLast;
        return String(a.name || '').localeCompare(String(b.name || ''), 'cs');
      });
  }, [clients, reservations, categories]);

  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase();

    return enrichedClients.filter(c => {
      if (filter === 'vip' && !c.vip) return false;
      if (filter === 'risk' && !(c.risk === 'risk' || c.risk === 'watch')) return false;
      if (filter === 'banned' && !c.banned) return false;
      if (filter === 'no_reservations' && c.reservationCount !== 0) return false;

      if (!q) return true;

      return (
        String(c.name || '').toLowerCase().includes(q) ||
        String(c.email || '').toLowerCase().includes(q) ||
        String(c.phone || '').toLowerCase().includes(q) ||
        String(c.id || '').toLowerCase().includes(q) ||
        String(c.note || '').toLowerCase().includes(q)
      );
    });
  }, [enrichedClients, query, filter]);

  const summary = useMemo(() => {
    const total = enrichedClients.length;
    const vip = enrichedClients.filter(c => c.vip).length;
    const banned = enrichedClients.filter(c => c.banned).length;
    const risk = enrichedClients.filter(c => c.risk === 'risk' || c.risk === 'watch').length;
    const totalSpent = enrichedClients.reduce((sum, c) => sum + c.totalSpent, 0);
    const avgSpent = total ? Math.round(totalSpent / total) : 0;
    const top = [...enrichedClients].sort((a, b) => b.totalSpent - a.totalSpent)[0];
    const currentMonth = new Date().toISOString().slice(0, 7);
    const newThisMonth = enrichedClients.filter(c => String(c.createdAt || '').slice(0, 7) === currentMonth).length;

    return { total, vip, banned, risk, totalSpent, avgSpent, top, newThisMonth };
  }, [enrichedClients]);

  function exportCsv() {
    const lines = [
      ['Jméno', 'Telefon', 'Email', 'VIP', 'Zakázaný', 'Rezervací', 'Odbaveno', 'Storno', 'Nedorazil', 'Poslední návštěva', 'Útrata', 'Hodnocení', 'Poznámka'].map(csvCell).join(';'),
      ...filteredClients.map(c => [
        c.name,
        c.phone,
        c.email,
        c.vip ? 'ano' : 'ne',
        c.banned ? 'ano' : 'ne',
        c.reservationCount,
        c.checkedIn,
        c.cancelled,
        c.noShow,
        c.lastVisit || '',
        c.totalSpent,
        riskLabel(c),
        c.note || '',
      ].map(csvCell).join(';')),
    ];

    const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'skis-klienti-export.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(filteredClients, null, 2)], { type: 'application/json;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'skis-klienti-export.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="admin-card" style={{ marginTop: 16 }}>
      <div className="section-title" style={{ marginTop: 0 }}>
        <div>
          <h2><Users size={18} /> Klienti</h2>
          <p>CRM přehled klientů, historie, útrata, VIP a rizikovost podle rezervací.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="small-btn" onClick={exportCsv}><Download size={14} /> CSV</button>
          <button type="button" className="small-btn" onClick={exportJson}><Database size={14} /> JSON</button>
        </div>
      </div>

      <div className="stats stats-four" style={{ marginTop: 12 }}>
        <div className="stat"><p>Klientů celkem</p><strong>{summary.total}</strong><small>z databáze i rezervací</small></div>
        <div className="stat"><p>VIP / Rizikoví</p><strong>{summary.vip} / {summary.risk}</strong><small>zakázaní {summary.banned}</small></div>
        <div className="stat"><p>Noví tento měsíc</p><strong>{summary.newThisMonth}</strong><small>podle data založení</small></div>
        <div className="stat"><p>Průměrná útrata</p><strong>{money(summary.avgSpent)}</strong><small>TOP: {summary.top?.name || '—'}</small></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr .8fr', gap: 12, marginTop: 16 }}>
        <div className="field" style={{ margin: 0 }}>
          <label><Search size={14} /> Vyhledat klienta</label>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Jméno, e-mail, telefon, ID nebo poznámka"
          />
        </div>

        <div className="field" style={{ margin: 0 }}>
          <label>Filtr</label>
          <select value={filter} onChange={e => setFilter(e.target.value as any)}>
            <option value="all">Všichni klienti</option>
            <option value="vip">VIP</option>
            <option value="risk">Rizikoví / pozor</option>
            <option value="banned">Zakázaní</option>
            <option value="no_reservations">Bez rezervace</option>
          </select>
        </div>
      </div>

      <div className="notice" style={{ marginTop: 12 }}>
        Zobrazeno {filteredClients.length} z {enrichedClients.length} klientů. Klienti bez samostatného záznamu se dočasně dopočítají z rezervací.
      </div>

      <div className="table-wrap" style={{ marginTop: 14 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Klient</th>
              <th>Kontakt</th>
              <th>Rezervace</th>
              <th>Poslední návštěva</th>
              <th>Útrata</th>
              <th>Stav</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length === 0 && (
              <tr><td colSpan={7}>Žádný klient neodpovídá filtru.</td></tr>
            )}
            {filteredClients.map(c => (
              <tr key={c.id}>
                <td>
                  <strong>{c.name || 'Bez jména'}</strong><br />
                  <small>{c.id}</small>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                    {c.vip && <Badge icon={<Star size={12} />} text="VIP" />}
                    {c.banned && <Badge icon={<Ban size={12} />} text="Zakázaný" danger />}
                    {(c.risk === 'risk' || c.risk === 'watch') && <Badge icon={<AlertTriangle size={12} />} text={riskLabel(c)} warning />}
                  </div>
                </td>
                <td>{c.phone || '—'}<br /><small>{c.email || '—'}</small></td>
                <td>
                  <strong>{c.reservationCount}</strong><br />
                  <small>odbaveno {c.checkedIn} · storno {c.cancelled} · no-show {c.noShow}</small>
                </td>
                <td>{formatDateCZ(c.lastVisit)}<br /><small>první {formatDateCZ(c.firstVisit)}</small></td>
                <td><strong style={{ color: '#9cff38' }}>{money(c.totalSpent)}</strong></td>
                <td style={riskStyle(c)}>{riskLabel(c)}</td>
                <td>
                  <button type="button" className="small-btn" onClick={() => onOpenClient(c)}>
                    <Eye size={14} /> Karta
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Badge({ icon, text, danger, warning }: { icon: React.ReactNode; text: string; danger?: boolean; warning?: boolean }) {
  const border = danger ? 'rgba(255,107,107,.35)' : warning ? 'rgba(255,174,43,.35)' : 'rgba(156,255,56,.28)';
  const bg = danger ? 'rgba(255,107,107,.12)' : warning ? 'rgba(255,174,43,.12)' : 'rgba(156,255,56,.12)';
  return (
    <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center', border: `1px solid ${border}`, background: bg, borderRadius: 999, padding: '4px 8px', fontSize: 12, fontWeight: 900 }}>
      {icon}{text}
    </span>
  );
}
