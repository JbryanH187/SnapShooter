export interface JiraConfig {
    host: string;       // e.g. "https://yourcompany.atlassian.net"
    email: string;      // e.g. "developer@company.com"
    apiToken: string;   // Jira API Token
    projectKey?: string;// e.g. "PROJ"
}

export interface JiraIssue {
    id: string;
    key: string;
    summary: string;
    status: string;
    issueType: string;
}

export class JiraIntegrationService {
    private static sanitizeHost(host: string): string {
        let clean = host.trim().replace(/\/+$/, '');
        if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
            clean = `https://${clean}`;
        }
        return clean;
    }

    private static getAuthHeader(config: JiraConfig): string {
        const token = Buffer.from(`${config.email.trim()}:${config.apiToken.trim()}`).toString('base64');
        return `Basic ${token}`;
    }

    /**
     * Test Jira connection and credentials
     */
    static async testConnection(config: JiraConfig): Promise<{ success: boolean; message: string; user?: string }> {
        try {
            const host = this.sanitizeHost(config.host);
            const response = await fetch(`${host}/rest/api/3/myself`, {
                method: 'GET',
                headers: {
                    'Authorization': this.getAuthHeader(config),
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                const status = response.status;
                if (status === 401 || status === 403) {
                    return { success: false, message: 'Credenciales inválidas (Email o API Token incorrecto)' };
                }
                return { success: false, message: `Error del servidor Jira: HTTP ${status}` };
            }

            const data = await response.json() as any;
            return {
                success: true,
                message: `Conectado como ${data.displayName || data.emailAddress || 'Usuario'}`,
                user: data.displayName
            };
        } catch (error: any) {
            return {
                success: false,
                message: `No se pudo contactar a Jira: ${error.message || 'Error de red'}`
            };
        }
    }

    /**
     * Search Jira issues for the project
     */
    static async searchIssues(config: JiraConfig, query?: string): Promise<JiraIssue[]> {
        const host = this.sanitizeHost(config.host);
        let jql = 'ORDER BY updated DESC';

        if (config.projectKey && config.projectKey.trim()) {
            jql = `project = "${config.projectKey.trim()}" ${query ? `AND text ~ "${query}"` : ''} ORDER BY updated DESC`;
        } else if (query && query.trim()) {
            jql = `text ~ "${query.trim()}" ORDER BY updated DESC`;
        }

        const url = `${host}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=20&fields=summary,status,issuetype`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': this.getAuthHeader(config),
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Jira search failed with HTTP ${response.status}`);
        }

        const data = await response.json() as any;
        return (data.issues || []).map((issue: any) => ({
            id: issue.id,
            key: issue.key,
            summary: issue.fields?.summary || 'Sin resumen',
            status: issue.fields?.status?.name || 'Abierto',
            issueType: issue.fields?.issuetype?.name || 'Tarea'
        }));
    }

    /**
     * Upload an image attachment to a Jira Issue
     */
    static async uploadAttachment(
        config: JiraConfig,
        issueKey: string,
        fileName: string,
        fileBuffer: Buffer
    ): Promise<boolean> {
        const host = this.sanitizeHost(config.host);
        const url = `${host}/rest/api/3/issue/${issueKey}/attachments`;

        const formData = new FormData();
        const blob = new Blob([new Uint8Array(fileBuffer)], { type: 'image/png' });
        formData.append('file', blob, fileName);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': this.getAuthHeader(config),
                'X-Atlassian-Token': 'no-check'
            },
            body: formData
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Failed to upload attachment to ${issueKey}: ${errText}`);
        }

        return true;
    }
}
