# V1.23 – Admin statistiky + provozní CSV export

## Opraveno
- Statistická okna v adminu jsou menší a vejdou se vedle sebe.
- CSV den i CSV celkem se generují skutečně z aktuálních dat.

## CSV řazení
Export je řazen podle:
1. hlavní služba / kategorie,
2. podslužba,
3. datum konání rezervace,
4. čas konání rezervace,
5. jméno klienta.

## CSV struktura
Každá hlavní služba má vlastní blok:
- služba
- datum
- od
- do
- podslužba
- jméno
- telefon
- email
- číslo rezervace
- stav
