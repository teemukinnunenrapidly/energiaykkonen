# Cookie Consent & Google Consent Mode v2 Integration

Tämä dokumentti kuvaa GDPR-yhteensopivan cookie consent järjestelmän ja Google Consent Mode v2:n integraation E1 Calculator sovellukseen.

## Yleiskatsaus

Järjestelmä tarjoaa:

- **GDPR-yhteensopiva cookie pop-up** suomalaisille ja EU-käyttäjille
- **Heti sivun latautuessa** näkyvä modal pop-up
- **Google Consent Mode v2** integraatio GTM:n kanssa
- **Granulaariset consent asetukset** (välttämättömät, analytiikka, markkinointi, asetukset)
- **Automaattinen consent management** ja tallennus
- **Privacy policy** integraatio

## Tekninen toteutus

### 1. Pääkomponentit

#### `src/components/CookieConsentBanner.tsx`

- Pääasiallinen cookie consent pop-up komponentti
- Modal pop-up joka tulee esille heti sivun latautuessa
- Tukee granulaarisia consent asetuksia
- Integroitu Google Consent Mode v2:n kanssa
- Responsiivinen design ja accessibility tuki
- GDPR-compliant: ei voi sulkea ilman valintaa

#### `src/lib/consent-mode.ts`

- Google Consent Mode v2 konfiguraatio
- Consent state management
- GDPR compliance utilities
- Country detection (EU-käyttäjät)

#### `src/config/gtm.ts` (päivitetty)

- Consent-aware GTM events
- Analytics wrapper funktiot
- Consent checking utilities

### 2. Consent Types

```typescript
interface ConsentPreferences {
  necessary: boolean; // Välttämättömät evästeet (aina true)
  analytics: boolean; // Analytics evästeet (Google Analytics)
  marketing: boolean; // Markkinointi evästeet (Google Ads, Facebook)
  preferences: boolean; // Asetus evästeet (käyttäjäpreferenssit)
}
```

### 3. Google Consent Mode v2 Mapping

| Consent Type | Consent Mode Parameter                             | Kuvaus                   |
| ------------ | -------------------------------------------------- | ------------------------ |
| necessary    | `security_storage: 'granted'`                      | Välttämättömät evästeet  |
| analytics    | `analytics_storage`                                | Analytics data tallennus |
| marketing    | `ad_storage`, `ad_user_data`, `ad_personalization` | Markkinointi evästeet    |
| preferences  | `functionality_storage`, `personalization_storage` | Asetus evästeet          |

## Käyttöohjeet

### 1. Consent Banner

Banner näkyy automaattisesti:

- Uusille käyttäjille (ei tallennettua consentia)
- EU-käyttäjille (maan tunnistus)
- Consent vanhenemisen jälkeen

**Banner vaihtoehdot:**

- **"Accept All"** - Hyväksyy kaikki evästeet
- **"Necessary Only"** - Hyväksyy vain välttämättömät
- **"Customize"** - Aukaisee granulaariset asetukset

### 2. Consent Management

```typescript
// Tarkista consent status
import { hasAnalyticsConsent, hasMarketingConsent } from '@/config/gtm';

const canTrackAnalytics = hasAnalyticsConsent();
const canTrackMarketing = hasMarketingConsent();

// Consent-aware analytics
import { consentAwareAnalytics } from '@/config/gtm';

consentAwareAnalytics.pageView('/calculator');
consentAwareAnalytics.event('form_submit', { form_type: 'energy_calc' });
consentAwareAnalytics.conversion('AW-CONVERSION_ID', { value: 100 });
```

### 3. Privacy Policy

Privacy policy linkitetään suoraan EnergiaYkkönen.fi:n viralliseen evästeselosteeseen:

