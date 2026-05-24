# V1.25 – Střelnice Karlín Branding + e-mail notifikace

## Hotovo
- Veřejný název aplikace změněn na **STŘELNICE KARLÍN**.
- Ponechán interní technický základ projektu COMBAT POWER.
- Ikona zámku v horní části nahrazena zeleným logem střelnice.
- Výchozí hero text zaměřen na pistolovou střelbu.
- Úvodní boxy zjednodušeny na jednu vycentrovanou kartu **Bezpečnost**.
- Po vytvoření rezervace se automaticky volá `/api/email`.
- Admin může upravit:
  - odesílací e-mail,
  - předmět potvrzení,
  - úvodní text e-mailu,
  - závěrečný text e-mailu,
  - zapnutí/vypnutí přílohy.
- Přidáno tlačítko **Odeslat test** v adminu.

## E-mail režimy
- Bez SMTP údajů aplikace běží v demo režimu a e-mail pouze připraví do serverové konzole.
- Po doplnění SMTP údajů do `.env.local` odešle skutečný e-mail klientovi.

## Poznámka k příloze
Aktuálně je příloha připravena jako HTML karta rezervace. Skutečné PDF generování doporučuji jako další verzi V1.26, protože pro ostrý provoz bude lepší napojit serverovou PDF knihovnu a QR přímo do PDF.
