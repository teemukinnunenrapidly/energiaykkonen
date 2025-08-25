import React from 'react';

interface CustomerEmailData {
  firstName: string;
  lastName: string;
  calculations: {
    annualSavings: number;
    fiveYearSavings: number;
    tenYearSavings: number;
    paybackPeriod: number;
    co2Reduction: number;
  };
  houseInfo: {
    squareMeters: number;
    heatingType: string;
  };
}

export const CustomerResultsTemplate = ({
  firstName,
  lastName,
  calculations,
  houseInfo,
}: CustomerEmailData) => {
  return (
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>Your Heat Pump Savings Calculation - Energiaykkönen</title>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          body {
            font-family: 'Inter', Arial, sans-serif;
            line-height: 1.6;
            color: #111827;
            background-color: #f9fafb;
            margin: 0;
            padding: 0;
          }
          
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          
          .header {
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            color: white;
            padding: 32px 24px;
            text-align: center;
          }
          
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
          }
          
          .content {
            padding: 32px 24px;
          }
          
          .greeting {
            font-size: 18px;
            margin-bottom: 24px;
            color: #374151;
          }
          
          .savings-highlight {
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            color: white;
            padding: 24px;
            border-radius: 8px;
            text-align: center;
            margin: 24px 0;
          }
          
          .savings-amount {
            font-size: 36px;
            font-weight: 700;
            margin: 0;
          }
          
          .savings-label {
            font-size: 16px;
            margin: 8px 0 0 0;
            opacity: 0.9;
          }
          
          .calculation-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin: 24px 0;
          }
          
          .calculation-item {
            background: #f9fafb;
            padding: 16px;
            border-radius: 6px;
            text-align: center;
          }
          
          .calculation-value {
            font-size: 24px;
            font-weight: 600;
            color: #22c55e;
            margin: 0;
          }
          
          .calculation-label {
            font-size: 14px;
            color: #6b7280;
            margin: 4px 0 0 0;
          }
          
          .cta-section {
            background: #1f2937;
            color: white;
            padding: 24px;
            border-radius: 8px;
            text-align: center;
            margin: 32px 0;
          }
          
          .cta-button {
            display: inline-block;
            background: #22c55e;
            color: white;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 6px;
            font-weight: 600;
            margin: 16px 0 8px 0;
          }
          
          .footer {
            background: #f9fafb;
            padding: 24px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
          }
          
          .contact-info {
            margin: 16px 0;
          }
          
          .contact-info a {
            color: #22c55e;
            text-decoration: none;
          }
          
          @media (max-width: 600px) {
            .calculation-grid {
              grid-template-columns: 1fr;
            }
            
            .container {
              margin: 0;
              border-radius: 0;
            }
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          {/* Header */}
          <div className="header">
            <h1>🌱 Lämpöpumppu Säästölaskelma</h1>
          </div>

          {/* Content */}
          <div className="content">
            <div className="greeting">
              <strong>
                Hei {firstName} {lastName}!
              </strong>
              <br />
              Kiitos kiinnostuksestasi lämpöpumppuratkaisuihimme. Tässä on
              henkilökohtainen säästölaskelmasi {houseInfo.squareMeters}m²
              kodillesi.
            </div>

            {/* Savings Highlight */}
            <div className="savings-highlight">
              <h2 className="savings-amount">
                {calculations.annualSavings.toLocaleString('fi-FI')}€
              </h2>
              <p className="savings-label">
                vuosittaiset säästöt lämpöpumpulla
              </p>
            </div>

            {/* Calculation Details */}
            <div className="calculation-grid">
              <div className="calculation-item">
                <h3 className="calculation-value">
                  {calculations.fiveYearSavings.toLocaleString('fi-FI')}€
                </h3>
                <p className="calculation-label">5 vuoden säästöt</p>
              </div>
              <div className="calculation-item">
                <h3 className="calculation-value">
                  {calculations.tenYearSavings.toLocaleString('fi-FI')}€
                </h3>
                <p className="calculation-label">10 vuoden säästöt</p>
              </div>
              <div className="calculation-item">
                <h3 className="calculation-value">
                  {calculations.paybackPeriod.toFixed(1)} v
                </h3>
                <p className="calculation-label">Takaisinmaksuaika</p>
              </div>
              <div className="calculation-item">
                <h3 className="calculation-value">
                  {calculations.co2Reduction.toLocaleString('fi-FI')} kg
                </h3>
                <p className="calculation-label">CO2 säästö/vuosi</p>
              </div>
            </div>

            <p
              style={{
                color: '#6b7280',
                fontSize: '14px',
                textAlign: 'center',
                margin: '24px 0',
              }}
            >
              * Laskenta perustuu nykyiseen{' '}
              {houseInfo.heatingType.toLowerCase()} lämmitykseen ja
              keskimääräisiin kulutustietoihin
            </p>

            {/* Call to Action */}
            <div className="cta-section">
              <h3 style={{ margin: '0 0 16px 0' }}>Seuraavat askeleet</h3>
              <p style={{ margin: '0 0 16px 0', opacity: '0.9' }}>
                Haluatko tarkan tarjouksen ja asiantuntijan arvion? Ota yhteyttä
                ilmaiseen kotikäyntiin!
              </p>
              <a href="tel:+358407654321" className="cta-button">
                📞 Varaa ilmainen kotikäynti
              </a>
              <p
                style={{
                  margin: '8px 0 0 0',
                  fontSize: '14px',
                  opacity: '0.8',
                }}
              >
                Soita tai lähetä viesti - vastaamme samana päivänä
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="footer">
            <div className="contact-info">
              <strong>Energiaykkönen Oy</strong>
              <br />
              Puhelin: <a href="tel:+358407654321">+358 40 765 4321</a>
              <br />
              Sähköposti:{' '}
              <a href="mailto:info@energiaykkonen.fi">info@energiaykkonen.fi</a>
              <br />
              Nettisivut:{' '}
              <a href="https://energiaykkonen.fi">energiaykkonen.fi</a>
            </div>
            <p
              style={{
                margin: '16px 0 0 0',
                fontSize: '12px',
                color: '#9ca3af',
              }}
            >
              Tämä viesti on lähetetty, koska täytit lämpöpumppu
              säästölaskurimme. Jos et halua vastaanottaa viestejämme, voit
              <a href="#" style={{ color: '#9ca3af' }}>
                peruuttaa tilauksen
              </a>
              .
            </p>
          </div>
        </div>
      </body>
    </html>
  );
};

