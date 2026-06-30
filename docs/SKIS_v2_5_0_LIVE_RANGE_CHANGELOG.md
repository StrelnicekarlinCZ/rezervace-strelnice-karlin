# SKIS v2.5.0 – Live Shooting Range

## Nové
- Přidán modul 🎯 Live Range do administrace.
- Přidán živý přehled střeleckých stavů.
- Volný stav je zelený, obsazený červený.
- Stav připravený do 15 minut je žlutý.
- VIP stav je modrý.
- Přidán odpočet času do konce rezervace / začátku rezervace.
- Přidán souhrn: volné, obsazené, připravené, VIP, odhad tržby.
- Přidány rychlé akce: Klient, Odbavit, Nedorazil, Storno.

## Soubory
- components/LiveRange.tsx
- components/RangeLaneCard.tsx
- app/admin/page.tsx

## Test plan
1. Otevřít administraci.
2. Kliknout na 🎯 Live Range.
3. Ověřit zobrazení stavů.
4. Ověřit zelené volné stavy.
5. Ověřit červené obsazené stavy při aktuální rezervaci.
6. Ověřit otevření karty klienta ze stavu.
7. Ověřit tlačítka Odbavit / Nedorazil / Storno.
8. Vrátit se do Rezervací a ověřit, že původní funkce zůstaly zachované.
