/**
 * Finnish Language Content for Form System
 * Provides Finnish translations for form elements without complex i18n
 */

// Form field types in Finnish
export const FIELD_TYPES_FI = {
  text: 'teksti',
  email: 'sähköposti',
  number: 'numero',
  select: 'valinta',
  checkbox: 'valintaruutu',
  radio: 'radiovalinta',
  textarea: 'tekstialue',
} as const;

// Common form labels in Finnish
export const COMMON_LABELS_FI = {
  // Basic actions
  submit: 'Lähetä',
  save: 'Tallenna',
  cancel: 'Peruuta',
  edit: 'Muokkaa',
  delete: 'Poista',
  add: 'Lisää',
  remove: 'Poista',
  next: 'Seuraava',
  previous: 'Edellinen',
  finish: 'Valmis',
  close: 'Sulje',

  // Form states
  loading: 'Ladataan...',
  saving: 'Tallennetaan...',
  submitting: 'Lähetetään...',
  required: 'Pakollinen',
  optional: 'Valinnainen',

  // Validation messages
  requiredField: 'Tämä kenttä on pakollinen',
  invalidFormat: 'Virheellinen muoto',
  tooShort: 'Liian lyhyt',
  tooLong: 'Liian pitkä',
  invalidEmail: 'Virheellinen sähköpostiosoite',
  invalidNumber: 'Virheellinen numero',
  minValue: 'Arvon tulee olla vähintään {min}',
  maxValue: 'Arvon tulee olla enintään {max}',
  minLength: 'Pituuden tulee olla vähintään {min} merkkiä',
  maxLength: 'Pituuden tulee olla enintään {max} merkkiä',
} as const;

