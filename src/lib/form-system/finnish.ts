// ============================================================================
// FINNISH LANGUAGE SUPPORT FOR UNIFIED FORM SYSTEM
// ============================================================================
//
// This module provides Finnish language support for form labels, help text,
// error messages, and other UI elements. It's designed to work with the
// existing Finnish translations in the calculator while providing a structured
// approach for future expansion.
//
// ============================================================================

// Finnish translations for form field types
export const fieldTypeLabels: Record<string, string> = {
  text: 'Teksti',
  email: 'Sähköposti',
  number: 'Numero',
  select: 'Valinta',
  checkbox: 'Valintaruutu',
  radio: 'Radio button',
  textarea: 'Tekstialue',
  date: 'Päivämäärä',
  phone: 'Puhelinnumero',
  currency: 'Valuutta',
  percentage: 'Prosentti',
  file: 'Tiedosto',
  custom: 'Mukautettu',
};

// Finnish translations for validation rule types
export const validationRuleLabels: Record<string, string> = {
  required: 'Pakollinen',
  min: 'Minimi',
  max: 'Maksimi',
  email: 'Sähköposti',
  url: 'URL',
  regex: 'Säännöllinen lauseke',
  custom: 'Mukautettu',
};

// Finnish translations for field styling variants
export const fieldVariantLabels: Record<string, string> = {
  default: 'Oletus',
  outline: 'Ääriviiva',
  filled: 'Täytetty',
  ghost: 'Häivytetty',
};

// Finnish translations for field widths
export const fieldWidthLabels: Record<string, string> = {
  full: 'Täysi leveys',
  half: 'Puoli leveys',
  third: 'Kolmasosa leveys',
  quarter: 'Neljäsosa leveys',
};

// Finnish translations for common form labels
export const commonLabels: Record<string, string> = {
  // Form sections
  basicInfo: 'Perustiedot',
  propertyDetails: 'Kiinteistön tiedot',
  currentHeating: 'Nykyinen lämmitys',
  household: 'Kotitalous',
  contactInfo: 'Yhteystiedot',

  // Common fields
  firstName: 'Etunimi',
  lastName: 'Sukunimi',
  email: 'Sähköposti',
  phone: 'Puhelinnumero',
  address: 'Osoite',
  city: 'Kaupunki',
  postalCode: 'Postinumero',
  country: 'Maa',

  // Property fields
  squareMeters: 'Neliömetrit',
  constructionYear: 'Rakennusvuosi',
  floors: 'Kerrokset',
  residents: 'Asukkaat',
  ceilingHeight: 'Kattokorkeus',

  // Heating fields
  heatingType: 'Lämmitystyyppi',
  heatingCost: 'Lämmityskustannukset',
  energyConsumption: 'Energiankulutus',
  hotWaterUsage: 'Kuumavesikäyttö',

  // Results fields
  annualSavings: 'Vuosittaiset säästöt',
  paybackPeriod: 'Takaisinmaksuaika',
  co2Reduction: 'CO₂ vähennys',
  energyNeed: 'Energiantarve',

  // Actions
  next: 'Seuraava',
  previous: 'Edellinen',
  submit: 'Lähetä',
  save: 'Tallenna',
  cancel: 'Peruuta',
  reset: 'Nollaa',

  // Status
  completed: 'Valmis',
  inProgress: 'Kesken',
  pending: 'Odottaa',
  error: 'Virhe',
  success: 'Onnistui',
};

// Finnish translations for help text
export const helpText: Record<string, string> = {
  // Property help
  squareMeters: 'Syötä kiinteistösi kokonaispinta-ala neliömetreinä',
  constructionYear: 'Vuosi, jona kiinteistö rakennettiin',
  floors: 'Kiinteistön kerrosten lukumäärä',
  residents: 'Kiinteistössä asuvien henkilöiden määrä',
  ceilingHeight: 'Keskimääräinen kattokorkeus metreinä',

  // Heating help
  heatingType: 'Valitse nykyinen lämmitystyyppisi',
  heatingCost: 'Nykyiset vuosittaiset lämmityskustannukset euroina',
  energyConsumption: 'Vuosittainen energiankulutus kilowattitunteina',
  hotWaterUsage: 'Kuumavesikäyttö kuukaudessa litroina',

  // Contact help
  firstName: 'Syötä etunimesi',
  lastName: 'Syötä sukunimesi',
  email: 'Syötä sähköpostiosoitteesi',
  phone: 'Syötä puhelinnumerosi',
  address: 'Syötä katuosoitteesi',
  city: 'Syötä kaupunkisi',
  postalCode: 'Syötä postinumerosi',

  // Results help
  annualSavings: 'Lämpöpumpun tuomat vuosittaiset säästöt',
  paybackPeriod: 'Aika, jona lämpöpumpun hinta maksaa itsensä takaisin',
  co2Reduction: 'Lämpöpumpun tuoma CO₂ päästöjen vähennys',
};

