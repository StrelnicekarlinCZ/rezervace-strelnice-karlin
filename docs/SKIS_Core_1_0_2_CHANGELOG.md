# SKIS Core 1.0.2 – ReservationTable Refactor

## Změny
- Přidána komponenta `components/ReservationTable.tsx`.
- Přidána komponenta `components/ReservationRow.tsx`.
- Přidána komponenta `components/ReservationActions.tsx`.
- `app/admin/page.tsx` nyní používá komponentu `ReservationTable` místo vložené tabulky rezervací.
- Funkce tabulky rezervací zůstávají stejné: Klient, OK, Odbaveno, Nedorazil, Storno, Smazat.

## Test Plan
1. Otevřít administraci.
2. Ověřit zobrazení tabulky rezervací.
3. Ověřit filtrování podle data.
4. Ověřit vyhledávání rezervace.
5. Kliknout na `Klient` a otevřít kartu klienta.
6. Změnit stav rezervace na OK / Odbaveno / Nedorazil / Storno.
7. Smazat testovací rezervaci.
8. Obnovit stránku a ověřit, že změny drží.

## Známé problémy
- Žádné nové známé problémy.
