'use client';

import { useMemo, useState } from 'react';
import { Camera, CheckCircle2, Clipboard, Search, ShieldCheck } from 'lucide-react';
import QrResultCard from './QrResultCard';

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
  onCheckIn: (reservation: Reservation) => void;
};

function normEmail(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function normPhone(value: unknown) {
  return String(value || '').trim();
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function findClient(reservation: Reservation | null, clients: Client[]) {
  if (!reservation) return null;
  const email = normEmail(reservation.email);
  const phone = normPhone(reservation.phone);
  return clients.find(c => {
    const sameEmail = email && normEmail(c.email) === email;
    const samePhone = phone && normPhone(c.phone) === phone;
    return sameEmail || samePhone;
  }) || null;
}

function clientHistory(client: Client | null, reservation: Reservation | null, reservations: Reservation[]) {
  if (!reservation) return [];
  const email = normEmail(client?.email || reservation.email);
  const phone = normPhone(client?.phone || reservation.phone);
  return reservations.filter(r => {
    const sameEmail = email && normEmail(r.email) === email;
    const samePhone = phone && normPhone(r.phone) === phone;
    return sameEmail || samePhone;
  });
}

function extractReservationId(input: string) {
  const raw = String(input || '').trim();
  if (!raw) return '';

  try {
    const url = new URL(raw);
    const idParam = url.searchParams.get('id') || url.searchParams.get('reservationId') || url.searchParams.get('reservation');
    if (idParam) return idParam.trim();
  } catch {}

  const idMatch = raw.match(/(?:id|reservationId|reservation)=([^&\s]+)/i);
  if (idMatch?.[1]) return decodeURIComponent(idMatch[1]).trim();

  const skMatch = raw.match(/SK[-_A-Z0-9]+/i);
  if (skMatch?.[0]) return skMatch[0].trim();

  return raw;
}

function validationFor(reservation: Reservation | null, client: Client | null) {
  if (!reservation) {
    return {
      level: 'danger' as const,
      title: 'Rezervace nenalezena',
      message: 'Zkontrolujte ID rezervace nebo celý QR odkaz.',
      canCheckIn: false,
    };
  }

  const status = reservation.status || 'confirmed';
  const today = todayIso();

  if (client?.banned) {
    return {
      level: 'danger' as const,
      title: 'Zakázaný klient',
      message: 'Klient je označen jako zakázaný. Odbavení nedoporučeno bez rozhodnutí obsluhy.',
      canCheckIn: false,
    };
  }

  if (status === 'checked_in') {
    return {
      level: 'warn' as const,
      title: 'Již odbaveno',
      message: 'Tato rezervace už byla odbavena. Zkontrolujte čas odbavení v kartě.',
      canCheckIn: false,
    };
  }

  if (status === 'cancelled') {
    return {
      level: 'danger' as const,
      title: 'Rezervace je stornovaná',
      message: 'Stornovanou rezervaci nelze odbavit.',
      canCheckIn: false,
    };
  }

  if (status === 'no_show') {
    return {
      level: 'danger' as const,
      title: 'Rezervace označená jako nedorazil',
      message: 'Rezervace má stav nedorazil. Nejdříve změňte stav v administraci, pokud je to chyba.',
      canCheckIn: false,
    };
  }

  if (reservation.date !== today) {
    return {
      level: 'warn' as const,
      title: 'Rezervace je na jiný den',
      message: `Termín rezervace je ${reservation.date}. Odbavení je blokováno kvůli kontrole dne.`,
      canCheckIn: false,
    };
  }

  return {
    level: 'ok' as const,
    title: 'Rezervace nalezena',
    message: 'Rezervace je platná pro dnešní den a je připravena k odbavení.',
    canCheckIn: true,
  };
}

export default function QrCheckIn({ reservations, clients, categories, onOpenClient, onCheckIn }: Props) {
  const [qrInput, setQrInput] = useState('');
  const [searchedId, setSearchedId] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const parsedId = useMemo(() => extractReservationId(qrInput), [qrInput]);

  const foundReservation = useMemo(() => {
    if (!searchedId) return null;
    const id = searchedId.toLowerCase();
    return reservations.find(r => String(r.id || '').trim().toLowerCase() === id) || null;
  }, [reservations, searchedId]);

  const foundClient = useMemo(() => findClient(foundReservation, clients), [foundReservation, clients]);
  const foundHistory = useMemo(() => clientHistory(foundClient, foundReservation, reservations), [foundClient, foundReservation, reservations]);
  const validation = useMemo(() => validationFor(foundReservation, foundClient), [foundReservation, foundClient]);

  function search() {
    const id = extractReservationId(qrInput);
    setSuccessMessage('');
    setSearchedId(id);
  }

  function clear() {
    setQrInput('');
    setSearchedId('');
    setSuccessMessage('');
  }

  function checkIn() {
    if (!foundReservation || !validation.canCheckIn) return;
    onCheckIn(foundReservation);
    setSuccessMessage(`Klient ${foundReservation.name} byl odbaven.`);
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      setQrInput(text);
      setSearchedId(extractReservationId(text));
      setSuccessMessage('');
    } catch {
      alert('Nepodařilo se načíst schránku. Vložte QR text ručně.');
    }
  }

  return (
    <div className="admin-card" style={{ marginTop: 16 }}>
      <div className="section-title" style={{ marginTop: 0 }}>
        <div>
          <h2><ShieldCheck size={18} /> QR Check-In</h2>
          <p>Vložte QR odkaz nebo ID rezervace. Kamera bude navazovat v další verzi.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>QR odkaz / ID rezervace</label>
          <input
            value={qrInput}
            onChange={e => setQrInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') search(); }}
            placeholder="Např. SK-123456 nebo https://.../check?id=SK-123456"
          />
          {qrInput.trim() && <small style={{ display: 'block', marginTop: 6, opacity: .72 }}>Rozpoznané ID: <strong>{parsedId || '—'}</strong></small>}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="small-btn" onClick={pasteFromClipboard}><Clipboard size={14} /> Vložit</button>
          <button type="button" className="small-btn" onClick={search}><Search size={14} /> Vyhledat</button>
          <button type="button" className="small-btn danger" onClick={clear}>Vyčistit</button>
        </div>
      </div>

      <div style={{ marginTop: 14, border: '1px dashed rgba(255,255,255,.16)', borderRadius: 14, padding: 14, background: 'rgba(255,255,255,.025)' }}>
        <h3 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}><Camera size={17} /> Kamera</h3>
        <p style={{ margin: 0, opacity: .75 }}>V této verzi je připraven QR Engine pro ruční vložení nebo USB čtečku. Kamera bude přidána jako v2.4.1 bez změny logiky odbavení.</p>
      </div>

      {successMessage && (
        <div style={{ marginTop: 14, border: '1px solid rgba(156,255,56,.28)', borderRadius: 12, padding: 12, color: '#9cff38', background: 'rgba(156,255,56,.08)', fontWeight: 900 }}>
          <CheckCircle2 size={16} /> {successMessage}
        </div>
      )}

      {searchedId && !foundReservation && (
        <div style={{ marginTop: 14, border: '1px solid rgba(255,107,107,.28)', borderRadius: 12, padding: 12, color: '#ff6b6b', background: 'rgba(255,107,107,.08)', fontWeight: 900 }}>
          Rezervace s ID „{searchedId}“ nebyla nalezena.
        </div>
      )}

      {foundReservation && (
        <div style={{ marginTop: 14 }}>
          <QrResultCard
            reservation={foundReservation}
            client={foundClient}
            clientReservations={foundHistory}
            categories={categories}
            validation={validation}
            onOpenClient={onOpenClient}
            onCheckIn={checkIn}
          />
        </div>
      )}
    </div>
  );
}
