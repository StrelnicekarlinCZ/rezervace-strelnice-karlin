# Combat Power Rezervace — specifikace V1

## Stav této verze
Tato verze je funkční lokální prototyp PWA aplikace. Klikání už funguje:

1. Domů
2. Výběr služby
3. Výběr data
4. Výběr času
5. Kontaktní formulář
6. Potvrzení rezervace
7. Moje rezervace
8. Admin panel `/admin`

Rezervace se zatím ukládají do `localStorage` prohlížeče. To je vhodné pro ověření UX a designu, ne pro ostrý provoz.

## Cíl ostré verze
Vytvořit samostatnou mobilní PWA aplikaci pro rezervaci hodin na střelnici. Aplikace bude dostupná přes QR kód a odkaz, například `rezervace.combat-power.cz`.

## Zákaznická část
- Úvodní obrazovka
- Výběr služby
- Výběr data
- Výběr volného času
- Zadání jména, telefonu, e-mailu a poznámky
- Potvrzení rezervace
- Moje rezervace

## Admin část
- Přehled rezervací podle dne
- Detail kontaktu zákazníka
- Zrušení rezervace
- Testovací blokace časů

## Další vývoj
1. Napojení na PostgreSQL databázi
2. API pro reálné ukládání rezervací
3. Transakční ochrana proti dvojité rezervaci
4. Přihlášení admina
5. E-mailové potvrzení zákazníkovi a provozovateli
6. Nastavení služeb, cen, otevírací doby a střeleckých stavů
7. Nasazení na `rezervace.combat-power.cz`

## V1.4 poznámky
- Služby mají volitelný obrázek pozadí nahraný v admin panelu. V prototypu se ukládá do localStorage jako Data URL.
- Přepínač jazyků je připravený v UI. Reálné překlady textů budou další krok.
- Admin panel je skrytý z veřejného menu a chráněný heslem v prototypu. Výchozí heslo: `combatpower`. V ostré verzi musí být heslo hashované na serveru a přístup řešený přes session/cookie.
- E-mail po vytvoření rezervace je připraven jako požadavek pro backend. V ostré verzi se odešle přes vlastní SMTP server, například e-mail u domény. SMS zdarma obecně spolehlivě neexistuje; bezplatná alternativa je e-mail, případně později WhatsApp/Telegram/push notifikace nebo placená SMS brána.
