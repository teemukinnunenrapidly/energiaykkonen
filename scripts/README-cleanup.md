# Käyttämättömien taulujen poistoskriptit

Tämä kansio sisältää skriptit käyttämättömien tietokantataulujen poistamiseen.

## Analyysi

Tietokantaan löytyi 11 taulua, joita ei käytetä koodikannassa:

1. **analytics_events** - 11 riviä dataa, ei käytetä
2. **data_retention_log** - tyhjä taulu, ei käytetä
3. **visual_assets** - tyhjä taulu, ei käytetä
4. **visual_object_views** - tyhjä taulu, ei käytetä
5. **card_calculations** - tyhjä taulu, ei käytetä
6. **form_sessions** - tyhjä taulu, ei käytetä
7. **form_calculations** - tyhjä taulu, ei käytetä
8. **formula_lookups** - 2 riviä dataa, ei käytetä
9. **formula_lookup_conditions** - 5 riviä dataa, ei käytetä
10. **session_calculations_backup** - 2 riviä dataa, ei käytetä
11. **themes** - 1 rivi dataa, ei käytetä

## Skriptit

### 1. `cleanup-unused-tables.sql`
**Suorita:** Supabase SQL Editor
**Kuvaus:** Suora poistoskripti, joka poistaa kaikki käyttämättömät taulut välittömästi.

### 2. `cleanup-unused-tables-safe.sql`
**Suorita:** Supabase SQL Editor
**Kuvaus:** Turvallinen versio, joka:
- Tarkistaa taulujen olemassaolon ja rivimäärät
- Tarkistaa foreign key -riippuvuudet
- Varmistaa, että tärkeät taulut ovat olemassa
- Vaatii manuaalisen kommenttien poistamisen ennen poistamista

### 3. `supabase-migrations/20241228_cleanup_unused_tables.sql`
**Suorita:** Supabase CLI tai migraatiojärjestelmä
**Kuvaus:** Migraatio, joka voidaan suorittaa Supabase migraatiojärjestelmän kautta.

## Suositus

**Käytä `cleanup-unused-tables-safe.sql`** ensimmäisenä:
1. Suorita skripti Supabase SQL Editorissa
2. Tarkista tulokset
3. Jos kaikki näyttää hyvältä, poista kommentit poistoskriptistä
4. Suorita uudelleen

## Tärkeät taulut (NÄMÄ EIVÄT POISTU)

Seuraavat taulut ovat kriittisiä ja niitä ei poisteta:
- `leads` - Pääasiakastiedot
- `card_templates` - Lomakkeen korttien mallit
- `formulas` - Laskentakaavat
- `visual_objects` - Visuaaliset objektit
- `shortcodes` - PDF shortcode-määritykset
- `enhanced_lookups` - Edistynyt lookup-järjestelmä
- `processed_values` - Käsitellyt arvot
- `analytics` - Perusanalytiikka

## Varmistus

Ennen poistamista varmista:
1. Olet oikeassa tietokannassa
2. Olet tehnyt varmuuskopion
3. Olet testannut skriptin testiympäristössä

## Tulokset

Poistamisen jälkeen:
- 11 käyttämätöntä taulua poistettu
- Tietokanta siivottu
- Ylläpitokustannukset vähentyneet
- Ei vaikuta sovelluksen toimintaan
