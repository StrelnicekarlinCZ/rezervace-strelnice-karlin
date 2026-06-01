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
    update: { value }
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = body?.id;

    if (!id) {
      return NextResponse.json(
        { ok: false, message: 'Chybí číslo rezervace.' },
        { status: 400 }
      );
    }

    const data = await readAppData();

    if (!data || !Array.isArray(data.reservations)) {
      return NextResponse.json(
        { ok: false, message: 'Rezervace nejsou dostupné.' },
        { status: 404 }
      );
    }

    const checkedInAt = new Date().toISOString();

    let found = false;

    const reservations = data.reservations.map((r: any) => {
      if (r?.id !== id) return r;

      found = true;

      return {
        ...r,
        status: 'checked_in',
        checkedInAt
      };
    });

    if (!found) {
      return NextResponse.json(
        { ok: false, message: 'Rezervace nebyla nalezena.' },
        { status: 404 }
      );
    }

    const nextData = {
      ...data,
      version: data.version || '1.27',
      updatedAt: new Date().toISOString(),
      reservations
    };

    await writeAppData(nextData);

    return NextResponse.json({
      ok: true,
      reservation: reservations.find((r: any) => r?.id === id)
    });
  } catch (error: any) {
    console.error('CHECK_IN_ERROR', error);
    return NextResponse.json(
      { ok: false, message: error?.message || 'Check-in failed' },
      { status: 500 }
    );
  }
}
