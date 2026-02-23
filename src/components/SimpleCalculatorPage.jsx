import React, { useState, useEffect } from 'react';
import { ChevronLeft, Sparkles, Sun, Moon, History, Ruler, CalendarClock, Delete, FlaskConical, Settings, LineChart, Brain, Trash2, X } from 'lucide-react';
import logo from '../assets/logo.svg';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

import UnitConverter from './UnitConverter';
import DateCalculator from './DateCalculator';
import GraphingCalculator from './GraphingCalculator';
import { useKatex, MathLabel } from './MathRenderers';
import useSwipeGesture from '../hooks/useSwipeGesture';


// --- COMPONENT: Simple Calculator Page (Separate Page) ---
// Accepts onSwitchToTutor and onSwitchToPractice to toggle views
const SimpleCalculatorPage = ({ onSwitchToTutor, onSwitchToPractice, isDarkMode, onOpenSettings }) => {
    const isKatexReady = useKatex();

    const [display, setDisplay] = useState('');
    const [angleUnit, setAngleUnit] = useState('DEG'); // 'DEG' | 'RAD'
    const [viewMode, setViewMode] = useState('calculator'); // 'calculator' | 'scientific' | 'history' | 'converter' | 'date' | 'graphing'

    useEffect(() => {
        if (viewMode !== 'history') {
            setIsHistoryExpanded(false);
        }
    }, [viewMode]);
    const [history, setHistory] = useState(() => {
        const saved = localStorage.getItem('calc_history');
        return saved ? JSON.parse(saved) : [];
    });
    const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
    const [liveResult, setLiveResult] = useState('');
    const historyDragControls = useDragControls();
    // Scientific State
    const [isSecond, setIsSecond] = useState(false);

    // Sync history to localStorage
    useEffect(() => {
        localStorage.setItem('calc_history', JSON.stringify(history));
    }, [history]);

    // Swipe gestures for sub-views to go back to calculator (Universal Back)
    const { ref: historySwipeRef } = useSwipeGesture({
        direction: 'horizontal',
        onSwipe: () => setViewMode('calculator'),
        enabled: viewMode === 'history',
    });

    // Local helper to calculate without calling main component hooks
    const calculateResult = (expr) => {
        try {
            // Pre-process Factorial: x! -> factorial(x)
            // Regex finds a number (int/float) or closed paren group followed by !
            // Note: This is a simple implementation. Complex nesting might require better parsing, 
            // but recursive regex isn't standard in JS. We'll handle basic cases.
            let factExpr = expr;
            // Handle simple number factorials: 5! -> factorial(5)
            // We run this in a loop to handle multiple factorials
            while (/(\d+(?:\.\d+)?|\([^)]+\))!/.test(factExpr)) {
                factExpr = factExpr.replace(/(\d+(?:\.\d+)?|\([^)]+\))!/g, 'factorial($1)');
            }

            // Sanitization & Math replacements
            let safeExpr = factExpr
                .replace(/×/g, '*')
                .replace(/÷/g, '/')
                .replace(/%/g, '/100')
                .replace(/\^/g, '**')
                .replace(/π/g, 'Math.PI')
                .replace(/e/g, 'Math.E')
                .replace(/√\(/g, 'Math.sqrt(');

            // Trigonometry Handling (DEG vs RAD)
            const toRad = (angle) => angleUnit === 'DEG' ? `(${angle} * Math.PI / 180)` : angle;
            // We need to inject the conversion *inside* the function calls if in DEG mode via Regex replacement logic is hard purely with strings.
            // A safer way for `sin(x)` -> `Math.sin(x * PI/180)`.
            // We will define custom helper functions in the eval scope instead of string replacing logic which is fragile.

            // Inverse Trig: `asin(x)` -> result in radians. If DEG, convert to deg.
            // `toDeg(Math.asin(x))`

            // Construct the function scope
            // We'll expose `factorial`, `sin`, `cos`, etc. to the Function scope.

            const scope = {
                Math,
                factorial: (n) => {
                    if (n < 0) return NaN;
                    let res = 1;
                    for (let i = 2; i <= n; i++) res *= i;
                    return res;
                },
                sin: (x) => Math.sin(angleUnit === 'DEG' ? x * Math.PI / 180 : x),
                cos: (x) => Math.cos(angleUnit === 'DEG' ? x * Math.PI / 180 : x),
                tan: (x) => Math.tan(angleUnit === 'DEG' ? x * Math.PI / 180 : x),
                asin: (x) => { const res = Math.asin(x); return angleUnit === 'DEG' ? res * 180 / Math.PI : res; },
                acos: (x) => { const res = Math.acos(x); return angleUnit === 'DEG' ? res * 180 / Math.PI : res; },
                atan: (x) => { const res = Math.atan(x); return angleUnit === 'DEG' ? res * 180 / Math.PI : res; },
                log: (x) => Math.log10(x),
                ln: (x) => Math.log(x),
                root: (x) => Math.sqrt(x)
            };

            // Enhance safeExpr to use scope functions instead of Math. directly where we wrapped them
            safeExpr = safeExpr
                .replace(/sin\(/g, 'this.sin(')
                .replace(/cos\(/g, 'this.cos(')
                .replace(/tan\(/g, 'this.tan(')
                .replace(/asin\(/g, 'this.asin(')
                .replace(/acos\(/g, 'this.acos(')
                .replace(/atan\(/g, 'this.atan(')
                .replace(/log\(/g, 'this.log(')
                .replace(/ln\(/g, 'this.ln(')
                .replace(/Math.sqrt\(/g, 'this.root(') // Re-map our previous replace (or just avoid the previous replace)
                .replace(/factorial\(/g, 'this.factorial(');

            // Basic check for trailing operators
            if (/[+\-*/.]$/.test(safeExpr) || safeExpr.endsWith('(')) return null;

            // Execute with scope
            // eslint-disable-next-line no-new-func
            const res = new Function(`return ${safeExpr}`).call(scope);

            if (!isFinite(res) || isNaN(res)) return null;

            // Rounding to avoid float errors (especially with trig like cos(90deg) approx 0)
            const rounded = Math.round(res * 10000000000) / 10000000000;
            return String(rounded);
        } catch (e) {
            return null;
        }
    };

    // Effect to update live result
    useEffect(() => {
        if (!display) {
            setLiveResult('');
            return;
        }
        const res = calculateResult(display);
        if (res !== null) {
            setLiveResult(res);
        } else {
            setLiveResult('');
        }
    }, [display, angleUnit]); // Re-calc if angle unit changes

    const handlePress = (key) => {
        if (key === 'clear') {
            setDisplay('');
            setLiveResult('');
        } else if (key === 'delete') {
            setDisplay(prev => prev.slice(0, -1));
        } else if (key === '2nd') {
            setIsSecond(!isSecond);
        } else if (key === 'deg_rad') {
            setAngleUnit(prev => prev === 'DEG' ? 'RAD' : 'DEG');
        } else if (key === 'parens') {
            const lastChar = display.trim().slice(-1);
            const isNumber = /[0-9.)eπ!]/.test(lastChar);
            setDisplay(prev => prev + (isNumber ? ')' : '('));
        } else if (key === 'negate') {
            const match = display.match(/(-?[\d.]+)$/);
            if (match) {
                const num = match[0];
                const toggled = num.startsWith('-') ? num.slice(1) : '-' + num;
                setDisplay(prev => prev.slice(0, -num.length) + toggled);
            } else {
                setDisplay(prev => prev + '-');
            }
        } else if (key === 'solve') {
            if (liveResult) {
                setHistory(prev => [...prev, { expression: display + (angleUnit !== 'DEG' ? ' [rad]' : ''), result: liveResult }]);
                setDisplay(liveResult);
                setLiveResult('');
            }
        } else {
            // Function Map
            if (key === 'sin') setDisplay(prev => prev + 'sin(');
            else if (key === 'cos') setDisplay(prev => prev + 'cos(');
            else if (key === 'tan') setDisplay(prev => prev + 'tan(');
            else if (key === 'asin') setDisplay(prev => prev + 'asin(');
            else if (key === 'acos') setDisplay(prev => prev + 'acos(');
            else if (key === 'atan') setDisplay(prev => prev + 'atan(');
            else if (key === 'log') setDisplay(prev => prev + 'log(');
            else if (key === 'ln') setDisplay(prev => prev + 'ln(');
            else if (key === 'sqrt') setDisplay(prev => prev + '√(');
            else if (key === 'sqr') setDisplay(prev => prev + '^2');
            else if (key === 'fact') setDisplay(prev => prev + '!');
            else if (key === 'inv') setDisplay(prev => prev + '^(-1)');
            else if (key === 'percent') setDisplay(prev => prev + '%');
            else if (key === 'pow') setDisplay(prev => prev + '^');
            else if (key === 'pi') setDisplay(prev => prev + 'π');
            else if (key === 'e') setDisplay(prev => prev + 'e');
            else if (key === '10pow') setDisplay(prev => prev + '10^');
            else if (key === 'epow') setDisplay(prev => prev + 'e^');
            else setDisplay(prev => prev + key);
        }
    };

    const loadHistoryItem = (res) => {
        setDisplay(res);
        setLiveResult('');
        setViewMode('calculator');
    };

    const KEYPAD = [
        { label: 'C', action: () => handlePress('clear'), color: 'red' },
        { label: '( )', isSplit: true, actions: [() => handlePress('('), () => handlePress(')')], color: 'green' },
        { label: '%', action: () => handlePress('percent'), color: 'green' },
        { label: '÷', action: () => handlePress('÷'), color: 'green' },

        { label: '7', action: () => handlePress('7') },
        { label: '8', action: () => handlePress('8') },
        { label: '9', action: () => handlePress('9') },
        { label: '×', action: () => handlePress('×'), color: 'green' },

        { label: '4', action: () => handlePress('4') },
        { label: '5', action: () => handlePress('5') },
        { label: '6', action: () => handlePress('6') },
        { label: '-', action: () => handlePress('-'), color: 'green' },

        { label: '1', action: () => handlePress('1') },
        { label: '2', action: () => handlePress('2') },
        { label: '3', action: () => handlePress('3') },
        { label: '+', action: () => handlePress('+'), color: 'green' },

        { label: '+/-', action: () => handlePress('negate') },
        { label: '0', action: () => handlePress('0') },
        { label: '.', action: () => handlePress('.') },
        { label: '=', action: () => handlePress('solve'), color: 'submit' },
    ];

    // 5-Column Scientific Layout
    // Row 1: 2nd, DEG/RAD, sin/asin, cos/acos, tan/atan
    // Row 2: pow/sqr, log/10^, ln/e^, (, )
    // Row 3: sqrt/x^2, 7, 8, 9, /
    // Row 4: fact, 4, 5, 6, *
    // Row 5: inv, 1, 2, 3, -
    // Row 6: pi, 0, ., %, +
    // Row 7: Ans?, EXP?, DEL, C, = (Maybe too tall? Let's fit C and DEL elsewhere or keep Row 6 max)
    // Let's stick to 6 rows max to fit screen.

    const SCIENTIFIC_KEYPAD = [
        // Row 1
        { label: isSecond ? '2nd' : '2nd', action: () => handlePress('2nd'), color: isSecond ? 'accent' : 'func' },
        { label: angleUnit, action: () => handlePress('deg_rad'), color: 'func' },
        { label: isSecond ? 'sin⁻¹' : 'sin', action: () => handlePress(isSecond ? 'asin' : 'sin'), color: 'func' },
        { label: isSecond ? 'cos⁻¹' : 'cos', action: () => handlePress(isSecond ? 'acos' : 'cos'), color: 'func' },
        { label: isSecond ? 'tan⁻¹' : 'tan', action: () => handlePress(isSecond ? 'atan' : 'tan'), color: 'func' },

        // Row 2
        { label: 'x^y', action: () => handlePress('pow'), color: 'func' },
        { label: isSecond ? '10^x' : 'log', action: () => handlePress(isSecond ? '10pow' : 'log'), color: 'func' },
        { label: isSecond ? 'e^x' : 'ln', action: () => handlePress(isSecond ? 'epow' : 'ln'), color: 'func' },
        { label: '(', action: () => handlePress('('), color: 'func' },
        { label: ')', action: () => handlePress(')'), color: 'func' },

        // Row 3
        { label: isSecond ? 'x²' : '√', action: () => handlePress(isSecond ? 'sqr' : 'sqrt'), color: 'func' },
        { label: '7', action: () => handlePress('7') },
        { label: '8', action: () => handlePress('8') },
        { label: '9', action: () => handlePress('9') },
        { label: '÷', action: () => handlePress('÷'), color: 'green' },

        // Row 4
        { label: 'x!', action: () => handlePress('fact'), color: 'func' },
        { label: '4', action: () => handlePress('4') },
        { label: '5', action: () => handlePress('5') },
        { label: '6', action: () => handlePress('6') },
        { label: '×', action: () => handlePress('×'), color: 'green' },

        // Row 5
        { label: '1/x', action: () => handlePress('inv'), color: 'func' },
        { label: '1', action: () => handlePress('1') },
        { label: '2', action: () => handlePress('2') },
        { label: '3', action: () => handlePress('3') },
        { label: '-', action: () => handlePress('-'), color: 'green' },

        // Row 6
        { label: 'π', action: () => handlePress('pi'), color: 'func' },
        { label: '0', action: () => handlePress('0') },
        { label: '.', action: () => handlePress('.') },
        { label: 'C', action: () => handlePress('clear'), color: 'red' }, // Moved C here for access
        { label: '+', action: () => handlePress('+'), color: 'green' },
    ];
    // Need a Submit button in Sci mode?
    // Added a 7th row or merged?
    // Let's add '=' as a wide button at bottom or integrate.
    // I left out '=' in Row 6. Let's make Row 6: pi, 0, ., C, +
    // And add a Floating '=' or separate Row 7? 
    // Row 7: e, %, +/-, DEL, =

    const SCI_ROW_7 = [
        { label: 'e', action: () => handlePress('e'), color: 'func' },
        { label: '%', action: () => handlePress('percent'), color: 'func' },
        { label: '+/-', action: () => handlePress('negate'), color: 'func' },
        { label: 'DEL', action: () => handlePress('delete'), color: 'red' },
        { label: '=', action: () => handlePress('solve'), color: 'submit' },
    ];

    // Concatenating for map
    const FULL_SCI_KEYPAD = [...SCIENTIFIC_KEYPAD, ...SCI_ROW_7];


    // Reuse styling logic
    const getBtnStyle = (item, isSci) => {
        let base = `${isSci ? 'h-12 text-sm' : 'h-20 text-2xl'} rounded-full flex items-center justify-center transition-all active:scale-95 font-medium select-none`;
        // Sci mode needs smaller Text for things like 'sin-1'
        if (isSci && (item.label.length > 3 || item.label.includes('^'))) base = `${base} text-xs font-bold`;

        if (isDarkMode) {
            if (item.color === 'red') return `${base} text-orange-500 bg-[#333333]`;
            if (item.color === 'green') return `${base} text-green-500 bg-[#333333]`;
            if (item.color === 'func') return `${base} text-neutral-300 bg-[#252525]`;
            if (item.color === 'accent') return `${base} text-black bg-green-500`; // Active 2nd
            if (item.color === 'submit') return `${base} text-white bg-green-600 rounded-full`;
            return `${base} text-white bg-[#181818]`;
        } else {
            if (item.color === 'red') return `${base} text-orange-600 bg-[#dcdcdc]`;
            if (item.color === 'green') return `${base} text-green-600 bg-[#dcdcdc]`;
            if (item.color === 'func') return `${base} text-neutral-700 bg-[#eaeaea]`;
            if (item.color === 'accent') return `${base} text-white bg-green-600`;
            if (item.color === 'submit') return `${base} text-white bg-green-500 rounded-full`;
            return `${base} text-black bg-white shadow-sm`;
        }
    };

    // --- Sub-View Conditionals (Non-sheet views) ---
    if (viewMode === 'converter') {
        return <UnitConverter onClose={() => setViewMode('calculator')} isDarkMode={isDarkMode} />;
    }

    if (viewMode === 'date') {
        return <DateCalculator onClose={() => setViewMode('calculator')} isDarkMode={isDarkMode} />;
    }

    if (viewMode === 'graphing') {
        return <GraphingCalculator onClose={() => setViewMode('calculator')} isDarkMode={isDarkMode} />;
    }

    return (
        <div className={`w-full h-full flex flex-col ${isDarkMode ? 'bg-black' : 'bg-[#f2f2f2]'} transition-colors duration-500 relative`}>
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-6 shrink-0 absolute top-0 left-0 right-0 z-20">
                <button onClick={onSwitchToTutor} className="flex items-center gap-3 hover:opacity-70 active:scale-95 transition-all">
                    <div className="relative">
                        <img src={logo} alt="Jarvis Cali" className="relative w-9 h-9 object-contain hover:scale-105 transition-transform" />
                    </div>
                    <div className="flex flex-col justify-center h-full">
                        <span className={`font-bold text-lg tracking-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>Calculator</span>
                    </div>
                </button>

                <button
                    onClick={onOpenSettings}
                    className={`p-3 rounded-full transition-all duration-500 active:rotate-180 ${isDarkMode
                        ? 'bg-neutral-800 text-white hover:bg-neutral-700'
                        : 'bg-white text-black hover:bg-neutral-100 shadow-sm border border-neutral-200'
                        }`}
                    title="Settings"
                >
                    <Settings size={20} className={isDarkMode ? 'text-white' : 'text-black'} />
                </button>
            </div>

            {/* Display */}
            <div
                className="flex-1 flex flex-col px-8 pb-4 pt-20 overflow-hidden relative cursor-text"
                onClick={() => document.getElementById('simple-calc-input')?.focus()}
            >
                <div className="flex-1 flex flex-col justify-end items-end gap-2">
                    {/* Main Equation Input */}
                    <div className={`text-6xl font-light tracking-tight break-all text-right ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        {display || '0'}
                    </div>

                    {/* Live Result Preview */}
                    <div className={`text-4xl font-light tracking-tight text-right min-h-[40px] transition-all duration-200 ${isDarkMode ? 'text-neutral-500' : 'text-neutral-400'}`}>
                        {liveResult}
                    </div>
                </div>

                {/* Display Toolbar (History, Ruler, Date, Scientific, Graphing) */}
                <div className="flex items-center justify-between mt-6 mb-2 text-neutral-500 relative z-10">
                    <div className="flex gap-4">
                        {/* History Toggle */}
                        <button onClick={() => setViewMode('history')} className="hover:text-green-500 transition-colors p-1"><History size={20} /></button>
                        {/* Ruler Button now Toggles Unit Converter */}
                        <button onClick={() => setViewMode('converter')} className="hover:text-green-500 transition-colors p-1"><Ruler size={20} /></button>
                        {/* Scientific Toggle */}
                        <button onClick={() => setViewMode(viewMode === 'scientific' ? 'calculator' : 'scientific')} className={`transition-colors p-1 ${viewMode === 'scientific' ? 'text-green-500' : 'hover:text-green-500'}`}><FlaskConical size={20} /></button>
                        {/* Graphing Toggle - NEW */}
                        <button onClick={() => setViewMode('graphing')} className="hover:text-green-500 transition-colors p-1"><LineChart size={20} /></button>
                        {/* Date Button now Toggles Date Calculator */}
                        <button onClick={() => setViewMode('date')} className="hover:text-green-500 transition-colors p-1"><CalendarClock size={20} /></button>
                        {/* Practice Mode Button - NEW */}
                        <button onClick={onSwitchToPractice} className="hover:text-purple-500 transition-colors p-1" title="Practice Mode"><Brain size={20} /></button>
                    </div>
                    <button onClick={() => handlePress('delete')} className="text-green-500 hover:text-green-400 p-2 -mr-2 active:scale-90 transition-transform">
                        <Delete size={24} />
                    </button>
                </div>
                {/* Hidden Input for Keyboard Support */}
                <input
                    id="simple-calc-input"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-text scroll-m-0"
                    value=""
                    onChange={() => { }}
                    autoFocus={false}
                    onKeyDown={(e) => {
                        const key = e.key;

                        if (/[0-9]/.test(key)) { e.preventDefault(); handlePress(key); }
                        else if (key === '.') { e.preventDefault(); handlePress('.'); }
                        else if (key === '+') { e.preventDefault(); handlePress('+'); }
                        else if (key === '-') { e.preventDefault(); handlePress('-'); }
                        else if (key === '*') { e.preventDefault(); handlePress('×'); }
                        else if (key === '/') { e.preventDefault(); handlePress('÷'); }
                        else if (key === '%') { e.preventDefault(); handlePress('percent'); }
                        else if (key === '(') { e.preventDefault(); handlePress('('); }
                        else if (key === ')') { e.preventDefault(); handlePress(')'); }
                        else if (key === 'Enter' || key === '=') { e.preventDefault(); handlePress('solve'); }
                        else if (key === 'Backspace') { e.preventDefault(); handlePress('delete'); }
                        else if (key === 'Escape') { e.preventDefault(); handlePress('clear'); }
                    }}
                />
            </div>

            {/* Keypad - Dynamic Grid */}
            <div className={`grid ${viewMode === 'scientific' ? 'grid-cols-5 gap-2' : 'grid-cols-4 gap-3'} p-4 pb-8 ${isDarkMode ? 'bg-black' : 'bg-[#f2f2f2]'}`}>
                {(viewMode === 'scientific' ? FULL_SCI_KEYPAD : KEYPAD).map((item, idx) => {
                    if (item.isSplit) {
                        return (
                            <div key={idx} className="flex gap-1">
                                <motion.button
                                    whileTap={{ scale: 0.92 }}
                                    onClick={item.actions[0]}
                                    className={`${getBtnStyle(item, false)} flex-1 !rounded-l-full !rounded-r-none`}
                                >
                                    (
                                </motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.92 }}
                                    onClick={item.actions[1]}
                                    className={`${getBtnStyle(item, false)} flex-1 !rounded-r-full !rounded-l-none`}
                                >
                                    )
                                </motion.button>
                            </div>
                        );
                    }
                    return (
                        <motion.button
                            key={idx}
                            whileTap={{ scale: 0.95 }}
                            onClick={item.action}
                            className={getBtnStyle(item, viewMode === 'scientific')}
                        >
                            {item.label}
                        </motion.button>
                    );
                })}
            </div>

            {/* Scrim Overlay for History */}
            <AnimatePresence>
                {viewMode === 'history' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setViewMode('calculator')}
                        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-40 transition-all duration-500"
                    />
                )}
            </AnimatePresence>

            {/* History Sheet Overlay */}
            <motion.div
                initial={{ y: '100%' }}
                animate={viewMode === 'history'
                    ? { y: isHistoryExpanded ? 0 : '50%' }
                    : { y: '100%' }
                }
                transition={{ type: "spring", damping: 45, stiffness: 200, mass: 1.2 }}
                drag={viewMode === 'history' ? "y" : false}
                dragControls={historyDragControls}
                dragListener={false}
                dragConstraints={{ top: 0 }}
                dragElastic={0.1}
                dragSnapToOrigin
                onDragEnd={(e, info) => {
                    const velocity = info.velocity.y;
                    const offset = info.offset.y;

                    if (isHistoryExpanded) {
                        // From Full -> Partial or Closed
                        if (offset > 150 || velocity > 600) {
                            setIsHistoryExpanded(false);
                        }
                    } else {
                        // From Partial -> Full or Closed
                        if (offset < -100 || velocity < -300) {
                            setIsHistoryExpanded(true);
                        } else if (offset > 100 || velocity > 400) {
                            setViewMode('calculator');
                        }
                    }
                }}
                className={`absolute inset-x-0 bottom-0 z-50 flex flex-col rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] ${isDarkMode ? 'bg-[#181818] text-white' : 'bg-white text-black'}`}
                style={{ height: '85%' }}
            >
                {/* Drag Handle */}
                <div
                    className="flex justify-center pt-3 pb-4 cursor-grab active:cursor-grabbing touch-none"
                    onPointerDown={(e) => historyDragControls.start(e)}
                >
                    <div className="w-10 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                </div>

                <div className="h-12 flex items-center justify-between px-6 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
                    <span className="font-semibold text-lg">History</span>
                    <button onClick={() => setViewMode('calculator')} className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:opacity-80">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 scrollbar-none">
                    {history.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-neutral-500 gap-2 opacity-50 pb-12">
                            <History size={48} />
                            <p>No history yet</p>
                        </div>
                    ) : (
                        history.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    loadHistoryItem(item.result);
                                    setViewMode('calculator'); // Close sheet on select
                                }}
                                className="flex flex-col items-end gap-1 w-full text-right active:opacity-50 transition-opacity"
                            >
                                <span className={`text-lg ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                    <MathLabel
                                        latex={item.expression.replace(/×/g, '\\times ').replace(/÷/g, '\\div ').replace(/√/g, '\\sqrt ').replace(/%/g, '\\% ')}
                                        label={item.expression}
                                        isReady={isKatexReady}
                                    />
                                </span>
                                <span className={`text-3xl font-light ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                                    = <MathLabel
                                        latex={item.result}
                                        label={item.result}
                                        isReady={isKatexReady}
                                    />
                                </span>
                            </button>
                        ))
                    )}
                </div>

                {/* Floating Delete Pill */}
                {history.length > 0 && (
                    <div className="absolute bottom-6 inset-x-0 flex justify-center z-10 pointer-events-none">
                        <button
                            onClick={() => {
                                if (window.confirm('Clear calculation history?')) {
                                    setHistory([]);
                                }
                            }}
                            className="pointer-events-auto flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-500 text-white text-sm font-medium shadow-lg shadow-red-500/30 hover:bg-red-600 active:scale-95 transition-all"
                        >
                            <Trash2 size={16} />
                            Clear History
                        </button>
                    </div>
                )}
            </motion.div>
        </div >
    );
};

export default SimpleCalculatorPage;
