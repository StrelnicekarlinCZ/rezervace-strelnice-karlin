# V1.26b – SMTP Admin Panel + Test Email Button

- Přidán viditelný SMTP panel přímo v administraci.
- Přidána pole SMTP server, port, SSL/STARTTLS, uživatel, heslo a odesílatel.
- Přidáno výrazné tlačítko „Odeslat testovací e-mail“.
- Testovací e-mail používá HTML šablonu, QR kód a PDF kartu rezervace.
- API /api/email nově umí použít SMTP údaje z administrace pro lokální test.
- V produkci zůstává možnost bezpečnější konfigurace přes ENV proměnné.
