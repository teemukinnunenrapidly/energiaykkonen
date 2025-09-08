=== E1 Calculator Widget Sync ===
Contributors: energiaykkonen
Tags: calculator, widget, savings, heat pump, sync
Requires at least: 5.0
Tested up to: 6.4
Stable tag: 2.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Synkronoi ja upota E1-lämpöpumpun säästölaskuri suoraan WordPress-sivulle ilman iframea.

== Description ==

E1 Calculator Widget Sync mahdollistaa Energiaykkösen lämpöpumpun säästölaskurin upottamisen suoraan WordPress-sivulle. 

Widget-koodi ja konfiguraatio synkronoidaan keskitetysti hallintapaneelista, joten kaikki päivitykset tulevat automaattisesti käyttöön.

**Ominaisuudet:**
* Widget toimii suoraan sivulla (ei iframe)
* Synkronoi widget-koodin ja konfiguraation API:sta
* Tallentaa widgetin paikallisesti nopeaa latautumista varten
* Helppo upotus shortcodella
* Tukee useita widgettejä samalla sivulla

== Installation ==

1. Lataa plugin ja pura se `/wp-content/plugins/` kansioon
2. Aktivoi plugin WordPress admin -paneelista
3. Mene Asetukset > E1 Widget Sync
4. Syötä API URL ja API-avain
5. Klikkaa "Synkronoi widget"
6. Käytä shortcodea `[e1_calculator_widget]` sivuilla

== Configuration ==

**API URL:** Widget bundle API:n osoite
- Kehitys: `http://localhost:3001/api/widget-bundle`
- Tuotanto: `https://your-domain.com/api/widget-bundle`

**API Key:** Saat API-avaimen järjestelmän ylläpitäjältä

== Usage ==

Lisää laskuri sivulle tai artikkeliin:
`[e1_calculator_widget]`

Voit käyttää useita laskureita eri ID:llä:
`[e1_calculator_widget id="calc-1"]`
`[e1_calculator_widget id="calc-2"]`

== Frequently Asked Questions ==

= Mikä ero tässä on iframe-versioon? =
Tämä plugin lataa widget-koodin suoraan sivulle, mikä tekee siitä nopeamman ja paremmin hakukoneoptimoidun.

= Kuinka usein widget pitää synkronoida? =
Synkronoi aina kun haluat päivittää lomakkeen kenttiä, laskentakaavoja tai ulkoasua.

= Toimiiko widget mobiililaitteilla? =
Kyllä, widget on responsiivinen ja toimii kaikilla laitteilla.

== Changelog ==

= 2.0.0 =
* Ensimmäinen versio widget-synkronoinnilla
* Tuki API-pohjaiselle päivitykselle
* Paikallinen tallennus nopeaa latautumista varten

== Technical Details ==

Widget koostuu kolmesta osasta:
1. **JavaScript:** Widget-logiikka ja lomakkeen käsittely
2. **CSS:** Tyylit ja ulkoasu
3. **Config:** Lomakekenttien määritykset ja laskentakaavat

Kaikki osat synkronoidaan yhdellä API-kutsulla ja tallennetaan WordPress-tietokantaan.