import React, { useState, useEffect } from 'react';
import SimpleCalculatorPage from './components/SimpleCalculatorPage';
import AiTutorPage from './components/AiTutorPage';
import SettingsModal from './components/SettingsModal';

// --- Error Boundary ---
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
    componentDidCatch(error, errorInfo) { console.error("Uncaught error:", error, errorInfo); }
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
    const [isSimpleCalculator, setIsSimpleCalculator] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(true);

    // Settings State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [apiKey, setApiKey] = useState(() => {
        return localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '';
    });

    const toggleTheme = () => setIsDarkMode(!isDarkMode);

    const handleSaveApiKey = (key) => {
        setApiKey(key);
        localStorage.setItem('gemini_api_key', key);
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
                    apiKey={apiKey}
                    onSaveApiKey={handleSaveApiKey}
                />

                {/* 1. Simple Calculator View */}
                <div
                    className={`absolute inset-0 transition-transform duration-500 ease-in-out z-10 ${!isSimpleCalculator ? '-translate-x-full opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'}`}
                >
                    <SimpleCalculatorPage
                        onSwitch={() => setIsSimpleCalculator(false)}
                        isDarkMode={isDarkMode}
                        onOpenSettings={() => setIsSettingsOpen(true)}
                    />
                </div>

                {/* 2. AI Tutor View */}
                <div
                    className={`absolute inset-0 transition-transform duration-500 ease-in-out z-20 ${isSimpleCalculator ? 'translate-x-full opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'}`}
                >
                    {!isSimpleCalculator && (
                        <AiTutorPage
                            onBack={() => setIsSimpleCalculator(true)}
                            isDarkMode={isDarkMode}
                            apiKey={apiKey}
                            onOpenSettings={() => setIsSettingsOpen(true)}
                        />
                    )}
                </div>

            </div>
        </ErrorBoundary>
    );
}
