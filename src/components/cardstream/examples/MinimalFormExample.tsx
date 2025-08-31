/**
 * Minimal Form Example - Pure CardStream Design System
 * Demonstrates the core minimal design philosophy:
 * - 4px green left border on cards
 * - Borderless inputs with bottom borders only
 * - Uppercase labels with letter spacing
 * - Token-based styling throughout
 */

import React, { useState, useEffect } from 'react';
import { CardStreamContainer, CardStream, VisualPanel } from '../CardStreamContainer';
import { Card, CardHeader } from '../Card';
import { Field, FieldRow, FormGroup } from '../Form';
import { Button } from '../Button';
import { Badge } from '../Badge';
import { applyCardStreamTheme, getCardStreamConfig, createConfigStyles } from '../../../lib/cardstream-theme-applier';

interface ContactForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
  newsletter: boolean;
}

export function MinimalFormExample() {
  const [formData, setFormData] = useState<ContactForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: '',
    newsletter: false
  });

  const [errors, setErrors] = useState<Partial<ContactForm>>({});
  const [submitted, setSubmitted] = useState(false);

  // Apply the CardStream theme when component mounts
  useEffect(() => {
    applyCardStreamTheme();
  }, []);

  // Get configuration for inline styles
  const config = getCardStreamConfig();

  const updateField = (field: keyof ContactForm) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ContactForm> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      setSubmitted(true);
      console.log('Form submitted:', formData);
    }
  };

  const handleReset = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      message: '',
      newsletter: false
    });
    setErrors({});
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div style={{ margin: 'var(--cs-spacing-8)' }}>
        <CardStreamContainer>
          <VisualPanel>
            <div style={{ 
              padding: 'var(--cs-spacing-8)',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: 'var(--cs-font-size-4xl)',
                marginBottom: 'var(--cs-spacing-4)'
              }}>
                ✓
              </div>
              <h2 style={{
                fontSize: 'var(--cs-font-size-xl)',
                color: 'var(--cs-color-semantic-success)',
                marginBottom: 'var(--cs-spacing-2)'
              }}>
                Message Sent!
              </h2>
              <p style={{
                color: 'var(--cs-color-text-secondary)',
                fontSize: 'var(--cs-font-size-base)'
              }}>
                Thank you for your message. We'll get back to you soon.
              </p>
            </div>
          </VisualPanel>

          <CardStream>
            <Card variant="info" animate>
              <CardHeader
                title="Thank you for contacting us"
                description="Your message has been sent successfully."
              />
              
              <div style={{ marginBottom: 'var(--cs-spacing-6)' }}>
                <h3 style={{
                  fontSize: 'var(--cs-font-size-lg)',
                  fontWeight: 'var(--cs-font-weight-medium)',
                  color: 'var(--cs-color-text-primary)',
                  marginBottom: 'var(--cs-spacing-3)'
                }}>
                  What happens next?
                </h3>
                
                <ul style={{
                  fontSize: 'var(--cs-font-size-base)',
                  color: 'var(--cs-color-text-secondary)',
                  lineHeight: 'var(--cs-line-height-relaxed)',
                  paddingLeft: 'var(--cs-spacing-5)'
                }}>
                  <li>We'll review your message within 24 hours</li>
                  <li>You'll receive a confirmation email shortly</li>
                  <li>Our team will contact you with next steps</li>
                </ul>
              </div>

              <div style={{ display: 'flex', gap: 'var(--cs-spacing-4)' }}>
                <Button variant="primary" onClick={handleReset}>
                  Send Another Message
                </Button>
                <Button variant="ghost" onClick={() => window.location.href = '/'}>
                  Return Home
                </Button>
              </div>
            </Card>
          </CardStream>
        </CardStreamContainer>
      </div>
    );
  }

  return (
    <div style={{ margin: 'var(--cs-spacing-8)' }}>
      <CardStreamContainer>
        <VisualPanel>
          <div style={{ padding: 'var(--cs-spacing-8)' }}>
            <h1 style={{
              fontSize: 'var(--cs-font-size-2xl)',
              fontWeight: 'var(--cs-font-weight-light)',
              color: 'var(--cs-color-text-primary)',
              marginBottom: 'var(--cs-spacing-4)'
            }}>
              Contact Us
            </h1>
            
            <p style={{
              fontSize: 'var(--cs-font-size-base)',
              color: 'var(--cs-color-text-secondary)',
              lineHeight: 'var(--cs-line-height-relaxed)',
              marginBottom: 'var(--cs-spacing-6)'
            }}>
              Get in touch with our team. We'd love to hear from you and will respond as quickly as possible.
            </p>

            <div style={{ marginBottom: 'var(--cs-spacing-6)' }}>
              <div style={{
                padding: 'var(--cs-spacing-4)',
                background: 'var(--cs-color-background-tertiary)',
                borderRadius: 'var(--cs-border-radius-base)',
                border: '1px solid var(--cs-color-border-default)'
              }}>
                <div style={{
                  fontSize: 'var(--cs-font-size-sm)',
                  fontWeight: 'var(--cs-font-weight-medium)',
                  color: 'var(--cs-color-text-primary)',
                  marginBottom: 'var(--cs-spacing-2)'
                }}>
                  Office Hours
                </div>
                <div style={{
                  fontSize: 'var(--cs-font-size-base)',
                  color: 'var(--cs-color-text-secondary)'
                }}>
                  Monday - Friday: 9:00 AM - 6:00 PM<br />
                  Saturday: 10:00 AM - 4:00 PM<br />
                  Sunday: Closed
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--cs-spacing-2)',
              marginTop: 'var(--cs-spacing-8)'
            }}>
              <Badge variant="primary">Minimal Design</Badge>
              <Badge variant="default">Token System</Badge>
            </div>
          </div>
        </VisualPanel>

        <CardStream>
          <Card variant="form" animate>
            <CardHeader
              stepIndicator="Contact Form"
              title="Send us a message"
              description="Fill out the form below and we'll get back to you as soon as possible."
            />

            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
              <FieldRow>
                <Field
                  label="First Name"
                  type="text"
                  placeholder="Enter your first name"
                  value={formData.firstName}
                  onChange={updateField('firstName')}
                  error={!!errors.firstName}
                  required
                />
                <Field
                  label="Last Name"
                  type="text"
                  placeholder="Enter your last name"
                  value={formData.lastName}
                  onChange={updateField('lastName')}
                />
              </FieldRow>

              <FieldRow>
                <Field
                  label="Email Address"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={updateField('email')}
                  error={!!errors.email}
                  required
                />
                <Field
                  label="Phone Number"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={updateField('phone')}
                />
              </FieldRow>

              <Field
                label="Message"
                type="textarea"
                placeholder="Tell us how we can help you..."
                value={formData.message}
                onChange={updateField('message')}
                error={!!errors.message}
                required
              />

              <FormGroup>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--cs-spacing-3)'
                }}>
                  <input
                    type="checkbox"
                    id="newsletter"
                    checked={formData.newsletter}
                    onChange={(e) => setFormData(prev => ({ ...prev, newsletter: e.target.checked }))}
                    style={{
                      width: 'var(--cs-spacing-4)',
                      height: 'var(--cs-spacing-4)',
                      accentColor: 'var(--cs-color-brand-primary)'
                    }}
                  />
                  <label 
                    htmlFor="newsletter"
                    style={{
                      fontSize: 'var(--cs-font-size-base)',
                      color: 'var(--cs-color-text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    Subscribe to our newsletter for updates
                  </label>
                </div>
              </FormGroup>

              {/* Error Display */}
              {Object.keys(errors).length > 0 && (
                <div style={{
                  padding: 'var(--cs-spacing-4)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid var(--cs-color-semantic-error)',
                  borderRadius: 'var(--cs-border-radius-base)',
                  marginBottom: 'var(--cs-spacing-5)'
                }}>
                  <div style={{
                    fontSize: 'var(--cs-font-size-sm)',
                    fontWeight: 'var(--cs-font-weight-medium)',
                    color: 'var(--cs-color-semantic-error)',
                    marginBottom: 'var(--cs-spacing-2)'
                  }}>
                    Please fix the following errors:
                  </div>
                  {Object.entries(errors).map(([field, error]) => (
                    <div key={field} style={{
                      fontSize: 'var(--cs-font-size-sm)',
                      color: 'var(--cs-color-semantic-error)'
                    }}>
                      • {error}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ 
                display: 'flex', 
                gap: 'var(--cs-spacing-4)', 
                marginTop: 'var(--cs-spacing-8)' 
              }}>
                <Button variant="primary" type="submit">
                  Send Message
                </Button>
                <Button variant="ghost" type="button" onClick={handleReset}>
                  Clear Form
                </Button>
              </div>
            </form>
          </Card>
        </CardStream>
      </CardStreamContainer>
    </div>
  );
}