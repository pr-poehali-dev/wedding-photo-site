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

interface Photo {
  id: number;
  url: string;
  alt: string;
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
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
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

  useEffect(() => {
    if (authenticated) {
      loadPhotos();
    }
  }, [authenticated]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Ошибка',
        description: 'Пожалуйста, выберите изображение',
        variant: 'destructive'
      });
      return;
    }

    setUploadingFile(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setImageUrl(base64);
      setUploadingFile(false);
      
      toast({
        title: 'Готово',
        description: 'Изображение загружено. Теперь добавьте описание и нажмите "Добавить"'
      });
    };
    reader.readAsDataURL(file);
  };

  const addPhoto = async () => {
    if (!imageUrl || !imageAlt) {
      toast({
        title: 'Ошибка',
        description: 'Заполните URL и описание фотографии',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(PHOTOS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: imageUrl, alt: imageAlt })
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Фотография добавлена'
        });
        setImageUrl('');
        setImageAlt('');
        loadPhotos();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось добавить фотографию',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
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
          <h1 className="text-5xl font-light">Управление фотографиями</h1>
          <div className="flex gap-2">
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
            <CardTitle className="text-2xl font-light">Добавить фотографию</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Загрузить файл</label>
              <div className="flex gap-4 items-center">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                  className="flex-1"
                />
                {uploadingFile && <span className="text-sm text-muted-foreground">Загрузка...</span>}
              </div>
            </div>

            {imageUrl && (
              <div>
                <label className="block text-sm font-medium mb-2">Предпросмотр</label>
                <img src={imageUrl} alt="Preview" className="w-48 h-48 object-cover rounded-lg" />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Или введите URL изображения</label>
              <Input
                placeholder="https://example.com/photo.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Описание фотографии</label>
              <Input
                placeholder="Например: Алексей и Дарья"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
              />
            </div>

            <Button 
              onClick={addPhoto} 
              disabled={loading || !imageUrl || !imageAlt}
              className="w-full"
            >
              <Icon name="Plus" size={20} className="mr-2" />
              Добавить фотографию
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