// Energy calculator specific content in Finnish
export const ENERGY_CALCULATOR_FI = {
  // Page titles
  pageTitle: 'Lämpöpumpun Takaisinmaksuaika Laskuri',
  pageDescription:
    'Laske potentiaaliset säästösi ja takaisinmaksuaika lämpöpumpulla',

  // Section titles
  sections: {
    propertyDetails: {
      title: 'Kiinteistön tiedot',
      description: 'Anna kiinteistösi perustiedot laskelmaa varten',
      subtitle: 'Tarkemmat tiedot antavat tarkemman laskelman',
    },
    currentHeating: {
      title: 'Nykyinen lämmitys',
      description: 'Mitä lämmitystapaa käytät tällä hetkellä?',
      subtitle: 'Tämä vaikuttaa säästöihin ja takaisinmaksuaikaan',
    },
    heatingCosts: {
      title: 'Lämmityskustannukset',
      description: 'Paljonko maksat lämmityksestä vuosittain?',
      subtitle: 'Nykyiset kustannukset auttavat laskemaan säästöt',
    },
    savingsCalculation: {
      title: 'Säästölaskelma',
      description: 'Katso potentiaaliset säästösi lämpöpumpulla',
      subtitle: 'Laskelma perustuu antamaasi tietoon',
    },
    contactInfo: {
      title: 'Yhteystiedot',
      description: 'Anna yhteystietosi laskelmaan',
      subtitle: 'Lähetämme sinulle yksityiskohtaisen laskelman',
    },
  },

  // Field labels
  fields: {
    // Property details
    squareMeters: {
      label: 'Asuinpinta-ala',
      placeholder: 'Syötä pinta-ala neliömetreinä',
      helpText: 'Koko asunnon tai talon asuinpinta-ala',
      unit: 'm²',
    },
    ceilingHeight: {
      label: 'Kattokorkeus',
      placeholder: 'Valitse kattokorkeus',
      helpText: 'Keskimääräinen kattokorkeus huoneissa',
      unit: 'm',
    },
    constructionYear: {
      label: 'Rakennusvuosi',
      placeholder: 'Valitse rakennusvuosi',
      helpText: 'Vuosi, jolloin rakennus on valmistunut',
    },
    floors: {
      label: 'Kerrosten lukumäärä',
      placeholder: 'Valitse kerrosten lukumäärä',
      helpText: 'Kuinka monta kerrosta rakennuksessa on',
    },
    residents: {
      label: 'Asukkaiden lukumäärä',
      placeholder: 'Valitse asukkaiden lukumäärä',
      helpText: 'Kuinka monta henkeä asuu kiinteistössä',
    },

    // Current heating
    heatingType: {
      label: 'Lämmitystapa',
      placeholder: 'Valitse lämmitystapa',
      helpText: 'Mitä lämmitystapaa käytät tällä hetkellä?',
    },
    hotWaterUsage: {
      label: 'Kuumavesikäyttö',
      placeholder: 'Valitse kuumavesikäyttö',
      helpText: 'Kuinka paljon kuumaa vettä käytät?',
    },

    // Heating costs
    annualHeatingCost: {
      label: 'Vuosittaiset lämmityskustannukset',
      placeholder: 'Syötä vuosittaiset kustannukset euroissa',
      helpText: 'Kokonaiskustannukset lämmityksestä vuodessa',
      unit: '€/vuosi',
    },

    // Contact information
    firstName: {
      label: 'Etunimi',
      placeholder: 'Syötä etunimesi',
      helpText: 'Sinun etunimesi',
    },
    lastName: {
      label: 'Sukunimi',
      placeholder: 'Syötä sukunimesi',
      helpText: 'Sinun sukunimesi',
    },
    email: {
      label: 'Sähköposti',
      placeholder: 'esimerkki@email.fi',
      helpText: 'Sähköpostiosoitteesi laskelmaa varten',
    },
    phone: {
      label: 'Puhelin',
      placeholder: '040 123 4567',
      helpText: 'Puhelinnumerosi (valinnainen)',
    },
    streetAddress: {
      label: 'Katuosoite',
      placeholder: 'Esimerkkikatu 1',
      helpText: 'Katuosoite (valinnainen)',
    },
    city: {
      label: 'Paikkakunta',
      placeholder: 'Helsinki',
      helpText: 'Asuinpaikkakuntasi (valinnainen)',
    },
  },

  // Field options
  options: {
    ceilingHeight: [
      { value: '2.4', label: '2.4 m' },
      { value: '2.7', label: '2.7 m' },
      { value: '3.0', label: '3.0 m' },
      { value: '3.3', label: '3.3 m' },
    ],
    constructionYear: [
      { value: 'before-1990', label: 'Ennen 1990' },
      { value: '1991-2010', label: '1991-2010' },
      { value: '2011-2020', label: '2011-2020' },
      { value: 'after-2020', label: '2020 jälkeen' },
    ],
    floors: [
      { value: '1', label: '1 kerros' },
      { value: '2', label: '2 kerrosta' },
      { value: '3', label: '3 kerrosta' },
      { value: '4+', label: '4+ kerrosta' },
    ],
    residents: [
      { value: '1', label: '1 henkilö' },
      { value: '2', label: '2 henkilöä' },
      { value: '3', label: '3 henkilöä' },
      { value: '4', label: '4 henkilöä' },
      { value: '5+', label: '5+ henkilöä' },
    ],
    heatingType: [
      { value: 'electric', label: 'Sähkö' },
      { value: 'oil', label: 'Öljy' },
      { value: 'gas', label: 'Kaasu' },
      { value: 'wood', label: 'Puu' },
      { value: 'district', label: 'Kaukolämpö' },
    ],
    hotWaterUsage: [
      { value: 'low', label: 'Matala (alle 100 l/päivä)' },
      { value: 'normal', label: 'Normaali (100-200 l/päivä)' },
      { value: 'high', label: 'Korkea (yli 200 l/päivä)' },
    ],
  },

  // Consent and legal
  consent: {
    gdpr: {
      label: 'Hyväksyn tietosuojaselosteen ja tietojeni käsittelyn',
      helpText:
        'Sinun täytyy hyväksyä tietosuojaseloste laskelman lähettämiseksi',
    },
    marketing: {
      label: 'Haluan vastaanottaa tarjouksia ja uutiskirjeitä',
      helpText: 'Voit perua tämän milloin tahansa',
    },
  },

  // Results and calculations
  results: {
    title: 'Laskelma valmis!',
    subtitle: 'Tässä ovat potentiaaliset säästösi:',
    annualSavings: 'Vuosittaiset säästöt',
    paybackPeriod: 'Takaisinmaksuaika',
    investmentCost: 'Investointikustannukset',
    co2Reduction: 'CO2-vähennys',
    totalSavings: 'Kokonaissäästöt 20 vuodessa',
    disclaimer:
      'Laskelma on arvio ja perustuu antamaasi tietoon. Tarkat kustannukset saadaan tarjouspyynnöllä.',
  },

  // Messages and notifications
  messages: {
    success: {
      title: 'Kiitos!',
      subtitle: 'Laskelmasi on lähetetty onnistuneesti',
      description: 'Vastauksemme saapuu sähköpostiisi pian.',
    },
    error: {
      title: 'Virhe',
      subtitle: 'Laskelmaa ei voitu lähettää',
      description: 'Yritä uudelleen tai ota yhteyttä asiakaspalveluun.',
    },
    validation: {
      title: 'Tarkista tiedot',
      subtitle: 'Lomakkeessa on virheitä',
      description: 'Korjaa virheelliset kentät ja yritä uudelleen.',
    },
  },

  // Progress indicators
  progress: {
    step1: 'Kiinteistön tiedot',
    step2: 'Nykyinen lämmitys',
    step3: 'Lämmityskustannukset',
    step4: 'Säästölaskelma',
    step5: 'Yhteystiedot',
    completed: 'Valmis',
    inProgress: 'Kesken',
    locked: 'Lukittu',
  },

  // Help and information
  help: {
    title: 'Tarvitsetko apua?',
    description:
      'Jos sinulla on kysyttävää laskurista tai haluat henkilökohtaista neuvontaa, ota yhteyttä asiakaspalveluumme.',
    contactInfo: {
      phone: 'Puhelin: +358 20 123 4567',
      email: 'Sähköposti: info@energiaykkonen.fi',
      hours: 'Avoinna ma-pe 8:00-17:00',
    },
  },
} as const;

