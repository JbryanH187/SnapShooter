import { protocol, app, net } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { pathToFileURL } from 'url';

export function registerMediaProtocol() {
    protocol.handle('media', async (request) => {
        try {
            let clean = request.url.replace(/^media:\/\//i, '');
            // Strip leading / trailing slashes and query strings
            clean = clean.replace(/^[/\\]+/, '').replace(/[/\\]+$/, '');
            clean = clean.split('?')[0].split('#')[0];
            const decodedPath = decodeURIComponent(clean);

            const userDataPath = app.getPath('userData');
            const capturesDir = path.join(userDataPath, 'captures');
            const flowsDir = path.join(userDataPath, 'flows');

            // 1. Try Captures Directory
            const capturesPath = path.normalize(path.join(capturesDir, decodedPath));
            if (fs.existsSync(capturesPath) && fs.statSync(capturesPath).isFile()) {
                return net.fetch(pathToFileURL(capturesPath).toString());
            }

            // 1b. Try just the filename in Captures Directory
            const filenameOnly = path.basename(decodedPath);
            const flatCapturesPath = path.normalize(path.join(capturesDir, filenameOnly));
            if (fs.existsSync(flatCapturesPath) && fs.statSync(flatCapturesPath).isFile()) {
                return net.fetch(pathToFileURL(flatCapturesPath).toString());
            }

            // 2. Try Flows Directory
            const flowsPath = path.normalize(path.join(flowsDir, decodedPath));
            if (fs.existsSync(flowsPath) && fs.statSync(flowsPath).isFile()) {
                return net.fetch(pathToFileURL(flowsPath).toString());
            }

            // 3. Try directly as absolute path
            if (fs.existsSync(decodedPath) && fs.statSync(decodedPath).isFile()) {
                return net.fetch(pathToFileURL(decodedPath).toString());
            }

            console.warn(`[MediaProtocol] File not found: "${decodedPath}" in "${capturesDir}" or "${flowsDir}"`);
            return new Response('Not Found', { status: 404 });
        } catch (err) {
            console.error('[MediaProtocol] Error handling media request:', request.url, err);
            return new Response('Error', { status: 500 });
        }
    });
}

