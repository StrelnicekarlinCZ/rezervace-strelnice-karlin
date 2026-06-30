# SKIS v3.0.1 – Data Synchronization Hotfix

## Typ
Stabilizační hotfix navazující na SKIS v3.0 Stable.

## Opraveno
- Veřejná rezervační stránka už bere služby a ceny primárně z `/api/app-data`.
- `localStorage` je nově jen fallback, ne hlavní zdroj pravdy.
- Po načtení serverových dat se aktuální `categories`, `settings`, `reservations` a `blocked` uloží zpět do lokální cache.
- Veřejná část používá `fetch(..., { cache: 'no-store' })`, aby se netahala stará cache.
- Veřejná rezervace už nepřepisuje `/api/app-data` neúplným payloadem.
- Uložení rezervace nově respektuje odpověď `/api/reservations`; při chybě se už nezobrazí falešné potvrzení.

## Test
1. V adminu změň cenu služby.
2. Klikni na `Uložit vše`.
3. Otevři veřejnou rezervační stránku.
4. Vyber stejnou službu.
5. Cena musí odpovídat adminu.
6. Vytvoř testovací rezervaci a ověř, že se uloží.
