# GTM Event Reference - Calculator Events

Kaikki E1 Calculator sovelluksen GTM eventit käyttävät `calc_` prefixiä.

## 📋 **Kaikki Eventit**

| Event Name                  | Kuvaus                           | Prioriteetti |
| --------------------------- | -------------------------------- | ------------ |
| `calc_first_card_completed` | Ensimmäinen kortti valmis        | ⭐⭐⭐⭐⭐   |
| `calc_form_submit`          | Liidi kerätty (lomake lähetetty) | ⭐⭐⭐⭐⭐   |
| `calc_form_start`           | Lomakkeen lähetys aloitettu      | ⭐⭐⭐       |
| `calc_calculation_complete` | Laskenta valmis                  | ⭐⭐⭐       |
| `calc_calculation_start`    | Laskenta aloitettu               | ⭐⭐         |
| `calc_pdf_generated`        | PDF luotu                        | ⭐⭐         |
| `calc_email_sent`           | Sähköposti lähetetty             | ⭐⭐         |
| `calc_error_occurred`       | Virhe tapahtui                   | ⭐           |

---

## 🎯 **Tärkeimmät Eventit**

### **1. calc_first_card_completed** ⭐⭐⭐⭐⭐

**Milloin:** Ensimmäinen kortti merkattu valmiiksi

**Parametrit:**

```javascript
{
  event: 'calc_first_card_completed',
  card_name: 'Kortin nimi',
  card_id: 'uuid',
  milestone: 'first_completion'
}
```

**GTM Trigger:**

```
Trigger Type: Custom Event
Event name: calc_first_card_completed
```

**Käyttö:**

- Engagement tracking
- Funnel analysis
- Remarketing audience

---

### **2. calc_form_submit** ⭐⭐⭐⭐⭐

**Milloin:** Lomake lähetetty onnistuneesti (liidi kerätty)

**Parametrit:**

```javascript
{
  event: 'calc_form_submit',
  form_name: 'Lomakkeen nimi',
  form_data: { /* data */ }
}
```

**GTM Trigger:**

```
Trigger Type: Custom Event
Event name: calc_form_submit
```

**Käyttö:**

- Lead conversion tracking
- Google Ads conversions
- Facebook Lead events
- CRM integration

---

## 📊 **Muut Eventit**

### **3. calc_form_start**

**Milloin:** Käyttäjä klikkaa "Lähetä" painiketta (ennen validointia)

**Parametrit:**

```javascript
{
  event: 'calc_form_start',
  form_name: 'Lomakkeen nimi'
}
```

**Käyttö:**

- Mittaa lähetysyrityksiä vs onnistuneita lähetyksiä
- Success rate = form_submit / form_start

---

### **4. calc_calculation_complete**

**Milloin:** Laskenta valmis onnistuneesti

**Parametrit:**

```javascript
{
  event: 'calc_calculation_complete',
  card_name: 'Kortin nimi',
  calculation_result: {
    result: '1000',
    unit: 'kWh'
  }
}
```

**Käyttö:**

- Seuraa laskentojen määrää
- Analysoi tuloksia

---

### **5. calc_calculation_start**

**Milloin:** Laskenta alkaa

**Parametrit:**

```javascript
{
  event: 'calc_calculation_start',
  card_name: 'Kortin nimi'
}
```

**Käyttö:**

- Mittaa kuinka monta laskentaa aloitetaan
- Success rate = calc_complete / calc_start

---

### **6. calc_pdf_generated**

**Milloin:** PDF luotu liidille

**Parametrit:**

```javascript
{
  event: 'calc_pdf_generated',
  card_name: 'Kortin nimi',
  lead_id: 'lead_123'
}
```

**Käyttö:**

- Seuraa PDF generointeja
- Analysoi mitä kortteja PDF:tään

---

### **7. calc_email_sent**

**Milloin:** Sähköposti lähetetty

**Parametrit:**

```javascript
{
  event: 'calc_email_sent',
  email_type: 'calculation_results',
  lead_id: 'lead_123'
}
```

**Käyttö:**

- Seuraa sähköpostin lähetyksiä
- Email delivery rate

---

### **8. calc_error_occurred**

**Milloin:** Virhe tapahtuu

**Parametrit:**

