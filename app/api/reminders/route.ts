import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { dbEnabled, prisma } from '../../../lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const APP_DATA_KEY = 'appData';

type AnyRecord = Record<string, any>;

function esc(value: unknown) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c] || c));
}

function cleanFilePart(value: unknown) {
  return String(value || 'rezervace')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'rezervace';
}

function tomorrowDatePrague() {
  const now = new Date();
  const pragueNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Prague' }));
  pragueNow.setDate(pragueNow.getDate() + 1);

  const y = pragueNow.getFullYear();
  const m = String(pragueNow.getMonth() + 1).padStart(2, '0');
  const d = String(pragueNow.getDate()).padStart(2, '0');

  return `${y}-${m}-${d}`;
}

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

async function qrDataUrl(value: string) {
  try {
    return await QRCode.toDataURL(value, {
      width: 240,
      margin: 1,
      color: {
        dark: '#111111',
        light: '#ffffff',
      },
    });
  } catch (error) {
    console.error('QR_ERROR', error);
    return '';
  }
}

function brandLogoHtml() {
  const arch =
    '<span style="display:inline-block;width:24px;height:24px;border:4px solid #9cff38;border-bottom:0;border-radius:18px 18px 0 0;margin:0 5px 0 0;box-sizing:border-box;vertical-align:top"></span>';

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
    ['Adresa', settings?.address || 'Střelnice Karlín'],
  ].filter(([, v]) => String(v ?? '').trim());
}

function pdfEscape(s: unknown) {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[()\\]/g, '\\$&');
}

function simplePdfCard(reservation: AnyRecord, settings: AnyRecord, checkUrl: string) {
  const lines = [
    'STRELNICE KARLIN - PRIPOMINKA REZERVACE',
    '',
    ...reservationRows(reservation, settings).map(([k, v]) => `${pdfEscape(k)}: ${pdfEscape(v)}`),
    '',
    `Odkaz: ${pdfEscape(checkUrl)}`,
    '',
    'Tesime se na Vas. Tym Strelnice Karlin',
  ];

  const stream = `BT /F1 18 Tf 50 780 Td (${pdfEscape(lines[0])}) Tj /F1 11 Tf 0 -34 Td ${lines
    .slice(1)
    .map((line) => `(${pdfEscape(line)}) Tj 0 -18 Td`)
    .join(' ')} ET`;

  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    `5 0 obj << /Length ${Buffer.byteLength(stream, 'latin1')} >> stream\n${stream}\nendstream endobj`,
  ];

  let pdf = '%PDF-1.4\n';
  const xref: number[] = [0];

  for (const obj of objects) {
    xref.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += obj + '\n';
  }

  const xrefStart = Buffer.byteLength(pdf, 'latin1');

  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += xref.slice(1).map((n) => String(n).padStart(10, '0') + ' 00000 n ').join('\n');
  pdf += `\ntrailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(pdf, 'latin1');
}

function smtpConfig(settings: AnyRecord) {
  const host = process.env.SMTP_HOST || settings?.smtpHost || '';
  const port = Number(process.env.SMTP_PORT || settings?.smtpPort || 587);
  const secure = process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE === 'true'
    : settings?.smtpSecure === true || port === 465;

  const user = process.env.SMTP_USER || settings?.smtpUser || '';
  const pass = process.env.SMTP_PASS || settings?.smtpPass || '';
  const from =
    process.env.SMTP_FROM ||
    settings?.smtpFrom ||
    settings?.notificationEmail ||
    user;

  return { host, port, secure, user, pass, from, ready: !!(host && user && pass && from) };
}

function absoluteCheckUrl(settings: AnyRecord, reservation: AnyRecord) {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    settings?.rangeUrl ||
    'https://rezervace-strelnice-karlin.vercel.app';

  return `${String(base).replace(/\/$/, '')}/check?id=${encodeURIComponent(reservation?.id || '')}`;
}

function reminderText(reservation: AnyRecord, settings: AnyRecord, checkUrl: string) {
  const rows = reservationRows(reservation, settings)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');

  return `Dobrý den,

připomínáme Vaši rezervaci na zítřejší den.

${rows}

Detail rezervace:
${checkUrl}

