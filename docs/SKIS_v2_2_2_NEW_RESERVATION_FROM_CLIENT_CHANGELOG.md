# SKIS v2.2.2 – Nová rezervace z karty klienta

## Typ release
VERIFIED RELEASE – funkční rozšíření CRM.

## Nové funkce
- V kartě klienta přidáno tlačítko **Nová rezervace**.
- Rezervace se vytváří přímo z klienta s předvyplněným jménem, telefonem a e-mailem.
- Obsluha vybírá datum, čas, hlavní službu a podslužbu.
- Čas konce se dopočítá automaticky podle délky podslužby.
- Rezervace se ukládá přes existující API `/api/reservations`.
- Po vytvoření se admin přepne zpět na rezervace a nastaví datum nové rezervace.

## Upravené soubory
- `components/ClientCard.tsx`
- `app/admin/page.tsx`

## Test plan
1. Otevřít administraci.
2. Otevřít modul Klienti.
3. Otevřít kartu libovolného klienta.
4. Kliknout na **Nová rezervace**.
5. Vybrat datum, čas, službu a podslužbu.
6. Kliknout na **Vytvořit rezervaci**.
7. Ověřit, že se rezervace objeví v kalendáři.
8. Ověřit, že jméno, telefon a e-mail klienta jsou správně propsané.
9. Ověřit konflikt obsazeného termínu.
10. Ověřit limit aktivních rezervací na kontakt.

## Poznámky
- Funkce zatím nevytváří veřejný rezervační formulář s předvyplněnými údaji. Rezervace se vytváří přímo v administraci.
- E-mailové potvrzení se v této verzi automaticky neodesílá; cílem je nejdříve stabilně vytvořit rezervaci z karty klienta.
