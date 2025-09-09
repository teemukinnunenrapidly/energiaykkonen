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

  // Get the visual object from activeCard or visualConfig
  const visualObject = visualConfig || activeCard?.visual_objects;

  // Debug logging
  console.log('🖼️ VisualSupport render:', {
    activeCardId: activeCard?.id,
    activeCardName: activeCard?.name,
    hasVisualObjects: !!activeCard?.visual_objects,
    visualObjectId: visualObject?.id,
    visualObjectTitle: visualObject?.title,
    visualConfigPassed: !!visualConfig,
    widgetMode,
    compact,
  });

  // Progressive loading: Only fetch images when card becomes active
  useEffect(() => {
    const fetchVisualImages = async () => {
      // Only fetch if we have a visual object and haven't started loading yet
      if (!visualObject?.id || imageLoadStarted) {
        if (!visualObject?.id) {
          setVisualImages([]);
          setImageLoadStarted(false);
        }
        return;
      }

      setLoadingImages(true);
      setImageLoadStarted(true);
      
      try {
        if (widgetMode) {
          // In widget mode, the visualObject is already resolved and contains images
          if (visualObject?.images) {
            console.log('✅ Widget mode: Using pre-resolved images:', {
              visualObjectId: visualObject.id,
              imageCount: visualObject.images.length,
              firstImage: visualObject.images[0]?.cloudflare_image_id,
            });
            setVisualImages(visualObject.images);
          } else {
            console.log('⚠️ Widget mode: No images in visual object:', {
              visualObjectId: visualObject?.id,
              hasImages: !!visualObject?.images,
            });
            setVisualImages([]);
          }
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

    // Only fetch when activeCard changes and has visual objects
    if (activeCard && visualObject?.id) {
      fetchVisualImages();
    }
  }, [visualObject?.id, activeCard?.id, imageLoadStarted, widgetMode]);

  // Helper function to generate Cloudflare image URL
  const getCloudflareImageUrl = (
    cloudflareImageId: string,
    variant: string = 'public'
  ) => {
    // Check for Cloudflare hash from multiple sources (for standalone widget compatibility)
    // In widget mode, the hash is stored in window.__E1_CLOUDFLARE_HASH
    // In normal mode, it comes from process.env
    const accountHash = 
      (typeof window !== 'undefined' && (window as any).__E1_CLOUDFLARE_HASH) ||
      process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ||
      null;
      
    console.log('🔧 Cloudflare config:', {
      accountHash: accountHash
        ? `${accountHash.substring(0, 8)}...`
        : 'MISSING',
      cloudflareImageId,
      variant,
    });

    if (!accountHash) {
      console.error('❌ Missing NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH or __E1_CLOUDFLARE_HASH');
      return null;
    }
    const url = `https://imagedelivery.net/${accountHash}/${cloudflareImageId}/${variant}`;
    console.log('🔗 Generated image URL:', url);
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
            const imageUrl = getCloudflareImageUrl(
              visualImages[0].cloudflare_image_id
            );
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

  // Desktop-versio - täysi paneeli
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Gradient content area */}
      <div
        style={{
          background: styles.visualSupport.content.background,
          padding:
            content.hasImages && visualImages.length > 0
              ? '0'
              : styles.visualSupport.content.padding, // No padding when image fills
          display: styles.visualSupport.content.display,
          flexDirection: cssValue(styles.visualSupport.content.flexDirection),
          alignItems: styles.visualSupport.content.alignItems,
          justifyContent: styles.visualSupport.content.justifyContent,
          flex: styles.visualSupport.content.flex,
          position: 'relative', // Enable absolute positioning for full-screen image
          overflow: 'hidden', // Clip image to container bounds
        }}
      >
        {/* Visual Content */}
        {loadingImages ? (
          <div style={{ textAlign: 'center', color: '#ffffff' }}>
            Loading visual content...
          </div>
        ) : content.hasImages && visualImages.length > 0 ? (
          /* Display actual visual object images - fill entire panel */
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {visualImages.map((image, index) => {
              const imageUrl = getCloudflareImageUrl(image.cloudflare_image_id);
              return imageUrl ? (
                <img
                  key={image.id}
                  src={imageUrl}
                  alt={content.title || 'Visual content'}
                  loading="lazy" // Enable browser lazy loading
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: cssValue(styles.visualSupport.image.objectFit),
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
        ) : (
          /* Fallback content when no images */
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '64px',
                marginBottom: '16px',
                opacity: '0.8',
              }}
            >
              📋
            </div>

            {content.title && (
              <h2
                style={{
                  fontSize: styles.visualSupport.title.fontSize,
                  fontWeight: styles.visualSupport.title.fontWeight,
                  color: styles.visualSupport.title.color,
                  marginBottom: styles.visualSupport.title.marginBottom,
                  textAlign: cssValue(styles.visualSupport.title.textAlign),
                  letterSpacing: styles.visualSupport.title.letterSpacing,
                }}
              >
                {content.title}
              </h2>
            )}

            <p
              style={{
                fontSize: styles.visualSupport.subtitle.fontSize,
                fontWeight: styles.visualSupport.subtitle.fontWeight,
                color: styles.visualSupport.subtitle.color,
                textAlign: cssValue(styles.visualSupport.subtitle.textAlign),
                lineHeight: styles.visualSupport.subtitle.lineHeight,
              }}
            >
              {content.description || 'No visual content available'}
            </p>
          </div>
        )}
      </div>

      {/* Info section bottom */}
      <div
        style={{
          background: styles.visualSupport.infoSection.background,
          padding: styles.visualSupport.infoSection.padding,
          borderTop: styles.visualSupport.infoSection.borderTop,
        }}
      >
        <div
          style={{
            marginTop: styles.visualSupport.infoSection.tip.marginTop,
            padding: styles.visualSupport.infoSection.tip.padding,
            background: styles.visualSupport.infoSection.tip.background,
            borderLeft: styles.visualSupport.infoSection.tip.borderLeft,
            borderRadius: styles.visualSupport.infoSection.tip.borderRadius,
            fontSize: styles.visualSupport.infoSection.tip.fontSize,
            color: styles.visualSupport.infoSection.tip.color,
            display: styles.visualSupport.infoSection.tip.display,
          }}
        >
          💡{' '}
          {visualObject && content.title
            ? `${content.title}${content.description ? ` - ${content.description}` : ''}`
            : activeCard
              ? `Vinkki: ${activeCard.name} - Täytä kentät huolellisesti`
              : 'Vinkki: Täytä kentät huolellisesti parhaan arvion saamiseksi'}
        </div>
      </div>
    </div>
  );
}
