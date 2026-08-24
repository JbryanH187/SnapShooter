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

        // 1. Try Captures Directory (for flat files e.g. "image.png")
        let potentialPath = path.normalize(path.join(capturesDir, decodedPath));

        // Security check: Ensure path is within userData to prevent directory traversal
        if (!potentialPath.startsWith(userDataPath)) {
            console.error(`[MediaProtocol] BLOCKED directory traversal attempt: ${decodedPath}`);
            callback({ error: -2 }); // Access denied
            return;
        }

        if (fs.existsSync(potentialPath)) {
            callback({ path: potentialPath });
            return;
        }

        // 2. Try Flows Directory (for nested files e.g. "flowName/Screens/image.png")
        potentialPath = path.normalize(path.join(flowsDir, decodedPath));

        if (!potentialPath.startsWith(userDataPath)) {
            console.error(`[MediaProtocol] BLOCKED directory traversal attempt: ${decodedPath}`);
            callback({ error: -2 }); // Access denied
            return;
        }

        if (fs.existsSync(potentialPath)) {
            callback({ path: potentialPath });
            return;
        }

        // 3. Fallback/Debug log
        console.warn(`[MediaProtocol] File not found: ${decodedPath}`);
        callback({ error: -6 }); // File not found
    });
}
