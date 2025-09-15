'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Download, Eye, Loader2 } from 'lucide-react';

export default function TestPDF() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');

  // Test data matching the actual form structure and PDF mappings
  const testData = {
    // Customer Information (matching pdf-field-mappings.ts)
    first_name: 'Matti',
    last_name: 'Meikäläinen',
    name: 'Matti Meikäläinen', // For PDF mapping
    email: 'matti.meikalainen@example.fi',
    phone: '+358 40 123 4567',
    street_address: 'Kotikatu 123',
    address: 'Kotikatu 123', // For PDF mapping
    postcode: '00100',
    city: 'Helsinki',

    // Building Information
    square_meters: 150,
    building_area: 150, // For PDF mapping
    ceiling_height: 2.5,
    construction_year: '1991-2010',
    building_year: 1995, // For PDF mapping
    floors: 2,

    // Household
    residents: 4,
    people_count: 4, // For PDF mapping
    hot_water_usage: 'Normal',

    // Current Heating System
    heating_type: 'Oil',
    current_heating: 'Öljylämmitys', // For PDF mapping
    current_heating_cost: 3200,
    current_energy_consumption: 25000,

    // Calculated Values (normally from calculation engine)
    annual_energy_need: 22000,
    total_energy_need: 22000, // For PDF mapping
    heat_pump_consumption: 6600,
    heat_pump_cost_annual: 792,

    // Savings calculations
    annual_savings: 2408,
    yearly_savings: 2408, // For PDF mapping
    five_year_savings: 12040,
    ten_year_savings: 24080,
    payback_period: 7.5,
    co2_reduction: 4400,

    // Additional calculated values for PDF
    current_yearly_cost: 3200,
    current_5year_cost: 16000,
    current_10year_cost: 32000,
    new_yearly_cost: 792,
    new_5year_cost: 3960,
    new_10year_cost: 7920,

    // Lookup values (normally from database)
    oil_consumption: 2500,
    oil_price: 1.28,
    electricity_price: 0.12,
    heat_pump_maintenance_5y: 500,
    heat_pump_maintenance_10y: 1200,
    current_co2: 6600,
    new_co2: 2200,
    recommended_heat_pump: 'Mitsubishi Zubadan 12kW',
    heat_pump_cop: 3.2,
    ely_support: 4000,
    household_deduction: 2250,
  };

  const generatePDF = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);
    setPdfUrl('');

    try {
      console.log('🚀 Sending test data for PDF generation...');

      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to generate PDF: ${errorData}`);
      }

      const blob = await response.blob();
      console.log('✅ PDF generated successfully, size:', blob.size, 'bytes');

      // Create URL for the PDF
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setSuccess(true);
    } catch (err) {
      console.error('❌ PDF generation error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const viewPDF = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  const downloadPDF = () => {
    if (pdfUrl) {
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = `saastolaskelma-test-${Date.now()}.pdf`;
      a.click();
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-6 h-6" />
            PDF Generation Test Page
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Data Preview */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Test Data Preview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4 bg-muted/30">
                <h4 className="font-medium mb-2">Customer Info</h4>
                <div className="text-sm space-y-1">
                  <div>
                    Name: {testData.first_name} {testData.last_name}
                  </div>
                  <div>Email: {testData.email}</div>
                  <div>Phone: {testData.phone}</div>
                  <div>
                    Address: {testData.street_address}, {testData.postcode}{' '}
                    {testData.city}
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-muted/30">
                <h4 className="font-medium mb-2">Building Info</h4>
                <div className="text-sm space-y-1">
                  <div>Area: {testData.square_meters} m²</div>
                  <div>Year: {testData.building_year}</div>
                  <div>Floors: {testData.floors}</div>
                  <div>Residents: {testData.residents}</div>
                </div>
              </Card>

              <Card className="p-4 bg-muted/30">
                <h4 className="font-medium mb-2">Current Heating</h4>
                <div className="text-sm space-y-1">
                  <div>Type: {testData.current_heating}</div>
                  <div>Annual Cost: €{testData.current_yearly_cost}</div>
                  <div>
                    Energy Use: {testData.current_energy_consumption} kWh
                  </div>
                  <div>CO2: {testData.current_co2} kg/year</div>
                </div>
              </Card>

              <Card className="p-4 bg-muted/30">
                <h4 className="font-medium mb-2">Savings</h4>
                <div className="text-sm space-y-1">
                  <div className="text-green-600 font-semibold">
                    Annual: €{testData.annual_savings}
                  </div>
                  <div>5 Years: €{testData.five_year_savings}</div>
                  <div>10 Years: €{testData.ten_year_savings}</div>
                  <div>CO2 Reduction: {testData.co2_reduction} kg/year</div>
                </div>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={generatePDF}
              disabled={loading}
              size="lg"
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Test PDF
                </>
              )}
            </Button>

            {success && pdfUrl && (
              <>
                <Button onClick={viewPDF} variant="outline" size="lg">
                  <Eye className="mr-2 h-4 w-4" />
                  View PDF
                </Button>

                <Button onClick={downloadPDF} variant="outline" size="lg">
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </>
            )}
          </div>

          {/* Success Message */}
          {success && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                ✅ PDF generated successfully! You can now view or download it.
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert className="bg-red-50 border-red-200">
              <AlertDescription className="text-red-800">
                ❌ Error: {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Debug Info */}
          <details className="mt-6">
            <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
              Show Full Test Data (JSON)
            </summary>
            <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-x-auto">
              {JSON.stringify(testData, null, 2)}
            </pre>
          </details>

          {/* Instructions */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <h4 className="font-medium mb-2">Testing Instructions</h4>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>
                Click &quot;Generate Test PDF&quot; to create a PDF with the
                test data
              </li>
              <li>
                Once generated, you can view it in a new tab or download it
              </li>
              <li>
                Check that all shortcodes are properly replaced with values
              </li>
              <li>Verify the PDF layout and formatting looks correct</li>
              <li>
                Test data includes all fields mapped in
                /src/config/pdf-field-mappings.ts
              </li>
            </ol>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
