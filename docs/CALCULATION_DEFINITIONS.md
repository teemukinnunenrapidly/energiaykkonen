# Calculation Definitions for E1 Calculator

## Input Fields (from form_data)

These are the raw inputs collected from the user:

### Property Information

- `neliot` - Square meters of the property (m²)
- `huonekorkeus` - Ceiling height (m), default: 2.5
- `rakennusvuosi` - Year of construction
- `floors` - Number of floors, default: 1
- `henkilomaara` - Number of residents, default: 2

### Current Heating

- `lammitysmuoto` - Current heating type (e.g., "Öljylämmitys", "Sähkölämmitys")
- `vesikiertoinen` - Water circulation system type
- `kokonaismenekki` - Total consumption (from lookup)
- `menekinhintavuosi` - Annual heating cost (from lookup)

### Location

- `paikkakunta` - Municipality
- `osoite` - Address
- `postcode` - Postal code

## Calculations Required

### 1. Annual Energy Need (`annual_energy_need`)

**Formula:**

```
annual_energy_need = neliot * 100 * (huonekorkeus / 2.5)
```

**Description:** Base energy requirement in kWh/year
**Unit:** kWh

### 2. Current Heating Consumption (`current_heating_consumption`)

**Source:** Lookup table based on:

- Property size (`neliot`)
- Heating type (`lammitysmuoto`)
- Building year (`rakennusvuosi`)

**Lookup:** `[lookup:kokonaismenekki]`
**Unit:** liters (for oil) or kWh (for electricity)

### 3. Current Heating Cost (`current_heating_cost`)

**Source:** Lookup table or calculation
**Lookup:** `[lookup:menekin-hinta]`
**Formula (if oil):** `kokonaismenekki * 1.3` (€1.30 per liter)
**Unit:** €/year

### 4. Heat Pump Consumption (`heat_pump_consumption`)

**Formula:**

```
heat_pump_consumption = annual_energy_need / COP
where COP = 3.3 (average coefficient of performance)
```

**Unit:** kWh/year

### 5. Heat Pump Annual Cost (`heat_pump_cost_annual`)

**Formula:**

```
heat_pump_cost_annual = heat_pump_consumption * electricity_price
where electricity_price = 0.12 €/kWh
```

**Unit:** €/year

### 6. Annual Savings (`annual_savings`)

**Formula:**

```
annual_savings = current_heating_cost - heat_pump_cost_annual
```

**Unit:** €/year

### 7. Five Year Savings (`five_year_savings`)

**Formula:**

```
five_year_savings = annual_savings * 5
```

**Unit:** €

### 8. Ten Year Savings (`ten_year_savings`)

**Formula:**

```
ten_year_savings = annual_savings * 10
```

**Unit:** €

### 9. Payback Period (`payback_period`)

**Formula:**

```
payback_period = installation_cost / annual_savings
where installation_cost = 15000 € (default)
```

**Unit:** years

### 10. CO2 Reduction (`co2_reduction`)

**Formula varies by heating type:**

For oil heating:

```
co2_reduction = kokonaismenekki * 2.66
(2.66 kg CO2 per liter of heating oil)
```

For electric heating:

```
co2_reduction = (current_consumption - heat_pump_consumption) * 0.181
(0.181 kg CO2/kWh for Finnish electricity grid)
```

**Unit:** kg CO2/year

## Additional Calculations

### 11. Monthly Savings (`monthly_savings`)

**Formula:**

```
monthly_savings = annual_savings / 12
```

**Unit:** €/month

### 12. Energy Efficiency Improvement (`efficiency_improvement`)

**Formula:**

```
efficiency_improvement = ((current_consumption - heat_pump_consumption) / current_consumption) * 100
```

**Unit:** %

### 13. Return on Investment (`roi`)

**Formula:**

```
roi = (ten_year_savings - installation_cost) / installation_cost * 100
```

**Unit:** %

## Lookup Tables Needed

### 1. Oil Consumption Table (`kokonaismenekki`)

Based on:

- Property size
- Building age
- Number of floors

### 2. Electricity Consumption Table

Based on:

- Property size
- Heating type (direct electric, storage heaters, etc.)

### 3. Price Tables

- Oil price per liter
- Electricity price per kWh
- District heating price per MWh

## Constants

```javascript
const CONSTANTS = {
  // Energy factors
  BASE_ENERGY_PER_M2: 100, // kWh/m²/year
  CEILING_HEIGHT_FACTOR: 2.5, // Reference ceiling height
  HEAT_PUMP_COP: 3.3, // Coefficient of Performance

  // Prices
  ELECTRICITY_PRICE: 0.12, // €/kWh
  OIL_PRICE: 1.3, // €/liter

  // Installation
  DEFAULT_INSTALLATION_COST: 15000, // €

  // CO2 factors
  CO2_PER_LITER_OIL: 2.66, // kg CO2/liter
  CO2_PER_KWH_ELECTRICITY: 0.181, // kg CO2/kWh

  // Conversion factors
  KWH_PER_LITER_OIL: 10, // kWh/liter
};
```

## Implementation in Database

These calculations should be stored in the `formulas` table with appropriate names:

- `annual-energy-need`
- `heat-pump-consumption`
- `heat-pump-cost-annual`
- `annual-savings`
- `five-year-savings`
- `ten-year-savings`
- `payback-period`
- `co2-reduction`

Each formula can reference form fields using `{field_name}` syntax and other calculations using `[calc:formula-name]` syntax.
