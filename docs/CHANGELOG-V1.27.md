# V1.27 – PostgreSQL + persistentní data + email logo fix

## Hlavní změny

- Opravené logo v hlavičce potvrzovacího e-mailu.
  - SVG obrázek v e-mailu byl nahrazen stabilní HTML verzí loga.
  - Cíl: Gmail a další klienti už logo nedeformují.

- Přidán základ produkční persistence přes PostgreSQL + Prisma.
  - Nový `lib/prisma.ts`.
  - Nový API endpoint `/api/app-data`.
  - Upravený API endpoint `/api/reservations`.
  - Admin při uložení posílá nastavení/služby/rezervace/blokace také na server.
  - Klient po startu zkouší načíst data z PostgreSQL a až potom používá lokální fallback.
  - Při vytvoření rezervace se rezervace zkusí uložit do serverového úložiště.

## Lokální režim

Bez `DATABASE_URL` aplikace dál funguje stejně jako předtím přes lokální data v prohlížeči.
To znamená, že lokální testování zůstává jednoduché.

## Produkční režim

Po nastavení PostgreSQL je potřeba doplnit do `.env.local` nebo produkčního prostředí:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public"
```

Potom spustit:

```bash
npx prisma generate
npx prisma db push
npm.cmd run dev
```

## Poznámka

V1.27 používá bezpečný mezikrok: všechna data aplikace se ukládají jako produkční JSON do tabulky `AppSetting` pod klíčem `appData`.
Je to stabilní přechod mezi lokálním prototypem a plně relační databází.
V další verzi lze postupně převést rezervace, služby a zákazníky do samostatných relačních tabulek.
