import React, { useState, useEffect } from 'react';
import { useCardStyles } from '@/hooks/useCardStyles';
import { useCardContext } from './CardContext';
import type { CardTemplate } from '@/lib/supabase';

interface VisualSupportProps {
  activeCard?: CardTemplate;
  visualConfig?: any;
  compact?: boolean;
  bannerHeight?: number;
  hideText?: boolean;
}

export function VisualSupport({
  activeCard,
  visualConfig,
  compact = false,
  bannerHeight,
  hideText = false,
}: VisualSupportProps) {
  const styles = useCardStyles();
  const { sessionId } = useCardContext();
  const [visualImages, setVisualImages] = useState<any[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [latestPdfUrl, setLatestPdfUrl] = useState<string | null>(null);

  // Get the visual object from activeCard or visualConfig
  const visualObject = visualConfig || activeCard?.visual_objects;

  // Progressive loading: Only fetch images when card becomes active
  useEffect(() => {
    const fetchVisualImages = async () => {
      // Only fetch if we have a visual object
      if (!visualObject?.id) {
        setVisualImages([]);
        return;
      }

      setLoadingImages(true);

      try {
        // Fetch from Supabase
        const { supabase } = await import('@/lib/supabase');
        const { data: images, error } = await supabase
          .from('visual_object_images')
          .select('*')
          .eq('visual_object_id', visualObject.id)
          .order('display_order');

        if (error) {
          setVisualImages([]);
        } else {
          const count = images?.length || 0;
          if (!count && visualObject?.image_url) {
            // Fallback: use prebuilt image_url stored on the visual object itself
            setVisualImages([
              {
                id: visualObject.id || 'vo-image',
                image_url: visualObject.image_url,
              },
            ]);
          } else {
            setVisualImages(images || []);
          }
        }
      } catch {
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
      return visualObject.image_url;
    }

    // Check if individual image has pre-constructed URL
    if (image?.image_url) {
      return image.image_url;
    }

    // Fallback to manual URL construction
    const cloudflareImageId =
      image?.cloudflare_image_id || image?.cloudflareImageId;
    const variant = image?.variant || image?.image_variant || 'public';

    if (!cloudflareImageId) {
      return null;
    }

    // Get account hash from environment
    const accountHash = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH;

    if (!accountHash) {
      return null;
    }

    const url = `https://imagedelivery.net/${accountHash}/${cloudflareImageId}/${variant}`;
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
  // Heuristic: show PDF preview on the final download card
  const isPdfPreviewCard =
    (activeCard?.name && activeCard.name === 'new_card_11') ||
    (activeCard?.title &&
      /Lataa\s+säästölaskelma/i.test(activeCard.title || ''));

  // Fetch latest PDF URL for this session to show real preview (blurred)
  useEffect(() => {
    const fetchLatestPdf = async () => {
      if (!isPdfPreviewCard || !sessionId) {
        setLatestPdfUrl(null);
        return;
      }
      try {
        const { supabase } = await import('@/lib/supabase');
        // Find the latest lead for this session (order by created_at desc)
        const { data } = await supabase
          .from('leads')
          .select('id, created_at, pdf_url, form_data')
          .eq('form_data->>session_id', sessionId)
          .order('created_at', { ascending: false })
          .limit(1);

        const lead = (data && data[0]) || null;
        const url =
          (lead as any)?.pdf_url || (lead as any)?.form_data?.pdf_url || null;
        setLatestPdfUrl(url);
      } catch {
        setLatestPdfUrl(null);
      }
    };

    fetchLatestPdf();
  }, [isPdfPreviewCard, sessionId]);

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
            const tokenH = (styles.responsive as any)?.mobile?.visualSupport
              ?.height;
            const h = bannerHeight
              ? `${bannerHeight}px`
              : tokenH && tokenH !== 'auto'
                ? tokenH
                : '180px';
            return h;
          })(),
        }}
      >
        {/* Image/PDF layer */}
        {isPdfPreviewCard ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background:
                (styles.visualSupport.content.background as any) ||
                'linear-gradient(135deg,#10b981,#34d399)',
            }}
          >
            {/* If we have a real PDF URL, show a blurred iframe preview; else mock */}
            {latestPdfUrl ? (
              <iframe
                src={`${latestPdfUrl}#view=FitH&toolbar=0&navpanes=0`}
                title="PDF preview"
                style={{
                  width: '92%',
                  height: '92%',
                  border: 'none',
                  borderRadius: 10,
                  boxShadow: '0 20px 60px rgba(0,0,0,.25)',
                  filter: 'blur(6px)',
                  background: '#ffffff',
                }}
              />
            ) : (
              <div
                aria-label="PDF preview (blurred)"
                style={{
                  width: '86%',
                  height: '86%',
                  background: '#ffffff',
                  borderRadius: 8,
                  boxShadow: '0 20px 60px rgba(0,0,0,.25)',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div style={{ height: 36, background: '#f1f5f9' }} />
                <div style={{ padding: 16, filter: 'blur(6px)' }}>
                  <div
                    style={{
                      height: 18,
                      width: '60%',
                      background: '#e5e7eb',
                      borderRadius: 4,
                      marginBottom: 12,
                    }}
                  />
                  <div
                    style={{
                      height: 12,
                      width: '90%',
                      background: '#eef2f7',
                      borderRadius: 4,
                      marginBottom: 8,
                    }}
                  />
                  <div
                    style={{
                      height: 12,
                      width: '85%',
                      background: '#eef2f7',
                      borderRadius: 4,
                      marginBottom: 8,
                    }}
                  />
                  <div
                    style={{
                      height: 160,
                      background: '#f9fafb',
                      borderRadius: 6,
                      marginTop: 8,
                    }}
                  />
                </div>
                <div
                  style={{
                    position: 'absolute',
                    left: 12,
                    bottom: 12,
                    color: '#ffffff',
                    background: 'rgba(0,0,0,.35)',
                    padding: '6px 10px',
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                >
                  PDF-esikatselu (sumennettu)
                </div>
              </div>
            )}
          </div>
        ) : (
          (() => {
            if (loadingImages) {
              return null;
            }
            const firstImage = visualImages[0];
            const imageUrl = firstImage
              ? getImageUrl(firstImage)
              : visualObject?.image_url || null;
            if (!imageUrl) {
              return null;
            }
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
                  borderTopLeftRadius: styles.card.base.borderRadius,
                  borderTopRightRadius: styles.card.base.borderRadius,
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                }}
                onError={e => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            );
          })()
        )}

        {/* Mobile overlay: button to toggle slide-up panel */}
        {(() => {
          const overlay = (styles.visualSupport as any)?.image?.overlay || {};
          const mobile = overlay.mobile || {};
          const hasText = !hideText && (content.title || content.description);
          const overlayEnabled = (visualObject as any)?.show_overlay === true;
          if (!hasText || !overlayEnabled) {
            return null;
          }
          return (
            <>
              {/* Toggle button (hidden while panel is open to avoid covering text) */}
              {!mobilePanelOpen && (
                <button
                  aria-label={
                    (styles.accessibility as any)?.ariaLabels?.toggleButton ||
                    'Näytä lisätiedot'
                  }
                  onClick={() => setMobilePanelOpen(true)}
                  style={{
                    display: mobile.button?.display || 'block',
                    position: 'absolute',
                    bottom: '24px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background:
                      mobile.button?.background || 'rgba(255, 255, 255, 0.1)',
                    backdropFilter:
                      mobile.button?.backdropFilter || 'blur(12px)',
                    WebkitBackdropFilter:
                      mobile.button?.backdropFilter || 'blur(12px)',
                    border:
                      mobile.button?.border ||
                      '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: mobile.button?.borderRadius || '100px',
                    padding: mobile.button?.padding || '14px 28px',
                    cursor: 'pointer',
                    transition:
                      (styles.animations as any)?.transitions?.fast ||
                      'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                    zIndex: 10,
                    color: mobile.button?.color || '#ffffff',
                    fontSize: mobile.button?.fontSize || '14px',
                    fontWeight: mobile.button?.fontWeight || '500',
                    letterSpacing: mobile.button?.letterSpacing || '0.5px',
                  }}
                >
                  Lisätiedot
                </button>
              )}
              {/* Slide-up panel */}
              <div
                role="dialog"
                aria-modal="true"
                aria-label={
                  (styles.accessibility as any)?.ariaLabels?.closePanel ||
                  'Lisätiedot'
                }
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: mobile.panel?.background || '#0d9530bd',
                  backdropFilter: mobile.panel?.backdropFilter || 'blur(20px)',
                  WebkitBackdropFilter:
                    mobile.panel?.backdropFilter || 'blur(20px)',
                  borderTop:
                    mobile.panel?.borderTop ||
                    '1px solid rgba(255, 255, 255, 0.1)',
                  padding: mobile.panel?.padding || '32px 24px 24px',
                  transform: mobilePanelOpen
                    ? 'translateY(0)'
                    : 'translateY(100%)',
                  transition:
                    mobile.panel?.transition ||
                    'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                  zIndex: 9,
                  cursor: 'pointer',
                }}
                onClick={() => setMobilePanelOpen(false)}
              >
                <div
                  style={{
                    width: '40px',
                    height: '4px',
                    background: 'rgba(255, 255, 255, 0.3)',
                    borderRadius: '100px',
                    margin: '0 auto 20px',
                  }}
                />
                {content.title && (
                  <div
                    style={{
                      fontSize: mobile.panel?.title?.fontSize || '24px',
                      fontWeight: mobile.panel?.title?.fontWeight || '300',
                      color: mobile.panel?.title?.color || '#ffffff',
                      marginBottom: mobile.panel?.title?.marginBottom || '16px',
                      lineHeight: '1.2',
                    }}
                  >
                    {content.title}
                  </div>
                )}
                {content.description && (
                  <div
                    style={{
                      fontSize: mobile.panel?.subtitle?.fontSize || '14px',
                      color:
                        mobile.panel?.subtitle?.color ||
                        'rgba(255, 255, 255, 0.9)',
                      lineHeight: mobile.panel?.subtitle?.lineHeight || '1.6',
                      marginBottom:
                        mobile.panel?.subtitle?.marginBottom || '20px',
                    }}
                  >
                    {content.description}
                  </div>
                )}
                {/* Remove overlaying close button to avoid covering text */}
              </div>
            </>
          );
        })()}
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
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Visual Content - image or blurred PDF mock */}
        {isPdfPreviewCard ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {latestPdfUrl ? (
              <iframe
                src={`${latestPdfUrl}#view=FitH&toolbar=0&navpanes=0`}
                title="PDF preview"
                style={{
                  width: '78%',
                  height: '82%',
                  border: 'none',
                  borderRadius: 10,
                  boxShadow: '0 30px 80px rgba(0,0,0,.25)',
                  filter: 'blur(7px)',
                  background: '#ffffff',
                }}
              />
            ) : (
              <div
                aria-label="PDF preview (blurred)"
                style={{
                  width: '78%',
                  height: '82%',
                  background: '#ffffff',
                  borderRadius: 10,
                  boxShadow: '0 30px 80px rgba(0,0,0,.25)',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div style={{ height: 48, background: '#eef2f7' }} />
                <div style={{ padding: 22, filter: 'blur(7px)' }}>
                  <div
                    style={{
                      height: 22,
                      width: '58%',
                      background: '#e5e7eb',
                      borderRadius: 5,
                      marginBottom: 16,
                    }}
                  />
                  <div
                    style={{
                      height: 14,
                      width: '92%',
                      background: '#f3f4f6',
                      borderRadius: 4,
                      marginBottom: 8,
                    }}
                  />
                  <div
                    style={{
                      height: 14,
                      width: '85%',
                      background: '#f3f4f6',
                      borderRadius: 4,
                      marginBottom: 8,
                    }}
                  />
                  <div
                    style={{
                      height: 200,
                      background: '#f9fafb',
                      borderRadius: 8,
                      marginTop: 10,
                    }}
                  />
                </div>
                <div
                  style={{
                    position: 'absolute',
                    left: 16,
                    bottom: 16,
                    color: '#ffffff',
                    background: 'rgba(0,0,0,.35)',
                    padding: '8px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                >
                  PDF-esikatselu (sumennettu)
                </div>
              </div>
            )}
          </div>
        ) : loadingImages ? null : content.hasImages &&
          visualImages.length > 0 ? (
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
            {(() => {
              const firstImage = visualImages[0];
              const imageUrl = getImageUrl(firstImage);
              return imageUrl ? (
                <img
                  key={firstImage.id || 'vo-first-image'}
                  src={imageUrl}
                  alt={content.title || 'Visual content'}
                  loading="lazy"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: styles.visualSupport.image.borderRadius,
                  }}
                  onError={e => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : null;
            })()}
          </div>
        ) : null}

        {/* Desktop overlay - always visible card at bottom if there is text */}
        {(() => {
          const overlay = (styles.visualSupport as any)?.image?.overlay || {};
          const hasText = !hideText && (content.title || content.description);
          const overlayEnabled = (visualObject as any)?.show_overlay === true;
          if (!hasText || overlay.enabled === false || !overlayEnabled) {
            return null;
          }
          return (
            <div
              style={{
                position: 'absolute',
                left: '24px',
                right: '24px',
                bottom: '24px',
                background: isHovered
                  ? overlay.hoverBackground || overlay.background
                  : overlay.background,
                backdropFilter: isHovered
                  ? overlay.hoverBackdropFilter || overlay.backdropFilter
                  : overlay.backdropFilter,
                WebkitBackdropFilter: isHovered
                  ? overlay.hoverBackdropFilter || overlay.backdropFilter
                  : overlay.backdropFilter,
                border: isHovered
                  ? overlay.hoverBorder || overlay.border
                  : overlay.border,
                borderRadius: overlay.borderRadius || '12px',
                padding: overlay.padding || '24px 28px',
                transition:
                  overlay.transition ||
                  'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                transform:
                  isHovered && overlay.hoverLift
                    ? `translateY(${overlay.hoverLift})`
                    : 'translateY(0)',
                boxShadow: isHovered
                  ? '0 10px 40px rgba(0, 0, 0, 0.15)'
                  : 'none',
              }}
            >
              {/* Optional gradient overlay layer */}
              {overlay.gradientOverlay?.enabled && (
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background:
                      overlay.gradientOverlay.background ||
                      'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 100%)',
                    borderRadius:
                      overlay.gradientOverlay.borderRadius ||
                      overlay.borderRadius ||
                      '12px',
                    opacity: isHovered
                      ? overlay.gradientOverlay.hoverOpacity || '1'
                      : overlay.gradientOverlay.opacity || '0',
                    transition:
                      (styles.animations as any)?.transitions?.hover ||
                      'opacity 300ms ease',
                    pointerEvents: 'none',
                  }}
                />
              )}
              {/* Content */}
              {content.title && (
                <div
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    fontSize: overlay.title?.fontSize || '28px',
                    fontWeight: overlay.title?.fontWeight || '300',
                    color: overlay.title?.color || '#ffffff',
                    marginBottom: overlay.title?.marginBottom || '12px',
                    letterSpacing: overlay.title?.letterSpacing || '-0.02em',
                    lineHeight: overlay.title?.lineHeight || '1.2',
                    transform:
                      isHovered && overlay.title?.hoverScale
                        ? `scale(${overlay.title.hoverScale})`
                        : 'scale(1)',
                    transition:
                      (styles.animations as any)?.transitions?.hover ||
                      'all 300ms ease',
                  }}
                >
                  {content.title}
                </div>
              )}
              {content.description && (
                <div
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    fontSize: overlay.subtitle?.fontSize || '16px',
                    fontWeight: overlay.subtitle?.fontWeight || '400',
                    color:
                      overlay.subtitle?.color || 'rgba(255, 255, 255, 0.9)',
                    lineHeight: overlay.subtitle?.lineHeight || '1.5',
                  }}
                >
                  {content.description}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
