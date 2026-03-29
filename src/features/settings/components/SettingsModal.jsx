import React, { useState, useEffect, useCallback } from 'react';
import { X, Moon, Sun, Key, HelpCircle, ExternalLink, Check, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import useDebouncedValue from '@features/settings/hooks/useDebouncedValue';
import { fetchAvailableGeminiModels } from '@features/settings/services/geminiModelsService';

const SettingsModal = ({ isOpen, onClose, isDarkMode, toggleTheme, userApiKey, onSaveApiKey, modelName, onSaveModelName }) => {
    const [keyInput, setKeyInput] = useState(userApiKey);
    const [showHelp, setShowHelp] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [availableModels, setAvailableModels] = useState([]);
    const [isLoadingModels, setIsLoadingModels] = useState(false);
    const [fetchError, setFetchError] = useState(null);
    const [selectedModel, setSelectedModel] = useState(modelName);
    const debouncedKeyInput = useDebouncedValue(keyInput, 350);

    const fetchModels = useCallback(async (key, currentModel = selectedModel) => {
        setIsLoadingModels(true);
        setFetchError(null);
        try {
            const models = await fetchAvailableGeminiModels(key);

            setAvailableModels(models);

            // Auto-select if current selection is invalid
            if (models.length > 0 && !models.includes(currentModel)) {
                // Prefer 'gemini-1.5-flash' or 'pro' if available
                const best = models.find(m => m.includes('gemini-1.5-flash')) ||
                    models.find(m => m.includes('gemini-1.5-pro')) ||
                    models[0];
                setSelectedModel(best);
            }
        } catch (err) {
            console.error('Failed to fetch models', err);
            setFetchError('Could not fetch models. Check API Key.');
            // Fallback to manual entry or keep existing
        } finally {
            setIsLoadingModels(false);
        }
    }, [selectedModel]);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    // Sync props to state when modal opens
    useEffect(() => {
        if (isOpen) {
            setKeyInput(userApiKey);
            setSelectedModel(modelName);
            fetchModels(userApiKey, modelName);
        }
    }, [isOpen, userApiKey, modelName, fetchModels]);

    useEffect(() => {
        if (!isOpen) return;

        fetchModels(debouncedKeyInput.trim(), selectedModel);
    }, [debouncedKeyInput, isOpen, selectedModel, fetchModels]);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    const handleSave = () => {
        onSaveApiKey(keyInput);
        if (selectedModel) {
            onSaveModelName(selectedModel);
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className={`w-full max-w-md rounded-3xl shadow-2xl overflow-hidden transition-colors flex flex-col max-h-[90vh] ${isDarkMode ? 'bg-[#181818] text-white' : 'bg-white text-black'}`}
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: 'spring', damping: 45, stiffness: 200, mass: 1.2 }}
                drag="y"
                dragConstraints={{ top: 0 }}
                dragElastic={{ top: 0.05 }}
                dragSnapToOrigin
                onDragEnd={(e, info) => {
                    if (info.offset.y > 120 || info.velocity.y > 300) {
                        onClose();
                    }
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drag Handle */}
                <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
                    <div className="w-10 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                </div>
                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-4 shrink-0">
                    <h2 className="text-2xl font-semibold">Settings</h2>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={onClose}
                        className={`p-2 rounded-full hover:bg-neutral-500/10 transition-colors`}
                    >
                        <X size={24} />
                    </motion.button>
                </div>

                {/* Content - Scrollable */}
                <div className="p-6 pt-2 flex flex-col gap-8 overflow-y-auto custom-scrollbar">

                    {/* Theme Section */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-full ${isDarkMode ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
                                {isDarkMode ? <Moon size={22} /> : <Sun size={22} />}
                            </div>
                            <div>
                                <h3 className="font-medium text-lg">Appearance</h3>
                                <p className={`text-sm ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                    {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                                </p>
                            </div>
                        </div>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={toggleTheme}
                            className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${isDarkMode ? 'bg-green-500' : 'bg-neutral-300'}`}
                        >
                            <motion.div
                                className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
                                animate={{ x: isDarkMode ? 24 : 0 }}
                                initial={false}
                                transition={{ type: 'spring', damping: 30, stiffness: 200 }}
                                style={{ left: '4px' }}
                            />
                        </motion.button>
                    </div>

                    <hr className={`${isDarkMode ? 'border-neutral-800' : 'border-neutral-100'}`} />

                    {/* API Key Section */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-full ${isDarkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                                    <Key size={22} />
                                </div>
                                <div>
                                    <h3 className="font-medium text-lg">Gemini API Key</h3>
                                    <p className={`text-sm ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                        Required for AI Tutor
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowHelp(!showHelp)}
                                className={`p-2 rounded-full transition-colors ${showHelp ? 'text-green-500 bg-green-500/10' : 'text-neutral-500 hover:bg-neutral-500/10'}`}
                            >
                                <HelpCircle size={22} />
                            </button>
                        </div>

                        {showHelp && (
                            <div className={`text-sm p-4 rounded-xl flex flex-col gap-2 ${isDarkMode ? 'bg-neutral-900 border border-neutral-800' : 'bg-blue-50 border border-blue-100'}`}>
                                <p>To get a free Gemini API key:</p>
                                <ol className="list-decimal list-inside opacity-80 space-y-1">
                                    <li>Go to Google AI Studio.</li>
                                    <li>Log in with your Google account.</li>
                                    <li>Click &quot;Get API key&quot; and create one.</li>
                                </ol>
                                <a
                                    href="https://aistudio.google.com/app/apikey"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 mt-2 font-medium text-blue-500 hover:underline"
                                >
                                    Get API Key <ExternalLink size={14} />
                                </a>
                            </div>
                        )}

                        <div className="relative">
                            <input
                                type="password"
                                value={keyInput}
                                onChange={(e) => setKeyInput(e.target.value)}
                                placeholder="Enter your own key (optional)..."
                                className={`w-full px-4 py-3 rounded-xl border outline-none transition-all placeholder:font-normal font-mono text-sm
                                    ${isDarkMode
                                        ? 'bg-[#222] border-neutral-700 focus:border-green-500 placeholder:text-neutral-600'
                                        : 'bg-neutral-50 border-neutral-200 focus:border-green-500 placeholder:text-neutral-400'
                                    }`}
                            />
                        </div>
                        {!userApiKey && (
                            <p className="text-xs text-neutral-500">
                                If backend is unavailable (for example GitHub Pages), add your own key here.
                            </p>
                        )}
                    </div>

                    {/* Model Selection Section */}
                    <div className="flex flex-col gap-2">
                        <label className={`text-sm font-medium ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                            AI Model
                        </label>
                        <div className="relative">
                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                disabled={isLoadingModels}
                                className={`w-full px-4 py-3 rounded-xl border outline-none appearance-none transition-all text-sm
                                    ${isDarkMode
                                        ? 'bg-[#222] border-neutral-700 focus:border-green-500 text-white'
                                        : 'bg-neutral-50 border-neutral-200 focus:border-green-500 text-black'
                                    }`}
                            >
                                {availableModels.length > 0 ? (
                                    availableModels.map(model => (
                                        <option key={model} value={model}>{model}</option>
                                    ))
                                ) : (
                                    <option value={selectedModel}>{selectedModel} (Default)</option>
                                )}
                            </select>

                            {isLoadingModels && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                        {fetchError && <p className="text-red-500 text-xs">{fetchError}</p>}
                        <p className="text-xs text-neutral-500">
                            Auto-detected from API Key.
                        </p>
                    </div>


                    {/* Install App Section (Only if installable) */}
                    {deferredPrompt && (
                        <>
                            <hr className={`${isDarkMode ? 'border-neutral-800' : 'border-neutral-100'}`} />
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-full ${isDarkMode ? 'bg-orange-500/10 text-orange-400' : 'bg-orange-100 text-orange-600'}`}>
                                        <Download size={22} />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-lg">Install App</h3>
                                        <p className={`text-sm ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                            Add to Home Screen
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleInstall}
                                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                                >
                                    Install
                                </button>
                            </div>
                        </>
                    )}

                </div>


                {/* Footer */}
                <div className={`p-6 border-t ${isDarkMode ? 'border-neutral-800' : 'border-neutral-100'} shrink-0`}>
                    <button
                        onClick={handleSave}
                        className="w-full py-3.5 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 active:scale-[0.98]"
                    >
                        <Check size={20} />
                        Save Changes
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default SettingsModal;
