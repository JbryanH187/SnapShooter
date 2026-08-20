import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Square, Minimize2, X } from 'lucide-react';

interface ResolutionPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (width: number, height: number) => void;
}

const PRESETS = [
    { id: 'full', name: 'Pantalla Completa', width: 0, height: 0, icon: Monitor, desc: 'Captura todo el monitor' },
    { id: 'square-lg', name: 'Cuadrado Grande', width: 1024, height: 1024, icon: Square, desc: '1024x1024 px' },
    { id: 'square-md', name: 'Cuadrado Medio', width: 800, height: 800, icon: Square, desc: '800x800 px' },
    { id: 'hd', name: 'HD Horizontal', width: 1280, height: 720, icon: Minimize2, desc: '1280x720 px' },
];

export const ResolutionPickerModal: React.FC<ResolutionPickerModalProps> = ({ isOpen, onClose, onSelect }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl"
                        style={{
                            background: 'var(--system-background-secondary)',
                            border: '1px solid var(--separator-opaque)'
                        }}
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-bold" style={{ color: 'var(--label-primary)' }}>
                                        Resolución de Captura
                                    </h3>
                                    <p className="text-sm mt-1" style={{ color: 'var(--label-secondary)' }}>
                                        Selecciona el tamaño exacto para tu captura centrada
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                                >
                                    <X size={20} style={{ color: 'var(--label-secondary)' }} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {PRESETS.map(preset => (
                                    <button
                                        key={preset.id}
                                        onClick={() => {
                                            onSelect(preset.width, preset.height);
                                            onClose();
                                        }}
                                        className="flex flex-col items-start p-4 rounded-xl text-left transition-all border hover:scale-[1.02]"
                                        style={{
                                            background: 'var(--fill-secondary)',
                                            borderColor: 'var(--separator-non-opaque)',
                                            color: 'var(--label-primary)'
                                        }}
                                    >
                                        <preset.icon size={24} className="mb-3" style={{ color: 'var(--system-blue)' }} />
                                        <span className="font-bold text-sm">{preset.name}</span>
                                        <span className="text-xs mt-1" style={{ color: 'var(--label-secondary)' }}>{preset.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
