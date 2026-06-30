# SKIS v2.3.0 – Denní provoz

## Stav
VERIFIED RELEASE – připraveno k nasazení nad aktuální verzí SKIS v2.2.2.

## Nové
- Přidán provozní panel `OperationsDashboard`.
- Přehled dnešních rezervací v časové ose.
- Fronta příjezdů na následujících 60 minut.
- Upozornění na VIP, zakázané klienty, rizikové klienty a chybějící kontakty.
- Rychlé akce přímo z provozního panelu: Klient, Odbavit, OK, Nedorazil, Storno.
- Denní souhrn rezervací, odbavení, storen a odhadované tržby.

## Soubory
- `components/OperationsDashboard.tsx`
- `app/admin/page.tsx`

## Test plan
1. Otevřít administraci.
2. Zkontrolovat panel Denní provoz.
3. Zkontrolovat dnešní časovou osu.
4. Kliknout na Klient u rezervace.
5. Odbavit rezervaci z panelu.
6. Označit Nedorazil a Storno.
7. Ověřit, že se změny projeví i v tabulce rezervací.
8. Zkontrolovat modul Klienti a kartu klienta.

## Známé poznámky
- QR Check-in není součástí této verze. Přijde jako samostatný release.
