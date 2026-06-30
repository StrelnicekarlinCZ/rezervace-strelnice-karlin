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

type Validation = {
  level: 'ok' | 'warn' | 'danger';
  title: string;
  message: string;
  canCheckIn: boolean;
};

type Props = {
  reservation: Reservation;
  client: Client | null;
  clientReservations: Reservation[];
  categories: Category[];
  validation: Validation;
  onOpenClient: (reservation: Reservation) => void;
  onCheckIn: (reservation: Reservation) => void;
};

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
  return '#fff';
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

export default function QrResultCard({
  reservation,
  client,
  clientReservations,
  categories,
  validation,
  onOpenClient,
  onCheckIn,
}: Props) {
  const noShows = clientReservations.filter(r => r.status === 'no_show').length;
  const visits = clientReservations.filter(r => r.status === 'checked_in').length;
  const status = reservation.status || 'confirmed';
  const validationColor = validation.level === 'danger' ? '#ff6b6b' : validation.level === 'warn' ? '#ffae2b' : '#9cff38';

  return (
    <div style={{ border: '1px solid rgba(255,255,255,.12)', borderRadius: 16, padding: 16, background: 'rgba(255,255,255,.04)' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
        {validation.level === 'ok' ? <CheckCircle2 size={22} color={validationColor} /> : <AlertTriangle size={22} color={validationColor} />}
        <div>
          <strong style={{ color: validationColor, fontSize: 18 }}>{validation.title}</strong>
          <p style={{ margin: '3px 0 0', opacity: .78 }}>{validation.message}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap: 14 }}>
        <section style={{ border: '1px solid rgba(255,255,255,.09)', borderRadius: 13, padding: 14, background: 'rgba(0,0,0,.18)' }}>
          <h3 style={{ margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 8 }}><User size={18} color="#9cff38" /> {reservation.name}</h3>
          <div style={{ display: 'grid', gap: 7 }}>
            <Info icon={<CalendarDays size={15} />} label="Termín" value={`${formatDateCZ(reservation.date)} · ${reservation.time}–${reservation.endTime}`} />
            <Info icon={<Clock size={15} />} label="Služba" value={`${reservation.categoryName} · ${reservation.serviceName}`} />
            <Info icon={<Phone size={15} />} label="Telefon" value={reservation.phone || '—'} />
            <Info icon={<Mail size={15} />} label="E-mail" value={reservation.email || '—'} />
            <Info icon={<CheckCircle2 size={15} />} label="Stav" value={statusLabel(status)} valueColor={statusColor(status)} />
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
            {client?.vip && <span style={pillStyle('#9cff38')}>VIP</span>}
            {client?.banned && <span style={pillStyle('#ff6b6b')}>ZÁKAZ</span>}
            {noShows > 0 && <span style={pillStyle(noShows >= 2 ? '#ff6b6b' : '#ffae2b')}>{noShows}× no-show</span>}
            <span style={pillStyle('#ffffff')}>{visits}× odbaveno</span>
          </div>
        </section>

        <section style={{ border: '1px solid rgba(255,255,255,.09)', borderRadius: 13, padding: 14, background: 'rgba(0,0,0,.18)' }}>
          <h3 style={{ margin: '0 0 10px' }}>Souhrn</h3>
          <Info label="ID rezervace" value={reservation.id} />
          <Info label="Cena" value={money(getReservationPrice(reservation, categories))} valueColor="#9cff38" />
          <Info label="Vytvořeno" value={formatDateTimeCZ(reservation.createdAt)} />
          <Info label="Odbaveno" value={formatDateTimeCZ(reservation.checkedInAt)} />

          <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
            <button type="button" className="primary-btn" disabled={!validation.canCheckIn} onClick={() => onCheckIn(reservation)} style={!validation.canCheckIn ? { opacity: .45, cursor: 'not-allowed' } : undefined}>
              <CheckCircle2 size={17} /> Odbavit
            </button>
            <button type="button" className="small-btn" onClick={() => onOpenClient(reservation)}>
              <User size={15} /> Otevřít kartu klienta
            </button>
          </div>
        </section>
      </div>

      {client?.banned && (
        <div style={{ marginTop: 12, color: '#ff6b6b', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8 }}>
          <XCircle size={16} /> Pozor: klient je označen jako zakázaný.
        </div>
      )}
    </div>
  );
}

function Info({ icon, label, value, valueColor }: { icon?: React.ReactNode; label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '115px 1fr', gap: 10, alignItems: 'center', borderTop: '1px solid rgba(255,255,255,.06)', paddingTop: 7 }}>
      <span style={{ opacity: .72, display: 'flex', alignItems: 'center', gap: 6 }}>{icon}{label}</span>
      <strong style={{ color: valueColor || '#fff' }}>{value}</strong>
    </div>
  );
}

function pillStyle(color: string): React.CSSProperties {
  return {
    border: `1px solid ${color === '#ffffff' ? 'rgba(255,255,255,.22)' : color}`,
    background: color === '#ffffff' ? 'rgba(255,255,255,.08)' : `${color}22`,
    color,
    borderRadius: 999,
    padding: '6px 10px',
    fontWeight: 900,
    fontSize: 12,
  };
}
