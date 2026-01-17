import React from 'react';
import { Hand, Target, Circle, MousePointer2 } from 'lucide-react';
import { Tooltip } from '../UI/Tooltip';

export type ClickStyle = 'hand' | 'target' | 'dot' | 'mouse';

interface ClickIconSelectorProps {
    value: ClickStyle;
    onChange: (style: ClickStyle) => void;
}

export const ClickIconSelector: React.FC<ClickIconSelectorProps> = ({ value, onChange }) => {
    const options: { id: ClickStyle; icon: React.ElementType; label: string }[] = [
        { id: 'hand', icon: Hand, label: 'Hand' },
        { id: 'target', icon: Target, label: 'Target' },
        { id: 'dot', icon: Circle, label: 'Dot' },
        { id: 'mouse', icon: MousePointer2, label: 'Mouse' }
    ];

    return (
        <div className="flex bg-gray-100 dark:bg-gray-700/50 p-1 rounded-lg border border-gray-200 dark:border-gray-600">
            {options.map((option) => (
                <Tooltip key={option.id} text={option.label}>
                    <button
                        onClick={() => onChange(option.id)}
                        className={`p-2 rounded-md transition-all ${value === option.id
                            ? 'bg-white dark:bg-gray-600 shadow-sm text-amber-600 dark:text-amber-400'
                            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                            }`}
                        title={option.label}
                    >
                        <option.icon size={18} className={value === option.id ? 'stroke-[2.5px]' : ''} />
                    </button>
                </Tooltip>
            ))}
        </div>
    );
};
