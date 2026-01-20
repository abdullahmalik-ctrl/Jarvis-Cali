import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { parseDDMMYYYY, formatDDMMYYYY } from '../utils/dateUtils';

const CalendarWidget = ({ value, onChange, onClose, isDarkMode }) => {
    const today = new Date();
    // We initialize state safely
    const [currentMonth, setCurrentMonth] = useState(() => {
        // Parse DD-MM-YYYY
        const d = parseDDMMYYYY(value);
        return isNaN(d.getTime()) ? today : d;
    });

    // View mode for fast selection: 'days', 'months', 'years'
    const [view, setView] = useState('days');

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
    const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

    const handlePrev = (e) => {
        e.preventDefault();
        if (view === 'days') setCurrentMonth(new Date(year, month - 1, 1));
        else if (view === 'years') setCurrentMonth(new Date(year - 12, month, 1));
    };

    const handleNext = (e) => {
        e.preventDefault();
        if (view === 'days') setCurrentMonth(new Date(year, month + 1, 1));
        else if (view === 'years') setCurrentMonth(new Date(year + 12, month, 1));
    };

    const handleDateClick = (d) => {
        const newDate = new Date(year, month, d);
        // Format as DD-MM-YYYY
        onChange(formatDDMMYYYY(newDate));
    };

    const handleMonthSelect = (mIndex) => {
        setCurrentMonth(new Date(year, mIndex, 1));
        setView('days');
    };

    const handleYearSelect = (y) => {
        setCurrentMonth(new Date(y, month, 1));
        setView('days');
    };

    // --- Render Views ---

    // 1. Month Picker View
    const renderMonths = () => {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return (
            <div className="grid grid-cols-3 gap-2 mt-2">
                {months.map((m, i) => (
                    <button
                        key={m}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleMonthSelect(i)}
                        className={`py-3 rounded-xl text-sm font-medium transition-all ${i === month
                                ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                                : (isDarkMode ? 'hover:bg-neutral-800 text-white' : 'hover:bg-neutral-100 text-black')
                            }`}
                    >
                        {m}
                    </button>
                ))}
            </div>
        );
    };

    // 2. Year Picker View (Range around current year)
    const renderYears = () => {
        const years = [];
        const startYear = year - 6; // Show 12 years roughly centered
        for (let i = 0; i < 12; i++) {
            years.push(startYear + i);
        }
        return (
            <div className="grid grid-cols-3 gap-2 mt-2">
                {years.map((y) => (
                    <button
                        key={y}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleYearSelect(y)}
                        className={`py-3 rounded-xl text-sm font-medium transition-all ${y === year
                                ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                                : (isDarkMode ? 'hover:bg-neutral-800 text-white' : 'hover:bg-neutral-100 text-black')
                            }`}
                    >
                        {y}
                    </button>
                ))}
            </div>
        );
    };

    // 3. Days Grid View (Standard)
    const renderDays = () => {
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const days = [];

        // Padding days
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`pad-${i}`} className="h-10 w-10" />);
        }

        // Actual days
        for (let d = 1; d <= daysInMonth; d++) {
            // Use helper to format current cell date for comparison
            const currentCellDate = new Date(year, month, d);
            const currentDateStr = formatDDMMYYYY(currentCellDate);

            const isSelected = value === currentDateStr;

            const todayDate = new Date();
            const isToday = currentCellDate.getDate() === todayDate.getDate() &&
                currentCellDate.getMonth() === todayDate.getMonth() &&
                currentCellDate.getFullYear() === todayDate.getFullYear();

            days.push(
                <button
                    key={d}
                    onMouseDown={(e) => e.preventDefault()} // Prevent input blur
                    onClick={() => handleDateClick(d)}
                    className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${isSelected
                            ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                            : isToday
                                ? (isDarkMode ? 'bg-neutral-800 text-green-400 border border-green-500/50' : 'bg-green-50 text-green-600 border border-green-200')
                                : (isDarkMode ? 'hover:bg-neutral-800 text-white' : 'hover:bg-neutral-100 text-black')
                        }`}
                >
                    {d}
                </button>
            );
        }

        return (
            <div className="grid grid-cols-7 gap-1 mb-2 px-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div key={i} className={`h-8 w-10 flex items-center justify-center text-xs font-bold opacity-50 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        {day}
                    </div>
                ))}
                {days}
            </div>
        );
    };

    return (
        <div
            className={`p-4 rounded-3xl shadow-2xl border backdrop-blur-md animate-in fade-in zoom-in duration-200 ${isDarkMode ? 'bg-black/90 border-neutral-800' : 'bg-white/95 border-neutral-200'
                }`}
            style={{ width: '320px', maxWidth: '90vw' }}
            onMouseDown={(e) => e.preventDefault()} // Prevent blur
        >
            <div className="flex items-center justify-between mb-4 px-2">
                <button onMouseDown={(e) => e.preventDefault()} onClick={handlePrev} className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-neutral-800 text-white' : 'hover:bg-neutral-100 text-black'}`}>
                    <ChevronLeft size={20} />
                </button>

                {/* Interactive Month/Year Headers */}
                <div className="flex gap-2">
                    <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setView(view === 'months' ? 'days' : 'months')}
                        className={`px-3 py-1 rounded-full text-lg font-semibold transition-colors ${view === 'months'
                                ? (isDarkMode ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-black')
                                : (isDarkMode ? 'text-white hover:bg-neutral-800/50' : 'text-black hover:bg-neutral-100/50')
                            }`}
                    >
                        {currentMonth.toLocaleDateString('en-US', { month: 'long' })}
                    </button>
                    <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setView(view === 'years' ? 'days' : 'years')}
                        className={`px-3 py-1 rounded-full text-lg font-semibold transition-colors ${view === 'years'
                                ? (isDarkMode ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-black')
                                : (isDarkMode ? 'text-white hover:bg-neutral-800/50' : 'text-black hover:bg-neutral-100/50')
                            }`}
                    >
                        {year}
                    </button>
                </div>

                <button onMouseDown={(e) => e.preventDefault()} onClick={handleNext} className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-neutral-800 text-white' : 'hover:bg-neutral-100 text-black'}`}>
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Dynamic Content Body */}
            <div className="min-h-[280px]">
                {view === 'days' && renderDays()}
                {view === 'months' && renderMonths()}
                {view === 'years' && renderYears()}
            </div>
        </div>
    );
};

export default CalendarWidget;