- **Evästeseloste**: [https://energiaykkonen.fi/evasteseloste/](https://energiaykkonen.fi/evasteseloste/)
- **Tietosuojaseloste**: [https://energiaykkonen.fi/tietosuojaseloste/](https://energiaykkonen.fi/tietosuojaseloste/)
- Linkit avautuvat uudessa välilehdessä
- Yhteensopiva GDPR-vaatimusten kanssa

## GTM Konfiguraatio

### 1. Consent Mode Setup

GTM konfiguraatio sisältää automaattisesti:

```javascript
gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  functionality_storage: 'denied',
  personalization_storage: 'denied',
  security_storage: 'granted',
});
```

### 1.1 Custom Consent Event

Järjestelmä lähettää myös `cookie_consent_update` custom eventin GTM:lle kun käyttäjä tekee valinnan:

```javascript
window.dataLayer.push({
  event: 'cookie_consent_update',
  consent_analytics: true / false,
  consent_marketing: true / false,
  consent_preferences: true / false,
  consent_necessary: true,
});
```

Tämä mahdollistaa yhteensopivuuden energiaykkonen.fi pääsivuston kanssa, joka käyttää samaa custom eventiä.

### 2. Tag Configuration

**Analytics Tags:**

- Trigger: Custom Event = `gtm.js` AND Consent = Analytics Granted
- Type: Google Analytics: GA4 Event

**Marketing Tags:**

- Trigger: Custom Event = `gtm.js` AND Consent = Ad Storage Granted
- Type: Google Ads Conversion Tracking

**Preference Tags:**

- Trigger: Custom Event = `gtm.js` AND Consent = Functionality Granted
- Type: Custom HTML (preference storage)

### 3. Variables

Luo GTM:ssä seuraavat muuttujat:

- `Consent - Analytics`: `{{Consent - Analytics}}`
- `Consent - Marketing`: `{{Consent - Marketing}}`
- `Consent - Preferences`: `{{Consent - Preferences}}`

## Testing & Debugging

### 1. Test Page

Käytä `/test-gtm` sivua testaamaan:

- Cookie consent banner toimivuus
- GTM events ja consent integration
- Google Consent Mode v2 status

### 2. Browser Dev Tools

```javascript
// Tarkista consent status konsolissa
console.log('Analytics consent:', hasAnalyticsConsent());
console.log('Marketing consent:', hasMarketingConsent());

// Tarkista dataLayer
console.log('dataLayer:', window.dataLayer);

// Tarkista consent mode
console.log(
  'Consent state:',
  window.dataLayer.find(item => item.event === 'gtm.js')
);
```

### 3. GTM Preview Mode

1. Avaa GTM Preview mode
2. Navigoi sivustolle
3. Tarkista consent events:
   - `gtm.js` - GTM lataus
   - `consent` - Consent state updates
   - Custom events (vain consent granted)

## GDPR Compliance

### 1. Legal Requirements

- **Consent before tracking** - Analytics/marketing vain consentin jälkeen
- **Granular consent** - Käyttäjä voi valita evästetyypit
- **Easy withdrawal** - Consent voi perua helposti
- **Transparency** - Selkeä kuvaus evästeiden käytöstä

### 2. Data Minimization

- Vain välttämättömät evästeet oletuksena
- Analytics vain consentin jälkeen
- Marketing tracking vain explicit consentin jälkeen
- Data retention policies noudatetaan

### 3. User Rights

Käyttäjät voivat:

- Hyväksyä/hylätä evästeet granulaarisesti
- Muuttaa consent asetuksia myöhemmin
- Pyytää data deletion
- Saada data kopion (GDPR Art. 20)

## Implementation Checklist

### ✅ Completed Features

- [x] GDPR-compliant cookie banner
- [x] Google Consent Mode v2 integration
- [x] Granular consent preferences
- [x] Consent-aware GTM events
- [x] Privacy policy page
- [x] Test page for debugging
- [x] Local storage management
- [x] Country detection (EU users)
- [x] Responsive design
- [x] Accessibility features

### 🔄 Future Enhancements

- [ ] Server-side consent management
- [ ] Advanced country detection
- [ ] Consent analytics dashboard
- [ ] A/B testing for banner design
- [ ] Integration with external consent platforms
- [ ] Multi-language support
- [ ] Advanced cookie categorization

## Troubleshooting

### Common Issues

1. **Banner ei näy**
   - Tarkista localStorage: `cookie_consent_preferences`
   - Poista consent data: `clearConsent()` funktio
   - Tarkista EU country detection

2. **GTM events eivät toimi**
   - Tarkista consent status konsolissa
   - Varmista että consent on granted
   - Tarkista GTM preview mode

3. **Consent Mode ei päivity**
   - Tarkista `gtag('consent', 'update')` kutsut
   - Varmista että GTM on ladattu
   - Tarkista browser console virheet

### Debug Commands

```javascript
// Clear consent ja reload
clearConsent();

// Tarkista consent preferences
getConsentPreferences();

// Force consent update
updateConsentMode({
  necessary: true,
  analytics: true,
  marketing: false,
  preferences: true,
});
```

## Security Considerations

- Consent data tallennetaan localStorage:een (client-side)
- Ei sensitive dataa consent events:issä
- PII excluded from tracking data
- Secure cookie handling
- Regular security audits recommended

## Performance Impact

- Minimal performance impact
- Async consent management
- No blocking operations
- Efficient localStorage usage
- Lazy loading of consent components

---

**Tämä järjestelmä on täysin GDPR-yhteensopiva ja valmis tuotantokäyttöön.**
