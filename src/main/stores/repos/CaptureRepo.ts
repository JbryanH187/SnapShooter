import Store from 'electron-store';
import path from 'path';
import fs from 'fs-extra';
import { CaptureItem } from '../../../shared/types';

export class CaptureRepo {
    constructor(
        private store: Store<any>,
        private capturesDir: string,
    ) {}

    async readImage(pathUrl: string): Promise<string> {
        console.log(`[CaptureRepo] readImage: ${pathUrl}`);
        if (pathUrl.startsWith('media://')) {
            const fileName = pathUrl.replace('media://', '');
            const decodedName = decodeURIComponent(fileName);
            const normalizedName = path.normalize(decodedName);

            // Try captures dir first
            const capturesPath = path.join(this.capturesDir, normalizedName);
            // Try flows dir
            const flowsDir = path.join(path.dirname(this.capturesDir), 'flows');
            const flowsPath = path.join(flowsDir, normalizedName);

            let filePath = '';
            if (fs.existsSync(capturesPath)) {
                filePath = capturesPath;
            } else if (fs.existsSync(flowsPath)) {
                filePath = flowsPath;
            } else if (fs.existsSync(normalizedName)) {
                filePath = normalizedName;
            }

            if (filePath) {
                const ext = path.extname(filePath).toLowerCase();
                let mimeType = 'image/png';
                if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
                if (ext === '.gif') mimeType = 'image/gif';
                if (ext === '.webp') mimeType = 'image/webp';

                const base64Data = await fs.readFile(filePath, { encoding: 'base64' });
                return `data:${mimeType};base64,${base64Data}`;
            } else {
                console.error(`[CaptureRepo] Image not found: ${normalizedName}`);
                console.error(`[CaptureRepo] Tried: ${capturesPath} AND ${flowsPath}`);
            }
        }
        throw new Error('Image not found or invalid protocol');
    }

    async saveCapture(capture: CaptureItem): Promise<CaptureItem> {
        // 1. If thumbnail is Base64, save to disk
        if (capture.thumbnail.startsWith('data:image')) {
            const fileName = `${capture.id}.png`;
            const filePath = path.join(this.capturesDir, fileName);

            // Extract base64 data
            const base64Data = capture.thumbnail.replace(/^data:image\/\w+;base64,/, "");
            await fs.writeFile(filePath, base64Data, 'base64');

            capture.thumbnail = `media://${fileName}`;
        }

        // 2. Save metadata to store
        const currentCaptures = (this.store.get('captures') || []) as CaptureItem[];
        const index = currentCaptures.findIndex(c => c.id === capture.id);

        if (index !== -1) {
            currentCaptures[index] = capture;
        } else {
            currentCaptures.push(capture);
        }

        this.store.set('captures', currentCaptures);
        return capture;
    }

    getCaptures(): CaptureItem[] {
        const captures = (this.store.get('captures') || []) as CaptureItem[];
        return captures.map(c => {
            if (c.thumbnail.startsWith('file://')) {
                const basename = path.basename(c.thumbnail);
                c.thumbnail = `media://${basename}`;
            }
            return c;
        });
    }

    async deleteCapture(id: string): Promise<void> {
        const currentCaptures = (this.store.get('captures') || []) as CaptureItem[];
        const capture = currentCaptures.find(c => c.id === id);

        if (capture && capture.thumbnail.startsWith('media://')) {
            const fileName = capture.thumbnail.replace('media://', '');
            const filePath = path.join(this.capturesDir, fileName);
            fs.remove(filePath).catch(err => console.error("[CaptureRepo] Failed to delete image file:", err));
        }

        const newCaptures = currentCaptures.filter(c => c.id !== id);
        this.store.set('captures', newCaptures);
    }

    clearAllCaptures(): void {
        const currentCaptures = (this.store.get('captures') || []) as CaptureItem[];
        for (const capture of currentCaptures) {
            if (capture.thumbnail.startsWith('media://')) {
                const fileName = capture.thumbnail.replace('media://', '');
                const filePath = path.join(this.capturesDir, fileName);
                fs.remove(filePath).catch(err => console.error("[CaptureRepo] Failed to delete image file:", err));
            }
        }
        this.store.set('captures', []);
    }

    getCapturesDir(): string {
        return this.capturesDir;
    }
}
