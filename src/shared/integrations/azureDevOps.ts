export interface AzureDevOpsConfig {
    organization: string; // e.g. "my-org"
    project: string;      // e.g. "my-project"
    pat: string;          // Personal Access Token
}

export interface ADOWorkItem {
    id: number;
    title: string;
    type: string;
    state: string;
    assignedTo?: string;
}

export class AzureDevOpsService {
    private static sanitizeOrg(org: string): string {
        return org.trim().replace(/^https?:\/\/dev\.azure\.com\//, '').replace(/\/+$/, '');
    }

    private static getAuthHeader(pat: string): string {
        const token = Buffer.from(`:${pat.trim()}`).toString('base64');
        return `Basic ${token}`;
    }

    /**
     * Test connection to Azure DevOps
     */
    static async testConnection(config: AzureDevOpsConfig): Promise<{ success: boolean; message: string; project?: string }> {
        try {
            const org = this.sanitizeOrg(config.organization);
            const url = `https://dev.azure.com/${org}/_apis/projects/${encodeURIComponent(config.project.trim())}?api-version=7.0`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': this.getAuthHeader(config.pat),
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    return { success: false, message: 'Personal Access Token (PAT) inválido o sin permisos suficientes' };
                }
                return { success: false, message: `Error Azure DevOps: HTTP ${response.status}` };
            }

            const data = await response.json() as any;
            return {
                success: true,
                message: `Conectado al proyecto "${data.name || config.project}" en ${org}`,
                project: data.name
            };
        } catch (error: any) {
            return {
                success: false,
                message: `Error de conexión con Azure DevOps: ${error.message || 'Error de red'}`
            };
        }
    }

    /**
     * Search Work Items (Bugs, Tasks, User Stories)
     */
    static async searchWorkItems(config: AzureDevOpsConfig, query?: string): Promise<ADOWorkItem[]> {
        const org = this.sanitizeOrg(config.organization);
        const project = config.project.trim();

        // WIQL query to get top recent work items
        let wiql = `SELECT [System.Id], [System.Title], [System.WorkItemType], [System.State], [System.AssignedTo] FROM WorkItems WHERE [System.TeamProject] = '${project}'`;
        if (query && query.trim()) {
            wiql += ` AND [System.Title] CONTAINS '${query.trim().replace(/'/g, "''")}'`;
        }
        wiql += ` ORDER BY [System.ChangedDate] DESC`;

        const wiqlUrl = `https://dev.azure.com/${org}/${encodeURIComponent(project)}/_apis/wit/wiql?api-version=7.0&$top=20`;
        const wiqlRes = await fetch(wiqlUrl, {
            method: 'POST',
            headers: {
                'Authorization': this.getAuthHeader(config.pat),
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ query: wiql })
        });

        if (!wiqlRes.ok) {
            throw new Error(`Azure DevOps WIQL query failed: HTTP ${wiqlRes.status}`);
        }

        const wiqlData = await wiqlRes.json() as any;
        const itemIds: number[] = (wiqlData.workItems || []).map((w: any) => w.id);

        if (itemIds.length === 0) return [];

        // Batch fetch details
        const detailsUrl = `https://dev.azure.com/${org}/${encodeURIComponent(project)}/_apis/wit/workitems?ids=${itemIds.slice(0, 20).join(',')}&fields=System.Id,System.Title,System.WorkItemType,System.State,System.AssignedTo&api-version=7.0`;
        const detailsRes = await fetch(detailsUrl, {
            headers: {
                'Authorization': this.getAuthHeader(config.pat),
                'Accept': 'application/json'
            }
        });

        if (!detailsRes.ok) {
            throw new Error(`Azure DevOps work items detail query failed: HTTP ${detailsRes.status}`);
        }

        const detailsData = await detailsRes.json() as any;
        return (detailsData.value || []).map((item: any) => ({
            id: item.id,
            title: item.fields?.['System.Title'] || 'Sin título',
            type: item.fields?.['System.WorkItemType'] || 'WorkItem',
            state: item.fields?.['System.State'] || 'New',
            assignedTo: item.fields?.['System.AssignedTo']?.displayName
        }));
    }

    /**
     * Upload an attachment to Azure DevOps and link to Work Item
     */
    static async uploadAttachment(
        config: AzureDevOpsConfig,
        workItemId: number,
        fileName: string,
        fileBuffer: Buffer
    ): Promise<boolean> {
        const org = this.sanitizeOrg(config.organization);
        const project = config.project.trim();

        // 1. Upload binary attachment
        const uploadUrl = `https://dev.azure.com/${org}/${encodeURIComponent(project)}/_apis/wit/attachments?fileName=${encodeURIComponent(fileName)}&api-version=7.0`;
        const uploadRes = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'Authorization': this.getAuthHeader(config.pat),
                'Content-Type': 'application/octet-stream',
                'Accept': 'application/json'
            },
            body: new Uint8Array(fileBuffer)
        });

        if (!uploadRes.ok) {
            const err = await uploadRes.text();
            throw new Error(`Failed to upload attachment binary to Azure DevOps: ${err}`);
        }

        const attachmentData = await uploadRes.json() as any;
        const attachmentUrl = attachmentData.url;

        // 2. Link attachment to work item via JSON Patch
        const linkUrl = `https://dev.azure.com/${org}/${encodeURIComponent(project)}/_apis/wit/workitems/${workItemId}?api-version=7.0`;
        const patchBody = [
            {
                op: 'add',
                path: '/relations/-',
                value: {
                    rel: 'AttachedFile',
                    url: attachmentUrl,
                    attributes: {
                        comment: 'Evidencia adjuntada automáticamente desde SnapProof'
                    }
                }
            }
        ];

        const linkRes = await fetch(linkUrl, {
            method: 'PATCH',
            headers: {
                'Authorization': this.getAuthHeader(config.pat),
                'Content-Type': 'application/json-patch+json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(patchBody)
        });

        if (!linkRes.ok) {
            const err = await linkRes.text();
            throw new Error(`Failed to link attachment to Work Item #${workItemId}: ${err}`);
        }

        return true;
    }
}
