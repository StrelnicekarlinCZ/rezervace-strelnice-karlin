import { NextResponse } from 'next/server';
import type { Client, Reservation } from '../../../types/skis';
import { readAppData, writeAppData, normalizeAppData } from '../../../lib/skisAppData';
import { normalizeEmail, normalizePhone, upsertClientFromReservation } from '../../../lib/skisClient';
import { activeLaneBlockConflict } from '../../../lib/skisLane';
import { hasReservationConflict } from '../../../lib/skisReservation';
import { dbEnabled } from '../../../lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = normalizeAppData(await readAppData());

    return NextResponse.json({
      ok: true,
      mode: dbEnabled() ? 'postgresql' : 'local',
      reservations: data.reservations,
    });
  } catch (error: any) {
    console.error('RESERVATIONS_GET_ERROR', error);
    return NextResponse.json(
      { ok: false, message: error?.message || 'Reservation load failed', reservations: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const reservation = (await request.json()) as Reservation;
    const data = normalizeAppData(await readAppData());

    const reservations = data.reservations;
    const clients = data.clients as Client[];
    const laneBlocks = data.laneBlocks;
    const settings = data.settings || {};

    const maxActiveReservations = Number((settings as any)?.maxActiveReservations || 0);
    const reservationEmail = normalizeEmail(reservation?.email);
    const reservationPhone = normalizePhone(reservation?.phone);

    if (maxActiveReservations > 0 && (reservationEmail || reservationPhone)) {
      const today = new Date().toISOString().slice(0, 10);
      const activeForContact = reservations.filter(r => {
        const status = r?.status || 'confirmed';
        if (status !== 'confirmed') return false;
        if (String(r?.date || '') < today) return false;
        const sameEmail = reservationEmail && normalizeEmail(r?.email) === reservationEmail;
        const samePhone = reservationPhone && normalizePhone(r?.phone) === reservationPhone;
        return sameEmail || samePhone;
      });

      if (activeForContact.length >= maxActiveReservations) {
        return NextResponse.json(
          { ok: false, message: `Na tento kontakt už existuje maximální počet aktivních rezervací (${maxActiveReservations}).` },
          { status: 409 }
        );
      }
    }

    const laneConflict = activeLaneBlockConflict(laneBlocks, reservation);
    if (laneConflict) {
      return NextResponse.json(
        {
          ok: false,
          message: laneConflict?.offline
            ? `Střelecký stav ${laneConflict.lane || ''} je v tomto čase mimo provoz.`
            : `Střelecký stav ${laneConflict.lane || ''} je v tomto čase ručně obsazený.`,
        },
        { status: 409 }
      );
    }

    if (hasReservationConflict(reservations, reservation)) {
      return NextResponse.json({ ok: false, message: 'Termín je již obsazený.' }, { status: 409 });
    }

    const nextReservations = [reservation, ...reservations.filter(r => r?.id !== reservation?.id)];
    const nextClients = upsertClientFromReservation(clients, reservation);

    const next = {
      ...data,
      version: '3.0',
      updatedAt: new Date().toISOString(),
      reservations: nextReservations,
      clients: nextClients,
      laneBlocks,
    };

    await writeAppData(next);

    return NextResponse.json(
      {
        ok: true,
        mode: dbEnabled() ? 'postgresql' : 'local',
        reservation,
        clientCount: nextClients.length,
        saved: dbEnabled(),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('RESERVATIONS_POST_ERROR', error);
    return NextResponse.json(
      { ok: false, message: error?.message || 'Reservation save failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ ok: false, message: 'Missing reservation id.' }, { status: 400 });
    }

    const data = normalizeAppData(await readAppData());
    const nextReservations = data.reservations.filter(r => r?.id !== id);

    const next = {
      ...data,
      version: '3.0',
      updatedAt: new Date().toISOString(),
      reservations: nextReservations,
    };

    await writeAppData(next);

    return NextResponse.json({ ok: true, deletedId: id, remaining: nextReservations.length });
  } catch (error: any) {
    console.error('RESERVATIONS_DELETE_ERROR', error);
    return NextResponse.json(
      { ok: false, message: error?.message || 'Reservation delete failed' },
      { status: 500 }
    );
  }
}
