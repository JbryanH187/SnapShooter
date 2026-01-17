import { create } from 'zustand';

export interface CustomTemplate {
    id: string;
    name: string;
    description?: string;
    createdAt: number;
    updatedAt: number;

    // Layout
    captureOrder: string[]; // IDs in custom order
    layout: 'grid' | 'list' | 'masonry';
    columnsPerRow: number;

    // Styling
    coverStyle: 'minimal' | 'bold' | 'image';
    colorPalette: {
        primary: string;
        secondary: string;
        accent: string;
        text: string;
    };
    fontFamily: 'Inter' | 'Roboto' | 'Montserrat' | 'System';
    spacing: 'compact' | 'normal' | 'spacious';

    // Content
    showTimestamps: boolean;
    showDescriptions: boolean;
    showStepNumbers: boolean;
    includeTableOfContents: boolean;

    // Metadata
    isDefault: boolean;
}

interface TemplateBuilderState {
    currentTemplate: CustomTemplate | null;
    savedTemplates: CustomTemplate[];

    // Actions
    createNewTemplate: () => void;
    loadTemplate: (id: string) => void;
    updateTemplate: (updates: Partial<CustomTemplate>) => void;
    saveTemplate: () => Promise<void>;
    deleteTemplate: (id: string) => void;
    setAsDefault: (id: string) => void;
}

export const useTemplateBuilderStore = create<TemplateBuilderState>((set, get) => ({
    currentTemplate: null,
    savedTemplates: [],

    createNewTemplate: () => {
        const newTemplate: CustomTemplate = {
            id: `custom-${Date.now()}`,
            name: 'Untitled Template',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            captureOrder: [],
            layout: 'grid',
            columnsPerRow: 2,
            coverStyle: 'minimal',
            colorPalette: {
                primary: '#3b82f6',
                secondary: '#6366f1',
                accent: '#f59e0b',
                text: '#1f2937'
            },
            fontFamily: 'Inter',
            spacing: 'normal',
            showTimestamps: true,
            showDescriptions: true,
            showStepNumbers: true,
            includeTableOfContents: true,
            isDefault: false
        };

        set({ currentTemplate: newTemplate });
    },

    loadTemplate: (id: string) => {
        const template = get().savedTemplates.find(t => t.id === id);
        if (template) {
            set({ currentTemplate: { ...template } });
        }
    },

    updateTemplate: (updates: Partial<CustomTemplate>) => {
        const current = get().currentTemplate;
        if (!current) return;

        set({
            currentTemplate: {
                ...current,
                ...updates,
                updatedAt: Date.now()
            }
        });
    },

    saveTemplate: async () => {
        const template = get().currentTemplate;
        if (!template) return;

        const existing = get().savedTemplates.find(t => t.id === template.id);

        if (existing) {
            // Update existing
            set({
                savedTemplates: get().savedTemplates.map(t =>
                    t.id === template.id ? template : t
                )
            });
        } else {
            // Add new
            set({
                savedTemplates: [...get().savedTemplates, template]
            });
        }

        // TODO: Persist to storage
        await window.electron?.saveCustomTemplate?.(template);
    },

    deleteTemplate: (id: string) => {
        set({
            savedTemplates: get().savedTemplates.filter(t => t.id !== id)
        });

        // TODO: Delete from storage
        window.electron?.deleteCustomTemplate?.(id);
    },

    setAsDefault: (id: string) => {
        set({
            savedTemplates: get().savedTemplates.map(t => ({
                ...t,
                isDefault: t.id === id
            }))
        });
    }
}));
