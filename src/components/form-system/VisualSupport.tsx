import React, { useState, useEffect } from 'react';
import { getVisualAssets, type VisualAsset } from '@/lib/supabase';

interface VisualSupportProps {
  activeSection: string | null;
  activeField: string | null;
  className?: string;
}

export const VisualSupport: React.FC<VisualSupportProps> = ({
  activeSection,
  activeField,
  className = ''
}) => {
  const [assets, setAssets] = useState<VisualAsset[]>([]);
  const [currentAsset, setCurrentAsset] = useState<VisualAsset | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeSection) {
      setCurrentAsset(null);
      return;
    }

    const loadAssets = async () => {
      setLoading(true);
      try {
        const data = await getVisualAssets(activeSection, activeField || undefined);
        setAssets(data || []);
        if (data && data.length > 0) {
          setCurrentAsset(data[0]);
        }
      } catch (error) {
        console.error('Failed to load visual assets:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAssets();
  }, [activeSection, activeField]);

  const getImageUrl = (cloudflareId: string, variant = 'public') => {
    const accountHash = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH;
    return `https://imagedelivery.net/${accountHash}/${cloudflareId}/${variant}`;
  };

  if (!currentAsset) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 ${className}`}>
        <p className="text-gray-500">Täytä lomake nähdäksesi ohjeet</p>
      </div>
    );
  }

  return (
    <div className={`bg-white ${className}`}>
      <div className="relative h-96">
        <img
          src={getImageUrl(currentAsset.cloudflare_image_id)}
          alt={currentAsset.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <h3 className="text-white text-xl font-bold">{currentAsset.title}</h3>
        </div>
      </div>
      
      {currentAsset.help_text && (
        <div className="p-4">
          <p className="text-sm text-gray-600">{currentAsset.help_text}</p>
        </div>
      )}
    </div>
  );
};
