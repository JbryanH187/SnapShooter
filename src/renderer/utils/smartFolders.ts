import { CaptureItem } from '../../shared/types';

/**
 * Predicate function type for filtering captures
 */
export type CaptureFilterPredicate = (capture: CaptureItem) => boolean;

/**
 * Smart Folder definition
 */
export interface SmartFolder {
    id: string;
    name: string;
    icon: string; // Lucide icon name
    description: string;
    predicate: CaptureFilterPredicate;
    color?: string; // Optional accent color
}

/**
 * Get start of today in timestamp
 */
const getStartOfToday = (): number => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.getTime();
};

/**
 * Get start of this week (Monday) in timestamp
 */
const getStartOfWeek = (): number => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    now.setDate(diff);
    now.setHours(0, 0, 0, 0);
    return now.getTime();
};

/**
 * Predefined Smart Folders
 */
export const SMART_FOLDERS: SmartFolder[] = [
    {
        id: 'today',
        name: 'Hoy',
        icon: 'CalendarDays',
        description: 'Capturas tomadas hoy',
        color: '#3b82f6', // blue-500
        predicate: (capture) => capture.timestamp >= getStartOfToday()
    },
    {
        id: 'this-week',
        name: 'Esta Semana',
        icon: 'Calendar',
        description: 'Capturas de esta semana',
        color: '#8b5cf6', // violet-500
        predicate: (capture) => capture.timestamp >= getStartOfWeek()
    },
    {
        id: 'pending',
        name: 'Pendientes',
        icon: 'Clock',
        description: 'Capturas sin revisar',
        color: '#f59e0b', // amber-500
        predicate: (capture) => capture.status === 'pending' || !capture.status
    },
    {
        id: 'success',
        name: 'Éxitos',
        icon: 'CheckCircle2',
        description: 'Capturas marcadas como éxito',
        color: '#22c55e', // green-500
        predicate: (capture) => capture.status === 'success'
    },
    {
        id: 'failures',
        name: 'Fallos',
        icon: 'XCircle',
        description: 'Capturas marcadas como fallo',
        color: '#ef4444', // red-500
        predicate: (capture) => capture.status === 'failure'
    },
    {
        id: 'untitled',
        name: 'Sin Título',
        icon: 'FileQuestion',
        description: 'Capturas sin título',
        color: '#6b7280', // gray-500
        predicate: (capture) => !capture.title || capture.title.trim() === ''
    },
    {
        id: 'recent-hour',
        name: 'Última Hora',
        icon: 'Clock3',
        description: 'Capturas de la última hora',
        color: '#06b6d4', // cyan-500
        predicate: (capture) => capture.timestamp >= Date.now() - 60 * 60 * 1000
    }
];

/**
 * Get a smart folder by ID
 */
export const getSmartFolderById = (id: string): SmartFolder | undefined => {
    return SMART_FOLDERS.find(folder => folder.id === id);
};

/**
 * Apply a smart folder filter to captures
 */
export const filterCapturesBySmartFolder = (
    captures: CaptureItem[],
    folderId: string
): CaptureItem[] => {
    const folder = getSmartFolderById(folderId);
    if (!folder) return captures;
    return captures.filter(folder.predicate);
};
