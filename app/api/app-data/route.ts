import { NextResponse } from 'next/server';
import { dbEnabled, prisma } from '../../../lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const APP_DATA_KEY = 'appData';

async function readAppData() {
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

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (token !== process.env.APP_DATA_TOKEN) {
      return NextResponse.json(
        { ok: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await readAppData();
    return NextResponse.json({
      ok: true,
      mode: dbEnabled() ? 'postgresql' : 'local',
      data
    });
  } catch (error: any) {
    console.error('APP_DATA_GET_ERROR', error);
    return NextResponse.json(
      {
        ok: false,
        mode: 'error',
        message: error?.message || 'DB load failed',
        data: null
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const value = {
      version: '1.28',
      updatedAt: new Date().toISOString(),
      settings: body?.settings ?? {},
      categories: Array.isArray(body?.categories) ? body.categories : [],
      reservations: Array.isArray(body?.reservations) ? body.reservations : [],
      clients: Array.isArray(body?.clients) ? body.clients : [],
      blocked: Array.isArray(body?.blocked) ? body.blocked : [],
    };
    await writeAppData(value);
    return NextResponse.json({ ok: true, mode: dbEnabled() ? 'postgresql' : 'local', saved: dbEnabled() });
  } catch (error: any) {
    console.error('APP_DATA_POST_ERROR', error);
    return NextResponse.json({ ok: false, mode: 'error', message: error?.message || 'DB save failed' }, { status: 500 });
  }
}
