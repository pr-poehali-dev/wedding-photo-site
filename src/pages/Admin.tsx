import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import LoginForm from '@/components/admin/LoginForm';
import VideoManagement from '@/components/admin/VideoManagement';
import PhotoUpload from '@/components/admin/PhotoUpload';
import PhotoList from '@/components/admin/PhotoList';

const PHOTOS_API = 'https://functions.poehali.dev/033e2359-06e3-4d1b-829c-b250c1c918af';
const AUTH_API = 'https://functions.poehali.dev/13fc900d-534c-466a-bf99-be10845c68ad';
const VIDEOS_API = 'https://functions.poehali.dev/ab3b063b-4d8c-4214-a451-c337a94f712a';

interface Photo {
  id: number;
  url: string;
  alt: string;
  display_order: number;
}

interface Video {
  id: number;
  title: string;
  url: string | null;
  display_order: number;
}

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const savedAuth = localStorage.getItem('wedding_admin_auth');
    if (savedAuth === 'true') {
      setAuthenticated(true);
    }
  }, []);

  const handleLogin = async (password: string) => {
    setAuthLoading(true);
    
    const correctPassword = 'admin2025';
    
    if (password === correctPassword) {
      localStorage.setItem('wedding_admin_auth', 'true');
      setAuthenticated(true);
      toast({
        title: 'Добро пожаловать!',
        description: 'Вы успешно вошли в админ-панель'
      });
    } else {
      toast({
        title: 'Ошибка',
        description: 'Неверный пароль',
        variant: 'destructive'
      });
    }
    
    setAuthLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('wedding_admin_auth');
    setAuthenticated(false);
  };

  const downloadAllPhotos = async () => {
    if (photos.length === 0) {
      toast({
        title: 'Нет фотографий',
        description: 'Нечего скачивать',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Скачивание...',
      description: `Загружаем ${photos.length} фотографий`
    });

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      try {
        const response = await fetch(photo.url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `photo-${i + 1}-${photo.alt.replace(/\s/g, '-')}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Ошибка при скачивании:', error);
      }
    }

    toast({
      title: 'Готово',
      description: 'Все фотографии скачаны'
    });
  };

  const loadPhotos = async () => {
    try {
      const response = await fetch(`${PHOTOS_API}?admin=true`);
      const data = await response.json();
      setPhotos(data.photos || []);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить фотографии',
        variant: 'destructive'
      });
    }
  };

  const loadVideos = async () => {
    try {
      const response = await fetch(VIDEOS_API);
      const data = await response.json();
      setVideos(data.videos || []);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить видео',
        variant: 'destructive'
      });
    }
  };

  const updateVideo = async (id: number, url: string | null) => {
    try {
      const response = await fetch(VIDEOS_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, url })
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: url ? 'Видео обновлено' : 'Видео удалено'
        });
        loadVideos();
      } else {
        const error = await response.text();
        console.error('Update video error:', error);
        toast({
          title: 'Ошибка',
          description: `Не удалось обновить видео (${response.status})`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Update video failed:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить видео',
        variant: 'destructive'
      });
    }
  };

  const deletePhoto = async (id: number) => {
    if (!confirm('Удалить эту фотографию?')) return;

    try {
      const response = await fetch(`${PHOTOS_API}?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Фотография удалена'
        });
        loadPhotos();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить фотографию',
        variant: 'destructive'
      });
    }
  };

  const handleReorderPhotos = async (reorderedPhotos: Photo[]) => {
    setPhotos(reorderedPhotos);

    const orders = reorderedPhotos.map(p => ({
      id: p.id,
      display_order: p.display_order
    }));

    try {
      await fetch(PHOTOS_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders })
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить порядок',
        variant: 'destructive'
      });
      loadPhotos();
    }
  };

  useEffect(() => {
    if (authenticated) {
      loadPhotos();
      loadVideos();
    }
  }, [authenticated]);

  if (!authenticated) {
    return <LoginForm onLogin={handleLogin} loading={authLoading} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 via-white to-secondary/20 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-5xl font-light">Админ-панель</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadAllPhotos}>
              <Icon name="Download" size={20} className="mr-2" />
              Скачать все фото
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <Icon name="LogOut" size={20} className="mr-2" />
              Выйти
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              <Icon name="Home" size={20} className="mr-2" />
              На главную
            </Button>
          </div>
        </div>

        <VideoManagement videos={videos} onUpdateVideo={updateVideo} />

        <PhotoUpload onPhotosUploaded={loadPhotos} photosApi={PHOTOS_API} />

        <PhotoList 
          photos={photos} 
          onDeletePhoto={deletePhoto}
          onReorderPhotos={handleReorderPhotos}
        />
      </div>
    </div>
  );
}