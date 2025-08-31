/**
 * Configuration Demo Component
 * Demonstrates how to change CardStream appearance by modifying the configuration
 * Shows dynamic color changes and theme switching
 */

import React, { useState, useEffect } from 'react';
import {
  CardStreamContainer,
  CardStream,
  VisualPanel,
} from '../CardStreamContainer';
import { FormCard, CalculationCard, InfoCard } from '../CardVariants';
import { Field } from '../Form';
import { Button } from '../Button';
import { Badge } from '../Badge';
import {
  applyCardStreamTheme,
  getCardStreamConfig,
  getConfigValue,
} from '../../../lib/cardstream-theme-applier';

export function ConfigurationDemo() {
  const [currentTheme, setCurrentTheme] = useState('green');

  // Apply the CardStream theme when component mounts
  useEffect(() => {
    applyCardStreamTheme();
  }, []);

  const changeTheme = (color: string) => {
    const config = getCardStreamConfig();

    // Define color schemes
    const colorSchemes: Record<string, any> = {
      green: {
        colors: {
          ...config.colors,
          brand: {
            primary: '#10b981',
            primaryHover: '#059669',
            primaryLight: '#ecfdf5',
          },
        },
      },
      blue: {
        colors: {
          ...config.colors,
          brand: {
            primary: '#3b82f6',
            primaryHover: '#2563eb',
            primaryLight: '#eff6ff',
          },
        },
      },
      purple: {
        colors: {
          ...config.colors,
          brand: {
            primary: '#8b5cf6',
            primaryHover: '#7c3aed',
            primaryLight: '#f5f3ff',
          },
        },
      },
      orange: {
        colors: {
          ...config.colors,
          brand: {
            primary: '#f97316',
            primaryHover: '#ea580c',
            primaryLight: '#fff7ed',
          },
        },
      },
    };

    // Apply the new theme
    const newConfig = {
      ...config,
      ...colorSchemes[color],
    };

    applyCardStreamTheme(newConfig);
    setCurrentTheme(color);
  };

  return (
    <div style={{ margin: 'var(--cs-spacing-8)' }}>
      {/* Theme Selector */}
      <div
        style={{
          marginBottom: 'var(--cs-spacing-6)',
          padding: 'var(--cs-spacing-4)',
          background: 'var(--cs-color-background-primary)',
          borderRadius: 'var(--cs-border-radius-lg)',
          border: '1px solid var(--cs-color-border-default)',
        }}
      >
        <h3
          style={{
            margin: '0 0 var(--cs-spacing-3) 0',
            fontSize: 'var(--cs-font-size-lg)',
            color: 'var(--cs-color-text-primary)',
          }}
        >
          Theme Configuration Demo
        </h3>
        <p
          style={{
            margin: '0 0 var(--cs-spacing-4) 0',
            fontSize: 'var(--cs-font-size-base)',
            color: 'var(--cs-color-text-secondary)',
          }}
        >
          Change the brand color by clicking the buttons below. This
          demonstrates how editing the cardstream-complete-config.json file
          would work.
        </p>
        <div style={{ display: 'flex', gap: 'var(--cs-spacing-2)' }}>
          <Button
            variant={currentTheme === 'green' ? 'primary' : 'ghost'}
            onClick={() => changeTheme('green')}
          >
            Green
          </Button>
          <Button
            variant={currentTheme === 'blue' ? 'primary' : 'ghost'}
            onClick={() => changeTheme('blue')}
          >
            Blue
          </Button>
          <Button
            variant={currentTheme === 'purple' ? 'primary' : 'ghost'}
            onClick={() => changeTheme('purple')}
          >
            Purple
          </Button>
          <Button
            variant={currentTheme === 'orange' ? 'primary' : 'ghost'}
            onClick={() => changeTheme('orange')}
          >
            Orange
          </Button>
        </div>
        <div
          style={{
            marginTop: 'var(--cs-spacing-3)',
            fontSize: 'var(--cs-font-size-sm)',
            color: 'var(--cs-color-text-tertiary)',
          }}
        >
          Current brand color:{' '}
          <strong style={{ color: 'var(--cs-color-brand-primary)' }}>
            {String(getConfigValue('colors.brand.primary') || '#10b981')}
          </strong>
        </div>
      </div>

      <CardStreamContainer>
        <VisualPanel>
          <div className="cs-visual-panel-content">
            <div
              style={{
                fontSize: '80px',
                marginBottom: 'var(--cs-spacing-4)',
                animation: 'float 3s ease-in-out infinite',
              }}
            >
              🎨
            </div>
            <h1
              style={{
                fontSize: '28px',
                fontWeight: '300',
                color: '#ffffff',
                marginBottom: '12px',
                textAlign: 'center',
              }}
            >
              Configuration Demo
            </h1>
            <p
              style={{
                fontSize: '16px',
                fontWeight: '400',
                color: 'rgba(255, 255, 255, 0.9)',
                textAlign: 'center',
                lineHeight: '1.5',
              }}
            >
              Watch how the entire system updates when you change the brand
              color above.
            </p>
          </div>

          {/* Info Section */}
          <div
            style={{
              background: '#ffffff',
              padding: '24px',
              borderTop: '1px solid #e5e7eb',
            }}
          >
            <div
              style={{
                fontSize: '22px',
                fontWeight: '300',
                color: '#1f2937',
                marginBottom: '8px',
              }}
            >
              How It Works
            </div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: '400',
                color: '#6b7280',
                lineHeight: '1.5',
                marginBottom: '16px',
              }}
            >
              The entire CardStream system is controlled by a single JSON file.
              Change any value and the UI updates instantly.
            </div>
            <div
              style={{
                marginTop: '16px',
                padding: '12px',
                background: '#ecfdf5',
                borderLeft: '4px solid var(--cs-color-brand-primary)',
                borderRadius: '4px',
                fontSize: '13px',
                color: '#047857',
              }}
            >
              💡 Tip: In production, you&apos;d edit
              cardstream-complete-config.json directly instead of using buttons.
            </div>
          </div>
        </VisualPanel>

        <CardStream>
          <FormCard
            stepIndicator="Configuration Demo"
            title="Form Card Example"
            description="Notice how the step indicator, border, and focus colors change with the theme."
          >
            <Field
              label="Email Address"
              type="email"
              placeholder="your@email.com"
              value=""
              onChange={() => {}}
            />
            <Field
              label="Company Name"
              type="text"
              placeholder="Your company"
              value=""
              onChange={() => {}}
            />
            <div style={{ marginTop: 'var(--cs-spacing-6)' }}>
              <Button variant="primary">Submit Form</Button>
            </div>
          </FormCard>

          <CalculationCard
            title="Calculation Results"
            description="Calculation cards also inherit the theme colors"
            badge={{ text: 'Updated', variant: 'success' }}
            metrics={[
              {
                label: 'Current Brand Color',
                value: String(
                  getConfigValue('colors.brand.primary') || '#10b981'
                ),
              },
              {
                label: 'Theme',
                value:
                  currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1),
              },
              {
                label: 'Components Updated',
                value: '12',
                unit: 'elements',
              },
            ]}
          />

          <InfoCard
            title="JSON Configuration"
            content="Here's how you would change the brand color in cardstream-complete-config.json:"
            icon="📝"
          />

          <div
            style={{
              background: 'var(--cs-color-background-primary)',
              borderRadius: 'var(--cs-border-radius-lg)',
              border: '1px solid var(--cs-color-border-default)',
              padding: 'var(--cs-spacing-6)',
              marginBottom: 'var(--cs-spacing-5)',
              fontFamily: 'monospace',
              fontSize: '13px',
            }}
          >
            <div
              style={{
                color: 'var(--cs-color-text-secondary)',
                marginBottom: 'var(--cs-spacing-2)',
              }}
            >
              cardstream-complete-config.json
            </div>
            <pre
              style={{
                margin: 0,
                color: 'var(--cs-color-text-primary)',
                lineHeight: '1.4',
              }}
            >
              {`{
  "cardStreamConfig": {
    "colors": {
      "brand": {
        "primary": "${String(getConfigValue('colors.brand.primary') || '#10b981')}"
      }
    }
  }
}`}
            </pre>
          </div>

          <InfoCard
            title="Complete System Control"
            content="Every aspect of the CardStream design system can be controlled from the single JSON file:"
            icon="🎯"
          />

          <div
            style={{
              background: 'var(--cs-color-background-primary)',
              borderRadius: 'var(--cs-border-radius-lg)',
              border: '1px solid var(--cs-color-border-default)',
              padding: 'var(--cs-spacing-6)',
              marginBottom: 'var(--cs-spacing-5)',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'var(--cs-spacing-4)',
              }}
            >
              <div>
                <Badge variant="primary">Layout</Badge>
                <div
                  style={{
                    fontSize: 'var(--cs-font-size-sm)',
                    color: 'var(--cs-color-text-secondary)',
                    marginTop: 'var(--cs-spacing-1)',
                  }}
                >
                  Panel ratios, spacing, containers
                </div>
              </div>
              <div>
                <Badge variant="primary">Colors</Badge>
                <div
                  style={{
                    fontSize: 'var(--cs-font-size-sm)',
                    color: 'var(--cs-color-text-secondary)',
                    marginTop: 'var(--cs-spacing-1)',
                  }}
                >
                  Brand, text, background, borders
                </div>
              </div>
              <div>
                <Badge variant="primary">Typography</Badge>
                <div
                  style={{
                    fontSize: 'var(--cs-font-size-sm)',
                    color: 'var(--cs-color-text-secondary)',
                    marginTop: 'var(--cs-spacing-1)',
                  }}
                >
                  Font sizes, weights, line heights
                </div>
              </div>
              <div>
                <Badge variant="primary">Animations</Badge>
                <div
                  style={{
                    fontSize: 'var(--cs-font-size-sm)',
                    color: 'var(--cs-color-text-secondary)',
                    marginTop: 'var(--cs-spacing-1)',
                  }}
                >
                  Transitions, hover effects, timing
                </div>
              </div>
            </div>
          </div>
        </CardStream>
      </CardStreamContainer>
    </div>
  );
}
