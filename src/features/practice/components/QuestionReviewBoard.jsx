import { useMemo, useState } from 'react';
import { CheckCircle2, ClipboardCheck, Filter, XCircle } from 'lucide-react';
import { getReviewQueue, reviewGeneratedQuestion } from '@features/practice/services/qualityReviewService';

const QuestionReviewBoard = ({ isDarkMode, onReviewCompleted }) => {
    const [filter, setFilter] = useState('pending');
    const [queue, setQueue] = useState(() => getReviewQueue());

    const visibleQueue = useMemo(() => {
        if (filter === 'all') {
            return queue;
        }
        return queue.filter((item) => item.status === filter);
    }, [filter, queue]);

    const handleReview = (reviewId, status) => {
        reviewGeneratedQuestion({ reviewId, status, reviewer: 'local-reviewer' });
        const updated = getReviewQueue();
        setQueue(updated);
        onReviewCompleted();
    };

    return (
        <div className={`mt-4 p-4 rounded-2xl border ${isDarkMode ? 'border-neutral-700 bg-neutral-900/70' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                    <ClipboardCheck size={16} />
                    Solution Quality Review Queue
                </h3>
                <div className="flex items-center gap-2 text-xs">
                    <Filter size={14} />
                    <select
                        value={filter}
                        onChange={(event) => setFilter(event.target.value)}
                        className={`px-2 py-1 rounded-lg border ${isDarkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-gray-200'}`}
                    >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="needs_work">Needs Work</option>
                        <option value="all">All</option>
                    </select>
                </div>
            </div>

            {visibleQueue.length === 0 ? (
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No review items for this filter.
                </p>
            ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {visibleQueue.slice(0, 10).map((item) => (
                        <div
                            key={item.reviewId}
                            className={`p-3 rounded-xl border ${isDarkMode ? 'border-neutral-700 bg-neutral-950/70' : 'border-gray-200 bg-white'}`}
                        >
                            <p className="font-medium text-sm mb-1">{item.question.question}</p>
                            <p className={`text-xs mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {item.meta.topic} • {item.meta.difficulty} • {item.meta.curriculum}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleReview(item.reviewId, 'approved')}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs"
                                >
                                    <CheckCircle2 size={14} /> Approve
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleReview(item.reviewId, 'needs_work')}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs"
                                >
                                    <XCircle size={14} /> Needs Work
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default QuestionReviewBoard;
