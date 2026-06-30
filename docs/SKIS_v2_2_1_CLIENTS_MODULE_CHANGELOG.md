# SKIS v2.2.1 – Modul Klienti

Status: VERIFIED RELEASE

## Nové
- Přidán modul `Klienti` do administrace.
- Přehled všech klientů z databáze i dopočítaných kontaktů z rezervací.
- Vyhledávání podle jména, telefonu, e-mailu, ID a poznámky.
- Filtry: všichni, VIP, rizikoví, zakázaní, bez rezervace.
- Statistiky klientů: počet klientů, VIP, rizikoví, noví tento měsíc, průměrná útrata.
- Export klientů do CSV a JSON.
- Otevření Karty klienta přímo ze seznamu klientů.

## Změněné soubory
- `app/admin/page.tsx`
- `components/ClientsModule.tsx`

## Test plan
1. Otevřít admin.
2. Přepnout na `👥 Klienti`.
3. Ověřit načtení seznamu klientů.
4. Vyzkoušet vyhledávání podle jména, e-mailu a telefonu.
5. Vyzkoušet filtry VIP / Rizikoví / Zakázaní.
6. Kliknout na `Karta` a ověřit otevření ClientCard.
7. Upravit poznámku/VIP v kartě klienta a uložit.
8. Vrátit se do modulu Klienti a zkontrolovat promítnutí změny.
9. Otestovat export CSV/JSON.
10. Přepnout zpět na Dashboard / Rezervace.

## Známé limity
- Klienti, kteří existují pouze v rezervacích a ne v `appData.clients`, jsou v modulu zobrazeni dočasně dopočítaně. Po otevření karty a uložení se uloží jako plnohodnotný klient.
- Sloučení duplicit klientů je plánováno do některé z dalších verzí.
