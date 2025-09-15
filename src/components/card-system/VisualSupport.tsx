import React, { useState, useEffect } from 'react';
import { useCardStyles, cssValue } from '@/hooks/useCardStyles';
import type { CardTemplate } from '@/lib/supabase';

interface VisualSupportProps {
  activeCard?: CardTemplate;
  visualConfig?: any;
  compact?: boolean;
  // Keep objectId for backward compatibility
  objectId?: string;
  bannerHeight?: number;
  hideText?: boolean;
}

export function VisualSupport({
  activeCard,
  visualConfig,
  compact = false,
  objectId,
  bannerHeight,
  hideText = false,
}: VisualSupportProps) {
  const styles = useCardStyles();
  const [visualImages, setVisualImages] = useState<any[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [imageLoadStarted, setImageLoadStarted] = useState(false);

  // Get the visual object from activeCard or visualConfig
  let visualObject = visualConfig || activeCard?.visual_objects;

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
        // Fetch from Supabase
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
          const count = images?.length || 0;
          console.log('✅ Progressive load complete: Loaded', count, 'images');
          if (!count && visualObject?.image_url) {
            // Fallback: use prebuilt image_url stored on the visual object itself
            setVisualImages([
              { id: visualObject.id || 'vo-image', image_url: visualObject.image_url },
            ]);
          } else {
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
  }, [visualObject?.id, activeCard?.id]);

  // Helper function to get image URL
  const getImageUrl = (image: any) => {
    // Check if visual object has pre-constructed URL
    if (visualObject?.image_url) {
      console.log('🔗 Using pre-constructed image URL from visual object:', visualObject.image_url);
      return visualObject.image_url;
    }
    
    // Check if individual image has pre-constructed URL
    if (image?.image_url) {
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
    // Pull account hash from widget data if available, otherwise env
    const accountHash = (typeof window !== 'undefined' && (window as any).__E1_WIDGET_DATA?.cloudflareAccountHash)
      || process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH;
      
    console.log('🔧 Fallback to manual URL construction:', {
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
          padding: 0,
          display: 'flex',
          alignItems: 'stretch',
          gap: 0,
          textAlign: 'left',
          position: 'relative',
          overflow: 'hidden',
          minHeight: (() => {
            const tokenH = (styles.responsive as any)?.mobile?.visualSupport?.height;
            const h = bannerHeight ? `${bannerHeight}px` : (tokenH && tokenH !== 'auto' ? tokenH : '180px');
            return h;
          })(),
        }}
      >
        {/* Image layer (actual <img> for reliability) */}
        {(() => {
          if (loadingImages) return null;
          const firstImage = visualImages[0];
          const imageUrl = firstImage ? getImageUrl(firstImage) : (visualObject?.image_url || null);
          if (!imageUrl) return null;
          return (
            <img
              src={imageUrl}
              alt={visualObject?.title || 'Visual'}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 1,
                zIndex: 0,
              }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          );
        })()}

        {/* No text in mobile banner */}
        {!hideText && null}
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
