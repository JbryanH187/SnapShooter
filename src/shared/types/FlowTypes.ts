// Types for Quick Screen Flow feature

export interface FlowCapture {
    id: string;
    imagePath: string;
    clickPosition?: { x: number; y: number }; // Percentage position for click indicator
    clickStyle?: 'hand' | 'target' | 'dot' | 'mouse'; // Style of click indicator
    title?: string;
    description?: string;
    order: number;
    createdAt: number;
}

export interface CaptureFlow {
    id: string;
    name: string;
    captures: FlowCapture[];
    createdAt: number;
    updatedAt: number;
}
