# SKIS v2.4.2 – QR UX Polish

## Změněný soubor
- `components/QrCheckIn.tsx`

## Novinky
- Zvuková odezva pro úspěšné načtení / upozornění / chybu.
- Přepínač zvuku ON/OFF.
- Volitelný režim „Auto odbavit“.
- Přepnutí kamery mezi zadní/externí a přední.
- Lepší hlášky pro obsluhu.
- Barevné zvýraznění výsledku validace.
- Ochrana proti opakovanému načtení stejného QR.

## Test
1. QR Check-In → ručně vložit ID rezervace.
2. QR Check-In → vložit celý `/check?id=...` odkaz.
3. Zapnout kameru a načíst QR.
4. Vyzkoušet Zvuk ON/OFF.
5. Vyzkoušet Přepnout kameru.
6. Vyzkoušet Auto odbavit jen na platné dnešní rezervaci.
7. Ověřit storno / no-show / již odbaveno.
