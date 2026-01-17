import Store from 'electron-store';
import path from 'path';
import { app } from 'electron';
import fs from 'fs-extra';
import { CaptureItem } from '../../renderer/stores/captureStore'; // We'll need a shared type definition later, but using this for now or defining strict interface

// Define the shape of our store
interface AppValidation {
    captures: CaptureItem[];
    userProfile?: { name: string; initialized: boolean };
}

export class PersistenceManager {
    private store: Store<AppValidation>;
    private dataDir: string;
    private capturesDir: string;
    private flowsDir: string;
    private reportsDir: string;

    constructor() {
        this.store = new Store<AppValidation>({
            name: 'snapproof-data',
            defaults: {
                captures: [],
                userProfile: { name: '', initialized: false }
            }
        });

        // Save images in folders inside userData
        this.dataDir = app.getPath('userData');
        this.capturesDir = path.join(this.dataDir, 'captures');
        this.flowsDir = path.join(this.dataDir, 'flows');
        this.reportsDir = path.join(this.dataDir, 'reports');

        // Ensure directories exist
        fs.ensureDirSync(this.capturesDir);
        fs.ensureDirSync(this.flowsDir);
        fs.ensureDirSync(this.reportsDir);
    }

    getCapturesDir(): string {
        return this.capturesDir;
    }

    // User Profile
    saveUserProfile(name: string) {
        this.store.set('userProfile', { name, initialized: true });
    }

    getUserProfile() {
        return this.store.get('userProfile', { name: '', initialized: false });
    }

    async readImage(pathUrl: string): Promise<string> {
        if (pathUrl.startsWith('media://')) {
            const fileName = pathUrl.replace('media://', '');
            const decodedName = decodeURIComponent(fileName);

            // Try captures dir first
            let filePath = path.join(this.capturesDir, decodedName);

            if (!fs.existsSync(filePath)) {
                // Try flows dir
                filePath = path.join(this.flowsDir, decodedName);
            }

            if (fs.existsSync(filePath)) {
                const ext = path.extname(filePath).toLowerCase();
                let mimeType = 'image/png';
                if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
                if (ext === '.gif') mimeType = 'image/gif';
                if (ext === '.webp') mimeType = 'image/webp';

                const base64Data = await fs.readFile(filePath, { encoding: 'base64' });
                return `data:${mimeType};base64,${base64Data}`;
            }
        }
        throw new Error('Image not found or invalid protocol');
    }

    // Save a new capture (Image -> Disk, Metadata -> Store)
    async saveCapture(capture: CaptureItem): Promise<CaptureItem> {
        // 1. If thumbnail is Base64, save to disk
        if (capture.thumbnail.startsWith('data:image')) {
            const fileName = `${capture.id}.png`;
            const filePath = path.join(this.capturesDir, fileName);

            // Extract base64 data
            const base64Data = capture.thumbnail.replace(/^data:image\/\w+;base64,/, "");
            await fs.writeFile(filePath, base64Data, 'base64');

            // Update capture object with file path protocol
            // We use 'atom://' or just 'file://' depending on security policies. 
            // Standard 'file://' usually works if security allows, but we might need to handle this in renderer.
            // For now, let's store the absolute path, and we'll convert it to a URL in the renderer or cleanup here.
            // Store as media:// protocol URL
            capture.thumbnail = `media://${fileName}`;
        }

        // 2. Save metadata to store
        const currentCaptures = this.store.get('captures');
        // Check if exists (update) or push (new)
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
        return this.store.get('captures').map(c => {
            // Migration: Convert legacy file:// paths to media://
            if (c.thumbnail.startsWith('file://')) {
                const basename = path.basename(c.thumbnail);
                c.thumbnail = `media://${basename}`;
            }
            return c;
        });
    }

