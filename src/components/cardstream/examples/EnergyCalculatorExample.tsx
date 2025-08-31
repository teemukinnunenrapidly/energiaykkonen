/**
 * Complete Energy Calculator Example
 * Demonstrates all CardStream design system components and variants
 * Every style uses design tokens from cardstream-design-system.json
 */

import React, { useState, useEffect } from 'react';
import {
  CardStreamContainer,
  CardStream,
  VisualPanel,
} from '../CardStreamContainer';
import {
  FormCard,
  CalculationCard,
  InfoCard,
  ActionCard,
  ProgressCard,
} from '../CardVariants';
import { Field, FieldRow } from '../Form';
import { Button } from '../Button';
import { applyCardStreamTheme } from '../../../lib/cardstream-theme-applier';

interface PropertyData {
  type: string;
  area: string;
  year: string;
  heating: string;
  email: string;
}

export function EnergyCalculatorExample() {
  const [currentStep, setCurrentStep] = useState(0);
  const [propertyData, setPropertyData] = useState<PropertyData>({
    type: '',
    area: '',
    year: '',
    heating: '',
    email: '',
  });

  const [calculationResults, setCalculationResults] = useState<any>(null);

  // Apply the CardStream theme when component mounts
  useEffect(() => {
    applyCardStreamTheme();
  }, []);

  const propertyTypes = [
    { value: 'detached', label: 'Detached House' },
    { value: 'semi', label: 'Semi-detached House' },
    { value: 'terraced', label: 'Terraced House' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'other', label: 'Other' },
  ];

  const heatingTypes = [
    { value: 'gas', label: 'Gas Boiler' },
    { value: 'oil', label: 'Oil Boiler' },
    { value: 'electric', label: 'Electric Heating' },
    { value: 'heat-pump', label: 'Heat Pump' },
    { value: 'wood', label: 'Wood/Biomass' },
  ];

  const progressSteps = [
    { label: 'Property Information', complete: currentStep > 0 },
    { label: 'Energy Assessment', complete: currentStep > 1 },
    { label: 'Results & Recommendations', complete: currentStep > 2 },
  ];

  const handlePropertySubmit = () => {
    // Simulate calculation
    setCalculationResults({
      currentCost: 2847,
      potentialSavings: 1247,
      co2Reduction: 2.3,
      paybackPeriod: 3.2,
    });
    setCurrentStep(1);
  };

  const handleEmailSubmit = () => {
    setCurrentStep(2);
  };

  const updateField = (field: keyof PropertyData) => (value: string) => {
    setPropertyData(prev => ({ ...prev, [field]: value }));
  };

  const getProgress = () => {
    return (currentStep / (progressSteps.length - 1)) * 100;
  };

  return (
    <div style={{ margin: 'var(--cs-spacing-8)' }}>
      <CardStreamContainer>
        <VisualPanel>
          <div
            style={{
              padding: 'var(--cs-spacing-8)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <h1
              style={{
                fontSize: 'var(--cs-font-size-2xl)',
                fontWeight: 'var(--cs-font-weight-light)',
                color: 'var(--cs-color-text-primary)',
                marginBottom: 'var(--cs-spacing-4)',
              }}
            >
              Energy Savings Calculator
            </h1>

            <p
              style={{
                fontSize: 'var(--cs-font-size-base)',
                color: 'var(--cs-color-text-secondary)',
                lineHeight: 'var(--cs-line-height-relaxed)',
                marginBottom: 'var(--cs-spacing-6)',
              }}
            >
              Calculate your potential energy savings and environmental impact
              with our comprehensive assessment tool.
            </p>

            {/* Progress Overview */}
            <ProgressCard
              title="Your Progress"
              steps={progressSteps}
              currentStep={currentStep}
              progress={getProgress()}
            />

            {/* Contextual Information */}
            {currentStep === 0 && (
              <InfoCard
                title="Property Assessment"
                content="We'll analyze your property details to provide accurate energy efficiency recommendations tailored to your specific situation."
                icon="🏠"
              />
            )}

            {currentStep === 1 && (
              <InfoCard
                title="Energy Analysis"
                content="Our advanced algorithms calculate potential savings based on current energy prices, property characteristics, and available efficiency measures."
                icon="⚡"
              />
            )}

            {currentStep >= 2 && (
              <InfoCard
                title="Recommendations"
                content="Review your personalized energy efficiency recommendations and potential savings. We'll help you prioritize the most cost-effective improvements."
                icon="💡"
              />
            )}
          </div>
        </VisualPanel>

        <CardStream>
          {/* Step 1: Property Information Form */}
          {currentStep === 0 && (
            <FormCard
              stepIndicator="Step 1 of 3"
              title="Tell us about your property"
              description="We need some basic information to calculate your potential energy savings and provide accurate recommendations."
              onSubmit={handlePropertySubmit}
            >
              <Field
                label="Property Type"
                type="select"
                placeholder="Select your property type"
                value={propertyData.type}
                onChange={updateField('type')}
                options={propertyTypes}
                required
              />

              <FieldRow>
                <Field
                  label="Floor Area"
                  type="number"
                  placeholder="Square meters"
                  value={propertyData.area}
                  onChange={updateField('area')}
                  required
                />
                <Field
                  label="Construction Year"
                  type="number"
                  placeholder="e.g. 1985"
                  value={propertyData.year}
                  onChange={updateField('year')}
                />
              </FieldRow>

              <Field
                label="Current Heating System"
                type="select"
                placeholder="Select heating system"
                value={propertyData.heating}
                onChange={updateField('heating')}
                options={heatingTypes}
                required
              />

              <div style={{ marginTop: 'var(--cs-spacing-6)' }}>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={
                    !propertyData.type ||
                    !propertyData.area ||
                    !propertyData.heating
                  }
                >
                  Calculate Savings
                </Button>
              </div>
            </FormCard>
          )}

          {/* Step 2: Calculation Results */}
          {currentStep === 1 && calculationResults && (
            <>
              <CalculationCard
                title="Your Energy Savings Potential"
                description="Based on your property details, here's what you could save:"
                badge={{ text: 'Excellent Potential', variant: 'success' }}
                metrics={[
                  {
                    label: 'Annual Savings',
                    value: `€${calculationResults.potentialSavings.toLocaleString()}`,
                  },
                  {
                    label: 'Current Annual Cost',
                    value: `€${calculationResults.currentCost.toLocaleString()}`,
                  },
                  {
                    label: 'CO₂ Reduction',
                    value: calculationResults.co2Reduction,
                    unit: 'tonnes/year',
                  },
                  {
                    label: 'Payback Period',
                    value: calculationResults.paybackPeriod,
                    unit: 'years',
                  },
                ]}
              />

              <FormCard
                stepIndicator="Step 2 of 3"
                title="Get your detailed report"
                description="Enter your email to receive a comprehensive energy efficiency report with specific recommendations."
                onSubmit={handleEmailSubmit}
              >
                <Field
                  label="Email Address"
                  type="email"
                  placeholder="your@email.com"
                  value={propertyData.email}
                  onChange={updateField('email')}
                  required
                />

                <div style={{ marginTop: 'var(--cs-spacing-6)' }}>
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={!propertyData.email}
                  >
                    Send My Report
                  </Button>
                </div>
              </FormCard>
            </>
          )}

          {/* Step 3: Final Actions */}
          {currentStep >= 2 && (
            <>
              <ActionCard
                title="Report Sent Successfully!"
                description="We've sent your detailed energy efficiency report to your email. Check your inbox for personalized recommendations."
                primaryAction={{
                  text: 'Start Another Assessment',
                  onClick: () => {
                    setCurrentStep(0);
                    setPropertyData({
                      type: '',
                      area: '',
                      year: '',
                      heating: '',
                      email: '',
                    });
                    setCalculationResults(null);
                  },
                }}
                secondaryAction={{
                  text: 'Download PDF',
                  onClick: () => console.log('Download PDF'),
                }}
              />

              <InfoCard
                title="Next Steps"
                description="What you can do now to start saving:"
                content="1. Review the recommendations in your email report
2. Contact local certified installers for quotes
3. Check available government incentives and rebates
4. Schedule a detailed energy audit for maximum accuracy"
                action={{
                  text: 'Find Local Installers',
                  onClick: () => console.log('Find installers'),
                }}
              />
            </>
          )}
        </CardStream>
      </CardStreamContainer>
    </div>
  );
}
