import React, { useState, useRef, useEffect } from 'react';
import { Camera, PenTool, Calculator, ChevronLeft, ChevronRight, Sparkles, Sun, Moon, Delete, Trash2, Loader2, X, Eraser, Keyboard, Settings } from 'lucide-react';
import logo from '../assets/logo.svg';

import { MATHTYPE_DATA, MODEL_NAME } from '../utils/constants';
import { useKatex, MathLabel, LiveMathPreview, MarkdownRenderer } from './MathRenderers';
import { motion, AnimatePresence } from 'framer-motion';

const AiTutorPage = ({ onBack, isDarkMode, apiKey, onOpenSettings }) => {

    // --- State ---
    const [inputText, setInputText] = useState('');
    const [cursorPos, setCursorPos] = useState(0);
    const [selectedImage, setSelectedImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [isAiTutorOpen, setIsAiTutorOpen] = useState(false);

    // Drawing State
    const [drawTool, setDrawTool] = useState('type'); // 'type' | 'draw' | 'image'
    const [drawingMode, setDrawingMode] = useState('pen'); // 'pen' | 'eraser'
    const [isDrawing, setIsDrawing] = useState(false);
    const canvasRef = useRef(null);
    const [ctx, setCtx] = useState(null);
    const [drawingData, setDrawingData] = useState(null);

    // Math Keyboard State
    const [activeMathTab, setActiveMathTab] = useState('123');

    const isKatexReady = useKatex();

    // Force blur on mount to prevent mobile keyboard from opening automatically
    useEffect(() => {
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
    }, []);


    // --- Drawing Logic ---
    useEffect(() => {
        if (drawTool === 'draw' && canvasRef.current) {
            const canvas = canvasRef.current;
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            const context = canvas.getContext('2d');
            context.lineCap = 'round';
            context.lineJoin = 'round';
            context.lineWidth = 3;
            // Always use green stroke for visibility on dark/light
            context.strokeStyle = isDarkMode ? '#4ade80' : '#16a34a';
            setCtx(context);

            // If we have a selected image and just switched to draw mode, draw it!
            if (selectedImage) {
                const img = new Image();
                img.src = selectedImage.url;
                img.onload = () => {
                    // Scale image to fit canvas while maintaining aspect ratio
                    const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
                    const x = (canvas.width / 2) - (img.width / 2) * scale;
                    const y = (canvas.height / 2) - (img.height / 2) * scale;
                    context.drawImage(img, x, y, img.width * scale, img.height * scale);
                };
            }
        }
    }, [drawTool, selectedImage]); // Removed isDarkMode dep here, handled below

    // Update Context Styles (Pen/Eraser/Theme)
    useEffect(() => {
        if (!ctx) return;
        if (drawingMode === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineWidth = 20;
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.lineWidth = 3;
            ctx.strokeStyle = isDarkMode ? '#4ade80' : '#16a34a';
        }
    }, [ctx, drawingMode, isDarkMode]);

    const startDrawing = (e) => {
        if (!ctx) return;
        setIsDrawing(true);
        const { offsetX, offsetY } = getCoordinates(e);
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);
    };

    const draw = (e) => {
        if (!isDrawing || !ctx) return;
        const { offsetX, offsetY } = getCoordinates(e);
        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (!ctx) return;
        setIsDrawing(false);
        ctx.closePath();
    };

    const getCoordinates = (e) => {
        if (e.touches && e.touches[0]) {
            const rect = canvasRef.current.getBoundingClientRect();
            return {
                offsetX: e.touches[0].clientX - rect.left,
                offsetY: e.touches[0].clientY - rect.top
            };
        }
        return { offsetX: e.nativeEvent.offsetX, offsetY: e.nativeEvent.offsetY };
    };

    const clearCanvas = () => {
        if (canvasRef.current && ctx) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
    };

    // --- Image Handling ---
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setSelectedImage({
                    data: event.target.result.split(',')[1],
                    type: file.type,
                    url: event.target.result // Helper for preview
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const clearImage = () => {
        setSelectedImage(null);
        // Reset file inputs if needed, though state is enough usually
    };

    // --- Input Handling ---
    const insertAtCursor = (value, offset = 0) => {
        const newText = inputText.slice(0, cursorPos) + value + inputText.slice(cursorPos);
        setInputText(newText);
        setCursorPos(cursorPos + value.length + offset);
    };

    const handleMathTabPress = (item) => {
        if (item.type === 'action') {
            if (item.action === 'clear') {
                setInputText('');
                setCursorPos(0);
            } else if (item.action === 'delete') {
                if (inputText.length > 0 && cursorPos > 0) {
                    // Atomic Deletion
                    const tokenBefore = getAtomicTokenBefore(inputText, cursorPos);
                    const deleteAmount = tokenBefore ? tokenBefore.length : 1;

                    const newText = inputText.slice(0, cursorPos - deleteAmount) + inputText.slice(cursorPos);
                    setInputText(newText);
                    setCursorPos(cursorPos - deleteAmount);
                }
            }
            return;
        }

        // Use LaTeX for input where possible to look "real"
        // But we need to be careful with placeholders like \sqrt{x} -> we want \sqrt{
        let valToInsert = item.value;

        if (item.latex) {
            if (item.latex.includes('{x}') || item.latex.includes('{n}')) {
                // specific handling for things like \sqrt{x}
                if (item.latex === '\\sqrt{x}') valToInsert = '\\sqrt{';
                else if (item.latex === '\\sqrt[n]{x}') valToInsert = '\\sqrt['; // simplified
            } else if (item.latex.startsWith('\\') && !item.latex.includes('box')) {
                // For \pi, \times, \div, \sin, etc.
                valToInsert = item.latex;
                // Add '(' for functions if the original value had it, ensuring we open the function
                if (item.value.endsWith('(') && !valToInsert.endsWith('{')) {
                    valToInsert += '(';
                }
            }
        }

        // Manual Obvious Overrides
        if (item.value === '/') valToInsert = '\\div';
        if (item.value === '*') valToInsert = '\\times';

        // Handle insertion and cursor
        insertAtCursor(valToInsert);
    };

    // --- AI & Math Logic ---
    const evaluateLocalMath = (expr) => {
        try {
            // Convert LaTeX-ish input to JS math
            const cleanExpr = expr
                .replace(/\\times/g, '*')
                .replace(/\\div/g, '/')
                .replace(/\\pi/g, 'Math.PI')
                .replace(/\\sqrt\{/g, 'Math.sqrt(') // \sqrt{ -> sqrt( -- Note: this requires user to have typed closing brace '}' which matches ')' logic roughly?
                // For simplicity, we assume the user might not have typed '}' yet so local eval might fail, which is fine, AI will take over.
                // But for pure numbers like 9 \times 9, it works.
                .replace(/\}/g, ')') // simple hack: treat closing brace as closing paren for single-arg functions
                .replace(/\\sin\(/g, 'Math.sin(')
                .replace(/\\cos\(/g, 'Math.cos(')
                .replace(/\\tan\(/g, 'Math.tan(')
                .replace(/\^/g, '**');

            // eslint-disable-next-line no-new-func
            const res = new Function(`return ${cleanExpr}`)();
            return isFinite(res) ? String(res) : null;
        } catch { return null; }
    };

    const callGemini = async () => {
        if (!inputText.trim() && !drawingData && !selectedImage && !canvasRef.current) return;
        setLoading(true);
        setError(null);
        setResult(null);
        setIsAiTutorOpen(true);

        try {
            if (!selectedImage && drawTool !== 'draw') {
                // Try local first
                evaluateLocalMath(inputText);
            }

            if (!apiKey) throw new Error("API Key is missing. Please add it in Settings.");


            const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;


            const contents = [];
            let promptText = "Solve this math problem step-by-step. formatting with LaTeX ($$ or $). If it's a graph, describe it. ";

            if (drawTool === 'draw' && canvasRef.current) {
                const base64 = canvasRef.current.toDataURL('image/png').split(',')[1];
                contents.push({
                    role: "user",
                    parts: [
                        { text: promptText + "Analyzing the handwritten math image." },
                        { inline_data: { mime_type: "image/png", data: base64 } }
                    ]
                });
            } else if (selectedImage) {
                contents.push({
                    role: "user",
                    parts: [{ text: promptText }, { inline_data: { mime_type: selectedImage.type, data: selectedImage.data } }]
                });
            } else {
                contents.push({
                    role: "user",
                    parts: [{ text: promptText + " Problem: " + inputText }]
                });
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents, generationConfig: { temperature: 0.2 } })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);

            const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (aiText) {
                setResult(aiText);
            } else {
                throw new Error("No response from AI.");
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Styling key to match the reference image (Dark pills)
    const getBtnStyle = (item) => {
        // Base: Pill shape, dark gray bg
        let base = "h-12 rounded-full flex items-center justify-center text-lg active:scale-95 font-medium select-none transition-all";

        // Colors mapping based on visual reference
        const bgColor = isDarkMode ? "bg-[#1E1E1E]" : "bg-neutral-200"; // Dark gray vs light gray
        const textColor = isDarkMode ? "text-white" : "text-black";

        // Specific Overrides
        if (item.category === 'submit') return `${base} bg-green-600 text-white`; // = button

        let style = `${base} ${bgColor} ${textColor}`;

        // Only apply colorful text (Green/Red) for the main '123' tab to look like a calculator.
        // Other tabs (Algebra, Trig, etc.) should be uniform.
        if (String(activeMathTab) === '123') {
            if (item.category === 'operator') style = `${base} ${bgColor} text-green-500`; // Operators green text
            if (item.category === 'danger') style = `${base} ${bgColor} text-red-500`; // AC red text
            if (item.category === 'function') style = `${base} ${bgColor} text-green-500`; // Functions green text
            // Manual tweaks based on image observation
            if (item.latex === '(' || item.latex === ')') style = `${base} ${bgColor} text-green-500`;
            if (item.label === 'AC') style = `${base} ${bgColor} text-red-500`;
        }

        if (item.category === 'warning') style = `${base} ${bgColor} text-white`; // Backspace

        return style;
    };

    // --- Atomic Input Sync: Ensure the hidden input always knows where our custom cursor is ---
    useEffect(() => {
        const inputEl = document.getElementById('math-input-hidden');
        if (inputEl && document.activeElement === inputEl) {
            inputEl.setSelectionRange(cursorPos, cursorPos);
        }
    }, [cursorPos]);

    // --- Helper: Atomic Token Detection (Jump over \sqrt{, \sin(, \pi, etc.) ---
    const getAtomicTokenBefore = (text, pos) => {
        const MAX_LOOKBACK = 15;
        for (let i = 1; i <= MAX_LOOKBACK; i++) {
            if (pos - i < 0) break;
            if (text[pos - i] === '\\') {
                const candidate = text.slice(pos - i, pos);
                // Matches \cmd, \cmd{, \cmd(, \cmd[
                if (/^\\[a-zA-Z]+[\{\(\[]?$/.test(candidate)) {
                    return candidate;
                }
            }
        }
        return null;
    };

    const getAtomicTokenAfter = (text, pos) => {
        if (text[pos] !== '\\') return null;
        const match = text.slice(pos).match(/^(\\[a-zA-Z]+[\{\(\[]?)/);
        return match ? match[1] : null;
    };

    // --- Cursor Navigation ---
    const moveCursor = (direction) => {
        const inputEl = document.getElementById('math-input-hidden');
        if (!inputEl) return;

        let newPos = cursorPos;

        if (direction === 'left') {
            if (newPos > 0) {
                const token = getAtomicTokenBefore(inputText, newPos);
                newPos -= token ? token.length : 1;
            }
        } else {
            // Right
            if (newPos < inputText.length) {
                const token = getAtomicTokenAfter(inputText, newPos);
                newPos += token ? token.length : 1;
            }
        }

        setCursorPos(newPos);
    };

    return (
        <div className={`w-full h-full flex flex-col relative transition-colors duration-500 ${isDarkMode ? 'bg-black text-white' : 'bg-[#f2f2f2] text-black'}`}>

            {/* 1. Header Row */}
            <div className="h-16 flex items-center justify-between px-6 shrink-0 z-30">
                <button onClick={onBack} className="flex items-center gap-3 hover:opacity-70 active:scale-95 transition-all group">
                    <div className="relative">
                        <img src={logo} alt="Jarvis Cali" className="relative w-9 h-9 object-contain hover:scale-105 transition-transform" />
                    </div>
                    <div className="flex flex-col justify-center h-full">
                        <span className={`font-bold text-lg tracking-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>Jarvis Math</span>
                    </div>
                </button>
                <button
                    onClick={onOpenSettings}
                    className={`p-3 rounded-full transition-all duration-500 active:rotate-180 ${isDarkMode
                        ? 'bg-neutral-800 text-white hover:bg-neutral-700'
                        : 'bg-white text-black hover:bg-neutral-100 shadow-sm border border-neutral-200'
                        }`}
                >
                    <Settings size={20} className="opacity-80" />
                </button>

            </div>

            {/* 2. Display Area (Flexible height) */}
            <div className={`flex-1 flex flex-col relative ${isDarkMode ? 'bg-black' : 'bg-[#f2f2f2]'}`}>
                {/* Mode: Type or Draw */}
                {drawTool === 'type' ? (
                    <div className="flex-1 flex flex-col justify-center px-6 relative cursor-text" onClick={() => document.getElementById('math-input-hidden')?.focus()}>
                        {/* Wrapper for text alignment */}
                        <div className="text-right w-full">
                            {inputText ? (
                                <div className="text-3xl font-light tracking-wide w-full flex justify-end items-center overflow-hidden whitespace-nowrap">
                                    <LiveMathPreview
                                        input={inputText}
                                        cursorPosition={cursorPos}
                                        isReady={isKatexReady}
                                        isDarkMode={isDarkMode}
                                    />
                                    {/* Blinking Cursor */}
                                    <span className="inline-block w-0.5 h-8 bg-green-500 align-middle ml-1 animate-pulse"></span>
                                </div>
                            ) : (
                                <span className="text-neutral-600 text-xl font-light">| Type an equation...</span>
                            )}
                        </div>

                        {/* Hidden Input */}
                        <input
                            id="math-input-hidden"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-text"
                            value={inputText}
                            onChange={(e) => {
                                setInputText(e.target.value);
                                setCursorPos(e.target.selectionStart);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Backspace') {
                                    const token = getAtomicTokenBefore(inputText, cursorPos);
                                    if (token && token.length > 1) {
                                        e.preventDefault();
                                        const newText = inputText.slice(0, cursorPos - token.length) + inputText.slice(cursorPos);
                                        setInputText(newText);
                                        setCursorPos(cursorPos - token.length);
                                    }
                                } else if (e.key === 'ArrowLeft') {
                                    e.preventDefault();
                                    moveCursor('left');
                                } else if (e.key === 'ArrowRight') {
                                    e.preventDefault();
                                    moveCursor('right');
                                } else if (e.key === 'Enter') {
                                    e.preventDefault();
                                    callGemini();
                                }
                            }}
                            onKeyUp={(e) => setCursorPos(e.target.selectionStart)}
                            onClick={(e) => setCursorPos(e.target.selectionStart)}
                            autoFocus={false}
                        />
                    </div>
                ) : drawTool === 'image' ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
                        {selectedImage ? (
                            <div className="relative w-full h-full max-h-[60vh] flex items-center justify-center">
                                <img src={selectedImage.url} alt="Selected Math" className="max-w-full max-h-full rounded-lg object-contain shadow-md" />
                                <button onClick={clearImage} className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-6 w-full max-w-sm">
                                <label className="flex items-center gap-4 p-6 rounded-2xl bg-[#1E1E1E] hover:bg-[#2A2A2A] transition-colors cursor-pointer group border border-neutral-700 hover:border-green-500/50">
                                    <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Camera size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <span className="block text-lg font-semibold text-white">Take Photo</span>
                                        <span className="text-xs text-neutral-400">Use your camera</span>
                                    </div>
                                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
                                </label>

                                <label className="flex items-center gap-4 p-6 rounded-2xl bg-[#1E1E1E] hover:bg-[#2A2A2A] transition-colors cursor-pointer group border border-neutral-700 hover:border-purple-500/50">
                                    <div className="w-12 h-12 rounded-full bg-purple-500/20 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Sparkles size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <span className="block text-lg font-semibold text-white">Upload Image</span>
                                        <span className="text-xs text-neutral-400">Choose from gallery</span>
                                    </div>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                </label>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 relative touch-none bg-transparent">
                        <canvas
                            ref={canvasRef}
                            className={`w-full h-full cursor-crosshair ${isDarkMode ? 'bg-black' : 'bg-white'}`}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                        />
                        <button onClick={clearCanvas} className="absolute top-4 left-4 p-2 bg-red-500/20 text-red-500 rounded-full">
                            <Trash2 size={20} />
                        </button>
                    </div>
                )}

                {/* Floating Tools (Right Side) */}
                {drawTool === 'type' && (
                    <div className="absolute right-4 bottom-4 flex flex-col gap-3 z-20">
                        <button
                            onClick={() => setDrawTool('draw')}
                            className="w-12 h-12 rounded-full bg-[#1E1E1E] text-green-500 flex items-center justify-center shadow-lg border border-neutral-800 hover:scale-105 transition-transform"
                        >
                            <PenTool size={20} />
                        </button>
                        <button
                            onClick={() => setDrawTool('image')}
                            className="w-12 h-12 rounded-full bg-[#1E1E1E] text-green-500 flex items-center justify-center shadow-lg border border-neutral-800 hover:scale-105 transition-transform"
                        >
                            <Camera size={20} />
                        </button>
                    </div>
                )}
            </div>

            {/* --- 3. Controls Area (Conditional) --- */}

            {/* A. TYPE MODE CONTROLS */}
            {drawTool === 'type' && (
                <div className="shrink-0 z-30 pb-4">
                    {/* Category Tabs */}
                    {/* Category Tabs - Fixed Layout */}
                    <div className="flex items-center gap-2 px-4 mb-3">
                        {/* Fixed Left Icon - Acts as '123' Tab */}
                        <button
                            onClick={() => setActiveMathTab('123')}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-all ${activeMathTab === '123' ? 'bg-green-500 text-white' : 'bg-[#1E1E1E] text-green-500 hover:bg-[#333]'}`}
                        >
                            <Calculator size={20} />
                        </button>

                        {/* Scrollable Center */}
                        <div className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-none h-10 px-1">
                            {Object.keys(MATHTYPE_DATA).filter(k => k !== '123').map(key => {
                                const isActive = activeMathTab === key;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => setActiveMathTab(key)}
                                        className={`relative h-10 px-5 rounded-full text-xs font-bold tracking-wider uppercase whitespace-nowrap transition-colors flex items-center justify-center shrink-0 border z-10 ${isActive ?
                                            'text-white border-neutral-600' :
                                            'text-neutral-500 border-transparent hover:bg-[#1a1a1a]'}`}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeMathTab"
                                                className="absolute inset-0 bg-[#2A2A2A] rounded-full -z-10 shadow-md"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                        <span className="relative z-20">{key}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Divider */}
                        <div className="w-px h-6 bg-neutral-800 shrink-0 mx-1"></div>

                        {/* Fixed Right Delete Button */}
                        <div className="shrink-0 pl-1">
                            <button
                                onClick={() => handleMathTabPress({ type: 'action', action: 'delete' })}
                                className="w-10 h-10 flex items-center justify-center rounded-full text-red-500 hover:bg-red-500/10 active:scale-95 transition-all"
                            >
                                <Delete size={22} />
                            </button>
                        </div>
                    </div>

                    {/* Keypad Grid */}
                    <AnimatePresence mode="popLayout" initial={false}>
                        <motion.div
                            key={activeMathTab}
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.98 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="grid grid-cols-5 gap-2 px-3 mb-4 h-[272px] overflow-y-auto scrollbar-none content-start"
                        >
                            {MATHTYPE_DATA[activeMathTab].map((item, i) => (
                                <motion.button
                                    key={`${activeMathTab}-${i}`}
                                    onClick={() => handleMathTabPress(item)}
                                    className={getBtnStyle(item)}
                                    whileTap={{ scale: 0.9 }}
                                    whileHover={{ scale: 1.05 }}
                                    layout // layout prop helps smooth list reordering if needed
                                >
                                    <MathLabel latex={item.latex} label={item.label || item.value} isReady={isKatexReady} isDarkMode={isDarkMode} />
                                </motion.button>
                            ))}
                        </motion.div>
                    </AnimatePresence>

                    {/* Bottom Action Bar (Type Mode) */}
                    <div className="flex items-center gap-3 px-4 pt-2">
                        {/* Left Arrow */}
                        <button
                            onClick={() => moveCursor('left')}
                            className="w-12 h-12 rounded-full bg-[#1E1E1E] flex items-center justify-center text-green-500 hover:bg-[#333] active:scale-95 transition-all"
                        >
                            <ChevronLeft size={24} />
                        </button>

                        {/* Calculate */}
                        <button
                            onClick={callGemini}
                            disabled={loading || !inputText}
                            className={`flex-1 h-14 rounded-full bg-purple-600 hover:bg-purple-500 active:scale-95 transition-all text-white font-semibold text-lg flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20`}
                        >
                            {loading ? <Loader2 size={24} className="animate-spin" /> : (
                                <>
                                    <Sparkles size={20} fill="currentColor" />
                                    <span>Calculate</span>
                                </>
                            )}
                        </button>

                        {/* Right Arrow */}
                        <button
                            onClick={() => moveCursor('right')}
                            className="w-12 h-12 rounded-full bg-[#1E1E1E] flex items-center justify-center text-green-500 hover:bg-[#333] active:scale-95 transition-all"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>

                    {/* Nav to Draw/Camera (Floating above or integrated?) - existing design had them floating right. 
                            Let's keep the existing floating tools trigger for switching TO draw mode? 
                            Actually, user wants specific design. Let's add a small toggle to switch modes if needed, 
                            but the reference image implies bottom navigation switching. 
                            So, let's add mode switchers to the bottom bar of Type mode? 
                            No, the keypad takes space. 
                            I'll leave the floating tools in the Display Area (lines 368-378) for switching from Type -> Draw.
                        */}
                </div>
            )}

            {/* B. DRAW & IMAGE MODE CONTROLS */}
            {(drawTool === 'draw' || drawTool === 'image') && (
                <div className="shrink-0 z-30 pb-6 pt-2 relative">

                    {/* Floating Tool Palette (Only for Draw) */}
                    {drawTool === 'draw' && (
                        <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[#1E1E1E] rounded-full p-1.5 shadow-xl border border-neutral-800">
                            <button
                                onClick={() => setDrawingMode('pen')}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${drawingMode === 'pen' ? 'bg-green-500 text-white shadow-lg' : 'text-neutral-400 hover:text-white'}`}
                            >
                                <PenTool size={18} />
                            </button>
                            <button
                                onClick={() => setDrawingMode('eraser')}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${drawingMode === 'eraser' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white'}`}
                            >
                                <Eraser size={18} />
                            </button>
                            <div className="w-px h-6 bg-neutral-700 mx-1"></div>
                            <button
                                onClick={clearCanvas}
                                className="w-10 h-10 rounded-full flex items-center justify-center text-red-500 hover:bg-red-500/10 transition-all"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    )}

                    {/* Navigation Bottom Bar */}
                    <div className="flex items-center gap-4 px-6">
                        {/* Left: Keyboard (Type Mode) */}
                        <button
                            onClick={() => setDrawTool('type')}
                            className="w-12 h-12 rounded-full bg-[#1E1E1E] flex items-center justify-center text-neutral-400 hover:text-white hover:bg-[#333] transition-all"
                        >
                            <Keyboard size={24} />
                        </button>

                        {/* Center: Calculate */}
                        <button
                            onClick={callGemini}
                            disabled={loading || (drawTool === 'draw' && !canvasRef.current) || (drawTool === 'image' && !selectedImage && !canvasRef.current)} // Simplified check
                            className="flex-1 h-16 rounded-full bg-purple-600 hover:bg-purple-500 active:scale-95 transition-all text-white font-bold text-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30"
                        >
                            {loading ? <Loader2 size={24} className="animate-spin" /> : "Calculate"}
                        </button>

                        {/* Right: Camera (Image Mode) */}
                        {/* Right: Toggle Draw/Image */}
                        <button
                            onClick={() => setDrawTool(drawTool === 'draw' ? 'image' : 'draw')}
                            className="w-12 h-12 rounded-full bg-[#1E1E1E] flex items-center justify-center text-neutral-400 hover:text-white hover:bg-[#333] transition-all"
                        >
                            {drawTool === 'draw' ? <Camera size={24} /> : <PenTool size={24} />}
                        </button>
                    </div>
                </div>
            )}

            {/* Solution Sheet Overlay */}
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: isAiTutorOpen ? '0%' : '100%' }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className={`absolute inset-x-0 bottom-0 bg-white dark:bg-[#181818] rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col z-50`}
                style={{ height: '90%' }}
            >
                <div
                    className="h-16 flex items-center justify-between px-6 border-b border-neutral-100 dark:border-neutral-800 shrink-0 cursor-pointer"
                    onClick={() => setIsAiTutorOpen(false)}
                >
                    <span className="font-semibold text-lg text-neutral-800 dark:text-neutral-200">Solution</span>
                    <button onClick={(e) => { e.stopPropagation(); setIsAiTutorOpen(false); }} className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:opacity-80">
                        <X size={20} className="text-black dark:text-white" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-neutral-400">
                            <Loader2 size={48} className="animate-spin text-purple-500" />
                            <p className="font-medium animate-pulse">Calculating...</p>
                        </div>
                    ) : error ? (
                        <div className="text-red-500 text-center p-4">
                            <p>{error}</p>
                        </div>
                    ) : result ? (
                        <div className="prose dark:prose-invert max-w-none">
                            <MarkdownRenderer content={result} isKatexReady={isKatexReady} isDarkMode={isDarkMode} />
                        </div>
                    ) : null}
                </div>
            </motion.div>

        </div>
    );
};

export default AiTutorPage;
