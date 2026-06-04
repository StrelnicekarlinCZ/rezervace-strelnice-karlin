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

function tomorrowDatePrague() {
  const now = new Date();
  const pragueNow = new Date(
    now.toLocaleString('en-US', { timeZone: 'Europe/Prague' })
  );

  pragueNow.setDate(pragueNow.getDate() + 1);

  const y = pragueNow.getFullYear();
  const m = String(pragueNow.getMonth() + 1).padStart(2, '0');
  const d = String(pragueNow.getDate()).padStart(2, '0');

  return `${y}-${m}-${d}`;
}

async function readAppData(): Promise<any> {
  if (!dbEnabled()) return null;

  const row = await prisma.appSetting.findUnique({
    where: { key: APP_DATA_KEY },
  });

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

  return {
    host,
    port,
    secure,
    user,
    pass,
    from,
    ready: !!(host && user && pass && from),
  };
}

function absoluteCheckUrl(settings: AnyRecord, reservation: AnyRecord) {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    settings?.rangeUrl ||
    'https://rezervace-strelnice-karlin.vercel.app';

  return `${String(base).replace(/\/$/, '')}/check?id=${encodeURIComponent(
    reservation?.id || ''
  )}`;
}

function reminderText(
  reservation: AnyRecord,
  settings: AnyRecord,
  checkUrl: string
) {
  return `Dobrý den,

připomínáme Vaši rezervaci na zítřejší den.

Služba: ${reservation?.categoryName || ''}
Podslužba: ${reservation?.serviceName || ''}
Datum: ${reservation?.date || ''}
Čas: ${reservation?.time || ''}${reservation?.endTime ? ` – ${reservation.endTime}` : ''}
Jméno: ${reservation?.name || ''}
Adresa: ${settings?.address || 'Střelnice Karlín'}

Detail rezervace:
${checkUrl}

Těšíme se na Vás.
Tým Střelnice Karlín`;
}

function reminderHtml(
  reservation: AnyRecord,
  settings: AnyRecord,
  checkUrl: string
) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;background:#050706;color:#fff;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:720px;margin:0 auto;padding:22px;background:#050706">
    <div style="border:1px solid rgba(156,255,56,.45);border-radius:22px;background:linear-gradient(135deg,#111810,#050706);overflow:hidden">
      <div style="padding:24px 28px;border-bottom:1px solid rgba(255,255,255,.16)">
        <div style="font-size:26px;line-height:1;font-weight:900;letter-spacing:.08em">
          <span style="color:#fff">STŘELNICE</span> <span style="color:#9cff38">KARLÍN</span>
        </div>
        <div style="color:#dfe8d9;letter-spacing:.22em;font-size:12px;margin-top:8px">
          PŘIPOMÍNKA REZERVACE
        </div>
      </div>

      <div style="padding:24px 28px">
        <h1 style="margin:0 0 14px;color:#9cff38;font-size:24px">
          Připomínka rezervace na zítra
        </h1>

        <p style="line-height:1.65;color:#e8eee3;margin:0 0 20px">
          Dobrý den, připomínáme Vaši rezervaci na zítřejší den.
        </p>

        <table role="presentation" style="width:100%;border-collapse:collapse;color:#fff">
          <tr>
            <td style="padding:8px 0;color:#9cff38;font-weight:700;width:140px">Služba:</td>
            <td style="padding:8px 0;color:#fff;font-weight:700">${esc(reservation?.categoryName)}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#9cff38;font-weight:700">Podslužba:</td>
            <td style="padding:8px 0;color:#fff;font-weight:700">${esc(reservation?.serviceName)}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#9cff38;font-weight:700">Datum:</td>
            <td style="padding:8px 0;color:#fff;font-weight:700">${esc(reservation?.date)}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#9cff38;font-weight:700">Čas:</td>
            <td style="padding:8px 0;color:#fff;font-weight:700">${esc(reservation?.time)}${reservation?.endTime ? ` – ${esc(reservation.endTime)}` : ''}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#9cff38;font-weight:700">Jméno:</td>
            <td style="padding:8px 0;color:#fff;font-weight:700">${esc(reservation?.name)}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#9cff38;font-weight:700">Adresa:</td>
            <td style="padding:8px 0;color:#fff;font-weight:700">${esc(settings?.address || 'Střelnice Karlín')}</td>
          </tr>
        </table>

        <div style="height:1px;background:rgba(255,255,255,.18);margin:22px 0"></div>

        <a href="${esc(checkUrl)}" style="display:inline-block;text-align:center;text-decoration:none;border:1px solid #9cff38;color:#9cff38;font-weight:900;padding:14px 18px;border-radius:12px;min-width:210px">
          Zobrazit rezervaci online
        </a>

        <p style="line-height:1.6;color:#e8eee3;margin:22px 0 0">
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
    auth: {
      user: cfg.user,
      pass: cfg.pass,
    },
    tls:
      process.env.SMTP_TLS_REJECT_UNAUTHORIZED === 'false'
        ? { rejectUnauthorized: false }
        : undefined,
  });

  await transporter.sendMail({
    from: cfg.from,
    to,
    subject: 'Připomínka rezervace – Střelnice Karlín',
    text: reminderText(reservation, settings, checkUrl),
    html: reminderHtml(reservation, settings, checkUrl),
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
    const reservations = Array.isArray(data?.reservations)
      ? data.reservations
      : [];

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

    const nextData = {
      ...data,
      updatedAt: new Date().toISOString(),
      reservations: updatedReservations,
    };

    await writeAppData(nextData);

    return NextResponse.json({
      ok: true,
      date: tomorrow,
      sent,
      skipped,
      errors,
      debugReservations: reservations.map((r: any) => ({
        id: r?.id,
        date: r?.date,
        time: r?.time,
        email: r?.email,
        status: r?.status,
        reminderSentAt: r?.reminderSentAt || null,
      })),
    });
  } catch (error: any) {
    console.error('REMINDERS_CRON_ERROR', error);

    return NextResponse.json(
      { ok: false, message: error?.message || 'Reminder cron failed.' },
      { status: 500 }
    );
  }
}
