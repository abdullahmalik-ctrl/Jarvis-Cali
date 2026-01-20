import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronDown, X, Delete, ArrowUp, ArrowDown } from 'lucide-react';
import { UNIT_DATA } from '../utils/constants';

const UnitConverter = ({ onClose, isDarkMode }) => {
    const [activeCategory, setActiveCategory] = useState('Area');
    const [inputValue, setInputValue] = useState('');
    const [inputUnit, setInputUnit] = useState('');
    const [outputUnit, setOutputUnit] = useState('');
    const [isFocusOnTop, setIsFocusOnTop] = useState(true);

    // New state for handling the pill-based selection view
    const [selectionMode, setSelectionMode] = useState(null); // 'input' | 'output' | null

    // Initialize units when category changes
    useEffect(() => {
        const units = UNIT_DATA[activeCategory].units;
        setInputUnit(units[0]);
        setOutputUnit(units[1]);
        setInputValue('');
        setSelectionMode(null); // Reset selection mode on category change
    }, [activeCategory]);

    const convertedValue = useMemo(() => {
        if (!inputValue || isNaN(parseFloat(inputValue))) return '';

        if (activeCategory === 'Temperature') {
            const val = parseFloat(inputValue);
            // Bidirectional Logic for Temperature
            // If focused top: Input (Top/Source) -> Output (Bottom/Target)
            // If focused bottom: Input (Bottom/Source) -> Output (Top/Target)

            const sourceUnit = isFocusOnTop ? inputUnit : outputUnit;
            const targetUnit = isFocusOnTop ? outputUnit : inputUnit;

            // Convert Source -> Celsius
            let celsius = val;
            if (sourceUnit === 'Fahrenheit') celsius = (val - 32) * 5 / 9;
            if (sourceUnit === 'Kelvin') celsius = val - 273.15;

            // Convert Celsius -> Target
            let result;
            if (targetUnit === 'Celsius') result = celsius;
            else if (targetUnit === 'Fahrenheit') result = (celsius * 9 / 5) + 32;
            else if (targetUnit === 'Kelvin') result = celsius + 273.15;
            else result = celsius; // Fallback

            return result.toFixed(2);
        }

        // Standard Ratio Conversion
        const ratios = UNIT_DATA[activeCategory].ratios;

        // Determine From/To based on focus
        const fromUnit = isFocusOnTop ? inputUnit : outputUnit;
        const toUnit = isFocusOnTop ? outputUnit : inputUnit;

        const baseValue = parseFloat(inputValue) * ratios[fromUnit]; // Convert from active unit to base
        const result = baseValue / ratios[toUnit]; // Convert from base to inactive unit

        // Auto-formatting for readability
        if (result < 0.000001 || result > 1000000) return result.toExponential(4);
        return parseFloat(result.toPrecision(6)).toString();
    }, [inputValue, inputUnit, outputUnit, activeCategory, isFocusOnTop]);

    const handleInput = (char) => {
        if (char === 'C') {
            setInputValue('');
        } else if (char === 'backspace') {
            setInputValue(prev => prev.slice(0, -1));
        } else if (char === 'switch_focus') {
            // Toggle focus and update inputValue to be the *currently displayed* value of the target field
            // This prevents the numbers from jumping.
            const displayedValueInOtherField = convertedValue;
            setInputValue(displayedValueInOtherField);
            setIsFocusOnTop(!isFocusOnTop);
            setSelectionMode(null);
        } else if (char === 'negate') {
            setInputValue(prev => (prev.startsWith('-') ? prev.slice(1) : '-' + prev));
        } else {
            setInputValue(prev => prev + char);
        }
    };

    const handleUnitSelectorClick = (e, mode) => {
        e.stopPropagation();
        if (selectionMode === mode) {
            setSelectionMode(null);
        } else {
            setSelectionMode(mode);
            // Ensure we are focused on the field we are changing units for
            if (mode === 'input') {
                if (!isFocusOnTop) {
                    setInputValue(convertedValue);
                    setIsFocusOnTop(true);
                }
            } else {
                if (isFocusOnTop) {
                    setInputValue(convertedValue);
                    setIsFocusOnTop(false);
                }
            }
        }
    };

    // Handle direct click on input field (not just selector)
    const handleFieldFocus = (focusTop) => {
        if (focusTop === isFocusOnTop) return; // Already focused

        // Switch focus: The value currently displayed in the *target* field becomes the new editable *inputValue*
        setInputValue(convertedValue);
        setIsFocusOnTop(focusTop);
        setSelectionMode(null); // Close any open unit picker
    };

    // Helper for symbols (mocking abbreviation)
    const getSymbol = (unit) => {
        const map = {
            'Meters': 'm', 'Kilometers': 'km', 'Centimeters': 'cm', 'Millimeters': 'mm', 'Inches': 'in', 'Feet': 'ft', 'Yards': 'yd', 'Miles': 'mi',
            'Acres': 'ac', 'Ares': 'a', 'Hectares': 'ha', 'Square meters': 'm²', 'Square feet': 'ft²', 'Square inches': 'in²',
            'Celsius': '°C', 'Fahrenheit': '°F', 'Kelvin': 'K',
            'Liters': 'l', 'Milliliters': 'ml', 'Gallons (US)': 'gal', 'Cups (US)': 'cup', 'Fluid Ounces (US)': 'fl oz', 'Cubic meters': 'm³',
            'Kilograms': 'kg', 'Grams': 'g', 'Milligrams': 'mg', 'Pounds': 'lb', 'Ounces': 'oz', 'Tons': 't',
            'Bytes': 'B', 'Kilobytes': 'KB', 'Megabytes': 'MB', 'Gigabytes': 'GB', 'Terabytes': 'TB', 'Petabytes': 'PB',
            'Meters/second': 'm/s', 'Kilometers/hour': 'km/h', 'Miles/hour': 'mph', 'Knots': 'kn',
            'Milliseconds': 'ms', 'Seconds': 's', 'Minutes': 'min', 'Hours': 'h', 'Days': 'd', 'Weeks': 'wk'
        };
        return map[unit] || unit.substring(0, 2).toLowerCase();
    };

    // Styles
    const getBtnStyle = (color) => {
        let base = "h-20 rounded-full flex items-center justify-center text-2xl transition-all active:scale-95 font-medium select-none";
        if (isDarkMode) {
            if (color === 'red') return `${base} text-red-500 bg-[#333333]`;
            if (color === 'green') return `${base} text-green-500 bg-[#333333]`;
            if (color === 'submit') return `${base} text-white bg-green-700`;
            return `${base} text-white bg-[#181818]`;
        } else {
            if (color === 'red') return `${base} text-red-600 bg-[#f2f2f2]`;
            if (color === 'green') return `${base} text-green-600 bg-[#f2f2f2]`;
            if (color === 'submit') return `${base} text-white bg-green-500`;
            return `${base} text-black bg-[#f2f2f2] shadow-none`;
        }
    };

    // Dynamic Styles for the Unit Pill Trigger
    const getPillStyle = (isActive) => {
        if (isDarkMode) {
            return isActive
                ? 'bg-neutral-800 text-green-400 ring-2 ring-green-500/50'
                : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800';
        }
        return isActive
            ? 'bg-white text-green-600 ring-2 ring-green-500/30 shadow-sm'
            : 'bg-[#e8e8e8] text-neutral-600 hover:bg-[#dcdcdc]';
    };

    return (
        <div className={`flex flex-col h-full ${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'}`}>
            {/* Header */}
            <div className="h-16 flex items-center gap-4 px-4 shrink-0 relative z-20">
                <button onClick={onClose} className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-neutral-800' : 'hover:bg-neutral-100'}`}>
                    <ChevronLeft size={24} />
                </button>
                <span className="font-medium text-xl">Unit converter</span>
            </div>

            {/* Tabs */}
            <div className="w-full overflow-x-auto scrollbar-none px-4 mb-6">
                <div className="flex gap-2">
                    {Object.keys(UNIT_DATA).map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === cat
                                    ? (isDarkMode ? 'bg-neutral-800 text-white' : 'bg-[#e8e8e8] text-black')
                                    : (isDarkMode ? 'text-neutral-500 hover:text-neutral-300' : 'text-neutral-500 hover:text-black')
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Inputs Area */}
            <div className="flex-1 flex flex-col px-6 gap-2">

                {/* Top Input */}
                <div
                    className={`relative py-4 border-b transition-colors ${isDarkMode ? 'border-neutral-800' : 'border-neutral-100'} cursor-pointer`}
                    onClick={() => handleFieldFocus(true)}
                >
                    {/* Unit Selector Pill */}
                    <div className="flex items-center gap-1 mb-2">
                        <button
                            onClick={(e) => handleUnitSelectorClick(e, 'input')}
                            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all ${getPillStyle(selectionMode === 'input')}`}
                        >
                            <span>{inputUnit}</span>
                            <ChevronDown size={16} className={`transition-transform duration-300 ${selectionMode === 'input' ? 'rotate-180' : ''}`} />
                        </button>
                    </div>

                    {/* Value Row */}
                    <div className={`flex items-baseline justify-end gap-2`}>
                        <span className={`text-5xl font-light tracking-tight transition-colors duration-200 ${isFocusOnTop ? (isDarkMode ? 'text-green-400' : 'text-green-600') : (isDarkMode ? 'text-neutral-500' : 'text-neutral-400')}`}>
                            {isFocusOnTop ? (inputValue || '0') : (convertedValue || '0')}
                        </span>
                        <span className={`text-lg font-normal ${isDarkMode ? 'text-neutral-500' : 'text-neutral-400'}`}>
                            {getSymbol(inputUnit)}
                        </span>
                    </div>
                </div>

                {/* Bottom Input */}
                <div
                    className={`relative py-4 border-b transition-colors ${isDarkMode ? 'border-neutral-800' : 'border-neutral-100'} cursor-pointer`}
                    onClick={() => handleFieldFocus(false)}
                >
                    {/* Unit Selector Pill */}
                    <div className="flex items-center gap-1 mb-2">
                        <button
                            onClick={(e) => handleUnitSelectorClick(e, 'output')}
                            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all ${getPillStyle(selectionMode === 'output')}`}
                        >
                            <span>{outputUnit}</span>
                            <ChevronDown size={16} className={`transition-transform duration-300 ${selectionMode === 'output' ? 'rotate-180' : ''}`} />
                        </button>
                    </div>

                    {/* Value Row */}
                    <div className={`flex items-baseline justify-end gap-2`}>
                        <span className={`text-5xl font-light tracking-tight transition-colors duration-200 ${!isFocusOnTop ? (isDarkMode ? 'text-green-400' : 'text-green-600') : (isDarkMode ? 'text-neutral-500' : 'text-neutral-400')}`}>
                            {!isFocusOnTop ? (inputValue || '0') : (convertedValue || '0')}
                        </span>
                        <span className={`text-lg font-normal ${isDarkMode ? 'text-neutral-500' : 'text-neutral-400'}`}>
                            {getSymbol(outputUnit)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Logic to Toggle between Keypad and Unit Selection Grid */}
            {selectionMode ? (
                <div className={`flex-1 overflow-y-auto p-4 animate-in slide-in-from-bottom-4 duration-300 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
                    <div className="flex items-center justify-between mb-4 px-2">
                        <span className={`text-sm font-medium uppercase tracking-wider ${isDarkMode ? 'text-neutral-500' : 'text-neutral-400'}`}>
                            Select {selectionMode === 'input' ? 'Input' : 'Output'} Unit
                        </span>
                        <button onClick={() => setSelectionMode(null)} className={`p-1 rounded-full ${isDarkMode ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-500'}`}>
                            <X size={16} />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {UNIT_DATA[activeCategory].units.map(u => {
                            const isSelected = (selectionMode === 'input' ? inputUnit : outputUnit) === u;
                            return (
                                <button
                                    key={u}
                                    onClick={() => {
                                        if (selectionMode === 'input') setInputUnit(u);
                                        else setOutputUnit(u);
                                        setSelectionMode(null);
                                    }}
                                    className={`py-4 px-4 rounded-3xl text-sm font-medium transition-all ${isSelected
                                            ? (isDarkMode ? 'bg-green-600 text-white shadow-lg shadow-green-900/20' : 'bg-green-500 text-white shadow-lg shadow-green-500/20')
                                            : (isDarkMode ? 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800' : 'bg-[#f0f0f0] text-neutral-700 hover:bg-[#e6e6e6]')
                                        }`}
                                >
                                    <div className="flex flex-col items-start gap-1">
                                        <span>{u}</span>
                                        <span className={`text-xs ${isSelected ? 'opacity-70' : 'opacity-40'}`}>{getSymbol(u)}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className={`grid grid-cols-4 gap-2 p-4 pb-12 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
                    <button onClick={() => handleInput('7')} className={getBtnStyle()}>7</button>
                    <button onClick={() => handleInput('8')} className={getBtnStyle()}>8</button>
                    <button onClick={() => handleInput('9')} className={getBtnStyle()}>9</button>
                    <button onClick={() => handleInput('backspace')} className={getBtnStyle('green')}><Delete size={24} /></button>

                    <button onClick={() => handleInput('4')} className={getBtnStyle()}>4</button>
                    <button onClick={() => handleInput('5')} className={getBtnStyle()}>5</button>
                    <button onClick={() => handleInput('6')} className={getBtnStyle()}>6</button>
                    <button onClick={() => handleInput('C')} className={getBtnStyle('red')}>C</button>

                    <button onClick={() => handleInput('1')} className={getBtnStyle()}>1</button>
                    <button onClick={() => handleInput('2')} className={getBtnStyle()}>2</button>
                    <button onClick={() => handleInput('3')} className={getBtnStyle()}>3</button>
                    <button onClick={() => { handleInput('switch_focus'); }} className={getBtnStyle('green')}><ArrowUp size={24} /></button>

                    <button onClick={() => handleInput('negate')} className={getBtnStyle()}>+/-</button>
                    <button onClick={() => handleInput('0')} className={getBtnStyle()}>0</button>
                    <button onClick={() => handleInput('.')} className={getBtnStyle()}>.</button>
                    <button onClick={() => { handleInput('switch_focus'); }} className={getBtnStyle('green')}><ArrowDown size={24} /></button>
                </div>
            )}
        </div>
    );
};

export default UnitConverter;
