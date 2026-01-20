export const MODEL_NAME = "gemini-2.5-flash-preview-09-2025";

export const withDelete = (arr) => {
    return [...arr, { label: '⌫', type: 'action', action: 'delete', category: 'warning' }];
};

export const MATHTYPE_DATA = {
    '123': [
        { label: 'AC', type: 'action', action: 'clear', category: 'danger' }, { latex: '(', value: '(', category: 'function' }, { latex: ')', value: ')', category: 'function' }, { latex: '\\div', value: '/', category: 'operator' }, { label: '⌫', type: 'action', action: 'delete', category: 'warning' },
        { label: '7', value: '7', category: 'number' }, { label: '8', value: '8', category: 'number' }, { label: '9', value: '9', category: 'number' }, { latex: '\\times', value: '*', category: 'operator' }, { latex: 'x^2', value: '^2', category: 'function' },
        { label: '4', value: '4', category: 'number' }, { label: '5', value: '5', category: 'number' }, { label: '6', value: '6', category: 'number' }, { latex: '-', value: '-', category: 'operator' }, { latex: '\\sqrt{x}', value: 'sqrt(', category: 'function' },
        { label: '1', value: '1', category: 'number' }, { label: '2', value: '2', category: 'number' }, { label: '3', value: '3', category: 'number' }, { latex: '+', value: '+', category: 'operator' }, { latex: '\\pi', value: 'pi', category: 'function' },
        { label: '0', value: '0', category: 'number' }, { label: '.', value: '.', category: 'number' }, { latex: '=', value: '=', category: 'submit' }, { latex: '\\%', value: '%', category: 'function' }, { latex: '!', value: '!', category: 'function' }
    ],
    'ABC': withDelete([
        { latex: 'a', value: 'a', category: 'base' }, { latex: 'b', value: 'b', category: 'base' }, { latex: 'c', value: 'c', category: 'base' }, { latex: 'd', value: 'd', category: 'base' }, { latex: 'e', value: 'e', category: 'base' },
        { latex: 'f', value: 'f', category: 'base' }, { latex: 'g', value: 'g', category: 'base' }, { latex: 'h', value: 'h', category: 'base' }, { latex: 'i', value: 'i', category: 'base' }, { latex: 'j', value: 'j', category: 'base' },
        { latex: 'k', value: 'k', category: 'base' }, { latex: 'l', value: 'l', category: 'base' }, { latex: 'm', value: 'm', category: 'base' }, { latex: 'n', value: 'n', category: 'base' }, { latex: 'o', value: 'o', category: 'base' },
        { latex: 'p', value: 'p', category: 'base' }, { latex: 'q', value: 'q', category: 'base' }, { latex: 'r', value: 'r', category: 'base' }, { latex: 's', value: 's', category: 'base' }, { latex: 't', value: 't', category: 'base' },
        { latex: 'u', value: 'u', category: 'base' }, { latex: 'v', value: 'v', category: 'base' }, { latex: 'w', value: 'w', category: 'base' }, { latex: 'x', value: 'x', category: 'base' }, { latex: 'y', value: 'y', category: 'base' },
        { latex: 'z', value: 'z', category: 'base' }, { latex: 'A', value: 'A', category: 'base' }, { latex: 'B', value: 'B', category: 'base' }, { latex: 'C', value: 'C', category: 'base' }, { latex: 'X', value: 'X', category: 'base' },
        { latex: 'Y', value: 'Y', category: 'base' }, { latex: 'Z', value: 'Z', category: 'base' }, { latex: ',', value: ',', category: 'base' }, { latex: '.', value: '.', category: 'base' }, { latex: '?', value: '?', category: 'base' }
    ]),
    Algebra: withDelete([
        { latex: '\\frac{\\Box}{\\Box}', value: '/', category: 'operator' }, { latex: '\\sqrt{x}', value: 'sqrt(', category: 'function' }, { latex: '\\sqrt[n]{x}', value: 'nrt', category: 'function' }, { latex: 'x^2', value: '^2', category: 'function' }, { latex: 'x^y', value: '^', category: 'operator' },
        { latex: '|x|', value: '|', category: 'function' }, { latex: 'a', value: 'a', category: 'base' }, { latex: 'b', value: 'b', category: 'base' }, { latex: 'c', value: 'c', category: 'base' }, { latex: '\\pi', value: 'π', category: 'base' },
        { latex: '\\neq', value: '≠', category: 'operator' }, { latex: '\\approx', value: '≈', category: 'operator' }, { latex: '\\pm', value: '±', category: 'operator' }, { latex: '\\mp', value: '∓', category: 'operator' }, { latex: '\\infty', value: '∞', category: 'base' },
        { latex: '<', value: '<', category: 'operator' }, { latex: '>', value: '>', category: 'operator' }, { latex: '\\le', value: '≤', category: 'operator' }, { latex: '\\ge', value: '≥', category: 'operator' }, { latex: '\\propto', value: '∝', category: 'operator' },
        { latex: '[', value: '[', category: 'base' }, { latex: ']', value: ']', category: 'base' }, { latex: '\\{', value: '{', category: 'base' }, { latex: '\\}', value: '}', category: 'base' }, { latex: '!', value: '!', category: 'base' }
    ]),
    Calculus: withDelete([
        { latex: '\\frac{dy}{dx}', value: 'dy/dx', category: 'function' }, { latex: '\\frac{d}{dx}', value: 'diff', category: 'function' }, { latex: '\\int', value: '∫', category: 'function' }, { latex: '\\int_{a}^{b}', value: 'defint', category: 'function' }, { latex: '\\sum', value: '∑', category: 'function' },
        { latex: '\\prod', value: '∏', category: 'function' }, { latex: '\\lim', value: 'lim', category: 'function' }, { latex: '\\lim_{x\\to0}', value: 'lim0', category: 'function' }, { latex: '\\frac{\\partial}{\\partial x}', value: 'partial', category: 'function' }, { latex: '\\nabla', value: '∇', category: 'function' },
        { latex: '\\Delta', value: 'Δ', category: 'base' }, { latex: 'dx', value: 'dx', category: 'base' }, { latex: 'dt', value: 'dt', category: 'base' }, { latex: 'f(x)', value: 'f(x)', category: 'base' }, { latex: 'g(x)', value: 'g(x)', category: 'base' },
        { latex: '\\oint', value: 'oint', category: 'function' }, { latex: '\\iint', value: 'iint', category: 'function' }, { latex: '\\iiint', value: 'iiint', category: 'function' }, { latex: '\\prime', value: "'", category: 'base' }, { latex: '\\infty', value: '∞', category: 'base' }
    ]),
    Trig: withDelete([
        { latex: '\\sin', value: 'sin(', category: 'function' }, { latex: '\\cos', value: 'cos(', category: 'function' }, { latex: '\\tan', value: 'tan(', category: 'function' }, { latex: '\\csc', value: 'csc(', category: 'function' }, { latex: '\\sec', value: 'sec(', category: 'function' }, { latex: '\\cot', value: 'cot(', category: 'function' },
        { latex: '\\sin^{-1}', value: 'asin(', category: 'function' }, { latex: '\\cos^{-1}', value: 'acos(', category: 'function' }, { latex: '\\tan^{-1}', value: 'atan(', category: 'function' }, { latex: '\\theta', value: 'θ', category: 'base' }, { latex: '\\phi', value: 'φ', category: 'base' }, { latex: '^\\circ', value: '°', category: 'base' },
        { latex: '\\sinh', value: 'sinh(', category: 'function' }, { latex: '\\cosh', value: 'cosh(', category: 'function' }, { latex: '\\tanh', value: 'tanh(', category: 'function' }, { latex: '\\pi', value: 'π', category: 'base' }
    ]),
    Geometry: withDelete([
        { latex: '\\angle', value: 'angle', category: 'function' }, { latex: '\\triangle', value: 'triangle', category: 'base' }, { latex: '\\perp', value: 'perp', category: 'operator' }, { latex: '\\parallel', value: 'parallel', category: 'operator' }, { latex: '\\cong', value: 'cong', category: 'operator' },
        { latex: '\\sim', value: 'sim', category: 'operator' }, { latex: '\\vec{v}', value: 'vec', category: 'base' }, { latex: '\\overline{AB}', value: 'bar', category: 'base' }, { latex: '\\deg', value: 'deg', category: 'base' }, { latex: '\\mathrm{rad}', value: 'rad', category: 'base' },
        { latex: '\\alpha', value: 'α', category: 'base' }, { latex: '\\beta', value: 'β', category: 'base' }, { latex: '\\gamma', value: 'γ', category: 'base' }, { latex: '\\pi', value: 'π', category: 'base' }, { latex: 'r', value: 'r', category: 'base' }
    ]),
    Stats: withDelete([
        { latex: '\\bar{x}', value: 'barx', category: 'base' }, { latex: '\\mu', value: 'μ', category: 'base' }, { latex: '\\sigma', value: 'σ', category: 'base' }, { latex: '\\Sigma', value: 'Σ', category: 'base' }, { latex: 'P(A)', value: 'P(A)', category: 'function' },
        { latex: 'n!', value: '!', category: 'operator' }, { latex: '\\binom{n}{k}', value: 'binom', category: 'function' }, { latex: 'E[X]', value: 'E[X]', category: 'function' }, { latex: '\\hat{p}', value: 'hatp', category: 'base' }, { latex: '\\chi^2', value: 'chi2', category: 'base' }
    ]),
    Greek: withDelete([
        { latex: '\\alpha', value: 'α', category: 'base' }, { latex: '\\beta', value: 'β', category: 'base' }, { latex: '\\gamma', value: 'γ', category: 'base' }, { latex: '\\delta', value: 'δ', category: 'base' }, { latex: '\\epsilon', value: 'ε', category: 'base' },
        { latex: '\\zeta', value: 'ζ', category: 'base' }, { latex: '\\eta', value: 'η', category: 'base' }, { latex: '\\theta', value: 'θ', category: 'base' }, { latex: '\\lambda', value: 'λ', category: 'base' }, { latex: '\\mu', value: 'μ', category: 'base' },
        { latex: '\\rho', value: 'ρ', category: 'base' }, { latex: '\\sigma', value: 'σ', category: 'base' }, { latex: '\\tau', value: 'τ', category: 'base' }, { latex: '\\phi', value: 'φ', category: 'base' }, { latex: '\\omega', value: 'ω', category: 'base' },
        { latex: '\\Gamma', value: 'Γ', category: 'base' }, { latex: '\\Delta', value: 'Δ', category: 'base' }, { latex: '\\Theta', value: 'Θ', category: 'base' }, { latex: '\\Lambda', value: 'Λ', category: 'base' }, { latex: '\\Sigma', value: 'Σ', category: 'base' }, { latex: '\\Omega', value: 'Ω', category: 'base' }
    ]),
    SetLogic: withDelete([
        { latex: '\\in', value: '∈', category: 'operator' }, { latex: '\\notin', value: '∉', category: 'operator' }, { latex: '\\subset', value: '⊂', category: 'operator' }, { latex: '\\subseteq', value: '⊆', category: 'operator' }, { latex: '\\cup', value: '∪', category: 'operator' },
        { latex: '\\cap', value: '∩', category: 'operator' }, { latex: '\\emptyset', value: '∅', category: 'base' }, { latex: '\\forall', value: '∀', category: 'base' }, { latex: '\\exists', value: '∃', category: 'base' }, { latex: '\\nexists', value: '∄', category: 'base' },
        { latex: '\\therefore', value: '∴', category: 'operator' }, { latex: '\\because', value: '∵', category: 'operator' }, { latex: '\\neg', value: '¬', category: 'operator' }, { latex: '\\implies', value: '⇒', category: 'operator' }, { latex: '\\iff', value: '⇔', category: 'operator' }
    ]),
    Matrix: withDelete([
        { latex: '\\begin{pmatrix}\\Box\\\\\\Box\\end{pmatrix}', value: 'vec2', category: 'function' }, { latex: '\\begin{pmatrix}\\Box&\\Box\\\\\\Box&\\Box\\end{pmatrix}', value: 'mat2', category: 'function' },
        { latex: '\\rightarrow', value: '→', category: 'base' }, { latex: '\\leftarrow', value: '←', category: 'base' }, { latex: '\\uparrow', value: '↑', category: 'base' }, { latex: '\\downarrow', value: '↓', category: 'base' },
        { latex: '\\mathbb{R}', value: 'R_set', category: 'base' }, { latex: '\\mathbb{Z}', value: 'Z_set', category: 'base' }, { latex: '\\mathbb{N}', value: 'N_set', category: 'base' }, { latex: '\\mathbb{Q}', value: 'Q_set', category: 'base' }
    ])
};

