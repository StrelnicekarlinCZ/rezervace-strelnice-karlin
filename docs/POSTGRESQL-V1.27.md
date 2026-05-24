# PostgreSQL nastavení – V1.27

## Pro lokální test

Aplikace běží i bez databáze. Pokud není nastavená proměnná `DATABASE_URL`, používá se lokální fallback.

## Pro ostrou databázi

Do `.env.local` nebo do hostingu doplňte:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public"
```

Pak spusťte:

```bash
npx prisma generate
npx prisma db push
npm.cmd run dev
```

## Co se ukládá

- nastavení provozu,
- SMTP nastavení,
- služby a podslužby,
- blokace termínů,
- rezervace.

## Proč JSON mezivrstva

Je to bezpečný krok, aby aplikace okamžitě získala persistentní ukládání bez rizika rozbití současného UI.
Relační tabulky jsou už připravené ve `prisma/schema.prisma` pro další fázi.
