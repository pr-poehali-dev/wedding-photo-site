import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/icon';

interface LazyPhotoProps {
  id: number;
  thumbnailUrl: string | null;
  alt: string;
  photosApi: string;
  className?: string;
}

export default function LazyPhoto({ id, thumbnailUrl, alt, photosApi, className = '' }: LazyPhotoProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(thumbnailUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  const hasLoaded = useRef(!!thumbnailUrl);

  useEffect(() => {
    if (thumbnailUrl) {
      setImageUrl(thumbnailUrl);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasLoaded.current) {
            hasLoaded.current = true;
            loadPhoto();
          }
        });
      },
      {
        rootMargin: '200px',
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [thumbnailUrl]);

  const loadPhoto = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${photosApi}?id=${id}`);
      const data = await response.json();
      setImageUrl(data.thumbnail_url || data.url);
    } catch (err) {
      setError(true);
      console.error('Ошибка загрузки фото:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={imgRef} className={className}>
      {loading && (
        <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg animate-pulse">
          <Icon name="Image" size={48} className="text-muted-foreground" />
        </div>
      )}
      {error && (
        <div className="w-full h-full flex items-center justify-center bg-destructive/10 rounded-lg">
          <Icon name="AlertCircle" size={48} className="text-destructive" />
        </div>
      )}
      {imageUrl && !loading && !error && (
        <img
          src={imageUrl}
          alt={alt}
          className="w-full h-full object-cover rounded-lg"
          loading="lazy"
        />
      )}
      {!imageUrl && !loading && !error && (
        <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
          <Icon name="Image" size={48} className="text-muted-foreground" />
        </div>
      )}
    </div>
  );
}