export const UNIT_DATA = {
    Area: {
        units: ['Acres', 'Ares', 'Hectares', 'Square meters', 'Square feet', 'Square inches'],
        ratios: { 'Acres': 4046.86, 'Ares': 100, 'Hectares': 10000, 'Square meters': 1, 'Square feet': 0.092903, 'Square inches': 0.00064516 }
    },
    Length: {
        units: ['Meters', 'Kilometers', 'Centimeters', 'Millimeters', 'Inches', 'Feet', 'Yards', 'Miles'],
        ratios: { 'Meters': 1, 'Kilometers': 1000, 'Centimeters': 0.01, 'Millimeters': 0.001, 'Inches': 0.0254, 'Feet': 0.3048, 'Yards': 0.9144, 'Miles': 1609.34 }
    },
    Temperature: {
        units: ['Celsius', 'Fahrenheit', 'Kelvin'],
        isComplex: true // Requires formulas
    },
    Volume: {
        units: ['Liters', 'Milliliters', 'Gallons (US)', 'Cups (US)', 'Fluid Ounces (US)', 'Cubic meters'],
        ratios: { 'Liters': 1, 'Milliliters': 0.001, 'Gallons (US)': 3.78541, 'Cups (US)': 0.236588, 'Fluid Ounces (US)': 0.0295735, 'Cubic meters': 1000 }
    },
    Mass: {
        units: ['Kilograms', 'Grams', 'Milligrams', 'Pounds', 'Ounces', 'Tons'],
        ratios: { 'Kilograms': 1, 'Grams': 0.001, 'Milligrams': 0.000001, 'Pounds': 0.453592, 'Ounces': 0.0283495, 'Tons': 1000 }
    },
    Data: {
        units: ['Bytes', 'Kilobytes', 'Megabytes', 'Gigabytes', 'Terabytes', 'Petabytes'],
        ratios: { 'Bytes': 1, 'Kilobytes': 1024, 'Megabytes': 1048576, 'Gigabytes': 1073741824, 'Terabytes': 1099511627776, 'Petabytes': 1125899906842624 }
    },
    Speed: {
        units: ['Meters/second', 'Kilometers/hour', 'Miles/hour', 'Knots'],
        ratios: { 'Meters/second': 1, 'Kilometers/hour': 0.277778, 'Miles/hour': 0.44704, 'Knots': 0.514444 }
    },
    Time: {
        units: ['Milliseconds', 'Seconds', 'Minutes', 'Hours', 'Days', 'Weeks'],
        ratios: { 'Milliseconds': 0.001, 'Seconds': 1, 'Minutes': 60, 'Hours': 3600, 'Days': 86400, 'Weeks': 604800 }
    }
};
