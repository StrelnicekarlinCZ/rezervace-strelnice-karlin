# V1.8 – pravidla rezervací + detail + nový flow

Přidáno:
- Varianta A proti zneužití rezervací:
  - max. aktivních rezervací na jeden kontakt,
  - storno limit v hodinách,
  - evidence statusu rezervace: potvrzeno / storno / nedorazil,
  - blokace online rezervace po překročení no-show limitu,
  - příprava na e-mailové ověření.
- Upravené rezervační kroky:
  - krok 1 hlavní služba automaticky pokračuje,
  - krok 2 konkrétní služba automaticky pokračuje,
  - krok 3 datum + volný čas v roleru/selectu,
  - krok 4 kontrola rezervace + údaje + tlačítko Rezervovat.
- Detail rezervace:
  - opravené zaoblení obrázku,
  - sdílení karty přes systémové sdílení,
  - odkaz pro WhatsApp,
  - QR kód obsahuje rezervační data a admin text.
- Admin:
  - nastavení limitů rezervací,
  - nastavení storno limitu,
  - nastavení no-show limitu,
  - přepínač přípravy e-mailového ověření,
  - tlačítka pro stav rezervace: OK / Nedorazil / Storno.

Poznámka:
- V prototypu se data stále ukládají lokálně do prohlížeče.
- Pro produkci bude další krok napojení na databázi a reálné ověření e-mailu.
