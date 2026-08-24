import Store from 'electron-store';
import path from 'path';
import fs from 'fs-extra';

export class ReportRepo {
    constructor(
        private store: Store<any>,
        private reportsDir: string,
    ) {}

    async saveReportFile(fileName: string, content: ArrayBuffer): Promise<string> {
        fs.ensureDirSync(this.reportsDir);
        const filePath = path.join(this.reportsDir, fileName);
        await fs.writeFile(filePath, Buffer.from(content));
        return filePath;
    }

    getReportHistory(): any[] {
        return this.store.get('reportHistory' as any, []) as any[];
    }

    saveReportToHistory(report: any): void {
        const history = this.getReportHistory();
        history.push(report);
        this.store.set('reportHistory' as any, history);
    }

    deleteReportFromHistory(id: string): void {
        const history = this.getReportHistory();
        const report = history.find((r: any) => r.id === id);
        if (report && report.filePath) {
            fs.remove(report.filePath).catch(err => console.error("[ReportRepo] Failed to delete report file:", err));
        }
        const newHistory = history.filter((r: any) => r.id !== id);
        this.store.set('reportHistory' as any, newHistory);
    }

    getReportDrafts(): any[] {
        return this.store.get('reportDrafts' as any, []) as any[];
    }

    saveReportDraft(draft: any): any {
        const drafts = this.getReportDrafts();
        const existingIndex = drafts.findIndex((d: any) => d.id === draft.id);
        if (existingIndex >= 0) {
            drafts[existingIndex] = { ...draft, updatedAt: Date.now() };
        } else {
            drafts.push({ ...draft, createdAt: Date.now(), updatedAt: Date.now() });
        }
        this.store.set('reportDrafts' as any, drafts);
        return draft;
    }

    deleteReportDraft(id: string): void {
        const drafts = this.getReportDrafts();
        const newDrafts = drafts.filter((d: any) => d.id !== id);
        this.store.set('reportDrafts' as any, newDrafts);
    }
}
