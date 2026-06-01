'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Copy, Search, ShieldCheck, Clock3 } from 'lucide-react';

type ReservationStatus = 'confirmed' | 'cancelled' | 'no_show' | 'checked_in';

type CheckInRecord = {
  reservationId: string;
  checkedInAt: string;
  clientName: string;
  serviceName: string;
};

type Reservation = {
  id: string;
  categoryName: string;
  serviceName: string;
  date: string;
  time: string;
  endTime: string;
  name: string;
  phone: string;
  email: string;
  status?: ReservationStatus;
  checkedInAt?: string;
};

type Settings = {
  qrInfo?: string;
  address?: string;
  rangeUrl?: string;
};

const formatDate = (iso: string) => iso?.split('-').reverse().join('.') || '';

function formatDateTime(iso?: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function CheckPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [history, setHistory] = useState<CheckInRecord[]>([]);
  const [settings, setSettings] = useState<Settings>({
    qrInfo: 'Obsluha ověří rezervaci a potvrdí příchod zákazníka.',
    address: 'Adresa střelnice'
  });
  const [manual, setManual] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    try {
      setReservations(JSON.parse(localStorage.getItem('cp_reservations') || '[]'));
    } catch {}

    try {
      setHistory(JSON.parse(localStorage.getItem('cp_checkin_history') || '[]'));
    } catch {}

    try {
      setSettings(s => ({
        ...s,
        ...JSON.parse(localStorage.getItem('cp_settings') || '{}')
      }));
    } catch {}
  }, []);

  const queryId =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('id') || ''
      : '';

  const id = manual.trim() || queryId;

  const reservation = useMemo(
    () => reservations.find(r => r.id === id),
    [reservations, id]
  );

  function copy() {
    navigator.clipboard?.writeText(id);
    setMessage('Číslo rezervace zkopírováno.');
    setTimeout(() => setMessage(''), 1400);
  }

  function checkIn() {
    if (!reservation) return;

    if (reservation.status === 'checked_in') {
      setMessage('Tato rezervace už byla odbavena.');
      return;
    }

    const checkedInAt = new Date().toISOString();

    const nextReservations = reservations.map(r =>
      r.id === reservation.id
        ? {
            ...r,
            status: 'checked_in' as const,
            checkedInAt
          }
        : r
    );

    const record: CheckInRecord = {
      reservationId: reservation.id,
      checkedInAt,
      clientName: reservation.name,
      serviceName: reservation.serviceName
    };

    const nextHistory = [record, ...history];

    setReservations(nextReservations);
    setHistory(nextHistory);

    localStorage.setItem('cp_reservations', JSON.stringify(nextReservations));
    localStorage.setItem('cp_checkin_history', JSON.stringify(nextHistory));

    setMessage('Příchod potvrzen. Rezervace je označená jako odbavená.');
  }

  return (
    <main className="check-shell">
      <section className="check-card">
        <div className="check-logo">
          <ShieldCheck size={34} />
        </div>

        <p className="brand-kicker">STŘELNICE KARLÍN</p>
        <h1>Kontrola rezervace</h1>
        <p className="check-muted">{settings.qrInfo}</p>

        <div className="field">
          <label>Číslo rezervace</label>

          <div className="check-input-row">
            <input
              value={id}
              onChange={e => setManual(e.target.value)}
              placeholder="např. SK-123456"
            />

            <button onClick={copy}>
              <Copy size={16} />
            </button>
          </div>
        </div>

        {!reservation && (
          <div className="notice">
            <Search size={16} />
            Rezervace zatím nebyla nalezena v tomto zařízení. V ostré verzi se
            bude ověřovat centrálně ze serverové databáze.
          </div>
        )}

        {reservation && (
          <div className="check-result">
            <strong>{reservation.serviceName}</strong>
            <p>{reservation.categoryName}</p>

            <div className="check-grid">
              <span>Termín</span>
              <b>
                {formatDate(reservation.date)} · {reservation.time}–
                {reservation.endTime}
              </b>

              <span>Zákazník</span>
              <b>{reservation.name}</b>

              <span>Kontakt</span>
              <b>
                {reservation.phone}
                <br />
                {reservation.email}
              </b>

              <span>Stav</span>
              <b>
                {reservation.status === 'checked_in'
                  ? 'Odbaveno'
                  : reservation.status === 'cancelled'
                    ? 'Storno'
                    : reservation.status === 'no_show'
                      ? 'Nedorazil'
                      : 'Potvrzeno'}
              </b>

              {reservation.checkedInAt && (
                <>
                  <span>Odbaveno</span>
                  <b>{formatDateTime(reservation.checkedInAt)}</b>
                </>
              )}
            </div>

            <button
              className="primary-btn"
              onClick={checkIn}
              disabled={reservation.status === 'checked_in'}
            >
              <CheckCircle2 size={18} />
              {reservation.status === 'checked_in'
                ? 'Příchod už potvrzen'
                : 'Potvrdit příchod'}
            </button>
          </div>
        )}

        {history.length > 0 && (
          <div className="check-history">
            <h2>
              <Clock3 size={18} />
              Historie check-inů
            </h2>

            {history.slice(0, 5).map(item => (
              <div className="history-row" key={`${item.reservationId}-${item.checkedInAt}`}>
                <b>{item.clientName}</b>
                <span>{item.serviceName}</span>
                <small>
                  {item.reservationId} · {formatDateTime(item.checkedInAt)}
                </small>
              </div>
            ))}
          </div>
        )}

        {message && <div className="mail-note">{message}</div>}

        <a className="secondary-btn" href="/">
          Zpět do aplikace
        </a>
      </section>
    </main>
  );
}
