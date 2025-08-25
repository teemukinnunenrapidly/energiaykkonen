// ============================================================================
// CALCULATOR FORM SCHEMA
// ============================================================================
//
// This file contains the pre-configured calculator form schema to avoid
// circular dependencies between index.ts and calculator-adapter.tsx
//
// ============================================================================

import { FormSchema } from './types';

// Pre-configured calculator form schema
export const calculatorFormSchema: FormSchema = {
  id: 'energy-calculator',
  name: 'Energy Calculator',
  version: '1.0.0',

  pages: [
    {
      id: 'property-details',
      title: 'Kiinteistön tiedot',
      order: 0,
      sections: [
        {
          id: 'basic-info',
          title: 'Perustiedot',
          order: 0,
          fields: [
            {
              id: 'property-type',
              name: 'propertyType',
              type: 'select',
              label: 'Kiinteistön tyyppi',
              required: true,
              options: [
                { value: 'house', label: 'Omakotitalo' },
                { value: 'apartment', label: 'Kerrostaloasunto' },
                { value: 'townhouse', label: 'Rivitaloasunto' },
                { value: 'other', label: 'Muu' },
              ],
              validation: {
                rules: [
                  { type: 'required', message: 'Kiinteistön tyyppi on pakollinen' },
                ],
              },
              styling: { width: 'full', variant: 'outline' },
              localization: {
                labelKey: 'propertyType',
                helpTextKey: 'propertyType',
              },
            },
            {
              id: 'square-meters',
              name: 'squareMeters',
              type: 'number',
              label: 'Neliömetrit',
              required: true,
              validation: {
                rules: [
                  { type: 'required', message: 'Neliömetrit on pakollinen' },
                  { type: 'min', value: 10, message: 'Vähintään 10 m²' },
                  { type: 'max', value: 10000, message: 'Enintään 10000 m²' },
                ],
              },
              styling: { width: 'half', variant: 'outline' },
              localization: {
                labelKey: 'squareMeters',
                helpTextKey: 'squareMeters',
              },
            },
            {
              id: 'construction-year',
              name: 'constructionYear',
              type: 'number',
              label: 'Rakennusvuosi',
              required: true,
              validation: {
                rules: [
                  { type: 'required', message: 'Rakennusvuosi on pakollinen' },
                  { type: 'min', value: 1800, message: 'Vähintään 1800' },
                  {
                    type: 'max',
                    value: new Date().getFullYear(),
                    message: `Enintään ${new Date().getFullYear()}`,
                  },
                ],
              },
              styling: { width: 'half', variant: 'outline' },
              localization: {
                labelKey: 'constructionYear',
                helpTextKey: 'constructionYear',
              },
            },
          ],
        },
      ],
    },
    {
      id: 'heating-info',
      title: 'Lämmitystiedot',
      order: 1,
      sections: [
        {
          id: 'current-heating',
          title: 'Nykyinen lämmitys',
          order: 0,
          fields: [
            {
              id: 'heating-type',
              name: 'heatingType',
              type: 'select',
              label: 'Lämmitystyyppi',
              required: true,
              options: [
                { value: 'electric', label: 'Sähkö' },
                { value: 'oil', label: 'Öljy' },
                { value: 'gas', label: 'Kaasu' },
                { value: 'wood', label: 'Puu' },
                { value: 'district', label: 'Kaukolämpö' },
              ],
              validation: {
                rules: [
                  { type: 'required', message: 'Lämmitystyyppi on pakollinen' },
                ],
              },
              styling: { width: 'full', variant: 'outline' },
              localization: {
                labelKey: 'heatingType',
                helpTextKey: 'heatingType',
              },
            },
            {
              id: 'annual-heating-cost',
              name: 'annualHeatingCost',
              type: 'number',
              label: 'Vuosittaiset lämmityskustannukset (€)',
              placeholder: '2000',
              required: true,
              validation: {
                rules: [
                  {
                    type: 'required',
                    message: 'Lämmityskustannukset ovat pakollisia',
                  },
                  { type: 'min', value: 0, message: 'Vähintään 0 €' },
                  { type: 'max', value: 50000, message: 'Enintään 50000 €' },
                ],
              },
              styling: { width: 'half', variant: 'outline' },
              localization: {
                labelKey: 'annualHeatingCost',
                helpTextKey: 'annualHeatingCost',
              },
            },
          ],
        },
      ],
    },
    {
      id: 'contact-info',
      title: 'Yhteystiedot',
      order: 2,
      sections: [
        {
          id: 'contact-details',
          title: 'Yhteystiedot',
          order: 0,
          fields: [
            {
              id: 'firstName',
              name: 'firstName',
              type: 'text',
              label: 'Etunimi',
              placeholder: 'Matti',
              required: true,
              validation: {
                rules: [
                  { type: 'required', message: 'Etunimi on pakollinen' },
                  {
                    type: 'min',
                    value: 2,
                    message: 'Vähintään 2 merkkiä',
                  },
                  {
                    type: 'max',
                    value: 50,
                    message: 'Enintään 50 merkkiä',
                  },
                ],
              },
              styling: { width: 'half', variant: 'outline' },
              localization: {
                labelKey: 'firstName',
                helpTextKey: 'firstName',
              },
            },
            {
              id: 'lastName',
              name: 'lastName',
              type: 'text',
              label: 'Sukunimi',
              placeholder: 'Meikäläinen',
              required: true,
              validation: {
                rules: [
                  { type: 'required', message: 'Sukunimi on pakollinen' },
                  {
                    type: 'min',
                    value: 2,
                    message: 'Vähintään 2 merkkiä',
                  },
                  {
                    type: 'max',
                    value: 50,
                    message: 'Enintään 50 merkkiä',
                  },
                ],
              },
              styling: { width: 'half', variant: 'outline' },
              localization: {
                labelKey: 'lastName',
                helpTextKey: 'lastName',
              },
            },
            {
              id: 'email',
              name: 'email',
              type: 'email',
              label: 'Sähköposti',
              placeholder: 'matti@esimerkki.fi',
              required: true,
              validation: {
                rules: [
                  { type: 'required', message: 'Sähköposti on pakollinen' },
                  { type: 'email', message: 'Virheellinen sähköpostiosoite' },
                ],
              },
              styling: { width: 'full', variant: 'outline' },
              localization: {
                labelKey: 'email',
                helpTextKey: 'email',
              },
            },
          ],
        },
      ],
    },
  ],
  localization: {
    defaultLocale: 'fi',
    supportedLocales: ['fi', 'en'],
    fallbackLocale: 'fi',
  },
};
