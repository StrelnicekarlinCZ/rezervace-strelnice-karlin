import { NextResponse } from 'next/server';
import { dbEnabled, prisma } from '../../../lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const APP_DATA_KEY = 'appData';

async function readAppData(): Promise<any> {
  if (!dbEnabled()) return null;
  const row = await prisma.appSetting.findUnique({ where: { key: APP_DATA_KEY } });
  return row?.value ?? null;
}

async function writeAppData(value: any) {
  if (!dbEnabled()) return null;
  return prisma.appSetting.upsert({
    where: { key: APP_DATA_KEY },
    create: { key: APP_DATA_KEY, value },
    update: { value },
  });
}

function timeToMinutes(time: string) {
  const [h, m] = String(time || '00:00').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return timeToMinutes(aStart) < timeToMinutes(bEnd) && timeToMinutes(bStart) < timeToMinutes(aEnd);
}

function normalizeEmail(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function normalizePhone(value: unknown) {
  return String(value || '').trim();
}

function upsertClientFromReservation(clients: any[], reservation: any) {
  const now = new Date().toISOString();

  const email = normalizeEmail(reservation?.email);
  const phone = normalizePhone(reservation?.phone);
  const name = String(reservation?.name || '').trim();

  if (!email && !phone) return clients;

  const existingIndex = clients.findIndex((c: any) => {
    const sameEmail = email && normalizeEmail(c?.email) === email;
    const samePhone = phone && normalizePhone(c?.phone) === phone;
    return sameEmail || samePhone;
  });

  if (existingIndex >= 0) {
    return clients.map((c: any, i: number) =>
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

export async function GET() {
  try {
    const data = await readAppData();

    return NextResponse.json({
      ok: true,
      mode: dbEnabled() ? 'postgresql' : 'local',
      reservations: data?.reservations ?? [],
    });
  } catch (error: any) {
    console.error('RESERVATIONS_GET_ERROR', error);

    return NextResponse.json(
      {
        ok: false,
        message: error?.message || 'Reservation load failed',
        reservations: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const reservation = await request.json();

    const data = (await readAppData()) ?? {
      version: '1.28',
      settings: {},
      categories: [],
      reservations: [],
      clients: [],
      blocked: [],
    };

    const reservations = Array.isArray(data.reservations) ? data.reservations : [];
    const clients = Array.isArray(data.clients) ? data.clients : [];
    const settings = data?.settings || {};

    const maxActiveReservations = Number(settings?.maxActiveReservations || 0);

    const reservationEmail = normalizeEmail(reservation?.email);
    const reservationPhone = normalizePhone(reservation?.phone);

    if (maxActiveReservations > 0 && (reservationEmail || reservationPhone)) {
      const today = new Date().toISOString().slice(0, 10);

      const activeForContact = reservations.filter((r: any) => {
        const status = r?.status || 'confirmed';

        if (status !== 'confirmed') return false;
        if (String(r?.date || '') < today) return false;

        const sameEmail =
          reservationEmail &&
          normalizeEmail(r?.email) === reservationEmail;

        const samePhone =
          reservationPhone &&
          normalizePhone(r?.phone) === reservationPhone;

        return sameEmail || samePhone;
      });

      if (activeForContact.length >= maxActiveReservations) {
        return NextResponse.json(
          {
            ok: false,
            message: `Na tento kontakt už existuje maximální počet aktivních rezervací (${maxActiveReservations}).`,
          },
          { status: 409 }
        );
      }
    }

    const conflict = reservations.some((r: any) =>
      r?.status !== 'cancelled' &&
      r?.date === reservation?.date &&
      r?.serviceId === reservation?.serviceId &&
      overlaps(r?.time, r?.endTime, reservation?.time, reservation?.endTime)
    );

    if (conflict) {
      return NextResponse.json(
        { ok: false, message: 'Termín je již obsazený.' },
        { status: 409 }
      );
    }

    const nextReservations = [
      reservation,
      ...reservations.filter((r: any) => r?.id !== reservation?.id),
    ];

    const nextClients = upsertClientFromReservation(clients, reservation);

    const next = {
      ...data,
      version: '1.28',
      updatedAt: new Date().toISOString(),
      reservations: nextReservations,
      clients: nextClients,
    };

    await writeAppData(next);

    return NextResponse.json(
      {
        ok: true,
        mode: dbEnabled() ? 'postgresql' : 'local',
        reservation,
        clientCount: nextClients.length,
        saved: dbEnabled(),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('RESERVATIONS_POST_ERROR', error);

    return NextResponse.json(
      { ok: false, message: error?.message || 'Reservation save failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { ok: false, message: 'Missing reservation id.' },
        { status: 400 }
      );
    }

    const data = (await readAppData()) ?? {
      version: '1.28',
      settings: {},
      categories: [],
      reservations: [],
      clients: [],
      blocked: [],
    };

    const reservations = Array.isArray(data.reservations) ? data.reservations : [];
    const nextReservations = reservations.filter((r: any) => r?.id !== id);

    const next = {
      ...data,
      version: '1.28',
      updatedAt: new Date().toISOString(),
      reservations: nextReservations,
    };

    await writeAppData(next);

    return NextResponse.json({
      ok: true,
      deletedId: id,
      remaining: nextReservations.length,
    });
  } catch (error: any) {
    console.error('RESERVATIONS_DELETE_ERROR', error);

    return NextResponse.json(
      { ok: false, message: error?.message || 'Reservation delete failed' },
      { status: 500 }
    );
  }
}
