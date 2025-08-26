import React, { useState, useEffect } from 'react';
import { getVisualAssetByContext, type VisualAsset } from '@/lib/visual-assets-service';

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
  const [asset, setAsset] = useState<VisualAsset | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadAsset = async () => {
      setLoading(true);
      try {
        const data = await getVisualAssetByContext(sectionId, fieldId, fieldValue);
        setAsset(data);
      } catch (error) {
        console.error('Failed to load visual asset:', error);
        setAsset(null);
      } finally {
        setLoading(false);
      }
    };

    if (sectionId || fieldId) {
      loadAsset();
    }
  }, [sectionId, fieldId, fieldValue]);

  const getImageUrl = (cloudflareId: string) => {
    const hash = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH;
    return `https://imagedelivery.net/${hash}/${cloudflareId}/public`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500">Täytä lomake nähdäksesi visuaalisen tuen</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Image Container - Takes most of the space */}
      <div className="flex-1 relative">
        <img
          src={getImageUrl(asset.cloudflare_image_id)}
          alt={asset.title}
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Title and Description Overlay */}
      <div className="p-6 bg-gradient-to-t from-gray-50 to-white">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {asset.title}
        </h2>
        {asset.description && (
          <p className="text-gray-600">
            {asset.description}
          </p>
        )}
        {asset.help_text && (
          <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
            <p className="text-sm text-blue-900">{asset.help_text}</p>
          </div>
        )}
      </div>
    </div>
  );
};
