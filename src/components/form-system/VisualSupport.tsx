import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getVisualObjectByContext, type VisualObjectWithDetails } from '@/lib/visual-assets-service';

interface VisualSupportProps {
  sectionId?: string;
  fieldId?: string;
  fieldValue?: string;
}

export const VisualSupport: React.FC<VisualSupportProps> = ({
  sectionId,
  fieldId,
  fieldValue,
}) => {
  const [object, setObject] = useState<VisualObjectWithDetails | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const loadVisualObject = async () => {
      if (!sectionId && !fieldId) {
        setObject(null);
        return;
      }

      setLoading(true);
      try {
        const data = await getVisualObjectByContext(sectionId, fieldId, fieldValue);
        setObject(data);
        setCurrentImageIndex(0);
      } catch (error) {
        console.error('Failed to load visual object:', error);
        setObject(null);
      } finally {
        setLoading(false);
      }
    };

    loadVisualObject();
  }, [sectionId, fieldId, fieldValue]);

  useEffect(() => {
    if (object && object.images.length > 1 && isAutoPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentImageIndex(prev => 
          prev === object.images.length - 1 ? 0 : prev + 1
        );
      }, 5000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [object, isAutoPlaying]);

  const handlePrevious = () => {
    if (!object) return;
    setIsAutoPlaying(false);
    setCurrentImageIndex(prev => 
      prev === 0 ? object.images.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    if (!object) return;
    setIsAutoPlaying(false);
    setCurrentImageIndex(prev => 
      prev === object.images.length - 1 ? 0 : prev + 1
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!object || object.images.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500">Täytä lomake nähdäksesi visuaalisen tuen</p>
          </div>
        </div>
        {object && (
          <div className="p-6">
            <h2 className="text-2xl font-bold">{object.title}</h2>
            {object.description && <p className="text-gray-600 mt-2">{object.description}</p>}
          </div>
        )}
      </div>
    );
  }

  const currentImage = object.images[currentImageIndex];
  const showNavigation = object.images.length > 1;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 relative group">
        <img
          src={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH}/${currentImage.cloudflare_image_id}/public`}
          alt={object.title}
          className="w-full h-full object-cover"
        />
        
        {showNavigation && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Image counter indicator */}
        {showNavigation && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {currentImageIndex + 1} / {object.images.length}
          </div>
        )}
      </div>
      
      <div className="p-6 bg-gradient-to-t from-gray-50 to-white">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{object.title}</h2>
        {object.description && (
          <p className="text-gray-600 mb-4">{object.description}</p>
        )}
        
        {/* Folder information */}
        {object.folder && (
          <div className="text-sm text-gray-500">
            📁 {object.folder.name}
          </div>
        )}
      </div>
    </div>
  );
};
