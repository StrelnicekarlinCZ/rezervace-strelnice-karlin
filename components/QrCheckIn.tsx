'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Camera, CheckCircle2, Clipboard, RotateCcw, Search, ShieldCheck, StopCircle, Volume2 } from 'lucide-react';
import QrResultCard from './QrResultCard';

type ReservationStatus = 'confirmed' | 'cancelled' | 'no_show' | 'checked_in';

type SubService = {
  id: string;
  name: string;
  duration: number;
  price: number;
  capacity: number;
  description: string;
  image?: string;
  detailImage?: string;
};

type Category = {
  id: string;
  name: string;
  description: string;
  image?: string;
  icon: 'target' | 'user' | 'shield' | 'users';
  services: SubService[];
};

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

type Props = {
  reservations: Reservation[];
  clients: Client[];
  categories: Category[];
  onOpenClient: (reservation: Reservation) => void;
  onCheckIn: (reservation: Reservation) => void;
};

function normEmail(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function normPhone(value: unknown) {
  return String(value || '').trim();
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function findClient(reservation: Reservation | null, clients: Client[]) {
  if (!reservation) return null;
  const email = normEmail(reservation.email);
  const phone = normPhone(reservation.phone);
  return clients.find(c => {
    const sameEmail = email && normEmail(c.email) === email;
    const samePhone = phone && normPhone(c.phone) === phone;
    return sameEmail || samePhone;
  }) || null;
}

function clientHistory(client: Client | null, reservation: Reservation | null, reservations: Reservation[]) {
  if (!reservation) return [];
  const email = normEmail(client?.email || reservation.email);
  const phone = normPhone(client?.phone || reservation.phone);
  return reservations.filter(r => {
    const sameEmail = email && normEmail(r.email) === email;
    const samePhone = phone && normPhone(r.phone) === phone;
    return sameEmail || samePhone;
  });
}

function extractReservationId(input: string) {
  const raw = String(input || '').trim();
  if (!raw) return '';

  try {
    const url = new URL(raw);
    const idParam = url.searchParams.get('id') || url.searchParams.get('reservationId') || url.searchParams.get('reservation');
    if (idParam) return idParam.trim();
  } catch {}

  const idMatch = raw.match(/(?:id|reservationId|reservation)=([^&\s]+)/i);
  if (idMatch?.[1]) return decodeURIComponent(idMatch[1]).trim();

  const skMatch = raw.match(/SK[-_A-Z0-9]+/i);
  if (skMatch?.[0]) return skMatch[0].trim();

  return raw;
}

function validationFor(reservation: Reservation | null, client: Client | null) {
  if (!reservation) {
    return {
      level: 'danger' as const,
      title: 'Rezervace nenalezena',
      message: 'Zkontrolujte ID rezervace nebo celý QR odkaz.',
      canCheckIn: false,
    };
  }

  const status = reservation.status || 'confirmed';
  const today = todayIso();

  if (client?.banned) {
    return {
      level: 'danger' as const,
      title: 'Zakázaný klient',
      message: 'Klient je označen jako zakázaný. Odbavení nedoporučeno bez rozhodnutí obsluhy.',
      canCheckIn: false,
    };
  }

  if (status === 'checked_in') {
    return {
      level: 'warn' as const,
      title: 'Již odbaveno',
      message: 'Tato rezervace už byla odbavena. Zkontrolujte čas odbavení v kartě.',
      canCheckIn: false,
    };
  }

  if (status === 'cancelled') {
    return {
      level: 'danger' as const,
      title: 'Rezervace je stornovaná',
      message: 'Stornovanou rezervaci nelze odbavit.',
      canCheckIn: false,
    };
  }

  if (status === 'no_show') {
    return {
      level: 'danger' as const,
      title: 'Rezervace označená jako nedorazil',
      message: 'Rezervace má stav nedorazil. Nejdříve změňte stav v administraci, pokud je to chyba.',
      canCheckIn: false,
    };
  }

  if (reservation.date !== today) {
    return {
      level: 'warn' as const,
      title: 'Rezervace je na jiný den',
      message: `Termín rezervace je ${reservation.date}. Odbavení je blokováno kvůli kontrole dne.`,
      canCheckIn: false,
    };
  }

  return {
    level: 'ok' as const,
    title: 'Rezervace nalezena',
    message: 'Rezervace je platná pro dnešní den a je připravena k odbavení.',
    canCheckIn: true,
  };
}

function beep(type: 'ok' | 'warn' | 'danger', enabled: boolean) {
  if (!enabled || typeof window === 'undefined') return;

  try {
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    const frequency = type === 'ok' ? 880 : type === 'warn' ? 520 : 220;
    const duration = type === 'ok' ? 0.12 : type === 'warn' ? 0.18 : 0.28;

    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.value = 0.055;

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();

    setTimeout(() => {
      oscillator.stop();
      ctx.close().catch(() => {});
    }, duration * 1000);
  } catch {
    // Zvuk je pouze pomocný UX prvek. Při chybě ho ignorujeme.
  }
}

function validationAccent(level: 'ok' | 'warn' | 'danger') {
  if (level === 'ok') {
    return {
      border: '1px solid rgba(156,255,56,.35)',
      background: 'linear-gradient(180deg,rgba(156,255,56,.09),rgba(255,255,255,.025))',
      color: '#9cff38',
    };
  }

  if (level === 'warn') {
    return {
      border: '1px solid rgba(255,174,43,.36)',
      background: 'linear-gradient(180deg,rgba(255,174,43,.10),rgba(255,255,255,.025))',
      color: '#ffae2b',
    };
  }

  return {
    border: '1px solid rgba(255,107,107,.36)',
    background: 'linear-gradient(180deg,rgba(255,107,107,.10),rgba(255,255,255,.025))',
    color: '#ff6b6b',
  };
}

export default function QrCheckIn({ reservations, clients, categories, onOpenClient, onCheckIn }: Props) {
  const [qrInput, setQrInput] = useState('');
  const [searchedId, setSearchedId] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [cameraInfo, setCameraInfo] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoCheckIn, setAutoCheckIn] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastScanRef = useRef('');
  const detectorRef = useRef<any>(null);
  const lastResultSoundRef = useRef('');
  const lastAutoCheckInRef = useRef('');

  const parsedId = useMemo(() => extractReservationId(qrInput), [qrInput]);

  const foundReservation = useMemo(() => {
    if (!searchedId) return null;
    const id = searchedId.toLowerCase();
    return reservations.find(r => String(r.id || '').trim().toLowerCase() === id) || null;
  }, [reservations, searchedId]);

  const foundClient = useMemo(() => findClient(foundReservation, clients), [foundReservation, clients]);
  const foundHistory = useMemo(() => clientHistory(foundClient, foundReservation, reservations), [foundClient, foundReservation, reservations]);
  const validation = useMemo(() => validationFor(foundReservation, foundClient), [foundReservation, foundClient]);

  function search() {
    const id = extractReservationId(qrInput);
    setSuccessMessage('');

    if (!id) {
      setSearchedId('');
      setCameraInfo('Zadejte nebo načtěte QR kód / ID rezervace.');
      beep('warn', soundEnabled);
      return;
    }

    setSearchedId(id);
  }

  function clear() {
    setQrInput('');
    setSearchedId('');
    setSuccessMessage('');
    setCameraInfo('');
    lastScanRef.current = '';
    lastResultSoundRef.current = '';
    lastAutoCheckInRef.current = '';
  }

  function checkIn() {
    if (!foundReservation || !validation.canCheckIn) {
      beep('danger', soundEnabled);
      return;
    }

    onCheckIn(foundReservation);
    setSuccessMessage(`Klient ${foundReservation.name} byl odbaven.`);
    setCameraInfo(`Odbaveno: ${foundReservation.name}`);
    beep('ok', soundEnabled);
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      const id = extractReservationId(text);
      setQrInput(text);
      setSearchedId(id);
      setSuccessMessage('');
      setCameraInfo(id ? `Vloženo ze schránky: ${id}` : 'Schránka neobsahuje rozpoznatelné ID rezervace.');
    } catch {
      alert('Nepodařilo se načíst schránku. Vložte QR text ručně.');
    }
  }

  function handleDetectedText(text: string) {
    const value = String(text || '').trim();
    if (!value) return;
    const id = extractReservationId(value);
    if (!id) return;
    if (lastScanRef.current === id) return;
    lastScanRef.current = id;
    setQrInput(value);
    setSearchedId(id);
    setSuccessMessage('');
    setCameraInfo(`QR načteno: ${id}`);
    beep('ok', soundEnabled);
  }

  function stopCamera() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }

  async function startCamera(mode: 'environment' | 'user' = facingMode) {
    setCameraError('');
    setCameraInfo('');

    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

    const BarcodeDetectorClass = (window as any).BarcodeDetector;
    if (!BarcodeDetectorClass) {
      setCameraError('Tento prohlížeč nepodporuje vestavěné čtení QR kódů. Použijte Chrome/Edge, USB čtečku nebo ruční vložení ID.');
      return;
    }

    try {
      detectorRef.current = new BarcodeDetectorClass({ formats: ['qr_code'] });
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setCameraActive(true);
      setCameraInfo('Kamera spuštěna. Namiřte QR kód do rámečku.');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
      }

      scanFrame();
    } catch (error: any) {
      stopCamera();
      setCameraError(error?.message || 'Kameru se nepodařilo spustit. Zkontrolujte oprávnění prohlížeče.');
    }
  }

  async function switchCamera() {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    stopCamera();
    setTimeout(() => startCamera(nextMode), 180);
  }

  async function scanFrame() {
    if (!videoRef.current || !detectorRef.current) return;

    try {
      if (videoRef.current.readyState >= 2) {
        const codes = await detectorRef.current.detect(videoRef.current);
        if (Array.isArray(codes) && codes.length > 0) {
          const first = codes[0];
          handleDetectedText(first?.rawValue || first?.rawData || '');
        }
      }
    } catch {
      // Tichý fallback: další snímek zkusíme znovu.
    }

    rafRef.current = requestAnimationFrame(scanFrame);
  }


  useEffect(() => {
    if (!searchedId) return;

    const soundKey = `${searchedId}:${foundReservation?.id || 'missing'}:${validation.level}`;
    if (lastResultSoundRef.current === soundKey) return;

    lastResultSoundRef.current = soundKey;
    beep(validation.level, soundEnabled);
  }, [searchedId, foundReservation, validation.level, soundEnabled]);

  useEffect(() => {
    if (!autoCheckIn || !foundReservation || !validation.canCheckIn) return;

    const key = foundReservation.id;
    if (lastAutoCheckInRef.current === key) return;

    lastAutoCheckInRef.current = key;
    setCameraInfo(`Automatické odbavení za 1 sekundu: ${foundReservation.name}`);

    const timer = window.setTimeout(() => {
      checkIn();
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [autoCheckIn, foundReservation, validation.canCheckIn]);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div className="admin-card" style={{ marginTop: 16 }}>
      <div className="section-title" style={{ marginTop: 0 }}>
        <div>
          <h2><ShieldCheck size={18} /> QR Check-In</h2>
          <p>Načtěte QR kamerou, vložte QR odkaz nebo zadejte ID rezervace. QR Engine najde rezervaci a připraví odbavení.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>QR odkaz / ID rezervace</label>
          <input
            value={qrInput}
            onChange={e => setQrInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') search(); }}
            placeholder="Např. SK-123456 nebo https://.../check?id=SK-123456"
          />
          {qrInput.trim() && <small style={{ display: 'block', marginTop: 6, opacity: .72 }}>Rozpoznané ID: <strong>{parsedId || '—'}</strong></small>}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="small-btn" onClick={pasteFromClipboard}><Clipboard size={14} /> Vložit</button>
          <button type="button" className="small-btn" onClick={search}><Search size={14} /> Vyhledat</button>
          <button type="button" className="small-btn danger" onClick={clear}>Vyčistit</button>
        </div>
      </div>

      <div style={{ marginTop: 14, border: '1px solid rgba(255,255,255,.16)', borderRadius: 14, padding: 14, background: 'rgba(255,255,255,.025)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}><Camera size={17} /> Kamera</h3>
            <p style={{ margin: 0, opacity: .75 }}>Zapněte kameru a namiřte QR kód do obrazu. Pokud kamera není podporována, použijte ruční vložení nebo USB čtečku.</p>
            <small style={{ display: 'block', marginTop: 6, opacity: .72 }}>Režim kamery: {facingMode === 'environment' ? 'zadní / externí' : 'přední'} · Auto odbavení: {autoCheckIn ? 'zapnuto' : 'vypnuto'}</small>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="small-btn"
              onClick={() => setSoundEnabled(v => !v)}
              style={soundEnabled ? { background: 'rgba(156,255,56,.14)', borderColor: 'rgba(156,255,56,.28)' } : {}}
            >
              <Volume2 size={14} /> Zvuk {soundEnabled ? 'ON' : 'OFF'}
            </button>

            <label className="small-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={autoCheckIn}
                onChange={e => setAutoCheckIn(e.target.checked)}
                style={{ width: 14, height: 14 }}
              />
              Auto odbavit
            </label>

            {!cameraActive && <button type="button" className="small-btn" onClick={() => startCamera()}><Camera size={14} /> Zapnout kameru</button>}
            {cameraActive && <button type="button" className="small-btn" onClick={switchCamera}><RotateCcw size={14} /> Přepnout kameru</button>}
            {cameraActive && <button type="button" className="small-btn danger" onClick={stopCamera}><StopCircle size={14} /> Vypnout kameru</button>}
          </div>
        </div>

        {cameraActive && (
          <div style={{ marginTop: 12, position: 'relative', overflow: 'hidden', borderRadius: 14, border: '1px solid rgba(156,255,56,.18)', background: '#050705' }}>
            <video
              ref={videoRef}
              muted
              autoPlay
              playsInline
              style={{ width: '100%', maxHeight: 420, objectFit: 'cover', display: 'block' }}
            />
            <div style={{ position: 'absolute', inset: '18% 24%', border: '2px solid rgba(156,255,56,.75)', borderRadius: 14, boxShadow: '0 0 0 9999px rgba(0,0,0,.24)', pointerEvents: 'none' }} />
          </div>
        )}

        {cameraInfo && (
          <div style={{ marginTop: 10, color: '#9cff38', fontWeight: 900 }}>
            {cameraInfo}
          </div>
        )}

        {cameraError && (
          <div style={{ marginTop: 10, color: '#ff6b6b', fontWeight: 900 }}>
            {cameraError}
          </div>
        )}
      </div>

      {successMessage && (
        <div style={{ marginTop: 14, border: '1px solid rgba(156,255,56,.28)', borderRadius: 12, padding: 12, color: '#9cff38', background: 'rgba(156,255,56,.08)', fontWeight: 900 }}>
          <CheckCircle2 size={16} /> {successMessage}
        </div>
      )}

      {searchedId && !foundReservation && (
        <div style={{ marginTop: 14, border: '1px solid rgba(255,107,107,.28)', borderRadius: 12, padding: 12, color: '#ff6b6b', background: 'rgba(255,107,107,.08)', fontWeight: 900 }}>
          Rezervace s ID „{searchedId}“ nebyla nalezena.
        </div>
      )}

      {foundReservation && (
        <div style={{ marginTop: 14, borderRadius: 14, padding: 12, ...validationAccent(validation.level) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontWeight: 900, color: validationAccent(validation.level).color }}>
            {validation.level === 'ok' ? <CheckCircle2 size={17} /> : <AlertTriangle size={17} />}
            {validation.title}
          </div>
          <QrResultCard
            reservation={foundReservation}
            client={foundClient}
            clientReservations={foundHistory}
            categories={categories}
            validation={validation}
            onOpenClient={onOpenClient}
            onCheckIn={checkIn}
          />
        </div>
      )}
    </div>
  );
}
