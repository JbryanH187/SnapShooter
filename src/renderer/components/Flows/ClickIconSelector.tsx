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
        <div
            className="flex p-1 rounded-lg border"
            style={{
                background: 'var(--fill-secondary)',
                borderColor: 'var(--separator-opaque)'
            }}
        >
            {options.map((option) => (
                <Tooltip key={option.id} text={option.label}>
                    <button
                        onClick={() => onChange(option.id)}
                        className="p-2 rounded-md transition-all"
                        style={value === option.id ? {
                            background: 'var(--system-background)',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            color: 'var(--system-orange)'
                        } : {
                            color: 'var(--label-tertiary)'
                        }}
                        onMouseEnter={(e) => { if (value !== option.id) e.currentTarget.style.color = 'var(--label-secondary)'; }}
                        onMouseLeave={(e) => { if (value !== option.id) e.currentTarget.style.color = 'var(--label-tertiary)'; }}
                        title={option.label}
                    >
                        <option.icon size={18} className={value === option.id ? 'stroke-[2.5px]' : ''} />
                    </button>
                </Tooltip>
            ))}
        </div>
    );
};
