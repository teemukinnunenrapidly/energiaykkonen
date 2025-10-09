# jQuery & GTM Troubleshooting Guide

Tämä dokumentti auttaa ratkaisemaan jQuery-aiheisia ongelmia Google Tag Managerin kanssa.

## Yleisiä Ongelmia

### 1. "jQuery is not defined" Error

**Syy**: GTM yrittää käyttää jQuery:tä ennen kuin se on ladattu.

**Ratkaisu**:

- jQuery ladataan automaattisesti `beforeInteractive` strategialla
- GTM odottaa jQuery:n latautumista ennen alustamista
- Fallback mekanismi alustaa GTM:n ilman jQuery:tä 2 sekunnin kuluttua

### 2. GTM ei lataudu

**Syy**: jQuery ei lataudu tai GTM-skripti epäonnistuu.

**Ratkaisu**:

- Tarkista konsoli virheille
- Varmista että internet-yhteys toimii
- Testaa eri selaimella

### 3. Consent Mode ei toimi

**Syy**: GTM latautuu ennen consent mode konfiguraatiota.

**Ratkaisu**:

- Consent mode asetetaan ennen GTM:n alustamista
- GTM odottaa jQuery:n saatavuutta

## Debugging

### 1. Tarkista jQuery Status

```javascript
// Konsolissa
console.log('jQuery available:', typeof window.jQuery !== 'undefined');
console.log('jQuery version:', window.jQuery?.fn?.jquery);
```

### 2. Tarkista GTM Status

```javascript
// Konsolissa
console.log('GTM available:', typeof window.dataLayer !== 'undefined');
console.log('DataLayer:', window.dataLayer);
```

### 3. Tarkista Consent Status

```javascript
// Konsolissa
console.log(
  'Consent preferences:',
  localStorage.getItem('cookie_consent_preferences')
);
```

### 4. Test-sivun Käyttö

Mene `/test-gtm` sivulle ja:

1. Klikkaa "Tarkista järjestelmän status"
2. Tarkista konsoli virheille
3. Testaa eri painikkeita

## Tekninen Toteutus

### 1. jQuery Lataus

```typescript
<Script
  src="https://code.jquery.com/jquery-3.7.1.min.js"
  strategy="afterInteractive"
  onLoad={() => {
    if (typeof window !== 'undefined' && window.jQuery) {
      window.$ = window.jQuery;
    }
  }}
/>
```

### 2. GTM Alustus

```javascript
function initializeGTM() {
  if (typeof window.jQuery !== 'undefined') {
    // Alusta GTM jQuery:n kanssa
    // ... GTM koodi
  } else {
    // Yritä uudelleen 100ms kuluttua
    setTimeout(initializeGTM, 100);
  }
}
```

### 3. Fallback Mekanismi

```javascript
// Alusta GTM ilman jQuery:tä 2 sekunnin kuluttua
setTimeout(function () {
  if (typeof window.jQuery === 'undefined') {
    // Alusta GTM ilman jQuery tukea
  }
}, 2000);
```

## Yleiset Ratkaisut

### 1. Tyhjennä Cache

```bash
# Tyhjennä selaimen cache
# Tai käytä incognito/private modea
```

### 2. Tarkista Network Tab

1. Avaa Developer Tools
2. Mene Network välilehdelle
3. Lataa sivu uudelleen
4. Tarkista että jQuery ja GTM latautuvat

### 3. Tarkista Console

1. Avaa Developer Tools
2. Mene Console välilehdelle
3. Etsi virheitä tai varoituksia
4. Tarkista että GTM alustuu onnistuneesti

### 4. Testaa Eri Selaimilla

- Chrome
- Firefox
- Safari
- Edge

## GTM Konfiguraatio

### 1. jQuery Dependency

GTM containerissasi:

1. Luo Custom HTML tag
2. Lisää jQuery dependency
3. Varmista että tag odottaa jQuery:tä

### 2. Consent Mode Setup

```javascript
// GTM:ssä
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

### 3. Event Tracking

```javascript
// Consent-aware event tracking
if (hasAnalyticsConsent()) {
  gtag('event', 'custom_event', {
    event_category: 'test',
    event_label: 'jquery_test',
  });
}
```

## Performance Considerations

### 1. jQuery Koko

- jQuery 3.7.1: ~87KB (gzipped)
- Ladataan vain kerran
- Cached selaimessa

### 2. Latausaika

- jQuery: ~100-200ms
- GTM: ~200-500ms
- Kokonaislatausaika: ~300-700ms

### 3. Optimointi

- jQuery ladataan `afterInteractive` strategialla
- GTM odottaa jQuery:tä
- Fallback varmistaa toimivuuden

## Monitoring

### 1. Console Logs

```javascript
// GTM alustus
console.log('GTM initialized successfully with jQuery support');

// Fallback
console.warn('jQuery not available, initializing GTM without jQuery support');
```

### 2. Error Tracking

```javascript
try {
  // GTM initialization
} catch (error) {
  console.error('Error initializing GTM:', error);
}
```

### 3. Performance Monitoring

- Tarkista Network tab latausaikoja
- Monitoroi console virheitä
- Testaa eri laitteilla

## Yleiset Kysymykset

### Q: Miksi tarvitsen jQuery:tä GTM:lle?

A: Jotkut GTM tagit ja triggers riippuvat jQuery:stä. Ilman sitä ne eivät toimi.

### Q: Voinko käyttää uudempaa jQuery versiota?

A: Kyllä, mutta testaa ensin että se on yhteensopiva GTM:n kanssa.

### Q: Miksi GTM ei lataudu ilman jQuery:tä?

A: GTM latautuu, mutta jotkut tagit eivät toimi ilman jQuery:tä.

### Q: Voinko poistaa jQuery:n kokonaan?

A: Riippuu GTM containerin konfiguraatiosta. Testaa ensin.

---

**Tämä dokumentti auttaa ratkaisemaan yleisimmät jQuery & GTM ongelmat.**
