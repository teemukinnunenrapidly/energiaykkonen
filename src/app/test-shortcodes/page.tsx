'use client';

import { useState } from 'react';
import { DisplayField } from '@/components/calculator/DisplayField';
import { FormField } from '@/types/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestShortcodesPage() {
  const [testVariables, setTestVariables] = useState({
    currentHeatingCost: 2400,
    newHeatingCost: 1150,
    investmentCost: 8500,
    efficiency: 85,
  });

  // Sample display field with shortcodes
  const sampleDisplayField: FormField = {
    id: 'test-display',
    type: 'display',
    label: 'Your Energy Savings Summary',
    helpText: 'This field shows real-time calculation results using shortcodes',
    required: false,
    enabled: true,
    displayContent: 'Based on your inputs:\n\n💰 Annual Savings: [calc:annual-savings] €\n⏱️ Payback Period: [calc:payback-period]\n📊 Efficiency Rating: [calc:efficiency-rating]\n💸 Current Cost: [calc:current-cost] €\n\n💡 You could save [calc:monthly-savings] € per month!',
    displayStyle: {
      backgroundColor: '#f0f9ff',
      textAlign: 'left',
      fontSize: '16px',
      fontWeight: '500',
    },
    validation: {
      required: false,
    },
  };

  const updateVariable = (key: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setTestVariables(prev => ({
      ...prev,
      [key]: numValue,
    }));
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Shortcode Processing Test
          </h1>
          <p className="text-gray-600">
            Test the display field shortcode processing functionality
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Test Variables Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Test Variables</CardTitle>
              <CardDescription>
                Adjust these values to see how shortcodes update in real-time
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-heating-cost">Current Heating Cost (€)</Label>
                <Input
                  id="current-heating-cost"
                  type="number"
                  value={testVariables.currentHeatingCost}
                  onChange={(e) => updateVariable('currentHeatingCost', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-heating-cost">New Heating Cost (€)</Label>
                <Input
                  id="new-heating-cost"
                  type="number"
                  value={testVariables.newHeatingCost}
                  onChange={(e) => updateVariable('newHeatingCost', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="investment-cost">Investment Cost (€)</Label>
                <Input
                  id="investment-cost"
                  type="number"
                  value={testVariables.investmentCost}
                  onChange={(e) => updateVariable('investmentCost', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="efficiency">Efficiency Rating (%)</Label>
                <Input
                  id="efficiency"
                  type="number"
                  value={testVariables.efficiency}
                  onChange={(e) => updateVariable('efficiency', e.target.value)}
                />
              </div>

              <Button 
                onClick={() => setTestVariables({
                  currentHeatingCost: 2400,
                  newHeatingCost: 1150,
                  investmentCost: 8500,
                  efficiency: 85,
                })}
                variant="outline"
                className="w-full"
              >
                Reset to Default Values
              </Button>
            </CardContent>
          </Card>

          {/* Display Field Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Display Field Preview</CardTitle>
              <CardDescription>
                This shows how the display field will render with shortcodes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DisplayField 
                field={sampleDisplayField}
                formVariables={testVariables}
                className="w-full"
              />
            </CardContent>
          </Card>
        </div>

        {/* Shortcode Information */}
        <Card>
          <CardHeader>
            <CardTitle>How Shortcodes Work</CardTitle>
            <CardDescription>
              Understanding the shortcode processing system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Shortcode Format</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Use the format <code className="bg-gray-100 px-1 rounded">[calc:formula-name]</code> in your display field content.
                </p>
                <div className="space-y-1 text-sm">
                  <div><code className="bg-gray-100 px-1 rounded">[calc:annual-savings]</code> → Annual energy savings</div>
                  <div><code className="bg-gray-100 px-1 rounded">[calc:payback-period]</code> → Investment payback period</div>
                  <div><code className="bg-gray-100 px-1 rounded">[calc:efficiency-rating]</code> → System efficiency</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Real-time Processing</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Shortcodes are automatically processed when form variables change, providing instant feedback to users.
                </p>
                <div className="text-sm text-gray-600">
                  <div>✅ Automatic formula execution</div>
                  <div>✅ Real-time result updates</div>
                  <div>✅ Error handling and fallbacks</div>
                  <div>✅ Customizable styling options</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
