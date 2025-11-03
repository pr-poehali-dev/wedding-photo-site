import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';

interface Video {
  id: number;
  title: string;
  url: string | null;
  display_order: number;
}

const VIDEOS_API = 'https://functions.poehali.dev/ab3b063b-4d8c-4214-a451-c337a94f712a';

export default function VideoSection() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVideos = async () => {
      try {
        const response = await fetch(VIDEOS_API);
        const data = await response.json();
        setVideos(data.videos || []);
      } catch (error) {
        console.error('Failed to load videos:', error);
        setVideos([
          { id: 1, title: 'Церемония', url: null, display_order: 1 },
          { id: 2, title: 'Банкет', url: null, display_order: 2 },
          { id: 3, title: 'Прогулка', url: null, display_order: 3 },
        ]);
      } finally {
        setLoading(false);
      }
    };
    loadVideos();
  }, []);

  if (loading) {
    return null;
  }

  const hasAnyVideo = videos.some(v => v.url);

  return (
    <section className="max-w-7xl mx-auto px-6 py-20">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-primary"></div>
          <Icon name="Video" className="text-primary" size={32} />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-primary"></div>
        </div>
        <h2 className="text-4xl md:text-5xl font-light mb-4 text-foreground">Видео со свадьбы</h2>
        {!hasAnyVideo && (
          <p className="text-lg text-muted-foreground font-light italic">
            Ожидайте. Скоро здесь будет опубликовано видео со свадьбы
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {videos.map((video) => (
          <div
            key={video.id}
            className="relative aspect-video rounded-lg overflow-hidden bg-muted border border-border/50 group"
          >
            {video.url ? (
              <iframe
                src={video.url}
                title={video.title}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6">
                <Icon name="Play" className="text-muted-foreground/30 mb-4" size={64} />
                <p className="text-muted-foreground font-light text-center">{video.title}</p>
                <p className="text-sm text-muted-foreground/60 mt-2">Скоро появится</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}