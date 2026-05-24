# V1.26 – SMTP e-maily

## Lokální test

1. Zkopírujte `.env.example` jako `.env.local`.
2. Doplňte SMTP údaje od hostingu/domény.
3. Restartujte aplikaci:

```powershell
npm.cmd run dev
```

4. V administraci použijte tlačítko **Odeslat test**.
5. Potom vytvořte testovací rezervaci na klientské straně.

## Důležité

- Pokud SMTP není vyplněné, aplikace jede v demo režimu a e-mail fyzicky neodešle.
- Pro ostrý provoz musí být nastaveno `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.
- `NEXT_PUBLIC_APP_URL` je při lokálním testu `http://localhost:3000`; v produkci bude doména rezervační aplikace.
