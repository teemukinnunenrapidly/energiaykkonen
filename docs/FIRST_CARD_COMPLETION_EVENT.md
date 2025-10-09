# First Card Completion Event

Tämä dokumentti kuvaa `first_card_completed` GTM eventin, joka laukeaa kun käyttäjä merkkaa ensimmäisen kortin valmiiksi.

## Event Tiedot

### Event Name

`first_card_completed`

### Parametrit

```javascript
{
  event: 'first_card_completed',
  card_name: 'Kortin nimi',
  card_id: 'uuid',
  milestone: 'first_completion'
}
```

### Parametrien Selitykset

- **`event`**: `'first_card_completed'` - Eventin nimi
- **`card_name`**: Valmistuneen kortin nimi (title tai name)
- **`card_id`**: Valmistuneen kortin uniikki ID
- **`milestone`**: Aina `'first_completion'` - Merkitsee tämän tärkeänä virstanpylväänä

## Milloin Event Laukeaa

Event laukeaa **ensimmäisen kerran** kun:

1. ✅ Käyttäjä täyttää lomakekortin ja lähettää sen onnistuneesti
2. ✅ Käyttäjä täyttää laskentakortin ja laskenta onnistuu
3. ✅ Info-kortti merkataan valmiiksi automaattisesti
4. ✅ Mikä tahansa kortti siirtyy `complete` tilaan

Event laukeaa **vain kerran per sessio** - ensimmäisen kortin valmistumisen yhteydessä.

## Tekninen Toteutus

### 1. Event Määrittely (`src/config/gtm.ts`)

```typescript
export const gtmEvents = {
  firstCardCompleted: (cardName: string, cardId: string) =>
    gtmPush({
      event: 'first_card_completed',
      card_name: cardName,
      card_id: cardId,
      milestone: 'first_completion',
    }),
};
```

### 2. Tracking Logiikka (`src/components/card-system/CardContext.tsx`)

```typescript
const completeCard = useCallback(
  (cardId: string) => {
    setCardStates(prev => {
      const newStates = { ...prev };

      // Check if this is the first card to be completed
      const isFirstCompletion = !Object.values(prev).some(
        state => state.status === 'complete'
      );

      // Mark current card as complete
      newStates[cardId] = { ...newStates[cardId], status: 'complete' };

      // Track first card completion milestone
      if (isFirstCompletion) {
        const completedCard = cards.find(c => c.id === cardId);
        if (completedCard) {
          gtmEvents.firstCardCompleted(
            completedCard.title || completedCard.name || 'unknown_card',
            cardId
          );
        }
      }

      return newStates;
    });
  },
  [cards]
);
```

### 3. Logiikan Selitys

1. **Tarkistus ennen muutosta**: Ennen kortin merkkaamista valmiiksi, tarkistetaan onko mikään kortti jo valmiina
2. **`isFirstCompletion`**: `true` jos tämä on ensimmäinen kortti joka merkataan valmiiksi
3. **Event lähetetään**: Jos `isFirstCompletion === true`, event lähetetään GTM:ään
4. **Dynamic import**: Käytetään dynaamista importtia välttämään circular dependencies

## Käyttötapaukset GTM:ssä

### 1. Conversion Tracking

Seuraa kuinka monta käyttäjää saavuttaa tämän tärkeän virstanpylvään:

```javascript
// GTM Trigger: Custom Event
// Event name: first_card_completed

// Tag: Google Analytics 4 Event
// Event Name: first_card_completed
// Event Parameters:
//   - card_name: {{dlv - card_name}}
//   - card_id: {{dlv - card_id}}
```

### 2. Funnel Analysis

Vertaa kuinka monta käyttäjää:

- Aloittaa sivulla (`pageview`)
- Valmistaa ensimmäisen kortin (`first_card_completed`)
- Lähettää lopullisen lomakkeen (`form_submit`)

```
Funnel:
1. Page View: 1000 käyttäjää (100%)
2. First Card Completed: 400 käyttäjää (40%)
3. Form Submit: 200 käyttäjää (20%)
```

### 3. Time to First Completion

Mittaa kuinka kauan kestää ennen ensimmäisen kortin valmistumista:

```javascript
// GTM Custom HTML Tag
<script>
  var startTime = sessionStorage.getItem('session_start');
  if (!startTime) {
    startTime = Date.now();
    sessionStorage.setItem('session_start', startTime);
  }

  var completionTime = Date.now();
  var timeToCompletion = (completionTime - startTime) / 1000; // sekunteina

  dataLayer.push({
    event: 'time_to_first_completion',
    time_seconds: timeToCompletion
  });
</script>
```

### 4. Remarketing Audience

Luo remarketing yleisö käyttäjistä jotka ovat valmistaneet ensimmäisen kortin:

```
Audience Name: "Engaged Users - First Card Completed"
Condition: Event name equals "first_card_completed"
Membership Duration: 30 days
```

## Testaus

### Test-sivu

Mene: `http://localhost:3000/test-gtm`

Klikkaa: **"Lähetä test events"**

Konsoli näyttää:

```javascript
{
  event: 'first_card_completed',
  card_name: 'test_card',
  card_id: 'test_card_id_123',
  milestone: 'first_completion'
}
```

### Developer Console

```javascript
// Kuuntele eventejä
window.dataLayer = window.dataLayer || [];
const originalPush = window.dataLayer.push;
window.dataLayer.push = function (...args) {
  if (args[0]?.event === 'first_card_completed') {
    console.log('🎉 First Card Completed!', args[0]);
  }
  return originalPush.apply(this, args);
};
```

### GTM Preview Mode

1. Avaa GTM Preview Mode
2. Täytä ja lähetä ensimmäinen kortti
3. Näet `first_card_completed` eventin GTM debuggerissa

## Hyödyt

✅ **Engagement Tracking** - Mittaa todellista käyttäjien sitoutumista  
✅ **Conversion Funnel** - Ymmärrä missä käyttäjät putoavat pois  
✅ **Time Metrics** - Mittaa kuinka nopeasti käyttäjät edistyvät  
✅ **Remarketing** - Kohdenna mainoksia aktiivisille käyttäjille  
✅ **A/B Testing** - Testaa eri korttien vaikutusta valmistumisprosenttiin

## Liittyvät Eventit

- `form_start` - Lomakkeen lähetys aloitettu
- `form_submit` - Lomake lähetetty onnistuneesti
- `calculation_complete` - Laskenta valmis
- `first_card_completed` - **Ensimmäinen kortti valmis** ⭐

## Kehitysideoita

Voit lisätä vastaavia milestone eventejä:

```typescript
// Puolet korteista valmiina
halfCardsCompleted: () =>
  gtmPush({
    event: 'half_cards_completed',
    milestone: 'halfway',
    cards_completed: cardsCompleted.length,
    total_cards: totalCards.length,
  });

// Kaikki kortit valmiina
allCardsCompleted: () =>
  gtmPush({
    event: 'all_cards_completed',
    milestone: 'all_complete',
    total_time: totalTimeSeconds,
  });
```

---

**Tämä event auttaa sinua ymmärtämään käyttäjien sitoutumista ja parantamaan konversioprosenttia!** 📊
