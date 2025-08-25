'use client';

import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { type CalculatorFormData } from '@/lib/validation';

interface BasicInfoStepProps {
  form: UseFormReturn<CalculatorFormData>;
}

export function BasicInfoStep({ form }: BasicInfoStepProps) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
          Kerro itsestäsi
        </h3>
        <p className="text-sm sm:text-base text-gray-600 px-2 sm:px-0">
          Käytämme näitä tietoja lähettääksemme sinulle henkilökohtaiset laskelmatulokset
        </p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {/* First Name Field */}
        <div className="space-y-2">
          <Label
            htmlFor="firstName"
            className="text-sm font-medium text-gray-700"
          >
            Etunimi *
          </Label>
          <Input
            id="firstName"
            type="text"
            placeholder="Syötä etunimesi"
            {...register('firstName')}
            className={`w-full ${errors.firstName ? 'border-red-500' : ''}`}
          />
          {errors.firstName && (
            <p className="text-sm text-red-600">{errors.firstName.message}</p>
          )}
        </div>

        {/* Last Name Field */}
        <div className="space-y-2">
          <Label
            htmlFor="lastName"
            className="text-sm font-medium text-gray-700"
          >
            Sukunimi *
          </Label>
          <Input
            id="lastName"
            type="text"
            placeholder="Syötä sukunimesi"
            {...register('lastName')}
            className={`w-full ${errors.lastName ? 'border-red-500' : ''}`}
          />
          {errors.lastName && (
            <p className="text-sm text-red-600">{errors.lastName.message}</p>
          )}
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Sähköpostiosoite *
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="sähköposti@esimerkki.fi"
            {...register('email')}
            className={`w-full ${errors.email ? 'border-red-500' : ''}`}
          />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Phone Field */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
            Puhelinnumero *
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+358 40 123 4567"
            {...register('phone')}
            className={`w-full ${errors.phone ? 'border-red-500' : ''}`}
          />
          {errors.phone && (
            <p className="text-sm text-red-600">{errors.phone.message}</p>
          )}
        </div>

        {/* Street Address Field */}
        <div className="space-y-2">
          <Label
            htmlFor="streetAddress"
            className="text-sm font-medium text-gray-700"
          >
            Katuosoite (valinnainen)
          </Label>
          <Input
            id="streetAddress"
            type="text"
            placeholder="Katuosoite"
            {...register('streetAddress')}
            className={`w-full ${errors.streetAddress ? 'border-red-500' : ''}`}
          />
          {errors.streetAddress && (
            <p className="text-sm text-red-600">
              {errors.streetAddress.message}
            </p>
          )}
        </div>

        {/* City Field */}
        <div className="space-y-2">
          <Label htmlFor="city" className="text-sm font-medium text-gray-700">
            Paikkakunta (valinnainen)
          </Label>
          <Input
            id="city"
            type="text"
            placeholder="Paikkakunta"
            {...register('city')}
            className={`w-full ${errors.city ? 'border-red-500' : ''}`}
          />
          {errors.city && (
            <p className="text-sm text-red-600">{errors.city.message}</p>
          )}
        </div>

        {/* Contact Preference Field */}
        <div className="space-y-2">
          <Label
            htmlFor="contactPreference"
            className="text-sm font-medium text-gray-700"
          >
            Suosikkiyhteystapa *
          </Label>
          <select
            id="contactPreference"
            {...register('contactPreference')}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.contactPreference ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="">Valitse yhteystapa</option>
            <option value="email">Vain sähköposti</option>
            <option value="phone">Vain puhelin</option>
            <option value="both">Sekä sähköposti että puhelin</option>
          </select>
          {errors.contactPreference && (
            <p className="text-sm text-red-600">
              {errors.contactPreference.message}
            </p>
          )}
        </div>

        {/* Message Field */}
        <div className="space-y-2">
          <Label
            htmlFor="message"
            className="text-sm font-medium text-gray-700"
          >
            Lisätietoja (valinnainen)
          </Label>
          <textarea
            id="message"
            placeholder="Mahdollisia lisätietoja tai erityiskysymyksiä..."
            {...register('message')}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[80px] resize-y ${errors.message ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.message && (
            <p className="text-sm text-red-600">{errors.message.message}</p>
          )}
        </div>
      </div>

      {/* GDPR Consent Section */}
      <Card className="bg-gray-50 border-gray-200 mx-2 sm:mx-0">
        <CardContent className="pt-4 px-4 sm:px-6">
          <h4 className="font-semibold text-gray-900 mb-3 text-sm">
            Tietosuoja ja yksityisyys
          </h4>

          {/* Required GDPR Consent */}
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="gdprConsent"
                {...register('gdprConsent')}
                className={errors.gdprConsent ? 'border-red-500' : ''}
              />
              <div className="flex-1">
                <Label
                  htmlFor="gdprConsent"
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                >
                  Hyväksyn{' '}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    tietosuojaselosteen
                  </a>{' '}
                  ja suostun henkilötietojeni käsittelyyn lämpöpumpun laskelmaa ja neuvontapalveluja varten. *
                </Label>
                {errors.gdprConsent && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.gdprConsent.message}
                  </p>
                )}
              </div>
            </div>

            {/* Optional Marketing Consent */}
            <div className="flex items-start space-x-3">
              <Checkbox
                id="marketingConsent"
                {...register('marketingConsent')}
              />
              <div className="flex-1">
                <Label
                  htmlFor="marketingConsent"
                  className="text-sm text-gray-600 cursor-pointer"
                >
                  Haluan vastaanottaa markkinointiviestintää lämpöpumpun ratkaisuista, energiansäästövinkeistä ja erikoistarjouksista sähköpostilla ja puhelimella. (Valinnainen - voit perua tilauksen milloin tahansa)
                </Label>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              <strong>Miksi tarvitsemme nämä tiedot?</strong> Lähetämme sinulle yksityiskohtaisen laskelmaraportin ja myyntitiimimme saattaa ottaa sinuun yhteyttä keskustellakseen lämpöpumpun vaihtoehdoista, jotka vastaavat tarpeitasi. Tietojasi käsitellään turvallisesti GDPR-säädösten mukaisesti.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
