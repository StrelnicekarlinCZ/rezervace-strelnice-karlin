import type { LaneBlock, Reservation } from '../types/skis';
import { overlaps } from './skisTime';

export function isValidLaneBlock(block: unknown): block is LaneBlock {
  const b = block as Partial<LaneBlock> | null;
  return Boolean(
    b &&
      b.id &&
      Number(b.lane) > 0 &&
      /^\d{4}-\d{2}-\d{2}$/.test(String(b.date || '')) &&
      /^\d{2}:\d{2}$/.test(String(b.start || '')) &&
      /^\d{2}:\d{2}$/.test(String(b.end || ''))
  );
}

export function sanitizeLaneBlocks(blocks: unknown[]): LaneBlock[] {
  const now = new Date().toISOString();
  return blocks
    .filter(isValidLaneBlock)
    .map(b => ({
      ...b,
      lane: Number(b.lane),
      active: b.active !== false,
      updatedAt: now,
    }));
}

export function activeLaneBlockConflict(laneBlocks: LaneBlock[], reservation: Pick<Reservation, 'date' | 'time' | 'endTime'>) {
  return (
    laneBlocks.find(b => {
      if (b.active === false) return false;
      if (!b.date || b.date !== reservation.date) return false;
      if (!b.start || !b.end) return false;
      return overlaps(b.start, b.end, reservation.time, reservation.endTime);
    }) || null
  );
}
