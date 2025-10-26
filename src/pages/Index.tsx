import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';

const photos = [
  {
    id: 1,
    url: 'https://cdn.poehali.dev/projects/b3d2a9e2-198b-4e75-821e-efa9e6d0a5ee/files/6e2347c1-be61-49a8-8300-97e353d15dbb.jpg',
    alt: 'Алексей и Дарья'
  },
  {
    id: 2,
    url: 'https://cdn.poehali.dev/projects/b3d2a9e2-198b-4e75-821e-efa9e6d0a5ee/files/2f27d723-cffa-4e60-b28c-355ba35fb4aa.jpg',
    alt: 'Свадебное оформление'
  },
  {
    id: 3,
    url: 'https://cdn.poehali.dev/projects/b3d2a9e2-198b-4e75-821e-efa9e6d0a5ee/files/44fcff5f-4eb6-4382-84a9-b1961c0fa188.jpg',
    alt: 'Обручальные кольца'
  },
  {
    id: 4,
    url: 'https://cdn.poehali.dev/projects/b3d2a9e2-198b-4e75-821e-efa9e6d0a5ee/files/6e2347c1-be61-49a8-8300-97e353d15dbb.jpg',
    alt: 'Церемония'
  },
  {
    id: 5,
    url: 'https://cdn.poehali.dev/projects/b3d2a9e2-198b-4e75-821e-efa9e6d0a5ee/files/2f27d723-cffa-4e60-b28c-355ba35fb4aa.jpg',
    alt: 'Детали свадьбы'
  },
  {
    id: 6,
    url: 'https://cdn.poehali.dev/projects/b3d2a9e2-198b-4e75-821e-efa9e6d0a5ee/files/44fcff5f-4eb6-4382-84a9-b1961c0fa188.jpg',
    alt: 'Торжество'
  }
];

export default function Index() {
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 via-white to-secondary/20">
      <header className="relative py-20 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-primary rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-secondary rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto animate-fade-in">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-primary"></div>
            <Icon name="Heart" className="text-primary" size={32} />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-primary"></div>
          </div>
          
          <h1 className="text-7xl md:text-8xl font-light mb-4 text-foreground tracking-wide">
            Алексей <span className="text-primary">&</span> Дарья
          </h1>
          
          <div className="flex items-center justify-center gap-3 text-xl md:text-2xl text-muted-foreground font-light">
            <Icon name="Calendar" size={24} className="text-primary" />
            <time dateTime="2025-06-06" className="tracking-wider">06.06.2025</time>
          </div>
          
          <p className="mt-6 text-lg text-muted-foreground font-light italic">
            Наш особенный день в фотографиях
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="group relative aspect-square overflow-hidden rounded-lg shadow-lg cursor-pointer animate-fade-in hover:shadow-2xl transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => openPhoto(photo.id)}
            >
              <img
                src={photo.url}
                alt={photo.alt}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-sm font-light">{photo.alt}</p>
                </div>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-white/90 backdrop-blur-sm rounded-full p-4">
                  <Icon name="Maximize2" size={24} className="text-primary" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-7xl w-full h-[90vh] p-0 overflow-hidden bg-black/95 border-0">
          {currentPhoto && (
            <div className="relative w-full h-full flex items-center justify-center">
              <button
                onClick={closePhoto}
                className="absolute top-4 right-4 z-50 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full p-3 transition-colors"
                aria-label="Закрыть"
              >
                <Icon name="X" size={24} className="text-white" />
              </button>

              <button
                onClick={prevPhoto}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full p-4 transition-colors"
                aria-label="Предыдущее фото"
              >
                <Icon name="ChevronLeft" size={32} className="text-white" />
              </button>

              <button
                onClick={nextPhoto}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full p-4 transition-colors"
                aria-label="Следующее фото"
              >
                <Icon name="ChevronRight" size={32} className="text-white" />
              </button>

              <img
                src={currentPhoto.url}
                alt={currentPhoto.alt}
                className="max-w-full max-h-full object-contain animate-scale-in"
              />

              <div className="absolute bottom-8 left-0 right-0 text-center">
                <p className="text-white text-lg font-light bg-black/30 backdrop-blur-sm inline-block px-6 py-2 rounded-full">
                  {currentPhoto.alt}
                </p>
                <p className="text-white/60 text-sm mt-2">
                  {selectedPhoto} / {photos.length}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
