import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

export const VisualSupport: React.FC<{ objectId?: string }> = ({ objectId }) => {
  const [object, setObject] = useState<VisualObject | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (object && object.images.length > 1 && isAutoPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentImageIndex(prev => prev === object.images.length - 1 ? 0 : prev + 1);
      }, 5000);
    }
    return () => clearInterval(intervalRef.current);
  }, [object, isAutoPlaying]);

  const handlePrevious = () => {
    setIsAutoPlaying(false);
    setCurrentImageIndex(prev => prev === 0 ? object!.images.length - 1 : prev - 1);
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    setCurrentImageIndex(prev => prev === object!.images.length - 1 ? 0 : prev + 1);
  };

  // For testing purposes, create a mock object if none is provided
  useEffect(() => {
    if (!objectId) {
      // Create a mock object for testing
      setObject({
        id: 'mock-1',
        title: 'Welcome to Energy Calculator',
        description: 'Fill out the form to see relevant visual content and get your personalized energy savings calculation.',
        images: [
          {
            id: 'mock-img-1',
            cloudflare_image_id: 'mock-heating-1',
            display_order: 1
          }
        ]
      });
    }
  }, [objectId]);

  if (!object || object.images.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 bg-gray-100 flex items-center justify-center">
          <p className="text-gray-500">No visual content available</p>
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

  // For testing, use placeholder images if Cloudflare is not set up
  const getImageUrl = (cloudflareId: string) => {
    // Check if we have Cloudflare environment variable
    const hash = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH;
    
    if (hash && hash !== 'your-cloudflare-account-hash') {
      return `https://imagedelivery.net/${hash}/${cloudflareId}/public`;
    }
    
    // Fallback to placeholder images for testing
    const placeholderImages = {
      'sample-heating-1': 'https://via.placeholder.com/800x600/FF6B6B/FFFFFF?text=Heating+System+1',
      'sample-heating-2': 'https://via.placeholder.com/800x600/4ECDC4/FFFFFF?text=Heating+System+2',
      'sample-windows-1': 'https://via.placeholder.com/800x600/45B7D1/FFFFFF?text=Window+Types+1',
      'sample-windows-2': 'https://via.placeholder.com/800x600/96CEB4/FFFFFF?text=Window+Types+2',
      'sample-house-1': 'https://via.placeholder.com/800x600/FFEAA7/000000?text=House+Overview+1',
      'sample-house-2': 'https://via.placeholder.com/800x600/DDA0DD/FFFFFF?text=House+Overview+2',
      'sample-house-3': 'https://via.placeholder.com/800x600/98D8C8/FFFFFF?text=House+Overview+3',
      'mock-heating-1': 'https://via.placeholder.com/800x600/FF6B6B/FFFFFF?text=Welcome+to+Energy+Calculator'
    };
    
    return placeholderImages[cloudflareId as keyof typeof placeholderImages] || 
           `https://via.placeholder.com/800x600/CCCCCC/666666?text=${cloudflareId}`;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 relative group">
        <img 
          src={getImageUrl(currentImage.cloudflare_image_id)} 
          alt={object.title} 
          className="w-full h-full object-cover"
        />
        {showNavigation && (
          <>
            <button 
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>
      <div className="p-6">
        <h2 className="text-2xl font-bold">{object.title}</h2>
        {object.description && <p className="text-gray-600 mt-2">{object.description}</p>}
        {showNavigation && (
          <div className="mt-4 flex justify-center space-x-2">
            {object.images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentImageIndex ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
