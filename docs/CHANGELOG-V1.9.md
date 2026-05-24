# V1.9 – sdílení, QR kontrola, DB/email základ

## Přidáno
- Detail rezervace má jen kopírovatelný odkaz a sdílení: e-mail, WhatsApp, Signal, Facebook, Instagram.
- QR kód vede na kontrolní stránku `/check?id=...`.
- Kontrolní stránka umí zobrazit rezervaci a lokálně označit příchod jako odbavený.
- Připravené API skeletony: `/api/checkin`, `/api/email`.
- Rozšířené PostgreSQL Prisma schéma: kategorie, podslužby, zákazníci, rezervace, QR token, check-in, e-mail log.
- `.env.example` pro databázi a SMTP.

## Poznámka
Lokální demo stále používá `localStorage`, aby šlo rychle testovat bez serveru a databáze. Produkční PostgreSQL napojení je připravené ve schématu a API, ale finální přepnutí na serverové ukládání bude samostatný krok, aby se nerozbila současná klikací verze.
