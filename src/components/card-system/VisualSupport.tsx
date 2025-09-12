import React, { useState, useEffect } from 'react';
import { useCardStyles, cssValue } from '@/hooks/useCardStyles';
import type { CardTemplate } from '@/lib/supabase';

interface VisualSupportProps {
  activeCard?: CardTemplate;
  visualConfig?: any;
  compact?: boolean;
  // Keep objectId for backward compatibility
  objectId?: string;
  widgetMode?: boolean;
}

export function VisualSupport({
  activeCard,
  visualConfig,
  compact = false,
  objectId,
  widgetMode = false,
}: VisualSupportProps) {
  const styles = useCardStyles();
  const [visualImages, setVisualImages] = useState<any[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [imageLoadStarted, setImageLoadStarted] = useState(false);

  // Get the visual object from activeCard or visualConfig. In widget mode,
  // also resolve by linked_visual_object_id from global widget data.
  let visualObject = visualConfig || activeCard?.visual_objects;
  if (!visualObject && widgetMode && activeCard?.config?.linked_visual_object_id) {
    const widgetData = (typeof window !== 'undefined' && (window as any).__E1_WIDGET_DATA) || {};
    const vo = widgetData.visualObjects?.[activeCard.config.linked_visual_object_id];
    if (vo) visualObject = vo;
  }

  // Debug logging
  console.log('🖼️ VisualSupport render:', {
    activeCardId: activeCard?.id,
    activeCardName: activeCard?.name,
    hasVisualObjects: !!activeCard?.visual_objects,
    hasLinkedVisualObjectId: !!activeCard?.config?.linked_visual_object_id,
    linkedVisualObjectId: activeCard?.config?.linked_visual_object_id,
    visualObjectId: visualObject?.id,
    visualObjectTitle: visualObject?.title,
    visualConfigPassed: !!visualConfig,
    widgetMode,
    compact,
  });

  // Progressive loading: Only fetch images when card becomes active
  useEffect(() => {
    const fetchVisualImages = async () => {
      // Only fetch if we have a visual object
      if (!visualObject?.id) {
        setVisualImages([]);
        setImageLoadStarted(false);
        return;
      }

      setLoadingImages(true);
      setImageLoadStarted(true);
      
      try {
        if (widgetMode) {
          // In widget mode, try both possible field names for images
          const images = visualObject?.images || 
                        visualObject?.visual_object_images || 
                        [];
          
          console.log('✅ Widget mode: Checking images:', {
            visualObjectId: visualObject?.id,
            hasImages: images.length > 0,
            imageCount: images.length,
            firstImage: images[0]?.cloudflare_image_id,
            visualObjectStructure: {
              hasImagesField: !!visualObject?.images,
              hasVisualObjectImagesField: !!visualObject?.visual_object_images,
            }
          });
          
          setVisualImages(images);
        } else {
          // Normal mode: fetch from Supabase
          console.log('🎯 Progressive loading: Fetching images for visual object:', visualObject.id);
          const { supabase } = await import('@/lib/supabase');
          const { data: images, error } = await supabase
            .from('visual_object_images')
            .select('*')
            .eq('visual_object_id', visualObject.id)
            .order('display_order');

          if (error) {
            console.error('❌ Error fetching visual images:', error);
            setVisualImages([]);
          } else {
            console.log('✅ Progressive load complete: Loaded', images?.length || 0, 'images');
            setVisualImages(images || []);
          }
        }
      } catch (error) {
        console.error('❌ Error fetching visual images:', error);
        setVisualImages([]);
      } finally {
        setLoadingImages(false);
      }
    };

    // Fetch when activeCard changes and has visual objects
    fetchVisualImages();
  }, [visualObject?.id, activeCard?.id, widgetMode]);

  // Helper function to get image URL - prioritize pre-constructed URLs in widget mode
  const getImageUrl = (image: any) => {
    // In widget mode, visual objects should already have pre-constructed image_url
    if (widgetMode && visualObject?.image_url) {
      console.log('🔗 Using pre-constructed image URL from visual object:', visualObject.image_url);
      return visualObject.image_url;
    }
    
    // For individual images in widget mode, check if they have a pre-constructed URL
    if (widgetMode && image?.image_url) {
      console.log('🔗 Using pre-constructed image URL from image object:', image.image_url);
      return image.image_url;
    }

    // Fallback to manual URL construction
    const cloudflareImageId = image?.cloudflare_image_id || image?.cloudflareImageId;
    const variant = image?.variant || image?.image_variant || 'public';
    
    if (!cloudflareImageId) {
      console.error('❌ No Cloudflare image ID found:', image);
      return null;
    }
    
    // Get account hash from environment or widget data
    const accountHash = widgetMode
      ? (typeof window !== 'undefined' && (window as any).__E1_WIDGET_DATA?.cloudflareAccountHash)
      : process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH;
      
    console.log('🔧 Fallback to manual URL construction:', {
      widgetMode,
      accountHash: accountHash ? `${accountHash.substring(0, 8)}...` : 'MISSING',
      cloudflareImageId,
      variant
    });

    if (!accountHash) {
      console.error('❌ Missing Cloudflare account hash for manual construction');
      return null;
    }
    
    const url = `https://imagedelivery.net/${accountHash}/${cloudflareImageId}/${variant}`;
    console.log('🔗 Manually constructed image URL:', url);
    return url;
  };

  // Determine content based on visual object
  const getVisualContent = () => {
    if (visualObject) {
      return {
        title: visualObject.title,
        description: visualObject.description,
        hasImages: visualImages.length > 0,
      };
    }

    // Fallback to card data if no visual object
    if (activeCard) {
      return {
        title: activeCard.name,
        description: activeCard.config?.description,
        hasImages: false,
      };
    }

    // No content available
    return {
      title: null,
      description: null,
      hasImages: false,
    };
  };

  const content = getVisualContent();

  if (compact) {
    // Mobile version - compact banner with optional image
    return (
      <div
        style={{
          background: styles.visualSupport.content.background,
          padding: styles.visualSupport.content.padding,
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          textAlign: 'left',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background image on mobile if available */}
        {content.hasImages &&
          visualImages.length > 0 &&
          !loadingImages &&
          (() => {
            const imageUrl = getImageUrl(visualImages[0]);
            return imageUrl ? (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundImage: activeCard ? `url(${imageUrl})` : 'none', // Only load when card is active
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: 0.3, // Semi-transparent background
                  zIndex: 0,
                }}
              />
            ) : null;
          })()}

        {/* Text content */}
        <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
          {content.title && (
            <h2
              style={{
                fontSize: '18px', // Smaller for mobile
                fontWeight: styles.visualSupport.title.fontWeight,
                color: styles.visualSupport.title.color,
                marginBottom: '4px',
                letterSpacing: styles.visualSupport.title.letterSpacing,
              }}
            >
              {content.title}
            </h2>
          )}
          {content.description && (
            <p
              style={{
                fontSize: '14px', // Smaller for mobile
                fontWeight: styles.visualSupport.subtitle.fontWeight,
                color: styles.visualSupport.subtitle.color,
                lineHeight: styles.visualSupport.subtitle.lineHeight,
                margin: 0,
              }}
            >
              {content.description}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Desktop version - image-only (remove text/info sections)
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Image area only */}
      <div
        style={{
          background: styles.visualSupport.content.background,
          padding: 0,
          display: 'flex',
          alignItems: 'stretch',
          justifyContent: 'center',
          flex: '1',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Visual Content - image only */}
        {loadingImages ? null : content.hasImages && visualImages.length > 0 ? (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'stretch',
              justifyContent: 'center',
            }}
          >
            {visualImages.map((image, index) => {
              const imageUrl = getImageUrl(image);
              console.log(`🖼️ Rendering image ${index + 1}:`, {
                imageId: image.id,
                cloudflareId: image.cloudflare_image_id || image.cloudflareImageId,
                generatedUrl: imageUrl,
                imageObject: image
              });
              return imageUrl ? (
                <img
                  key={image.id}
                  src={imageUrl}
                  alt={content.title || 'Visual content'}
                  loading="lazy" // Enable browser lazy loading
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: styles.visualSupport.image.borderRadius,
                  }}
                  onLoad={() => {
                    console.log('✅ Image loaded successfully:', imageUrl);
                  }}
                  onError={e => {
                    console.error('❌ Failed to load image:', imageUrl);
                    console.error('❌ Image error details:', e);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : null;
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
