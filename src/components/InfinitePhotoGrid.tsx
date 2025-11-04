import { useState, useEffect, useRef, useCallback } from 'react';
import LazyPhoto from './LazyPhoto';
import PhotoViewer from './PhotoViewer';

interface Photo {
  id: number;
  thumbnail_url: string | null;
  alt: string;
  display_order: number;
}

interface InfinitePhotoGridProps {
  photos: Photo[];
  photosApi: string;
}

export default function InfinitePhotoGrid({ photos, photosApi }: InfinitePhotoGridProps) {
  const [displayedPhotos, setDisplayedPhotos] = useState<Photo[]>([]);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedPhotoId, setSelectedPhotoId] = useState<number | null>(null);
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

  const openViewer = (photoId: number) => {
    setSelectedPhotoId(photoId);
    setViewerOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1">
        {displayedPhotos.map((photo) => (
          <div
            key={photo.id}
            className="aspect-square cursor-pointer overflow-hidden bg-muted group"
            onClick={() => openViewer(photo.id)}
          >
            <LazyPhoto
              id={photo.id}
              thumbnailUrl={photo.thumbnail_url}
              alt={photo.alt}
              photosApi={photosApi}
              className="w-full h-full transition-transform duration-300 group-hover:scale-110"
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

      {viewerOpen && selectedPhotoId && (
        <PhotoViewer
          photoIds={photos.map(p => p.id)}
          initialPhotoId={selectedPhotoId}
          photosApi={photosApi}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
}