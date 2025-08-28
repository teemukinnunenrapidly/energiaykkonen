import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  getSafeImageUrl,
  getVisualObjectById,
} from '@/lib/visual-assets-service';
import { useCardContext } from './CardContext';

interface VisualObject {
  id: string;
  title: string;
  description?: string;
  images: {
    id: string;
    cloudflare_image_id: string;
    display_order: number;
  }[];
}

export const VisualSupport: React.FC<{
  objectId?: string;
  compact?: boolean;
}> = ({ objectId, compact = false }) => {
  const { cards } = useCardContext();
  const [object, setObject] = useState<VisualObject | null>(null);
  const [previousObject, setPreviousObject] = useState<VisualObject | null>(
    null
  );
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [fadeState, setFadeState] = useState<
    'idle' | 'fading-out' | 'fading-in'
  >('idle');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchedIdRef = useRef<string | null>(null);

  const handleImageChange = (newIndex: number) => {
    if (isTransitioning || newIndex === currentImageIndex) {
      return;
    }

    setIsTransitioning(true);
    setCurrentImageIndex(newIndex);

    // Reset transition state after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  // Handle visual object change with proper crossfade transition
  const handleVisualObjectChange = async (newObject: VisualObject | null) => {
    console.log('VisualSupport: handleVisualObjectChange called:', {
      currentObjectId: object?.id,
      newObjectId: newObject?.id,
      willTransition: object && newObject && object.id !== newObject.id,
    });

    if (object && newObject && object.id !== newObject.id) {
      // Start crossfade transition
      console.log('VisualSupport: Starting crossfade transition');
      setIsTransitioning(true);
      setFadeState('fading-out');
      setPreviousObject(object);

      // After fade out completes, swap images and fade in
      setTimeout(() => {
        console.log('VisualSupport: Swapping to new object');
        setObject(newObject);
        setCurrentImageIndex(0);
        setFadeState('fading-in');

        // Complete the transition after fade in
        setTimeout(() => {
          console.log('VisualSupport: Transition complete');
          setPreviousObject(null);
          setIsTransitioning(false);
          setFadeState('idle');
        }, 300);
      }, 300);
    } else {
      // Direct change (no transition needed)
      console.log('VisualSupport: Direct object change (no transition)');
      setObject(newObject);
      setCurrentImageIndex(0);
      setPreviousObject(null);
      setFadeState('idle');
    }
  };

  useEffect(() => {
    if (object && object.images.length > 1 && isAutoPlaying) {
      intervalRef.current = setInterval(() => {
        const newIndex =
          currentImageIndex === object.images.length - 1
            ? 0
            : currentImageIndex + 1;
        handleImageChange(newIndex);
      }, 5000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [object, isAutoPlaying, currentImageIndex]);

  const handlePrevious = () => {
    setIsAutoPlaying(false);
    const newIndex =
      currentImageIndex === 0
        ? object!.images.length - 1
        : currentImageIndex - 1;
    handleImageChange(newIndex);
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    const newIndex =
      currentImageIndex === object!.images.length - 1
        ? 0
        : currentImageIndex + 1;
    handleImageChange(newIndex);
  };

  // Fetch linked visual object from the active card
  useEffect(() => {
    const fetchLinkedVisualObject = async () => {
      setLoading(true);
      try {
        // Find the active card (first revealed card)
        const activeCard = cards.find(card => card.id === objectId) || cards[0];

        console.log('VisualSupport: Active card changed:', {
          objectId,
          cardId: activeCard?.id,
          linkedVisualObjectId: activeCard?.config?.linked_visual_object_id,
          currentObjectId: object?.id,
        });

        if (activeCard?.config?.linked_visual_object_id) {
          const targetId = activeCard.config.linked_visual_object_id;

          // Check if we already fetched this object
          if (lastFetchedIdRef.current === targetId) {
            console.log(
              'VisualSupport: Already fetched this visual object, skipping'
            );
            setLoading(false);
            return;
          }

          // Fetch the linked visual object
          const visualObject = await getVisualObjectById(targetId);
          if (visualObject) {
            console.log(
              'VisualSupport: Fetched new visual object:',
              visualObject.id
            );
            lastFetchedIdRef.current = targetId;
            await handleVisualObjectChange(visualObject);
            return;
          }
        }

        // Fallback to mock object if no linked visual object (only if we don't have one)
        if (!object) {
          console.log('VisualSupport: Using fallback mock object');
          await handleVisualObjectChange({
            id: 'mock',
            title: 'Sample House',
            description: 'Modern energy-efficient house',
            images: [
              {
                id: '1',
                cloudflare_image_id: 'public',
                display_order: 1,
              },
            ],
          });
        }
      } catch (error) {
        console.error('Error fetching visual object:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLinkedVisualObject();
  }, [objectId, cards]); // Removed object?.id to prevent loops

  if (loading) {
    return (
      <div
        className={`flex flex-col h-full bg-white ${!compact && 'border border-gray-200 rounded-lg shadow-sm'}`}
      >
        <div
          className={`flex-1 bg-gray-100 flex items-center justify-center ${!compact && 'rounded-t-lg'}`}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className={`text-gray-500 ${compact ? 'text-sm' : ''}`}>
              Loading visual content...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!object || object.images.length === 0) {
    return (
      <div
        className={`flex flex-col h-full bg-white ${!compact && 'border border-gray-200 rounded-lg shadow-sm'}`}
      >
        <div
          className={`flex-1 bg-gray-100 flex items-center justify-center ${!compact && 'rounded-t-lg'}`}
        >
          <p className={`text-gray-500 ${compact ? 'text-sm' : ''}`}>
            No visual content available
          </p>
        </div>
      </div>
    );
  }

  // Use our safe image URL function
  const getImageUrl = (cloudflareId: string) => {
    return getSafeImageUrl(cloudflareId, 'public');
  };

  return (
    <div
      className={`flex flex-col h-full bg-white ${!compact && 'border border-gray-200 rounded-lg shadow-sm'}`}
    >
      <div
        className={`flex-1 relative group overflow-hidden ${!compact && 'rounded-lg'}`}
      >
        {/* Previous visual object (for crossfade) */}
        {isTransitioning &&
          previousObject &&
          previousObject.images.length > 0 && (
            <img
              src={getImageUrl(previousObject.images[0].cloudflare_image_id)}
              alt={previousObject.title}
              className="absolute inset-0 w-full h-full object-cover rounded-lg transition-opacity duration-300 ease-in-out"
              style={{
                opacity: fadeState === 'fading-out' ? 0 : 1,
                zIndex: fadeState === 'fading-in' ? 1 : 2,
              }}
            />
          )}

        {/* Current visual object */}
        {object && object.images.length > 0 && (
          <img
            src={getImageUrl(
              object.images[currentImageIndex].cloudflare_image_id
            )}
            alt={object.title}
            className="absolute inset-0 w-full h-full object-cover rounded-lg transition-opacity duration-300 ease-in-out"
            style={{
              opacity:
                fadeState === 'fading-in'
                  ? 1
                  : fadeState === 'fading-out'
                    ? 0
                    : 1,
              zIndex: fadeState === 'fading-in' ? 2 : 1,
            }}
          />
        )}

        {/* Navigation controls - only show if current object has multiple images and not compact */}
        {!compact && object && object.images.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Image indicators - only show if current object has multiple images and not compact */}
        {!compact && object && object.images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex justify-center space-x-2 z-10">
            {object.images.map((_, index) => (
              <button
                key={index}
                onClick={() => handleImageChange(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentImageIndex ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        )}

        {/* Compact mode indicator for multiple images */}
        {compact && object && object.images.length > 1 && (
          <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
            {currentImageIndex + 1} / {object.images.length}
          </div>
        )}
      </div>
    </div>
  );
};
