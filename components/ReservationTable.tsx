'use client';

import ReservationRow from './ReservationRow';

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
  reservations: Reservation[];
  hasDayReservations: boolean;
  onOpenClient: (reservation: Reservation) => void;
  onConfirm: (reservation: Reservation) => void;
  onCheckIn: (reservation: Reservation) => void;
  onNoShow: (reservation: Reservation) => void;
  onCancel: (reservation: Reservation) => void;
  onDelete: (reservation: Reservation) => void;
};

export default function ReservationTable({
  reservations,
  hasDayReservations,
  onOpenClient,
  onConfirm,
  onCheckIn,
  onNoShow,
  onCancel,
  onDelete,
}: Props) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Čas</th>
            <th>Jméno</th>
            <th>Služba</th>
            <th>Kontakt</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {reservations.length === 0 && (
            <tr>
              <td colSpan={5}>
                {!hasDayReservations
                  ? 'Pro tento den zatím není žádná rezervace.'
                  : 'Filtru neodpovídá žádná rezervace.'}
              </td>
            </tr>
          )}

          {reservations.map((reservation) => (
            <ReservationRow
              key={reservation.id}
              reservation={reservation}
              onOpenClient={onOpenClient}
              onConfirm={onConfirm}
              onCheckIn={onCheckIn}
              onNoShow={onNoShow}
              onCancel={onCancel}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
