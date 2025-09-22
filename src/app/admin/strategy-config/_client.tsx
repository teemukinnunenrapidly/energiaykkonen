'use client';

import React, { useMemo, useState } from 'react';

type PdfRowKey = 'consumption' | 'price' | 'maintenance' | 'co2';

interface PdfRowConfig {
  key: PdfRowKey;
  label: string;
  unit: string;
  enabled: boolean;
}

interface StrategyConfig {
  id: 'oil' | 'gas' | 'wood' | 'oilwood';
  title: string;
  matchesWhenIncludes: string;
  excludeIfIncludes?: string;
  consumptionSource: string;
  priceFormula: string;
  maintenanceYearly: number;
  pdfRows: PdfRowConfig[];
}

interface DefaultLookups {
  electricityPrice: number;
  oilPrice: number;
  gasPricePerMWh: number;
  co2: {
    electricityPerKWh: number;
    oilPerLiter: number;
    gasPerKWh: number;
  };
}

const initialDefaults: DefaultLookups = {
  electricityPrice: 0.15,
  oilPrice: 1.3,
  gasPricePerMWh: 55,
  co2: {
    electricityPerKWh: 0.181,
    oilPerLiter: 2.66,
    gasPerKWh: 0.201,
  },
};

const initStrategies: StrategyConfig[] = [
  {
    id: 'oil',
    title: 'Öljylämmitys',
    matchesWhenIncludes: 'öljy',
    excludeIfIncludes: 'puu',
    consumptionSource: 'kokonaismenekki (L) tai laskennallinenenergiantarve/10',
    priceFormula: 'menekinhintavuosi TAI (liters * oilPrice)',
    maintenanceYearly: 200,
    pdfRows: [
      {
        key: 'consumption',
        label: 'Öljyn kulutus',
        unit: 'L/vuosi',
        enabled: true,
      },
      { key: 'price', label: 'Öljyn hinta', unit: '€/vuosi', enabled: true },
      {
        key: 'maintenance',
        label: 'Huoltokustannus',
        unit: '€/vuosi',
        enabled: true,
      },
      { key: 'co2', label: 'CO₂-päästöt', unit: 'kg/vuosi', enabled: true },
    ],
  },
  {
    id: 'gas',
    title: 'Kaasulämmitys',
    matchesWhenIncludes: 'kaasu',
    consumptionSource: 'kokonaismenekki (m³)',
    priceFormula: 'menekinhintavuosi (tai €/MWh * kulutus MWh)',
    maintenanceYearly: 300,
    pdfRows: [
      {
        key: 'consumption',
        label: 'Kaasun kulutus',
        unit: 'm³/vuosi',
        enabled: true,
      },
      { key: 'price', label: 'Kaasun hinta', unit: '€/MWh', enabled: true },
      {
        key: 'maintenance',
        label: 'Huoltokustannus',
        unit: '€/vuosi',
        enabled: true,
      },
      { key: 'co2', label: 'CO₂-päästöt', unit: 'kg/vuosi', enabled: true },
    ],
  },
  {
    id: 'wood',
    title: 'Puulämmitys',
    matchesWhenIncludes: 'puu',
    excludeIfIncludes: 'öljy',
    consumptionSource: 'kokonaismenekki (puumottia)',
    priceFormula: 'menekinhintavuosi',
    maintenanceYearly: 200,
    pdfRows: [
      {
        key: 'consumption',
        label: 'Puun menekki',
        unit: 'puumottia/vuosi',
        enabled: true,
      },
      { key: 'price', label: 'Puun hinta', unit: '€/vuosi', enabled: true },
      {
        key: 'maintenance',
        label: 'Huoltokustannus',
        unit: '€/vuosi',
        enabled: true,
      },
      { key: 'co2', label: 'CO₂-päästöt', unit: 'kg/vuosi', enabled: true },
    ],
  },
  {
    id: 'oilwood',
    title: 'Öljy + puu (tuplapesäkattila)',
    matchesWhenIncludes: 'öljy,puu',
    consumptionSource: 'kokonaismenekki (L)',
    priceFormula: 'menekinhintavuosi TAI (liters * oilPrice)',
    maintenanceYearly: 200,
    pdfRows: [
      {
        key: 'consumption',
        label: 'Öljyn kulutus',
        unit: 'L/vuosi',
        enabled: true,
      },
      { key: 'price', label: 'Öljyn hinta', unit: '€/vuosi', enabled: true },
      {
        key: 'maintenance',
        label: 'Huoltokustannus',
        unit: '€/vuosi',
        enabled: true,
      },
      { key: 'co2', label: 'CO₂-päästöt', unit: 'kg/vuosi', enabled: true },
    ],
  },
];

