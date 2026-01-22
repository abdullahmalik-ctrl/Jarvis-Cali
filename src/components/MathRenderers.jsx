import React, { useState, useEffect, useRef, useMemo, useLayoutEffect } from 'react';

// --- Hook: Load KaTeX (Robust & Secure) ---
export const useKatex = () => {
    const [isReady, setIsReady] = useState(!!window.katex);

    useEffect(() => {
        if (window.katex) {
            setIsReady(true);
            return;
        }

        const checkInterval = setInterval(() => {
            if (window.katex) {
                setIsReady(true);
                clearInterval(checkInterval);
            }
        }, 50);

        if (!document.getElementById('katex-css')) {
            const link = document.createElement("link");
            link.id = "katex-css";
            link.href = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css";
            link.rel = "stylesheet";
            link.crossOrigin = "anonymous";
            document.head.appendChild(link);
        }

        if (!document.getElementById('katex-script')) {
            const script = document.createElement("script");
            script.id = "katex-script";
            script.src = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js";
            script.crossOrigin = "anonymous";
            script.onload = () => setIsReady(true);
            script.onerror = () => console.error("Failed to load KaTeX");
            document.head.appendChild(script);
        }

        return () => clearInterval(checkInterval);
    }, []);

    return isReady;
};

// --- Helper: Render Math inside Buttons ---
export const MathLabel = ({ latex, label, isReady }) => {
    const containerRef = useRef(null);

    useEffect(() => {
        if (isReady && latex && window.katex && containerRef.current) {
            try {
                window.katex.render(latex, containerRef.current, {
                    throwOnError: false,
                    displayMode: false
                });
            } catch (e) {
                console.error(e);
            }
        }
    }, [isReady, latex]);

    if (latex) {
        return <span ref={containerRef} className="pointer-events-none" />;
    }
    return <span className="pointer-events-none font-sans font-medium">{label}</span>;
};

