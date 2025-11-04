import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';

interface PhotoViewerProps {
  photoIds: number[];
  initialPhotoId: number;
  photosApi: string;
  onClose: () => void;
}

const fullPhotoCache = new Map<number, { url: string; alt: string }>();

export default function PhotoViewer({ photoIds, initialPhotoId, photosApi, onClose }: PhotoViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(photoIds.indexOf(initialPhotoId));
  const [currentPhoto, setCurrentPhoto] = useState<{ url: string; alt: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [currentIndex]);

  useEffect(() => {
    loadCurrentPhoto();
  }, [currentIndex]);

  const loadCurrentPhoto = async () => {
    const photoId = photoIds[currentIndex];
    
    if (fullPhotoCache.has(photoId)) {
      setCurrentPhoto(fullPhotoCache.get(photoId)!);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${photosApi}?id=${photoId}`);
      const data = await response.json();
      const photo = { url: data.url, alt: data.alt };
      fullPhotoCache.set(photoId, photo);
      setCurrentPhoto(photo);
    } catch (error) {
      console.error('Ошибка загрузки фото:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % photoIds.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + photoIds.length) % photoIds.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) handleNext();
    if (isRightSwipe) handlePrev();

    setTouchStart(0);
    setTouchEnd(0);
  };

  const downloadPhoto = async () => {
    if (!currentPhoto) return;
    
    try {
      const response = await fetch(currentPhoto.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentPhoto.alt.replace(/\s/g, '-')}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download photo:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <button
          onClick={downloadPhoto}
          className="text-white hover:text-primary transition-colors p-2"
          aria-label="Скачать"
          disabled={!currentPhoto}
        >
          <Icon name="Download" size={28} />
        </button>
        <button
          onClick={onClose}
          className="text-white hover:text-primary transition-colors p-2"
          aria-label="Закрыть"
        >
          <Icon name="X" size={32} />
        </button>
      </div>

      <div className="absolute top-4 left-4 z-50 text-white text-lg font-light">
        {currentIndex + 1} / {photoIds.length}
      </div>

      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:text-primary transition-colors p-2 hidden md:block"
        aria-label="Предыдущее фото"
      >
        <Icon name="ChevronLeft" size={48} />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:text-primary transition-colors p-2 hidden md:block"
        aria-label="Следующее фото"
      >
        <Icon name="ChevronRight" size={48} />
      </button>

      <div
        className="w-full h-full flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {loading && (
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent"></div>
        )}
        {currentPhoto && !loading && (
          <img
            src={currentPhoto.url}
            alt={currentPhoto.alt}
            className="max-w-full max-h-full object-contain"
          />
        )}
      </div>
    </div>
  );
}