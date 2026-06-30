# SKIS v3.0.2 – Public Data API

## Typ
Hotfix navazující na SKIS v3.0.1.

## Opraveno
- Veřejná rezervační stránka už nevolá chráněné `/api/app-data`.
- Přidán veřejný read-only endpoint `/api/public-data`.
- Endpoint vrací pouze veřejná data: `settings`, `categories`, `blocked`, `laneBlocks`.
- Nevrací klienty ani interní CRM data.
- Ceny služeb ve veřejném rozhraní se načítají z databáze po uložení v adminu.

## Test
1. Admin → změň cenu služby.
2. Klikni `Uložit vše`.
3. Otevři veřejnou rezervaci v anonymním okně nebo po Ctrl+F5.
4. Cena musí odpovídat adminu.
