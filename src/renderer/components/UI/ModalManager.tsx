
import React from 'react';
import { useGlobalModal } from '../../contexts/GlobalModalContext';
import { useCaptureStore } from '../../stores/captureStore';
import { useUI } from '../../contexts/UIContext';
import { ReportWizardModal } from '../Reporting/ReportWizardModal';
import { ImageEditorModal } from '../Editor/ImageEditorModal';
import { FlowEditorModal } from '../Flows/FlowEditorModal';
import { CaptureOverlay } from '../Overlay/CaptureOverlay';
import { toast, confirm } from '../../utils/toast';
import { CaptureFlow } from '../../../shared/types/FlowTypes';

export const ModalManager: React.FC = () => {
    const {
        reportModalOpen,
        closeReportWizard,
        reportCaptures,
        selectedDraft,

        flowEditorOpen,
        editingFlow,
        closeFlowEditor,

        editingCapture,
        closeImageEditor
    } = useGlobalModal();

    const { captures, deleteCapture, updateCapture, userProfile, currentCapture } = useCaptureStore();
    const { navigateToHome } = useUI(); // Not really needed here but good for access

    // Handlers needed for Modals
    const handleDeleteCapture = async (id: string) => {
        const confirmed = await confirm({
            title: '¿Eliminar captura?',
            text: '¿Estás seguro? Esta acción no se puede deshacer.',
            confirmText: 'Sí, Eliminar',
            cancelText: 'Cancelar',
            type: 'danger'
        });

        if (confirmed) {
            deleteCapture(id);
            closeImageEditor();
            toast.success('Captura eliminada exitosamente');
        }
    };

    const handleSaveImageEdit = (id: string, newThumbnail: string) => {
        updateCapture(id, {
            thumbnail: newThumbnail,
            status: 'saved'
        });
        closeImageEditor();
    };

    const handleSaveFlow = async (flow: CaptureFlow) => {
        // This is tricky. App.tsx handled saving flows because flows were local state.
        // We probably need a useFlows hook or move flows to a store.
        // For now, we'll access the IPC directly here? OR pass a callback?
        // Ideally, flows should be in a Store.
        // Since I haven't created a FlowStore yet, I will use direct IPC calls here,
        // mirroring what App.tsx did, but without updating the local state in App.tsx...
        // WAIT. If App.tsx holds the 'flows' state, updating it from here is hard.

        // CORRECTION: The Prompt didn't ask for FlowStore, but to avoid breaking,
        // I should probably create a simple useFlows hook or stick to IPC.
        // But App.tsx `flows` state drives the UI list.
        // Ideally, `ContentRouter` needs `flows` too.

        // I will assume for this step that I will refactor `App.tsx` to use a `FlowStore` or `useFlows` context/hook.
        // Let's create a useFlows hook in `src/renderer/hooks/useFlows.ts` quickly?
        // Or simply trigger a reload in App via an event?

        if (window.electron?.saveFlow) {
            await window.electron.saveFlow(flow);
            // We need to notify the app to reload flows.
            // A simple event bus or a store is best.
            // Let's dispatch a custom event on window for now to keep it decoupled?
            window.dispatchEvent(new CustomEvent('flows-updated'));
        }
        closeFlowEditor();
    };

    return (
        <>
            {/* Capture Overlay */}
            {currentCapture && <CaptureOverlay />}

            {/* Report Wizard */}
            {reportModalOpen && (
                <ReportWizardModal
                    isOpen={reportModalOpen}
                    onClose={closeReportWizard}
                    captures={reportCaptures || captures}
                    authorName={userProfile?.name || 'Unknown User'}
                    initialDraft={selectedDraft}
                />
            )}

            {/* Image Editor */}
            {editingCapture && (
                <ImageEditorModal
                    capture={editingCapture}
                    onClose={closeImageEditor}
                    onSave={handleSaveImageEdit}
                    onDelete={handleDeleteCapture}
                />
            )}

            {/* Flow Editor */}
            <FlowEditorModal
                isOpen={flowEditorOpen}
                flow={editingFlow}
                onClose={closeFlowEditor}
                onSave={handleSaveFlow}
            />
        </>
    );
};