export default function StrategyConfiguratorClient() {
  const [defaults, setDefaults] = useState<DefaultLookups>(initialDefaults);
  const [strategies, setStrategies] =
    useState<StrategyConfig[]>(initStrategies);
  const [selected, setSelected] = useState(0);

  const jsonPreview = useMemo(() => {
    return JSON.stringify({ defaults, strategies }, null, 2);
  }, [defaults, strategies]);

  const s = strategies[selected];

  const updateStrategy = (patch: Partial<StrategyConfig>) => {
    setStrategies(prev =>
      prev.map((it, i) => (i === selected ? { ...it, ...patch } : it))
    );
  };

  const updateRow = (idx: number, patch: Partial<PdfRowConfig>) => {
    setStrategies(prev =>
      prev.map((it, i) =>
        i === selected
          ? {
              ...it,
              pdfRows: it.pdfRows.map((r, ri) =>
                ri === idx ? { ...r, ...patch } : r
              ),
            }
          : it
      )
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-semibold mb-6">
        PDF Strategy Configurator (demo)
      </h1>

      <div className="space-y-6">
        <section className="bg-white rounded-lg border p-4">
          <h2 className="font-semibold mb-4">Global defaults</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="text-sm">
              <span className="block text-gray-600 mb-1">
                Sähkön hinta (€/kWh)
              </span>
              <input
                type="number"
                step="0.001"
                className="w-full border rounded px-3 py-2"
                value={defaults.electricityPrice}
                onChange={e =>
                  setDefaults({
                    ...defaults,
                    electricityPrice: Number(e.target.value),
                  })
                }
              />
            </label>
            <label className="text-sm">
              <span className="block text-gray-600 mb-1">
                Öljyn hinta (€/L)
              </span>
              <input
                type="number"
                step="0.01"
                className="w-full border rounded px-3 py-2"
                value={defaults.oilPrice}
                onChange={e =>
                  setDefaults({ ...defaults, oilPrice: Number(e.target.value) })
                }
              />
            </label>
            <label className="text-sm">
              <span className="block text-gray-600 mb-1">
                Kaasun hinta (€/MWh)
              </span>
              <input
                type="number"
                step="1"
                className="w-full border rounded px-3 py-2"
                value={defaults.gasPricePerMWh}
                onChange={e =>
                  setDefaults({
                    ...defaults,
                    gasPricePerMWh: Number(e.target.value),
                  })
                }
              />
            </label>
            <label className="text-sm">
              <span className="block text-gray-600 mb-1">
                CO₂ sähkö (kg/kWh)
              </span>
              <input
                type="number"
                step="0.001"
                className="w-full border rounded px-3 py-2"
                value={defaults.co2.electricityPerKWh}
                onChange={e =>
                  setDefaults({
                    ...defaults,
                    co2: {
                      ...defaults.co2,
                      electricityPerKWh: Number(e.target.value),
                    },
                  })
                }
              />
            </label>
          </div>
        </section>

        {/* Strategy tabs */}
        <section className="bg-white rounded-lg border p-0">
          <div className="border-b px-4 pt-3">
            <div className="flex flex-wrap gap-2">
              {strategies.map((st, i) => (
                <button
                  key={st.id}
                  className={`px-3 py-2 rounded-t border-b-2 transition-colors ${
                    i === selected
                      ? 'border-green-500 text-green-700 bg-green-50'
                      : 'border-transparent hover:bg-gray-50'
                  }`}
                  onClick={() => setSelected(i)}
                >
                  {st.title}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4">
            <h2 className="font-semibold mb-4">Strategy: {s.title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="text-sm">
                <span className="block text-gray-600 mb-1">
                  Tunniste (sisältää)
                </span>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={s.matchesWhenIncludes}
                  onChange={e =>
                    updateStrategy({ matchesWhenIncludes: e.target.value })
                  }
                />
              </label>
              <label className="text-sm">
                <span className="block text-gray-600 mb-1">
                  Poissulje jos sisältää
                </span>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={s.excludeIfIncludes || ''}
                  onChange={e =>
                    updateStrategy({ excludeIfIncludes: e.target.value })
                  }
                />
              </label>
              <label className="text-sm sm:col-span-2">
                <span className="block text-gray-600 mb-1">
                  Kulutuksen lähde
                </span>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={s.consumptionSource}
                  onChange={e =>
                    updateStrategy({ consumptionSource: e.target.value })
                  }
                />
              </label>
              <label className="text-sm sm:col-span-2">
                <span className="block text-gray-600 mb-1">Hinnan kaava</span>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={s.priceFormula}
                  onChange={e =>
                    updateStrategy({ priceFormula: e.target.value })
                  }
                />
              </label>
              <label className="text-sm">
                <span className="block text-gray-600 mb-1">
                  Huoltokustannus (€/vuosi)
                </span>
                <input
                  type="number"
                  step="1"
                  className="w-full border rounded px-3 py-2"
                  value={s.maintenanceYearly}
                  onChange={e =>
                    updateStrategy({
                      maintenanceYearly: Number(e.target.value),
                    })
                  }
                />
              </label>
            </div>

            <div className="mt-6">
              <h3 className="font-medium mb-2">PDF‑rivit</h3>
              <div className="space-y-3">
                {s.pdfRows.map((row, idx) => (
                  <div
                    key={row.key}
                    className="grid grid-cols-12 gap-2 items-center"
                  >
                    <div className="col-span-2 text-sm text-gray-600">
                      {row.key}
                    </div>
                    <input
                      className="col-span-4 border rounded px-3 py-2"
                      value={row.label}
                      onChange={e => updateRow(idx, { label: e.target.value })}
                    />
                    <input
                      className="col-span-3 border rounded px-3 py-2"
                      value={row.unit}
                      onChange={e => updateRow(idx, { unit: e.target.value })}
                    />
                    <label className="col-span-3 inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={row.enabled}
                        onChange={e =>
                          updateRow(idx, { enabled: e.target.checked })
                        }
                      />
                      Näytä
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-lg border p-4">
          <h2 className="font-semibold mb-3">Esimerkkikonfiguraatio (JSON)</h2>
          <pre className="text-xs bg-gray-50 border rounded p-3 overflow-auto max-h-[400px] whitespace-pre-wrap">
            {jsonPreview}
          </pre>
          <p className="text-xs text-gray-500 mt-2">
            Tämä on havainnollistus. Ei vielä kytketty tuotantoputkeen.
          </p>
        </section>
      </div>
    </div>
  );
}
