# SKIS Core 1.0.3 – AdminDashboard

## Typ změny
Refactoring / architektura.

## Nové soubory
- `components/AdminDashboard.tsx`

## Upravené soubory
- `app/admin/page.tsx`

## Změny
- Oddělen horní dashboard administrace do samostatné komponenty.
- Přesunuty denní statistiky, měsíční statistiky a statistiky služeb.
- `app/admin/page.tsx` je menší a přehlednější.

## Funkční změny
- Žádné plánované změny chování aplikace.
- Vzhled a funkce statistik mají zůstat stejné.

## Test plan
1. Otevřít administraci.
2. Ověřit zobrazení denních statistik.
3. Ověřit zobrazení měsíčních statistik.
4. Ověřit tabulku Statistiky služeb.
5. Ověřit, že stále funguje vyhledávání rezervací.
6. Ověřit, že stále funguje tabulka rezervací a Karta klienta.
7. Ověřit, že build na Vercelu projde do stavu Ready.

## Stav
Ready for test.
