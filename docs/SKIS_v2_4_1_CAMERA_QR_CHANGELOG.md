# SKIS v2.4.1 – Kamera pro QR Check-In

## Nové
- Přidána kamera přímo do modulu QR Check-In.
- QR lze načíst kamerou bez ručního opisování ID.
- Podporuje QR odkazy typu `/check?id=SK-...` i samotné ID rezervace.
- Po načtení QR se automaticky vyplní QR vstup a spustí vyhledání rezervace.
- Přidáno tlačítko **Zapnout kameru** / **Vypnout kameru**.
- Přidán vizuální rámeček pro zaměření QR kódu.

## Technické poznámky
- Řešení používá nativní Browser BarcodeDetector API.
- Není potřeba instalovat žádnou novou npm knihovnu.
- Nejlépe funguje v Chrome / Edge.
- Pokud prohlížeč kamerové QR čtení nepodporuje, zůstává funkční ruční vložení a USB čtečka.

## Soubory
- `components/QrCheckIn.tsx`

## Testovací scénář
1. Otevřít administraci.
2. Přepnout na **QR Check-In**.
3. Otestovat ruční vložení ID rezervace.
4. Kliknout na **Zapnout kameru**.
5. Povolit kameru v prohlížeči.
6. Naskenovat QR kód s odkazem `/check?id=...`.
7. Ověřit, že se najde správná rezervace.
8. Otestovat tlačítko **Odbavit**.
