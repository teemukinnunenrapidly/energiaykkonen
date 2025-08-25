import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useFormSystem,
  formSchemaToZod,
  createDefaultValues,
  createFormConfig,
  finnishLanguage,
  FormSchema,
} from './index';

// Example form schema for energy calculator
const energyCalculatorSchema: FormSchema = {
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
              styling: {
                width: 'half',
                variant: 'outline',
              },
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
              styling: {
                width: 'half',
                variant: 'outline',
              },
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
                { value: 'electric', label: 'Sähkölämmitys' },
                { value: 'oil', label: 'Öljylämmitys' },
                { value: 'district', label: 'Kaukolämpö' },
                { value: 'wood', label: 'Puu- tai pelletilämmitys' },
              ],
              validation: {
                rules: [
                  { type: 'required', message: 'Valitse lämmitystyyppi' },
                ],
              },
              styling: {
                width: 'full',
                variant: 'outline',
              },
              localization: {
                labelKey: 'heatingType',
                helpTextKey: 'heatingType',
              },
            },
            {
              id: 'heating-cost',
              name: 'heatingCost',
              type: 'number',
              label: 'Vuosittaiset lämmityskustannukset (€)',
              required: true,
              validation: {
                rules: [
                  {
                    type: 'required',
                    message: 'Lämmityskustannukset ovat pakollisia',
                  },
                  { type: 'min', value: 0, message: 'Vähintään 0 €' },
                  { type: 'max', value: 100000, message: 'Enintään 100000 €' },
                ],
              },
              styling: {
                width: 'full',
                variant: 'outline',
              },
              localization: {
                labelKey: 'heatingCost',
                helpTextKey: 'heatingCost',
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
          id: 'personal-info',
          title: 'Henkilötiedot',
          order: 0,
          fields: [
            {
              id: 'first-name',
              name: 'firstName',
              type: 'text',
              label: 'Etunimi',
              required: true,
              validation: {
                rules: [
                  { type: 'required', message: 'Etunimi on pakollinen' },
                  { type: 'min', value: 2, message: 'Vähintään 2 merkkiä' },
                ],
              },
              styling: {
                width: 'half',
                variant: 'outline',
              },
              localization: {
                labelKey: 'firstName',
                helpTextKey: 'firstName',
              },
            },
            {
              id: 'last-name',
              name: 'lastName',
              type: 'text',
              label: 'Sukunimi',
              required: true,
              validation: {
                rules: [
                  { type: 'required', message: 'Sukunimi on pakollinen' },
                  { type: 'min', value: 2, message: 'Vähintään 2 merkkiä' },
                ],
              },
              styling: {
                width: 'half',
                variant: 'outline',
              },
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
              required: true,
              validation: {
                rules: [
                  { type: 'required', message: 'Sähköposti on pakollinen' },
                  {
                    type: 'email',
                    message: 'Syötä kelvollinen sähköpostiosoite',
                  },
                ],
              },
              styling: {
                width: 'full',
                variant: 'outline',
              },
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

  styling: {
    theme: 'tesla',
    primaryColor: '#3B82F6',
  },

  localization: {
    defaultLocale: 'fi',
    supportedLocales: ['fi', 'en'],
  },
};

// Create Zod schema from our form schema
const zodSchema = formSchemaToZod(energyCalculatorSchema);

// Type for our form data
type EnergyCalculatorForm = z.infer<typeof zodSchema>;

// Demo component showing the form system in action
export function EnergyCalculatorDemo() {
  // Use our unified form system hook
  const {
    form,
    currentPage,
    currentPageIndex,
    canGoNext,
    canGoPrevious,
    goToNext,
    goToPrevious,
    goToPage,
    isLastPage,
    isFirstPage,
    isSectionComplete,
    markSectionComplete,
    getCompletionProgress,
    submitForm,
    isSubmitting,
    submitError,
    submitSuccess,
    resetForm,
  } = useFormSystem<EnergyCalculatorForm>(
    energyCalculatorSchema,
    zodSchema,
    createDefaultValues(energyCalculatorSchema)
  );

  const onSubmit = async (data: EnergyCalculatorForm) => {
    await submitForm(data);
  };

  const handleNext = async () => {
    const isValid = await form.trigger();
    if (isValid) {
      // Mark current section as complete
      currentPage.sections.forEach(section => {
        if (section.fields.every(field => !form.formState.errors[field.name])) {
          markSectionComplete(section.id);
        }
      });

      if (canGoNext) {
        goToNext();
      }
    }
  };

  const handlePrevious = () => {
    if (canGoPrevious) {
      goToPrevious();
    }
  };

  const handlePageClick = (pageIndex: number) => {
    goToPage(pageIndex);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {energyCalculatorSchema.name}
          </h1>
          <p className="text-gray-600">{energyCalculatorSchema.description}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Edistyminen: {Math.round(getCompletionProgress())}%
            </span>
            <span className="text-sm text-gray-500">
              {currentPageIndex + 1} / {energyCalculatorSchema.pages.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getCompletionProgress()}%` }}
            />
          </div>
        </div>

        {/* Page Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-2">
            {energyCalculatorSchema.pages.map((page, index) => (
              <button
                key={page.id}
                onClick={() => handlePageClick(index)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  index === currentPageIndex
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {page.title}
              </button>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Current Page Title */}
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {currentPage.title}
            </h2>

            {/* Sections */}
            {currentPage.sections.map(section => (
              <div key={section.id} className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {section.title}
                  {isSectionComplete(section.id) && (
                    <span className="ml-2 text-green-600 text-sm">
                      ✓ Valmis
                    </span>
                  )}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {section.fields.map(field => (
                    <div
                      key={field.id}
                      className={`${
                        field.styling?.width === 'full' ? 'md:col-span-2' : ''
                      }`}
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {finnishLanguage.getLabel(
                          field.localization?.labelKey || field.name
                        )}
                        {field.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </label>

                      {/* Field Input */}
                      {field.type === 'text' || field.type === 'email' ? (
                        <input
                          type={field.type}
                          {...form.register(field.name)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={finnishLanguage.getLabel(
                            field.localization?.labelKey || field.name
                          )}
                        />
                      ) : field.type === 'number' ? (
                        <input
                          type="number"
                          {...form.register(field.name, {
                            valueAsNumber: true,
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={finnishLanguage.getLabel(
                            field.localization?.labelKey || field.name
                          )}
                        />
                      ) : field.type === 'select' ? (
                        <select
                          {...form.register(field.name)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Valitse...</option>
                          {field.options?.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : null}

                      {/* Help Text */}
                      {field.localization?.helpTextKey && (
                        <p className="mt-1 text-sm text-gray-500">
                          {finnishLanguage.getHelpText(
                            field.localization.helpTextKey
                          )}
                        </p>
                      )}

                      {/* Error Message */}
                      {form.formState.errors[field.name] && (
                        <p className="mt-1 text-sm text-red-600">
                          {(() => {
                            const error = form.formState.errors[field.name];
                            return typeof error?.message === 'string'
                              ? error.message
                              : 'Invalid input';
                          })()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={!canGoPrevious}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Edellinen
              </button>

              <div className="flex space-x-4">
                {!isLastPage ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Seuraava
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? 'Lähetetään...' : 'Lähetä lomake'}
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* Success/Error Messages */}
          {submitSuccess && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800">
                {finnishLanguage.getSuccessMessage('formSubmitted')}
              </p>
            </div>
          )}

          {submitError && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{submitError}</p>
            </div>
          )}

          {/* Reset Button */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Nollaa lomake
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EnergyCalculatorDemo;
