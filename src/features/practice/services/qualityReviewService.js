const REVIEW_QUEUE_KEY = 'jarvis_solution_review_queue_v1';

const readQueue = () => {
    try {
        return JSON.parse(localStorage.getItem(REVIEW_QUEUE_KEY) || '[]');
    } catch (_error) {
        return [];
    }
};

const writeQueue = (queue) => {
    localStorage.setItem(REVIEW_QUEUE_KEY, JSON.stringify(queue));
};

export const queueGeneratedQuestionsForReview = (questions = [], meta = {}) => {
    if (!Array.isArray(questions) || questions.length === 0) {
        return;
    }

    const currentQueue = readQueue();
    const timestamp = new Date().toISOString();
    const incoming = questions.map((question) => ({
        reviewId: `${question.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        status: 'pending',
        createdAt: timestamp,
        reviewedAt: null,
        reviewer: null,
        notes: '',
        question,
        meta,
    }));

    writeQueue([...incoming, ...currentQueue]);
};

export const getReviewQueue = () => readQueue();

export const getReviewQueueStats = () => {
    return readQueue().reduce((acc, item) => {
        acc.total += 1;
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
    }, { total: 0, pending: 0, approved: 0, needs_work: 0 });
};

export const reviewGeneratedQuestion = ({ reviewId, status, notes, reviewer }) => {
    const queue = readQueue().map((item) => {
        if (item.reviewId !== reviewId) {
            return item;
        }

        return {
            ...item,
            status,
            notes: notes || item.notes,
            reviewer: reviewer || 'local-reviewer',
            reviewedAt: new Date().toISOString(),
        };
    });

    writeQueue(queue);
};
