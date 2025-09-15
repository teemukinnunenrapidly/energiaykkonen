import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
import { requireAdmin } from '@/lib/auth';

const CONFIG_RELATIVE_PATH = 'src/config/pdf-preview-formulas.json';

const DEFAULTS: Record<string, string> = {
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

async function readConfig(): Promise<Record<string, string>> {
  const absPath = path.resolve(process.cwd(), CONFIG_RELATIVE_PATH);
  try {
    const buf = await fs.readFile(absPath, 'utf8');
    const json = JSON.parse(buf);
    return json && typeof json === 'object' ? json : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

async function writeConfig(data: Record<string, string>): Promise<void> {
  const absPath = path.resolve(process.cwd(), CONFIG_RELATIVE_PATH);
  const json = JSON.stringify(data, null, 2) + '\n';
  // Ensure directory exists
  const dir = path.dirname(absPath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(absPath, json, 'utf8');
}

export async function GET() {
  const cfg = await readConfig();
  return NextResponse.json({ formulas: cfg });
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin(request);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const incoming = body?.formulas as Record<string, unknown>;
    if (!incoming || typeof incoming !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const clean: Record<string, string> = {};
    for (const [k, v] of Object.entries(incoming)) {
      if (typeof v === 'string') clean[k] = v;
    }

    await writeConfig(clean);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to save pdf preview formulas:', error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}


