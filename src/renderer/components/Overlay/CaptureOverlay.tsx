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
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-0 w-[500px] border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
                <div className="relative h-48 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <img src={currentCapture.thumbnail} className="max-h-full max-w-full object-contain" />
                    <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        {new Date(currentCapture.timestamp).toLocaleTimeString()}
                    </div>
                </div>

                <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Add Context</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title <span className="text-red-500">*</span></label>
                            <input
                                className="input w-full"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="e.g. Login Button Failure"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                            <textarea
                                className="input w-full min-h-[80px]"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Steps to reproduce, environment..."
                            />
                        </div>

                        {/* Status Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Result Status</label>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setStatus('success')}
                                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200 font-medium ${status === 'success' ? 'bg-success-50 dark:bg-success-500/20 border-success-500 text-success-700 dark:text-success-300 ring-2 ring-success-500 dark:ring-success-500/50 shadow-lg shadow-success-500/10' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750 hover:border-gray-300 dark:hover:border-gray-600'}`}
                                >
                                    <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${status === 'success' ? 'bg-success-500 dark:bg-success-400' : 'bg-gray-300 dark:bg-gray-600'}`} />
                                    Success
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStatus('failure')}
                                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200 font-medium ${status === 'failure' ? 'bg-error-50 dark:bg-error-500/20 border-error-500 text-error-700 dark:text-error-300 ring-2 ring-error-500 dark:ring-error-500/50 shadow-lg shadow-error-500/10' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750 hover:border-gray-300 dark:hover:border-gray-600'}`}
                                >
                                    <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${status === 'failure' ? 'bg-error-500 dark:bg-error-400' : 'bg-gray-300 dark:bg-gray-600'}`} />
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
