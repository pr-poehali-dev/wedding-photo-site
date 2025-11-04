import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface Video {
  id: number;
  title: string;
  url: string | null;
  display_order: number;
}

interface VideoManagementProps {
  videos: Video[];
  onUpdateVideo: (id: number, url: string | null) => Promise<void>;
}

export default function VideoManagement({ videos, onUpdateVideo }: VideoManagementProps) {
  const [editingVideo, setEditingVideo] = useState<number | null>(null);
  const [videoUrl, setVideoUrl] = useState('');

  const handleSave = async (videoId: number) => {
    await onUpdateVideo(videoId, videoUrl);
    setEditingVideo(null);
    setVideoUrl('');
  };

  const handleDelete = async (videoId: number) => {
    if (confirm('Удалить это видео?')) {
      await onUpdateVideo(videoId, null);
    }
  };

  return (
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
                        placeholder="YouTube или VK ссылка (например: https://vk.com/video-123_456)"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Поддерживаются: YouTube (youtube.com, youtu.be) и VK видео
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSave(video.id)}>
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
                        onClick={() => handleDelete(video.id)}
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
  );
}