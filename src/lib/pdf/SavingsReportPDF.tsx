// src/lib/pdf/SavingsReportPDF.tsx
import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { styles } from './pdf-styles';

export interface PDFData {
  [key: string]: any;
}

export const SavingsReportPDF: React.FC<{ data: PDFData }> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.companyName}>ENERGIAYKKÖNEN OY</Text>
          <View style={styles.companyDetails}>
            <Text>Y-tunnus: 2635343-7</Text>
            <Text>Koivupurontie 6 b</Text>
            <Text>40320 Jyväskylä</Text>
          </View>
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.documentTitle}>SÄÄSTÖLASKELMA</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.documentDate}>
            {data.calculationDate || new Date().toLocaleDateString('fi-FI')}
          </Text>
          <Text style={styles.documentNumber}>
            Laskelma #{data.calculationNumber || '2025-001'}
          </Text>
        </View>
      </View>

      {/* ASIAKASTIEDOT */}
      <View style={styles.customerSection}>
        <Text style={styles.customerSectionTitle}>Asiakkaan tiedot</Text>
        <View style={styles.customerColumns}>
          <View style={styles.customerColumn}>
            <View style={styles.customerRow}>
              <Text style={styles.customerLabel}>Nimi:</Text>
              <Text style={styles.customerValue}>
                {data.customerName ||
                  `${data.first_name} ${data.last_name}` ||
                  'Matti Meikäläinen'}
              </Text>
            </View>
            <View style={styles.customerRow}>
              <Text style={styles.customerLabel}>Sähköposti:</Text>
              <Text style={styles.customerValue}>
                {data.customerEmail ||
                  data.sahkoposti ||
                  'matti.meikalainen@email.fi'}
              </Text>
            </View>
            <View style={styles.customerRow}>
              <Text style={styles.customerLabel}>Puhelinnumero:</Text>
              <Text style={styles.customerValue}>
                {data.customerPhone || data.puhelinnumero || '040 123 4567'}
              </Text>
            </View>
            <View style={styles.customerRow}>
              <Text style={styles.customerLabel}>Osoite:</Text>
              <Text style={styles.customerValue}>
                {data.customerAddress ||
                  data.osoite ||
                  data.address ||
                  'Kotikatu 123'}
              </Text>
            </View>
            <View style={styles.customerRow}>
              <Text style={styles.customerLabel}>Paikkakunta:</Text>
              <Text style={styles.customerValue}>
                {data.customerCity ||
                  `${data.postcode} ${data.paikkakunta}` ||
                  '00100 Helsinki'}
              </Text>
            </View>
          </View>
          <View style={styles.customerColumn}>
            <View style={styles.customerRow}>
              <Text style={styles.customerLabel}>Henkilömäärä:</Text>
              <Text style={styles.customerValue}>
                {data.peopleCount ||
                  data.people_count ||
                  data.henkilomaara ||
                  '4'}{' '}
                henkilöä
              </Text>
            </View>
            <View style={styles.customerRow}>
              <Text style={styles.customerLabel}>Rakennusvuosi:</Text>
              <Text style={styles.customerValue}>
                {data.buildingYear ||
                  data.building_year ||
                  data.rakennusvuosi ||
                  '1987'}
              </Text>
            </View>
            <View style={styles.customerRow}>
              <Text style={styles.customerLabel}>Pinta-ala:</Text>
              <Text style={styles.customerValue}>
                {data.buildingArea ||
                  data.building_area ||
                  data.neliot ||
                  '120'}{' '}
                m²
              </Text>
            </View>
            <View style={styles.customerRow}>
              <Text style={styles.customerLabel}>Energiantarve:</Text>
              <Text style={styles.customerValue}>
                {data.laskennallinenenergiantarve ||
                  data.energyNeed ||
                  data.total_energy_need ||
                  data.annual_energy_need ||
                  '22 000'}{' '}
                kWh/vuosi
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* KUSTANNUSVERTAILU */}
      <View style={styles.comparisonSection}>
        <Text style={styles.sectionTitle}>Lämmityskustannusten vertailu</Text>
        <View style={styles.twoColumns}>
          {/* Nykyinen järjestelmä */}
          <View style={styles.column}>
            <View style={[styles.systemBox, styles.systemBoxCurrent]}>
              <Text style={styles.systemTitle}>
                Nykyinen lämmitysjärjestelmä
              </Text>
              <Text style={styles.systemSubtitle}>
                {data.currentSystem ||
                  data.current_heating ||
                  data.lammitysmuoto ||
                  'Öljylämmitys'}
              </Text>

              <View style={styles.costSummary}>
                <View style={styles.costHeader}>
                  <Text style={styles.costHeaderLabel}>Aikaväli</Text>
                  <Text style={styles.costHeaderValue}>Energian hinta</Text>
                </View>
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>1 vuosi</Text>
                  <Text style={[styles.costValue, styles.negative]}>
                    {(data.menekin_hinta_vuosi || data.menekinhintavuosi || data.currentYear1Cost || data.current_yearly_cost || data.vesikiertoinen || '2600')}{' '}€
                  </Text>
                </View>
                <View style={[styles.costRow, styles.costRowHighlight]}>
                  <Text style={styles.costLabel}>5 vuotta</Text>
                  <Text style={[styles.costValue, styles.negative]}>
                    {(() => {
                      const one = Number(
                        String(
                          data.menekin_hinta_vuosi ||
                            data.menekinhintavuosi ||
                            data.currentYear1Cost ||
                            data.current_yearly_cost ||
                            0
                        )
                          .replace(/\s/g, '')
                          .replace(',', '.')
                      );
                      return isNaN(one)
                        ? (data.currentYear5Cost || data.current_5year_cost || '13000')
                        : (one * 5).toLocaleString('fi-FI');
                    })()}{' '}€
                  </Text>
                </View>
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>10 vuotta</Text>
                  <Text style={[styles.costValue, styles.negative]}>
                    {(() => {
                      const one = Number(
                        String(
                          data.menekin_hinta_vuosi ||
                            data.menekinhintavuosi ||
                            data.currentYear1Cost ||
                            data.current_yearly_cost ||
                            0
                        )
                          .replace(/\s/g, '')
                          .replace(',', '.')
                      );
                      return isNaN(one)
                        ? (data.currentYear10Cost || data.current_10year_cost || '26000')
                        : (one * 10).toLocaleString('fi-FI');
                    })()}{' '}€
                  </Text>
                </View>
              </View>

              <View style={styles.systemDetails}>
                {/* Fuel-specific rows */}
                {/* Gas */}
                {String(
                  (data.lammitysmuoto || data.current_heating || '')
                )
                  .toLowerCase()
                  .includes('kaasu') && (
                  <>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Kaasun kulutus:</Text>
                      <Text style={styles.detailValue}>
                        {(data.kokonaismenekki || data.gas_consumption_m3 || data.currentConsumption || 0).toLocaleString('fi-FI')} m³/vuosi
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Kaasun hinta:</Text>
                      <Text style={styles.detailValue}>
                        {(() => {
                          // Prefer €/MWh when available else €/kWh
                          if (data.gas_price_mwh) {
                            return `${Number(data.gas_price_mwh).toLocaleString('fi-FI')} €/MWh`;
                          }
                          return `${data.gas_price || data.gasPrice || '0,10'} €/kWh`;
                        })()}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Huoltokustannus:</Text>
                      <Text style={styles.detailValue}>300 €/vuosi</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>CO₂-päästöt:</Text>
                      <Text style={styles.detailValue}>
                        {((data.laskennallinenenergiantarve || data.energyNeed || 0) * 0.21)
                          .toFixed(0)
                          .toString()
                          .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}{' '}
                        kg/vuosi
                      </Text>
                    </View>
                  </>
                )}

                {/* Wood heating */}
                {String(
                  (data.lammitysmuoto || data.current_heating || '')
                )
                  .toLowerCase()
                  .includes('puu') && (
                  <>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Puun menekki:</Text>
                      <Text style={styles.detailValue}>
                        {(data.kokonaismenekki || data.currentConsumption || '0')}{' '}
                        puumottia/vuosi
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Puun hinta:</Text>
                      <Text style={styles.detailValue}>
                        {(() => {
                          const val = Number(
                            String(
                              data.menekin_hinta_vuosi || data.menekinhintavuosi || 0
                            )
                              .replace(/\s/g, '')
                              .replace(',', '.')
                          );
                          return isNaN(val)
                            ? (data.menekin_hinta_vuosi || data.menekinhintavuosi || '0')
                            : val.toLocaleString('fi-FI');
                        })()}{' '}
                        €
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Huoltokustannus:</Text>
                      <Text style={styles.detailValue}>200 €/vuosi</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>CO₂-päästöt:</Text>
                      <Text style={styles.detailValue}>
                        {(data.currentCO2 || data.current_co2 || '0').toString()} kg/vuosi
                      </Text>
                    </View>
                  </>
                )}

                {/* Oil */}
                {String(
                  (data.lammitysmuoto || data.current_heating || '')
                )
                  .toLowerCase()
                  .includes('öljy') && (
                  <>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Öljyn kulutus:</Text>
                      <Text style={styles.detailValue}>
                        {data.oilConsumption || data.oil_consumption || '2 000'} L/vuosi
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Öljyn hinta:</Text>
                      <Text style={styles.detailValue}>
                        {data.oilPrice || data.oil_price || '1,30'} €/litra
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Huoltokustannus:</Text>
                      <Text style={styles.detailValue}>
                        {data.currentMaintenance || '200'} €/vuosi
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>CO₂-päästöt:</Text>
                      <Text style={styles.detailValue}>
                        {data.currentCO2 || data.current_co2 || '5 320'} kg/vuosi
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Uusi järjestelmä */}
          <View style={styles.column}>
            <View style={[styles.systemBox, styles.systemBoxNew]}>
              <Text style={styles.systemTitle}>Ilmavesilämpöpumppu</Text>
              <Text style={styles.systemSubtitle}>
                Moderni VILP-järjestelmä
              </Text>

              <View style={styles.costSummary}>
                <View style={styles.costHeaderWithSavings}>
                  <Text style={styles.costHeaderLabel}>Aikaväli</Text>
                  <Text style={styles.costHeaderCenter}>Energian hinta</Text>
                  <Text style={styles.costHeaderRight}>Säästö</Text>
                </View>
                <View style={styles.costRowWithSavings}>
                  <Text style={styles.costLabel}>1 vuosi</Text>
                  <Text style={styles.costCenter}>
                    {data.newYear1Cost ||
                      data.new_yearly_cost ||
                      data.heat_pump_cost_annual ||
                      '975'}{' '}
                    €
                  </Text>
                  <View style={styles.savingsColumn}>
                    <Text style={[styles.costValue, styles.positive]}>
                      {data.savings1Year ||
                        data.yearly_savings ||
                        data.annual_savings ||
                        '1 625'}{' '}
                      €
                    </Text>
                    <Text style={styles.elyNote}>+4 000€*</Text>
                  </View>
                </View>
                <View
                  style={[styles.costRowWithSavings, styles.costRowHighlight]}
                >
                  <Text style={styles.costLabel}>5 vuotta</Text>
                  <Text style={styles.costCenter}>
                    {data.newYear5Cost || data.new_5year_cost || '4 875'} €
                  </Text>
                  <View style={styles.savingsColumn}>
                    <Text style={[styles.costValue, styles.positive]}>
                      {data.savings5Year || data.five_year_savings || '8 125'} €
                    </Text>
                  </View>
                </View>
                <View style={styles.costRowWithSavings}>
                  <Text style={styles.costLabel}>10 vuotta</Text>
                  <Text style={styles.costCenter}>
                    {data.newYear10Cost || data.new_10year_cost || '9 750'} €
                  </Text>
                  <View style={styles.savingsColumn}>
                    <Text style={[styles.costValue, styles.positive]}>
                      {data.savings10Year || data.ten_year_savings || '16 250'}{' '}
                      €
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.systemDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Sähkön kulutus:</Text>
                  <Text style={styles.detailValue}>
                    {data.electricityConsumption ||
                      data.heat_pump_consumption ||
                      '6 500'}{' '}
                    kWh/vuosi
                  </Text>
                </View>
                <Text style={styles.detailNote}>
                  Arvio energiamäärästä, joka tarvitaan täyttämään
                  laskennallinen energiantarve. Laskelmassa käytetty maltillista
                  3.8 hyötysuhdetta.
                </Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Sähkön hinta:</Text>
                  <Text style={styles.detailValue}>
                    {data.electricityPrice || data.electricity_price || '0,15'}{' '}
                    €/kWh
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    Huoltokustannus ensimmäiset 5v:
                  </Text>
                  <Text style={styles.detailValue}>0 €/vuosi</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    Huoltokustannus seuraavat 5v:
                  </Text>
                  <Text style={styles.detailValue}>
                    {data.newMaintenance10Years ||
                      data.heat_pump_maintenance_10y ||
                      '30'}{' '}
                    €/vuosi
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>CO₂-päästöt:</Text>
                  <Text style={styles.detailValue}>
                    {data.newCO2 || data.new_co2 || '0'} kg/vuosi
                  </Text>
                </View>
                <Text style={styles.elyNoteDescription}>
                  * ELY-keskuksen energiatuki öljylämmityksestä luopumiseen.
                  Tuki on 4 000 € pientaloille. Edellyttää hakemuksen tekemistä
                  ennen töiden aloittamista.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* EDUT */}
      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>
          Moderni ilmavesilämpöpumppu Energiaykköseltä
        </Text>
        <View style={styles.twoColumns}>
          <View style={styles.column}>
            <View style={styles.listItem}>
              <Text style={styles.listIcon}>✓</Text>
              <Text style={styles.listText}>
                10 vuoden huoltovapaat laitteet modernilla tekniikalla
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.listIcon}>✓</Text>
              <Text style={styles.listText}>
                5 vuoden täystakuu kaikille komponenteille
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.listIcon}>✓</Text>
              <Text style={styles.listText}>
                Kotitalousvähennys 40% työn osuudesta (max 3 200 €)
              </Text>
            </View>
          </View>
          <View style={styles.column}>
            <View style={styles.listItem}>
              <Text style={styles.listIcon}>✓</Text>
              <Text style={styles.listText}>
                Kiinteistön arvon nousu ja parempi energialuokka
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.listIcon}>✓</Text>
              <Text style={styles.listText}>
                Älykäs etäohjaus mobiilisovelluksella
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* INFO */}
      <View style={styles.infoBox}>
        <Text style={styles.infoBoxTitle}>Visiomme</Text>
        <Text style={styles.infoBoxContent}>
          Visiomme uusiutuvan energian tuottamisesta ydinvoimalan verran (4 TWh
          vuodessa) on kunnianhimoinen. Tämä vastaa 380 000 polttomoottoriauton
          vuosittaisia päästöjä. Vision taustalla on paljon laskelmia, ja siksi
          pidämmekin sen toteuttamista täysin mahdollisena.
        </Text>
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Text>Energiaykkönen Oy | Y-tunnus: 2635343-7</Text>
        </View>
        <View style={styles.footerCenter}>
          <Text>www.energiaykkonen.fi | info@energiaykkonen.fi</Text>
        </View>
        <View style={styles.footerRight}>
          <Text>Sivu 1/1</Text>
        </View>
      </View>
    </Page>
  </Document>
);
