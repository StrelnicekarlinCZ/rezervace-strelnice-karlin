export type ReservationStatus = 'confirmed' | 'cancelled' | 'no_show' | 'checked_in';

export type SubService = {
  id: string;
  name: string;
  duration: number;
  price: number;
  capacity: number;
  description: string;
  image?: string;
  detailImage?: string;
};

export type Category = {
  id: string;
  name: string;
  description: string;
  image?: string;
  icon: 'target' | 'user' | 'shield' | 'users';
  services: SubService[];
};

export type Reservation = {
  id: string;
  categoryId: string;
  categoryName: string;
  serviceId: string;
  serviceName: string;
  duration: number;
  date: string;
  time: string;
  endTime: string;
  name: string;
  phone: string;
  email: string;
  note?: string;
  createdAt: string;
  status?: ReservationStatus;
  checkedInAt?: string;
};

export type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  note?: string;
  vip?: boolean;
  banned?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LaneBlock = {
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

export type AppData = {
  version: string;
  updatedAt?: string;
  settings: Record<string, unknown>;
  categories: Category[];
  reservations: Reservation[];
  clients: Client[];
  blocked: unknown[];
  laneBlocks: LaneBlock[];
};
