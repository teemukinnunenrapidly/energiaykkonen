'use client';

import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface PDFPreviewProps {
  data?: Record<string, any>;
  showShortcodes?: boolean;
}

export function PDFPreview({
  data = {},
  showShortcodes = true,
}: PDFPreviewProps) {
  // Default formulas so SSR/prerender never renders undefined values
  const DEFAULT_FORMULAS: Record<string, string> = {
    calculationDate: 'new Date()',
    calculationNumber: '{id.slice(0,8)}',
    customerName: '{nimi}',
    customerEmail: '{sahkoposti}',
    customerPhone: '{puhelinnumero}',
    customerAddress: '{osoite}',
    customerCity: '{postcode} {paikkakunta}',
    peopleCount: '{henkilomaara}',
    buildingYear: '{rakennusvuosi}',
    buildingArea: '{neliot}',
    floors: '{floors}',
    energyNeed: '[calc:laskennallinen-energiantarve-kwh]',
    currentSystem: '{lammitysmuoto}',
    currentYear1Cost: '{menekinhintavuosi}',
    currentYear5Cost: '{menekinhintavuosi} × 5',
    currentYear10Cost: '{menekinhintavuosi} × 10',
    oilConsumption: '{kokonaismenekki}',
    oilPrice: '1,30',
    currentMaintenance: '200',
    currentCO2: '{kokonaismenekki} × 2.66',
    newYear1Cost: '([calc:laskennallinen-energiantarve-kwh] / 3.8) × 0.15',
    newYear5Cost:
      '(([calc:laskennallinen-energiantarve-kwh] / 3.8) × 0.15) × 5',
    newYear10Cost:
      '(([calc:laskennallinen-energiantarve-kwh] / 3.8) × 0.15) × 10',
    savings1Year: '{menekinhintavuosi} - heat_pump_cost',
    savings5Year: 'annual_savings × 5',
    savings10Year: 'annual_savings × 10',
    electricityConsumption: '[calc:laskennallinen-energiantarve-kwh] / 3.8',
    electricityPrice: '0,12',
    newMaintenance10Years: '30',
    newCO2: 'heat_pump_kWh × 0.181',
  };
  // Editable formulas state (loaded from API)
  const [formulas, setFormulas] =
    useState<Record<string, string>>(DEFAULT_FORMULAS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/admin/pdf-preview-formulas', {
          cache: 'no-store',
        });
        const json = await res.json();
        if (mounted) {
          setFormulas({ ...DEFAULT_FORMULAS, ...(json.formulas || {}) });
        }
      } catch {
        // Fallback to defaults if API fails
        setFormulas(DEFAULT_FORMULAS);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [DEFAULT_FORMULAS]);

  const previewData = useMemo(() => {
    const base = formulas || DEFAULT_FORMULAS;
    return showShortcodes
      ? { ...base, ...data }
      : {
          calculationDate: new Date().toLocaleDateString('fi-FI'),
          calculationNumber: '2025-001',
          customerName: 'Matti Meikäläinen',
          customerEmail: 'matti.meikalainen@email.fi',
          customerPhone: '040 123 4567',
          customerAddress: 'Kotikatu 123',
          customerCity: '00100 Helsinki',
          peopleCount: '4',
          buildingYear: '1987',
          buildingArea: '120',
          floors: '2',
          energyNeed: '22 000',
          currentSystem: 'Öljylämmitys',
          currentYear1Cost: '2 600',
          currentYear5Cost: '13 000',
          currentYear10Cost: '26 000',
          oilConsumption: '2 000',
          oilPrice: '1,30',
          currentMaintenance: '200',
          currentCO2: '5 320',
          newYear1Cost: '975',
          newYear5Cost: '4 875',
          newYear10Cost: '9 750',
          savings1Year: '1 625',
          savings5Year: '8 125',
          savings10Year: '16 250',
          electricityConsumption: '6 500',
          electricityPrice: '0,15',
          newMaintenance10Years: '30',
          newCO2: '0',
          ...data,
        };
  }, [showShortcodes, data, formulas, DEFAULT_FORMULAS]);

  async function saveAll() {
    if (!formulas) {
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/pdf-preview-formulas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formulas }),
      });
      if (!res.ok) {
        throw new Error('Save failed');
      }
    } finally {
      setSaving(false);
    }
  }

  // Helper function to render values with shortcode styling
  const renderValue = (value: any) => {
    if (!showShortcodes) {
      return String(value ?? '');
    }

    if (value === null || value === undefined) {
      return (
        <span className="text-gray-400 font-mono text-[9px]">&apos;&apos;</span>
      );
    }

    if (typeof value !== 'string') {
      value = String(value);
    }

    // Check if it's a simple form field
    if (value.match(/^{[^}]+}$/)) {
      return (
        <span className="bg-green-100 text-green-700 px-1 rounded text-[9px] font-mono">
          {value}
        </span>
      );
    }

    // Check if it contains form fields (formulas with {field} references)
    if (value.includes('{') && value.includes('}')) {
      // Highlight the form fields within the formula
      const parts = value.split(/({[^}]+})/);
      return (
        <span className="text-[9px] font-mono">
          {parts.map((part: string, i: number) =>
            part.match(/^{[^}]+}$/) ? (
              <span
                key={i}
                className="bg-green-100 text-green-700 px-0.5 rounded"
              >
                {part}
              </span>
            ) : (
              <span key={i} className="text-blue-600">
                {part}
              </span>
            )
          )}
        </span>
      );
    }

    // Check if it's a JavaScript expression or calculation
    if (
      value.includes('×') ||
      value.includes('/') ||
      value.includes('+') ||
      value.includes('-') ||
      value.includes('new Date')
    ) {
      return (
        <span className="bg-blue-100 text-blue-700 px-1 rounded text-[9px] font-mono">
          {value}
        </span>
      );
    }

    // Check if it's a calculated field reference
    if (value.includes('annual_savings') || value.includes('heat_pump')) {
      return (
        <span className="bg-indigo-100 text-indigo-700 px-1 rounded text-[9px] font-mono">
          {value}
        </span>
      );
    }

    // Default numeric constants
    return <span className="text-gray-600 font-mono text-[9px]">{value}</span>;
  };

  return (
    <div
      className="w-full max-w-6xl mx-auto bg-white shadow-lg"
      style={{
        aspectRatio: '210/297',
        transform: 'scale(1.15)',
        transformOrigin: 'top center',
      }}
    >
      <div className="p-8 h-full flex flex-col text-gray-800 text-xs">
        {/* Quick inline editor header */}
        {showShortcodes && formulas && (
          <div className="mb-4 -mt-2 flex items-center gap-2">
            <div className="text-[10px] text-gray-500">
              Muokkaa kenttiä klikkaamalla arvoja. Tallenna kun valmis.
            </div>
            <Button size="sm" onClick={saveAll} disabled={saving}>
              {saving ? 'Tallennetaan…' : 'Tallenna muutokset'}
            </Button>
          </div>
        )}
        {/* HEADER */}
        <div className="flex justify-between items-start pb-4 border-b-2 border-emerald-500 mb-8">
          <div className="flex-1">
            <div className="text-[10px] text-gray-500 font-bold tracking-wider mb-1">
              ENERGIAYKKÖNEN OY
            </div>
            <div className="text-[8px] text-gray-400 leading-tight">
              <div>Y-tunnus: 2635343-7</div>
              <div>Koivupurontie 6 b</div>
              <div>40320 Jyväskylä</div>
            </div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-xl font-bold text-gray-800 mb-1">
              SÄÄSTÖLASKELMA
            </div>
          </div>
          <div className="flex-1 text-right">
            <div className="text-[9px] text-gray-500">
              {showShortcodes ? (
                <Input
                  value={formulas?.calculationDate || ''}
                  onChange={e =>
                    setFormulas({
                      ...(formulas || {}),
                      calculationDate: e.target.value,
                    })
                  }
                  className="h-6 text-[10px]"
                />
              ) : (
                renderValue(previewData.calculationDate as string)
              )}
            </div>
            <div className="text-[8px] text-gray-400 mt-1">
              Laskelma #{renderValue(previewData.calculationNumber)}
            </div>
          </div>
        </div>

        {/* ASIAKASTIEDOT */}
        <div className="bg-gray-50 p-4 mb-6 border border-gray-200 rounded">
          <div className="text-[11px] font-bold text-gray-800 mb-3 pb-2 border-b border-gray-200">
            Asiakkaan tiedot
          </div>
          <div className="flex gap-8">
            <div className="flex-1 space-y-2">
              <div className="flex text-[9px]">
                <span className="text-gray-500 w-24">Nimi:</span>
                <span className="text-gray-800 font-medium">
                  {showShortcodes ? (
                    <Input
                      value={formulas?.customerName || ''}
                      onChange={e =>
                        setFormulas({
                          ...(formulas || {}),
                          customerName: e.target.value,
                        })
                      }
                      className="h-6 text-[10px]"
                    />
                  ) : (
                    renderValue(previewData.customerName as string)
                  )}
                </span>
              </div>
              <div className="flex text-[9px]">
                <span className="text-gray-500 w-24">Sähköposti:</span>
                <span className="text-gray-800 font-medium">
                  {showShortcodes ? (
                    <Input
                      value={formulas?.customerEmail || ''}
                      onChange={e =>
                        setFormulas({
                          ...(formulas || {}),
                          customerEmail: e.target.value,
                        })
                      }
                      className="h-6 text-[10px]"
                    />
                  ) : (
                    renderValue(previewData.customerEmail as string)
                  )}
                </span>
              </div>
              <div className="flex text-[9px]">
                <span className="text-gray-500 w-24">Puhelinnumero:</span>
                <span className="text-gray-800 font-medium">
                  {renderValue(previewData.customerPhone)}
                </span>
              </div>
              <div className="flex text-[9px]">
                <span className="text-gray-500 w-24">Osoite:</span>
                <span className="text-gray-800 font-medium">
                  {renderValue(previewData.customerAddress)}
                </span>
              </div>
              <div className="flex text-[9px]">
                <span className="text-gray-500 w-24">Paikkakunta:</span>
                <span className="text-gray-800 font-medium">
                  {renderValue(previewData.customerCity)}
                </span>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex text-[9px]">
                <span className="text-gray-500 w-24">Henkilömäärä:</span>
                <span className="text-gray-800 font-medium">
                  {showShortcodes ? (
                    <Input
                      value={formulas?.peopleCount || ''}
                      onChange={e =>
                        setFormulas({
                          ...(formulas || {}),
                          peopleCount: e.target.value,
                        })
                      }
                      className="h-6 text-[10px]"
                    />
                  ) : (
                    renderValue(previewData.peopleCount as string)
                  )}{' '}
                  henkilöä
                </span>
              </div>
              <div className="flex text-[9px]">
                <span className="text-gray-500 w-24">Rakennusvuosi:</span>
                <span className="text-gray-800 font-medium">
                  {renderValue(previewData.buildingYear)}
                </span>
              </div>
              <div className="flex text-[9px]">
                <span className="text-gray-500 w-24">Pinta-ala:</span>
                <span className="text-gray-800 font-medium">
                  {renderValue(previewData.buildingArea)} m²
                </span>
              </div>
              <div className="flex text-[9px]">
                <span className="text-gray-500 w-24">Kerroksia:</span>
                <span className="text-gray-800 font-medium">
                  {renderValue(previewData.floors)} kerrosta
                </span>
              </div>
              <div className="flex text-[9px]">
                <span className="text-gray-500 w-24">Energiantarve:</span>
                <span className="text-gray-800 font-medium">
                  {showShortcodes ? (
                    <Input
                      value={formulas?.energyNeed || ''}
                      onChange={e =>
                        setFormulas({
                          ...(formulas || {}),
                          energyNeed: e.target.value,
                        })
                      }
                      className="h-6 text-[10px]"
                    />
                  ) : (
                    renderValue(previewData.energyNeed as string)
                  )}{' '}
                  kWh/vuosi
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* KUSTANNUSVERTAILU */}
        <div className="mb-6">
          <div className="text-xs font-bold text-gray-800 mb-4 pb-1 border-b border-gray-200">
            Lämmityskustannusten vertailu
          </div>
          <div className="flex gap-5">
            {/* Nykyinen järjestelmä */}
            <div className="flex-1">
              <div className="bg-red-50 p-4 border-2 border-red-500 rounded">
                <div className="text-[11px] font-bold text-gray-800 text-center">
                  {renderValue(previewData.currentSystem)}
                </div>
                <div className="text-[9px] text-gray-600 text-center mb-4">
                  Nykyinen lämmitysjärjestelmä
                </div>

                <div className="bg-white p-2 rounded mb-3">
                  <div className="flex justify-between text-[9px] font-bold text-gray-500 pb-2 border-b border-gray-200">
                    <span>Aikaväli</span>
                    <span>Energian hinta</span>
                  </div>
                  <div className="space-y-1 mt-2">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-500">1 vuosi</span>
                      <span className="text-red-500 font-bold">
                        {showShortcodes ? (
                          <Input
                            value={formulas?.currentYear1Cost || ''}
                            onChange={e =>
                              setFormulas({
                                ...(formulas || {}),
                                currentYear1Cost: e.target.value,
                              })
                            }
                            className="h-6 text-[10px]"
                          />
                        ) : (
                          renderValue(previewData.currentYear1Cost as string)
                        )}{' '}
                        €
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] bg-gray-50 -mx-2 px-2 py-1">
                      <span className="text-gray-500">5 vuotta</span>
                      <span className="text-red-500 font-bold">
                        {showShortcodes ? (
                          <Input
                            value={formulas?.currentYear5Cost || ''}
                            onChange={e =>
                              setFormulas({
                                ...(formulas || {}),
                                currentYear5Cost: e.target.value,
                              })
                            }
                            className="h-6 text-[10px]"
                          />
                        ) : (
                          renderValue(previewData.currentYear5Cost as string)
                        )}{' '}
                        €
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-500">10 vuotta</span>
                      <span className="text-red-500 font-bold">
                        {showShortcodes ? (
                          <Input
                            value={formulas?.currentYear10Cost || ''}
                            onChange={e =>
                              setFormulas({
                                ...(formulas || {}),
                                currentYear10Cost: e.target.value,
                              })
                            }
                            className="h-6 text-[10px]"
                          />
                        ) : (
                          renderValue(previewData.currentYear10Cost as string)
                        )}{' '}
                        €
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200 space-y-1">
                  {(() => {
                    const heatingRaw = String(previewData.currentSystem || '')
                      .toLowerCase();
                    const isGas = heatingRaw.includes('kaasu');
                    const isOil = heatingRaw.includes('öljy');
                    const isWood = heatingRaw.includes('puu') && !isOil; // öljy+puu -> oil

                    return (
                      <>
                        {isGas && (
                          <>
                            <div className="flex justify-between text-[8px]">
                              <span className="text-gray-500">Kaasun kulutus:</span>
                              <span className="text-gray-600">
                                {renderValue(
                                  (data.kokonaismenekki || data.currentConsumption || '0') as string
                                )}{' '}
                                m³/vuosi
                              </span>
                            </div>
                            <div className="flex justify-between text-[8px]">
                              <span className="text-gray-500">Kaasun hinta:</span>
                              <span className="text-gray-600">
                                {renderValue((data.gas_price || '0,10') as string)} €/kWh
                              </span>
                            </div>
                            <div className="flex justify-between text-[8px]">
                              <span className="text-gray-500">Huoltokustannus:</span>
                              <span className="text-gray-600">300 €/vuosi</span>
                            </div>
                            <div className="flex justify-between text-[8px]">
                              <span className="text-gray-500">CO₂-päästöt:</span>
                              <span className="text-gray-600">{renderValue('0')} kg/vuosi</span>
                            </div>
                          </>
                        )}

                        {isWood && (
                          <>
                            <div className="flex justify-between text-[8px]">
                              <span className="text-gray-500">Puun menekki:</span>
                              <span className="text-gray-600">
                                {renderValue(
                                  (data.kokonaismenekki || data.currentConsumption || '0') as string
                                )}{' '}
                                puumottia/vuosi
                              </span>
                            </div>
                            <div className="flex justify-between text-[8px]">
                              <span className="text-gray-500">Puun hinta:</span>
                              <span className="text-gray-600">
                                {renderValue(
                                  (formulas?.currentYear1Cost || previewData.currentYear1Cost) as string
                                )}{' '}
                                €
                              </span>
                            </div>
                            <div className="flex justify-between text-[8px]">
                              <span className="text-gray-500">Huoltokustannus:</span>
                              <span className="text-gray-600">200 €/vuosi</span>
                            </div>
                            <div className="flex justify-between text-[8px]">
                              <span className="text-gray-500">CO₂-päästöt:</span>
                              <span className="text-gray-600">
                                {showShortcodes ? (
                                  <Input
                                    value={formulas?.currentCO2 || ''}
                                    onChange={e =>
                                      setFormulas({
                                        ...(formulas || {}),
                                        currentCO2: e.target.value,
                                      })
                                    }
                                    className="h-6 text-[10px]"
                                  />
                                ) : (
                                  renderValue(previewData.currentCO2 as string)
                                )}{' '}
                                kg/vuosi
                              </span>
                            </div>
                          </>
                        )}

                        {isOil && (
                          <>
                            <div className="flex justify-between text-[8px]">
                              <span className="text-gray-500">Öljyn kulutus:</span>
                              <span className="text-gray-600">
                                {showShortcodes ? (
                                  <Input
                                    value={formulas?.oilConsumption || ''}
                                    onChange={e =>
                                      setFormulas({
                                        ...(formulas || {}),
                                        oilConsumption: e.target.value,
                                      })
                                    }
                                    className="h-6 text-[10px]"
                                  />
                                ) : (
                                  renderValue(previewData.oilConsumption as string)
                                )}{' '}
                                L/vuosi
                              </span>
                            </div>
                            <div className="flex justify-between text-[8px]">
                              <span className="text-gray-500">Öljyn hinta:</span>
                              <span className="text-gray-600">
                                {previewData.oilPrice} €/litra
                              </span>
                            </div>
                            <div className="flex justify-between text-[8px]">
                              <span className="text-gray-500">Huoltokustannus:</span>
                              <span className="text-gray-600">
                                {previewData.currentMaintenance} €/vuosi
                              </span>
                            </div>
                            <div className="flex justify-between text-[8px]">
                              <span className="text-gray-500">CO₂-päästöt:</span>
                              <span className="text-gray-600">
                                {showShortcodes ? (
                                  <Input
                                    value={formulas?.currentCO2 || ''}
                                    onChange={e =>
                                      setFormulas({
                                        ...(formulas || {}),
                                        currentCO2: e.target.value,
                                      })
                                    }
                                    className="h-6 text-[10px]"
                                  />
                                ) : (
                                  renderValue(previewData.currentCO2 as string)
                                )}{' '}
                                kg/vuosi
                              </span>
                            </div>
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Uusi järjestelmä */}
            <div className="flex-1">
              <div className="bg-emerald-50 p-4 border-2 border-emerald-500 rounded">
                <div className="text-[11px] font-bold text-gray-800 text-center">
                  Ilmavesilämpöpumppu
                </div>
                <div className="text-[9px] text-gray-600 text-center mb-4">
                  Moderni VILP-järjestelmä
                </div>

                <div className="bg-white p-2 rounded mb-3">
                  <div className="flex text-[9px] font-bold text-gray-500 pb-2 border-b border-gray-200">
                    <span className="flex-1">Aikaväli</span>
                    <span className="flex-1 text-center">Energian hinta</span>
                    <span className="flex-1 text-right">Säästö</span>
                  </div>
                  <div className="space-y-1 mt-2">
                    <div className="flex text-[10px]">
                      <span className="flex-1 text-gray-500">1 vuosi</span>
                      <span className="flex-1 text-center text-gray-800 font-bold">
                        {showShortcodes ? (
                          <Input
                            value={formulas?.newYear1Cost || ''}
                            onChange={e =>
                              setFormulas({
                                ...(formulas || {}),
                                newYear1Cost: e.target.value,
                              })
                            }
                            className="h-6 text-[10px]"
                          />
                        ) : (
                          renderValue(previewData.newYear1Cost as string)
                        )}{' '}
                        €
                      </span>
                      <div className="flex-1 text-right">
                        <span className="text-emerald-500 font-bold">
                          {showShortcodes ? (
                            <Input
                              value={formulas?.savings1Year || ''}
                              onChange={e =>
                                setFormulas({
                                  ...(formulas || {}),
                                  savings1Year: e.target.value,
                                })
                              }
                              className="h-6 text-[10px] text-right"
                            />
                          ) : (
                            renderValue(previewData.savings1Year as string)
                          )}{' '}
                          €
                        </span>
                        <div className="text-[8px] text-emerald-600 font-medium">
                          +4 000€*
                        </div>
                      </div>
                    </div>
                    <div className="flex text-[10px] bg-gray-50 -mx-2 px-2 py-1">
                      <span className="flex-1 text-gray-500">5 vuotta</span>
                      <span className="flex-1 text-center text-gray-800 font-bold">
                        {renderValue(previewData.newYear5Cost)} €
                      </span>
                      <span className="flex-1 text-right text-emerald-500 font-bold">
                        {renderValue(previewData.savings5Year)} €
                      </span>
                    </div>
                    <div className="flex text-[10px]">
                      <span className="flex-1 text-gray-500">10 vuotta</span>
                      <span className="flex-1 text-center text-gray-800 font-bold">
                        {renderValue(previewData.newYear10Cost)} €
                      </span>
                      <span className="flex-1 text-right text-emerald-500 font-bold">
                        {renderValue(previewData.savings10Year)} €
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200 space-y-1">
                  <div className="flex justify-between text-[8px]">
                    <span className="text-gray-500">Sähkön kulutus:</span>
                    <span className="text-gray-600">
                      {showShortcodes ? (
                        <Input
                          value={formulas?.electricityConsumption || ''}
                          onChange={e =>
                            setFormulas({
                              ...(formulas || {}),
                              electricityConsumption: e.target.value,
                            })
                          }
                          className="h-6 text-[10px]"
                        />
                      ) : (
                        renderValue(
                          previewData.electricityConsumption as string
                        )
                      )}{' '}
                      kWh/vuosi
                    </span>
                  </div>
                  <div className="text-[7px] text-gray-400 italic my-1">
                    Arvio energiamäärästä, joka tarvitaan täyttämään
                    laskennallinen energiantarve.
                  </div>
                  <div className="flex justify-between text-[8px]">
                    <span className="text-gray-500">Sähkön hinta:</span>
                    <span className="text-gray-600">
                      {showShortcodes ? (
                        <Input
                          value={formulas?.electricityPrice || ''}
                          onChange={e =>
                            setFormulas({
                              ...(formulas || {}),
                              electricityPrice: e.target.value,
                            })
                          }
                          className="h-6 text-[10px]"
                        />
                      ) : (
                        previewData.electricityPrice
                      )}{' '}
                      €/kWh
                    </span>
                  </div>
                  <div className="flex justify-between text-[8px]">
                    <span className="text-gray-500">Huolto 5v:</span>
                    <span className="text-gray-600">0 €/vuosi</span>
                  </div>
                  <div className="flex justify-between text-[8px]">
                    <span className="text-gray-500">Huolto 10v:</span>
                    <span className="text-gray-600">
                      {showShortcodes ? (
                        <Input
                          value={formulas?.newMaintenance10Years || ''}
                          onChange={e =>
                            setFormulas({
                              ...(formulas || {}),
                              newMaintenance10Years: e.target.value,
                            })
                          }
                          className="h-6 text-[10px]"
                        />
                      ) : (
                        previewData.newMaintenance10Years
                      )}{' '}
                      €/vuosi
                    </span>
                  </div>
                  <div className="flex justify-between text-[8px]">
                    <span className="text-gray-500">CO₂-päästöt:</span>
                    <span className="text-gray-600">
                      {showShortcodes ? (
                        <Input
                          value={formulas?.newCO2 || ''}
                          onChange={e =>
                            setFormulas({
                              ...(formulas || {}),
                              newCO2: e.target.value,
                            })
                          }
                          className="h-6 text-[10px]"
                        />
                      ) : (
                        previewData.newCO2
                      )}{' '}
                      kg/vuosi
                    </span>
                  </div>
                  <div className="text-[7px] text-emerald-600 mt-2 leading-tight">
                    * ELY-keskuksen energiatuki öljylämmityksestä luopumiseen.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* EDUT */}
        <div className="mb-5">
          <div className="text-xs font-bold text-gray-800 mb-3 pb-1 border-b border-gray-200">
            Moderni ilmavesilämpöpumppu Energiaykköseltä
          </div>
          <div className="flex gap-8">
            <div className="flex-1 space-y-1">
              <div className="flex text-[9px]">
                <span className="text-emerald-500 font-bold mr-2">✓</span>
                <span className="text-gray-600">
                  10 vuoden huoltovapaat laitteet modernilla tekniikalla
                </span>
              </div>
              <div className="flex text-[9px]">
                <span className="text-emerald-500 font-bold mr-2">✓</span>
                <span className="text-gray-600">
                  5 vuoden täystakuu kaikille komponenteille
                </span>
              </div>
              <div className="flex text-[9px]">
                <span className="text-emerald-500 font-bold mr-2">✓</span>
                <span className="text-gray-600">
                  Kotitalousvähennys 40% työn osuudesta (max 3 200 €)
                </span>
              </div>
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex text-[9px]">
                <span className="text-emerald-500 font-bold mr-2">✓</span>
                <span className="text-gray-600">
                  Kiinteistön arvon nousu ja parempi energialuokka
                </span>
              </div>
              <div className="flex text-[9px]">
                <span className="text-emerald-500 font-bold mr-2">✓</span>
                <span className="text-gray-600">
                  Älykäs etäohjaus mobiilisovelluksella
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* INFO BOX */}
        <div className="bg-gray-100 border-l-4 border-gray-500 p-3 mb-5">
          <div className="text-[10px] font-bold text-gray-800 mb-1">
            Visiomme
          </div>
          <div className="text-[9px] text-gray-600 leading-relaxed">
            Visiomme uusiutuvan energian tuottamisesta ydinvoimalan verran (4
            TWh vuodessa) on kunnianhimoinen. Tämä vastaa 380 000
            polttomoottoriauton vuosittaisia päästöjä.
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-auto pt-2 border-t border-gray-200 flex justify-between text-[8px] text-gray-400">
          <div>Energiaykkönen Oy | Y-tunnus: 2635343-7</div>
          <div>www.energiaykkonen.fi | info@energiaykkonen.fi</div>
          <div>Sivu 1/1</div>
        </div>
      </div>
    </div>
  );
}
