
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCaptureStore } from '../../stores/captureStore';
import { ChevronRight, X, Check, Camera, Layers, FileText, Menu as MenuIcon, Keyboard } from 'lucide-react';
import { logger } from '../../services/Logger';

interface Step {
    id: string;
    target?: string;
    title: string;
    content: string;
    icon?: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const STEPS: Step[] = [
    {
        id: 'welcome',
        title: '👋 Welcome to SnapProof',
        content: 'Your professional evidence collection tool. Let\'s take a quick 1-minute tour to get you started with the essential features.',
        icon: <Camera size={24} className="text-primary-500" />,
        position: 'center'
    },
    {
        id: 'shortcuts',
        title: '⌨️ Keyboard Shortcuts',
        content: 'Capture screenshots instantly:\n• Ctrl+Shift+1 - Single capture\n• Ctrl+Shift+2 - Quick Flow mode (series)\n• These work anytime, even when SnapProof is minimized!',
        icon: <Keyboard size={24} className="text-primary-500" />,
        position: 'center'
    },
    {
        id: 'captures-list',
        target: 'captures-list',
        title: '📸 Smart Clipboard',
        content: 'All your screenshots appear here instantly. Each capture can be edited, tagged as success/failure, or deleted. Think of it as your evidence timeline.',
        icon: <Camera size={24} className="text-primary-500" />,
        position: 'right'
    },
    {
        id: 'menu-btn',
        target: 'menu-btn',
        title: '📁 Organization with Flows',
        content: 'Open the menu to access Flows - a powerful way to group related screenshots into sequences. Perfect for bug reports or step-by-step documentation.',
        icon: <MenuIcon size={24} className="text-primary-500" />,
        position: 'bottom'
    },
    {
        id: 'export-btn',
        target: 'export-btn',
        title: '📄 Professional Reports',
        content: 'Generate beautiful PDF or DOCX reports with one click. Choose from multiple templates and customize your documentation style.',
        icon: <FileText size={24} className="text-primary-500" />,
        position: 'bottom'
    }
];

export const OnboardingOverlay: React.FC = () => {
    const { tutorial, setTutorialState, endTutorial } = useCaptureStore();
    const { isActive, currentStep } = tutorial;
    const [rect, setRect] = useState<DOMRect | null>(null);

    const step = STEPS[currentStep];

    useEffect(() => {
        if (!isActive) return;

        const updateRect = () => {
            if (step.target) {
                const element = document.querySelector(`[data-tour="${step.target}"]`);
                if (element) {
                    setRect(element.getBoundingClientRect());
                } else {
                    // If element not found, fallback to center or skip
                    // For now, let's just center it if target missing
                    setRect(null);
                }
            } else {
                setRect(null);
            }
        };

        // Initial update
        updateRect();

        // Update on resize
        window.addEventListener('resize', updateRect);

        // Update on mutation (in case UI shifts)
        const observer = new MutationObserver(updateRect);
        observer.observe(document.body, { subtree: true, childList: true });

        return () => {
            window.removeEventListener('resize', updateRect);
            observer.disconnect();
        };
    }, [isActive, currentStep, step]);

    if (!isActive) return null;

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setTutorialState({ currentStep: currentStep + 1 });
            logger.debug('UI', `Tutorial step advanced to ${currentStep + 1}`);
        } else {
            logger.info('UI', 'Tutorial completed');
            endTutorial();
        }
    };

    const handleSkip = () => {
        logger.info('UI', 'Tutorial skipped', { currentStep });
        endTutorial();
    };

    // Calculate Spotlight Dimensions
    const isSpotlight = rect !== null;

    // Spotlight Mask using SVG
    // We create a path that covers the whole screen but has a "hole" for the rect
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Add padding to rect
    const pad = 8;
    const r = rect ? {
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
        bottom: rect.bottom + pad,
        right: rect.right + pad,
    } : null;

    const maskPath = r
        ? `M0,0 L${windowWidth},0 L${windowWidth},${windowHeight} L0,${windowHeight} Z M${r.left},${r.top} L${r.left},${r.bottom} L${r.right},${r.bottom} L${r.right},${r.top} Z`
        : ''; // No hole if no rect

    return (
        <AnimatePresence>
            {isActive && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] overflow-hidden"
                >
                    {/* Backdrop with Spotlight Hole */}
                    {isSpotlight ? (
                        <svg className="absolute inset-0 w-full h-full pointer-events-none fill-neutral-950/80">
                            <path d={maskPath} fillRule="evenodd" />
                        </svg>
                    ) : (
                        <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm" />
                    )}

                    {/* Spotlight Border Animation */}
                    {isSpotlight && r && (
                        <motion.div
                            layoutId="spotlight-border"
                            className="absolute border-2 border-indigo-500 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.5)] pointer-events-none"
                            style={{
                                top: r.top,
                                left: r.left,
                                width: r.width,
                                height: r.height,
                            }}
                            initial={{ scale: 1.1, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                    )}

                    {/* Tooltip Card */}
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="absolute w-[400px] bg-white dark:bg-neutral-900 border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                        style={getTooltipStyle(r, step.position)}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-start p-6 pb-4 border-b border-neutral-100 dark:border-neutral-800/50">
                            <div className="flex items-start gap-4 flex-1">
                                {step.icon && (
                                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 flex items-center justify-center">
                                        {step.icon}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">
                                        {step.title}
                                    </h3>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                        Step {currentStep + 1} of {STEPS.length}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleSkip}
                                className="flex-shrink-0 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                                title="Skip tutorial"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            <p className="text-neutral-600 dark:text-neutral-300 text-sm leading-relaxed whitespace-pre-line">
                                {step.content}
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between px-6 pb-6">
                            <div className="flex gap-1.5">
                                {STEPS.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStep
                                            ? 'w-6 bg-primary-500'
                                            : idx < currentStep
                                                ? 'w-1.5 bg-primary-300 dark:bg-primary-700'
                                                : 'w-1.5 bg-neutral-200 dark:bg-neutral-700'
                                            }`}
                                    />
                                ))}
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleNext}
                                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm"
                            >
                                {currentStep === STEPS.length - 1 ? 'Got it!' : 'Next'}
                                {currentStep === STEPS.length - 1 ? <Check size={16} /> : <ChevronRight size={16} />}
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

function getTooltipStyle(rect: { top: number, bottom: number, left: number, right: number, width: number, height: number } | null, position?: string): React.CSSProperties {
    const tooltipWidth = 400; // Updated to match new card width
    const tooltipHeight = 240; // Approximate height (larger due to icon)
    const gap = 16;
    const margin = 16; // Minimum margin from screen edges

    if (!rect) {
        // Center of screen
        return {
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
        };
    }

    const style: React.CSSProperties = { position: 'absolute' };
    let top: number | undefined;
    let left: number | undefined;

    switch (position) {
        case 'top':
            top = rect.top - tooltipHeight - gap;
            left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
            break;
        case 'bottom':
            top = rect.bottom + gap;
            left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
            break;
        case 'left':
            top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
            left = rect.left - tooltipWidth - gap;
            break;
        case 'right':
            top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
            left = rect.right + gap;
            break;
        default: // Auto or Center fallback
            top = rect.bottom + gap;
            left = rect.left;
    }

    // Boundary clamping - ensure tooltip stays within viewport
    const maxLeft = window.innerWidth - tooltipWidth - margin;
    const maxTop = window.innerHeight - tooltipHeight - margin;

    // Clamp left position
    if (left !== undefined) {
        if (left < margin) left = margin;
        if (left > maxLeft) left = maxLeft;
        style.left = left;
    }

    // Clamp top position, flip if needed
    if (top !== undefined) {
        // If tooltip would go above screen, flip to bottom
        if (top < margin && position === 'top') {
            top = rect.bottom + gap;
        }
        // If tooltip would go below screen, flip to top
        if (top > maxTop && position === 'bottom') {
            top = rect.top - tooltipHeight - gap;
            if (top < margin) top = margin; // Still clamp if flipped position overflows
        }
        // Final clamp
        if (top < margin) top = margin;
        if (top > maxTop) top = maxTop;
        style.top = top;
    }

    return style;
}
