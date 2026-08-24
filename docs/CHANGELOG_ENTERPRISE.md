# 📦 SnapProof — Bitácora Completa de Cambios (Enterprise Upgrade)

## Resumen Ejecutivo de la Transformación
Se realizó una reestructuración integral de la arquitectura, seguridad, experiencia de usuario e integraciones B2B de **SnapProof**, elevándolo a una suite de grado empresarial para QA y desarrollo de software.

---

## 🛡️ 1. Seguridad y Validación en Runtime (Fase 1)
- **Validación IPC con Zod**: Creado `src/shared/schemas/captureSchemas.ts` con esquemas estrictos (`CaptureItemSchema`, `CaptureFlowSchema`, `ReportHistoryEntrySchema`, `ReportDraftSchema`, `JiraConfigSchema`, `AzureDevOpsConfigSchema`).
- **Handlers IPC Blindados**: Refactorizados todos los canales en `src/main/ipc/handlers.ts` con validación `safeParse`.
- **Content Security Policy (CSP)**: Inyectadas cabeceras CSP en `src/main/main.ts` restringiendo orígenes maliciosos y permitiendo `media:`, `blob:`, `data:`.
- **MediaProtocol Seguro**: Activada la defensa contra *directory traversal* en `src/main/ipc/MediaProtocol.ts`.

---

## 🗄️ 2. Persistencia Segregada y Migraciones (Fase 1)
- **Desacoplamiento de Persistencia**: Dividido `PersistenceManager` en 4 repositorios especializados:
  - `src/main/stores/repos/CaptureRepo.ts` (CRUD de capturas y disco)
  - `src/main/stores/repos/ProfileRepo.ts` (Perfil de usuario)
  - `src/main/stores/repos/ReportRepo.ts` (Historial y borradores)
  - `src/main/stores/repos/FlowRepo.ts` (Flujos y carpetas de capturas)
- **Schema Migration**: Creado `runMigrations()` con versionado `__schemaVersion: 2` y soporte automático de campo `tags: []`.

---

## 🎨 3. UX, Modularización y Quick Wins (Fase 2)
- **Modularización de ReportWizard**: `ReportWizardModal.tsx` reducido de 52 KB a 14 KB dividiéndolo en 5 subcomponentes bajo `src/renderer/components/Reporting/wizard/`:
  - `WizardPreviewPane.tsx`
  - `WizardTemplateSelector.tsx`
  - `WizardThemeSelector.tsx`
  - `WizardFormFields.tsx`
  - `WizardLogoCustomizer.tsx`
- **Etiquetas Visuales (#tag)**: Badges `#tag` en `CaptureCard.tsx` y filtro dinámico en `useCaptureSearch.ts`.
- **Copiar al Portapapeles**: Canal IPC `clipboard:copyImage` con botón y feedback toast en `CaptureCard.tsx`.
- **Limpieza de Código Muerto**: Eliminado `AIService.ts` (stub no funcional).

---

## 💼 4. Integraciones B2B & Suite de QA (Fase 3)
- **Integración Atlassian Jira**:
  - Servicio `src/shared/integrations/jira.ts` (REST API v3).
  - Canales IPC `jira:testConnection`, `jira:getIssues`, `jira:uploadAttachment`.
  - Modal interactivo `src/renderer/components/Integrations/JiraUploadModal.tsx`.
- **Integración Microsoft Azure DevOps**:
  - Servicio `src/shared/integrations/azureDevOps.ts` (REST API 7.0 + WIQL).
  - Canales IPC `ado:testConnection`, `ado:getWorkItems`, `ado:uploadAttachment`.
  - Modal interactivo `src/renderer/components/Integrations/AzureDevOpsUploadModal.tsx`.
- **Comparador Visual de Evidencias (Visual Diff Tool)**:
  - Componente `src/renderer/components/Views/ImageDiffModal.tsx` con 3 modos: Cortina Deslizante (Split Slider), Lado a Lado (Side-by-Side) y Mezcla de Opacidad (Blend Overlay).
- **Sistema de Internacionalización (i18n)**:
  - Soporte bilingüe Español / Inglés con `translations.ts`, `I18nContext.tsx` y selector en `Settings.tsx`.
- **Auto-Updater & Multiplataforma**:
  - Targets `dmg` (macOS) y `AppImage` (Linux) en `package.json`.
  - Configurado `electron-updater` con bloque `publish` y verificación automática en `main.ts`.
  - CI/CD automatizado en `.github/workflows/build.yml`.

---

## 🧪 5. Verificación de Calidad
- **TypeScript**: 0 errores de compilación (`npx tsc --noEmit` y `npm run build:main`).
- **Jest Unit Tests**: 100% pasando (27 pruebas exitosas).
