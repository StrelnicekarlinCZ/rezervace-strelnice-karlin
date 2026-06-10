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

export async function GET() {
  try {
    const data = await readAppData();
    return NextResponse.json({ ok: true, mode: dbEnabled() ? 'postgresql' : 'local', reservations: data?.reservations ?? [] });
  } catch (error: any) {
    console.error('RESERVATIONS_GET_ERROR', error);
    return NextResponse.json({ ok: false, message: error?.message || 'Reservation load failed', reservations: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const reservation = await request.json();
    const data = (await readAppData()) ?? { version: '1.27', settings: {}, categories: [], reservations: [], blocked: [] };
    const reservations = Array.isArray(data.reservations) ? data.reservations : [];
    const settings = data?.settings || {};
const maxActiveReservations = Number(settings?.maxActiveReservations || 0);

const reservationEmail = String(reservation?.email || '').trim().toLowerCase();
const reservationPhone = String(reservation?.phone || '').trim();

if (maxActiveReservations > 0 && (reservationEmail || reservationPhone)) {
  const today = new Date().toISOString().slice(0, 10);

const activeForContact = reservations.filter((r: any) => {
  const status = r?.status || 'confirmed';

  if (status !== 'confirmed') return false;
  if (String(r?.date || '') < today) return false;

  const sameEmail =
    reservationEmail &&
    String(r?.email || '').trim().toLowerCase() === reservationEmail;

  const samePhone =
    reservationPhone &&
    String(r?.phone || '').trim() === reservationPhone;

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
      return NextResponse.json({ ok: false, message: 'Termín je již obsazený.' }, { status: 409 });
    }
    const next = { ...data, version: '1.27', updatedAt: new Date().toISOString(), reservations: [reservation, ...reservations.filter((r: any) => r?.id !== reservation?.id)] };
    await writeAppData(next);
    return NextResponse.json({ ok: true, mode: dbEnabled() ? 'postgresql' : 'local', reservation, saved: dbEnabled() }, { status: 201 });
  } catch (error: any) {
    console.error('RESERVATIONS_POST_ERROR', error);
    return NextResponse.json({ ok: false, message: error?.message || 'Reservation save failed' }, { status: 500 });
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
      version: '1.27',
      settings: {},
      categories: [],
      reservations: [],
      blocked: [],
    };

    const reservations = Array.isArray(data.reservations) ? data.reservations : [];
    const nextReservations = reservations.filter((r: any) => r?.id !== id);

    const next = {
      ...data,
      version: '1.27',
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
