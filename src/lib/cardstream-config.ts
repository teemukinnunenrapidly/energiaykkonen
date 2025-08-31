/**
 * CardStream Configuration Service
 * Reads from cardstream-complete-config.json and provides typed access to all styling values
 */

import fs from 'fs';
import path from 'path';

export interface CardStreamConfig {
  cardStreamConfig: {
    version: string;
    theme: string;
    lastModified: string;
    container: Record<string, any>;
    layout: Record<string, any>;
    visualSupport: Record<string, any>;
    cardStream: Record<string, any>;
    card: Record<string, any>;
    formElements: Record<string, any>;
    calculationCard: Record<string, any>;
    infoCard: Record<string, any>;
    actionCard: Record<string, any>;
    responsive: Record<string, any>;
    animations: Record<string, any>;
    colors: Record<string, any>;
    typography: Record<string, any>;
    features: Record<string, any>;
    accessibility: Record<string, any>;
  };
}

class CardStreamConfigService {
  private config: CardStreamConfig | null = null;
  private configPath: string;

  constructor() {
    this.configPath = path.join(process.cwd(), 'cardstream-complete-config.json');
  }

  /**
   * Load configuration from JSON file
   */
  private loadConfig(): CardStreamConfig {
    if (this.config) {
      return this.config;
    }

    try {
      const configFile = fs.readFileSync(this.configPath, 'utf8');
      this.config = JSON.parse(configFile) as CardStreamConfig;
      return this.config;
    } catch (error) {
      console.error('Failed to load CardStream configuration:', error);
      throw new Error('CardStream configuration file not found or invalid');
    }
  }

  /**
   * Get the complete configuration object
   */
  getConfig(): CardStreamConfig['cardStreamConfig'] {
    return this.loadConfig().cardStreamConfig;
  }

  /**
   * Get a specific section of the configuration
   */
  getSection<K extends keyof CardStreamConfig['cardStreamConfig']>(
    section: K
  ): CardStreamConfig['cardStreamConfig'][K] {
    return this.getConfig()[section];
  }

  /**
   * Get a nested value from the configuration using dot notation
   * Example: getValue('colors.brand.primary') returns '#10b981'
   */
  getValue(path: string): any {
    const config = this.getConfig();
    return this.getNestedValue(config, path);
  }

