import Store from 'electron-store';
import path from 'path';
import { app, shell } from 'electron';
import fs from 'fs-extra';
import { CaptureItem } from '../../shared/types';
import { CaptureFlow, FlowCapture } from '../../shared/types/FlowTypes';
import { v4 as uuidv4 } from 'uuid';

// Define the shape of our store
interface AppValidation {
    captures: CaptureItem[];
    userProfile?: { name: string; initialized: boolean };
    captureFlows?: CaptureFlow[];
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
                userProfile: { name: '', initialized: false },
                captureFlows: []
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
        console.log(`[Persistence] readImage: ${pathUrl}`);
        if (pathUrl.startsWith('media://')) {
            const fileName = pathUrl.replace('media://', '');
            const decodedName = decodeURIComponent(fileName);
            const normalizedName = path.normalize(decodedName);

            // Try captures dir first
            const capturesPath = path.join(this.capturesDir, normalizedName);

            // Try flows dir
            const flowsPath = path.join(this.flowsDir, normalizedName);

            let filePath = '';
            if (fs.existsSync(capturesPath)) {
                filePath = capturesPath;
            } else if (fs.existsSync(flowsPath)) {
                filePath = flowsPath;
            } else if (fs.existsSync(normalizedName)) {
                // Try as absolute path
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
                console.error(`[Persistence] Image not found: ${normalizedName}`);
                console.error(`[Persistence] Tried: ${capturesPath} AND ${flowsPath}`);
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

    async saveFlowSession(name: string, captures: CaptureItem[]): Promise<CaptureFlow> {
        const flowId = uuidv4();
        // Sanitize name for folder
        const safeName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const flowFolder = path.join(this.flowsDir, safeName);
        const screensFolder = path.join(flowFolder, 'Screens');

        await fs.ensureDir(screensFolder);

        const flowCaptures: FlowCapture[] = [];

        for (let i = 0; i < captures.length; i++) {
            const capture = captures[i];
            const fileName = capture.thumbnail.replace('media://', '');
            const sourcePath = path.join(this.capturesDir, fileName);
            const destPath = path.join(screensFolder, fileName);

            // Move file (using copy+remove to be safe or move)
            // We MOVE because we want to clear the workspace as per requirement
            if (await fs.pathExists(sourcePath)) {
                await fs.move(sourcePath, destPath, { overwrite: true });
            }

            flowCaptures.push({
                id: capture.id,
                imagePath: `media://${safeName}/Screens/${fileName}`, // Store relative path protocol with subfolder
                title: capture.title,
                description: capture.description,
                order: i,
                createdAt: capture.timestamp
            });
        }

        const newFlow: CaptureFlow = {
            id: flowId,
            name: name,
            captures: flowCaptures,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        const flows = this.store.get('captureFlows' as any, []);
        flows.push(newFlow);
        this.store.set('captureFlows' as any, flows);

        // Clear workspace
        this.store.set('captures', []);

        return newFlow;
    }

    async addToFlow(flowId: string, captures: CaptureItem[]): Promise<CaptureFlow> {
        const flows = this.store.get('captureFlows' as any, []) as CaptureFlow[];
        const flowIndex = flows.findIndex(f => f.id === flowId);

        if (flowIndex === -1) throw new Error('Flow not found');

        const flow = flows[flowIndex];

        // Determine folder path from existing captures or name
        // We assume flow.name matches folder name logic or we use the first capture to find it
        // But safer to re-derive from name if standard, OR better: store folderPath in flow metadata?
        // Let's use the folder name from the first capture if available, or try based on name.

        let safeName = flow.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();

        if (flow.captures.length > 0) {
            const firstImage = flow.captures[0].imagePath.replace('media://', '');
            const parts = firstImage.split('/');
            if (parts.length > 0) safeName = parts[0];
        }

        const flowFolder = path.join(this.flowsDir, safeName);
        const screensFolder = path.join(flowFolder, 'Screens');
        await fs.ensureDir(screensFolder);

        // Determine start order
        const maxOrder = flow.captures.length > 0 ? Math.max(...flow.captures.map(c => c.order)) : -1;
        let currentOrder = maxOrder + 1;

        const newFlowCaptures: FlowCapture[] = [];

        for (let i = 0; i < captures.length; i++) {
            const capture = captures[i];
            const fileName = capture.thumbnail.replace('media://', '');
            const sourcePath = path.join(this.capturesDir, fileName);
            const destPath = path.join(screensFolder, fileName);

            if (await fs.pathExists(sourcePath)) {
                await fs.move(sourcePath, destPath, { overwrite: true });
            }

            newFlowCaptures.push({
                id: capture.id,
                imagePath: `media://${safeName}/Screens/${fileName}`,
                title: capture.title,
                description: capture.description,
                order: currentOrder++,
                createdAt: capture.timestamp
            });
        }

        // Update flow
        flow.captures = [...flow.captures, ...newFlowCaptures];
        flow.updatedAt = Date.now();

        flows[flowIndex] = flow;
        this.store.set('captureFlows' as any, flows);

        // Clear workspace
        this.store.set('captures', []);

        return flow;
    }

    async loadFlow(flowId: string): Promise<CaptureItem[]> {
        const flows = this.store.get('captureFlows' as any, []) as CaptureFlow[];
        const flow = flows.find(f => f.id === flowId);

        if (!flow) throw new Error('Flow not found');

        // Clear current workspace first (delete images in captures? No, just clear state? 
        // Logic: if we are "loading" we might overwrite existing files in capturesDir if names collide.
        // Assuming we clear workspace first.

        // 1. Clear current workspace files to be clean? 
        // Or just let overwrite happen. UUIDs prevent collisions mostly.

        const restoredCaptures: CaptureItem[] = [];

        for (const fc of flow.captures) {
            // fc.imagePath is "media://flowName/image.png"
            const relativePath = fc.imagePath.replace('media://', '');
            const sourcePath = path.join(this.flowsDir, relativePath);

            const fileName = path.basename(relativePath);
            const destPath = path.join(this.capturesDir, fileName);

            console.log(`[Persistence] loadFlow processing: ${fc.id}`);
            console.log(`[Persistence] Source: ${sourcePath}`);
            console.log(`[Persistence] Dest: ${destPath}`);

            // Copy file back to workspace
            let foundPath = sourcePath;

            if (!await fs.pathExists(sourcePath)) {
                console.warn(`[Persistence] Source path not found: ${sourcePath}`);
                // Fallback: Search for the file by name in the flows directory (recursive-ish or check common paths)
                // We know it's likely in some flow folder.
                const searchName = path.basename(fileName);
                console.log(`[Persistence] Attempting to find ${searchName} in flows directory...`);

                // Simple search in all subfolders of flowsDir
                try {
                    const subdirs = await fs.readdir(this.flowsDir, { withFileTypes: true });
                    for (const dirent of subdirs) {
                        if (dirent.isDirectory()) {
                            // Check root of flow folder
                            const p1 = path.join(this.flowsDir, dirent.name, searchName);
                            if (await fs.pathExists(p1)) { foundPath = p1; break; }

                            // Check Screens subfolder
                            const p2 = path.join(this.flowsDir, dirent.name, 'Screens', searchName);
                            if (await fs.pathExists(p2)) { foundPath = p2; break; }
                        }
                    }
                } catch (e) {
                    console.error('[Persistence] Error searching for file:', e);
                }
            }

            if (await fs.pathExists(foundPath)) {
                if (foundPath !== sourcePath) {
                    console.log(`[Persistence] Found file at alternative path: ${foundPath}`);
                }
                await fs.copy(foundPath, destPath, { overwrite: true });
                console.log(`[Persistence] Copied successfully.`);
            } else {
                console.error(`[Persistence] Critical: Could not find image file for capture ${fc.id}`);
            }

            restoredCaptures.push({
                id: fc.id,
                timestamp: fc.createdAt,
                thumbnail: `media://${fileName}`,
                status: 'success',
                title: fc.title || '',
                description: fc.description || '',
                metadata: {
                    os: 'unknown',
                    resolution: 'unknown',
                    timestamp: fc.createdAt
                }
            });
        }

        // Update Store
        this.store.set('captures', restoredCaptures);
        return restoredCaptures;
    }

    async openFlowFolder(flowId: string) {
        const flows = this.store.get('captureFlows' as any, []) as CaptureFlow[];
        const flow = flows.find(f => f.id === flowId);
        if (flow && flow.captures.length > 0) {
            // Deduce folder from first capture path which is like "media://flowName/Screens/image.png"
            const firstImage = flow.captures[0].imagePath.replace('media://', '');
            // Split by separator usually '/'
            const parts = firstImage.split('/');
            // parts[0] is flowName
            if (parts.length > 0) {
                const folderPath = path.join(this.flowsDir, parts[0]);
                await shell.openPath(folderPath);
            }
        } else {
            // Fallback
            await shell.openPath(this.flowsDir);
        }
    }

    async deleteFlow(id: string) {
        const flows = this.store.get('captureFlows' as any, []);
        const flow = flows.find((f: any) => f.id === id);

        if (flow) {
            // Delete the entire folder
            if (flow.captures.length > 0) {
                const firstImage = flow.captures[0].imagePath.replace('media://', '');
                const parts = firstImage.split('/');
                if (parts.length > 0) {
                    const folderPath = path.join(this.flowsDir, parts[0]);
                    await fs.remove(folderPath).catch(err => console.error("Failed to delete flow folder:", err));
                }
            }
        }

        const newFlows = flows.filter((f: any) => f.id !== id);
        this.store.set('captureFlows' as any, newFlows);
    }
}

export const persistenceManager = new PersistenceManager();
