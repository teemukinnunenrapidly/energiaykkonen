'use client';

import React, { useState, useEffect } from 'react';
import { Monitor, Smartphone, Maximize, Minimize } from 'lucide-react';
import AdminNavigation from '@/components/admin/AdminNavigation';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { CardSystemContainer } from '@/components/card-system/CardSystemContainer';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

export default function PreviewPage() {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [containerWidth, setContainerWidth] = useState(1200);
  const [containerHeight, setContainerHeight] = useState(800);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const mobileWidth = 375;
  const desktopMinWidth = 1000;
  const desktopMaxWidth = 1920;

  const currentWidth = viewMode === 'mobile' ? mobileWidth : containerWidth;

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isFullscreen]);

  return (
    <div className="min-h-screen bg-gray-50">
      {!isFullscreen && <AdminNavigation />}

      <div className={`${!isFullscreen ? 'p-6' : ''} h-full`}>
        {/* Preview Controls */}
        {!isFullscreen && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                {/* View Mode Toggle */}
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">View:</Label>
                  <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                    <Button
                      size="sm"
                      variant={viewMode === 'desktop' ? 'default' : 'ghost'}
                      onClick={() => setViewMode('desktop')}
                      className="gap-2"
                    >
                      <Monitor className="w-4 h-4" />
                      Desktop
                    </Button>
                    <Button
                      size="sm"
                      variant={viewMode === 'mobile' ? 'default' : 'ghost'}
                      onClick={() => setViewMode('mobile')}
                      className="gap-2"
                    >
                      <Smartphone className="w-4 h-4" />
                      Mobile
                    </Button>
                  </div>
                </div>

                {/* Width Slider (Desktop Only) */}
                {viewMode === 'desktop' && (
                  <div className="flex items-center gap-3">
                    <Label className="text-sm font-medium">Width:</Label>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500 w-20">
                        {containerWidth}px
                      </span>
                      <Slider
                        value={[containerWidth]}
                        onValueChange={([value]) => setContainerWidth(value)}
                        min={desktopMinWidth}
                        max={desktopMaxWidth}
                        step={10}
                        className="w-64"
                      />
                    </div>

                    {/* Height Adjustment */}
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                        Height:
                      </label>
                      <span className="text-sm text-gray-600 w-16 text-center">
                        {containerHeight}px
                      </span>
                      <Slider
                        value={[containerHeight]}
                        onValueChange={([value]) => setContainerHeight(value)}
                        min={600}
                        max={1200}
                        step={50}
                        className="w-64"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Fullscreen Toggle */}
              <Button
                size="sm"
                variant="outline"
                onClick={toggleFullscreen}
                className="gap-2"
              >
                <Maximize className="w-4 h-4" />
                Fullscreen
              </Button>
            </div>
          </div>
        )}

        {/* Fullscreen Exit Button */}
        {isFullscreen && (
          <Button
            size="sm"
            variant="secondary"
            onClick={toggleFullscreen}
            className="fixed top-4 right-4 z-50 gap-2 shadow-lg"
          >
            <Minimize className="w-4 h-4" />
            Exit Fullscreen
          </Button>
        )}

        {/* Preview Container */}
        <div
          className={`
            ${isFullscreen ? 'h-screen' : 'h-[calc(100vh-220px)]'}
            bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center
            ${viewMode === 'mobile' ? 'p-8' : 'p-4'}
          `}
        >
          <div
            className={`
              transition-all duration-300 relative
              ${viewMode === 'mobile' ? 'rounded-3xl' : ''}
            `}
            style={{
              width: `${currentWidth}px`,
              height: viewMode === 'mobile' ? '812px' : 'calc(100% - 32px)',
              maxHeight:
                viewMode === 'mobile' ? '812px' : 'calc(100vh - 280px)',
            }}
          >
            {/* Mobile Frame */}
            {viewMode === 'mobile' && (
              <>
                {/* Mobile Notch */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-7 bg-black rounded-b-3xl z-10" />
                {/* Mobile Status Bar */}
                <div className="absolute top-0 left-0 right-0 h-12 bg-white/90 rounded-t-3xl flex items-center justify-between px-6 pt-2 z-20">
                  <span className="text-xs font-medium">9:41</span>
                  <div className="flex gap-1">
                    <div className="w-4 h-3 bg-black rounded-sm" />
                    <div className="w-4 h-3 bg-black rounded-sm" />
                    <div className="w-4 h-3 bg-black rounded-sm" />
                  </div>
                </div>
              </>
            )}

            {/* Live Card System - No iframe, direct component */}
            <ThemeProvider>
              <CardSystemContainer
                maxWidth="100%"
                showVisualSupport={true}
                visualWidth="50%"
                fullWidth={true}
                className={viewMode === 'mobile' ? 'pt-12' : ''}
                forceMode={viewMode}
              />
            </ThemeProvider>
          </div>
        </div>

        {/* Info Text */}
        {!isFullscreen && (
          <div className="mt-4 text-center text-sm text-gray-600">
            <p>
              This preview shows live data from your Card Builder. Changes made
              in Card Builder will appear here immediately.
              {viewMode === 'desktop' &&
                ' Adjust the width to test different screen sizes.'}
              {viewMode === 'mobile' &&
                ' In mobile view, visual content appears as a compact banner at the top.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
