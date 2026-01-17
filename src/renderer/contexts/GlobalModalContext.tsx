
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CaptureFlow } from '../../shared/types/FlowTypes';
import { ReportDraft } from '../components/Views/ReportDraftsView';

interface GlobalModalContextType {
    // Report Wizard
    reportModalOpen: boolean;
    reportCaptures: any[] | null;
    selectedDraft: ReportDraft | null;
    openReportWizard: (captures?: any[], draft?: ReportDraft | null) => void;
    closeReportWizard: () => void;

    // Flow Editor
    flowEditorOpen: boolean;
    editingFlow: CaptureFlow | null;
    openFlowEditor: (flow: CaptureFlow | null) => void;
    closeFlowEditor: () => void;

    // Image Editor
    editingCapture: any | null;
    openImageEditor: (capture: any) => void;
    closeImageEditor: () => void;
}

const GlobalModalContext = createContext<GlobalModalContextType | undefined>(undefined);

export const GlobalModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Report Wizard State
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [reportCaptures, setReportCaptures] = useState<any[] | null>(null);
    const [selectedDraft, setSelectedDraft] = useState<ReportDraft | null>(null);

    // Flow Editor State
    const [flowEditorOpen, setFlowEditorOpen] = useState(false);
    const [editingFlow, setEditingFlow] = useState<CaptureFlow | null>(null);

    // Image Editor State
    const [editingCapture, setEditingCapture] = useState<any | null>(null);

    // Handlers
    const openReportWizard = (captures: any[] | null = null, draft: ReportDraft | null = null) => {
        setReportCaptures(captures);
        setSelectedDraft(draft);
        setReportModalOpen(true);
    };

    const closeReportWizard = () => {
        setReportModalOpen(false);
        setReportCaptures(null);
        setSelectedDraft(null);
    };

    const openFlowEditor = (flow: CaptureFlow | null) => {
        setEditingFlow(flow);
        setFlowEditorOpen(true);
    };

    const closeFlowEditor = () => {
        setFlowEditorOpen(false);
        setEditingFlow(null);
    };

    const openImageEditor = (capture: any) => {
        setEditingCapture(capture);
    };

    const closeImageEditor = () => {
        setEditingCapture(null);
    };

    return (
        <GlobalModalContext.Provider value={{
            reportModalOpen,
            reportCaptures,
            selectedDraft,
            openReportWizard,
            closeReportWizard,
            flowEditorOpen,
            editingFlow,
            openFlowEditor,
            closeFlowEditor,
            editingCapture,
            openImageEditor,
            closeImageEditor
        }}>
            {children}
        </GlobalModalContext.Provider>
    );
};

export const useGlobalModal = () => {
    const context = useContext(GlobalModalContext);
    if (!context) {
        throw new Error('useGlobalModal must be used within a GlobalModalProvider');
    }
    return context;
};
