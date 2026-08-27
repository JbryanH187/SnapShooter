import { z } from 'zod';

// Replica of SystemMetadata in src/main/metadata/MetadataCollector.ts
export const SystemMetadataSchema = z.object({
    os: z.string().optional(),
    resolution: z.string().optional(),
    timestamp: z.number().optional(),
}).passthrough();

// Replica of CaptureItem in src/shared/types.ts
export const CaptureItemSchema = z.object({
    id: z.string(),
    thumbnail: z.string(),
    timestamp: z.number().optional().default(() => Date.now()),
    title: z.string().optional().default(''),
    description: z.string().optional().default(''),
    status: z.enum(['pending', 'saved', 'success', 'failure']).optional().default('success'),
    metadata: SystemMetadataSchema.optional(),
    tags: z.array(z.string()).optional(),
}).passthrough();

// Replica of FlowCapture in src/shared/types/FlowTypes.ts
export const FlowCaptureSchema = z.object({
    id: z.string(),
    imagePath: z.string(),
    clickPosition: z.object({ x: z.number(), y: z.number() }).optional(),
    clickStyle: z.enum(['hand', 'target', 'dot', 'mouse']).optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    order: z.number(),
    createdAt: z.number(),
});

// Replica of CaptureFlow in src/shared/types/FlowTypes.ts
export const CaptureFlowSchema = z.object({
    id: z.string(),
    name: z.string(),
    captures: z.array(FlowCaptureSchema),
    createdAt: z.number(),
    updatedAt: z.number(),
});

// Schema for report history entry
export const ReportHistoryEntrySchema = z.object({
    id: z.string(),
    title: z.string().optional(),
    format: z.enum(['pdf', 'docx']).optional(),
    filePath: z.string().optional(),
    captureCount: z.number().optional(),
    templateId: z.string().optional(),
    createdAt: z.number().optional(),
}).passthrough();

// Schema for report drafts
export const ReportDraftSchema = z.object({
    id: z.string(),
    title: z.string().optional(),
    subtitle: z.string().optional(),
    author: z.string().optional(),
    templateId: z.string().optional(),
    captureIds: z.array(z.string()).optional(),
    config: z.record(z.string(), z.unknown()).optional(),
    createdAt: z.number().optional(),
    updatedAt: z.number().optional(),
}).passthrough();

// Schema for overlay style
export const OverlayStyleSchema = z.object({
    color: z.string(),
    symbolColor: z.string(),
});

// Schema for save dialog options
export const SaveDialogOptionsSchema = z.object({
    defaultPath: z.string(),
    filters: z.array(z.object({
        name: z.string(),
        extensions: z.array(z.string()),
    })),
});

// Schema for Jira Integration
export const JiraConfigSchema = z.object({
    host: z.string().min(3),
    email: z.string().email(),
    apiToken: z.string().min(1),
    projectKey: z.string().optional(),
});

export const JiraUploadSchema = z.object({
    config: JiraConfigSchema,
    issueKey: z.string().min(1),
    fileName: z.string().min(1),
    imageSrc: z.string().min(1),
});

// Schema for Azure DevOps Integration
export const AzureDevOpsConfigSchema = z.object({
    organization: z.string().min(1),
    project: z.string().min(1),
    pat: z.string().min(1),
});

export const AzureDevOpsUploadSchema = z.object({
    config: AzureDevOpsConfigSchema,
    workItemId: z.number().int().positive(),
    fileName: z.string().min(1),
    imageSrc: z.string().min(1),
});

export type ValidatedCaptureItem = z.infer<typeof CaptureItemSchema>;
export type ValidatedCaptureFlow = z.infer<typeof CaptureFlowSchema>;
export type ValidatedReportHistoryEntry = z.infer<typeof ReportHistoryEntrySchema>;
export type ValidatedReportDraft = z.infer<typeof ReportDraftSchema>;
export type ValidatedJiraConfig = z.infer<typeof JiraConfigSchema>;
export type ValidatedJiraUpload = z.infer<typeof JiraUploadSchema>;
export type ValidatedAzureDevOpsConfig = z.infer<typeof AzureDevOpsConfigSchema>;
export type ValidatedAzureDevOpsUpload = z.infer<typeof AzureDevOpsUploadSchema>;
