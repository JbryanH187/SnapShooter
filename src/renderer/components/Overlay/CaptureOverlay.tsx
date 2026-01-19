import React, { memo, useCallback, useState, useEffect } from 'react';
import { useCaptureStore } from '../../stores/captureStore';

export const CaptureOverlay = memo(() => {
    const currentCapture = useCaptureStore(state => state.currentCapture);
    const setCurrentCapture = useCaptureStore(state => state.setCurrentCapture);
    const addCapture = useCaptureStore(state => state.addCapture);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<'success' | 'failure' | 'pending'>('pending');

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !currentCapture) return;

        // Save capture with status
        addCapture({
            ...currentCapture,
            title,
            description,
            status: status
        });

        // Close overlay and reset
        setCurrentCapture(null);
        setTitle('');
        setDescription('');
        setStatus('pending'); // Reset status for next capture

    }, [title, description, status, currentCapture, addCapture, setCurrentCapture]);

    const handleCancel = useCallback(() => {
        setCurrentCapture(null);
        setTitle('');
        setDescription('');
        setStatus('pending'); // Reset status when canceling
    }, [setCurrentCapture]);

    // ESC key handler
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && currentCapture) {
                handleCancel();
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [currentCapture, handleCancel]);

    if (!currentCapture) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="rounded-xl shadow-2xl p-0 w-[500px] border overflow-hidden flex flex-col" style={{ background: 'var(--system-background)', borderColor: 'var(--separator-opaque)' }}>
                <div className="relative h-48 flex items-center justify-center" style={{ background: 'var(--fill-tertiary)' }}>
                    <img src={currentCapture.thumbnail} className="max-h-full max-w-full object-contain" />
                    <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        {new Date(currentCapture.timestamp).toLocaleTimeString()}
                    </div>
                </div>

                <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--label-primary)' }}>Add Context</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--label-secondary)' }}>Title <span className="text-red-500">*</span></label>
                            <input
                                className="input w-full"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="e.g. Login Button Failure"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--label-secondary)' }}>Description</label>
                            <textarea
                                className="input w-full min-h-[80px]"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Steps to reproduce, environment..."
                            />
                        </div>

                        {/* Status Selection */}
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--label-secondary)' }}>Result Status</label>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setStatus('success')}
                                    className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200 font-medium"
                                    style={status === 'success' ? {
                                        background: 'color-mix(in srgb, var(--system-green) 15%, transparent)',
                                        borderColor: 'var(--system-green)',
                                        color: 'var(--system-green)',
                                        boxShadow: '0 0 0 2px color-mix(in srgb, var(--system-green) 30%, transparent)'
                                    } : {
                                        background: 'var(--system-background)',
                                        borderColor: 'var(--separator-opaque)',
                                        color: 'var(--label-secondary)'
                                    }}
                                    onMouseEnter={(e) => { if (status !== 'success') e.currentTarget.style.background = 'var(--fill-secondary)'; }}
                                    onMouseLeave={(e) => { if (status !== 'success') e.currentTarget.style.background = 'var(--system-background)'; }}
                                >
                                    <div
                                        className="w-2.5 h-2.5 rounded-full shadow-sm"
                                        style={{ background: status === 'success' ? 'var(--system-green)' : 'var(--fill-tertiary)' }}
                                    />
                                    Success
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStatus('failure')}
                                    className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200 font-medium"
                                    style={status === 'failure' ? {
                                        background: 'color-mix(in srgb, var(--system-red) 15%, transparent)',
                                        borderColor: 'var(--system-red)',
                                        color: 'var(--system-red)',
                                        boxShadow: '0 0 0 2px color-mix(in srgb, var(--system-red) 30%, transparent)'
                                    } : {
                                        background: 'var(--system-background)',
                                        borderColor: 'var(--separator-opaque)',
                                        color: 'var(--label-secondary)'
                                    }}
                                    onMouseEnter={(e) => { if (status !== 'failure') e.currentTarget.style.background = 'var(--fill-secondary)'; }}
                                    onMouseLeave={(e) => { if (status !== 'failure') e.currentTarget.style.background = 'var(--system-background)'; }}
                                >
                                    <div
                                        className="w-2.5 h-2.5 rounded-full shadow-sm"
                                        style={{ background: status === 'failure' ? 'var(--system-red)' : 'var(--fill-tertiary)' }}
                                    />
                                    Failure
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={handleCancel} className="btn-ghost">Discard</button>
                            <button type="submit" className="btn-primary">Save Evidence</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
});
