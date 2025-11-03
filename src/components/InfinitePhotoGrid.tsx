import { useState, useEffect, useRef, useCallback } from 'react';
import PhotoViewer from './PhotoViewer';

interface InfinitePhotoGridProps {
  photos: string[];
}

export default function InfinitePhotoGrid({ photos }: InfinitePhotoGridProps) {
  const [displayedPhotos, setDisplayedPhotos] = useState<string[]>([]);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const PHOTOS_PER_BATCH = 30;

  const loadMorePhotos = useCallback(() => {
    const start = currentBatch * PHOTOS_PER_BATCH;
    const end = start + PHOTOS_PER_BATCH;
    const newPhotos = photos.slice(start, end);

    if (newPhotos.length > 0) {
      setDisplayedPhotos((prev) => [...prev, ...newPhotos]);
      setCurrentBatch((prev) => prev + 1);
    }
  }, [currentBatch, photos]);

  useEffect(() => {
    loadMorePhotos();
  }, []);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayedPhotos.length < photos.length) {
          loadMorePhotos();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [displayedPhotos, photos.length, loadMorePhotos]);

  const openViewer = (index: number) => {
    setSelectedPhotoIndex(index);
    setViewerOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1">
        {displayedPhotos.map((photo, index) => (
          <div
            key={index}
            className="aspect-square cursor-pointer overflow-hidden bg-muted group"
            onClick={() => openViewer(index)}
          >
            <img
              src={photo}
              alt={`Фото ${index + 1}`}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
          </div>
        ))}
      </div>

      {displayedPhotos.length < photos.length && (
        <div ref={loadMoreRef} className="py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">
            Загружено {displayedPhotos.length} из {photos.length}
          </p>
        </div>
      )}

      {viewerOpen && (
        <PhotoViewer
          photos={photos}
          initialIndex={selectedPhotoIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
}
