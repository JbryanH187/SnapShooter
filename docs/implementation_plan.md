# Plan de Implementación: SnapProof Enterprise-Grade

> **Propósito**: Plan exhaustivo para la transformación arquitectónica, modularización, blindaje de seguridad e integración B2B de SnapProof.

---

## PASO 1: Blindaje Arquitectónico y Desacoplamiento (Fase 1)

### 1.1 — Crear esquemas Zod para validación IPC
- Archivo: `src/shared/schemas/captureSchemas.ts`
- Validación de `CaptureItemSchema`, `CaptureFlowSchema`, `ReportHistoryEntrySchema`, `ReportDraftSchema`, `OverlayStyleSchema`, `SaveDialogOptionsSchema`, `JiraConfigSchema`, `AzureDevOpsConfigSchema`.
- Aplicar `safeParse` en los 18+ handlers IPC en `src/main/ipc/handlers.ts`.

### 1.2 — Configurar Content Security Policy (CSP)
- Archivo: `src/main/main.ts`
- Inyectar cabeceras en `session.defaultSession.webRequest.onHeadersReceived` permitiendo `media:`, `blob:`, `data:` y bloqueando orígenes maliciosos.

### 1.3 — Schema Migration para electron-store
- Archivo: `src/main/stores/PersistenceManager.ts`
- Implementar `runMigrations()` con versionado `__schemaVersion: 2` asegurando retrocompatibilidad de datos existentes y agregando campo `tags: []`.

### 1.4 — Desmantelar PersistenceManager en Repositorios Segregados
- Crear `src/main/stores/repos/CaptureRepo.ts`
- Crear `src/main/stores/repos/ProfileRepo.ts`
- Crear `src/main/stores/repos/ReportRepo.ts`
- Crear `src/main/stores/repos/FlowRepo.ts`
- `PersistenceManager.ts` opera como orquestador liviano con inyección de dependencias.

### 1.5 — Blindaje de Seguridad en MediaProtocol
- Archivo: `src/main/ipc/MediaProtocol.ts`
- Activar verificación estricta de límites de directorio (`userDataPath`) para bloquear ataques de *directory traversal*.

### 1.6 — Tags en CaptureItem
- Archivo: `src/shared/types.ts`
- Agregar campo `tags?: string[]`.

---

## PASO 2: Refactorización UI + Quick Wins (Fase 2)

### 2.1 — Limpieza de Código Muerto
- Eliminar `src/shared/services/AIService.ts` (stub no funcional).

### 2.2 — Ocultar Performance Dashboard
- Ocultar vista de métricas del menú del usuario final en producción.

### 2.3 — Implementar "Copy to Clipboard"
- Agregar canal IPC `clipboard:copyImage` con `clipboard.writeImage`.
- Exponer en `src/preload/index.ts` y tipar en `src/renderer/types/electron.d.ts`.
- Botón con icono `Copy` y feedback `toast` en `CaptureCard.tsx`.

### 2.4 — Modularización de ReportWizardModal
- Reducir componente de 52.5 KB a 14 KB dividiéndolo en 5 subcomponentes bajo `src/renderer/components/Reporting/wizard/`:
  - `WizardPreviewPane.tsx`
  - `WizardTemplateSelector.tsx`
  - `WizardThemeSelector.tsx`
  - `WizardFormFields.tsx`
  - `WizardLogoCustomizer.tsx`

---

## PASO 3: Expansión Multiplataforma e Integración B2B (Fase 3)

### 3.1 — Soporte Multiplataforma (macOS / Linux)
- Configurar targets `dmg` y `AppImage` en `package.json`.
- Scripts `build:mac`, `build:linux`, `build:all`.

### 3.2 — Auto-Updater con electron-updater
- Instalar `electron-updater`.
- Configurar bloque `publish` en `package.json` hacia GitHub Releases.
- Invocar `autoUpdater.checkForUpdatesAndNotify()` en `src/main/main.ts`.

### 3.3 — Integración B2B con Atlassian Jira
- Servicio `src/shared/integrations/jira.ts` con REST API v3.
- Handlers IPC `jira:testConnection`, `jira:getIssues`, `jira:uploadAttachment`.
- Componente Modal `src/renderer/components/Integrations/JiraUploadModal.tsx`.

### 3.4 — Integración B2B con Microsoft Azure DevOps
- Servicio `src/shared/integrations/azureDevOps.ts` con REST API 7.0 y WIQL.
- Handlers IPC `ado:testConnection`, `ado:getWorkItems`, `ado:uploadAttachment`.
- Componente Modal `src/renderer/components/Integrations/AzureDevOpsUploadModal.tsx`.

### 3.5 — Comparador Visual de Evidencias (Visual Diff Tool)
- Componente `src/renderer/components/Views/ImageDiffModal.tsx` con 3 modos de comparación: Cortina deslizante (Split Slider), Lado a Lado (Side-by-Side) y Superposición con Opacidad (Blend Overlay).

### 3.6 — Sistema de Internacionalización (i18n)
- Diccionarios ES/EN en `src/renderer/i18n/translations.ts`.
- Contexto `I18nContext.tsx` y selector de idiomas en `Settings.tsx`.

### 3.7 — CI/CD Pipeline
- Pipeline GitHub Actions en `.github/workflows/build.yml`.