// Form validation messages in Finnish
export const VALIDATION_MESSAGES_FI = {
  required: 'Tämä kenttä on pakollinen',
  email: 'Syötä kelvollinen sähköpostiosoite',
  minLength: (min: number) => `Vähintään ${min} merkkiä vaaditaan`,
  maxLength: (max: number) => `Enintään ${max} merkkiä sallitaan`,
  min: (min: number) => `Arvon tulee olla vähintään ${min}`,
  max: (max: number) => `Arvon tulee olla enintään ${max}`,
  pattern: 'Syötä kelvollinen arvo',
  number: 'Syötä kelvollinen numero',
  integer: 'Syötä kokonaisluku',
  positive: 'Arvon tulee olla positiivinen',
  url: 'Syötä kelvollinen URL-osoite',
  phone: 'Syötä kelvollinen puhelinnumero',
  postalCode: 'Syötä kelvollinen postinumero',
} as const;

// Button text in Finnish
export const BUTTON_TEXT_FI = {
  primary: {
    submit: 'Lähetä laskelma',
    save: 'Tallenna',
    next: 'Seuraava',
    finish: 'Valmis',
  },
  secondary: {
    back: 'Takaisin',
    cancel: 'Peruuta',
    edit: 'Muokkaa',
    reset: 'Nollaa',
  },
  states: {
    loading: 'Ladataan...',
    saving: 'Tallennetaan...',
    submitting: 'Lähetetään...',
    disabled: 'Ei käytettävissä',
  },
} as const;

// Export all Finnish content
export default {
  FIELD_TYPES_FI,
  COMMON_LABELS_FI,
  ENERGY_CALCULATOR_FI,
  VALIDATION_MESSAGES_FI,
  BUTTON_TEXT_FI,
};
