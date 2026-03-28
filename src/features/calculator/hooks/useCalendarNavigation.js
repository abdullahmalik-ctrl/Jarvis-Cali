import { useMemo, useState } from 'react';

const useCalendarNavigation = (value, parseDate) => {
    const today = useMemo(() => new Date(), []);
    const [currentMonth, setCurrentMonth] = useState(() => {
        const d = parseDate(value);
        return Number.isNaN(d.getTime()) ? today : d;
    });
    const [view, setView] = useState('days');

    return {
        currentMonth,
        setCurrentMonth,
        view,
        setView,
        year: currentMonth.getFullYear(),
        month: currentMonth.getMonth()
    };
};

export default useCalendarNavigation;
