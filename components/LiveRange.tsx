'use client';

import { useEffect, useMemo, useState } from 'react';
import { Clock, Monitor, ShieldAlert, Users, Wrench, RotateCcw } from 'lucide-react';
import RangeLaneCard from './RangeLaneCard';

type ReservationStatus = 'confirmed' | 'cancelled' | 'no_show' | 'checked_in';

type SubService = { id: string; name: string; duration: number; price: number; capacity: number; description: string; image?: string; detailImage?: string };
type Category = { id: string; name: string; description: string; image?: string; icon: 'target' | 'user' | 'shield' | 'users'; services: SubService[] };
type Reservation = { id: string; categoryId: string; categoryName: string; serviceId: string; serviceName: string; duration: number; date: string; time: string; endTime: string; name: string; phone: string; email: string; note?: string; createdAt: string; status?: ReservationStatus; checkedInAt?: string };
type Client = { id: string; name: string; email: string; phone: string; note?: string; vip?: boolean; banned?: boolean; createdAt: string; updatedAt: string };

type LaneMeta = {
  offline?: boolean;
  note?: string;
  instructor?: string;
  manualName?: string;
};

type LaneMetaMap = Record<string, LaneMeta>;

type Props = {
  reservations: Reservation[];
  clients: Client[];
  categories: Category[];
  laneCount?: number;
  onOpenClient: (reservation: Reservation) => void;
  onCheckIn: (reservation: Reservation) => void;
  onNoShow: (reservation: Reservation) => void;
  onCancel: (reservation: Reservation) => void;
};

const META_KEY = 'skis_live_range_lane_meta_v251';

function todayIso() { return new Date().toISOString().slice(0, 10); }
function timeToMinutes(value?: string) {
  const [h, m] = String(value || '00:00').split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return -1;
  return h * 60 + m;
}
function currentMinutesFromTick(tick: number) { const d = new Date(tick); return d.getHours() * 60 + d.getMinutes(); }
function normEmail(value: unknown) { return String(value || '').trim().toLowerCase(); }
function normPhone(value: unknown) { return String(value || '').trim(); }
function findClient(reservation: Reservation | null | undefined, clients: Client[]) {
  if (!reservation) return null;
  const email = normEmail(reservation.email);
  const phone = normPhone(reservation.phone);
  return clients.find(c => {
    const sameEmail = email && normEmail(c.email) === email;
    const samePhone = phone && normPhone(c.phone) === phone;
    return sameEmail || samePhone;
  }) || null;
}
function getReservationPrice(r: Reservation, categories: Category[]) {
  return categories.find(c => c.id === r.categoryId)?.services.find(s => s.id === r.serviceId)?.price || 0;
}
function money(value: number) { return `${Number(value || 0).toLocaleString('cs-CZ')} Kč`; }

