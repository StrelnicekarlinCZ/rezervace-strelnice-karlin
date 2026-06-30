import { NextResponse } from 'next/server';
import { dbEnabled } from '../../../lib/prisma';
import { readAppData, writeAppData, normalizeAppData } from '../../../lib/skisAppData';
import { sanitizeLaneBlocks } from '../../../lib/skisLane';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = normalizeAppData(await readAppData());

    return NextResponse.json({
      ok: true,
      mode: dbEnabled() ? 'postgresql' : 'local',
      laneBlocks: data.laneBlocks,
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
    const sanitized = sanitizeLaneBlocks(blocks);

    const data = normalizeAppData(await readAppData());
    const next = {
      ...data,
      version: '3.0',
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