Těšíme se na Vás.
Tým Střelnice Karlín`;
}

async function reminderHtml(reservation: AnyRecord, settings: AnyRecord, checkUrl: string) {
  const qr = await qrDataUrl(checkUrl);

  const rows = reservationRows(reservation, settings).map(([k, v]) => `
    <tr>
      <td style="padding:8px 0;color:#9cff38;font-weight:700;width:140px">${esc(k)}:</td>
      <td style="padding:8px 0;color:#fff;font-weight:700">${esc(v)}</td>
    </tr>`).join('');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;background:#050706;color:#fff;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:760px;margin:0 auto;padding:22px;background:#050706">
    <div style="border:1px solid rgba(156,255,56,.45);border-radius:22px;background:linear-gradient(135deg,#111810,#050706);overflow:hidden;box-shadow:0 0 36px rgba(120,255,30,.12)">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-bottom:1px solid rgba(255,255,255,.16)">
        <tr>
          <td style="padding:24px 28px;vertical-align:middle">
            <div style="font-size:26px;line-height:1;font-weight:900;letter-spacing:.08em">
              <span style="color:#fff">STŘELNICE</span> <span style="color:#9cff38">KARLÍN</span>
            </div>
            <div style="color:#dfe8d9;letter-spacing:.22em;font-size:12px;margin-top:8px">
              PŘIPOMÍNKA REZERVACE
            </div>
          </td>
          <td align="right" style="padding:24px 28px;vertical-align:middle;width:160px">
            ${brandLogoHtml()}
          </td>
        </tr>
      </table>

      <div style="padding:24px 28px">
        <h1 style="margin:0 0 14px;color:#9cff38;font-size:24px">
          Připomínka rezervace na zítra
        </h1>

        <p style="line-height:1.65;color:#e8eee3;margin:0 0 20px">
          Dobrý den, připomínáme Vaši rezervaci na zítřejší den.
        </p>

        <div style="display:flex;gap:26px;align-items:flex-start;flex-wrap:wrap">
          <table role="presentation" style="flex:1;min-width:300px;border-collapse:collapse;color:#fff">
            ${rows}
          </table>

          ${
            qr
              ? `<div style="text-align:center">
                  <img src="${qr}" width="176" height="176" alt="QR kód rezervace" style="background:#fff;border-radius:10px;padding:8px;display:block"/>
                  <div style="font-size:12px;color:#aebaa8;margin-top:8px">QR kód rezervace</div>
                </div>`
              : ''
          }
        </div>

        <div style="height:1px;background:rgba(255,255,255,.18);margin:22px 0"></div>

        <div style="display:flex;gap:18px;align-items:center;justify-content:space-between;flex-wrap:wrap">
          <div style="color:#dfe8d9;line-height:1.6">
            <strong style="color:#9cff38">Kontakt</strong><br>
            ${esc(settings?.contactPhone || '+420 777 000 000')}<br>
            ${esc(settings?.notificationEmail || process.env.SMTP_USER || '')}<br>
            ${esc(settings?.address || 'Střelnice Karlín')}
          </div>

          <a href="${esc(checkUrl)}" style="display:inline-block;text-align:center;text-decoration:none;border:1px solid #9cff38;color:#9cff38;font-weight:900;padding:14px 18px;border-radius:12px;min-width:210px">
            Zobrazit rezervaci online
          </a>
        </div>

        <div style="height:1px;background:rgba(255,255,255,.18);margin:22px 0"></div>

        <p style="line-height:1.6;color:#e8eee3;margin:0">
          Těšíme se na Vás.<br>
          Tým Střelnice Karlín
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function sendReminder(reservation: AnyRecord, settings: AnyRecord) {
  const to = String(reservation?.email || '').trim();

  if (!to || !to.includes('@')) {
    return { ok: false, reason: 'missing_email' };
  }

  const cfg = smtpConfig(settings);

  if (!cfg.ready) {
    return { ok: false, reason: 'smtp_not_ready' };
  }

  const checkUrl = absoluteCheckUrl(settings, reservation);

  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
    tls:
      process.env.SMTP_TLS_REJECT_UNAUTHORIZED === 'false'
        ? { rejectUnauthorized: false }
        : undefined,
  });

  const attachments =
    settings?.emailAttachCard === false
      ? []
      : [
          {
            filename: `Pripominka_rezervace_${cleanFilePart(reservation?.id || 'SK')}.pdf`,
            content: simplePdfCard(reservation, settings, checkUrl),
            contentType: 'application/pdf',
          },
        ];

  await transporter.sendMail({
    from: cfg.from,
    to,
    subject: 'Připomínka rezervace – Střelnice Karlín',
    text: reminderText(reservation, settings, checkUrl),
    html: await reminderHtml(reservation, settings, checkUrl),
    attachments,
  });

  return { ok: true, reason: '' };
}

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET || '';
  const url = new URL(request.url);

  const tokenFromQuery = url.searchParams.get('secret') || '';
  const authHeader = request.headers.get('authorization') || '';
  const tokenFromHeader = authHeader.replace(/^Bearer\s+/i, '');

  if (!secret) return false;

  return tokenFromQuery === secret || tokenFromHeader === secret;
}

export async function GET(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { ok: false, message: 'Unauthorized cron request.' },
        { status: 401 }
      );
    }

    const data = await readAppData();

    if (!data) {
      return NextResponse.json(
        { ok: false, message: 'Database data not found.' },
        { status: 500 }
      );
    }

    const settings = data?.settings || {};
    const reservations = Array.isArray(data?.reservations) ? data.reservations : [];
    const tomorrow = tomorrowDatePrague();

    let sent = 0;
    let skipped = 0;
    const errors: AnyRecord[] = [];
    const updatedReservations: AnyRecord[] = [];

    for (const reservation of reservations) {
      const alreadySent = !!reservation?.reminderSentAt;
      const isCancelled = reservation?.status === 'cancelled';
      const isTomorrow = reservation?.date === tomorrow;

      if (!isTomorrow || isCancelled || alreadySent) {
        updatedReservations.push(reservation);
        skipped++;
        continue;
      }

      try {
        const result = await sendReminder(reservation, settings);

        if (result.ok) {
          sent++;
          updatedReservations.push({
            ...reservation,
            reminderSentAt: new Date().toISOString(),
          });
        } else {
          skipped++;
          errors.push({
            reservationId: reservation?.id || null,
            reason: result.reason || 'unknown_skip',
          });
          updatedReservations.push(reservation);
        }
      } catch (error: any) {
        skipped++;
        errors.push({
          reservationId: reservation?.id || null,
          message: error?.message || 'Unknown error',
        });
        updatedReservations.push(reservation);
      }
    }

    await writeAppData({
      ...data,
      updatedAt: new Date().toISOString(),
      reservations: updatedReservations,
    });

    return NextResponse.json({
      ok: true,
      date: tomorrow,
      sent,
      skipped,
      errors,
    });
  } catch (error: any) {
    console.error('REMINDERS_CRON_ERROR', error);

    return NextResponse.json(
      { ok: false, message: error?.message || 'Reminder cron failed.' },
      { status: 500 }
    );
  }
}
