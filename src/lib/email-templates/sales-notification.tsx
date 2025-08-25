import React from 'react';
import { Lead } from '@/lib/supabase';

interface SalesEmailData {
  lead: Lead;
  leadScore: 'high' | 'medium' | 'low';
  adminUrl: string;
}

export const SalesNotificationTemplate = ({
  lead,
  leadScore,
  adminUrl,
}: SalesEmailData) => {
  return (
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>
          New Lead: {lead.first_name} {lead.last_name} - {lead.city} - Savings:{' '}
          {lead.annual_savings.toLocaleString('fi-FI')}€/year
        </title>
        <style>{`
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
          }
          
          .container {
            max-width: 700px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          
          .header {
            background: #1f2937;
            color: white;
            padding: 20px 24px;
          }
          
          .header h1 {
            margin: 0;
            font-size: 20px;
            font-weight: 600;
          }
          
          .lead-score {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            margin-left: 12px;
          }
          
          .score-high {
            background: #ef4444;
            color: white;
          }
          
          .score-medium {
            background: #f59e0b;
            color: white;
          }
          
          .score-low {
            background: #6b7280;
            color: white;
          }
          
          .content {
            padding: 24px;
          }
          
          .section {
            margin-bottom: 24px;
            padding: 16px;
            background: #f9fafb;
            border-radius: 6px;
            border-left: 4px solid #22c55e;
          }
          
          .section h3 {
            margin: 0 0 12px 0;
            font-size: 16px;
            color: #1f2937;
          }
          
          .data-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin: 12px 0;
          }
          
          .data-item {
            margin: 8px 0;
          }
          
          .data-label {
            font-weight: 600;
            color: #374151;
            margin-right: 8px;
          }
          
          .data-value {
            color: #6b7280;
          }
          
          .savings-highlight {
            background: #22c55e;
            color: white;
            padding: 16px;
            border-radius: 6px;
            text-align: center;
            margin: 16px 0;
          }
          
          .savings-amount {
            font-size: 28px;
            font-weight: 700;
            margin: 0;
          }
          
          .cta-buttons {
            text-align: center;
            margin: 24px 0;
          }
          
          .btn {
            display: inline-block;
            padding: 12px 24px;
            margin: 8px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            font-size: 14px;
          }
          
          .btn-primary {
            background: #22c55e;
            color: white;
          }
          
          .btn-secondary {
            background: #374151;
            color: white;
          }
          
          .metadata {
            background: #f3f4f6;
            padding: 16px;
            border-radius: 6px;
            font-size: 14px;
            color: #6b7280;
          }
          
          .urgent {
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #991b1b;
            padding: 12px;
            border-radius: 6px;
            margin: 16px 0;
            text-align: center;
            font-weight: 600;
          }
          
          @media (max-width: 600px) {
            .data-grid {
              grid-template-columns: 1fr;
            }
            
            body {
              padding: 10px;
            }
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          {/* Header */}
          <div className="header">
            <h1>
              🔥 Uusi Lead
              <span className={`lead-score score-${leadScore}`}>
                {leadScore.toUpperCase()} PRIORITY
              </span>
            </h1>
            <p style={{ margin: '8px 0 0 0', opacity: '0.9' }}>
              {lead.first_name} {lead.last_name} - {lead.city || 'Ei kaupunkia'}{' '}
              - Säästöt: {lead.annual_savings.toLocaleString('fi-FI')}€/vuosi
            </p>
          </div>

          <div className="content">
            {/* High priority alert */}
            {leadScore === 'high' && (
              <div className="urgent">
                ⚡ KORKEAN PRIORITEETIN LEAD - Ota yhteyttä 24h sisällä!
              </div>
            )}

            {/* Savings Highlight */}
            <div className="savings-highlight">
              <h2 className="savings-amount">
                {lead.annual_savings.toLocaleString('fi-FI')}€
              </h2>
              <p style={{ margin: '4px 0 0 0', opacity: '0.9' }}>
                vuosittaiset säästöt
              </p>
            </div>

            {/* Contact Information */}
            <div className="section">
              <h3>📞 Yhteystiedot</h3>
              <div className="data-grid">
                <div className="data-item">
                  <span className="data-label">Nimi:</span>
                  <span className="data-value">
                    {lead.first_name} {lead.last_name}
                  </span>
                </div>
                <div className="data-item">
                  <span className="data-label">Sähköposti:</span>
                  <span className="data-value">
                    <a
                      href={`mailto:${lead.email}`}
                      style={{ color: '#22c55e' }}
                    >
                      {lead.email}
                    </a>
                  </span>
                </div>
                <div className="data-item">
                  <span className="data-label">Puhelin:</span>
                  <span className="data-value">
                    <a href={`tel:${lead.phone}`} style={{ color: '#22c55e' }}>
                      {lead.phone}
                    </a>
                  </span>
                </div>
                <div className="data-item">
                  <span className="data-label">Yhteydenotto:</span>
                  <span className="data-value">{lead.contact_preference}</span>
                </div>
              </div>
              {lead.street_address && (
                <div className="data-item">
                  <span className="data-label">Osoite:</span>
                  <span className="data-value">
                    {lead.street_address}, {lead.city}
                  </span>
                </div>
              )}
              {lead.message && (
                <div className="data-item" style={{ marginTop: '16px' }}>
                  <span className="data-label">Viesti:</span>
                  <div
                    style={{
                      background: '#ffffff',
                      padding: '12px',
                      borderRadius: '4px',
                      marginTop: '8px',
                    }}
                  >
                    "{lead.message}"
                  </div>
                </div>
              )}
            </div>

            {/* House Information */}
            <div className="section">
              <h3>🏠 Talon tiedot</h3>
              <div className="data-grid">
                <div className="data-item">
                  <span className="data-label">Koko:</span>
                  <span className="data-value">{lead.square_meters}m²</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Korkeus:</span>
                  <span className="data-value">{lead.ceiling_height}m</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Kerrokset:</span>
                  <span className="data-value">{lead.floors} krs</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Rakennusvuosi:</span>
                  <span className="data-value">{lead.construction_year}</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Nykyinen lämmitys:</span>
                  <span className="data-value">{lead.heating_type}</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Lämmityskustannus:</span>
                  <span className="data-value">
                    {lead.current_heating_cost.toLocaleString('fi-FI')}€/vuosi
                  </span>
                </div>
                <div className="data-item">
                  <span className="data-label">Asukkaat:</span>
                  <span className="data-value">{lead.residents} henkilöä</span>
                </div>
                <div className="data-item">
                  <span className="data-label">LKV käyttö:</span>
                  <span className="data-value">{lead.hot_water_usage}</span>
                </div>
              </div>
            </div>

            {/* Calculation Results */}
            <div className="section">
              <h3>📊 Laskelman tulokset</h3>
              <div className="data-grid">
                <div className="data-item">
                  <span className="data-label">Energiantarve:</span>
                  <span className="data-value">
                    {lead.annual_energy_need.toLocaleString('fi-FI')} kWh/v
                  </span>
                </div>
                <div className="data-item">
                  <span className="data-label">LP kulutus:</span>
                  <span className="data-value">
                    {lead.heat_pump_consumption.toLocaleString('fi-FI')} kWh/v
                  </span>
                </div>
                <div className="data-item">
                  <span className="data-label">LP kustannus:</span>
                  <span className="data-value">
                    {lead.heat_pump_cost_annual.toLocaleString('fi-FI')}€/v
                  </span>
                </div>
                <div className="data-item">
                  <span className="data-label">Vuosisäästö:</span>
                  <span
                    className="data-value"
                    style={{ fontWeight: '600', color: '#22c55e' }}
                  >
                    {lead.annual_savings.toLocaleString('fi-FI')}€
                  </span>
                </div>
                <div className="data-item">
                  <span className="data-label">5v säästöt:</span>
                  <span className="data-value">
                    {lead.five_year_savings.toLocaleString('fi-FI')}€
                  </span>
                </div>
                <div className="data-item">
                  <span className="data-label">10v säästöt:</span>
                  <span className="data-value">
                    {lead.ten_year_savings.toLocaleString('fi-FI')}€
                  </span>
                </div>
                <div className="data-item">
                  <span className="data-label">Takaisinmaksu:</span>
                  <span className="data-value">
                    {lead.payback_period.toFixed(1)} vuotta
                  </span>
                </div>
                <div className="data-item">
                  <span className="data-label">CO2 säästö:</span>
                  <span className="data-value">
                    {lead.co2_reduction.toLocaleString('fi-FI')} kg/v
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="cta-buttons">
              <a href={`tel:${lead.phone}`} className="btn btn-primary">
                📞 Soita asiakkaalle
              </a>
              <a href={`mailto:${lead.email}`} className="btn btn-secondary">
                ✉️ Lähetä sähköposti
              </a>
              <a href={adminUrl} className="btn btn-secondary">
                👤 Avaa CRM
              </a>
            </div>

            {/* Metadata */}
            <div className="metadata">
              <h4 style={{ margin: '0 0 8px 0', color: '#374151' }}>
                Metatiedot
              </h4>
              <div style={{ fontSize: '13px' }}>
                <div>
                  <strong>Lead ID:</strong> {lead.id}
                </div>
                <div>
                  <strong>Aikaleima:</strong>{' '}
                  {new Date(lead.created_at).toLocaleString('fi-FI')}
                </div>
                <div>
                  <strong>IP-osoite:</strong>{' '}
                  {lead.ip_address || 'Ei saatavilla'}
                </div>
                <div>
                  <strong>Lähde:</strong> {lead.source_page || 'Suora'}
                </div>
                <div>
                  <strong>Selain:</strong>{' '}
                  {lead.user_agent
                    ? lead.user_agent.substring(0, 100) + '...'
                    : 'Ei saatavilla'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
};

// Export template as string function for Resend
export const generateSalesEmailHtml = (data: SalesEmailData): string => {
  const { lead, leadScore, adminUrl } = data;

  const scoreClass = `score-${leadScore}`;
  const priorityAlert =
    leadScore === 'high'
      ? '<div style="background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 12px; border-radius: 6px; margin: 16px 0; text-align: center; font-weight: 600;">⚡ KORKEAN PRIORITEETIN LEAD - Ota yhteyttä 24h sisällä!</div>'
      : '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>New Lead: ${lead.first_name} ${lead.last_name} - ${lead.city || 'Ei kaupunkia'} - Savings: ${lead.annual_savings.toLocaleString('fi-FI')}€/year</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
          }
          
          .container {
            max-width: 700px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          
          .header {
            background: #1f2937;
            color: white;
            padding: 20px 24px;
          }
          
          .lead-score {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            margin-left: 12px;
          }
          
          .score-high { background: #ef4444; color: white; }
          .score-medium { background: #f59e0b; color: white; }
          .score-low { background: #6b7280; color: white; }
          
          .section {
            margin-bottom: 24px;
            padding: 16px;
            background: #f9fafb;
            border-radius: 6px;
            border-left: 4px solid #22c55e;
          }
          
          .data-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin: 12px 0;
          }
          
          .savings-highlight {
            background: #22c55e;
            color: white;
            padding: 16px;
            border-radius: 6px;
            text-align: center;
            margin: 16px 0;
          }
          
          .btn {
            display: inline-block;
            padding: 12px 24px;
            margin: 8px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            font-size: 14px;
          }
          
          .btn-primary { background: #22c55e; color: white; }
          .btn-secondary { background: #374151; color: white; }
          
          @media (max-width: 600px) {
            .data-grid { grid-template-columns: 1fr; }
            body { padding: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 20px; font-weight: 600;">
              🔥 Uusi Lead
              <span class="lead-score ${scoreClass}">${leadScore.toUpperCase()} PRIORITY</span>
            </h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9;">
              ${lead.first_name} ${lead.last_name} - ${lead.city || 'Ei kaupunkia'} - Säästöt: ${lead.annual_savings.toLocaleString('fi-FI')}€/vuosi
            </p>
          </div>
          
          <div style="padding: 24px;">
            ${priorityAlert}
            
            <div class="savings-highlight">
              <h2 style="font-size: 28px; font-weight: 700; margin: 0;">${lead.annual_savings.toLocaleString('fi-FI')}€</h2>
              <p style="margin: 4px 0 0 0; opacity: 0.9;">vuosittaiset säästöt</p>
            </div>
            
            <div class="section">
              <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #1f2937;">📞 Yhteystiedot</h3>
              <div class="data-grid">
                <div><strong>Nimi:</strong> ${lead.first_name} ${lead.last_name}</div>
                <div><strong>Sähköposti:</strong> <a href="mailto:${lead.email}" style="color: #22c55e;">${lead.email}</a></div>
                <div><strong>Puhelin:</strong> <a href="tel:${lead.phone}" style="color: #22c55e;">${lead.phone}</a></div>
                <div><strong>Yhteydenotto:</strong> ${lead.contact_preference}</div>
              </div>
              ${lead.street_address ? `<div style="margin-top: 12px;"><strong>Osoite:</strong> ${lead.street_address}, ${lead.city}</div>` : ''}
              ${lead.message ? `<div style="margin-top: 16px;"><strong>Viesti:</strong><div style="background: #ffffff; padding: 12px; border-radius: 4px; margin-top: 8px;">"${lead.message}"</div></div>` : ''}
            </div>
            
            <div class="section">
              <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #1f2937;">🏠 Talon tiedot</h3>
              <div class="data-grid">
                <div><strong>Koko:</strong> ${lead.square_meters}m²</div>
                <div><strong>Korkeus:</strong> ${lead.ceiling_height}m</div>
                <div><strong>Kerrokset:</strong> ${lead.floors} krs</div>
                <div><strong>Rakennusvuosi:</strong> ${lead.construction_year}</div>
                <div><strong>Nykyinen lämmitys:</strong> ${lead.heating_type}</div>
                <div><strong>Lämmityskustannus:</strong> ${lead.current_heating_cost.toLocaleString('fi-FI')}€/vuosi</div>
                <div><strong>Asukkaat:</strong> ${lead.residents} henkilöä</div>
                <div><strong>LKV käyttö:</strong> ${lead.hot_water_usage}</div>
              </div>
            </div>
            
            <div class="section">
              <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #1f2937;">📊 Laskelman tulokset</h3>
              <div class="data-grid">
                <div><strong>Energiantarve:</strong> ${lead.annual_energy_need.toLocaleString('fi-FI')} kWh/v</div>
                <div><strong>LP kulutus:</strong> ${lead.heat_pump_consumption.toLocaleString('fi-FI')} kWh/v</div>
                <div><strong>LP kustannus:</strong> ${lead.heat_pump_cost_annual.toLocaleString('fi-FI')}€/v</div>
                <div><strong>Vuosisäästö:</strong> <span style="font-weight: 600; color: #22c55e;">${lead.annual_savings.toLocaleString('fi-FI')}€</span></div>
                <div><strong>5v säästöt:</strong> ${lead.five_year_savings.toLocaleString('fi-FI')}€</div>
                <div><strong>10v säästöt:</strong> ${lead.ten_year_savings.toLocaleString('fi-FI')}€</div>
                <div><strong>Takaisinmaksu:</strong> ${lead.payback_period.toFixed(1)} vuotta</div>
                <div><strong>CO2 säästö:</strong> ${lead.co2_reduction.toLocaleString('fi-FI')} kg/v</div>
              </div>
            </div>
            
            <div style="text-align: center; margin: 24px 0;">
              <a href="tel:${lead.phone}" class="btn btn-primary">📞 Soita asiakkaalle</a>
              <a href="mailto:${lead.email}" class="btn btn-secondary">✉️ Lähetä sähköposti</a>
              <a href="${adminUrl}" class="btn btn-secondary">👤 Avaa CRM</a>
            </div>
            
            <div style="background: #f3f4f6; padding: 16px; border-radius: 6px; font-size: 14px; color: #6b7280;">
              <h4 style="margin: 0 0 8px 0; color: #374151;">Metatiedot</h4>
              <div style="font-size: 13px;">
                <div><strong>Lead ID:</strong> ${lead.id}</div>
                <div><strong>Aikaleima:</strong> ${new Date(lead.created_at).toLocaleString('fi-FI')}</div>
                <div><strong>IP-osoite:</strong> ${lead.ip_address || 'Ei saatavilla'}</div>
                <div><strong>Lähde:</strong> ${lead.source_page || 'Suora'}</div>
                <div><strong>Selain:</strong> ${lead.user_agent ? lead.user_agent.substring(0, 100) + '...' : 'Ei saatavilla'}</div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};
