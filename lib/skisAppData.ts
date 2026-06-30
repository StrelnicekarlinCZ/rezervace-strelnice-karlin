import { dbEnabled, prisma } from './prisma';
import type { AppData } from '../types/skis';

const APP_DATA_KEY = 'appData';

export function defaultAppData(): AppData {
  return {
    version: '3.0',
    updatedAt: new Date().toISOString(),
    settings: {},
    categories: [],
    reservations: [],
    clients: [],
    blocked: [],
    laneBlocks: [],
  };
}

export async function readAppData(): Promise<AppData | null> {
  if (!dbEnabled()) return null;
  const row = await prisma.appSetting.findUnique({ where: { key: APP_DATA_KEY } });
  return (row?.value as AppData | null) ?? null;
}

export async function writeAppData(value: AppData) {
  if (!dbEnabled()) return null;
  return prisma.appSetting.upsert({
    where: { key: APP_DATA_KEY },
    create: { key: APP_DATA_KEY, value },
    update: { value },
  });
}

export async function readAppDataOrDefault(): Promise<AppData> {
  return (await readAppData()) ?? defaultAppData();
}

export function normalizeAppData(data: Partial<AppData> | null | undefined): AppData {
  const base = defaultAppData();
  return {
    ...base,
    ...(data || {}),
    settings: data?.settings || {},
    categories: Array.isArray(data?.categories) ? data.categories : [],
    reservations: Array.isArray(data?.reservations) ? data.reservations : [],
    clients: Array.isArray(data?.clients) ? data.clients : [],
    blocked: Array.isArray(data?.blocked) ? data.blocked : [],
    laneBlocks: Array.isArray(data?.laneBlocks) ? data.laneBlocks : [],
  };
}
