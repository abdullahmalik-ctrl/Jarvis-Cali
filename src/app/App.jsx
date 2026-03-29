import React, { useMemo, useState } from 'react';
import SimpleCalculatorPage from '@features/calculator/components/SimpleCalculatorPage';
import AiTutorPage from '@features/tutor/components/AiTutorPage';
import SettingsModal from '@features/settings/components/SettingsModal';
import PracticeMode from '@features/practice/components/PracticeMode';
import useSwipeGesture from '@shared/hooks/useSwipeGesture';
import { motion, AnimatePresence } from 'framer-motion';
import useOfflineSync from '@shared/hooks/useOfflineSync';
import { captureAppError } from '@shared/services/errorMonitoring';
import { generateViaGateway } from '@shared/services/geminiGatewayService';

// --- Error Boundary ---
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        captureAppError(error, { componentStack: errorInfo?.componentStack });
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 text-center text-red-500">
                    <h2 className="text-xl font-bold mb-2">Something went wrong.</h2>
                    <p className="text-sm opacity-70">{this.state.error?.message}</p>
                    <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-neutral-200 text-black rounded-full">Reload</button>
                </div>
            );
        }
        return this.props.children;
    }
}

// --- Main Root Component ---
export default function GeminiMathTutor() {
    const [activeView, setActiveView] = useState('calculator'); // 'calculator' | 'tutor' | 'practice'
    const [isDarkMode, setIsDarkMode] = useState(true);

    // Swipe gestures for sub-views to go back to calculator (Universal Back)
    const { ref: tutorSwipeRef } = useSwipeGesture({
        direction: 'horizontal',
        onSwipe: () => setActiveView('calculator'),
        enabled: activeView === 'tutor',
    });
    const { ref: practiceSwipeRef } = useSwipeGesture({
        direction: 'horizontal',
        onSwipe: () => setActiveView('calculator'),
        enabled: activeView === 'practice',
    });

    // Settings State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [userApiKey, setUserApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
    // Lifted Model Name State (Default to constant, but can be changed)
    const [modelName, setModelName] = useState(() => {
        return localStorage.getItem('gemini_model_name') || 'gemini-1.5-flash';
    });

    const syncProcessors = useMemo(() => ({
        'generate-tutor': async (payload) => {
            await generateViaGateway({
                contents: payload.contents,
                generationConfig: { temperature: 0.2 },
                modelName: payload.modelName || payload.fallbackModelName || 'gemini-1.5-flash',
                customApiKey: payload.apiKey || undefined,
            });
        },
        'generate-practice': async (payload) => {
            const prompt = `Generate ${payload.count} ${payload.config.difficulty} ${payload.config.topic} math questions for ${payload.config.curriculum} curriculum in valid JSON format.`;
            await generateViaGateway({
                modelName: payload.modelName || 'gemini-1.5-flash',
                contents: [{ parts: [{ text: prompt }] }],
                customApiKey: payload.apiKey || undefined,
            });
        },
    }), []);

    const {
        isOnline,
        pendingCount,
        isSyncing,
        updateAvailable,
        requestBackgroundSync,
        applyUpdate,
    } = useOfflineSync(syncProcessors);

    const toggleTheme = () => setIsDarkMode(!isDarkMode);

    const handleSaveApiKey = (key) => {
        const cleanKey = key.trim();
        setUserApiKey(cleanKey);

        if (cleanKey) {
            localStorage.setItem('gemini_api_key', cleanKey);
        } else {
            localStorage.removeItem('gemini_api_key');
        }
    };

    const handleSaveModelName = (model) => {
        setModelName(model);
        localStorage.setItem('gemini_model_name', model);
    };

    React.useEffect(() => {
        if (pendingCount > 0) {
            requestBackgroundSync();
        }
    }, [pendingCount, requestBackgroundSync]);

    const pageVariants = {
        initial: (direction) => ({
            x: direction > 0 ? '100%' : '-100%',
            opacity: 0,
        }),
        animate: {
            x: 0,
            opacity: 1,
            transition: {
                type: 'spring',
                damping: 45,
                stiffness: 200,
                mass: 1.2,
            },
        },
        exit: (direction) => ({
            x: direction < 0 ? '100%' : '-100%',
            opacity: 0,
            transition: {
                type: 'spring',
                damping: 45,
                stiffness: 200,
                mass: 1.2,
            },
        }),
    };

    // Track direction for slide (Tutor/Practice are to the right of Calculator)
    const getDirection = () => {
        if (activeView === 'calculator') return -1;
        return 1;
    };

    return (
        <ErrorBoundary>
            <div className={`w-full h-screen overflow-hidden font-sans select-none transition-colors duration-500 ${isDarkMode ? 'bg-black text-white' : 'bg-[#f0f0f0] text-black'} relative`}>

                {/* Settings Modal */}
                <SettingsModal
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                    isDarkMode={isDarkMode}
                    toggleTheme={toggleTheme}
                    userApiKey={userApiKey}
                    onSaveApiKey={handleSaveApiKey}
                    modelName={modelName}
                    onSaveModelName={handleSaveModelName}
                />

                <AnimatePresence initial={false} custom={getDirection()}>
                    {activeView === 'calculator' && (
                        <motion.div
                            key="calculator"
                            custom={getDirection()}
                            variants={pageVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="absolute inset-0 z-10"
                        >
                            <SimpleCalculatorPage
                                onSwitchToTutor={() => setActiveView('tutor')}
                                onSwitchToPractice={() => setActiveView('practice')}
                                isDarkMode={isDarkMode}
                                onOpenSettings={() => setIsSettingsOpen(true)}
                            />
                        </motion.div>
                    )}

                    {activeView === 'tutor' && (
                        <motion.div
                            key="tutor"
                            ref={tutorSwipeRef}
                            custom={getDirection()}
                            variants={pageVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="absolute inset-0 z-20"
                        >
                            <AiTutorPage
                                onBack={() => setActiveView('calculator')}
                                isDarkMode={isDarkMode}
                                apiKey={userApiKey}
                                modelName={modelName}
                                onOpenSettings={() => setIsSettingsOpen(true)}
                            />
                        </motion.div>
                    )}

                    {activeView === 'practice' && (
                        <motion.div
                            key="practice"
                            ref={practiceSwipeRef}
                            custom={getDirection()}
                            variants={pageVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="absolute inset-0 z-20"
                        >
                            <PracticeMode
                                onBack={() => setActiveView('calculator')}
                                apiKey={userApiKey}
                                modelName={modelName}
                                isDarkMode={isDarkMode}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {!isOnline && (
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-amber-500 text-black text-xs font-semibold shadow-lg">
                        Offline mode: actions are queued automatically.
                    </div>
                )}

                {isOnline && pendingCount > 0 && (
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-semibold shadow-lg">
                        {isSyncing ? 'Syncing queued actions...' : `${pendingCount} queued action(s) waiting to sync`}
                    </div>
                )}

                {updateAvailable && (
                    <div className="absolute bottom-4 right-4 z-50 p-4 rounded-2xl bg-white text-black shadow-2xl w-72">
                        <p className="text-sm font-semibold">New update available</p>
                        <p className="text-xs text-gray-600 mt-1">Refresh now to use the latest fixes and content.</p>
                        <button
                            type="button"
                            onClick={applyUpdate}
                            className="mt-3 w-full rounded-lg bg-black text-white py-2 text-sm font-semibold"
                        >
                            Update Now
                        </button>
                    </div>
                )}

            </div>
        </ErrorBoundary>
    );
}
