export type Language = 'es' | 'en';

export const translations = {
    es: {
        // App Shell & Navigation
        'nav.recents': 'Recientes',
        'nav.flows': 'Flujos',
        'nav.smartFolders': 'Carpetas Inteligentes',
        'nav.builder': 'Constructor de Reportes',
        'nav.history': 'Historial',
        'nav.settings': 'Ajustes',
        'nav.quickFlow': 'Quick Flow',
        'nav.resolution': 'Resolución',

        // Actions & Buttons
        'action.save': 'Guardar',
        'action.cancel': 'Cancelar',
        'action.delete': 'Eliminar',
        'action.edit': 'Editar',
        'action.copy': 'Copiar',
        'action.export': 'Exportar',
        'action.refresh': 'Actualizar',
        'action.search': 'Buscar...',
        'action.filter': 'Filtrar',
        'action.compare': 'Comparar (Diff)',
        'action.saveToStorage': 'Guardar en Storage',
        'action.attachJira': 'Adjuntar a Jira',
        'action.attachADO': 'Adjuntar a Azure DevOps',

        // Recents View
        'recents.title': 'Capturas Recientes',
        'recents.emptyTitle': 'No tienes capturas aún',
        'recents.emptyDesc': 'Tu evidencia capturada aparecerá aquí tras usar los atajos de teclado.',
        'recents.copySuccess': 'Imagen copiada al portapapeles',
        'recents.copyError': 'Error al copiar imagen',

        // Filter Bar
        'filter.allTime': 'Todo el tiempo',
        'filter.today': 'Hoy',
        'filter.pastWeek': 'Última semana',
        'filter.pastMonth': 'Último mes',
        'filter.allStatus': 'Todos los estados',
        'filter.success': 'Éxito',
        'filter.failure': 'Fallo',
        'filter.pending': 'Pendiente',
        'filter.clearFilters': 'Limpiar filtros',

        // Report Wizard
        'wizard.title': 'Asistente de Reportes',
        'wizard.configTitle': 'Configuración del Reporte',
        'wizard.template': 'Diseño / Plantilla',
        'wizard.palette': 'Paleta de Colores',
        'wizard.reportTitle': 'Título del Reporte',
        'wizard.subtitle': 'Subtítulo',
        'wizard.author': 'Autor',
        'wizard.projectName': 'Nombre del Proyecto',
        'wizard.reportDate': 'Fecha del Reporte',
        'wizard.livePreview': 'Vista Previa en Vivo',
        'wizard.quickExport': 'Exportación Rápida',
        'wizard.continueExport': 'Continuar a Exportar',
        'wizard.saveDraft': 'Guardar Borrador',
        'wizard.downloadPdf': 'Descargar PDF',
        'wizard.downloadDocx': 'Descargar Word',

        // Integrations
        'jira.title': 'Integración B2B — Atlassian Jira',
        'jira.attachTab': 'Adjuntar a Ticket',
        'jira.configTab': 'Configuración Jira API',
        'jira.host': 'URL del Dominio Jira (Host)',
        'jira.email': 'Email de Cuenta Atlassian',
        'jira.token': 'API Token de Jira',
        'jira.project': 'Clave del Proyecto',
        'jira.testBtn': 'Probar Conexión',
        'jira.saveBtn': 'Guardar y Continuar',

        'ado.title': 'Integración B2B — Microsoft Azure DevOps',
        'ado.attachTab': 'Adjuntar a Work Item',
        'ado.configTab': 'Configuración Azure DevOps PAT',
        'ado.org': 'Organización de Azure DevOps',
        'ado.project': 'Nombre del Proyecto',
        'ado.pat': 'Personal Access Token (PAT)',

        // Visual Diff
        'diff.title': 'Comparador Visual de Evidencias (Visual Diff)',
        'diff.base': 'Base (Antes / Esperado)',
        'diff.comparison': 'Comparación (Después / Actual)',
        'diff.sliderMode': 'Cortina Deslizante',
        'diff.sideMode': 'Lado a Lado',
        'diff.blendMode': 'Superposición',

        // Settings
        'settings.title': 'Configuración de SnapProof',
        'settings.language': 'Idioma de la Aplicación',
        'settings.appearance': 'Apariencia y Tema',
        'settings.storageFolder': 'Carpeta de Almacenamiento Local',
        'settings.openFolder': 'Abrir Carpeta',
    },
    en: {
        // App Shell & Navigation
        'nav.recents': 'Recents',
        'nav.flows': 'Flows',
        'nav.smartFolders': 'Smart Folders',
        'nav.builder': 'Report Builder',
        'nav.history': 'History',
        'nav.settings': 'Settings',
        'nav.quickFlow': 'Quick Flow',
        'nav.resolution': 'Resolution',

        // Actions & Buttons
        'action.save': 'Save',
        'action.cancel': 'Cancel',
        'action.delete': 'Delete',
        'action.edit': 'Edit',
        'action.copy': 'Copy',
        'action.export': 'Export',
        'action.refresh': 'Refresh',
        'action.search': 'Search...',
        'action.filter': 'Filter',
        'action.compare': 'Compare (Diff)',
        'action.saveToStorage': 'Save to Storage',
        'action.attachJira': 'Attach to Jira',
        'action.attachADO': 'Attach to Azure DevOps',

        // Recents View
        'recents.title': 'Recent Captures',
        'recents.emptyTitle': 'No captures yet',
        'recents.emptyDesc': 'Your captured evidence will appear here after using capture shortcuts.',
        'recents.copySuccess': 'Image copied to clipboard',
        'recents.copyError': 'Failed to copy image',

        // Filter Bar
        'filter.allTime': 'All Time',
        'filter.today': 'Today',
        'filter.pastWeek': 'Past Week',
        'filter.pastMonth': 'Past Month',
        'filter.allStatus': 'All Status',
        'filter.success': 'Success',
        'filter.failure': 'Failure',
        'filter.pending': 'Pending',
        'filter.clearFilters': 'Clear Filters',

        // Report Wizard
        'wizard.title': 'Report Wizard',
        'wizard.configTitle': 'Report Configuration',
        'wizard.template': 'Design / Template',
        'wizard.palette': 'Color Palette',
        'wizard.reportTitle': 'Report Title',
        'wizard.subtitle': 'Subtitle',
        'wizard.author': 'Author',
        'wizard.projectName': 'Project Name',
        'wizard.reportDate': 'Report Date',
        'wizard.livePreview': 'Live Preview',
        'wizard.quickExport': 'Quick Export',
        'wizard.continueExport': 'Continue to Export',
        'wizard.saveDraft': 'Save Draft',
        'wizard.downloadPdf': 'Download PDF',
        'wizard.downloadDocx': 'Download Word',

        // Integrations
        'jira.title': 'B2B Integration — Atlassian Jira',
        'jira.attachTab': 'Attach to Ticket',
        'jira.configTab': 'Jira API Settings',
        'jira.host': 'Jira Host URL',
        'jira.email': 'Atlassian Account Email',
        'jira.token': 'Jira API Token',
        'jira.project': 'Project Key',
        'jira.testBtn': 'Test Connection',
        'jira.saveBtn': 'Save & Continue',

        'ado.title': 'B2B Integration — Microsoft Azure DevOps',
        'ado.attachTab': 'Attach to Work Item',
        'ado.configTab': 'Azure DevOps PAT Settings',
        'ado.org': 'Azure DevOps Organization',
        'ado.project': 'Project Name',
        'ado.pat': 'Personal Access Token (PAT)',

        // Visual Diff
        'diff.title': 'Evidence Visual Diff Comparator',
        'diff.base': 'Base (Before / Expected)',
        'diff.comparison': 'Comparison (After / Actual)',
        'diff.sliderMode': 'Split Slider',
        'diff.sideMode': 'Side-by-Side',
        'diff.blendMode': 'Overlay Blend',

        // Settings
        'settings.title': 'SnapProof Settings',
        'settings.language': 'Application Language',
        'settings.appearance': 'Appearance & Theme',
        'settings.storageFolder': 'Local Storage Folder',
        'settings.openFolder': 'Open Folder',
    }
};

export type TranslationKey = keyof typeof translations.es;
