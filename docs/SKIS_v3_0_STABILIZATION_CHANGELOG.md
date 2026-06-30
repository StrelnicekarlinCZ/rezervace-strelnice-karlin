# SKIS v3.0 – Stabilization Release

## Typ release
Stabilizační release bez nové velké funkce.

## Hlavní změny
- Přidán společný typový základ `types/skis.ts`.
- Přidány sdílené helpery v `lib/`:
  - `skisAppData.ts`
  - `skisTime.ts`
  - `skisClient.ts`
  - `skisLane.ts`
  - `skisReservation.ts`
  - `skisFormat.ts`
- Stabilizováno API rezervací.
- Stabilizováno API blokací střeleckých stavů.
- Zachována současná funkční administrace a komponenty.
- Live Range zůstává kompatibilní s Lane Reservation Engine.

## Důležité
Tato verze je připravená jako bezpečný základ pro další refaktor. Neprovádí agresivní přepis celé administrace, aby se minimalizovalo riziko regresí.

## Testovací scénář
1. Build na Vercelu musí projít.
2. Admin se musí otevřít.
3. Rezervace musí jít zobrazit.
4. Klienti musí jít otevřít.
5. QR Check-In musí najít rezervaci.
6. Live Range musí zobrazit stavy.
7. Ruční obsazení stavu musí vytvořit blokaci.
8. Nová rezervace ve stejném čase musí být odmítnuta.
9. Mimo provoz musí blokovat rezervaci.
10. Odbavení / Nedorazil / Storno musí fungovat.

## Doporučený další krok
SKIS v3.1 – postupný refaktor komponent tak, aby začaly používat společné typy a helpery z v3.0.
