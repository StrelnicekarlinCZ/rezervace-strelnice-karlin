'use client';

import { CheckCircle2, User, XCircle, Ban, AlertTriangle, Wrench, Edit3, UserCog } from 'lucide-react';

type ReservationStatus = 'confirmed' | 'cancelled' | 'no_show' | 'checked_in';

type Reservation = {
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

type Client = {
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

type LaneStatus = 'free' | 'occupied' | 'preparing' | 'vip' | 'offline';

type LaneMeta = {
  offline?: boolean;
  note?: string;
  instructor?: string;
  manualName?: string;
};

type Props = {
  laneNumber: number;
  status: LaneStatus;
  reservation?: Reservation | null;
  client?: Client | null;
  laneMeta?: LaneMeta;
  minutesLeft?: number | null;
  startsIn?: number | null;
  onOpenClient?: (reservation: Reservation) => void;
  onCheckIn?: (reservation: Reservation) => void;
  onNoShow?: (reservation: Reservation) => void;
  onCancel?: (reservation: Reservation) => void;
  onToggleOffline?: (laneNumber: number) => void;
  onUpdateNote?: (laneNumber: number, note: string) => void;
  onUpdateInstructor?: (laneNumber: number, instructor: string) => void;
  onManualOccupy?: (laneNumber: number, name: string) => void;
  onManualFree?: (laneNumber: number) => void;
};

function statusConfig(status: LaneStatus) {
  if (status === 'occupied') return { label: 'Obsazeno', color: '#ff4d4d', icon: '🔴', border: 'rgba(255,77,77,.45)', bg: 'rgba(255,77,77,.10)' };
  if (status === 'preparing') return { label: 'Připraveno', color: '#ffae2b', icon: '🟡', border: 'rgba(255,174,43,.45)', bg: 'rgba(255,174,43,.10)' };
  if (status === 'vip') return { label: 'VIP', color: '#69a7ff', icon: '🔵', border: 'rgba(105,167,255,.45)', bg: 'rgba(105,167,255,.10)' };
  if (status === 'offline') return { label: 'Mimo provoz', color: '#8e8e8e', icon: '⚫', border: 'rgba(255,255,255,.15)', bg: 'rgba(255,255,255,.04)' };
  return { label: 'Volno', color: '#9cff38', icon: '🟢', border: 'rgba(156,255,56,.45)', bg: 'rgba(156,255,56,.10)' };
}

function statusLabel(status?: ReservationStatus) {
  if (status === 'checked_in') return 'odbaveno';
  if (status === 'no_show') return 'nedorazil';
  if (status === 'cancelled') return 'storno';
  return 'čeká';
}

export default function RangeLaneCard({
  laneNumber,
  status,
  reservation,
  client,
  laneMeta,
  minutesLeft,
  startsIn,
  onOpenClient,
  onCheckIn,
  onNoShow,
  onCancel,
  onToggleOffline,
  onUpdateNote,
  onUpdateInstructor,
  onManualOccupy,
  onManualFree,
}: Props) {
  const cfg = statusConfig(status);
  const urgent = typeof minutesLeft === 'number' && minutesLeft <= 5 && minutesLeft >= 0;
  const manualName = laneMeta?.manualName || '';

  function manualOccupy() {
    const name = prompt(`Koho ručně zapsat na STAV ${laneNumber}?`);
    if (!name?.trim()) return;
    onManualOccupy?.(laneNumber, name.trim());
  }

  return (
    <article
      style={{
        border: `1px solid ${cfg.border}`,
        background: `linear-gradient(180deg,${cfg.bg},rgba(255,255,255,.025))`,
        borderRadius: 16,
        padding: 16,
        minHeight: 260,
        boxShadow: urgent ? `0 0 0 1px ${cfg.border}, 0 0 26px ${cfg.bg}` : 'inset 0 1px 0 rgba(255,255,255,.04)',
      }}
    >
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
        <div>
          <div style={{opacity:.7,fontSize:12,fontWeight:900,textTransform:'uppercase',letterSpacing:.6}}>Střelecký stav</div>
          <h3 style={{margin:'3px 0 0',fontSize:24}}>STAV {laneNumber}</h3>
        </div>
        <div style={{display:'inline-flex',alignItems:'center',gap:8,color:cfg.color,fontWeight:1000,border:`1px solid ${cfg.border}`,borderRadius:999,padding:'8px 11px',background:'rgba(0,0,0,.22)'}}>
          <span>{cfg.icon}</span>{cfg.label}
        </div>
      </div>

      <div style={{marginTop:12,display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        <label style={{display:'grid',gap:5,fontSize:12,fontWeight:900,opacity:.9}}>
          Instruktor
          <input
            value={laneMeta?.instructor || ''}
            onChange={e=>onUpdateInstructor?.(laneNumber,e.target.value)}
            placeholder="např. Petr"
            style={{border:'1px solid rgba(255,255,255,.12)',borderRadius:9,background:'#151818',color:'#fff',padding:'8px 9px'}}
          />
        </label>
        <label style={{display:'grid',gap:5,fontSize:12,fontWeight:900,opacity:.9}}>
          Poznámka stavu
          <input
            value={laneMeta?.note || ''}
            onChange={e=>onUpdateNote?.(laneNumber,e.target.value)}
            placeholder="např. servis terče"
            style={{border:'1px solid rgba(255,255,255,.12)',borderRadius:9,background:'#151818',color:'#fff',padding:'8px 9px'}}
          />
        </label>
      </div>

      {status === 'offline' ? (
        <div style={{marginTop:18,display:'grid',gap:10}}>
          <strong style={{fontSize:24,color:'#aaa'}}>MIMO PROVOZ</strong>
          <p style={{margin:0,opacity:.72}}>Stav je dočasně vypnutý pro provoz.</p>
          <button type="button" className="small-btn" onClick={()=>onToggleOffline?.(laneNumber)}><Wrench size={14}/> Vrátit do provozu</button>
        </div>
      ) : !reservation && !manualName ? (
        <div style={{marginTop:20,display:'grid',gap:10}}>
          <strong style={{fontSize:28,color:'#9cff38'}}>VOLNO</strong>
          <p style={{margin:0,opacity:.72}}>Stav je okamžitě k dispozici.</p>
          <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>
            <button type="button" className="small-btn" onClick={manualOccupy}><Edit3 size={14}/> Ručně obsadit</button>
            <button type="button" className="small-btn danger" onClick={()=>onToggleOffline?.(laneNumber)}><Wrench size={14}/> Mimo provoz</button>
          </div>
        </div>
      ) : manualName ? (
        <div style={{marginTop:16,display:'grid',gap:10}}>
          <div>
            <strong style={{fontSize:19}}>{manualName}</strong><br />
            <small style={{opacity:.76}}>Ručně obsazený stav bez rezervace</small>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8,color:'#ffae2b',fontWeight:900}}>
            <UserCog size={15}/> Ruční režim – neovlivňuje rezervace.
          </div>
          <div style={{display:'flex',gap:7,flexWrap:'wrap',marginTop:2}}>
            <button type="button" className="small-btn" onClick={manualOccupy}><Edit3 size={14}/> Upravit</button>
            <button type="button" className="small-btn danger" onClick={()=>onManualFree?.(laneNumber)}><Ban size={14}/> Uvolnit</button>
            <button type="button" className="small-btn danger" onClick={()=>onToggleOffline?.(laneNumber)}><Wrench size={14}/> Mimo provoz</button>
          </div>
        </div>
      ) : reservation ? (
        <div style={{marginTop:16,display:'grid',gap:10}}>
          <div>
            <strong style={{fontSize:19}}>{reservation.name}</strong>
            {client?.vip && <span style={{marginLeft:8,color:'#69a7ff',fontWeight:1000}}>VIP</span>}
            {client?.banned && <span style={{marginLeft:8,color:'#ff6b6b',fontWeight:1000}}>ZÁKAZ</span>}
            <br />
            <small style={{opacity:.76}}>{reservation.serviceName} · {statusLabel(reservation.status)}</small>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div style={{border:'1px solid rgba(255,255,255,.08)',borderRadius:12,padding:10,background:'rgba(0,0,0,.15)'}}>
              <small style={{opacity:.72}}>Čas</small><br />
              <strong>{reservation.time}–{reservation.endTime}</strong>
            </div>
            <div style={{border:'1px solid rgba(255,255,255,.08)',borderRadius:12,padding:10,background:'rgba(0,0,0,.15)'}}>
              <small style={{opacity:.72}}>{typeof startsIn === 'number' && startsIn >= 0 ? 'Začíná za' : 'Zbývá'}</small><br />
              <strong style={{color: urgent ? '#ffae2b' : cfg.color}}>
                {typeof startsIn === 'number' && startsIn >= 0 ? `${startsIn} min` : typeof minutesLeft === 'number' ? `${Math.max(minutesLeft,0)} min` : '—'}
              </strong>
            </div>
          </div>

          {urgent && (
            <div style={{display:'flex',alignItems:'center',gap:8,color:'#ffae2b',fontWeight:900}}>
              <AlertTriangle size={15}/> Blíží se konec rezervace.
            </div>
          )}

          <div style={{display:'flex',gap:7,flexWrap:'wrap',marginTop:2}}>
            <button type="button" className="small-btn" onClick={()=>onOpenClient?.(reservation)}><User size={14}/> Klient</button>
            <button type="button" className="small-btn" style={{background:'var(--green2)',color:'#111'}} onClick={()=>onCheckIn?.(reservation)}><CheckCircle2 size={14}/> Odbavit</button>
            <button type="button" className="small-btn danger" onClick={()=>onNoShow?.(reservation)}><XCircle size={14}/> Nedorazil</button>
            <button type="button" className="small-btn danger" onClick={()=>onCancel?.(reservation)}><Ban size={14}/> Storno</button>
            <button type="button" className="small-btn danger" onClick={()=>onToggleOffline?.(laneNumber)}><Wrench size={14}/> Mimo provoz</button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
