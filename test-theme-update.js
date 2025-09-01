// Test script to verify visual support functionality
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xfqmllsvdxejloecwlaq.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmcW1sbHN2ZHhlamxvZWN3bGFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNTE1NjAsImV4cCI6MjA3MTYyNzU2MH0.ZE4YOoVjqs4fGQs4gA3CJoQ4nEzfRqK4K2MO_bERGvM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testImageLoading() {
  console.log('🧪 Testing image loading functionality...');

  // Test 1: Verify cards are being loaded with visual objects
  console.log('\n1. Loading cards...');
  const { data: cards, error: cardsError } = await supabase
    .from('card_templates')
    .select('id, name, config')
    .eq('is_active', true)
    .order('display_order');

  if (cardsError) {
    console.error('❌ Error loading cards:', cardsError);
    return;
  }

  console.log(`✅ Loaded ${cards?.length || 0} cards`);

  // Test 2: Process cards with visual objects (like getCardsDirect does)
  console.log('\n2. Processing cards with visual objects...');
  const cardsWithVisualObjects = await Promise.all(
    cards?.map(async card => {
      const linkedVisualObjectId = card.config?.linked_visual_object_id;
      if (linkedVisualObjectId) {
        const { data: visualObject, error: visualError } = await supabase
          .from('visual_objects')
          .select('*')
          .eq('id', linkedVisualObjectId)
          .single();

        if (!visualError && visualObject) {
          console.log(
            `  ✅ Card "${card.name}" linked to visual object "${visualObject.title}"`
          );
          return {
            ...card,
            visual_objects: visualObject,
          };
        } else {
          console.log(
            `  ⚠️ Card "${card.name}" has invalid visual object link`
          );
        }
      } else {
        console.log(`  ⚪ Card "${card.name}" has no visual object`);
      }
      return card;
    }) || []
  );

  const cardsWithVisuals = cardsWithVisualObjects.filter(c => c.visual_objects);
  console.log(
    `✅ Found ${cardsWithVisuals.length} cards with valid visual objects`
  );

  // Test 3: Test image loading for visual objects
  console.log('\n3. Testing image loading...');
  for (const card of cardsWithVisuals) {
    if (card.visual_objects) {
      console.log(`  🔍 Loading images for "${card.visual_objects.title}"...`);
      const { data: images, error: imagesError } = await supabase
        .from('visual_object_images')
        .select('*')
        .eq('visual_object_id', card.visual_objects.id)
        .order('display_order');

      if (imagesError) {
        console.error(`  ❌ Error loading images:`, imagesError);
      } else {
        console.log(`  ✅ Found ${images?.length || 0} images`);
        images?.forEach(img => {
          const url = `https://imagedelivery.net/AkEHl6uYQM8NNRufIXHzFw/${img.cloudflare_image_id}/public`;
          console.log(`    - Image: ${url}`);
        });
      }
    }
  }

  // Test 4: Verify the first card with visual objects should be auto-selected
  console.log('\n4. Auto-selection test...');
  const firstCardWithVisual = cardsWithVisuals[0];
  if (firstCardWithVisual) {
    console.log(
      `✅ First card with visual objects: "${firstCardWithVisual.name}" (ID: ${firstCardWithVisual.id})`
    );
    console.log(
      `  - Visual object: "${firstCardWithVisual.visual_objects.title}"`
    );
    console.log('  - This should be auto-selected in the UI');
  } else {
    console.log('❌ No cards with visual objects found for auto-selection');
  }
}

testImageLoading().catch(console.error);
