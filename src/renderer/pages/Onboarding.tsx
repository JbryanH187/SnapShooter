import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Avatar from 'boring-avatars';
import { Check, ArrowRight, Camera } from 'lucide-react';
import { useCaptureStore } from '../stores/captureStore';

export const Onboarding: React.FC = () => {
    const [name, setName] = useState('');
    const setUserProfile = useCaptureStore(state => state.setUserProfile);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            setUserProfile(name);
        }
    };

    return (
        <div className="fixed inset-0 bg-white z-50 flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="max-w-md w-full text-center"
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="w-24 h-24 bg-primary-50 rounded-full mx-auto mb-8 flex items-center justify-center text-primary-500 shadow-sm"
                >
                    <Camera size={40} />
                </motion.div>

                <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">Welcome to SnapProof</h1>
                <p className="text-gray-500 mb-8 text-lg">Let's set up your profile for professional evidence reporting.</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-400">
                                {name ? (
                                    <Avatar
                                        size={24}
                                        name={name}
                                        variant="beam"
                                        colors={["#6366f1", "#818cf8", "#c7d2fe", "#e0e7ff", "#f5f3ff"]}
                                    />
                                ) : (
                                    <div className="w-6 h-6 rounded-full bg-gray-100" />
                                )}
                            </span>
                        </div>
                        <input
                            type="text"
                            required
                            className="block w-full pl-12 pr-4 py-4 text-center rounded-xl border-2 border-gray-100 bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10 transition-all text-lg font-medium outline-none"
                            placeholder="Enter your full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={!name.trim()}
                        type="submit"
                        className="w-full btn-primary py-4 text-base font-semibold shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span>Start Capturing</span>
                        <ArrowRight size={20} />
                    </motion.button>
                </form>

                <p className="mt-8 text-xs text-gray-400">
                    This name will appear as the author on all generated reports.
                </p>
            </motion.div>
        </div>
    );
};
