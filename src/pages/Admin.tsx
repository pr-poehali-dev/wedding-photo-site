import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

function SortablePhotoItem({ photo, onDelete }: { photo: Photo; onDelete: (id: number) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative bg-card border rounded-lg p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-2 hover:bg-muted rounded"
      >
        <Icon name="GripVertical" size={24} className="text-muted-foreground" />
      </div>
      
      <img
        src={photo.url}
        alt={photo.alt}
        className="w-24 h-24 object-cover rounded-lg"
      />
      
      <div className="flex-1">
        <p className="font-medium">{photo.alt}</p>
        <p className="text-sm text-muted-foreground">Порядок: {photo.display_order}</p>
      </div>
      
      <Button
        variant="destructive"
        size="sm"
        onClick={() => onDelete(photo.id)}
      >
        <Icon name="Trash2" size={16} className="mr-2" />
        Удалить
      </Button>
    </div>
  );
}

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [editingVideo, setEditingVideo] = useState<number | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const savedAuth = localStorage.getItem('wedding_admin_auth');
    if (savedAuth === 'true') {
      setAuthenticated(true);
    }
  }, []);

  const handleLogin = async () => {
    setAuthLoading(true);
    try {
      const response = await fetch(AUTH_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      const data = await response.json();
      
      if (data.authenticated) {
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
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось выполнить вход',
        variant: 'destructive'
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('wedding_admin_auth');
    setAuthenticated(false);
    setPassword('');
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
      const response = await fetch(PHOTOS_API);
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
        setEditingVideo(null);
        setVideoUrl('');
        loadVideos();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить видео',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    if (authenticated) {
      loadPhotos();
      loadVideos();
    }
  }, [authenticated]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      toast({
        title: 'Ошибка',
        description: 'Пожалуйста, выберите изображения',
        variant: 'destructive'
      });
      return;
    }
    
    setSelectedFiles(imageFiles);
    toast({
      title: 'Готово',
      description: `Выбrano ${imageFiles.length} фото. Нажмите "Загрузить" для добавления`
    });
  };

  const uploadPhotos = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: 'Ошибка',
        description: 'Выберите фотографии для загрузки',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    
    const total = selectedFiles.length;
    let uploaded = 0;

    for (const file of selectedFiles) {
      try {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });

        const response = await fetch(PHOTOS_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            url: base64, 
            alt: file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')
          })
        });

        if (response.ok) {
          uploaded++;
          setUploadProgress(Math.round((uploaded / total) * 100));
        }
      } catch (error) {
        console.error('Ошибка загрузки:', error);
      }
    }

    setUploading(false);
    setSelectedFiles([]);
    setUploadProgress(0);
    loadPhotos();
    
    toast({
      title: 'Готово!',
      description: `Загружено ${uploaded} из ${total} фотографий`
    });
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = photos.findIndex((p) => p.id === active.id);
      const newIndex = photos.findIndex((p) => p.id === over.id);

      const newPhotos = arrayMove(photos, oldIndex, newIndex);
      setPhotos(newPhotos);

      const orders = newPhotos.map((photo, index) => ({
        id: photo.id,
        display_order: index + 1
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
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-secondary/30 via-white to-secondary/20 flex items-center justify-center px-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-3xl font-light text-center">Вход в админ-панель</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Пароль</label>
              <Input
                type="password"
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <Button 
              onClick={handleLogin} 
              disabled={authLoading || !password}
              className="w-full"
            >
              <Icon name="LogIn" size={20} className="mr-2" />
              Войти
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              <Icon name="Home" size={20} className="mr-2" />
              На главную
            </Button>
          </CardContent>
        </Card>
      </div>
    );
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

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-light">Управление видео</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {videos.map((video) => (
                <div key={video.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-medium mb-2">{video.title}</h3>
                      {editingVideo === video.id ? (
                        <div className="space-y-2">
                          <Input
                            placeholder="https://youtube.com/embed/VIDEO_ID"
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => updateVideo(video.id, videoUrl)}>
                              <Icon name="Check" size={16} className="mr-1" />
                              Сохранить
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => {
                              setEditingVideo(null);
                              setVideoUrl('');
                            }}>
                              Отмена
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          {video.url ? (
                            <p className="text-sm text-muted-foreground mb-2 break-all">{video.url}</p>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">Видео не добавлено</p>
                          )}
                        </div>
                      )}
                    </div>
                    {editingVideo !== video.id && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingVideo(video.id);
                            setVideoUrl(video.url || '');
                          }}
                        >
                          <Icon name="Edit" size={16} className="mr-1" />
                          {video.url ? 'Изменить' : 'Добавить'}
                        </Button>
                        {video.url && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (confirm('Удалить это видео?')) {
                                updateVideo(video.id, null);
                              }
                            }}
                          >
                            <Icon name="Trash2" size={16} className="mr-1" />
                            Удалить
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-light">Добавить фотографии</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Выберите фотографии (можно несколько)</label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                disabled={uploading}
              />
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Выбрано файлов: {selectedFiles.length}</p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                      <Icon name="Image" size={16} />
                      {file.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Загрузка...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <Button 
              onClick={uploadPhotos} 
              disabled={uploading || selectedFiles.length === 0}
              className="w-full"
            >
              <Icon name="Upload" size={20} className="mr-2" />
              {uploading ? 'Загрузка...' : `Загрузить ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}`}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-light">
              Все фотографии ({photos.length})
              <span className="text-sm font-normal text-muted-foreground ml-4">Перетаскивайте для изменения порядка</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={photos.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {photos.map((photo) => (
                    <SortablePhotoItem
                      key={photo.id}
                      photo={photo}
                      onDelete={deletePhoto}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}