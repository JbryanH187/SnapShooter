
import React from 'react';
import { Modal } from './Modal';
import { useGlobalModal } from '../../contexts/GlobalModalContext';
import { useCaptureStore } from '../../stores/captureStore';
import { useUI } from '../../contexts/UIContext';
import { ReportWizardModal } from '../Reporting/ReportWizardModal';
import { ImageEditorModal } from '../Editor/ImageEditorModal';
import { FlowEditorModal } from '../Flows/FlowEditorModal';
import { CaptureOverlay } from '../Overlay/CaptureOverlay';
import { toast, confirm } from '../../utils/toast';
import { CaptureFlow } from '../../../shared/types/FlowTypes';
import { useFlowStore } from '../../stores/flowStore';

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

    const { flows, saveFlow, loadFlows } = useFlowStore();

    const [showSuccessModal, setShowSuccessModal] = React.useState(false);

    const handleSaveFlow = async (flow: CaptureFlow) => {
        try {
            await saveFlow(flow);
            setShowSuccessModal(true);
        } catch (error) {
            toast.error('Error al guardar el flujo');
        }
        closeFlowEditor();
    };

    return (
        <>
            {/* Capture Overlay */}
            {currentCapture && <CaptureOverlay />}

            {/* Success Modal */}
            <Modal
                isOpen={showSuccessModal}
                onCancel={() => setShowSuccessModal(false)}
                title="¡Flujo Guardado!"
                type="success"
                description="Tu flujo se ha guardado correctamente en el Storage."
                confirmText="Entendido"
                onConfirm={() => setShowSuccessModal(false)}
                showFooter={true}
                maxWidth="max-w-sm"
            />

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