// Finnish translations for error messages
export const errorMessages: Record<string, string> = {
  // Validation errors
  required: 'Tämä kenttä on pakollinen',
  invalidEmail: 'Syötä kelvollinen sähköpostiosoite',
  invalidPhone: 'Syötä kelvollinen puhelinnumero',
  invalidNumber: 'Syötä kelvollinen numero',
  minLength: 'Vähintään {min} merkkiä vaaditaan',
  maxLength: 'Enintään {max} merkkiä sallittu',
  minValue: 'Vähintään {min} vaaditaan',
  maxValue: 'Enintään {max} sallittu',
  invalidFormat: 'Virheellinen muoto',

  // Field-specific errors
  squareMetersMin: 'Pinta-alan tulee olla vähintään 10 m²',
  squareMetersMax: 'Pinta-alan tulee olla enintään 10000 m²',
  constructionYearMin: 'Rakennusvuoden tulee olla vähintään 1800',
  constructionYearMax: 'Rakennusvuoden tulee olla enintään {currentYear}',
  heatingCostMin: 'Lämmityskustannusten tulee olla vähintään 0 €',
  heatingCostMax: 'Lämmityskustannusten tulee olla enintään 100000 €',

  // Form errors
  formIncomplete: 'Täytä kaikki pakolliset kentät',
  submissionFailed: 'Lomakkeen lähetys epäonnistui',
  networkError: 'Verkkovirhe. Yritä uudelleen.',
  validationError: 'Tarkista syöttämäsi tiedot',
};

// Finnish translations for success messages
export const successMessages: Record<string, string> = {
  formSubmitted: 'Lomake lähetettiin onnistuneesti',
  dataSaved: 'Tiedot tallennettiin',
  sectionCompleted: 'Osio valmistui',
  formCompleted: 'Lomake valmistui',
};

// Finnish translations for form navigation
export const navigationLabels: Record<string, string> = {
  step: 'Vaihe',
  of: '/',
  nextStep: 'Seuraava vaihe',
  previousStep: 'Edellinen vaihe',
  goToStep: 'Siirry vaiheeseen',
  currentStep: 'Nykyinen vaihe',
  totalSteps: 'Vaiheita yhteensä',
};

// Finnish translations for form progress
export const progressLabels: Record<string, string> = {
  progress: 'Edistyminen',
  completed: 'Valmistunut',
  remaining: 'Jäljellä',
  percent: 'prosenttia',
  sections: 'osiota',
  fields: 'kenttää',
};

// Finnish translations for form actions
export const actionLabels: Record<string, string> = {
  startForm: 'Aloita lomake',
  continueForm: 'Jatka lomaketta',
  reviewForm: 'Tarkista lomake',
  submitForm: 'Lähetä lomake',
  saveDraft: 'Tallenna luonnos',
  loadDraft: 'Lataa luonnos',
  clearForm: 'Tyhjennä lomake',
  printForm: 'Tulosta lomake',
  exportForm: 'Vie lomake',
};

// Finnish translations for form metadata
export const metadataLabels: Record<string, string> = {
  formId: 'Lomakkeen tunnus',
  formVersion: 'Lomakkeen versio',
  createdDate: 'Luotu',
  modifiedDate: 'Muokattu',
  submittedDate: 'Lähetetty',
  completionTime: 'Valmistumisaika',
  totalFields: 'Kenttiä yhteensä',
  completedFields: 'Valmistuneet kentät',
  remainingFields: 'Jäljellä olevat kentät',
};

// Function to get Finnish label for a field
export function getFinnishLabel(key: string, fallback?: string): string {
  return (
    commonLabels[key] ||
    fieldTypeLabels[key] ||
    validationRuleLabels[key] ||
    fieldVariantLabels[key] ||
    fieldWidthLabels[key] ||
    fallback ||
    key
  );
}

// Function to get Finnish help text for a field
export function getFinnishHelpText(key: string, fallback?: string): string {
  return helpText[key] || fallback || '';
}

// Function to get Finnish error message for a field
export function getFinnishErrorMessage(
  key: string,
  params?: Record<string, any>,
  fallback?: string
): string {
  let message = errorMessages[key] || fallback || key;

  // Replace parameters in the message
  if (params) {
    Object.entries(params).forEach(([param, value]) => {
      message = message.replace(`{${param}}`, String(value));
    });
  }

  return message;
}

// Function to get Finnish success message
export function getFinnishSuccessMessage(
  key: string,
  fallback?: string
): string {
  return successMessages[key] || fallback || key;
}

// Function to get Finnish navigation label
export function getFinnishNavigationLabel(
  key: string,
  fallback?: string
): string {
  return navigationLabels[key] || fallback || key;
}

// Function to get Finnish progress label
export function getFinnishProgressLabel(
  key: string,
  fallback?: string
): string {
  return progressLabels[key] || fallback || key;
}

// Function to get Finnish action label
export function getFinnishActionLabel(key: string, fallback?: string): string {
  return actionLabels[key] || fallback || key;
}

// Function to get Finnish metadata label
export function getFinnishMetadataLabel(
  key: string,
  fallback?: string
): string {
  return metadataLabels[key] || fallback || key;
}

// Complete Finnish language object for easy import
export const finnishLanguage = {
  labels: commonLabels,
  fieldTypes: fieldTypeLabels,
  validationRules: validationRuleLabels,
  fieldVariants: fieldVariantLabels,
  fieldWidths: fieldWidthLabels,
  helpText,
  errorMessages,
  successMessages,
  navigation: navigationLabels,
  progress: progressLabels,
  actions: actionLabels,
  metadata: metadataLabels,

  // Utility functions
  getLabel: getFinnishLabel,
  getHelpText: getFinnishHelpText,
  getErrorMessage: getFinnishErrorMessage,
  getSuccessMessage: getFinnishSuccessMessage,
  getNavigationLabel: getFinnishNavigationLabel,
  getProgressLabel: getFinnishProgressLabel,
  getActionLabel: getFinnishActionLabel,
  getMetadataLabel: getFinnishMetadataLabel,
};

// Default export
export default finnishLanguage;
