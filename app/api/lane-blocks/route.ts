
import { NextResponse } from 'next/server';
import { dbEnabled, prisma } from '../../../lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const APP_DATA_KEY = 'appData';

type LaneBlock = {
  id: string;
  lane: number;
  date: string;
  start: string;
  end: string;
  reason?: string;
  instructor?: string;
  note?: string;
  manualName?: string;
  offline?: boolean;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

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

function isValidBlock(block: any): block is LaneBlock {
  return Boolean(
    block &&
    block.id &&
    Number(block.lane) > 0 &&
    /^\d{4}-\d{2}-\d{2}$/.test(String(block.date || '')) &&
    /^\d{2}:\d{2}$/.test(String(block.start || '')) &&
    /^\d{2}:\d{2}$/.test(String(block.end || ''))
  );
}

export async function GET() {
  try {
    const data = (await readAppData()) ?? {};
    const laneBlocks = Array.isArray(data.laneBlocks) ? data.laneBlocks : [];

    return NextResponse.json({
      ok: true,
      mode: dbEnabled() ? 'postgresql' : 'local',
      laneBlocks,
    });
  } catch (error: any) {
    console.error('LANE_BLOCKS_GET_ERROR', error);
    return NextResponse.json(
      { ok: false, message: error?.message || 'Lane blocks load failed', laneBlocks: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const blocks = Array.isArray(body?.laneBlocks) ? body.laneBlocks : [];
    const sanitized = blocks
      .filter(isValidBlock)
      .map((b: LaneBlock) => ({
        ...b,
        lane: Number(b.lane),
        active: b.active !== false,
        updatedAt: new Date().toISOString(),
      }));

    const data = (await readAppData()) ?? {
      version: '1.29',
      settings: {},
      categories: [],
      reservations: [],
      clients: [],
      blocked: [],
      laneBlocks: [],
    };

    const next = {
      ...data,
      version: '1.29',
      updatedAt: new Date().toISOString(),
      laneBlocks: sanitized,
    };

    await writeAppData(next);

    return NextResponse.json({
      ok: true,
      mode: dbEnabled() ? 'postgresql' : 'local',
      laneBlocks: sanitized,
      saved: dbEnabled(),
    });
  } catch (error: any) {
    console.error('LANE_BLOCKS_POST_ERROR', error);
    return NextResponse.json(
      { ok: false, message: error?.message || 'Lane blocks save failed' },
      { status: 500 }
    );
  }
}
