# SKIS v2.2 – CRM klientů / historie klienta

## Nové
- Rozšířená Karta klienta.
- Historie všech rezervací klienta podle e-mailu nebo telefonu.
- Automatické statistiky klienta:
  - celkem rezervací,
  - odbaveno,
  - čeká,
  - storno,
  - nedorazil,
  - první návštěva,
  - poslední návštěva,
  - odhad celkové útraty,
  - odhad odbavené tržby,
  - průměrná útrata,
  - úspěšnost.
- Automatické hodnocení klienta:
  - spolehlivý,
  - pozor,
  - rizikový,
  - VIP,
  - zakázaný klient.
- Export historie klienta do CSV.
- Přehlednější tabulka historie s cenou, stavem a poznámkou k rezervaci.

## Změněné soubory
- `components/ClientCard.tsx`

## Test plan
1. Otevřít admin.
2. Otevřít libovolnou rezervaci tlačítkem Klient.
3. Zkontrolovat horní statistiky klienta.
4. Zkontrolovat historii rezervací.
5. Označit klienta jako VIP a uložit.
6. Přidat interní poznámku a uložit.
7. Zavřít a znovu otevřít kartu klienta.
8. Vyzkoušet export CSV.

## Známé problémy
- Statistiky jsou odhady podle aktuálně nastavených cen služeb.
- Pokud se historicky změnila cena služby, staré rezervace se přepočítají podle aktuální ceny, dokud nezavedeme samostatný modul Finance.
