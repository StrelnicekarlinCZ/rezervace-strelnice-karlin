import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type AnyRecord = Record<string, any>;

function esc(value: unknown) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));
}

function cleanFilePart(value: unknown) {
  return String(value || 'rezervace').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'rezervace';
}

function absoluteCheckUrl(bodyCheckUrl: string, settings: AnyRecord, reservation: AnyRecord) {
  const base = process.env.NEXT_PUBLIC_APP_URL || settings?.rangeUrl || bodyCheckUrl || 'http://localhost:3000';
  const raw = bodyCheckUrl || `${String(base).replace(/\/$/, '')}/check?id=${encodeURIComponent(reservation?.id || '')}`;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${String(base).replace(/\/$/, '')}${raw.startsWith('/') ? raw : `/${raw}`}`;
}

async function qrDataUrl(value: string) {
  try {
    // Optional server dependency. Included in V1.26 package.json.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const QRCode = eval('require')('qrcode');
    return await QRCode.toDataURL(value, { width: 240, margin: 1, color: { dark: '#111111', light: '#ffffff' } });
  } catch {
    return '';
  }
}

function brandLogoHtml() {
  // V1.28a: finální logo mostu v e-mailu = přesně 3 oblouky.
  // Nepoužívá externí obrázek ani SVG <img>, aby ho e-mailové klienty neposouvaly.
  // Horní čára je vycentrovaná nad trojicí oblouků podle schváleného vzoru.
  const arch = '<span style="display:inline-block;width:24px;height:24px;border:4px solid #9cff38;border-bottom:0;border-radius:18px 18px 0 0;margin:0 5px 0 0;box-sizing:border-box;vertical-align:top"></span>';
  return `<div style="width:118px;text-align:center;line-height:1;font-size:0">
    <div style="height:4px;width:92px;background:#9cff38;border-radius:4px;margin:0 auto 8px auto"></div>
    <div style="width:82px;margin:0 auto;text-align:left;white-space:nowrap;font-size:0">${arch}${arch}<span style="display:inline-block;width:24px;height:24px;border:4px solid #9cff38;border-bottom:0;border-radius:18px 18px 0 0;margin:0;box-sizing:border-box;vertical-align:top"></span></div>
  </div>`;
}

function money(value: unknown) {
  if (value === undefined || value === null || value === '') return '';
  const n = Number(value);
  return Number.isFinite(n) ? `${n} Kč` : String(value);
}

function reservationRows(reservation: AnyRecord, settings: AnyRecord) {
  return [
    ['Služba', reservation?.categoryName],
    ['Podslužba', reservation?.serviceName],
    ['Datum', reservation?.date],
    ['Čas', `${reservation?.time || ''}${reservation?.endTime ? ` – ${reservation.endTime}` : ''}`],
    ['Jméno', reservation?.name],
    ['Telefon', reservation?.phone],
    ['E-mail', reservation?.email],
    ['Kapacita', reservation?.capacity ? `${reservation.capacity} osoba/osob` : ''],
    ['Cena', money(reservation?.price)],
    ['Rezervace ID', reservation?.id],
    ['Adresa', settings?.address || 'Střelnice Karlín']
  ].filter(([, v]) => String(v ?? '').trim());
}

function reservationText(reservation: AnyRecord, settings: AnyRecord, checkUrl: string) {
  const intro = settings?.emailIntro || 'Dobrý den, děkujeme za Vaši rezervaci. Níže najdete detail termínu.';
  const footer = settings?.emailFooter || 'Těšíme se na Vás. Tým Střelnice Karlín';
  const rows = reservationRows(reservation, settings).map(([k, v]) => `${k}: ${v}`).join('\n');
  return `${intro}\n\n${rows}\nOdkaz na rezervaci: ${checkUrl}\n\n${footer}`;
}

async function reservationHtml(reservation: AnyRecord, settings: AnyRecord, checkUrl: string) {
  const title = settings?.emailSubject || 'Potvrzení rezervace – Střelnice Karlín';
  const intro = settings?.emailIntro || 'Dobrý den, děkujeme za Vaši rezervaci. Níže najdete detail termínu.';
  const footer = settings?.emailFooter || 'Těšíme se na Vás. Tým Střelnice Karlín';
  const qr = await qrDataUrl(checkUrl);
  const rows = reservationRows(reservation, settings).map(([k, v]) => `
    <tr><td style="padding:8px 0;color:#9cff38;font-weight:700;width:140px">${esc(k)}:</td><td style="padding:8px 0;color:#fff;font-weight:700">${esc(v)}</td></tr>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#050706;color:#fff;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:760px;margin:0 auto;padding:22px;background:#050706">
    <div style="border:1px solid rgba(156,255,56,.45);border-radius:22px;background:linear-gradient(135deg,#111810,#050706);overflow:hidden;box-shadow:0 0 36px rgba(120,255,30,.12)">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-bottom:1px solid rgba(255,255,255,.16)">
        <tr>
          <td style="padding:24px 28px;vertical-align:middle">
            <div style="font-size:26px;line-height:1;font-weight:900;letter-spacing:.08em"><span style="color:#fff">STŘELNICE</span> <span style="color:#9cff38">KARLÍN</span></div>
            <div style="color:#dfe8d9;letter-spacing:.22em;font-size:12px;margin-top:8px">REZERVACE STŘELNICE</div>
          </td>
          <td align="right" style="padding:24px 28px;vertical-align:middle;width:160px">
            ${brandLogoHtml()}
          </td>
        </tr>
      </table>
      <div style="padding:24px 28px">
        <h1 style="margin:0 0 14px;color:#9cff38;font-size:24px">${esc(title)}</h1>
        <p style="line-height:1.65;color:#e8eee3;margin:0 0 20px">${esc(intro)}</p>
        <div style="display:flex;gap:26px;align-items:flex-start;flex-wrap:wrap">
          <table role="presentation" style="flex:1;min-width:300px;border-collapse:collapse;color:#fff">${rows}</table>
          ${qr ? `<div style="text-align:center"><img src="${qr}" width="176" height="176" alt="QR kód rezervace" style="background:#fff;border-radius:10px;padding:8px;display:block"/><div style="font-size:12px;color:#aebaa8;margin-top:8px">QR kód rezervace</div></div>` : ''}
        </div>
        <div style="height:1px;background:rgba(255,255,255,.18);margin:22px 0"></div>
        <div style="display:flex;gap:18px;align-items:center;justify-content:space-between;flex-wrap:wrap">
          <div style="color:#dfe8d9;line-height:1.6">
            <strong style="color:#9cff38">Kontakt</strong><br>
            ${esc(settings?.contactPhone || '+420 777 000 000')}<br>
            ${esc(settings?.notificationEmail || process.env.SMTP_USER || '')}<br>
            ${esc(settings?.address || 'Střelnice Karlín')}
          </div>
          <a href="${esc(checkUrl)}" style="display:inline-block;text-align:center;text-decoration:none;border:1px solid #9cff38;color:#9cff38;font-weight:900;padding:14px 18px;border-radius:12px;min-width:210px">Zobrazit rezervaci online</a>
        </div>
        <div style="height:1px;background:rgba(255,255,255,.18);margin:22px 0"></div>
        <p style="line-height:1.6;color:#e8eee3;margin:0">${esc(footer)}</p>
      </div>
    </div>
  </div>
</body></html>`;
}

function pdfEscape(s: unknown) {
  return String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[()\\]/g, '\\$&');
}

function simplePdfCard(reservation: AnyRecord, settings: AnyRecord, checkUrl: string) {
  const lines = [
    'STRELNICE KARLIN - DETAIL REZERVACE',
    '',
    ...reservationRows(reservation, settings).map(([k, v]) => `${pdfEscape(k)}: ${pdfEscape(v)}`),
    '',
    `Odkaz: ${pdfEscape(checkUrl)}`,
    '',
    pdfEscape(settings?.emailFooter || 'Tesime se na Vas. Tym Strelnice Karlin')
  ];
  const stream = `BT /F1 18 Tf 50 780 Td (${pdfEscape(lines[0])}) Tj /F1 11 Tf 0 -34 Td ${lines.slice(1).map((line) => `(${pdfEscape(line)}) Tj 0 -18 Td`).join(' ')} ET`;
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    `5 0 obj << /Length ${Buffer.byteLength(stream, 'latin1')} >> stream\n${stream}\nendstream endobj`
  ];
  let pdf = '%PDF-1.4\n';
  const xref: number[] = [0];
  for (const obj of objects) { xref.push(Buffer.byteLength(pdf, 'latin1')); pdf += obj + '\n'; }
  const xrefStart = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n` + xref.slice(1).map(n => String(n).padStart(10, '0') + ' 00000 n ').join('\n') + '\n';
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(pdf, 'latin1');
}