// Export template as string function for Resend
export const generateCustomerEmailHtml = (data: CustomerEmailData): string => {
  // In a real implementation, you'd use a proper React SSR solution
  // For now, we'll create a static version
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>Your Heat Pump Savings Calculation - Energiaykkönen</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          body {
            font-family: 'Inter', Arial, sans-serif;
            line-height: 1.6;
            color: #111827;
            background-color: #f9fafb;
            margin: 0;
            padding: 0;
          }
          
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          
          .header {
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            color: white;
            padding: 32px 24px;
            text-align: center;
          }
          
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
          }
          
          .content {
            padding: 32px 24px;
          }
          
          .savings-highlight {
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            color: white;
            padding: 24px;
            border-radius: 8px;
            text-align: center;
            margin: 24px 0;
          }
          
          .savings-amount {
            font-size: 36px;
            font-weight: 700;
            margin: 0;
          }
          
          .calculation-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin: 24px 0;
          }
          
          .calculation-item {
            background: #f9fafb;
            padding: 16px;
            border-radius: 6px;
            text-align: center;
          }
          
          .calculation-value {
            font-size: 24px;
            font-weight: 600;
            color: #22c55e;
            margin: 0;
          }
          
          .cta-section {
            background: #1f2937;
            color: white;
            padding: 24px;
            border-radius: 8px;
            text-align: center;
            margin: 32px 0;
          }
          
          .cta-button {
            display: inline-block;
            background: #22c55e;
            color: white;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 6px;
            font-weight: 600;
            margin: 16px 0 8px 0;
          }
          
          .footer {
            background: #f9fafb;
            padding: 24px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
          }
          
          @media (max-width: 600px) {
            .calculation-grid {
              grid-template-columns: 1fr;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌱 Lämpöpumppu Säästölaskelma</h1>
          </div>
          
          <div class="content">
            <div style="font-size: 18px; margin-bottom: 24px; color: #374151;">
              <strong>Hei ${data.firstName} ${data.lastName}!</strong>
              <br />
              Kiitos kiinnostuksestasi lämpöpumppuratkaisuihimme. Tässä on henkilökohtainen säästölaskelmasi ${data.houseInfo.squareMeters}m² kodillesi.
            </div>
            
            <div class="savings-highlight">
              <h2 class="savings-amount">${data.calculations.annualSavings.toLocaleString('fi-FI')}€</h2>
              <p style="font-size: 16px; margin: 8px 0 0 0; opacity: 0.9;">vuosittaiset säästöt lämpöpumpulla</p>
            </div>
            
            <div class="calculation-grid">
              <div class="calculation-item">
                <h3 class="calculation-value">${data.calculations.fiveYearSavings.toLocaleString('fi-FI')}€</h3>
                <p style="font-size: 14px; color: #6b7280; margin: 4px 0 0 0;">5 vuoden säästöt</p>
              </div>
              <div class="calculation-item">
                <h3 class="calculation-value">${data.calculations.tenYearSavings.toLocaleString('fi-FI')}€</h3>
                <p style="font-size: 14px; color: #6b7280; margin: 4px 0 0 0;">10 vuoden säästöt</p>
              </div>
              <div class="calculation-item">
                <h3 class="calculation-value">${data.calculations.paybackPeriod.toFixed(1)} v</h3>
                <p style="font-size: 14px; color: #6b7280; margin: 4px 0 0 0;">Takaisinmaksuaika</p>
              </div>
              <div class="calculation-item">
                <h3 class="calculation-value">${data.calculations.co2Reduction.toLocaleString('fi-FI')} kg</h3>
                <p style="font-size: 14px; color: #6b7280; margin: 4px 0 0 0;">CO2 säästö/vuosi</p>
              </div>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 24px 0;">
              * Laskenta perustuu nykyiseen ${data.houseInfo.heatingType.toLowerCase()} lämmitykseen ja keskimääräisiin kulutustietoihin
            </p>
            
            <div class="cta-section">
              <h3 style="margin: 0 0 16px 0;">Seuraavat askeleet</h3>
              <p style="margin: 0 0 16px 0; opacity: 0.9;">
                Haluatko tarkan tarjouksen ja asiantuntijan arvion? Ota yhteyttä ilmaiseen kotikäyntiin!
              </p>
              <a href="tel:+358407654321" class="cta-button">
                📞 Varaa ilmainen kotikäynti
              </a>
              <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.8;">
                Soita tai lähetä viesti - vastaamme samana päivänä
              </p>
            </div>
          </div>
          
          <div class="footer">
            <div>
              <strong>Energiaykkönen Oy</strong><br />
              Puhelin: <a href="tel:+358407654321" style="color: #22c55e;">+358 40 765 4321</a><br />
              Sähköposti: <a href="mailto:info@energiaykkonen.fi" style="color: #22c55e;">info@energiaykkonen.fi</a><br />
              Nettisivut: <a href="https://energiaykkonen.fi" style="color: #22c55e;">energiaykkonen.fi</a>
            </div>
            <p style="margin: 16px 0 0 0; font-size: 12px; color: #9ca3af;">
              Tämä viesti on lähetetty, koska täytit lämpöpumppu säästölaskurimme.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
};
