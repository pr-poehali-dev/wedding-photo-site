import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const MIGRATE_API = 'https://functions.poehali.dev/1ee4c401-48ca-4a11-987a-cde5d88421d1';

interface Photo {
  id: number;
  has_url: number;
  has_thumbnail: number;
  alt: string;
  cdn_full_url: string | null;
  cdn_thumbnail_url: string | null;
}

export default function MigratePhotos() {
  const [apiKey, setApiKey] = useState('39c7a0f5b0e9c9f641ec878c97f69e26');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<{ message: string; type: 'info' | 'success' | 'error' }[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);

  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message: `[${timestamp}] ${message}`, type }]);
  };

  const testConnection = async () => {
    if (!apiKey.trim()) {
      alert('Введите API ключ!');
      return;
    }

    addLog('Проверка подключения к API...', 'info');
    
    const testImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    try {
      const formData = new FormData();
      formData.append('image', testImage);
      
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        addLog('✓ Подключение успешно!', 'success');
      } else {
        addLog('✗ Ошибка API: ' + response.statusText, 'error');
      }
    } catch (error) {
      addLog('✗ Ошибка подключения: ' + (error as Error).message, 'error');
    }
  };

  const startMigration = async () => {
    if (!apiKey.trim()) {
      alert('Введите API ключ!');
      return;
    }

    setLoading(true);
    setProgress(0);
    
    addLog('Начало миграции...', 'info');
    addLog('Загрузка списка фотографий из базы...', 'info');

    try {
      const response = await fetch(MIGRATE_API, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      const photosToMigrate = data.photos || [];
      setPhotos(photosToMigrate);
      addLog(`Найдено ${photosToMigrate.length} фото для миграции`, 'info');
      
      for (let i = 0; i < photosToMigrate.length; i++) {
        const photo = photosToMigrate[i];
        const currentProgress = Math.round(((i + 1) / photosToMigrate.length) * 100);
        setProgress(currentProgress);
        
        addLog(`Загрузка фото ID ${photo.id}: ${photo.alt}...`, 'info');
        
        try {
          const uploadResponse = await fetch(MIGRATE_API, {
            method: 'POST',
            mode: 'cors',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              api_key: apiKey,
              photo_id: photo.id
            })
          });
          
          const result = await uploadResponse.json();
          
          if (result.success) {
            addLog(`✓ Фото ID ${photo.id} загружено на CDN`, 'success');
          } else {
            addLog(`✗ Ошибка для фото ID ${photo.id}: ${result.error || 'Unknown'}`, 'error');
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          addLog(`✗ Ошибка загрузки фото ID ${photo.id}: ${(error as Error).message}`, 'error');
        }
      }
      
      addLog('🎉 Миграция завершена!', 'success');
      setProgress(100);
      
    } catch (error) {
      addLog('✗ Ошибка: ' + (error as Error).message, 'error');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/20 to-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-light mb-6">🚀 Миграция фотографий на CDN</h1>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <p className="font-semibold">⚠️ Внимание!</p>
            <p className="text-sm mt-2">
              Эта утилита перенесёт все фотографии из base64 формата в базе данных на внешний CDN (imgbb.com).
              Процесс может занять несколько минут.
            </p>
          </div>

          <div className="space-y-6">
            <div className="border-l-4 border-green-500 bg-gray-50 p-4">
              <h3 className="font-semibold mb-3">Шаг 1: Получить API ключ</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Перейдите на <a href="https://api.imgbb.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">imgbb.com/api</a></li>
                <li>Получите бесплатный API ключ (5000 загрузок/день)</li>
                <li>Введите ключ ниже:</li>
              </ol>
              <Input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Вставьте API ключ"
                className="mt-3"
                disabled={loading}
              />
            </div>

            <div className="border-l-4 border-green-500 bg-gray-50 p-4">
              <h3 className="font-semibold mb-3">Шаг 2: Запуск миграции</h3>
              <div className="flex gap-3">
                <Button 
                  onClick={startMigration} 
                  disabled={loading || !apiKey.trim()}
                >
                  {loading ? 'Миграция...' : 'Начать миграцию'}
                </Button>
                <Button 
                  onClick={testConnection} 
                  variant="outline"
                  disabled={loading || !apiKey.trim()}
                >
                  Тест подключения
                </Button>
              </div>
            </div>

            {loading && (
              <div className="bg-blue-50 p-4 rounded">
                <div className="flex justify-between text-sm mb-2">
                  <span>Обработка фото...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-green-500 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {logs.length > 0 && (
              <div className="bg-gray-50 p-4 rounded max-h-96 overflow-y-auto font-mono text-sm">
                {logs.map((log, idx) => (
                  <div 
                    key={idx} 
                    className={`py-1 ${
                      log.type === 'success' ? 'text-green-600' :
                      log.type === 'error' ? 'text-red-600' :
                      'text-blue-600'
                    }`}
                  >
                    {log.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}