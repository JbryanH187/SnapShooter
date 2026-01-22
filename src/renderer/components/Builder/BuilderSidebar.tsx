import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import {
    LayoutTemplate, Image as ImageIcon, Type, Grid, SeparatorHorizontal,
    Scissors, Table as TableIcon, Camera, FileText, List, Flag,
    ChevronDown, ChevronRight, Square, Circle, Triangle, Waves
} from 'lucide-react';
import { BlockType, DecorationType } from '../../../shared/types';

// --- Sidebar Item (Blocks) ---
interface SidebarItemProps {
    type: BlockType;
    label: string;
    icon: React.ElementType;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ type, label, icon: Icon }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: `sidebar-${type}`,
        data: {
            type: type,
            isSidebar: true,
            isDecoration: false
        }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={{
                ...style,
                background: 'var(--fill-secondary)',
                borderColor: 'var(--separator-opaque)',
                color: 'var(--label-primary)'
            }}
            {...listeners}
            {...attributes}
            className="flex items-center gap-3 p-3 mb-2 rounded-xl border shadow-sm cursor-grab active:cursor-grabbing transition-all hover:brightness-95 dark:hover:brightness-110"
        >
            <div className="p-2 rounded-lg" style={{ background: 'color-mix(in srgb, var(--system-blue) 15%, transparent)', color: 'var(--system-blue)' }}>
                <Icon size={18} />
            </div>
            <span className="font-medium text-sm">{label}</span>
        </div>
    );
};

// --- Decoration Item (Backgrounds) ---
interface DecorationItemProps {
    type: DecorationType;
    label: string;
    icon: React.ElementType;
}

const DecorationItem: React.FC<DecorationItemProps> = ({ type, label, icon: Icon }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: `decoration-${type}`,
        data: {
            type: type,
            isSidebar: true,
            isDecoration: true
        }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={{
                ...style,
                background: 'var(--fill-secondary)',
                borderColor: 'var(--separator-opaque)',
                color: 'var(--label-primary)'
            }}
            {...listeners}
            {...attributes}
            className="flex items-center gap-3 p-3 mb-2 rounded-xl border shadow-sm cursor-grab active:cursor-grabbing transition-all hover:brightness-95 dark:hover:brightness-110"
        >
            <div className="p-2 rounded-lg" style={{ background: 'color-mix(in srgb, var(--system-purple) 15%, transparent)', color: 'var(--system-purple)' }}>
                <Icon size={18} />
            </div>
            <span className="font-medium text-sm">{label}</span>
        </div>
    );
};


// --- Collapsible Section ---
interface SidebarSectionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

const SidebarSection: React.FC<SidebarSectionProps> = ({ title, children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="mb-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full mb-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
                <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--label-secondary)' }}>
                    {title}
                </h4>
                {isOpen ? <ChevronDown size={14} style={{ color: 'var(--label-tertiary)' }} /> : <ChevronRight size={14} style={{ color: 'var(--label-tertiary)' }} />}
            </button>
            {isOpen && (
                <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
                    {children}
                </div>
            )}
        </div>
    );
};

export const BuilderSidebar: React.FC = () => {
    return (
        <div className="pb-4">
            <SidebarSection title="Structure">
                <SidebarItem type="header" label="Header" icon={LayoutTemplate} />
                <SidebarItem type="footer" label="Footer" icon={SeparatorHorizontal} />
                <SidebarItem type="page-break" label="Page Break" icon={Scissors} />
            </SidebarSection>

            <SidebarSection title="Content">
                <SidebarItem type="text" label="Text Block" icon={Type} />
                <SidebarItem type="logo" label="Logo Image" icon={ImageIcon} />
                <SidebarItem type="table" label="Table (nXn)" icon={TableIcon} />
                <SidebarItem type="grid" label="Image Grid" icon={Grid} />
            </SidebarSection>

            <SidebarSection title="Evidence">
                <SidebarItem type="evidence" label="Evidence Loop" icon={Camera} />
            </SidebarSection>

            <SidebarSection title="Decorations ('Monerias')">
                <DecorationItem type="square" label="Square" icon={Square} />
                <DecorationItem type="circle" label="Circle" icon={Circle} />
                <DecorationItem type="triangle" label="Triangle" icon={Triangle} />
                <DecorationItem type="wave_decoration" label="Wave Pattern" icon={Waves} />
            </SidebarSection>

            <SidebarSection title="Sections">
                <SidebarItem type="summary" label="Summary" icon={FileText} />
                <SidebarItem type="toc" label="Index (TOC)" icon={List} />
                <SidebarItem type="conclusion" label="Conclusion" icon={Flag} />
            </SidebarSection>
        </div>
    );
};