    async deleteCapture(id: string) {
        const currentCaptures = this.store.get('captures');
        const capture = currentCaptures.find(c => c.id === id);

        if (capture && capture.thumbnail.startsWith('media://')) {
            const fileName = capture.thumbnail.replace('media://', '');
            const filePath = path.join(this.capturesDir, fileName);
            fs.remove(filePath).catch(err => console.error("Failed to delete image file:", err));
        }

        const newCaptures = currentCaptures.filter(c => c.id !== id);
        this.store.set('captures', newCaptures);
    }

    clearAllCaptures() {
        // 1. Delete all images
        const currentCaptures = this.store.get('captures');
        for (const capture of currentCaptures) {
            if (capture.thumbnail.startsWith('media://')) {
                const fileName = capture.thumbnail.replace('media://', '');
                const filePath = path.join(this.capturesDir, fileName);
                fs.remove(filePath).catch(err => console.error("Failed to delete image file:", err));
            }
        }
        // 2. Clear store
        this.store.set('captures', []);
    }

    // Reports History

    async saveReportFile(fileName: string, content: ArrayBuffer): Promise<string> {
        // Ensure reports directory exists
        fs.ensureDirSync(this.reportsDir);

        const filePath = path.join(this.reportsDir, fileName);
        await fs.writeFile(filePath, Buffer.from(content));
        return filePath;
    }

    getReportHistory() {
        return this.store.get('reportHistory' as any, []);
    }

    saveReportToHistory(report: any) {
        const history = this.store.get('reportHistory' as any, []);
        history.push(report);
        this.store.set('reportHistory' as any, history);
    }

    deleteReportFromHistory(id: string) {
        const history = this.store.get('reportHistory' as any, []);
        const report = history.find((r: any) => r.id === id);

        // Try to delete physical file if it exists
        if (report && report.filePath) {
            fs.remove(report.filePath).catch(err => console.error("Failed to delete report file:", err));
        }

        const newHistory = history.filter((r: any) => r.id !== id);
        this.store.set('reportHistory' as any, newHistory);
    }

    // Report Drafts
    getReportDrafts() {
        return this.store.get('reportDrafts' as any, []);
    }

    saveReportDraft(draft: any) {
        const drafts = this.store.get('reportDrafts' as any, []);
        // Check if draft with this ID already exists (update) or is new (add)
        const existingIndex = drafts.findIndex((d: any) => d.id === draft.id);
        if (existingIndex >= 0) {
            drafts[existingIndex] = { ...draft, updatedAt: Date.now() };
        } else {
            drafts.push({ ...draft, createdAt: Date.now(), updatedAt: Date.now() });
        }
        this.store.set('reportDrafts' as any, drafts);
        return draft;
    }

    deleteReportDraft(id: string) {
        const drafts = this.store.get('reportDrafts' as any, []);
        const newDrafts = drafts.filter((d: any) => d.id !== id);
        this.store.set('reportDrafts' as any, newDrafts);
    }

    // Capture Flows
    getFlows() {
        return this.store.get('captureFlows' as any, []);
    }

    saveFlow(flow: any) {
        const flows = this.store.get('captureFlows' as any, []);
        const existingIndex = flows.findIndex((f: any) => f.id === flow.id);
        if (existingIndex >= 0) {
            flows[existingIndex] = { ...flow, updatedAt: Date.now() };
        } else {
            flows.push({ ...flow, createdAt: Date.now(), updatedAt: Date.now() });
        }
        this.store.set('captureFlows' as any, flows);
        return flow;
    }

    deleteFlow(id: string) {
        const flows = this.store.get('captureFlows' as any, []);
        const flow = flows.find((f: any) => f.id === id);

        // Delete all capture images in the flow
        if (flow && flow.captures) {
            for (const capture of flow.captures) {
                if (capture.imagePath) {
                    fs.remove(capture.imagePath).catch(err => console.error("Failed to delete flow capture:", err));
                }
            }
        }

        const newFlows = flows.filter((f: any) => f.id !== id);
        this.store.set('captureFlows' as any, newFlows);
    }
}

export const persistenceManager = new PersistenceManager();