export default function LiveRange({ reservations, clients, categories, laneCount = 6, onOpenClient, onCheckIn, onNoShow, onCancel }: Props) {
  const [tick, setTick] = useState(Date.now());
  const [lanes, setLanes] = useState(laneCount);
  const [laneMeta, setLaneMeta] = useState<LaneMetaMap>({});
  const today = todayIso();
  const nowMin = currentMinutesFromTick(tick);

  useEffect(() => {
    const timer = setInterval(() => setTick(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(META_KEY);
      if (raw) setLaneMeta(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(META_KEY, JSON.stringify(laneMeta)); } catch {}
  }, [laneMeta]);

  function updateLane(laneNumber: number, patch: LaneMeta) {
    setLaneMeta(cur => ({ ...cur, [String(laneNumber)]: { ...(cur[String(laneNumber)] || {}), ...patch } }));
  }

  function clearLane(laneNumber: number) {
    setLaneMeta(cur => {
      const next = { ...cur };
      delete next[String(laneNumber)];
      return next;
    });
  }

  const todayReservations = useMemo(() => {
    return reservations
      .filter(r => r.date === today && r.status !== 'cancelled' && r.status !== 'no_show')
      .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
  }, [reservations, today]);

  const activeNow = useMemo(() => {
    return todayReservations.filter(r => {
      const start = timeToMinutes(r.time);
      const end = timeToMinutes(r.endTime);
      const status = r.status || 'confirmed';
      return status !== 'cancelled' && status !== 'no_show' && start <= nowMin && nowMin < end;
    });
  }, [todayReservations, nowMin]);

  const preparingSoon = useMemo(() => {
    const activeIds = new Set(activeNow.map(r => r.id));
    return todayReservations.filter(r => {
      if (activeIds.has(r.id)) return false;
      const start = timeToMinutes(r.time);
      const status = r.status || 'confirmed';
      return status === 'confirmed' && start > nowMin && start <= nowMin + 15;
    });
  }, [todayReservations, activeNow, nowMin]);

  const nextWaiting = useMemo(() => {
    const used = new Set([...activeNow, ...preparingSoon].map(r => r.id));
    return todayReservations.filter(r => {
      if (used.has(r.id)) return false;
      const start = timeToMinutes(r.time);
      return (r.status || 'confirmed') === 'confirmed' && start > nowMin;
    }).slice(0, 8);
  }, [todayReservations, activeNow, preparingSoon, nowMin]);

  const laneData = useMemo(() => {
    const assigned = [...activeNow, ...preparingSoon].slice(0, lanes);
    return Array.from({ length: lanes }, (_, index) => {
      const laneNumber = index + 1;
      const meta = laneMeta[String(laneNumber)] || {};
      const reservation = meta.offline ? null : (assigned[index] || null);
      const client = findClient(reservation, clients);
      const start = reservation ? timeToMinutes(reservation.time) : -1;
      const end = reservation ? timeToMinutes(reservation.endTime) : -1;
      const startsIn = reservation && start > nowMin ? start - nowMin : null;
      const minutesLeft = reservation && end >= nowMin ? end - nowMin : null;
      const isPreparing = reservation && start > nowMin;
      const status = meta.offline
        ? 'offline'
        : reservation
          ? client?.vip
            ? 'vip'
            : isPreparing
              ? 'preparing'
              : 'occupied'
          : meta.manualName
            ? 'occupied'
            : 'free';
      return { laneNumber, status, reservation, client, startsIn, minutesLeft, meta };
    });
  }, [activeNow, preparingSoon, lanes, clients, nowMin, laneMeta]);

  const occupiedCount = laneData.filter(l => l.status === 'occupied' || l.status === 'vip').length;
  const freeCount = laneData.filter(l => l.status === 'free').length;
  const preparingCount = laneData.filter(l => l.status === 'preparing').length;
  const offlineCount = laneData.filter(l => l.status === 'offline').length;
  const vipCount = laneData.filter(l => l.status === 'vip').length + nextWaiting.filter(r => findClient(r, clients)?.vip).length;
  const revenue = todayReservations.filter(r => r.status !== 'cancelled').reduce((sum, r) => sum + getReservationPrice(r, categories), 0);

  return (
    <div className="admin-card" style={{ marginTop: 16 }}>
      <div className="section-title" style={{ marginTop: 0 }}>
        <div>
          <h2><Monitor size={18} /> Live Shooting Range</h2>
          <p>Živý přehled střeleckých stavů. Volný stav je zelený, obsazený červený. Ve v2.5.1 lze stav ručně obsadit, vyřadit z provozu, přidat poznámku a instruktora.</p>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          <span className="small-btn" style={{pointerEvents:'none'}}>Stavů</span>
          <select value={lanes} onChange={e=>setLanes(Number(e.target.value))} style={{border:'1px solid rgba(255,255,255,.14)',borderRadius:9,background:'#151818',color:'#fff',padding:'9px 10px'}}>
            {[2,3,4,5,6,7,8,9,10,12].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <button type="button" className="small-btn danger" onClick={()=>{ if(confirm('Vyčistit ruční nastavení všech stavů?')) setLaneMeta({}); }}><RotateCcw size={14}/> Reset stavů</button>
        </div>
      </div>

      <div className="stats stats-four">
        <div className="stat"><p>🟢 Volné</p><strong>{freeCount}</strong><small>okamžitě k dispozici</small></div>
        <div className="stat"><p>🔴 Obsazené</p><strong>{occupiedCount}</strong><small>probíhá / VIP / ručně</small></div>
        <div className="stat"><p>🟡 Za chvíli</p><strong>{preparingCount}</strong><small>start do 15 min</small></div>
        <div className="stat"><p>⚫ Mimo provoz</p><strong>{offlineCount}</strong><small>VIP dnes {vipCount}</small></div>
      </div>

      <div className="stats stats-four" style={{marginTop:12}}>
        <div className="stat"><p>Dnešní odhad tržby</p><strong>{money(revenue)}</strong><small>bez storen</small></div>
        <div className="stat"><p>Instruktoři</p><strong>{laneData.filter(l=>l.meta?.instructor).length}</strong><small>vyplněné stavy</small></div>
        <div className="stat"><p>Ruční obsazení</p><strong>{laneData.filter(l=>l.meta?.manualName).length}</strong><small>bez rezervace</small></div>
        <div className="stat"><p>Poznámky</p><strong>{laneData.filter(l=>l.meta?.note).length}</strong><small>u stavů</small></div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:14,marginTop:14}}>
        {laneData.map(lane => (
          <RangeLaneCard
            key={lane.laneNumber}
            laneNumber={lane.laneNumber}
            status={lane.status as any}
            reservation={lane.reservation}
            client={lane.client}
            laneMeta={lane.meta}
            startsIn={lane.startsIn}
            minutesLeft={lane.minutesLeft}
            onOpenClient={onOpenClient}
            onCheckIn={onCheckIn}
            onNoShow={onNoShow}
            onCancel={onCancel}
            onToggleOffline={(n)=>updateLane(n,{offline:!laneMeta[String(n)]?.offline, manualName: undefined})}
            onUpdateNote={(n,note)=>updateLane(n,{note})}
            onUpdateInstructor={(n,instructor)=>updateLane(n,{instructor})}
            onManualOccupy={(n,name)=>updateLane(n,{manualName:name, offline:false})}
            onManualFree={(n)=>updateLane(n,{manualName:undefined})}
          />
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginTop:14}}>
        <section style={{border:'1px solid rgba(255,255,255,.10)',borderRadius:14,padding:14,background:'rgba(255,255,255,.035)'}}>
          <h3 style={{margin:'0 0 12px',display:'flex',alignItems:'center',gap:8}}><Clock size={17}/> Čeká na nástup</h3>
          {nextWaiting.length === 0 && <div className="notice">Žádná další čekající rezervace pro dnešek.</div>}
          <div style={{display:'grid',gap:8}}>
            {nextWaiting.map(r => {
              const c = findClient(r, clients);
              const startsIn = Math.max(timeToMinutes(r.time) - nowMin, 0);
              return (
                <button key={r.id} type="button" className="small-btn" onClick={()=>onOpenClient(r)} style={{justifyContent:'flex-start',width:'100%',textAlign:'left'}}>
                  <Users size={14}/>
                  <span><strong>{r.time} · {r.name}</strong>{c?.vip ? ' · VIP' : ''}<br/><small>{r.serviceName} · za {startsIn} min</small></span>
                </button>
              );
            })}
          </div>
        </section>

        <section style={{border:'1px solid rgba(255,255,255,.10)',borderRadius:14,padding:14,background:'rgba(255,255,255,.035)'}}>
          <h3 style={{margin:'0 0 12px',display:'flex',alignItems:'center',gap:8}}><ShieldAlert size={17}/> Provozní upozornění</h3>
          <div style={{display:'grid',gap:8}}>
            {laneData.some(l => typeof l.minutesLeft === 'number' && l.minutesLeft <= 5 && l.minutesLeft >= 0) && <div className="notice" style={{color:'#ffae2b'}}>Některé rezervace končí do 5 minut.</div>}
            {laneData.some(l => l.client?.banned) && <div className="notice" style={{color:'#ff6b6b'}}>Na stavu je klient označený jako zakázaný.</div>}
            {offlineCount > 0 && <div className="notice" style={{color:'#aaa'}}><Wrench size={14}/> Mimo provoz: {offlineCount} stavů.</div>}
            {vipCount > 0 && <div className="notice" style={{color:'#69a7ff'}}>Dnes je evidovaný VIP klient.</div>}
            {freeCount === 0 && <div className="notice" style={{color:'#ff6b6b'}}>Všechny zobrazené stavy jsou obsazené, připravené nebo mimo provoz.</div>}
            {freeCount > 0 && <div className="notice" style={{color:'#9cff38'}}>Volných stavů: {freeCount}</div>}
          </div>
        </section>
      </div>
    </div>
  );
}
