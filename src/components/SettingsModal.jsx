import React, { useState } from 'react';
import { X, Moon, Sun, Key, HelpCircle, ExternalLink, Check } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose, isDarkMode, toggleTheme, apiKey, onSaveApiKey }) => {
    const [keyInput, setKeyInput] = useState(apiKey);
    const [showHelp, setShowHelp] = useState(false);

    if (!isOpen) return null;

    const handleSave = () => {
        onSaveApiKey(keyInput);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className={`w-full max-w-md rounded-3xl shadow-2xl overflow-hidden transition-colors ${isDarkMode ? 'bg-[#181818] text-white' : 'bg-white text-black'}`}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-4">
                    <h2 className="text-2xl font-semibold">Settings</h2>
                    <button onClick={onClose} className={`p-2 rounded-full hover:bg-neutral-500/10 transition-colors`}>
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 pt-2 flex flex-col gap-8">

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
                        <button
                            onClick={toggleTheme}
                            className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${isDarkMode ? 'bg-green-500' : 'bg-neutral-300'}`}
                        >
                            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${isDarkMode ? 'left-7' : 'left-1'}`} />
                        </button>
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
                                    <li>Click "Get API key" and create one.</li>
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
                                placeholder="Enter your API Key..."
                                className={`w-full px-4 py-3 rounded-xl border outline-none transition-all placeholder:font-normal font-mono text-sm
                                    ${isDarkMode
                                        ? 'bg-[#222] border-neutral-700 focus:border-green-500 placeholder:text-neutral-600'
                                        : 'bg-neutral-50 border-neutral-200 focus:border-green-500 placeholder:text-neutral-400'
                                    }`}
                            />
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className={`p-6 border-t ${isDarkMode ? 'border-neutral-800' : 'border-neutral-100'}`}>
                    <button
                        onClick={handleSave}
                        className="w-full py-3.5 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 active:scale-[0.98]"
                    >
                        <Check size={20} />
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
