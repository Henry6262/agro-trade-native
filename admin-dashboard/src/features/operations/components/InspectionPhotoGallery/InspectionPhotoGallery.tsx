import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface InspectionPhotoGalleryProps {
  photos: string[];
  isOpen: boolean;
  onClose: () => void;
  sellerName?: string;
  productName?: string;
}

export const InspectionPhotoGallery: React.FC<InspectionPhotoGalleryProps> = ({
  photos,
  isOpen,
  onClose,
  sellerName = 'Unknown Seller',
  productName = 'Unknown Product',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index);
  };

  if (photos.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Inspection Photos</DialogTitle>
          <DialogDescription>
            {sellerName} - {productName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Main Image Display */}
          <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ height: '500px' }}>
            <img
              src={photos[currentIndex]}
              alt={`Inspection photo ${currentIndex + 1}`}
              className="w-full h-full object-contain"
            />

            {/* Navigation Arrows */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={handlePrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-3 shadow-lg transition-all"
                  aria-label="Previous photo"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-3 shadow-lg transition-all"
                  aria-label="Next photo"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Photo Counter */}
            <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-semibold">
              {currentIndex + 1} / {photos.length}
            </div>
          </div>

          {/* Thumbnail Grid */}
          {photos.length > 1 && (
            <div className="grid grid-cols-6 gap-2">
              {photos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => handleThumbnailClick(index)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentIndex
                      ? 'border-blue-500 ring-2 ring-blue-300'
                      : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  <img
                    src={photo}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {index === currentIndex && (
                    <div className="absolute inset-0 bg-blue-500/20" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={photos[currentIndex]} target="_blank" rel="noopener noreferrer">
                  🔗 Open in New Tab
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={photos[currentIndex]} download={`inspection-photo-${currentIndex + 1}.jpg`}>
                  💾 Download
                </a>
              </Button>
            </div>
            <Button variant="default" onClick={onClose}>
              Close Gallery
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InspectionPhotoGallery;
