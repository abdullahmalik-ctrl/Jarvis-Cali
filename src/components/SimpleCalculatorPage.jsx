import React, { useState, useEffect } from 'react';
import { ChevronLeft, Sparkles, Sun, Moon, History, Ruler, CalendarClock, Delete, FlaskConical, Settings } from 'lucide-react';
import logo from '../assets/logo.png';

import UnitConverter from './UnitConverter';
import DateCalculator from './DateCalculator';

// --- COMPONENT: Simple Calculator Page (Separate Page) ---
// Accepts onSwitch to toggle to AI Tutor view
const SimpleCalculatorPage = ({ onSwitch, isDarkMode, onOpenSettings }) => {

    const [display, setDisplay] = useState('');
    const [liveResult, setLiveResult] = useState('');
    const [viewMode, setViewMode] = useState('calculator'); // 'calculator' | 'converter' | 'history' | 'date' | 'scientific'
    const [history, setHistory] = useState([]); // Array of { expr, res }
    // Scientific State
    const [isSecond, setIsSecond] = useState(false);
    const [angleUnit, setAngleUnit] = useState('DEG'); // 'DEG' | 'RAD'

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
        { label: '( )', action: () => handlePress('parens'), color: 'green' },
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
        { label: '(', action: () => handlePress('parens'), color: 'func' },
        { label: ')', action: () => handlePress('parens'), color: 'func' },

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

    if (viewMode === 'converter') {
        return <UnitConverter onClose={() => setViewMode('calculator')} isDarkMode={isDarkMode} />;
    }

    if (viewMode === 'date') {
        return <DateCalculator onClose={() => setViewMode('calculator')} isDarkMode={isDarkMode} />;
    }

    // --- History View ---
    if (viewMode === 'history') {
        return (
            <div className={`flex flex-col h-full ${isDarkMode ? 'bg-black text-white' : 'bg-[#f2f2f2] text-black'} relative`}>
                <div className="h-16 flex items-center gap-4 px-6 shrink-0 relative z-20 border-b border-neutral-800">
                    <button onClick={() => setViewMode('calculator')} className="p-2 -ml-2 rounded-full hover:bg-neutral-800/50">
                        <ChevronLeft size={28} />
                    </button>
                    <span className="font-semibold text-lg">History</span>
                </div>

                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                    {history.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-neutral-500 font-medium">
                            No history yet
                        </div>
                    ) : (
                        history.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => loadHistoryItem(item.result)}
                                className="flex flex-col items-end gap-1 w-full text-right active:opacity-50 transition-opacity"
                            >
                                <span className={`text-lg ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>{item.expression}</span>
                                <span className={`text-3xl font-light ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>= {item.result}</span>
                            </button>
                        ))
                    )}
                </div>

                {history.length > 0 && (
                    <div className="p-6 pb-8 flex justify-center bg-gradient-to-t from-black via-black to-transparent">
                        <button
                            onClick={() => setHistory([])}
                            className="px-8 py-3 rounded-full bg-[#333333] text-white font-medium text-sm hover:bg-[#444] transition-colors"
                        >
                            Clear history
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={`w-full h-full flex flex-col ${isDarkMode ? 'bg-black' : 'bg-[#f2f2f2]'} transition-colors duration-500 relative`}>
            {/* Simple Header */}
            <div className="h-16 flex items-center justify-between px-6 shrink-0 absolute top-0 left-0 right-0 z-20">
                <button onClick={onSwitch} className="flex items-center gap-3 hover:opacity-70 active:scale-95 transition-all">
                    <div className="relative">
                        <div className="absolute -inset-1 bg-cyan-500 rounded-full blur opacity-25 animate-pulse"></div>
                        <img src={logo} alt="Jarvis Cali" className="relative w-8 h-8 rounded-full border border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.4)] object-cover" />
                    </div>
                    <div className="flex flex-col">
                        <span className={`font-black tracking-tighter text-sm leading-none ${isDarkMode ? 'text-white' : 'text-black'}`}>JARVIS CALI</span>
                        <span className={`font-mono text-[8px] tracking-[0.2em] font-bold ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>ADVANCED AI</span>
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
            <div className="flex-1 flex flex-col px-8 pb-4 pt-20 overflow-hidden relative">
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

                {/* Display Toolbar (History, Ruler, Date, Scientific) */}
                <div className="flex items-center justify-between mt-6 mb-2 text-neutral-500 relative z-10">
                    <div className="flex gap-6">
                        {/* History Toggle */}
                        <button onClick={() => setViewMode('history')} className="hover:text-green-500 transition-colors"><History size={20} /></button>
                        {/* Ruler Button now Toggles Unit Converter */}
                        <button onClick={() => setViewMode('converter')} className="hover:text-green-500 transition-colors"><Ruler size={20} /></button>
                        {/* Scientific Toggle */}
                        <button onClick={() => setViewMode(viewMode === 'scientific' ? 'calculator' : 'scientific')} className={`transition-colors ${viewMode === 'scientific' ? 'text-green-500' : 'hover:text-green-500'}`}><FlaskConical size={20} /></button>
                        {/* Date Button now Toggles Date Calculator */}
                        <button onClick={() => setViewMode('date')} className="hover:text-green-500 transition-colors"><CalendarClock size={20} /></button>
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
                    autoFocus
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
                {(viewMode === 'scientific' ? FULL_SCI_KEYPAD : KEYPAD).map((item, idx) => (
                    <button key={idx} onClick={item.action} className={getBtnStyle(item, viewMode === 'scientific')}>
                        {item.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SimpleCalculatorPage;
