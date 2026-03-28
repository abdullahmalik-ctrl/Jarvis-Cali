export const CURRICULUM_TRACKS = ['General', 'Common Core', 'IGCSE', 'SAT'];

export const CURATED_QUESTION_BANK = [
    {
        id: 'alg-eq-001',
        topic: 'Algebra',
        difficulty: 'Easy',
        curriculumTag: 'General',
        question: 'Solve for $x$: $2x + 5 = 17$.',
        options: ['6', '7', '5', '4'],
        correctAnswer: '6',
        explanation: 'Subtract 5 from both sides to get $2x=12$, then divide by 2.',
        quality: { status: 'approved', reviewedBy: 'content-team', reviewedAt: '2026-03-01', version: 1 }
    },
    {
        id: 'alg-func-002',
        topic: 'Algebra',
        difficulty: 'Medium',
        curriculumTag: 'Common Core',
        question: 'If $f(x)=3x-4$, what is $f(6)$?',
        options: ['12', '14', '16', '18'],
        correctAnswer: '14',
        explanation: 'Substitute $x=6$: $3(6)-4=18-4=14$.',
        quality: { status: 'approved', reviewedBy: 'content-team', reviewedAt: '2026-03-01', version: 1 }
    },
    {
        id: 'calc-der-003',
        topic: 'Calculus',
        difficulty: 'Easy',
        curriculumTag: 'SAT',
        question: 'Find $\\frac{d}{dx}(x^3)$.',
        options: ['$3x^2$', '$x^2$', '$3x$', '$x^3$'],
        correctAnswer: '$3x^2$',
        explanation: 'Use the power rule: $\\frac{d}{dx}(x^n)=nx^{n-1}$.',
        quality: { status: 'approved', reviewedBy: 'content-team', reviewedAt: '2026-03-02', version: 1 }
    },
    {
        id: 'calc-int-004',
        topic: 'Calculus',
        difficulty: 'Medium',
        curriculumTag: 'IGCSE',
        question: 'Evaluate $\\int 4x\\,dx$.',
        options: ['$2x^2 + C$', '$4x^2 + C$', '$x^4 + C$', '$2x + C$'],
        correctAnswer: '$2x^2 + C$',
        explanation: 'Integrate term-by-term: $\\int 4x\\,dx = 4\\cdot\\frac{x^2}{2}=2x^2 + C$.',
        quality: { status: 'approved', reviewedBy: 'content-team', reviewedAt: '2026-03-02', version: 1 }
    },
    {
        id: 'geo-tri-005',
        topic: 'Geometry',
        difficulty: 'Easy',
        curriculumTag: 'General',
        question: 'A triangle has base 8 and height 5. What is its area?',
        options: ['20', '40', '13', '26'],
        correctAnswer: '20',
        explanation: 'Area of triangle is $\\frac{1}{2}bh=\\frac{1}{2}(8)(5)=20$.',
        quality: { status: 'approved', reviewedBy: 'content-team', reviewedAt: '2026-03-03', version: 1 }
    },
    {
        id: 'geo-circ-006',
        topic: 'Geometry',
        difficulty: 'Medium',
        curriculumTag: 'Common Core',
        question: 'What is the circumference of a circle with radius 7? Use $\\pi=\\frac{22}{7}$.',
        options: ['44', '49', '22', '154'],
        correctAnswer: '44',
        explanation: 'Circumference is $2\\pi r=2\\cdot\\frac{22}{7}\\cdot 7=44$.',
        quality: { status: 'approved', reviewedBy: 'content-team', reviewedAt: '2026-03-03', version: 1 }
    },
    {
        id: 'tri-id-007',
        topic: 'Trigonometry',
        difficulty: 'Medium',
        curriculumTag: 'IGCSE',
        question: 'If $\\sin \\theta=\\frac{3}{5}$ in a right triangle, what is $\\cos \\theta$?',
        options: ['0.8', '0.6', '0.75', '0.5'],
        correctAnswer: '0.8',
        explanation: 'Opposite is 3 and hypotenuse is 5, so adjacent is 4. Then $\\cos\\theta=\\frac{4}{5}=0.8$.',
        quality: { status: 'approved', reviewedBy: 'content-team', reviewedAt: '2026-03-05', version: 1 }
    },
    {
        id: 'tri-angle-008',
        topic: 'Trigonometry',
        difficulty: 'Easy',
        curriculumTag: 'SAT',
        question: 'What is $\\sin 30^\\circ$?',
        options: ['0.5', '$\\sqrt{3}/2$', '1', '0'],
        correctAnswer: '0.5',
        explanation: '$\\sin 30^\\circ=\\frac{1}{2}$.',
        quality: { status: 'approved', reviewedBy: 'content-team', reviewedAt: '2026-03-05', version: 1 }
    },
    {
        id: 'ari-perc-009',
        topic: 'Arithmetic',
        difficulty: 'Easy',
        curriculumTag: 'General',
        question: 'What is 15% of 200?',
        options: ['30', '20', '15', '40'],
        correctAnswer: '30',
        explanation: '15% of 200 is $0.15\\times 200=30$.',
        quality: { status: 'approved', reviewedBy: 'content-team', reviewedAt: '2026-03-06', version: 1 }
    },
    {
        id: 'ari-ratio-010',
        topic: 'Arithmetic',
        difficulty: 'Medium',
        curriculumTag: 'Common Core',
        question: 'Simplify the ratio $18:24$.',
        options: ['3:4', '2:3', '9:12', '4:3'],
        correctAnswer: '3:4',
        explanation: 'Divide both terms by gcd(18,24)=6.',
        quality: { status: 'approved', reviewedBy: 'content-team', reviewedAt: '2026-03-06', version: 1 }
    },
    {
        id: 'stat-mean-011',
        topic: 'Statistics',
        difficulty: 'Easy',
        curriculumTag: 'IGCSE',
        question: 'Find the mean of 3, 5, 8, 10.',
        options: ['6.5', '6', '7', '26'],
        correctAnswer: '6.5',
        explanation: 'Mean is $(3+5+8+10)/4=26/4=6.5$.',
        quality: { status: 'approved', reviewedBy: 'content-team', reviewedAt: '2026-03-07', version: 1 }
    },
    {
        id: 'stat-prob-012',
        topic: 'Statistics',
        difficulty: 'Medium',
        curriculumTag: 'SAT',
        question: 'A fair die is rolled once. What is the probability of getting a prime number?',
        options: ['$1/2$', '$1/3$', '$2/3$', '$5/6$'],
        correctAnswer: '$1/2$',
        explanation: 'Prime outcomes are 2,3,5. So probability is 3/6 = 1/2.',
        quality: { status: 'approved', reviewedBy: 'content-team', reviewedAt: '2026-03-07', version: 1 }
    }
];
