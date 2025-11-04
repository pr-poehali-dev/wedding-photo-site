import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

interface Photo {
  id: number;
  url: string;
  thumbnail_url?: string;
  alt: string;
  display_order: number;
}

interface PhotoListProps {
  photos: Photo[];
  onDeletePhoto: (id: number) => Promise<void>;
  onReorderPhotos: (photos: Photo[]) => void;
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
      
      <div className="w-24 h-24 bg-muted rounded-lg overflow-hidden">
        {photo.thumbnail_url ? (
          <img 
            src={photo.thumbnail_url} 
            alt={photo.alt}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon name="Image" size={48} className="text-muted-foreground" />
          </div>
        )}
      </div>
      
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

export default function PhotoList({ photos, onDeletePhoto, onReorderPhotos }: PhotoListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = photos.findIndex((p) => p.id === active.id);
      const newIndex = photos.findIndex((p) => p.id === over.id);
      const reorderedPhotos = arrayMove(photos, oldIndex, newIndex).map((photo, index) => ({
        ...photo,
        display_order: index + 1,
      }));
      onReorderPhotos(reorderedPhotos);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-light">
          Все фотографии ({photos.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Перетаскивайте фотографии для изменения порядка
        </p>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={photos.map(p => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {photos.map((photo) => (
                <SortablePhotoItem
                  key={photo.id}
                  photo={photo}
                  onDelete={onDeletePhoto}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
}