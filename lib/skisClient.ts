import type { Client, Reservation } from '../types/skis';

export function normalizeEmail(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

export function normalizePhone(value: unknown) {
  return String(value || '').trim();
}

export function upsertClientFromReservation(clients: Client[], reservation: Reservation): Client[] {
  const now = new Date().toISOString();
  const email = normalizeEmail(reservation?.email);
  const phone = normalizePhone(reservation?.phone);
  const name = String(reservation?.name || '').trim();

  if (!email && !phone) return clients;

  const existingIndex = clients.findIndex(c => {
    const sameEmail = email && normalizeEmail(c?.email) === email;
    const samePhone = phone && normalizePhone(c?.phone) === phone;
    return Boolean(sameEmail || samePhone);
  });

  if (existingIndex >= 0) {
    return clients.map((c, i) =>
      i === existingIndex
        ? {
            ...c,
            name: name || c?.name || '',
            email: email || c?.email || '',
            phone: phone || c?.phone || '',
            updatedAt: now,
          }
        : c
    );
  }

  return [
    {
      id: `CL-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 99)}`,
      name,
      email,
      phone,
      note: '',
      vip: false,
      banned: false,
      createdAt: now,
      updatedAt: now,
    },
    ...clients,
  ];
}
