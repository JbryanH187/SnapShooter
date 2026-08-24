import Store from 'electron-store';
import path from 'path';
import fs from 'fs-extra';
import { shell } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { CaptureItem } from '../../../shared/types';
import { CaptureFlow, FlowCapture } from '../../../shared/types/FlowTypes';

export class FlowRepo {
    constructor(
        private store: Store<any>,
        private flowsDir: string,
        private capturesDir: string,
    ) {}

    getFlows(): CaptureFlow[] {
        return this.store.get('captureFlows' as any, []) as CaptureFlow[];
    }

    saveFlow(flow: any): any {
        const flows = this.store.get('captureFlows' as any, []) as any[];
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

            if (await fs.pathExists(sourcePath)) {
                await fs.move(sourcePath, destPath, { overwrite: true });
            }

            flowCaptures.push({
                id: capture.id,
                imagePath: `media://${safeName}/Screens/${fileName}`,
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

        const flows = this.store.get('captureFlows' as any, []) as CaptureFlow[];
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

        let safeName = flow.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();

        if (flow.captures.length > 0) {
            const firstImage = flow.captures[0].imagePath.replace('media://', '');
            const parts = firstImage.split('/');
            if (parts.length > 0) safeName = parts[0];
        }

        const flowFolder = path.join(this.flowsDir, safeName);
        const screensFolder = path.join(flowFolder, 'Screens');
        await fs.ensureDir(screensFolder);

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

        const restoredCaptures: CaptureItem[] = [];

        for (const fc of flow.captures) {
            const relativePath = fc.imagePath.replace('media://', '');
            const sourcePath = path.join(this.flowsDir, relativePath);

            const fileName = path.basename(relativePath);
            const destPath = path.join(this.capturesDir, fileName);

            let foundPath = sourcePath;

            if (!await fs.pathExists(sourcePath)) {
                console.warn(`[FlowRepo] Source path not found: ${sourcePath}`);
                const searchName = path.basename(fileName);

                try {
                    const subdirs = await fs.readdir(this.flowsDir, { withFileTypes: true });
                    for (const dirent of subdirs) {
                        if (dirent.isDirectory()) {
                            const p1 = path.join(this.flowsDir, dirent.name, searchName);
                            if (await fs.pathExists(p1)) { foundPath = p1; break; }

                            const p2 = path.join(this.flowsDir, dirent.name, 'Screens', searchName);
                            if (await fs.pathExists(p2)) { foundPath = p2; break; }
                        }
                    }
                } catch (e) {
                    console.error('[FlowRepo] Error searching for file:', e);
                }
            }

            if (await fs.pathExists(foundPath)) {
                await fs.copy(foundPath, destPath, { overwrite: true });
            } else {
                console.error(`[FlowRepo] Critical: Could not find image file for capture ${fc.id}`);
            }

            restoredCaptures.push({
                id: fc.id,
                timestamp: fc.createdAt,
                thumbnail: `media://${fileName}`,
                status: 'success',
                title: fc.title || '',
                description: fc.description || '',
                tags: [],
                metadata: {
                    os: 'unknown',
                    resolution: 'unknown',
                    timestamp: fc.createdAt
                }
            });
        }

        this.store.set('captures', restoredCaptures);
        return restoredCaptures;
    }

    async openFlowFolder(flowId: string): Promise<void> {
        const flows = this.store.get('captureFlows' as any, []) as CaptureFlow[];
        const flow = flows.find(f => f.id === flowId);
        if (flow && flow.captures.length > 0) {
            const firstImage = flow.captures[0].imagePath.replace('media://', '');
            const parts = firstImage.split('/');
            if (parts.length > 0) {
                const folderPath = path.join(this.flowsDir, parts[0]);
                await shell.openPath(folderPath);
            }
        } else {
            await shell.openPath(this.flowsDir);
        }
    }

    async deleteFlow(id: string): Promise<void> {
        const flows = this.store.get('captureFlows' as any, []) as any[];
        const flow = flows.find((f: any) => f.id === id);

        if (flow) {
            if (flow.captures.length > 0) {
                const firstImage = flow.captures[0].imagePath.replace('media://', '');
                const parts = firstImage.split('/');
                if (parts.length > 0) {
                    const folderPath = path.join(this.flowsDir, parts[0]);
                    await fs.remove(folderPath).catch(err => console.error("[FlowRepo] Failed to delete flow folder:", err));
                }
            }
        }

        const newFlows = flows.filter((f: any) => f.id !== id);
        this.store.set('captureFlows' as any, newFlows);
    }
}
