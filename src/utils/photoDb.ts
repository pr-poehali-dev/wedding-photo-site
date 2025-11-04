interface Photo {
  id: number;
  url: string;
  thumbnail_url: string | null;
  cdn_full_url?: string | null;
  cdn_thumbnail_url?: string | null;
  alt: string;
  display_order: number;
}

const PHOTOS_CACHE_KEY = 'wedding_photos_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheData {
  photos: Photo[];
  timestamp: number;
}

export async function getAllPhotos(): Promise<Photo[]> {
  try {
    const cached = localStorage.getItem(PHOTOS_CACHE_KEY);
    if (cached) {
      const data: CacheData = JSON.parse(cached);
      if (Date.now() - data.timestamp < CACHE_DURATION) {
        return data.photos;
      }
    }
  } catch (e) {
    console.warn('Cache read failed:', e);
  }

  try {
    const response = await fetch('https://functions.poehali.dev/033e2359-06e3-4d1b-829c-b250c1c918af');
    
    if (!response.ok) {
      throw new Error('API unavailable');
    }

    const data = await response.json();
    const photos = data.photos || [];

    try {
      localStorage.setItem(PHOTOS_CACHE_KEY, JSON.stringify({
        photos,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn('Cache write failed:', e);
    }

    return photos;
  } catch (error) {
    console.error('Failed to fetch photos:', error);
    
    const cached = localStorage.getItem(PHOTOS_CACHE_KEY);
    if (cached) {
      const data: CacheData = JSON.parse(cached);
      return data.photos;
    }
    
    return [];
  }
}

export async function getPhotoById(id: number): Promise<Photo | null> {
  const photos = await getAllPhotos();
  return photos.find(p => p.id === id) || null;
}

export function getPhotoUrl(photo: Photo): string {
  return photo.cdn_full_url || photo.url;
}

export function getThumbnailUrl(photo: Photo): string | null {
  return photo.cdn_thumbnail_url || photo.thumbnail_url;
}