// --- Helper: Live Input Math Preview with Cursor ---
export const LiveMathPreview = ({ input, cursorPosition, isReady, isDarkMode }) => {
    const containerRef = useRef(null);

    useLayoutEffect(() => {
        if (isReady && window.katex && containerRef.current) {

            const CURSOR_TOKEN = "CURSORMARKER";

            let textWithCursor = input;
            if (cursorPosition !== null && cursorPosition >= 0 && cursorPosition <= input.length) {
                textWithCursor = input.slice(0, cursorPosition) + CURSOR_TOKEN + input.slice(cursorPosition);
            } else {
                textWithCursor = input + CURSOR_TOKEN;
            }

            let latex = textWithCursor
                .replace(/\*/g, '\\times ')
                .replace(/rad/g, '\\mathrm{rad}')
                .replace(/ infinity /g, '\\infty ')
                .replace(/partial/g, '\\partial')
                .replace(/nabla/g, '\\nabla')
                .replace(/oint/g, '\\oint')
                .replace(/iiint/g, '\\iiint')
                .replace(/iint/g, '\\iint')
                .replace(/barx/g, '\\bar{x}')
                .replace(/hatp/g, '\\hat{p}')
                .replace(/chi2/g, '\\chi^2')
                .replace(/vec2/g, '\\begin{pmatrix} \\Box \\\\ \\Box \\end{pmatrix}')
                .replace(/mat2/g, '\\begin{pmatrix} \\Box & \\Box \\\\ \\Box & \\Box \\end{pmatrix}');

            const tokenRegex = "([a-zA-Z0-9_.]+|\\([^)]+\\))";
            const fractionRegex = new RegExp(`${tokenRegex}\\s*\\/\\s*${tokenRegex}`, 'g');
            latex = latex.replace(fractionRegex, '\\frac{$1}{$2}');

            const partialFractionRegex = new RegExp(`${tokenRegex}\\s*\\/`, 'g');
            latex = latex.replace(partialFractionRegex, '\\frac{$1}{}');

            const cursorLatex = `|`;

            latex = latex
                .replace(/\//g, '\\div ')
                .replace(new RegExp(CURSOR_TOKEN, 'g'), cursorLatex);

            const openCount = (latex.match(/\{/g) || []).length;
            const closeCount = (latex.match(/\}/g) || []).length;
            if (openCount > closeCount) {
                latex += '}'.repeat(openCount - closeCount);
            }

            try {
                window.katex.render(latex, containerRef.current, {
                    throwOnError: false,
                    displayMode: true,
                    output: 'html',
                });

                // Dynamic Font Scaling
                const el = containerRef.current;
                el.style.fontSize = ''; // Reset to base size
                el.style.justifyContent = 'center'; // Reset alignment

                // Check overflow
                if (el.scrollWidth > el.clientWidth) {
                    const style = window.getComputedStyle(el);
                    const currentSize = parseFloat(style.fontSize);
                    const ratio = el.clientWidth / el.scrollWidth;

                    // Apply scale with a minimum limit (e.g., 14px)
                    const newSize = Math.max(currentSize * ratio * 0.95, 14); // 0.95 buffer
                    el.style.fontSize = `${newSize}px`;

                    // If scaled down confusingly small, maybe align left? 
                    // But usually center is fine if it fits.
                }

            } catch (e) {
                // Fallback
            }
        }
    }, [input, cursorPosition, isReady, isDarkMode]);

    if (!input) {
        return (
            <div className={`flex items-center justify-center h-full text-lg font-light tracking-wide ${isDarkMode ? 'text-neutral-300' : 'text-neutral-400'}`}>
                <span className={`animate-pulse mr-1 ${isDarkMode ? 'opacity-100' : 'opacity-70'}`}>|</span>
                <span className={isDarkMode ? 'opacity-90' : 'opacity-70'}>Type an equation...</span>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={`w-full h-full flex items-center justify-center overflow-x-auto overflow-y-hidden p-6 text-4xl md:text-5xl tracking-wide ${isDarkMode ? 'text-white' : 'text-black'}`}
        />
    );
};

// --- Helper: Math/Markdown Renderer (Memoized) ---
export const MarkdownRenderer = ({ content, isKatexReady, isDarkMode }) => {
    const renderedContent = useMemo(() => {
        if (!content) return null;

        const correctedContent = content.split('\n').map(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('\\') && !trimmed.startsWith('$')) return `$$ ${trimmed} $$`;
            if (trimmed.includes('=') && !trimmed.match(/[a-zA-Z]{3,}/) && !trimmed.includes('$')) return `$$ ${trimmed} $$`;
            return line;
        }).join('\n');

        const mathBlocks = [];
        const protectedContent = correctedContent.replace(/(\$\$[\s\S]+?\$\$|\$[\s\S]+?\$)/g, (match) => {
            mathBlocks.push(match);
            return `__MATH_BLOCK_${mathBlocks.length - 1}__`;
        });

        const lines = protectedContent.split('\n');

        const renderLineContent = (text) => {
            const parts = text.split(/(__MATH_BLOCK_\d+__)/g);
            return parts.map((part, i) => {
                if (part.startsWith('__MATH_BLOCK_')) {
                    const index = parseInt(part.match(/\d+/)[0]);
                    const block = mathBlocks[index];
                    const isDisplay = block.startsWith('$$');

                    const cleanMath = isDisplay
                        ? block.replace(/^\$\$\s?|\s?\$\$$/g, '')
                        : block.replace(/^\$\s?|\s?\$$/g, '');

                    if (isKatexReady && window.katex) {
                        try {
                            const html = window.katex.renderToString(cleanMath, {
                                throwOnError: false,
                                displayMode: isDisplay
                            });

                            const containerClass = isDisplay
                                ? `block my-2 w-full text-center overflow-x-auto py-4 px-3 rounded-2xl transition-all duration-300 scrollbar-none ${isDarkMode ? 'bg-black border border-white/10' : 'bg-neutral-100'}`
                                : "mx-1 inline-block align-middle font-medium";
                            return <span key={`math-${i}`} dangerouslySetInnerHTML={{ __html: html }} className={containerClass} />;
                        } catch (e) {
                            return <code key={`err-${i}`} className="text-red-500 text-xs">{e.message}</code>;
                        }
                    }
                    return <code key={`raw-${i}`} className="bg-neutral-100 px-1 rounded text-sm text-neutral-500 font-mono">{cleanMath}</code>;
                }

                const textParts = part.split(/(\*\*.*?\*\*)/g);
                return textParts.map((subPart, j) => {
                    if (subPart.startsWith('**') && subPart.endsWith('**')) return <strong key={`bold-${i}-${j}`} className={isDarkMode ? "text-white font-bold tracking-wide" : "text-black font-bold tracking-wide"}>{subPart.slice(2, -2)}</strong>;
                    if (isKatexReady && window.katex && subPart.includes('\\')) {
                        try {
                            const html = window.katex.renderToString(subPart, { throwOnError: true, displayMode: false });
                            return <span key={`orphan-${i}-${j}`} dangerouslySetInnerHTML={{ __html: html }} className="mx-1 inline-block" />;
                        } catch (e) { return <span key={`text-${i}-${j}`}>{subPart}</span>; }
                    }
                    return <span key={`text-${i}-${j}`}>{subPart}</span>;
                });
            });
        };

        const textColor = isDarkMode ? "text-neutral-300" : "text-neutral-700";
        const headerClass = isDarkMode ? "text-white" : "text-black";
        const titleClass = isDarkMode ? "text-green-400" : "text-green-600";

        return (
            <div className={`space-y-2 leading-relaxed text-base font-normal tracking-wide ${textColor}`}>
                {lines.map((line, index) => {
                    if (line.startsWith('### ')) return <h3 key={index} className={`text-lg font-bold mt-6 mb-3 flex items-center gap-2 ${headerClass}`}><span className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-green-500' : 'bg-green-600'}`}></span>{renderLineContent(line.replace('### ', ''))}</h3>;
                    if (line.startsWith('## ')) return <h2 key={index} className={`text-xl font-bold mt-8 mb-4 border-b ${isDarkMode ? 'border-white/10' : 'border-black/5'} pb-2 ${headerClass}`}>{renderLineContent(line.replace('## ', ''))}</h2>;
                    if (line.startsWith('# ')) return <h1 key={index} className={`text-3xl font-black mt-4 mb-6 ${titleClass}`}>{renderLineContent(line.replace('# ', ''))}</h1>;

                    const mathBlockMatch = line.trim().match(/^__MATH_BLOCK_(\d+)__$/);
                    if (mathBlockMatch) {
                        return (
                            <div key={index} className="w-full">
                                {renderLineContent(line)}
                            </div>
                        );
                    }

                    if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
                        return (
                            <div key={index} className={`flex items-start ml-2 group p-2 rounded-lg transition-all duration-300`}>
                                <div className={`mr-4 mt-2 min-w-[6px] h-[6px] rounded-full transition-colors ${isDarkMode ? 'bg-green-500' : 'bg-green-600'}`}></div>
                                <div className="flex-1">{renderLineContent(line.replace(/^[\*\-]\s/, ''))}</div>
                            </div>
                        );
                    }
                    if (line.trim() === '') return <div key={index} className="h-2"></div>;
                    return <p key={index} className={isDarkMode ? "text-neutral-300 font-light" : "text-neutral-700"}>{renderLineContent(line)}</p>;
                })}
            </div>
        );
    }, [content, isKatexReady, isDarkMode]);

    return renderedContent;
};
