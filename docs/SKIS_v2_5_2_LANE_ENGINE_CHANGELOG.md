# SKIS v2.5.2 – Lane Reservation Engine

## Typ
Stabilizační / provozní release navazující na SKIS v2.5.1.

## Co se mění

### Live Range
- Ruční obsazení stavu už není pouze vizuální údaj.
- Ruční obsazení vytváří interní blokaci `laneBlock`.
- Stav „Mimo provoz“ vytváří interní blokaci `laneBlock`.
- Aktivní blokace se ukládají na server přes `/api/lane-blocks`.
- Lokální fallback zůstává zachovaný přes `localStorage`.
- Přidána informace o času blokace přímo na kartě stavu.
- Opraveno přetékání polí Instruktor / Poznámka mimo kartu.

### API rezervací
- `POST /api/reservations` nově kontroluje interní blokace střeleckých stavů.
- Pokud je čas krytý ruční blokací nebo stavem mimo provoz, rezervace se neuloží a API vrátí `409`.

### Nové API
- Přidán endpoint `/api/lane-blocks`.
- Slouží pro načtení a uložení interních blokací střeleckých stavů.

## Testovací scénář
1. Otevři Admin → Live Range.
2. U volného stavu klikni „Ručně obsadit“.
3. Zadej jméno a délku blokace.
4. Zkontroluj, že karta zčervená a zobrazuje čas blokace.
5. Zkus vytvořit rezervaci ve stejném čase.
6. API musí rezervaci odmítnout.
7. Klikni „Uvolnit“ a ověř, že se blokace odstraní.
8. U jiného stavu klikni „Mimo provoz“.
9. Zadej konečný čas a ověř, že se stav zablokuje.
10. Po refreshi musí blokace zůstat zachovaná.

## Poznámka
`app/admin/page.tsx` není potřeba měnit. Stačí přidat nové API a přepsat komponenty LiveRange a RangeLaneCard.
