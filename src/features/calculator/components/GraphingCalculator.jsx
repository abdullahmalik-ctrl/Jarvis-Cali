import React, { useEffect, useRef, useState } from 'react';
import functionPlot from 'function-plot';
import { ChevronLeft, Plus, Trash2, Github, Minimize2, Maximize2 } from 'lucide-react';
import useSwipeGesture from '@shared/hooks/useSwipeGesture';

const GraphingCalculator = ({ onClose, isDarkMode }) => {
    const plotRef = useRef(null);
    const [functions, setFunctions] = useState([{ id: 1, fn: 'x^2' }]);
    const [domains, setDomains] = useState({ x: [-10, 10], y: [-10, 10] });

    // Swipe right or left to close (Universal Back)
    const { ref: swipeRef } = useSwipeGesture({
        direction: 'horizontal',
        onSwipe: onClose,
    });

    useEffect(() => {
        if (!plotRef.current) return;

        try {
            const width = plotRef.current.clientWidth;
            const height = plotRef.current.clientHeight;

            functionPlot({
                target: plotRef.current,
                width,
                height,
                yAxis: { domain: domains.y },
                xAxis: { domain: domains.x },
                grid: true,
                data: functions.map(f => ({
                    fn: f.fn,
                    color: isDarkMode ? '#4ade80' : '#16a34a', // Green
                    graphType: 'polyline'
                })),
                theme: isDarkMode ? 'dark' : 'light' // function-plot doesn't have a built-in dark theme exactly matching ours, might need custom CSS injection or config
            });
        } catch (e) {
            console.error("Plot error:", e);
        }

        // Cleanup? function-plot might not have a destroy method easily accessible, but re-rendering handles it usually.
    }, [functions, domains, isDarkMode]);

    // Handle Resize
    useEffect(() => {
        const handleResize = () => {
            if (plotRef.current) {
                // Trigger re-render to update width/height
                setFunctions([...functions]);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [functions]);


    const addFunction = () => {
        const newId = Math.max(...functions.map(f => f.id), 0) + 1;
        setFunctions([...functions, { id: newId, fn: '' }]);
    };

    const updateFunction = (id, val) => {
        setFunctions(functions.map(f => f.id === id ? { ...f, fn: val } : f));
    };

    const removeFunction = (id) => {
        if (functions.length > 1) {
            setFunctions(functions.filter(f => f.id !== id));
        } else {
            updateFunction(id, '');
        }
    };

    return (
        <div ref={swipeRef} className={`flex flex-col h-full ${isDarkMode ? 'bg-black text-white' : 'bg-[#f2f2f2] text-black'} relative`}>
            {/* Header */}
            <div className={`h-16 flex items-center justify-between px-6 shrink-0 z-20 border-b ${isDarkMode ? 'border-neutral-800' : 'border-neutral-200'}`}>
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-neutral-800/50 transition-colors">
                        <ChevronLeft size={28} />
                    </button>
                    <span className="font-semibold text-lg">Graphing Calculator</span>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Controls / Function List */}
                <div className={`w-full md:w-80 p-4 overflow-y-auto shrink-0 flex flex-col gap-4 border-r ${isDarkMode ? 'border-neutral-800' : 'border-neutral-200'} z-10 bg-inherit`}>
                    <div className="flex flex-col gap-3">
                        {functions.map((func, idx) => (
                            <div key={func.id} className={`flex items-center gap-2 p-2 rounded-lg ${isDarkMode ? 'bg-[#1E1E1E]' : 'bg-white shadow-sm'}`}>
                                <span className={`font-mono text-sm opacity-50 select-none`}>f{idx + 1}(x)=</span>
                                <input
                                    type="text"
                                    value={func.fn}
                                    onChange={(e) => updateFunction(func.id, e.target.value)}
                                    placeholder="e.g. sin(x)"
                                    className={`flex-1 bg-transparent outline-none font-mono ${isDarkMode ? 'text-white' : 'text-black'}`}
                                />
                                <button onClick={() => removeFunction(func.id)} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-md">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={addFunction}
                        className={`mt-2 py-3 border border-dashed border-neutral-600 rounded-lg flex items-center justify-center gap-2 hover:border-green-500 hover:text-green-500 transition-colors text-sm font-medium ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}
                    >
                        <Plus size={16} /> Add Function
                    </button>

                    <div className="mt-auto pt-6 text-xs text-neutral-500">
                        <p>Tips:</p>
                        <ul className="list-disc ml-4 mt-1 space-y-1">
                            <li>Use <code>x</code> as the variable</li>
                            <li>Try <code>sin(x)</code>, <code>x^2</code>, <code>sqrt(x)</code></li>
                            <li>Zoom with scroll wheel</li>
                            <li>Pan by dragging</li>
                        </ul>
                    </div>
                </div>

                {/* Graph Area */}
                <div className="flex-1 relative overflow-hidden bg-white/5 cursor-crosshair">
                    <div ref={plotRef} className="w-full h-full" id="function-plot-target"></div>

                    {/* Custom Overlay for Zoom Controls if needed, but function-plot has built-in mouse interaction */}
                </div>
            </div>
        </div>
    );
};

export default GraphingCalculator;
