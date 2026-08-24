import Store from 'electron-store';
import path from 'path';
import { app } from 'electron';
import fs from 'fs-extra';
import { CaptureItem } from '../../shared/types';
import { CaptureFlow } from '../../shared/types/FlowTypes';
import { CaptureRepo } from './repos/CaptureRepo';
import { ProfileRepo } from './repos/ProfileRepo';
import { ReportRepo } from './repos/ReportRepo';
import { FlowRepo } from './repos/FlowRepo';

interface AppValidation {
    __schemaVersion?: number;
    captures: CaptureItem[];
    userProfile?: { name: string; initialized: boolean };
    captureFlows?: CaptureFlow[];
    reportHistory?: any[];
    reportDrafts?: any[];
}

export class PersistenceManager {
    private store: Store<AppValidation>;
    public captures: CaptureRepo;
    public profiles: ProfileRepo;
    public reports: ReportRepo;
    public flows: FlowRepo;

    constructor() {
        this.store = new Store<AppValidation>({
            name: 'snapproof-data',
            defaults: {
                __schemaVersion: 2,
                captures: [],
                userProfile: { name: '', initialized: false },
                captureFlows: [],
                reportHistory: [],
                reportDrafts: [],
            }
        });

        const dataDir = app.getPath('userData');
        const capturesDir = path.join(dataDir, 'captures');
        const flowsDir = path.join(dataDir, 'flows');
        const reportsDir = path.join(dataDir, 'reports');

        fs.ensureDirSync(capturesDir);
        fs.ensureDirSync(flowsDir);
        fs.ensureDirSync(reportsDir);

        this.runMigrations();

        // Inject repositories
        this.captures = new CaptureRepo(this.store, capturesDir);
        this.profiles = new ProfileRepo(this.store);
        this.reports = new ReportRepo(this.store, reportsDir);
        this.flows = new FlowRepo(this.store, flowsDir, capturesDir);
    }

    private runMigrations() {
        const currentVersion = (this.store.get('__schemaVersion' as any, 0) as number) || 0;

        if (currentVersion < 1) {
            // Migration v0 -> v1: Add tags array to existing captures
            const captures = (this.store.get('captures', []) || []) as any[];
            const migrated = captures.map((c: any) => ({
                ...c,
                tags: c.tags || [],
            }));
            this.store.set('captures', migrated);
            console.log(`[PersistenceManager Migration] v0 -> v1: Added tags to ${migrated.length} captures`);
        }

        if (currentVersion < 2) {
            // Migration v1 -> v2: Ensure reportHistory and reportDrafts arrays exist
            const history = this.store.get('reportHistory' as any, []);
            const drafts = this.store.get('reportDrafts' as any, []);
            this.store.set('reportHistory' as any, Array.isArray(history) ? history : []);
            this.store.set('reportDrafts' as any, Array.isArray(drafts) ? drafts : []);
            console.log('[PersistenceManager Migration] v1 -> v2: Ensured reportHistory and reportDrafts arrays');
        }

        this.store.set('__schemaVersion' as any, 2);
    }

    // === Backward-compatible Delegation Methods ===
    getCapturesDir(): string { return this.captures.getCapturesDir(); }
    readImage(pathUrl: string): Promise<string> { return this.captures.readImage(pathUrl); }
    saveCapture(capture: CaptureItem): Promise<CaptureItem> { return this.captures.saveCapture(capture); }
    getCaptures(): CaptureItem[] { return this.captures.getCaptures(); }
    deleteCapture(id: string): Promise<void> { return this.captures.deleteCapture(id); }
    clearAllCaptures(): void { this.captures.clearAllCaptures(); }

    saveUserProfile(name: string): void { this.profiles.saveUserProfile(name); }
    getUserProfile(): { name: string; initialized: boolean } { return this.profiles.getUserProfile(); }

    saveReportFile(fileName: string, content: ArrayBuffer): Promise<string> { return this.reports.saveReportFile(fileName, content); }
    getReportHistory(): any[] { return this.reports.getReportHistory(); }
    saveReportToHistory(report: any): void { this.reports.saveReportToHistory(report); }
    deleteReportFromHistory(id: string): void { this.reports.deleteReportFromHistory(id); }
    getReportDrafts(): any[] { return this.reports.getReportDrafts(); }
    saveReportDraft(draft: any): any { return this.reports.saveReportDraft(draft); }
    deleteReportDraft(id: string): void { this.reports.deleteReportDraft(id); }

    getFlows(): CaptureFlow[] { return this.flows.getFlows(); }
    saveFlow(flow: any): any { return this.flows.saveFlow(flow); }
    saveFlowSession(name: string, captures: CaptureItem[]): Promise<CaptureFlow> { return this.flows.saveFlowSession(name, captures); }
    addToFlow(flowId: string, captures: CaptureItem[]): Promise<CaptureFlow> { return this.flows.addToFlow(flowId, captures); }
    loadFlow(flowId: string): Promise<CaptureItem[]> { return this.flows.loadFlow(flowId); }
    openFlowFolder(flowId: string): Promise<void> { return this.flows.openFlowFolder(flowId); }
    deleteFlow(id: string): Promise<void> { return this.flows.deleteFlow(id); }
}

export const persistenceManager = new PersistenceManager();
