import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const PHOTOS_API = 'https://functions.poehali.dev/033e2359-06e3-4d1b-829c-b250c1c918af';

interface Photo {
  id: number;
  url: string;
  alt: string;
  display_order: number;
}

export default function Admin() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const { toast } = useToast();

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
    loadPhotos();
  }, []);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 via-white to-secondary/20 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-5xl font-light">Управление фотографиями</h1>
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            <Icon name="Home" size={20} className="mr-2" />
            На главную
          </Button>
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
            <CardTitle className="text-2xl font-light">Все фотографии ({photos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.url}
                    alt={photo.alt}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-2 p-4">
                    <p className="text-white text-sm text-center">{photo.alt}</p>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deletePhoto(photo.id)}
                    >
                      <Icon name="Trash2" size={16} className="mr-2" />
                      Удалить
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
