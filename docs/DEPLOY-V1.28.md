# V1.28 – deploy na hosting, ostrá doména, HTTPS, produkční PWA

Tato verze je připravená pro nasazení na produkční doménu, například:

```text
https://rezervace.strelnice-karlin.cz
```

## 1. Co musí hosting umět

Hosting musí podporovat:

- Node.js aplikaci,
- Next.js server,
- běh příkazu `npm run build`,
- dlouhodobý běh procesu `npm run start`,
- PostgreSQL databázi,
- HTTPS certifikát.

Pokud hosting neumí Node.js/Next.js aplikace, bude potřeba buď VPS / Node hosting, nebo deploy přes službu typu Vercel/Render/Railway a doménu na ni nasměrovat.

## 2. Produkční proměnné prostředí

Na hostingu nastavte minimálně:

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://rezervace.strelnice-karlin.cz
DATABASE_URL=postgresql://UZIVATEL:HESLO@HOST:5432/DATABAZE?schema=public

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=CombatPowerCZ@gmail.com
SMTP_PASS=APLIKACNI_HESLO_Z_GOOGLE
SMTP_FROM=STŘELNICE KARLÍN <CombatPowerCZ@gmail.com>
```

SMTP heslo má být **aplikační heslo**, ne běžné heslo do Gmailu.

## 3. Lokální kontrola před nahráním

V terminálu ve složce projektu:

```powershell
npm.cmd install --registry=https://registry.npmjs.org/
npx prisma generate
npm.cmd run build
```

Pokud používáte produkční PostgreSQL už při testu:

```powershell
npx prisma migrate deploy
```

## 4. Nasazení na server

Na server nahrajte projekt bez složky `node_modules` a spusťte:

```bash
npm install --registry=https://registry.npmjs.org/
npx prisma generate
npx prisma migrate deploy
npm run build
npm run start
```

Aplikace standardně poběží na portu 3000. Hosting/reverzní proxy pak nasměruje doménu na tento port.

## 5. HTTPS

HTTPS se nastavuje na úrovni hostingu/domény. Po zapnutí HTTPS musí aplikace používat produkční URL:

```env
NEXT_PUBLIC_APP_URL=https://rezervace.strelnice-karlin.cz
```

Tato adresa se používá v QR kódech, emailech a odkazech na rezervaci.

## 6. Produkční PWA kontrola

Po nasazení otevřete doménu v mobilu a ověřte:

- stránka běží přes HTTPS,
- v prohlížeči je nabídka „Přidat na plochu“,
- ikona aplikace se zobrazí správně,
- splash / úvodní vzhled odpovídá brandingu,
- QR odkaz vede na ostrou doménu,
- service worker se načte bez chyby.

## 7. Email kontrola

V administraci:

1. otevřete SMTP sekci,
2. ověřte odesílatele `STŘELNICE KARLÍN <CombatPowerCZ@gmail.com>`,
3. odešlete testovací e-mail,
4. zkontrolujte logo v hlavičce.

V1.28 opravuje logo mostu v emailové hlavičce: střecha je vycentrovaná nad čtyřmi oblouky.

## 8. Produkční checklist

Před ostrým spuštěním:

- [ ] změnit výchozí admin heslo,
- [ ] nastavit ostrou adresu střelnice,
- [ ] nastavit kontaktní telefon a email,
- [ ] vyčistit testovací rezervace,
- [ ] ověřit PostgreSQL připojení,
- [ ] odeslat testovací email,
- [ ] vytvořit testovací rezervaci,
- [ ] ověřit QR check stránku,
- [ ] zkontrolovat PWA instalaci na mobilu.
