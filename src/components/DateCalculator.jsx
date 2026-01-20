import React, { useState, useMemo } from 'react';
import { ChevronLeft, Calendar as CalendarIcon, ArrowUp, ArrowDown, Delete } from 'lucide-react';
import { parseDDMMYYYY, formatDDMMYYYY } from '../utils/dateUtils';
import CalendarWidget from './CalendarWidget';

const DateCalculator = ({ onClose, isDarkMode }) => {
    const [activeTab, setActiveTab] = useState('Difference');
    const [date1, setDate1] = useState(formatDDMMYYYY(new Date()));
    const [date2, setDate2] = useState(formatDDMMYYYY(new Date()));

    // Add/Sub State
    const [opDate, setOpDate] = useState(formatDDMMYYYY(new Date()));
    const [opType, setOpType] = useState('add');
    const [years, setYears] = useState('');
    const [months, setMonths] = useState('');
    const [days, setDays] = useState('');

    // NEW: Active Field for Keypad in "Difference" mode
    const [activeDiffInput, setActiveDiffInput] = useState('date1'); // 'date1' or 'date2'

    // Active Field for Calendar Popup
    const [activeField, setActiveField] = useState(null); // 'date1', 'date2', 'opDate'

    // Difference Calculation
    const diffResult = useMemo(() => {
        const d1 = parseDDMMYYYY(date1);
        const d2 = parseDDMMYYYY(date2);

        if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
            return { totalDays: '-', y: '-', m: '-', d: '-' };
        }

        const diffTime = Math.abs(d2 - d1);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let dy = d2.getFullYear() - d1.getFullYear();
        let dm = d2.getMonth() - d1.getMonth();
        let dd = d2.getDate() - d1.getDate();

        if (dd < 0) {
            dm--;
            const prevMonth = new Date(d2.getFullYear(), d2.getMonth(), 0).getDate();
            dd += prevMonth;
        }
        if (dm < 0) {
            dy--;
            dm += 12;
        }
        if (dy < 0) {
            if (d1 > d2) {
                let dy2 = d1.getFullYear() - d2.getFullYear();
                let dm2 = d1.getMonth() - d2.getMonth();
                let dd2 = d1.getDate() - d2.getDate();
                if (dd2 < 0) { dm2--; dd2 += new Date(d1.getFullYear(), d1.getMonth(), 0).getDate(); }
                if (dm2 < 0) { dy2--; dm2 += 12; }
                dy = dy2; dm = dm2; dd = dd2;
            }
        }

        return { totalDays: diffDays, y: dy, m: dm, d: dd };
    }, [date1, date2]);

    // Add/Sub Calculation
    const addSubResult = useMemo(() => {
        const d = parseDDMMYYYY(opDate);
        if (isNaN(d.getTime())) return "Invalid Date";

        const y = parseInt(years) || 0;
        const m = parseInt(months) || 0;
        const day = parseInt(days) || 0;

        if (opType === 'add') {
            d.setFullYear(d.getFullYear() + y);
            d.setMonth(d.getMonth() + m);
            d.setDate(d.getDate() + day);
        } else {
            d.setFullYear(d.getFullYear() - y);
            d.setMonth(d.getMonth() - m);
            d.setDate(d.getDate() - day);
        }
        return formatDDMMYYYY(d);
    }, [opDate, opType, years, months, days]);

    // Helper to format date input as DD-MM-YYYY while typing
    const formatRawDateString = (val) => {
        const clean = val.replace(/\D/g, '').slice(0, 8);
        let formatted = clean;
        if (clean.length > 2) formatted = clean.slice(0, 2) + '-' + clean.slice(2);
        if (clean.length > 4) formatted = formatted.slice(0, 5) + '-' + formatted.slice(5);
        return formatted;
    };

    // Helper to handle numeric input for Difference tab
    const handleDateKeypadInput = (char) => {
        const setter = activeDiffInput === 'date1' ? setDate1 : setDate2;
        const currentVal = activeDiffInput === 'date1' ? date1 : date2;

        let newVal = currentVal;

        if (char === 'C') {
            newVal = '';
        } else if (char === 'backspace') {
            if (newVal.endsWith('-')) newVal = newVal.slice(0, -2);
            else newVal = newVal.slice(0, -1);
        } else if (char === 'switch_focus_up') {
            setActiveDiffInput('date1');
        } else if (char === 'switch_focus_down') {
            setActiveDiffInput('date2');
        } else if (char !== '.' && char !== 'negate') { // Ignore . and +/- placeholders
            if (newVal.length < 10) {
                const raw = newVal.replace(/-/g, '') + char;
                newVal = formatRawDateString(raw);
            }
        }
        setter(newVal);
    };

    // Styles
    const getBtnStyle = (color) => {
        let base = "h-16 rounded-full flex items-center justify-center text-2xl transition-all active:scale-95 font-medium select-none";
        if (isDarkMode) {
            if (color === 'red') return `${base} text-red-500 bg-[#333333]`;
            if (color === 'green') return `${base} text-green-500 bg-[#333333]`;
            if (color === 'submit') return `${base} text-white bg-green-600 rounded-full`;
            return `${base} text-white bg-[#181818]`;
        } else {
            if (color === 'red') return `${base} text-red-600 bg-[#f2f2f2]`;
            if (color === 'green') return `${base} text-green-600 bg-[#f2f2f2]`;
            if (color === 'submit') return `${base} text-white bg-green-500 rounded-full`;
            return `${base} text-black bg-[#f2f2f2] shadow-none`;
        }
    };

    const tabStyle = (isActive) => `flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${isActive ? (isDarkMode ? 'border-white text-white' : 'border-black text-black') : 'border-transparent text-neutral-500'}`;
    const inputContainerClass = `flex flex-col gap-1 mb-6 relative group`;
    const labelClass = `text-xs uppercase tracking-wider font-semibold ${isDarkMode ? 'text-neutral-500' : 'text-neutral-400'}`;
    const nativeInputClass = `w-full bg-transparent text-xl py-2 border-b focus:outline-none focus:border-green-500 transition-colors ${isDarkMode ? 'border-neutral-800 text-white' : 'border-neutral-200 text-black'}`;

    return (
        <div className={`flex flex-col h-full ${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'}`}>
            {/* Header */}
            <div className="h-16 flex items-center gap-4 px-4 shrink-0 relative z-20">
                <button onClick={onClose} className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-neutral-800' : 'hover:bg-neutral-100'}`}>
                    <ChevronLeft size={24} />
                </button>
                <span className="font-medium text-xl">Date calculator</span>
            </div>

            {/* Tabs */}
            <div className="flex px-4 border-b border-neutral-800/50 mb-4">
                <button onClick={() => setActiveTab('Difference')} className={tabStyle(activeTab === 'Difference')}>Difference</button>
                <button onClick={() => setActiveTab('Add/Subtract')} className={tabStyle(activeTab === 'Add/Subtract')}>Add / Subtract</button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col relative overflow-hidden">

                {activeTab === 'Difference' ? (
                    <div className="flex flex-col h-full">
                        <div className="flex-1 px-6 overflow-y-auto">
                            <div className={inputContainerClass}>
                                <label className={labelClass}>From date</label>
                                <div className="flex items-center border-b border-neutral-800">
                                    <div
                                        onClick={() => { setActiveDiffInput('date1'); setActiveField(null); }}
                                        className={`flex-1 py-2 text-xl cursor-pointer ${activeDiffInput === 'date1' ? 'text-green-500' : (isDarkMode ? 'text-white' : 'text-black')}`}
                                    >
                                        {date1 || <span className="opacity-30">DD-MM-YYYY</span>}
                                    </div>
                                    <button onClick={() => setActiveField('date1')} className="p-2 opacity-50 hover:opacity-100">
                                        <CalendarIcon size={20} />
                                    </button>
                                </div>
                                {activeField === 'date1' && (
                                    <div className="absolute top-full left-0 z-50 mt-2">
                                        <CalendarWidget
                                            value={date1}
                                            onChange={(d) => { setDate1(d); setActiveField(null); }}
                                            isDarkMode={isDarkMode}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className={inputContainerClass}>
                                <label className={labelClass}>To date</label>
                                <div className="flex items-center border-b border-neutral-800">
                                    <div
                                        onClick={() => { setActiveDiffInput('date2'); setActiveField(null); }}
                                        className={`flex-1 py-2 text-xl cursor-pointer ${activeDiffInput === 'date2' ? 'text-green-500' : (isDarkMode ? 'text-white' : 'text-black')}`}
                                    >
                                        {date2 || <span className="opacity-30">DD-MM-YYYY</span>}
                                    </div>
                                    <button onClick={() => setActiveField('date2')} className="p-2 opacity-50 hover:opacity-100">
                                        <CalendarIcon size={20} />
                                    </button>
                                </div>
                                {activeField === 'date2' && (
                                    <div className="absolute top-full left-0 z-50 mt-2">
                                        <CalendarWidget
                                            value={date2}
                                            onChange={(d) => { setDate2(d); setActiveField(null); }}
                                            isDarkMode={isDarkMode}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 p-6 rounded-2xl bg-neutral-100/5 flex flex-col items-center justify-center gap-2 border border-dashed border-neutral-500/20">
                                <span className={labelClass}>Difference</span>
                                <div className="text-4xl font-light text-center">
                                    <span className="text-green-500">{diffResult.y}</span>y <span className="text-green-500">{diffResult.m}</span>m <span className="text-green-500">{diffResult.d}</span>d
                                </div>
                                <span className="text-sm opacity-50 mt-2">Total: {diffResult.totalDays} days</span>
                            </div>
                        </div>

                        {/* Numeric Keypad for Difference (MATCHING UNIT CONVERTER LAYOUT) */}
                        <div className={`grid grid-cols-4 gap-2 p-4 border-t ${isDarkMode ? 'bg-black border-neutral-800' : 'bg-white border-neutral-200'}`}>
                            <button onClick={() => handleDateKeypadInput('7')} className={getBtnStyle()}>7</button>
                            <button onClick={() => handleDateKeypadInput('8')} className={getBtnStyle()}>8</button>
                            <button onClick={() => handleDateKeypadInput('9')} className={getBtnStyle()}>9</button>
                            <button onClick={() => handleDateKeypadInput('backspace')} className={getBtnStyle('green')}><Delete size={24} /></button>

                            <button onClick={() => handleDateKeypadInput('4')} className={getBtnStyle()}>4</button>
                            <button onClick={() => handleDateKeypadInput('5')} className={getBtnStyle()}>5</button>
                            <button onClick={() => handleDateKeypadInput('6')} className={getBtnStyle()}>6</button>
                            <button onClick={() => handleDateKeypadInput('C')} className={getBtnStyle('red')}>C</button>

                            <button onClick={() => handleDateKeypadInput('1')} className={getBtnStyle()}>1</button>
                            <button onClick={() => handleDateKeypadInput('2')} className={getBtnStyle()}>2</button>
                            <button onClick={() => handleDateKeypadInput('3')} className={getBtnStyle()}>3</button>
                            <button onClick={() => handleDateKeypadInput('switch_focus_up')} className={getBtnStyle('green')}><ArrowUp size={24} /></button>

                            <button className={getBtnStyle()}>+/-</button>
                            <button onClick={() => handleDateKeypadInput('0')} className={getBtnStyle()}>0</button>
                            <button className={getBtnStyle()}>.</button>
                            <button onClick={() => handleDateKeypadInput('switch_focus_down')} className={getBtnStyle('green')}><ArrowDown size={24} /></button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col h-full p-6 overflow-y-auto">
                        {/* Add/Subtract View - Standard Inputs */}
                        <div className={inputContainerClass}>
                            <label className={labelClass}>Date</label>
                            <div className="flex items-center border-b border-neutral-800">
                                <div className={`flex-1 py-2 text-xl ${isDarkMode ? 'text-white' : 'text-black'}`}>{opDate}</div>
                                <button onClick={() => setActiveField('opDate')} className="p-2 opacity-50 hover:opacity-100">
                                    <CalendarIcon size={20} />
                                </button>
                            </div>
                            {activeField === 'opDate' && (
                                <div className="absolute top-full left-0 z-50 mt-2">
                                    <CalendarWidget
                                        value={opDate}
                                        onChange={(d) => { setOpDate(d); setActiveField(null); }}
                                        isDarkMode={isDarkMode}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4 mb-6">
                            <button onClick={() => setOpType('add')} className={`flex-1 py-3 rounded-xl font-medium transition-all ${opType === 'add' ? 'bg-green-600 text-white' : (isDarkMode ? 'bg-neutral-800' : 'bg-neutral-100')}`}>Add (+)</button>
                            <button onClick={() => setOpType('sub')} className={`flex-1 py-3 rounded-xl font-medium transition-all ${opType === 'sub' ? 'bg-red-600 text-white' : (isDarkMode ? 'bg-neutral-800' : 'bg-neutral-100')}`}>Subtract (-)</button>
                        </div>

                        <div className="flex gap-4 mb-6">
                            <div className="flex-1">
                                <label className={labelClass}>Years</label>
                                <input type="number" value={years} onChange={e => setYears(e.target.value)} className={nativeInputClass} placeholder="0" />
                            </div>
                            <div className="flex-1">
                                <label className={labelClass}>Months</label>
                                <input type="number" value={months} onChange={e => setMonths(e.target.value)} className={nativeInputClass} placeholder="0" />
                            </div>
                            <div className="flex-1">
                                <label className={labelClass}>Days</label>
                                <input type="number" value={days} onChange={e => setDays(e.target.value)} className={nativeInputClass} placeholder="0" />
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-neutral-100/5 flex flex-col items-center justify-center gap-1 border border-dashed border-neutral-500/20">
                            <span className={labelClass}>Result Date</span>
                            <span className="text-2xl font-light text-green-500 text-center">{addSubResult}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DateCalculator;