function smtpConfig(settings: AnyRecord) {
  // V1.26b: pro lokální test lze SMTP vyplnit přímo v administraci.
  // V produkci mají přednost bezpečnější ENV proměnné na serveru.
  const host = process.env.SMTP_HOST || settings?.smtpHost || '';
  const port = Number(process.env.SMTP_PORT || settings?.smtpPort || 587);
  const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : (settings?.smtpSecure === true || port === 465);
  const user = process.env.SMTP_USER || settings?.smtpUser || '';
  const pass = process.env.SMTP_PASS || settings?.smtpPass || '';
  const from = process.env.SMTP_FROM || settings?.smtpFrom || settings?.notificationEmail || user;
  return { host, port, secure, user, pass, from, ready: !!(host && user && pass && from) };
}

export async function GET() {
  const cfg = smtpConfig({});
  return NextResponse.json({ ok: true, smtpReady: cfg.ready, host: cfg.host || null, port: cfg.port, secure: cfg.secure, from: cfg.from ? cfg.from.replace(/<.*>/, '<***>') : null });
}

export async function POST(request: Request) {
  const body = await request.json();
  const reservation = body?.reservation || {};
  const settings = body?.settings || {};
  const checkUrl = absoluteCheckUrl(body?.checkUrl || '', settings, reservation);
  const to = String(reservation?.email || '').trim();
  const subject = settings?.emailSubject || 'Potvrzení rezervace – Střelnice Karlín';

  if (!to || !to.includes('@')) {
    return NextResponse.json({ ok: false, message: 'Chybí platný e-mail klienta.' }, { status: 400 });
  }

  const html = await reservationHtml(reservation, settings, checkUrl);
  const text = reservationText(reservation, settings, checkUrl);
  const cfg = smtpConfig(settings);

  if (!cfg.ready) {
    console.log('EMAIL_DEMO_READY', { to, subject, reservationId: reservation?.id, checkUrl });
    return NextResponse.json({ ok: true, mode: 'demo', message: 'E-mail je připravený. Pro reálné odeslání nastavte SMTP v .env.local.' });
  }
import nodemailer from 'nodemailer';
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: { user: cfg.user, pass: cfg.pass },
      tls: process.env.SMTP_TLS_REJECT_UNAUTHORIZED === 'false' ? { rejectUnauthorized: false } : undefined
    });

    const attachments = settings?.emailAttachCard === false ? [] : [
      {
        filename: `Rezervace_${cleanFilePart(reservation?.id || 'SK')}.pdf`,
        content: simplePdfCard(reservation, settings, checkUrl),
        contentType: 'application/pdf'
      }
    ];

    await transporter.sendMail({ from: cfg.from, to, subject, text, html, attachments });
    return NextResponse.json({ ok: true, mode: 'smtp', message: 'E-mail byl odeslán přes SMTP.' });
  } catch (error: any) {
    console.error('EMAIL_SEND_ERROR', error);
    return NextResponse.json({ ok: false, message: error?.message || 'E-mail se nepodařilo odeslat.' }, { status: 500 });
  }
}