  /**
   * Helper method to traverse nested object paths
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Generate CSS custom properties from the configuration
   */
  generateCSSVariables(): string {
    const config = this.getConfig();
    const cssVariables: string[] = [':root {'];

    // Container variables
    const container = config.container;
    cssVariables.push(`  --cs-container-width: ${container.width};`);
    cssVariables.push(`  --cs-container-max-width: ${container.maxWidth};`);
    cssVariables.push(`  --cs-container-padding: ${container.padding};`);
    cssVariables.push(`  --cs-container-background: ${container.background};`);
    cssVariables.push(`  --cs-container-border-radius: ${container.borderRadius};`);
    cssVariables.push(`  --cs-container-box-shadow: ${container.boxShadow};`);

    // Layout variables
    const layout = config.layout;
    cssVariables.push(`  --cs-visual-support-ratio: ${layout.visualSupportRatio};`);
    cssVariables.push(`  --cs-card-stream-ratio: ${layout.cardStreamRatio};`);
    cssVariables.push(`  --cs-panels-gap: ${layout.gapBetweenPanels};`);

    // Visual support variables
    const visualSupport = config.visualSupport;
    cssVariables.push(`  --cs-visual-support-background: ${visualSupport.background};`);
    cssVariables.push(`  --cs-visual-support-border-right: ${visualSupport.borderRight};`);
    cssVariables.push(`  --cs-visual-support-content-background: ${visualSupport.content.background};`);
    cssVariables.push(`  --cs-visual-support-content-padding: ${visualSupport.content.padding};`);

    // Card stream variables
    const cardStream = config.cardStream;
    cssVariables.push(`  --cs-card-stream-background: ${cardStream.background};`);
    cssVariables.push(`  --cs-card-stream-padding: ${cardStream.padding};`);
    cssVariables.push(`  --cs-card-spacing: ${cardStream.cardSpacing};`);

    // Card variables
    const card = config.card;
    cssVariables.push(`  --cs-card-background: ${card.base.background};`);
    cssVariables.push(`  --cs-card-border-radius: ${card.base.borderRadius};`);
    cssVariables.push(`  --cs-card-border-left: ${card.base.borderLeft};`);
    cssVariables.push(`  --cs-card-padding: ${card.base.padding};`);
    cssVariables.push(`  --cs-card-margin-bottom: ${card.base.marginBottom};`);
    cssVariables.push(`  --cs-card-box-shadow: ${card.base.boxShadow};`);
    cssVariables.push(`  --cs-card-transition: ${card.base.transition};`);

    // Card hover states
    cssVariables.push(`  --cs-card-hover-box-shadow: ${card.hover.boxShadow};`);
    cssVariables.push(`  --cs-card-hover-transform: ${card.hover.transform};`);

    // Typography variables
    const typography = config.typography;
    cssVariables.push(`  --cs-font-family: ${typography.fontFamily};`);
    cssVariables.push(`  --cs-font-size-base: ${typography.fontSizeBase};`);
    cssVariables.push(`  --cs-line-height-base: ${typography.lineHeightBase};`);
    cssVariables.push(`  --cs-font-weight-light: ${typography.fontWeightLight};`);
    cssVariables.push(`  --cs-font-weight-normal: ${typography.fontWeightNormal};`);
    cssVariables.push(`  --cs-font-weight-medium: ${typography.fontWeightMedium};`);
    cssVariables.push(`  --cs-font-weight-semibold: ${typography.fontWeightSemibold};`);

    // Card text variables
    cssVariables.push(`  --cs-card-title-font-size: ${card.title.fontSize};`);
    cssVariables.push(`  --cs-card-title-font-weight: ${card.title.fontWeight};`);
    cssVariables.push(`  --cs-card-title-color: ${card.title.color};`);
    cssVariables.push(`  --cs-card-title-line-height: ${card.title.lineHeight};`);
    cssVariables.push(`  --cs-card-title-margin-bottom: ${card.title.marginBottom};`);

    cssVariables.push(`  --cs-card-description-font-size: ${card.description.fontSize};`);
    cssVariables.push(`  --cs-card-description-color: ${card.description.color};`);
    cssVariables.push(`  --cs-card-description-line-height: ${card.description.lineHeight};`);
    cssVariables.push(`  --cs-card-description-margin-bottom: ${card.description.marginBottom};`);

    // Step indicator variables
    cssVariables.push(`  --cs-step-indicator-font-size: ${card.stepIndicator.fontSize};`);
    cssVariables.push(`  --cs-step-indicator-font-weight: ${card.stepIndicator.fontWeight};`);
    cssVariables.push(`  --cs-step-indicator-color: ${card.stepIndicator.color};`);
    cssVariables.push(`  --cs-step-indicator-text-transform: ${card.stepIndicator.textTransform};`);
    cssVariables.push(`  --cs-step-indicator-letter-spacing: ${card.stepIndicator.letterSpacing};`);
    cssVariables.push(`  --cs-step-indicator-margin-bottom: ${card.stepIndicator.marginBottom};`);

    // Form elements
    const formElements = config.formElements;
    cssVariables.push(`  --cs-form-group-margin-bottom: ${formElements.formGroup.marginBottom};`);
    cssVariables.push(`  --cs-field-row-gap: ${formElements.fieldRow.gap};`);
    cssVariables.push(`  --cs-field-row-margin-bottom: ${formElements.fieldRow.marginBottom};`);

    // Label variables
    cssVariables.push(`  --cs-label-font-size: ${formElements.label.fontSize};`);
    cssVariables.push(`  --cs-label-font-weight: ${formElements.label.fontWeight};`);
    cssVariables.push(`  --cs-label-color: ${formElements.label.color};`);
    cssVariables.push(`  --cs-label-text-transform: ${formElements.label.textTransform};`);
    cssVariables.push(`  --cs-label-letter-spacing: ${formElements.label.letterSpacing};`);
    cssVariables.push(`  --cs-label-margin-bottom: ${formElements.label.marginBottom};`);

    // Input variables
    const input = formElements.input;
    cssVariables.push(`  --cs-input-padding: ${input.padding};`);
    cssVariables.push(`  --cs-input-font-size: ${input.fontSize};`);
    cssVariables.push(`  --cs-input-font-weight: ${input.fontWeight};`);
    cssVariables.push(`  --cs-input-color: ${input.color};`);
    cssVariables.push(`  --cs-input-background: ${input.background};`);
    cssVariables.push(`  --cs-input-border: ${input.border};`);
    cssVariables.push(`  --cs-input-border-bottom: ${input.borderBottom};`);
    cssVariables.push(`  --cs-input-border-radius: ${input.borderRadius};`);
    cssVariables.push(`  --cs-input-transition: ${input.transition};`);
    cssVariables.push(`  --cs-input-placeholder-color: ${input.placeholder.color};`);
    cssVariables.push(`  --cs-input-hover-border-color: ${input.hover.borderBottomColor};`);
    cssVariables.push(`  --cs-input-focus-border-color: ${input.focus.borderBottomColor};`);
    cssVariables.push(`  --cs-input-error-border-color: ${input.error.borderBottomColor};`);

    // Color variables
    const colors = config.colors;
    cssVariables.push(`  --cs-color-brand-primary: ${colors.brand.primary};`);
    cssVariables.push(`  --cs-color-brand-primary-hover: ${colors.brand.primaryHover};`);
    cssVariables.push(`  --cs-color-brand-primary-light: ${colors.brand.primaryLight};`);

    cssVariables.push(`  --cs-color-text-primary: ${colors.text.primary};`);
    cssVariables.push(`  --cs-color-text-secondary: ${colors.text.secondary};`);
    cssVariables.push(`  --cs-color-text-tertiary: ${colors.text.tertiary};`);
    cssVariables.push(`  --cs-color-text-placeholder: ${colors.text.placeholder};`);
    cssVariables.push(`  --cs-color-text-inverse: ${colors.text.inverse};`);

    cssVariables.push(`  --cs-color-background-primary: ${colors.background.primary};`);
    cssVariables.push(`  --cs-color-background-secondary: ${colors.background.secondary};`);
    cssVariables.push(`  --cs-color-background-tertiary: ${colors.background.tertiary};`);
    cssVariables.push(`  --cs-color-background-disabled: ${colors.background.disabled};`);

    cssVariables.push(`  --cs-color-border-default: ${colors.border.default};`);
    cssVariables.push(`  --cs-color-border-hover: ${colors.border.hover};`);
    cssVariables.push(`  --cs-color-border-focus: ${colors.border.focus};`);
    cssVariables.push(`  --cs-color-border-subtle: ${colors.border.subtle};`);

    cssVariables.push(`  --cs-color-state-error: ${colors.state.error};`);
    cssVariables.push(`  --cs-color-state-warning: ${colors.state.warning};`);
    cssVariables.push(`  --cs-color-state-success: ${colors.state.success};`);
    cssVariables.push(`  --cs-color-state-info: ${colors.state.info};`);

    // Calculation card variables
    const calculationCard = config.calculationCard;
    cssVariables.push(`  --cs-calculation-card-background: ${calculationCard.background};`);
    cssVariables.push(`  --cs-calculation-card-border-left-color: ${calculationCard.borderLeftColor};`);
    cssVariables.push(`  --cs-metric-value-font-size: ${calculationCard.metricValue.fontSize};`);
    cssVariables.push(`  --cs-metric-value-font-weight: ${calculationCard.metricValue.fontWeight};`);
    cssVariables.push(`  --cs-metric-value-color: ${calculationCard.metricValue.color};`);
    cssVariables.push(`  --cs-metric-value-line-height: ${calculationCard.metricValue.lineHeight};`);
    cssVariables.push(`  --cs-metric-value-margin-bottom: ${calculationCard.metricValue.marginBottom};`);

    // Action card button variables
    const actionCard = config.actionCard;
    cssVariables.push(`  --cs-action-card-text-align: ${actionCard.textAlign};`);
    cssVariables.push(`  --cs-action-card-padding: ${actionCard.padding};`);
    cssVariables.push(`  --cs-action-button-padding: ${actionCard.button.padding};`);
    cssVariables.push(`  --cs-action-button-font-size: ${actionCard.button.fontSize};`);
    cssVariables.push(`  --cs-action-button-font-weight: ${actionCard.button.fontWeight};`);
    cssVariables.push(`  --cs-action-button-color: ${actionCard.button.color};`);
    cssVariables.push(`  --cs-action-button-background: ${actionCard.button.background};`);
    cssVariables.push(`  --cs-action-button-border: ${actionCard.button.border};`);
    cssVariables.push(`  --cs-action-button-border-bottom: ${actionCard.button.borderBottom};`);
    cssVariables.push(`  --cs-action-button-border-radius: ${actionCard.button.borderRadius};`);
    cssVariables.push(`  --cs-action-button-text-transform: ${actionCard.button.textTransform};`);
    cssVariables.push(`  --cs-action-button-letter-spacing: ${actionCard.button.letterSpacing};`);
    cssVariables.push(`  --cs-action-button-transition: ${actionCard.button.transition};`);
    cssVariables.push(`  --cs-action-button-hover-background: ${actionCard.button.hover.background};`);
    cssVariables.push(`  --cs-action-button-hover-color: ${actionCard.button.hover.color};`);
    cssVariables.push(`  --cs-action-button-hover-transform: ${actionCard.button.hover.transform};`);

    // Animation variables
    const animations = config.animations;
    cssVariables.push(`  --cs-animation-duration-fast: ${animations.transitions.fast};`);
    cssVariables.push(`  --cs-animation-duration-default: ${animations.transitions.default};`);
    cssVariables.push(`  --cs-animation-duration-slow: ${animations.transitions.slow};`);
    cssVariables.push(`  --cs-animation-duration-slower: ${animations.transitions.slower};`);
    cssVariables.push(`  --cs-card-reveal-duration: ${animations.cardReveal.duration};`);
    cssVariables.push(`  --cs-card-reveal-easing: ${animations.cardReveal.easing};`);

    // Responsive breakpoints
    const responsive = config.responsive;
    cssVariables.push(`  --cs-breakpoint-mobile: ${responsive.breakpoints.mobile};`);
    cssVariables.push(`  --cs-breakpoint-tablet: ${responsive.breakpoints.tablet};`);
    cssVariables.push(`  --cs-breakpoint-desktop: ${responsive.breakpoints.desktop};`);

    // Close root block
    cssVariables.push('}');

    // Add responsive media queries
    cssVariables.push('');
    cssVariables.push(`/* Mobile Styles (≤${responsive.breakpoints.mobile}) */`);
    cssVariables.push(`@media (max-width: ${responsive.breakpoints.mobile}) {`);
    cssVariables.push('  .cs-container {');
    cssVariables.push(`    flex-direction: ${responsive.mobile.layout.flexDirection};`);
    cssVariables.push(`    gap: ${responsive.mobile.layout.gap};`);
    cssVariables.push('  }');
    cssVariables.push('  .cs-visual-panel {');
    cssVariables.push(`    display: ${responsive.mobile.visualSupport.display};`);
    cssVariables.push(`    width: ${responsive.mobile.visualSupport.width};`);
    cssVariables.push('  }');
    cssVariables.push('  .cs-card-stream {');
    cssVariables.push(`    width: ${responsive.mobile.cardStream.width};`);
    cssVariables.push(`    padding: ${responsive.mobile.cardStream.padding};`);
    cssVariables.push('  }');
    cssVariables.push('  .cs-card {');
    cssVariables.push(`    padding: ${responsive.mobile.card.padding};`);
    cssVariables.push(`    border-radius: ${responsive.mobile.card.borderRadius};`);
    cssVariables.push(`    margin-bottom: ${responsive.mobile.card.marginBottom};`);
    cssVariables.push('  }');
    cssVariables.push('  .cs-field-row {');
    cssVariables.push(`    grid-template-columns: ${responsive.mobile.fieldRow.gridTemplateColumns};`);
    cssVariables.push(`    gap: ${responsive.mobile.fieldRow.gap};`);
    cssVariables.push('  }');
    cssVariables.push('}');

    return cssVariables.join('\n');
  }

  /**
   * Reload configuration (useful for development)
   */
  reloadConfig(): void {
    this.config = null;
    this.loadConfig();
  }
}

// Export singleton instance
export const cardStreamConfig = new CardStreamConfigService();

// Export utility functions for easy access
export function getCardStreamConfig() {
  return cardStreamConfig.getConfig();
}

export function getCardStreamValue(path: string) {
  return cardStreamConfig.getValue(path);
}

export function generateCardStreamCSS() {
  return cardStreamConfig.generateCSSVariables();
}