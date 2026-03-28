import { useEffect, useState } from 'react';

const useTutorHistory = () => {
    const [tutorHistory, setTutorHistory] = useState(() => {
        const saved = localStorage.getItem('tutor_history');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('tutor_history', JSON.stringify(tutorHistory));
    }, [tutorHistory]);

    return { tutorHistory, setTutorHistory };
};

export default useTutorHistory;
