import React from 'react';

interface RevealConditionsEditorProps {
  conditions: any[];
  currentCardIndex: number;
  onChange: (conditions: any[]) => void;
}

export function RevealConditionsEditor({
  conditions,
  currentCardIndex,
  onChange,
}: RevealConditionsEditorProps) {
  const condition = conditions[0] || { type: 'always' };

  const handleChange = (type: string) => {
    if (type === 'always') {
      onChange([]);
    } else if (type === 'previous_complete') {
      onChange([
        {
          type: 'card_complete',
          target: [`card_${currentCardIndex - 1}`],
        },
      ]);
    }
  };

  return (
    <div className="space-y-2">
      <select
        value={
          condition.type === 'card_complete'
            ? 'previous_complete'
            : condition.type
        }
        onChange={e => handleChange(e.target.value)}
        className="w-full p-2 border rounded text-sm"
      >
        <option value="always">Always show</option>
        <option value="previous_complete">
          When previous card is complete
        </option>
      </select>
    </div>
  );
}
