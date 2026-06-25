'use client';

import ReservationActions from './ReservationActions';

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

function formatDateTimeCZ(iso?: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function reservationStatusLabel(r: Reservation) {
  if (r.status === 'checked_in') return 'odbaveno';
  if (r.status === 'no_show') return 'nedorazil';
  if (r.status === 'cancelled') return 'storno';
  return 'potvrzeno';
}

export default function ReservationRow({
  reservation,
  onOpenClient,
  onConfirm,
  onCheckIn,
  onNoShow,
  onCancel,
  onDelete,
}: Props) {
  return (
    <tr>
      <td>
        <strong style={{ color: 'var(--green2)' }}>
          {reservation.time}–{reservation.endTime}
        </strong>
      </td>

      <td>
        {reservation.name}
        <br />
        <small>
          {reservation.id} · {reservationStatusLabel(reservation)}
        </small>
        {reservation.status === 'checked_in' && (
          <>
            <br />
            <small style={{ color: 'var(--green2)', fontWeight: 800 }}>
              ✓ Odbaveno
              {reservation.checkedInAt ? ` · ${formatDateTimeCZ(reservation.checkedInAt)}` : ''}
            </small>
          </>
        )}
      </td>

      <td>
        {reservation.categoryName}
        <br />
        <small>{reservation.serviceName}</small>
      </td>

      <td>
        {reservation.phone}
        <br />
        <small>{reservation.email}</small>
      </td>

      <td>
        <ReservationActions
          reservation={reservation}
          onOpenClient={onOpenClient}
          onConfirm={onConfirm}
          onCheckIn={onCheckIn}
          onNoShow={onNoShow}
          onCancel={onCancel}
          onDelete={onDelete}
        />
      </td>
    </tr>
  );
}
