import type { Reservation } from '../types/skis';
import { overlaps } from './skisTime';

export function hasReservationConflict(reservations: Reservation[], reservation: Reservation) {
  return reservations.some(r =>
    r?.id !== reservation?.id &&
    r?.status !== 'cancelled' &&
    r?.date === reservation?.date &&
    r?.serviceId === reservation?.serviceId &&
    overlaps(r?.time, r?.endTime, reservation?.time, reservation?.endTime)
  );
}
