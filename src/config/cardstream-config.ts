// CardStream Configuration Module
// This exports the JSON config as a TypeScript module for better compatibility

import configData from '../../cardstream-complete-config.json';

export const cardStreamConfig = configData.cardStreamConfig;

export type CardStreamConfig = typeof cardStreamConfig;

// Export individual sections for easier access
export const containerConfig = cardStreamConfig.container;
export const layoutConfig = cardStreamConfig.layout;
export const colorsConfig = cardStreamConfig.colors;
export const visualSupportConfig = cardStreamConfig.visualSupport;
export const cardStreamPanelConfig = cardStreamConfig.cardStream;
export const cardConfig = cardStreamConfig.card;
export const formElementsConfig = cardStreamConfig.formElements;
export const typographyConfig = cardStreamConfig.typography;
export const animationsConfig = cardStreamConfig.animations;
export const calculationCardConfig = cardStreamConfig.calculationCard;
export const actionCardConfig = cardStreamConfig.actionCard;

export default cardStreamConfig;