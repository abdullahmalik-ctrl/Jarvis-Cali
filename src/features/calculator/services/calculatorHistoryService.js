const HISTORY_KEY = 'calc_history';

export const loadCalculatorHistory = () => {
    const saved = localStorage.getItem(HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
};

export const saveCalculatorHistory = (history) => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
};
