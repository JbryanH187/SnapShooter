import { screen } from 'electron';
import os from 'os';

export interface SystemMetadata {
    os: string;
    resolution: string;
    timestamp: number;
    // activeWindow? could be added with 'active-win' package if we had it installed
}

export class MetadataCollector {
    static async collect(): Promise<SystemMetadata> {
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width, height } = primaryDisplay.size;

        return {
            os: `${os.type()} ${os.release()} (${os.arch()})`,
            resolution: `${width}x${height}`,
            timestamp: Date.now()
        };
    }
}
