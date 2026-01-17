import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LogoSnapProof from '../../assets/LogoSnapProof.jpg';

interface FloatingPhoto {
    id: number;
    x: number;
    y: number;
    rotation: number;
    delay: number;
}

// Frases amigables que rotan
const taglines = [
    "Captura cada momento importante",
    "Documenta tu trabajo con estilo",
    "Evidencia que habla por sí misma",
    "Simplifica tus reportes de QA",
    "Captura. Organiza. Comparte.",
    "Tu asistente de documentación",
    "Haz que cada captura cuente"
];

export const HomePage: React.FC = () => {
    const [photos, setPhotos] = useState<FloatingPhoto[]>([]);
    const [currentTaglineIndex, setCurrentTaglineIndex] = useState(0);
    const [logoKey, setLogoKey] = useState(0);

    // Rotar frase cada 4 segundos
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTaglineIndex(prev => (prev + 1) % taglines.length);
            setLogoKey(prev => prev + 1); // Trigger logo animation
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    // Generar fotos flotantes cada 5 segundos
    useEffect(() => {
        const interval = setInterval(() => {
            const newPhoto: FloatingPhoto = {
                id: Date.now(),
                x: Math.random() * 80 + 10, // 10% to 90%
                y: Math.random() * 100,
                rotation: Math.random() * 30 - 15,
                delay: Math.random() * 1
            };

            setPhotos(prev => [...prev, newPhoto]);

            // Remove after animation completes
            setTimeout(() => {
                setPhotos(prev => prev.filter(p => p.id !== newPhoto.id));
            }, 12000);
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative h-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* Floating Photos Background - Instax Style */}
            <AnimatePresence>
                {photos.map(photo => (
                    <motion.div
                        key={photo.id}
                        initial={{
                            opacity: 0,
                            scale: 0,
                            x: `${photo.x}vw`,
                            y: '110vh',
                            rotate: photo.rotation
                        }}
                        animate={{
                            opacity: [0, 0.7, 0.7, 0],
                            scale: [0, 1, 1, 0.8],
                            y: '-30vh',
                            rotate: photo.rotation + (Math.random() * 20 - 10)
                        }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={{
                            duration: 12,
                            delay: photo.delay,
                            ease: 'easeInOut'
                        }}
                        className="absolute w-32 h-40 pointer-events-none"
                        style={{
                            boxShadow: '0 8px 16px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1)',
                            background: 'white',
                            padding: '8px',
                            paddingBottom: '32px'
                        }}
                    >
                        <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center rounded-sm">
                            <img
                                src={LogoSnapProof}
                                className="w-16 h-16 object-cover rounded-full opacity-30"
                                alt="floating screenshot"
                            />
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Main Content */}
            <div className="z-10 text-center space-y-8 px-4">
                <motion.div
                    key={logoKey}
                    initial={{ scale: 1, rotate: 0 }}
                    animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                    }}
                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                >
                    <img
                        src={LogoSnapProof}
                        alt="SnapProof Logo"
                        className="w-48 h-48 mx-auto rounded-full shadow-2xl ring-4 ring-primary-200 dark:ring-primary-800"
                    />
                </motion.div>

                <motion.h1
                    className="text-6xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-400 dark:to-primary-600 bg-clip-text text-transparent"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    SnapProof
                </motion.h1>

                <AnimatePresence mode="wait">
                    <motion.p
                        key={currentTaglineIndex}
                        className="text-2xl text-gray-700 dark:text-gray-300 font-light max-w-lg mx-auto"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.5 }}
                    >
                        {taglines[currentTaglineIndex]}
                    </motion.p>
                </AnimatePresence>

                <motion.div
                    className="flex gap-4 justify-center pt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    <div className="px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Presiona</span>
                        <kbd className="ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">Ctrl+Shift+1</kbd>
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">para capturar</span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
