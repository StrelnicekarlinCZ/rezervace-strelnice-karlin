# Instalace SKIS v3.0

Nahraj soubory podle struktury složek v balíčku.

## Nové soubory
Vytvoř / nahraj:

```text
types/skis.ts
lib/skisAppData.ts
lib/skisTime.ts
lib/skisClient.ts
lib/skisLane.ts
lib/skisReservation.ts
lib/skisFormat.ts
```

## Přepsat
Přepiš:

```text
app/api/reservations/route.ts
app/api/lane-blocks/route.ts
```

## Volitelné bezpečné přepsání současnými soubory
Balíček obsahuje i aktuální komponenty a `app/admin/page.tsx` pro sjednocení stavu. Pokud už je máš stejné a vše běží, nemusíš je nutně přehrávat.

```text
app/admin/page.tsx
components/LiveRange.tsx
components/RangeLaneCard.tsx
components/ClientCard.tsx
components/QrCheckIn.tsx
components/QrResultCard.tsx
components/ClientsModule.tsx
components/OperationsDashboard.tsx
```

## Po nasazení
Commit → Vercel build → otestovat podle changelogu.
