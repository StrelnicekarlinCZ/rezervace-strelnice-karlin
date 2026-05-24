# Combat Power – PWA rezervace střelnice

Verze V1.7: profil zákazníka, QR detail rezervace, obrázky podslužeb, text QR kontroly v adminu.

## Spuštění

```bash
npm install
npm run dev
```

Veřejná aplikace: http://localhost:3000

Admin: http://localhost:3000/cp-system nebo dočasně http://localhost:3000/admin

Výchozí heslo prototypu: combatpower


V1.12 FIX:
- Kompletní překlady admin obsahu
- Oprava kroku 3
- Překlad služeb a podslužeb


V1.16:
- silnější automatický překlad hlavních služeb i podslužeb vytvořených v adminu
- doplněné tvary typu taktika střelby / dynamická střelba / statická střelba
- překlad funguje přes přesný slovník + normalizaci + náhradní frázový slovník



## V1.23
- Kompaktní statistiky v adminu.
- Provozní CSV export: služba → podslužba → datum → čas.


## V1.25

Veřejný branding: **STŘELNICE KARLÍN**. Přidány klientské e-mail notifikace s admin editací textů a testovacím odesláním. Pro reálné odesílání nastavte SMTP údaje v `.env.local` podle `.env.example`.


## V1.25b – hotfix spuštění a brandingu

Pokud jste měli v prohlížeči uloženou starší verzi, aplikace při prvním spuštění automaticky přepíše starý branding COMBAT POWER na veřejný název STŘELNICE KARLÍN.

Instalace na čistém PC:

```bash
npm.cmd install --registry=https://registry.npmjs.org/
npm.cmd run dev
```

Pokud by se znovu objevoval starý vzhled, stačí v prohlížeči pro localhost vymazat data webu / Local Storage.

## V1.28a – produkční nasazení

Dokumentace k nasazení je v souboru:

```text
docs/DEPLOY-V1.28a.md
```

Před ostrým spuštěním nastavte `NEXT_PUBLIC_APP_URL`, `DATABASE_URL` a SMTP proměnné na hostingu.
