import React, { useState } from 'react';
import type { FormData } from '../types';

interface CalculatorFormProps {
  onSubmit: (data: FormData) => void;
  isLoading?: boolean;
  initialData?: FormData | null;
}

export const CalculatorForm: React.FC<CalculatorFormProps> = ({
  onSubmit,
  isLoading = false,
  initialData,
}) => {
  const [formData, setFormData] = useState<FormData>(
    initialData || {
      energyConsumption: '',
      currentHeatingCost: '',
      heatingType: 'oil',
      postalCode: '',
      email: '',
    }
  );

  const [errors, setErrors] = useState<Partial<FormData>>({});

  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (
      !formData.energyConsumption ||
      Number(formData.energyConsumption) <= 0
    ) {
      newErrors.energyConsumption = 'Syötä vuosittainen energiantarve';
    }

    if (
      !formData.currentHeatingCost ||
      Number(formData.currentHeatingCost) <= 0
    ) {
      newErrors.currentHeatingCost = 'Syötä nykyiset lämmityskustannukset';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Virheellinen sähköpostiosoite';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validate()) {
      onSubmit(formData);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Poista virhe kun kenttää muutetaan
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <form className="e1w-form" onSubmit={handleSubmit}>
      <div className="e1w-form-group">
        <label htmlFor="energyConsumption" className="e1w-label">
          Vuosittainen energiantarve (kWh) *
        </label>
        <input
          type="number"
          id="energyConsumption"
          name="energyConsumption"
          value={formData.energyConsumption}
          onChange={handleChange}
          className={`e1w-input ${errors.energyConsumption ? 'e1w-input-error' : ''}`}
          placeholder="esim. 20000"
          min="0"
          max="100000"
          step="100"
          disabled={isLoading}
        />
        {errors.energyConsumption && (
          <span className="e1w-error-text">{errors.energyConsumption}</span>
        )}
      </div>

      <div className="e1w-form-group">
        <label htmlFor="currentHeatingCost" className="e1w-label">
          Nykyiset lämmityskustannukset (€/vuosi) *
        </label>
        <input
          type="number"
          id="currentHeatingCost"
          name="currentHeatingCost"
          value={formData.currentHeatingCost}
          onChange={handleChange}
          className={`e1w-input ${errors.currentHeatingCost ? 'e1w-input-error' : ''}`}
          placeholder="esim. 3000"
          min="0"
          max="50000"
          step="50"
          disabled={isLoading}
        />
        {errors.currentHeatingCost && (
          <span className="e1w-error-text">{errors.currentHeatingCost}</span>
        )}
      </div>

      <div className="e1w-form-group">
        <label htmlFor="heatingType" className="e1w-label">
          Nykyinen lämmitysmuoto
        </label>
        <select
          id="heatingType"
          name="heatingType"
          value={formData.heatingType}
          onChange={handleChange}
          className="e1w-select"
          disabled={isLoading}
        >
          <option value="oil">Öljylämmitys</option>
          <option value="electric">Suora sähkölämmitys</option>
          <option value="district">Kaukolämpö</option>
          <option value="gas">Kaasu</option>
          <option value="other">Muu</option>
        </select>
      </div>

      <div className="e1w-form-row">
        <div className="e1w-form-group">
          <label htmlFor="postalCode" className="e1w-label">
            Postinumero
          </label>
          <input
            type="text"
            id="postalCode"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleChange}
            className="e1w-input"
            placeholder="00100"
            maxLength={5}
            pattern="[0-9]{5}"
            disabled={isLoading}
          />
        </div>

        <div className="e1w-form-group">
          <label htmlFor="email" className="e1w-label">
            Sähköposti (vapaaehtoinen)
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`e1w-input ${errors.email ? 'e1w-input-error' : ''}`}
            placeholder="nimi@esimerkki.fi"
            disabled={isLoading}
          />
          {errors.email && (
            <span className="e1w-error-text">{errors.email}</span>
          )}
        </div>
      </div>

      <button
        type="submit"
        className="e1w-btn e1w-btn-primary e1w-submit-btn"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <span className="e1w-spinner"></span>
            Lasketaan...
          </>
        ) : (
          'Laske säästöt'
        )}
      </button>

      <p className="e1w-disclaimer">
        * Pakolliset kentät. Laskenta perustuu keskimääräisiin arvoihin ja COP
        3.8 hyötysuhteeseen.
      </p>
    </form>
  );
};
