import { useMemo } from 'react';
import { useCaptureStore } from '../stores/captureStore';
import { SmartFolder, matchesSmartFolder, PREDEFINED_SMART_FOLDERS } from '../../shared/types/SmartFolder';
import { CaptureItem } from '../../shared/types';
import { logger } from '../services/Logger';

/**
 * Hook for Smart Folders functionality
 * Computes folder contents on-demand with memoization
 */
export const useSmartFolders = () => {
    const { captures } = useCaptureStore();

    // Get all smart folders (predefined + custom in future)
    const smartFolders = useMemo(() => {
        return PREDEFINED_SMART_FOLDERS;
    }, []);

    // Compute captures for a specific folder
    const getSmartFolderCaptures = useMemo(() => {
        return (folderId: string): CaptureItem[] => {
            const folder = smartFolders.find(f => f.id === folderId);
            if (!folder) {
                logger.warn('UI', `Smart folder not found: ${folderId}`);
                return [];
            }

            const matching = captures.filter(capture => matchesSmartFolder(capture, folder));

            logger.debug('UI', `Smart folder "${folder.name}" matched ${matching.length} captures`, {
                folderId,
                totalCaptures: captures.length,
                matchedCount: matching.length
            });

            return matching;
        };
    }, [captures, smartFolders]);

    // Get counts for all folders (for badges)
    const folderCounts = useMemo(() => {
        const counts: Record<string, number> = {};

        smartFolders.forEach(folder => {
            counts[folder.id] = captures.filter(capture =>
                matchesSmartFolder(capture, folder)
            ).length;
        });

        return counts;
    }, [captures, smartFolders]);

    // Get a specific folder by ID
    const getFolder = (folderId: string): SmartFolder | undefined => {
        return smartFolders.find(f => f.id === folderId);
    };

    return {
        smartFolders,
        getSmartFolderCaptures,
        folderCounts,
        getFolder
    };
};
