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

export async function GET() {
  try {
    const data: any = await readAppData();

    return NextResponse.json({
      ok: true,
      mode: dbEnabled() ? 'postgresql' : 'local',
      data: {
        settings: data?.settings ?? {},
        categories: Array.isArray(data?.categories) ? data.categories : [],
        blocked: Array.isArray(data?.blocked) ? data.blocked : [],
        laneBlocks: Array.isArray(data?.laneBlocks) ? data.laneBlocks : [],
      },
    });
  } catch (error: any) {
    console.error('PUBLIC_DATA_GET_ERROR', error);

    return NextResponse.json(
      {
        ok: false,
        mode: 'error',
        message: error?.message || 'Public data load failed',
        data: {
          settings: {},
          categories: [],
          blocked: [],
          laneBlocks: [],
        },
      },
      { status: 500 }
    );
  }
}

