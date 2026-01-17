import { SystemMetadata } from '../main/metadata/MetadataCollector';

export interface CaptureItem {
    id: string;
    thumbnail: string; // Base64 (fresh) or file:// URL (saved)
    timestamp: number;
    title: string;
    description: string;
    status: 'pending' | 'saved' | 'success' | 'failure';
    metadata?: SystemMetadata;
}
