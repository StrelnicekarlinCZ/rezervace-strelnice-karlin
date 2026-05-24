import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  // V ostré PostgreSQL verzi zde podle qrToken/publicCode najdeme rezervaci
  // a atomicky ji přepneme na status checked_in.
  return NextResponse.json({ ok: true, mode: 'demo', checkedIn: body });
}
