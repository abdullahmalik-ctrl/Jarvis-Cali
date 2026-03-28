import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, X, Trophy, RefreshCw, Brain, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import useSwipeGesture from '@shared/hooks/useSwipeGesture';
import usePracticeOptions from '@features/practice/hooks/usePracticeOptions';
import { generatePracticeQuestions } from '@features/practice/services/practiceQuestionsService';


const PracticeMode = ({ onBack, apiKey, modelName, isDarkMode }) => {
    const { TOPICS, DIFFICULTIES } = usePracticeOptions();

    const [gameState, setGameState] = useState('setup'); // setup, loading, playing, summary
    const [config, setConfig] = useState({
        topic: 'Algebra',
        difficulty: 'Medium',
        count: 5
    });

    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [userAnswers, setUserAnswers] = useState([]); // { questionId, answer, isCorrect }
    const [selectedOption, setSelectedOption] = useState(null);
    const [isChecking, setIsChecking] = useState(false);
    const [feedback, setFeedback] = useState(null); // { isCorrect, explanation }

    // Swipe to go back (Universal Back: Left or Right)
    const { ref: swipeRef } = useSwipeGesture({
        direction: 'horizontal',
        onSwipe: onBack,
        enabled: gameState === 'setup' || gameState === 'summary',
    });

    const generateQuestions = async () => {
        setGameState('loading');
        try {
            const parsedQuestions = await generatePracticeQuestions({ apiKey, modelName, config });
            setQuestions(parsedQuestions);
            setGameState('playing');
        } catch (error) {
            console.error("Failed to generate questions:", error);
            alert("Failed to generate questions. Please try again. " + error.message);
            setGameState('setup');
        }
    };

    const handleAnswerSubmit = () => {
        if (!selectedOption || isChecking) return;

        setIsChecking(true);
        const currentQ = questions[currentQuestionIndex];
        const isCorrect = selectedOption === currentQ.correctAnswer;

        if (isCorrect) setScore(s => s + 1);

        setFeedback({
            isCorrect,
            explanation: currentQ.explanation
        });

        setUserAnswers([...userAnswers, {
            question: currentQ.question,
            userAnswer: selectedOption,
            correctAnswer: currentQ.correctAnswer,
            isCorrect
        }]);
    };

    const nextQuestion = () => {
        setIsChecking(false);
        setSelectedOption(null);
        setFeedback(null);

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(i => i + 1);
        } else {
            setGameState('summary');
        }
    };

    // --- RENDERERS ---

    const renderSetup = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="flex flex-col gap-6 w-full max-w-lg mx-auto"
        >
            <div className={`p-6 rounded-3xl ${isDarkMode ? 'bg-[#1e1e1e]' : 'bg-white'} shadow-xl`}>
                <div className="flex items-center gap-3 mb-6">
                    <div className={`p-3 rounded-full ${isDarkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
                        <Brain size={32} />
                    </div>
                    <h2 className="text-2xl font-bold">Practice Setup</h2>
                </div>

                {/* Topic */}
                <div className="mb-4">
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Topic</label>
                    <div className="grid grid-cols-2 gap-2">
                        {TOPICS.map(t => (
                            <motion.button
                                key={t}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setConfig({ ...config, topic: t })}
                                className={`p-3 rounded-xl text-sm font-medium transition-all ${config.topic === t
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                                    : isDarkMode ? 'bg-[#2a2a2a] hover:bg-[#333]' : 'bg-gray-100 hover:bg-gray-200'
                                    }`}
                            >
                                {t}
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Difficulty */}
                <div className="mb-4">
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Difficulty</label>
                    <div className="flex gap-2">
                        {DIFFICULTIES.map(d => (
                            <motion.button
                                key={d}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setConfig({ ...config, difficulty: d })}
                                className={`flex-1 p-2 rounded-xl text-sm font-medium transition-all ${config.difficulty === d
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                    : isDarkMode ? 'bg-[#2a2a2a] hover:bg-[#333]' : 'bg-gray-100 hover:bg-gray-200'
                                    }`}
                            >
                                {d}
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Question Count */}
                <div className="mb-8">
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Questions</label>
                    <div className="flex gap-2">
                        {[5, 10, 20].map(c => (
                            <motion.button
                                key={c}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setConfig({ ...config, count: c })}
                                className={`flex-1 p-2 rounded-xl text-sm font-medium transition-all ${config.count === c
                                    ? 'bg-green-600 text-white shadow-lg shadow-green-500/30'
                                    : isDarkMode ? 'bg-[#2a2a2a] hover:bg-[#333]' : 'bg-gray-100 hover:bg-gray-200'
                                    }`}
                            >
                                {c}
                            </motion.button>
                        ))}
                    </div>
                </div>

                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={generateQuestions}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-lg shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-transform"
                >
                    Start Quiz
                </motion.button>
            </div>
        </motion.div>
    );

    const renderLoading = () => (
        <div className="flex flex-col items-center justify-center h-full gap-4">
            <Loader2 size={48} className="animate-spin text-purple-500" />
            <p className="text-lg font-medium animate-pulse">Generating your quiz...</p>
        </div>
    );

    const renderPlaying = () => {
        const question = questions[currentQuestionIndex];
        return (
            <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
                className="w-full max-w-2xl mx-auto flex flex-col h-full justify-center"
            >
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-800 h-2 rounded-full mb-8 overflow-hidden">
                    <div
                        className="bg-purple-600 h-full transition-all duration-500"
                        style={{ width: `${((currentQuestionIndex) / questions.length) * 100}%` }}
                    />
                </div>

                <div className={`p-8 rounded-3xl ${isDarkMode ? 'bg-[#1e1e1e]' : 'bg-white'} shadow-2xl relative overflow-hidden`}>
                    <div className="flex justify-between items-center mb-6">
                        <span className={`text-sm font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            Question {currentQuestionIndex + 1}/{questions.length}
                        </span>
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                            {config.topic} • {config.difficulty}
                        </span>
                    </div>

                    <div className="prose dark:prose-invert max-w-none mb-8 text-xl font-medium">
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {question.question}
                        </ReactMarkdown>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {question.options.map((opt, idx) => {
                            let stateClass = "";
                            if (isChecking) {
                                if (opt === question.correctAnswer) stateClass = "bg-green-500 text-white border-green-500";
                                else if (opt === selectedOption) stateClass = "bg-red-500 text-white border-red-500";
                                else stateClass = isDarkMode ? "opacity-50" : "opacity-30";
                            } else {
                                if (selectedOption === opt) stateClass = "bg-purple-600 text-white border-purple-600";
                                else stateClass = isDarkMode ? "bg-[#2a2a2a] hover:bg-[#333] border-transparent" : "bg-gray-50 hover:bg-gray-100 border-gray-200";
                            }

                            return (
                                <button
                                    key={idx}
                                    onClick={() => !isChecking && setSelectedOption(opt)}
                                    disabled={isChecking}
                                    className={`p-4 rounded-xl text-left transition-all border-2 text-lg flex items-center justify-between ${stateClass}`}
                                >
                                    <span className="flex-1">
                                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                            {opt}
                                        </ReactMarkdown>
                                    </span>
                                    {isChecking && opt === question.correctAnswer && <Check size={20} />}
                                    {isChecking && opt === selectedOption && opt !== question.correctAnswer && <X size={20} />}
                                </button>
                            );
                        })}
                    </div>

                    {feedback && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className={`mt-6 p-4 rounded-xl ${feedback.isCorrect ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}
                        >
                            <p className="font-bold mb-1">{feedback.isCorrect ? "Correct!" : "Incorrect"}</p>
                            <p className="text-sm opacity-90">{feedback.explanation}</p>
                        </motion.div>
                    )}

                    <div className="mt-8">
                        {!isChecking ? (
                            <button
                                onClick={handleAnswerSubmit}
                                disabled={!selectedOption}
                                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${selectedOption
                                    ? 'bg-purple-600 text-white shadow-lg hover:scale-[1.02]'
                                    : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                Check Answer
                            </button>
                        ) : (
                            <button
                                onClick={nextQuestion}
                                className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold text-lg shadow-lg hover:scale-[1.02] transition-transform"
                            >
                                {currentQuestionIndex < questions.length - 1 ? "Next Question" : "View Results"}
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        );
    };

    const renderSummary = () => {
        const percentage = Math.round((score / questions.length) * 100);
        let message = "Good effort!";
        if (percentage >= 90) message = "Outstanding!";
        else if (percentage >= 70) message = "Great job!";
        else if (percentage < 50) message = "Keep practicing!";

        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg mx-auto flex flex-col items-center"
            >
                <div className={`w-full p-8 rounded-3xl ${isDarkMode ? 'bg-[#1e1e1e]' : 'bg-white'} shadow-2xl text-center`}>
                    <div className="mb-6 inline-flex p-4 rounded-full bg-yellow-500/20 text-yellow-500">
                        <Trophy size={48} />
                    </div>
                    <h2 className="text-3xl font-bold mb-2">{message}</h2>
                    <p className={`text-lg mb-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        You scored {score} out of {questions.length}
                    </p>

                    <div className="text-6xl font-black mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">
                        {percentage}%
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={onBack}
                            className={`flex-1 py-4 rounded-xl font-bold transition-all ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
                        >
                            Exit
                        </button>
                        <button
                            onClick={() => {
                                setGameState('setup');
                                setDetails({ ...config });
                                setScore(0);
                                setCurrentQuestionIndex(0);
                                setUserAnswers([]);
                            }}
                            className="flex-1 py-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={20} />
                            Play Again
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <div ref={swipeRef} className={`fixed inset-0 z-40 flex flex-col ${isDarkMode ? 'bg-black text-white' : 'bg-[#f0f0f0] text-black'}`}>
            {/* Header */}
            <div className="p-4 flex items-center">
                <button onClick={onBack} className={`p-2 rounded-full hover:bg-gray-500/10 transition-colors`}>
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-bold ml-4">Practice Mode</h1>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col relative">
                <AnimatePresence mode="wait">
                    {gameState === 'setup' && renderSetup()}
                    {gameState === 'loading' && renderLoading()}
                    {gameState === 'playing' && renderPlaying()}
                    {gameState === 'summary' && renderSummary()}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default PracticeMode;
