import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Copy, Trash2 } from 'lucide-react';
import type { CardTemplate } from '@/lib/supabase';

interface CardListProps {
  cards: CardTemplate[];
  selectedCardId: string | null;
  onSelectCard: (id: string) => void;
  onCreateCard: () => void;
  onDuplicateCard: (id: string) => void;
  onDeleteCard: (id: string) => void;
}

function SortableCard({
  card,
  isSelected,
  onSelect,
  onDuplicate,
  onDelete,
}: {
  card: CardTemplate;
  isSelected: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getCardTypeColor = (type: string) => {
    switch (type) {
      case 'form':
        return 'bg-blue-100 text-blue-700';
      case 'calculation':
        return 'bg-green-100 text-green-700';
      case 'info':
        return 'bg-yellow-100 text-yellow-700';
      case 'submit':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        border rounded-lg p-3 mb-2 cursor-pointer transition-all
        ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}
      `}
      onClick={onSelect}
    >
      <div className="flex items-start gap-2">
        <div
          className="mt-1 cursor-move text-gray-400 hover:text-gray-600"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2 py-0.5 rounded ${getCardTypeColor(card.type)}`}
            >
              {card.type}
            </span>
            <span className="text-xs text-gray-500">#{card.display_order}</span>
          </div>
          <h3 className="font-medium text-sm mt-1 truncate">
            {card.title || 'Untitled'}
          </h3>
          <p className="text-xs text-gray-500 truncate">{card.name}</p>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={e => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="p-1 hover:bg-gray-100 rounded"
            title="Duplicate"
          >
            <Copy className="w-3 h-3 text-gray-500" />
          </button>
          <button
            onClick={e => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 hover:bg-red-50 rounded"
            title="Delete"
          >
            <Trash2 className="w-3 h-3 text-red-500" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function CardList({
  cards,
  selectedCardId,
  onSelectCard,
  onCreateCard,
  onDuplicateCard,
  onDeleteCard,
}: CardListProps) {
  return (
    <div className="w-96 border-r bg-gray-50 overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Cards</h2>
          <button
            onClick={onCreateCard}
            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Card
          </button>
        </div>

        <div>
          {cards.map(card => (
            <SortableCard
              key={card.id}
              card={card}
              isSelected={selectedCardId === card.id}
              onSelect={() => onSelectCard(card.id)}
              onDuplicate={() => onDuplicateCard(card.id)}
              onDelete={() => onDeleteCard(card.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
