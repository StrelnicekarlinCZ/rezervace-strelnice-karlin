'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Copy, Search, ShieldCheck } from 'lucide-react';

type Reservation = { id: string; categoryName: string; serviceName: string; date: string; time: string; endTime: string; name: string; phone: string; email: string; status?: 'confirmed'|'cancelled'|'no_show'|'checked_in' };
type Settings = { qrInfo?: string; address?: string; rangeUrl?: string };
const formatDate=(iso:string)=>iso?.split('-').reverse().join('.')||'';

export default function CheckPage(){
  const [reservations,setReservations]=useState<Reservation[]>([]);
  const [settings,setSettings]=useState<Settings>({qrInfo:'Obsluha ověří rezervaci a potvrdí příchod zákazníka.', address:'Adresa střelnice'});
  const [manual,setManual]=useState('');
  const [message,setMessage]=useState('');
  useEffect(()=>{try{setReservations(JSON.parse(localStorage.getItem('cp_reservations')||'[]'))}catch{} try{setSettings(s=>({...s,...JSON.parse(localStorage.getItem('cp_settings')||'{}')}))}catch{}},[]);
  const queryId=typeof window!=='undefined'?new URLSearchParams(window.location.search).get('id')||'':'';
  const id=manual.trim()||queryId;
  const reservation=useMemo(()=>reservations.find(r=>r.id===id),[reservations,id]);
  function copy(){navigator.clipboard?.writeText(id); setMessage('Číslo rezervace zkopírováno.'); setTimeout(()=>setMessage(''),1400)}
  function checkIn(){
    if(!reservation) return;
    const next=reservations.map(r=>r.id===reservation.id?{...r,status:'checked_in' as const}:r);
    setReservations(next); localStorage.setItem('cp_reservations',JSON.stringify(next));
    setMessage('Příchod potvrzen. Rezervace je označená jako odbavená.');
  }
  return <main className="check-shell"><section className="check-card">
    <div className="check-logo"><ShieldCheck size={34}/></div>
    <p className="brand-kicker">STŘELNICE KARLÍN</p>
    <h1>Kontrola rezervace</h1>
    <p className="check-muted">{settings.qrInfo}</p>
    <div className="field"><label>Číslo rezervace</label><div className="check-input-row"><input value={id} onChange={e=>setManual(e.target.value)} placeholder="např. CP-123456"/><button onClick={copy}><Copy size={16}/></button></div></div>
    {!reservation && <div className="notice"><Search size={16}/> Rezervace zatím nebyla nalezena v lokálním úložišti tohoto zařízení. V ostré PostgreSQL verzi se bude ověřovat centrálně ze serveru.</div>}
    {reservation && <div className="check-result">
      <strong>{reservation.serviceName}</strong>
      <p>{reservation.categoryName}</p>
      <div className="check-grid"><span>Termín</span><b>{formatDate(reservation.date)} · {reservation.time}–{reservation.endTime}</b><span>Zákazník</span><b>{reservation.name}</b><span>Kontakt</span><b>{reservation.phone}<br/>{reservation.email}</b><span>Stav</span><b>{reservation.status==='checked_in'?'Odbaveno':reservation.status==='cancelled'?'Storno':reservation.status==='no_show'?'Nedorazil':'Potvrzeno'}</b></div>
      <button className="primary-btn" onClick={checkIn}><CheckCircle2 size={18}/> Potvrdit příchod</button>
    </div>}
    {message&&<div className="mail-note">{message}</div>}
    <a className="secondary-btn" href="/">Zpět do aplikace</a>
  </section></main>
}
