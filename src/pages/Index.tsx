import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import InfinitePhotoGrid from '@/components/InfinitePhotoGrid';
import VideoSection from '@/components/VideoSection';

const PHOTOS_API = 'https://functions.poehali.dev/033e2359-06e3-4d1b-829c-b250c1c918af';

interface Photo {
  id: number;
  alt: string;
  display_order: number;
}

export default function Index() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const loadPhotos = async () => {
      try {
        const response = await fetch(PHOTOS_API);
        const data = await response.json();
        setPhotos(data.photos || []);
      } catch (error) {
        console.error('Failed to load photos:', error);
      }
    };
    loadPhotos();
  }, []);

  const openPhoto = (id: number) => {
    setSelectedPhoto(id);
    setIsOpen(true);
  };

  const closePhoto = () => {
    setIsOpen(false);
    setTimeout(() => setSelectedPhoto(null), 300);
  };

  const nextPhoto = () => {
    if (selectedPhoto !== null) {
      setSelectedPhoto((selectedPhoto % photos.length) + 1);
    }
  };

  const prevPhoto = () => {
    if (selectedPhoto !== null) {
      setSelectedPhoto(selectedPhoto === 1 ? photos.length : selectedPhoto - 1);
    }
  };

  const currentPhoto = photos.find(p => p.id === selectedPhoto);

  const downloadPhoto = (photo: Photo) => {
    const a = document.createElement('a');
    a.href = photo.url;
    a.download = `${photo.alt.replace(/\s/g, '-')}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const scrollToVideos = () => {
    const videoSection = document.getElementById('videos');
    if (videoSection) {
      videoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 via-white to-secondary/20 relative overflow-hidden">
      <button
        onClick={scrollToVideos}
        className="fixed top-6 left-6 z-40 bg-white/90 hover:bg-white text-primary shadow-lg hover:shadow-xl transition-all duration-300 rounded-full p-4 backdrop-blur-sm flex items-center gap-2 group"
        aria-label="Перейти к видео"
      >
        <Icon name="Video" size={24} />
        <span className="text-sm font-medium hidden sm:inline">К видео</span>
      </button>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 text-6xl opacity-20 animate-float">🎀</div>
        <div className="absolute top-40 right-20 text-5xl opacity-15 animate-float-delayed">🌹</div>
        <div className="absolute top-60 left-1/4 text-4xl opacity-20 rotate-12">🎀</div>
        <div className="absolute top-80 right-1/3 text-5xl opacity-15 -rotate-12 animate-float">💐</div>
        <div className="absolute top-[500px] left-1/2 text-6xl opacity-20 animate-float-delayed">🌸</div>
        <div className="absolute top-[700px] right-10 text-5xl opacity-15 rotate-45">🎀</div>
        <div className="absolute top-[900px] left-20 text-4xl opacity-20 -rotate-12 animate-float">🌺</div>
        <div className="absolute top-[1100px] right-1/4 text-5xl opacity-15 animate-float-delayed">🎀</div>
        <div className="absolute top-[1300px] left-1/3 text-6xl opacity-20 rotate-12">🌷</div>
        <div className="absolute bottom-40 right-20 text-5xl opacity-15 -rotate-45 animate-float">🎀</div>
        <div className="absolute bottom-20 left-10 text-4xl opacity-20 animate-float-delayed">💝</div>
      </div>
      
      <header className="relative h-screen overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(https://cdn.poehali.dev/files/c2bb3e42-7c9f-40a7-9abe-140b9423984f.jpg)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-white"></div>
        </div>
        
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center animate-fade-in">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-white"></div>
            <Icon name="Heart" className="text-white drop-shadow-lg" size={32} />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-white"></div>
          </div>
          
          <h1 className="text-7xl md:text-9xl font-light mb-6 text-white tracking-wide drop-shadow-2xl">
            Алексей <span className="text-primary">&</span> Дарья
          </h1>
          
          <div className="flex items-center justify-center gap-3 text-xl md:text-2xl text-white font-light mb-8">
            <Icon name="Calendar" size={24} className="text-white drop-shadow-lg" />
            <time dateTime="2025-06-06" className="tracking-wider drop-shadow-lg">06.06.2025</time>
          </div>
          
          <p className="text-lg md:text-xl text-white font-light italic drop-shadow-lg">
            Наш особенный день в фотографиях
          </p>
        </div>
      </header>

      <main className="max-w-full pb-20">
        <InfinitePhotoGrid photos={photos} photosApi={PHOTOS_API} />
      </main>

      <VideoSection />

      <footer className="border-t border-border/50 py-12 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Icon name="Heart" className="text-primary animate-pulse" size={20} />
          <p className="text-muted-foreground font-light">
            С любовью, Алексей и Дарья
          </p>
          <Icon name="Heart" className="text-primary animate-pulse" size={20} />
        </div>
        <p className="text-sm text-muted-foreground/70">06 июня 2025</p>
      </footer>
    </div>
  );
}