```javascript
{
  event: 'calc_error_occurred',
  error_type: 'validation_error',
  error_message: 'Error message'
}
```

**Käyttö:**

- Error tracking
- Debugging
- UX improvements

---

## 🎯 **GTM Setup - Quick Start**

### **Triggers**

Luo nämä triggerit GTM:ssä:

```
1. CE - First Card Completed
   Event: calc_first_card_completed

2. CE - Form Submit (Lead)
   Event: calc_form_submit

3. CE - Form Start
   Event: calc_form_start

4. CE - Calculation Complete
   Event: calc_calculation_complete
```

### **Variables**

Luo nämä dataLayer muuttujat:

```
1. DLV - Card Name
   Variable: card_name

2. DLV - Form Name
   Variable: form_name

3. DLV - Lead ID
   Variable: lead_id

4. DLV - Milestone
   Variable: milestone
```

### **Tags (Esimerkki - GA4)**

```javascript
// Tag 1: First Card Completed
Tag Type: GA4 Event
Event Name: first_card_completed
Parameters:
  - card_name: {{DLV - Card Name}}
  - milestone: {{DLV - Milestone}}
Trigger: CE - First Card Completed

// Tag 2: Lead Generated
Tag Type: GA4 Event
Event Name: generate_lead
Parameters:
  - form_name: {{DLV - Form Name}}
Trigger: CE - Form Submit
```

---

## 📈 **Conversion Tracking**

### **Google Ads**

```javascript
// Lead Conversion
Tag Type: Google Ads Conversion
Conversion ID: AW-XXXXXXXXX
Conversion Label: LEAD_LABEL
Trigger: CE - Form Submit

// Engagement Conversion
Tag Type: Google Ads Conversion
Conversion ID: AW-XXXXXXXXX
Conversion Label: ENGAGEMENT_LABEL
Trigger: CE - First Card Completed
```

### **Facebook Pixel**

```javascript
// Lead Event
fbq('track', 'Lead', {
  content_name: {{DLV - Form Name}}
});
Trigger: CE - Form Submit

// Custom Event
fbq('trackCustom', 'FirstCardCompleted', {
  card_name: {{DLV - Card Name}}
});
Trigger: CE - First Card Completed
```

---

## 🧪 **Testaus**

### **Test-sivu**

```
URL: http://localhost:3000/test-gtm
Painike: "Lähetä test events"
```

### **GTM Preview Mode**

```
1. GTM → Preview
2. URL: http://localhost:3000
3. Täytä ensimmäinen kortti
4. Lähetä lomake
5. Näet kaikki eventit debuggerissa
```

### **Developer Console**

```javascript
// Kuuntele calc_ eventejä
window.dataLayer.push = new Proxy(window.dataLayer.push, {
  apply: function (target, thisArg, args) {
    if (args[0]?.event?.startsWith('calc_')) {
      console.log('🎯 Calculator Event:', args[0]);
    }
    return target.apply(thisArg, args);
  },
});
```

---

## 💡 **Best Practices**

### **Event Naming**

✅ **Käytä `calc_` prefixiä** - Erottaa calculator eventit muista  
✅ **Snake_case** - Yhtenäinen nimeämiskäytäntö  
✅ **Selkeät nimet** - Kuvaa mitä event tekee

### **Trigger Setup**

✅ **Custom Event triggerit** - Käytä näitä aina  
✅ **Descriptive nimet** - "CE - Form Submit" parempi kuin "Trigger 1"  
✅ **Grouping** - Järjestä foldereihin GTM:ssä

### **Testing**

✅ **GTM Preview** - Käytä aina ennen publishaamista  
✅ **Test-sivu** - Testaa kaikki eventit  
✅ **Console logging** - Debuggaa eventejä

---

## 📚 **Lisädokumentaatio**

- `docs/GTM_INTEGRATION.md` - GTM perusintegraatio
- `docs/COOKIE_CONSENT_GUIDE.md` - Cookie consent & Consent Mode
- `docs/FIRST_CARD_COMPLETION_EVENT.md` - First card event yksityiskohdat
- `src/config/gtm.ts` - Event määritelmät koodissa

---

**Kaikki eventit alkavat `calc_` prefixillä - helppo tunnistaa GTM:ssä!** 🎯
