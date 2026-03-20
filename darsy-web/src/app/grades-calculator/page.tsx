'use client';

import { useState, useEffect } from 'react';
import { Calculator, Plus, Trash2, ChevronDown, RotateCcw, Save } from 'lucide-react';

const STORAGE_KEY = 'darsy_grades_data';

interface SubjectEntry {
    subject: string;
    coefficient: string;
    numExams: number;
    examGrades: string[];
}

const defaultSubjects = (): SubjectEntry[] => [
    { subject: '', coefficient: '', numExams: 1, examGrades: [''] },
];

function loadSaved(): SubjectEntry[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return defaultSubjects();
}

export default function GradesCalculatorPage() {
    const [subjects, setSubjects] = useState<SubjectEntry[]>(defaultSubjects);
    const [saved, setSaved] = useState(false);
    const [hydrated, setHydrated] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        setSubjects(loadSaved());
        setHydrated(true);
    }, []);

    // Auto-save on every change (debounced)
    useEffect(() => {
        if (!hydrated) return;
        const t = setTimeout(() => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
            setSaved(true);
            setTimeout(() => setSaved(false), 1500);
        }, 600);
        return () => clearTimeout(t);
    }, [subjects, hydrated]);

    const update = (i: number, field: keyof SubjectEntry, value: any) => {
        setSubjects(prev => {
            const next = [...prev];
            next[i] = { ...next[i], [field]: value };
            return next;
        });
    };

    const setNumExams = (i: number, num: number) => {
        setSubjects(prev => {
            const next = [...prev];
            const cur = next[i];
            next[i] = { ...cur, numExams: num, examGrades: Array(num).fill('').map((_, j) => cur.examGrades[j] ?? '') };
            return next;
        });
    };

    const setGrade = (si: number, ei: number, val: string) => {
        setSubjects(prev => {
            const next = [...prev];
            const grades = [...next[si].examGrades];
            grades[ei] = val;
            next[si] = { ...next[si], examGrades: grades };
            return next;
        });
    };

    const addSubject = () =>
        setSubjects(prev => [...prev, { subject: '', coefficient: '', numExams: 1, examGrades: [''] }]);

    const removeSubject = (i: number) =>
        setSubjects(prev => prev.filter((_, j) => j !== i));

    const reset = () => {
        if (!confirm('Reset all grades? This cannot be undone.')) return;
        const fresh = defaultSubjects();
        setSubjects(fresh);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    };

    const getAvg = (s: SubjectEntry): number | null => {
        const valid = s.examGrades.map(g => parseFloat(g)).filter(g => !isNaN(g));
        return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
    };

    const getGPA = (): string => {
        let pts = 0, coeff = 0;
        subjects.forEach(s => {
            const avg = getAvg(s);
            const c = parseFloat(s.coefficient);
            if (avg !== null && !isNaN(c) && c > 0) { pts += avg * c; coeff += c; }
        });
        return coeff > 0 ? (pts / coeff).toFixed(2) : '—';
    };

    const gpa = getGPA();
    const gpaNum = parseFloat(gpa);
    const mention = !isNaN(gpaNum)
        ? gpaNum >= 16 ? { label: 'Très Bien', color: 'text-emerald-600 bg-emerald-50' }
        : gpaNum >= 14 ? { label: 'Bien', color: 'text-blue-600 bg-blue-50' }
        : gpaNum >= 12 ? { label: 'Assez Bien', color: 'text-amber-600 bg-amber-50' }
        : gpaNum >= 10 ? { label: 'Passable', color: 'text-orange-600 bg-orange-50' }
        : { label: 'Insuffisant', color: 'text-red-600 bg-red-50' }
        : null;

    return (
        <main className="min-h-screen bg-gray-50 pt-20 md:pt-28 pb-16">
            <div className="max-w-3xl mx-auto px-4 sm:px-6">

                {/* Header */}
                <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Calculator className="text-green" size={22} />
                            <span className="text-xs font-bold text-green uppercase tracking-widest">Tools</span>
                        </div>
                        <h1 className="text-3xl font-bold text-dark">Grades Calculator</h1>
                        <p className="text-dark/50 text-sm mt-1">Your data saves automatically in your browser.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {saved && (
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-green">
                                <Save size={13} /> Saved
                            </span>
                        )}
                        <button
                            onClick={reset}
                            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-dark/50 hover:bg-gray-100 transition-all"
                        >
                            <RotateCcw size={14} /> Reset
                        </button>
                    </div>
                </div>

                {/* GPA card */}
                <div className="bg-white rounded-3xl border border-green/10 shadow-sm p-6 mb-6 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-dark/40 uppercase tracking-widest mb-1">Your Average (GPA)</p>
                        <p className={`text-6xl font-extrabold ${gpa === '—' ? 'text-dark/15' : 'text-green'}`}>{gpa}</p>
                        <p className="text-dark/30 text-sm mt-1">out of 20</p>
                    </div>
                    {mention && (
                        <div className={`px-4 py-2 rounded-2xl font-bold text-sm ${mention.color}`}>
                            {mention.label}
                        </div>
                    )}
                </div>

                {/* Subjects */}
                <div className="space-y-4 mb-6">
                    {subjects.map((s, si) => {
                        const avg = getAvg(s);
                        return (
                            <div key={si} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4 hover:border-green/20 transition-all">
                                <div className="flex flex-col sm:flex-row gap-3 items-end">
                                    <div className="flex-1 space-y-1.5">
                                        <label className="text-xs font-bold text-dark/40 uppercase ml-1">Subject</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Mathematics"
                                            value={s.subject}
                                            onChange={e => update(si, 'subject', e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 focus:border-green outline-none text-sm font-medium transition-all"
                                        />
                                    </div>
                                    <div className="w-full sm:w-24 space-y-1.5">
                                        <label className="text-xs font-bold text-dark/40 uppercase ml-1">Coeff.</label>
                                        <input
                                            type="number" min="0" placeholder="2"
                                            value={s.coefficient}
                                            onChange={e => update(si, 'coefficient', e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 focus:border-green outline-none text-sm font-bold text-center transition-all"
                                        />
                                    </div>
                                    <div className="w-full sm:w-32 space-y-1.5">
                                        <label className="text-xs font-bold text-dark/40 uppercase ml-1">Exams</label>
                                        <div className="relative">
                                            <select
                                                value={s.numExams}
                                                onChange={e => setNumExams(si, parseInt(e.target.value))}
                                                className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 focus:border-green outline-none text-sm font-bold text-center appearance-none transition-all"
                                            >
                                                {[1, 2, 3, 4, 5, 6].map(n => (
                                                    <option key={n} value={n}>{n} {n > 1 ? 'exams' : 'exam'}</option>
                                                ))}
                                            </select>
                                            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark/30 pointer-events-none" />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeSubject(si)}
                                        disabled={subjects.length === 1}
                                        className="p-2.5 rounded-2xl text-red-400 hover:bg-red-50 transition-all disabled:opacity-20"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                    {Array.from({ length: s.numExams }).map((_, ei) => (
                                        <div key={ei} className="space-y-1">
                                            <label className="text-[10px] font-bold text-dark/30 uppercase ml-1">Exam {ei + 1}</label>
                                            <input
                                                type="number" min="0" max="20" placeholder="—"
                                                value={s.examGrades[ei] ?? ''}
                                                onChange={e => setGrade(si, ei, e.target.value)}
                                                className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:border-green outline-none text-sm font-bold text-center transition-all"
                                            />
                                        </div>
                                    ))}
                                </div>

                                {avg !== null && (
                                    <div className="flex items-center gap-2 text-xs text-dark/40 pt-1 border-t border-gray-50">
                                        <span>Average: <span className="font-black text-green">{avg.toFixed(2)}</span></span>
                                        {s.coefficient && !isNaN(parseFloat(s.coefficient)) && (
                                            <span>× {s.coefficient} = <span className="font-black text-dark">{(avg * parseFloat(s.coefficient)).toFixed(2)} pts</span></span>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <button
                    onClick={addSubject}
                    className="w-full py-4 rounded-3xl border-2 border-dashed border-green/20 text-green font-bold hover:bg-green/5 hover:border-green transition-all flex items-center justify-center gap-2"
                >
                    <Plus size={18} /> Add Subject
                </button>
            </div>
        </main>
    );
}
