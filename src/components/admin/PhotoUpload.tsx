import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface PhotoUploadProps {
  onPhotosUploaded: () => void;
  photosApi: string;
}

export default function PhotoUpload({ onPhotosUploaded, photosApi }: PhotoUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

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
      description: `Выбрано ${imageFiles.length} фото. Нажмите "Загрузить" для добавления`
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

        console.log(`Загрузка ${file.name}...`);
        
        const response = await fetch(photosApi, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            url: base64, 
            alt: file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')
          })
        });

        const result = await response.json();
        console.log(`Ответ для ${file.name}:`, result);

        if (response.ok && result.success) {
          uploaded++;
          setUploadProgress(Math.round((uploaded / total) * 100));
        } else {
          console.error(`Ошибка для ${file.name}:`, result);
          toast({
            title: `Ошибка: ${file.name}`,
            description: result.error || 'Неизвестная ошибка',
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error('Ошибка загрузки:', error);
        toast({
          title: `Ошибка: ${file.name}`,
          description: error instanceof Error ? error.message : 'Ошибка сети',
          variant: 'destructive'
        });
      }
    }

    setUploading(false);
    setSelectedFiles([]);
    setUploadProgress(0);
    onPhotosUploaded();
    
    toast({
      title: 'Готово!',
      description: `Загружено ${uploaded} из ${total} фотографий`
    });
  };

  return (
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
  );
}