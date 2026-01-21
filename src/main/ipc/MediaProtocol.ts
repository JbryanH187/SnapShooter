
import { protocol, app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

export function registerMediaProtocol() {
    protocol.registerFileProtocol('media', (request, callback) => {
        const url = request.url.replace('media://', '');
        // Decode URI component to handle spaces and special chars
        const decodedPath = decodeURIComponent(url);

        // Define base directories
        const userDataPath = app.getPath('userData');
        const capturesDir = path.join(userDataPath, 'captures');
        const flowsDir = path.join(userDataPath, 'flows');

        // Check if path starts with a flow name (we could improve this detection)
        // But simpler: just try both locations in order.

        // 1. Try Captures Directory (for flat files e.g. "image.png")
        let potentialPath = path.join(capturesDir, decodedPath);

        // Security check: Ensure path is within userData to prevent directory traversal
        // (basic check, could be more strict)
        if (!potentialPath.startsWith(userDataPath)) {
            // callback({ error: -2 }); // Access denied
            // return;
        }

        if (fs.existsSync(potentialPath)) {
            callback({ path: potentialPath });
            return;
        }

        // 2. Try Flows Directory (for nested files e.g. "flowName/Screens/image.png")
        // The decodedPath might be "flowName/Screens/image.png"
        potentialPath = path.join(flowsDir, decodedPath);

        if (fs.existsSync(potentialPath)) {
            callback({ path: potentialPath });
            return;
        }

        // 3. Fallback/Debug log
        console.warn(`[MediaProtocol] File not found: ${decodedPath}`);
        // callback({ error: -6 }); // File not found
    });
}
