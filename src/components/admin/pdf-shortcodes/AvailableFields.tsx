import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';

export function AvailableFields() {
  const leadFields = [
    // Customer Information
    { name: 'first_name', type: 'string', description: 'Asiakkaan etunimi' },
    { name: 'last_name', type: 'string', description: 'Asiakkaan sukunimi' },
    { name: 'email', type: 'string', description: 'Sähköpostiosoite' },
    { name: 'phone', type: 'string', description: 'Puhelinnumero' },
    { name: 'street_address', type: 'string', description: 'Katuosoite' },
    { name: 'city', type: 'string', description: 'Kaupunki' },
    { name: 'contact_preference', type: 'string', description: 'Yhteydenottotapa' },
    { name: 'message', type: 'string', description: 'Viesti' },
    
    // Property Information
    { name: 'square_meters', type: 'number', description: 'Pinta-ala (m²)' },
    { name: 'ceiling_height', type: 'number', description: 'Huonekorkeus (m)' },
    { name: 'construction_year', type: 'string', description: 'Rakennusvuosi' },
    { name: 'floors', type: 'number', description: 'Kerrosten määrä' },
    
    // Heating Information
    { name: 'heating_type', type: 'string', description: 'Lämmitysmuoto' },
    { name: 'current_heating_cost', type: 'number', description: 'Nykyiset lämmityskulut (€/vuosi)' },
    { name: 'current_energy_consumption', type: 'number', description: 'Energiankulutus (kWh/vuosi)' },
    
    // Household
    { name: 'residents', type: 'number', description: 'Asukkaiden määrä' },
    { name: 'hot_water_usage', type: 'string', description: 'Käyttöveden kulutus' },
    
    // Calculated Values
    { name: 'annual_energy_need', type: 'number', description: 'Laskennallinen energiantarve (kWh)' },
    { name: 'heat_pump_consumption', type: 'number', description: 'Lämpöpumpun kulutus (kWh)' },
    { name: 'heat_pump_cost_annual', type: 'number', description: 'Lämpöpumpun vuosikulu (€)' },
    { name: 'annual_savings', type: 'number', description: 'Vuosittainen säästö (€)' },
    { name: 'five_year_savings', type: 'number', description: '5 vuoden säästö (€)' },
    { name: 'ten_year_savings', type: 'number', description: '10 vuoden säästö (€)' },
    { name: 'payback_period', type: 'number', description: 'Takaisinmaksuaika (vuotta)' },
    { name: 'co2_reduction', type: 'number', description: 'CO₂ vähennys (kg/vuosi)' },
    
    // Metadata
    { name: 'id', type: 'string', description: 'Liidin tunniste' },
    { name: 'created_at', type: 'datetime', description: 'Luontiaika' },
    { name: 'status', type: 'string', description: 'Liidin tila' },
  ];

  const specialFunctions = [
    { name: 'current_date', description: 'Nykyinen päivämäärä' },
    { name: 'current_time', description: 'Nykyinen kellonaika' },
    { name: 'calculation_number', description: 'Laskelman numero' },
    { name: 'translate_heating_type', description: 'Lämmitysmuodon käännös' },
    { name: 'efficiency_rating', description: 'Tehokkuusluokka' },
    { name: 'full_name', description: 'Koko nimi' },
    { name: 'full_address', description: 'Koko osoite' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Lead-taulun kentät</CardTitle>
          <CardDescription>
            Nämä kentät ovat käytettävissä shortcodeissa. Käytä kentän nimeä source_value -kohdassa kun source_type on "field".
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kentän nimi</TableHead>
                  <TableHead>Tyyppi</TableHead>
                  <TableHead>Kuvaus</TableHead>
                  <TableHead>Esimerkki shortcode</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leadFields.map(field => (
                  <TableRow key={field.name}>
                    <TableCell className="font-mono text-sm">{field.name}</TableCell>
                    <TableCell>
                      <Badge variant={field.type === 'number' ? 'default' : 'secondary'}>
                        {field.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{field.description}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        [{field.name}]
                      </code>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Erikoisfunktiot</CardTitle>
          <CardDescription>
            Nämä funktiot ovat käytettävissä kun source_type on "special".
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Funktion nimi</TableHead>
                  <TableHead>Kuvaus</TableHead>
                  <TableHead>Esimerkki shortcode</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {specialFunctions.map(func => (
                  <TableRow key={func.name}>
                    <TableCell className="font-mono text-sm">{func.name}</TableCell>
                    <TableCell className="text-sm">{func.description}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        [{func.name}]
                      </code>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kaavaesimerkkejä</CardTitle>
          <CardDescription>
            Kun source_type on "formula", voit käyttää matemaattisia operaatioita.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="p-3 bg-muted rounded-lg">
              <code className="text-sm">annual_savings / current_heating_cost * 100</code>
              <p className="text-xs text-muted-foreground mt-1">Säästöprosentti</p>
            </div>
            
            <div className="p-3 bg-muted rounded-lg">
              <code className="text-sm">square_meters * ceiling_height * 40</code>
              <p className="text-xs text-muted-foreground mt-1">Arvioitu lämmitystarve</p>
            </div>
            
            <div className="p-3 bg-muted rounded-lg">
              <code className="text-sm">concat(first_name, " ", last_name)</code>
              <p className="text-xs text-muted-foreground mt-1">Koko nimi</p>
            </div>
            
            <div className="p-3 bg-muted rounded-lg">
              <code className="text-sm">round(annual_savings / 12, 2)</code>
              <p className="text-xs text-muted-foreground mt-1">Kuukausittainen säästö</p>
            </div>
          </div>
          
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Tuetut operaatiot:
              </p>
              <p className="text-blue-700 dark:text-blue-300 mt-1">
                +, -, *, /, (), round(), ceil(), floor(), abs(), min(), max(), concat(), uppercase(), lowercase()
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}