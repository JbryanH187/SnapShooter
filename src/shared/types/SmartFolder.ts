export interface CaptureItem {
    id: string;
    timestamp: number;
    title?: string;
    description?: string;
    status: 'pending' | 'success' | 'failure';
    path?: string;
    flowId?: string;
}

/**
 * Smart Folder - Auto-organizing virtual folder based on predicates
 * Inspired by macOS Smart Folders
 */

export type PredicateField = 'status' | 'date' | 'title' | 'description' | 'hasFlow' | 'flowId';
export type PredicateOperator = 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'exists' | 'notExists';

export interface Predicate {
    field: PredicateField;
    operator: PredicateOperator;
    value?: any;
}

export interface SmartFolder {
    id: string;
    name: string;
    icon: string; // Lucide icon name
    color?: string; // Tailwind color class
    predicates: Predicate[];
    isPredefined: boolean;
}

/**
 * Evaluate a single predicate against a capture
 */
export function evaluatePredicate(capture: CaptureItem, predicate: Predicate): boolean {
    const { field, operator, value } = predicate;

    switch (field) {
        case 'status':
            if (operator === 'equals') return capture.status === value;
            break;

        case 'title':
            const title = capture.title || '';
            if (operator === 'contains') return title.toLowerCase().includes(value.toLowerCase());
            if (operator === 'equals') return title === value;
            break;

        case 'description':
            const desc = capture.description || '';
            if (operator === 'contains') return desc.toLowerCase().includes(value.toLowerCase());
            break;

        case 'date':
            const captureDate = new Date(capture.timestamp);
            const now = new Date();

            if (operator === 'greaterThan') {
                // Date is after a certain point
                const compareDate = new Date(value);
                return captureDate > compareDate;
            }

            if (operator === 'equals') {
                // Special date ranges
                if (value === 'today') {
                    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
                    return captureDate >= startOfToday;
                }
                if (value === 'week') {
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    return captureDate >= weekAgo;
                }
                if (value === 'month') {
                    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    return captureDate >= monthAgo;
                }
            }
            break;

        case 'hasFlow':
            const hasFlow = capture.flowId != null && capture.flowId !== '';
            if (operator === 'equals') return hasFlow === value;
            if (operator === 'exists') return hasFlow;
            if (operator === 'notExists') return !hasFlow;
            break;

        case 'flowId':
            if (operator === 'equals') return capture.flowId === value;
            break;

        default:
            return false;
    }

    return false;
}

/**
 * Evaluate all predicates (AND logic)
 */
export function matchesSmartFolder(capture: CaptureItem, folder: SmartFolder): boolean {
    return folder.predicates.every(predicate => evaluatePredicate(capture, predicate));
}

/**
 * Predefined Smart Folders
 */
export const PREDEFINED_SMART_FOLDERS: SmartFolder[] = [
    {
        id: 'today',
        name: 'Today',
        icon: 'Calendar',
        color: 'text-blue-500',
        isPredefined: true,
        predicates: [
            { field: 'date', operator: 'equals', value: 'today' }
        ]
    },
    {
        id: 'this-week',
        name: 'This Week',
        icon: 'CalendarDays',
        color: 'text-purple-500',
        isPredefined: true,
        predicates: [
            { field: 'date', operator: 'equals', value: 'week' }
        ]
    },
    {
        id: 'successes',
        name: 'Successes',
        icon: 'CheckCircle',
        color: 'text-green-500',
        isPredefined: true,
        predicates: [
            { field: 'status', operator: 'equals', value: 'success' }
        ]
    },
    {
        id: 'failures',
        name: 'Failures',
        icon: 'XCircle',
        color: 'text-red-500',
        isPredefined: true,
        predicates: [
            { field: 'status', operator: 'equals', value: 'failure' }
        ]
    },
    {
        id: 'unassigned',
        name: 'Unassigned',
        icon: 'FolderOpen',
        color: 'text-gray-500',
        isPredefined: true,
        predicates: [
            { field: 'hasFlow', operator: 'notExists' }
        ]
    }
];
