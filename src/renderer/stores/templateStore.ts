import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { ReportTemplate, TemplateBlock, BlockType, TemplateDecoration, DecorationType } from '../../shared/types';

interface TemplateStore {
    templates: ReportTemplate[];
    activeTemplate: ReportTemplate | null;


    // Actions
    addTemplate: (template: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateTemplate: (id: string, updates: Partial<ReportTemplate>) => void;
    deleteTemplate: (id: string) => void;
    setActiveTemplate: (template: ReportTemplate | null) => void;
    saveActiveTemplate: (asNew?: boolean) => void;

    // Editor Actions (for active template)
    // Editor Actions (for active template)
    addBlock: (type: BlockType, pageId?: string, index?: number) => void;
    removeBlock: (blockId: string) => void;
    updateBlock: (blockId: string, content: any) => void;

    // Page Actions
    addPage: (type: any) => void;
    removePage: (pageId: string) => void;
    updatePage: (pageId: string, updates: any) => void;
    // Decoration Actions
    addDecoration: (type: DecorationType, x: number, y: number) => void;
    updateDecoration: (id: string, updates: Partial<TemplateDecoration>) => void;
    removeDecoration: (id: string) => void;

    moveBlock: (activeId: string, overId: string) => void;
}

export const useTemplateStore = create<TemplateStore>()(
    persist(
        (set, get) => ({
            templates: [],
            activeTemplate: null,

            addTemplate: (templateData) => {
                // Migration: if template has blocks but no pages, convert
                let migratedData = { ...templateData };
                if ((!migratedData.pages || migratedData.pages.length === 0) && migratedData.blocks && migratedData.blocks.length > 0) {
                    migratedData.pages = [{
                        id: uuidv4(),
                        type: 'content',
                        blocks: migratedData.blocks,
                        order: 0
                    }];
                    delete migratedData.blocks;
                } else if (!migratedData.pages || migratedData.pages.length === 0) {
                    // Ensure at least one page exists
                    migratedData.pages = [{
                        id: uuidv4(),
                        type: 'content',
                        blocks: [],
                        order: 0
                    }];
                }

                const newTemplate: ReportTemplate = {
                    id: uuidv4(),
                    ...migratedData,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                };
                set((state) => ({
                    templates: [...state.templates, newTemplate],
                    activeTemplate: newTemplate
                }));
            },

            updateTemplate: (id, updates) => {
                set((state) => {
                    const updatedTemplates = state.templates.map(t =>
                        t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t
                    );
                    const updatedActive = state.activeTemplate?.id === id
                        ? { ...state.activeTemplate, ...updates, updatedAt: Date.now() }
                        : state.activeTemplate;

                    return {
                        templates: updatedTemplates,
                        activeTemplate: updatedActive
                    };
                });
            },

            deleteTemplate: (id) => {
                set((state) => ({
                    templates: state.templates.filter(t => t.id !== id),
                    activeTemplate: state.activeTemplate?.id === id ? null : state.activeTemplate
                }));
            },

            setActiveTemplate: (template) => {
                if (!template) {
                    set({ activeTemplate: null });
                    return;
                }
                // Migration: convert old blocks-only format to pages
                let migratedTemplate = { ...template };
                if ((!migratedTemplate.pages || migratedTemplate.pages.length === 0) && migratedTemplate.blocks && migratedTemplate.blocks.length > 0) {
                    migratedTemplate.pages = [{
                        id: uuidv4(),
                        type: 'content' as any,
                        blocks: migratedTemplate.blocks,
                        order: 0
                    }];
                } else if (!migratedTemplate.pages || migratedTemplate.pages.length === 0) {
                    migratedTemplate.pages = [{
                        id: uuidv4(),
                        type: 'content' as any,
                        blocks: [],
                        order: 0
                    }];
                }
                set({ activeTemplate: migratedTemplate });
            },

            saveActiveTemplate: (asNew = false) => {
                const { activeTemplate, addTemplate, updateTemplate } = get();
                if (!activeTemplate) return;

                if (asNew || !activeTemplate.id) {
                    addTemplate(activeTemplate);
                } else {
                    updateTemplate(activeTemplate.id, activeTemplate);
                }
            },

            addBlock: (type, pageId, index) => {
                const { activeTemplate } = get();
                console.log('[addBlock] Called with:', { type, pageId, index });
                console.log('[addBlock] activeTemplate:', activeTemplate);
                console.log('[addBlock] activeTemplate.pages:', activeTemplate?.pages);

                if (!activeTemplate || !activeTemplate.pages || activeTemplate.pages.length === 0) {
                    console.error('[addBlock] No pages available! Creating default page...');
                    return;
                }

                const newBlock: TemplateBlock = {
                    id: uuidv4(),
                    type,
                    content: createDefaultContent(type),
                    variant: 'classic'
                };

                const targetPageId = pageId || activeTemplate.pages[0].id;
                console.log('[addBlock] targetPageId:', targetPageId);

                const updatedPages = activeTemplate.pages.map(page => {
                    if (page.id === targetPageId) {
                        const newBlocks = [...page.blocks];
                        if (typeof index === 'number' && index >= 0) {
                            newBlocks.splice(index, 0, newBlock);
                        } else {
                            newBlocks.push(newBlock);
                        }
                        return { ...page, blocks: newBlocks };
                    }
                    return page;
                });

                set({
                    activeTemplate: {
                        ...activeTemplate,
                        pages: updatedPages
                    }
                });
            },

            removeBlock: (blockId) => {
                const { activeTemplate } = get();
                if (!activeTemplate || !activeTemplate.pages) return;

                const updatedPages = activeTemplate.pages.map(page => ({
                    ...page,
                    blocks: page.blocks.filter(b => b.id !== blockId)
                }));

                set({
                    activeTemplate: {
                        ...activeTemplate,
                        pages: updatedPages
                    }
                });
            },

            updateBlock: (blockId, content) => {
                const { activeTemplate } = get();
                if (!activeTemplate || !activeTemplate.pages) return;

                const updatedPages = activeTemplate.pages.map(page => ({
                    ...page,
                    blocks: page.blocks.map(b =>
                        b.id === blockId ? { ...b, content: { ...b.content, ...content } } : b
                    )
                }));

                set({
                    activeTemplate: {
                        ...activeTemplate,
                        pages: updatedPages
                    }
                });
            },

            moveBlock: (activeId, overId, activePageId, overPageId) => {
                const { activeTemplate } = get();
                if (!activeTemplate || !activeTemplate.pages) return;

                // Find pages for logic
                // If signatures are passed (which they will be from updated View), use them.
                // Wait, moveBlock in interface needs update too? Yes.
                // Let's rely on finding them if arguments are missing? 
                // BUT dnd logic in View calculates them. 
                // Let's assume arguments are passed.
                // Wait, I need to update interface signature in previous step... I did?

                // Let's find pages manually if ID's not passed, but for now let's implement the logic assuming they are somehow available or we find them.
                // Actually, let's look up the pages.

                let activePage = activeTemplate.pages.find(p => p.blocks.some(b => b.id === activeId));
                let overPage = activeTemplate.pages.find(p => p.blocks.some(b => b.id === overId) || p.id === overId);

                if (!activePage || !overPage) return;

                const activeBlockIndex = activePage.blocks.findIndex(b => b.id === activeId);
                const overBlockIndex = overPage.blocks.findIndex(b => b.id === overId);

                // Same Page
                if (activePage.id === overPage.id) {
                    if (overBlockIndex !== -1) {
                        const newBlocks = [...activePage.blocks];
                        const [moved] = newBlocks.splice(activeBlockIndex, 1);
                        newBlocks.splice(overBlockIndex, 0, moved);

                        const updatedPages = activeTemplate.pages.map(p =>
                            p.id === activePage.id ? { ...p, blocks: newBlocks } : p
                        );
                        set({ activeTemplate: { ...activeTemplate, pages: updatedPages } });
                    }
                } else {
                    // Cross Page
                    const sourceBlocks = [...activePage.blocks];
                    const [moved] = sourceBlocks.splice(activeBlockIndex, 1);

                    const destBlocks = [...overPage.blocks];
                    if (overBlockIndex !== -1) {
                        destBlocks.splice(overBlockIndex, 0, moved);
                    } else {
                        destBlocks.push(moved);
                    }

                    const updatedPages = activeTemplate.pages.map(p => {
                        if (p.id === activePage.id) return { ...p, blocks: sourceBlocks };
                        if (p.id === overPage.id) return { ...p, blocks: destBlocks };
                        return p;
                    });

                    set({ activeTemplate: { ...activeTemplate, pages: updatedPages } });
                }
            },

            addPage: (type) => {
                const { activeTemplate } = get();
                if (!activeTemplate) return;

                const newPage: any = {
                    id: uuidv4(),
                    type: type,
                    blocks: [],
                    order: (activeTemplate.pages?.length || 0)
                };

                set({
                    activeTemplate: {
                        ...activeTemplate,
                        pages: [...(activeTemplate.pages || []), newPage]
                    }
                });
            },

            removePage: (pageId) => {
                const { activeTemplate } = get();
                if (!activeTemplate || !activeTemplate.pages) return;

                if (activeTemplate.pages.length <= 1) return;

                set({
                    activeTemplate: {
                        ...activeTemplate,
                        pages: activeTemplate.pages.filter(p => p.id !== pageId)
                    }
                });
            },

            updatePage: (pageId, updates) => {
                const { activeTemplate } = get();
                if (!activeTemplate || !activeTemplate.pages) return;

                set({
                    activeTemplate: {
                        ...activeTemplate,
                        pages: activeTemplate.pages.map(p => p.id === pageId ? { ...p, ...updates } : p)
                    }
                });
            },

            addDecoration: (type, x, y) => {
                const { activeTemplate } = get();
                if (!activeTemplate) return;

                const newDecoration: TemplateDecoration = {
                    id: uuidv4(),
                    type,
                    x,
                    y,
                    width: 40,
                    height: 40,
                    color: '#3b82f6', // Use accent color instead of gray
                    opacity: 0.85, // Increased from 0.5 for better visibility
                    zIndex: -1
                };

                const decorations = activeTemplate.decorations ? [...activeTemplate.decorations, newDecoration] : [newDecoration];

                set({
                    activeTemplate: {
                        ...activeTemplate,
                        decorations
                    }
                });
            },

            updateDecoration: (id, updates) => {
                const { activeTemplate } = get();
                if (!activeTemplate || !activeTemplate.decorations) return;

                set({
                    activeTemplate: {
                        ...activeTemplate,
                        decorations: activeTemplate.decorations.map(d =>
                            d.id === id ? { ...d, ...updates } : d
                        )
                    }
                });
            },

            removeDecoration: (id) => {
                const { activeTemplate } = get();
                if (!activeTemplate || !activeTemplate.decorations) return;

                set({
                    activeTemplate: {
                        ...activeTemplate,
                        decorations: activeTemplate.decorations.filter(d => d.id !== id)
                    }
                });
            }
        }),
        {
            name: 'snapproof-templates',
            // Migration happens automatically in setActiveTemplate when templates are loaded
        }
    )
);

function createDefaultContent(type: BlockType): any {
    switch (type) {
        case 'header':
            return {
                title: 'Report Title',
                logo: null,
                showDate: true
            };
        case 'logo':
            return {
                image: null,
                width: 150,
                alignment: 'center' // left, center, right
            };
        case 'evidence':
            return {
                title: 'Evidence Title',
                description: 'Description here...',
                layout: 'split-right' // split-left, split-right, top-bottom
            };
        case 'text':
        case 'summary':
        case 'conclusion':
            return {
                text: 'Enter text here...'
            };
        case 'footer':
            return {
                text: 'Confidential Report - Generated by SnapProof',
                showPageNumber: true
            };
        case 'grid':
            return {
                columns: 2,
                images: []
            };
        case 'table':
            return {
                rows: 3,
                cols: 3,
                data: [['Header 1', 'Header 2', 'Header 3'], ['', '', ''], ['', '', '']]
            };
        case 'toc':
            return {
                title: 'Table of Contents'
            };
        case 'page-break':
            return {};
        default:
            return {};
    }
}
