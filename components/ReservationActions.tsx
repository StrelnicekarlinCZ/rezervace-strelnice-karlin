'use client';

import { Trash2 } from 'lucide-react';

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

type Props = {
  reservation: Reservation;
  onOpenClient: (reservation: Reservation) => void;
  onConfirm: (reservation: Reservation) => void;
  onCheckIn: (reservation: Reservation) => void;
  onNoShow: (reservation: Reservation) => void;
  onCancel: (reservation: Reservation) => void;
  onDelete: (reservation: Reservation) => void;
};

export default function ReservationActions({
  reservation,
  onOpenClient,
  onConfirm,
  onCheckIn,
  onNoShow,
  onCancel,
  onDelete,
}: Props) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button className="small-btn" onClick={() => onOpenClient(reservation)}>
        Klient
      </button>

      <button className="small-btn" onClick={() => onConfirm(reservation)}>
        OK
      </button>

      <button
        className="small-btn"
        style={{ background: 'var(--green2)', color: '#111' }}
        onClick={() => onCheckIn(reservation)}
      >
        Odbaveno
      </button>

      <button className="small-btn danger" onClick={() => onNoShow(reservation)}>
        Nedorazil
      </button>

      <button className="small-btn danger" onClick={() => onCancel(reservation)}>
        Storno
      </button>

      <button className="small-btn danger" onClick={() => onDelete(reservation)}>
        <Trash2 size={14} />
      </button>
    </div>
  );
}
