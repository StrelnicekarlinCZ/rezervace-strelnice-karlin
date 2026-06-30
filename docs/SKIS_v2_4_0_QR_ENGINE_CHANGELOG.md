# SKIS v2.4.0 – QR Engine

## Nové
- Přidán modul QR Check-In.
- Přidán QR Engine pro ruční vložení QR odkazu, ID rezervace nebo USB QR čtečku.
- Přidána komponenta `QrCheckIn.tsx`.
- Přidána komponenta `QrResultCard.tsx`.
- Přidána záložka `📷 QR Check-In` v administraci.

## Kontroly
QR Engine kontroluje:
- rezervace neexistuje,
- rezervace je na jiný den,
- rezervace je stornovaná,
- rezervace je označená jako nedorazil,
- rezervace už byla odbavena,
- zakázaný klient,
- platná rezervace připravená k odbavení.

## Test plan
1. Otevřít administraci.
2. Přepnout na `📷 QR Check-In`.
3. Vložit existující ID rezervace.
4. Vložit celý odkaz ve formátu `/check?id=...`.
5. Ověřit nalezení rezervace.
6. Ověřit otevření karty klienta.
7. Ověřit odbavení.
8. Ověřit blokaci stornované / no-show / již odbavené rezervace.
9. Ověřit chybu při neexistujícím ID.

## Poznámka
Kamera bude navazovat ve verzi SKIS v2.4.1. QR Engine je připraven tak, aby bylo možné doplnit kameru bez přepisování logiky odbavení.
