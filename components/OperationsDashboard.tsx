'use client';

import { AlertTriangle, CalendarDays, CheckCircle2, Clock, Mail, Phone, User, XCircle } from 'lucide-react';

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
  reservations: Reservation[];
  clients: Client[];
  categories: Category[];
  onOpenClient: (reservation: Reservation) => void;
  onConfirm: (reservation: Reservation) => void;
  onCheckIn: (reservation: Reservation) => void;
  onNoShow: (reservation: Reservation) => void;
  onCancel: (reservation: Reservation) => void;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function timeToMinutes(value?: string) {
  const [h, m] = String(value || '00:00').split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return -1;
  return h * 60 + m;
}

function nowMinutes() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function normEmail(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function normPhone(value: unknown) {
  return String(value || '').trim();
}

function findClient(reservation: Reservation, clients: Client[]) {
  const email = normEmail(reservation.email);
  const phone = normPhone(reservation.phone);

  return clients.find(c => {
    const sameEmail = email && normEmail(c.email) === email;
    const samePhone = phone && normPhone(c.phone) === phone;
    return sameEmail || samePhone;
  }) || null;
}

function getClientReservations(client: Client | null, reservation: Reservation, reservations: Reservation[]) {
  const email = normEmail(client?.email || reservation.email);
  const phone = normPhone(client?.phone || reservation.phone);

  return reservations.filter(r => {
    const sameEmail = email && normEmail(r.email) === email;
    const samePhone = phone && normPhone(r.phone) === phone;
    return sameEmail || samePhone;
  });
}

function statusLabel(status?: ReservationStatus) {
  if (status === 'checked_in') return 'Odbaveno';
  if (status === 'no_show') return 'Nedorazil';
  if (status === 'cancelled') return 'Storno';
  return 'Čeká';
}

function statusColor(status?: ReservationStatus) {
  if (status === 'checked_in') return '#9cff38';
  if (status === 'no_show') return '#ff6b6b';
  if (status === 'cancelled') return '#ffae2b';
  return '#ffffff';
}

function getReservationPrice(r: Reservation, categories: Category[]) {
  return categories.find(c => c.id === r.categoryId)?.services.find(s => s.id === r.serviceId)?.price || 0;
}

function money(value: number) {
  return `${Number(value || 0).toLocaleString('cs-CZ')} Kč`;
}

export default function OperationsDashboard({
  reservations,
  clients,
  categories,
  onOpenClient,
  onConfirm,
  onCheckIn,
  onNoShow,
  onCancel,
}: Props) {
  const today = todayIso();
  const currentMinutes = nowMinutes();

  const todayReservations = reservations
    .filter(r => r.date === today)
    .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

  const waiting = todayReservations.filter(r => (r.status || 'confirmed') === 'confirmed');
  const checkedIn = todayReservations.filter(r => r.status === 'checked_in');
  const cancelled = todayReservations.filter(r => r.status === 'cancelled');
  const noShow = todayReservations.filter(r => r.status === 'no_show');
  const revenue = todayReservations
    .filter(r => r.status !== 'cancelled')
    .reduce((sum, r) => sum + getReservationPrice(r, categories), 0);

  const upcoming = todayReservations.filter(r => {
    const start = timeToMinutes(r.time);
    const status = r.status || 'confirmed';
    return status === 'confirmed' && start >= currentMinutes && start <= currentMinutes + 60;
  });

  const alerts = todayReservations.flatMap(r => {
    const client = findClient(r, clients);
    const history = getClientReservations(client, r, reservations);
    const clientNoShows = history.filter(x => x.status === 'no_show').length;
    const start = timeToMinutes(r.time);
    const minutesToStart = start - currentMinutes;
    const items: { id: string; label: string; reservation: Reservation; severity: 'ok' | 'warn' | 'danger' }[] = [];

    if (client?.banned) {
      items.push({ id: `${r.id}-banned`, label: `Zakázaný klient: ${r.name}`, reservation: r, severity: 'danger' });
    }
    if (clientNoShows >= 2) {
      items.push({ id: `${r.id}-risk`, label: `Rizikový klient ${r.name}: ${clientNoShows}× nedorazil`, reservation: r, severity: 'danger' });
    }
    if (client?.vip && minutesToStart >= 0 && minutesToStart <= 60) {
      items.push({ id: `${r.id}-vip`, label: `VIP přijede za ${minutesToStart} min: ${r.name}`, reservation: r, severity: 'ok' });
    }
    if (!normPhone(r.phone)) {
      items.push({ id: `${r.id}-phone`, label: `Chybí telefon: ${r.name}`, reservation: r, severity: 'warn' });
    }
    if (!normEmail(r.email)) {
      items.push({ id: `${r.id}-email`, label: `Chybí e-mail: ${r.name}`, reservation: r, severity: 'warn' });
    }

    return items;
  }).slice(0, 8);

  return (
    <div className="admin-card" style={{ marginTop: 16 }}>
      <div className="section-title" style={{ marginTop: 0 }}>
        <div>
          <h2><CalendarDays size={18} /> Denní provoz</h2>
          <p>Rychlý provozní panel pro dnešní rezervace, příjezdy, upozornění a odbavení.</p>
        </div>
      </div>

      <div className="stats stats-four">
        <div className="stat"><p>Dnes rezervací</p><strong>{todayReservations.length}</strong><small>čeká {waiting.length}</small></div>
        <div className="stat"><p>Odbaveno</p><strong>{checkedIn.length}</strong><small>nedorazil {noShow.length}</small></div>
        <div className="stat"><p>Storno</p><strong>{cancelled.length}</strong><small>aktivní {waiting.length}</small></div>
        <div className="stat"><p>Dnešní tržba odhad</p><strong>{money(revenue)}</strong><small>bez storen</small></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr .85fr', gap: 14, marginTop: 14 }}>
        <section style={{ border: '1px solid rgba(255,255,255,.1)', borderRadius: 14, padding: 14, background: 'rgba(255,255,255,.035)' }}>
          <h3 style={{ margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={17} /> Dnešní časová osa</h3>
          <div style={{ display: 'grid', gap: 8 }}>
            {todayReservations.length === 0 && <div className="notice">Dnes zatím není žádná rezervace.</div>}
            {todayReservations.map(r => {
              const client = findClient(r, clients);
              const status = r.status || 'confirmed';
              return (
                <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '78px 1fr auto', gap: 10, alignItems: 'center', borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 9 }}>
                  <strong style={{ color: '#9cff38' }}>{r.time}</strong>
                  <div>
                    <strong>{r.name}</strong>{client?.vip && <span style={{ marginLeft: 8, color: '#9cff38', fontWeight: 900 }}>VIP</span>}{client?.banned && <span style={{ marginLeft: 8, color: '#ff6b6b', fontWeight: 900 }}>ZÁKAZ</span>}<br />
                    <small>{r.serviceName} · <span style={{ color: statusColor(status), fontWeight: 900 }}>{statusLabel(status)}</span></small>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <button type="button" className="small-btn" onClick={() => onOpenClient(r)}><User size={14} /> Klient</button>
                    <button type="button" className="small-btn" style={{ background: 'var(--green2)', color: '#111' }} onClick={() => onCheckIn(r)}><CheckCircle2 size={14} /> Odbavit</button>
                    <button type="button" className="small-btn" onClick={() => onConfirm(r)}>OK</button>
                    <button type="button" className="small-btn danger" onClick={() => onNoShow(r)}><XCircle size={14} /> Nedorazil</button>
                    <button type="button" className="small-btn danger" onClick={() => onCancel(r)}>Storno</button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section style={{ display: 'grid', gap: 14 }}>
          <div style={{ border: '1px solid rgba(255,255,255,.1)', borderRadius: 14, padding: 14, background: 'rgba(255,255,255,.035)' }}>
            <h3 style={{ margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={17} /> Příštích 60 minut</h3>
            {upcoming.length === 0 && <div className="notice">V příští hodině nic nečeká.</div>}
            {upcoming.map(r => {
              const client = findClient(r, clients);
              return (
                <div key={r.id} style={{ borderTop: '1px solid rgba(255,255,255,.08)', padding: '9px 0' }}>
                  <strong>{r.time} · {r.name}</strong>{client?.vip && <span style={{ marginLeft: 8, color: '#9cff38', fontWeight: 900 }}>VIP</span>}<br />
                  <small>{r.serviceName}</small>
                </div>
              );
            })}
          </div>

          <div style={{ border: '1px solid rgba(255,255,255,.1)', borderRadius: 14, padding: 14, background: 'rgba(255,255,255,.035)' }}>
            <h3 style={{ margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}><AlertTriangle size={17} /> Upozornění</h3>
            {alerts.length === 0 && <div className="notice">Žádná důležitá upozornění pro dnešek.</div>}
            {alerts.map(a => (
              <button key={a.id} type="button" className="small-btn" onClick={() => onOpenClient(a.reservation)} style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 7, color: a.severity === 'danger' ? '#ff6b6b' : a.severity === 'warn' ? '#ffae2b' : '#9cff38' }}>
                <AlertTriangle size={14} /> {a.label}
              </button>
            ))}
          </div>

          <div style={{ border: '1px solid rgba(255,255,255,.1)', borderRadius: 14, padding: 14, background: 'rgba(255,255,255,.035)' }}>
            <h3 style={{ margin: '0 0 12px' }}>Rychlé kontakty</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {upcoming.slice(0, 3).map(r => (
                <div key={r.id} style={{ border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: 10, flex: '1 1 160px' }}>
                  <strong>{r.name}</strong><br />
                  <small><Phone size={12} /> {r.phone || 'bez telefonu'}</small><br />
                  <small><Mail size={12} /> {r.email || 'bez e-mailu'}</small>
                </div>
              ))}
              {upcoming.length === 0 && <small style={{ opacity: .75 }}>Kontakty se zobrazí podle nejbližších příjezdů.</small>}
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        @media (max-width: 980px) {
          div[style*="grid-template-columns: 1.15fr .85fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
