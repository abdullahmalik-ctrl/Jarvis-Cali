import { CURATED_QUESTION_BANK } from '@features/practice/data/curatedQuestionBank';

const QUESTION_REVIEW_OVERRIDES_KEY = 'jarvis_question_review_overrides_v1';

const readReviewOverrides = () => {
    try {
        return JSON.parse(localStorage.getItem(QUESTION_REVIEW_OVERRIDES_KEY) || '{}');
    } catch (_error) {
        return {};
    }
};

const writeReviewOverrides = (overrides) => {
    localStorage.setItem(QUESTION_REVIEW_OVERRIDES_KEY, JSON.stringify(overrides));
};

const withReviewOverrides = (question) => {
    const overrides = readReviewOverrides();
    const questionOverride = overrides[question.id];
    if (!questionOverride) {
        return question;
    }

    return {
        ...question,
        quality: {
            ...question.quality,
            ...questionOverride,
        }
    };
};

export const getCuratedQuestionPool = () => CURATED_QUESTION_BANK.map(withReviewOverrides);

export const getCuratedQuestions = ({ topic, difficulty, curriculum, count }) => {
    const approvedQuestions = getCuratedQuestionPool().filter((question) => {
        const isTopicMatch = question.topic === topic;
        const isDifficultyMatch = question.difficulty === difficulty;
        const isCurriculumMatch = curriculum === 'General' || question.curriculumTag === curriculum;
        const isApproved = question.quality?.status === 'approved';
        return isTopicMatch && isDifficultyMatch && isCurriculumMatch && isApproved;
    });

    const shuffled = [...approvedQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map((question, index) => ({
        ...question,
        id: `${question.id}-${index + 1}`,
        source: 'curated'
    }));
};

export const getQuestionQualityStats = () => {
    const pool = getCuratedQuestionPool();
    const stats = pool.reduce((acc, question) => {
        const status = question.quality?.status || 'pending';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, { approved: 0, pending: 0, rejected: 0, flagged: 0 });

    return {
        total: pool.length,
        ...stats,
    };
};

export const reviewCuratedQuestion = ({ questionId, status, reviewer, note }) => {
    const overrides = readReviewOverrides();
    overrides[questionId] = {
        status,
        reviewedBy: reviewer || 'local-reviewer',
        reviewNote: note || '',
        reviewedAt: new Date().toISOString().slice(0, 10),
    };
    writeReviewOverrides(overrides);
};
