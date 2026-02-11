import * as React from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
    Brain,
    CheckCircle2,
    XCircle,
    HelpCircle,
    Clock,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    BookOpen,
    RotateCcw,
    BarChart3,
    Sparkles,
    Info,
    Lightbulb,
    MessageSquare,
    Target,
    FlaskConical,
    Award,
    Loader2,
    AlertCircle,
    TrendingUp,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

import { useMentorStore } from "@/store/useMentorStore";

type AssessmentView = "dashboard" | "active" | "results";

interface ServerQuestion {
    id: string;
    question: string;
    options: string[];
    subTopic: string;
    difficulty: string;
}

interface AvailableAssessment {
    id: string;
    skillId: string;
    title: string;
    type: string;
    difficulty: string;
    questionsCount: number;
    duration: string;
    currentMastery: number;
    currentConfidence: number;
    recommended: boolean;
}

interface AssessmentSession {
    assessmentId: string;
    skillId: string;
    difficulty: string;
    questions: ServerQuestion[];
    startedAt: string;
}

interface QuestionResult {
    questionId: string;
    isCorrect: boolean;
    correctAnswer: number;
    userAnswer: number;
    explanation: string;
    subTopic: string;
}

interface SubTopicAnalysis {
    topic: string;
    correct: number;
    total: number;
    percentage: number;
    status: "mastered" | "developing" | "needs_work";
}

interface AssessmentResult {
    assessmentId: string;
    score: number;
    correctCount: number;
    totalQuestions: number;
    results: QuestionResult[];
    skillUpdate: {
        skillId: string;
        previousMastery: number;
        newMastery: number;
        masteryDelta: number;
        previousConfidence: number;
        newConfidence: number;
        confidenceDelta: number;
        level: string;
    };
    subTopicAnalysis: SubTopicAnalysis[];
    weakAreas: string[];
    strongAreas: string[];
    explanation: string;
    pathAdjusted: boolean;
    nextSteps: { type: string; title: string; skillId: string }[];
    completedAt: string;
}

// Map skill IDs to icons
function getSkillIcon(skillId: string) {
    const icons: Record<string, React.ReactNode> = {
        "sql": <BarChart3 className="h-5 w-5" />,
        "python": <FlaskConical className="h-5 w-5" />,
        "data-modeling": <Brain className="h-5 w-5" />,
        "statistics": <TrendingUp className="h-5 w-5" />,
        "communication": <MessageSquare className="h-5 w-5" />,
        "visualization": <BarChart3 className="h-5 w-5" />
    };
    return icons[skillId] || <Brain className="h-5 w-5" />;
}

export default function AssessmentCenterPage() {
    const [, setLocation] = useLocation();
    const profile = useMentorStore((s) => s.userProfile);
    const hydrateSkillsFromServer = useMentorStore((s) => s.hydrateSkillsFromServer);
    const hydrateLearningPathFromServer = useMentorStore((s) => s.hydrateLearningPathFromServer);

    const [view, setView] = React.useState<AssessmentView>("dashboard");
    const [availableAssessments, setAvailableAssessments] = React.useState<AvailableAssessment[]>([]);
    const [currentSession, setCurrentSession] = React.useState<AssessmentSession | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
    const [selectedOption, setSelectedOption] = React.useState<number | null>(null);
    const [answers, setAnswers] = React.useState<Record<string, number>>({});
    const [assessmentResult, setAssessmentResult] = React.useState<AssessmentResult | null>(null);
    
    const [loading, setLoading] = React.useState(false);
    const [submitting, setSubmitting] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!profile) setLocation("/onboarding");
    }, [profile, setLocation]);

    // Fetch available assessments on mount
    React.useEffect(() => {
        if (profile) {
            fetchAvailableAssessments();
        }
    }, [profile]);

    async function fetchAvailableAssessments() {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/assessments/available", {
                credentials: "include"
            });
            if (!response.ok) throw new Error("Failed to fetch assessments");
            const data = await response.json();
            setAvailableAssessments(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function startAssessment(skillId: string) {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/assessments/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ skillId })
            });
            
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Failed to start assessment");
            }
            
            const session: AssessmentSession = await response.json();
            setCurrentSession(session);
            setCurrentQuestionIndex(0);
            setAnswers({});
            setSelectedOption(null);
            setView("active");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function submitWithAnswers(finalAnswers: Record<string, number>) {
        if (!currentSession) return;
        
        setSubmitting(true);
        setError(null);
        try {
            const response = await fetch(`/api/assessments/${currentSession.assessmentId}/complete`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ answers: finalAnswers })
            });
            
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Failed to submit assessment");
            }
            
            const result: AssessmentResult = await response.json();
            setAssessmentResult(result);
            setView("results");
            
            // Sync skills and learning path from server
            await hydrateSkillsFromServer();
            if (result.pathAdjusted) {
                await hydrateLearningPathFromServer();
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    function handleOptionSelect(optionIndex: number) {
        if (!currentSession) return;
        setSelectedOption(optionIndex);
    }

    function confirmAnswer() {
        if (selectedOption === null || !currentSession) return;
        
        const currentQ = currentSession.questions[currentQuestionIndex];
        const newAnswers = { ...answers, [currentQ.id]: selectedOption };
        setAnswers(newAnswers);
        
        if (currentQuestionIndex < currentSession.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setSelectedOption(null);
        } else {
            // All questions answered, submit
            submitWithAnswers(newAnswers);
        }
    }

    function resetToStartScreen() {
        setView("dashboard");
        setCurrentSession(null);
        setCurrentQuestionIndex(0);
        setSelectedOption(null);
        setAnswers({});
        setAssessmentResult(null);
        fetchAvailableAssessments();
    }

    if (!profile) return null;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
            {/* Background Decor */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-blue-50/50 blur-[120px]" />
                <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-indigo-50/50 blur-[120px]" />
            </div>

            <div className="relative mx-auto w-full max-w-[1200px] px-6 py-10">
                {/* Error Banner */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 flex items-center gap-3"
                    >
                        <AlertCircle className="h-5 w-5 text-rose-600" />
                        <span className="text-sm font-medium text-rose-800">{error}</span>
                        <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">
                            Dismiss
                        </Button>
                    </motion.div>
                )}

                <AnimatePresence mode="wait">
                    {view === "dashboard" && (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-12"
                        >
                            <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-600 shadow-lg shadow-blue-900/20">
                                            <FlaskConical className="h-6 w-6 text-white" />
                                        </div>
                                        <h1 className="text-4xl font-black tracking-tight text-slate-900">Assessment Center</h1>
                                    </div>
                                    <p className="text-lg text-slate-500 font-medium">
                                        Practice, evaluate, and strengthen your skills with real-time feedback.
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    <Badge variant="outline" className="rounded-xl border-blue-100 bg-white px-4 py-2 text-sm font-bold shadow-sm">
                                        <Target className="mr-2 h-4 w-4 text-blue-600" />
                                        {profile.targetRole}
                                    </Badge>
                                </div>
                            </header>

                            {loading ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                    <span className="ml-3 text-slate-500">Loading assessments...</span>
                                </div>
                            ) : (
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {availableAssessments.map((item) => (
                                        <Card key={item.id} className="group overflow-hidden rounded-[2.5rem] border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                                            <div className="flex flex-col h-full space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-900 transition-colors">
                                                        {getSkillIcon(item.skillId)}
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1">
                                                        <Badge variant="outline" className="rounded-full border-slate-100 bg-slate-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                                            {item.difficulty}
                                                        </Badge>
                                                        {item.recommended && (
                                                            <Badge className="rounded-full bg-amber-50 text-amber-700 border-amber-200 text-[9px]">
                                                                Recommended
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.type} • {item.skillId}</p>
                                                </div>

                                                {/* Current Mastery Progress */}
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-slate-500">Current Mastery</span>
                                                        <span className="font-bold text-slate-700">{item.currentMastery}%</span>
                                                    </div>
                                                    <Progress value={item.currentMastery} className="h-1.5" />
                                                </div>

                                                <div className="flex items-center gap-6 text-xs font-semibold text-slate-500">
                                                    <div className="flex items-center gap-1.5">
                                                        <HelpCircle className="h-3.5 w-3.5" />
                                                        {item.questionsCount} Questions
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        {item.duration}
                                                    </div>
                                                </div>

                                                <Button
                                                    className="mt-auto w-full rounded-2xl bg-slate-900 text-white hover:bg-slate-800"
                                                    onClick={() => startAssessment(item.skillId)}
                                                    disabled={loading}
                                                >
                                                    {loading ? (
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            Start Assessment
                                                            <ArrowRight className="ml-2 h-4 w-4" />
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {view === "active" && currentSession && (
                        <motion.div
                            key="active-assessment"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="mx-auto max-w-3xl space-y-8"
                        >
                            <div className="flex items-center justify-between">
                                <Button
                                    variant="ghost"
                                    className="rounded-xl px-0 hover:bg-transparent text-slate-500"
                                    onClick={resetToStartScreen}
                                >
                                    <ChevronLeft className="mr-2 h-4 w-4" />
                                    Quit assessment
                                </Button>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
                                        Question {currentQuestionIndex + 1} of {currentSession.questions.length}
                                    </span>
                                    <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-blue-900"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${((currentQuestionIndex + 1) / currentSession.questions.length) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <Card className="overflow-hidden rounded-[2.5rem] border-slate-200 bg-white shadow-xl">
                                <div className="p-8 sm:p-12">
                                    <div className="space-y-8">
                                        <div className="space-y-3">
                                            <Badge variant="secondary" className="rounded-full bg-blue-50 text-blue-900 border-none px-3 py-1 font-bold text-[10px] uppercase tracking-widest">
                                                {currentSession.questions[currentQuestionIndex].subTopic}
                                            </Badge>
                                            <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                                                {currentSession.questions[currentQuestionIndex].question}
                                            </h2>
                                        </div>

                                        <div className="grid gap-3">
                                            {currentSession.questions[currentQuestionIndex].options.map((option, idx) => {
                                                const isSelected = selectedOption === idx;
                                                let stateStyles = "bg-white border-slate-200 hover:border-blue-900 hover:bg-blue-50/50";
                                                if (isSelected) {
                                                    stateStyles = "bg-blue-900 border-blue-900 text-white shadow-lg shadow-blue-900/20";
                                                }

                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={() => handleOptionSelect(idx)}
                                                        className={cn(
                                                            "flex items-center justify-between gap-4 rounded-2xl border p-5 text-left text-sm font-bold transition-all duration-200",
                                                            stateStyles
                                                        )}
                                                    >
                                                        {option}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-50/50 border-t border-slate-100 p-6 flex justify-end">
                                    <Button
                                        disabled={selectedOption === null || submitting}
                                        className="rounded-2xl bg-blue-900 px-8 py-6 text-lg font-bold shadow-xl shadow-blue-900/20"
                                        onClick={confirmAnswer}
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : currentQuestionIndex === currentSession.questions.length - 1 ? (
                                            "Submit Assessment"
                                        ) : (
                                            <>
                                                Next Question
                                                <ChevronRight className="ml-2 h-5 w-5" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    )}

                    {view === "results" && assessmentResult && (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mx-auto max-w-5xl space-y-12"
                        >
                            <div className="text-center space-y-4">
                                <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-blue-900 shadow-2xl shadow-blue-900/40">
                                    <Award className="h-10 w-10 text-white" />
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-black text-slate-900">Assessment Complete!</h2>
                                    <p className="text-slate-500 font-medium">
                                        You scored <span className="text-blue-900 font-bold">{assessmentResult.score}%</span> on this assessment.
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
                                <div className="space-y-8">
                                    {/* Skill Impact Card */}
                                    <Card className="rounded-[2.5rem] border-none bg-blue-900 p-8 text-white shadow-2xl">
                                        <div className="flex items-center justify-between mb-8">
                                            <div>
                                                <div className="text-[10px] uppercase font-black tracking-widest text-blue-300 mb-1">Impact Analysis</div>
                                                <h3 className="text-xl font-bold">Skill Mastery Update</h3>
                                            </div>
                                            <Sparkles className="h-6 w-6 text-amber-400" />
                                        </div>

                                        <div className="space-y-8">
                                            <div>
                                                <div className="flex justify-between text-sm font-bold mb-3">
                                                    <span className="text-blue-100">{assessmentResult.skillUpdate.skillId} Mastery</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-blue-300 line-through text-xs">{assessmentResult.skillUpdate.previousMastery}%</span>
                                                        <span>{assessmentResult.skillUpdate.newMastery}%</span>
                                                        <Badge className={cn(
                                                            "border-none text-[10px]",
                                                            assessmentResult.skillUpdate.masteryDelta >= 0 
                                                                ? "bg-emerald-500/20 text-emerald-400" 
                                                                : "bg-rose-500/20 text-rose-400"
                                                        )}>
                                                            {assessmentResult.skillUpdate.masteryDelta >= 0 ? "+" : ""}{assessmentResult.skillUpdate.masteryDelta}% 
                                                            {assessmentResult.skillUpdate.masteryDelta >= 0 ? " Growth" : " Adjusted"}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="absolute inset-y-0 left-0 bg-blue-300/30"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${assessmentResult.skillUpdate.previousMastery}%` }}
                                                        transition={{ duration: 0.5 }}
                                                    />
                                                    <motion.div
                                                        className="absolute inset-y-0 left-0 bg-white"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${assessmentResult.skillUpdate.newMastery}%` }}
                                                        transition={{ duration: 1, delay: 0.5 }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="rounded-2xl bg-white/5 border border-white/10 p-5 flex items-start gap-4">
                                                <div className="bg-white/10 p-2 rounded-xl">
                                                    <Lightbulb className="h-5 w-5 text-amber-300" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-bold uppercase tracking-wider text-blue-300">AI Adaptation</p>
                                                    <p className="text-sm leading-relaxed text-blue-50">
                                                        {assessmentResult.explanation}
                                                    </p>
                                                    {assessmentResult.pathAdjusted && (
                                                        <Badge className="mt-2 bg-amber-500/20 text-amber-300 border-none text-[10px]">
                                                            Learning Path Updated
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Card>

                                    {/* Sub-topic Analysis */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                                            <BarChart3 className="h-4 w-4" />
                                            Sub-Topic Performance
                                        </div>
                                        <div className="grid gap-3">
                                            {assessmentResult.subTopicAnalysis.map((topic, i) => (
                                                <Card key={i} className="rounded-2xl border-slate-100 bg-white p-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm font-bold text-slate-900">{topic.topic}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-slate-500">{topic.correct}/{topic.total}</span>
                                                            <Badge className={cn(
                                                                "text-[10px]",
                                                                topic.status === "mastered" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                                                topic.status === "developing" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                                                "bg-rose-50 text-rose-700 border-rose-200"
                                                            )}>
                                                                {topic.status === "mastered" ? "Mastered" : 
                                                                 topic.status === "developing" ? "Developing" : "Needs Work"}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <Progress 
                                                        value={topic.percentage} 
                                                        className={cn(
                                                            "h-1.5",
                                                            topic.status === "mastered" ? "[&>div]:bg-emerald-500" :
                                                            topic.status === "developing" ? "[&>div]:bg-amber-500" :
                                                            "[&>div]:bg-rose-500"
                                                        )} 
                                                    />
                                                </Card>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Mistake Review */}
                                    {assessmentResult.results.filter(r => !r.isCorrect).length > 0 && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                                                <XCircle className="h-4 w-4" />
                                                Review Mistakes
                                            </div>
                                            <div className="space-y-3">
                                                {assessmentResult.results.filter(r => !r.isCorrect).map((result, i) => (
                                                    <Card key={i} className="rounded-3xl border-slate-100 bg-white p-5">
                                                        <div className="flex gap-4">
                                                            <div className="h-8 w-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                                                                <RotateCcw className="h-4 w-4" />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div className="text-xs font-black uppercase text-slate-400">{result.subTopic}</div>
                                                                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                                                    {result.explanation}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {assessmentResult.results.filter(r => !r.isCorrect).length === 0 && (
                                        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/50 p-8 text-center space-y-2">
                                            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                                            <h4 className="font-bold text-emerald-900">Perfect Score!</h4>
                                            <p className="text-xs text-emerald-700">Outstanding performance. You've demonstrated mastery of all topics.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    <aside className="space-y-6 sticky top-12">
                                        <Card className="rounded-[2.5rem] border-slate-200 bg-white p-8 shadow-sm">
                                            <div className="space-y-8">
                                                <div className="space-y-2">
                                                    <h4 className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400">Next Recommended Actions</h4>
                                                    <h3 className="text-xl font-bold text-slate-900">
                                                        {assessmentResult.weakAreas.length > 0 ? "Strengthen these areas" : "Keep progressing"}
                                                    </h3>
                                                </div>

                                                <div className="space-y-3">
                                                    {assessmentResult.weakAreas.map((area, i) => (
                                                        <Button key={i} className="w-full justify-between h-auto py-5 px-6 rounded-2xl bg-white border border-slate-100 hover:border-blue-300 group transition-all">
                                                            <div className="flex items-center gap-4 text-left">
                                                                <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-blue-900 group-hover:text-white transition-colors">
                                                                    <BookOpen className="h-5 w-5" />
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-bold text-slate-900">Review: {area}</div>
                                                                    <div className="text-[10px] text-slate-400 font-bold uppercase">Needs practice</div>
                                                                </div>
                                                            </div>
                                                            <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-blue-900 group-hover:translate-x-1 transition-all" />
                                                        </Button>
                                                    ))}

                                                    {assessmentResult.strongAreas.map((area, i) => (
                                                        <Button key={i} className="w-full justify-between h-auto py-5 px-6 rounded-2xl bg-white border border-slate-100 hover:border-emerald-300 group transition-all">
                                                            <div className="flex items-center gap-4 text-left">
                                                                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                                                    <CheckCircle2 className="h-5 w-5" />
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-bold text-slate-900">{area}</div>
                                                                    <div className="text-[10px] text-emerald-600 font-bold uppercase">Mastered</div>
                                                                </div>
                                                            </div>
                                                        </Button>
                                                    ))}
                                                </div>

                                                <Separator className="bg-slate-100" />

                                                <div className="flex flex-col gap-3">
                                                    <Button className="rounded-2xl h-12 bg-blue-900 text-white font-bold" onClick={() => setLocation("/dashboard")}>
                                                        Return to Dashboard
                                                    </Button>
                                                    <Button variant="ghost" className="rounded-2xl h-12 text-blue-900 font-bold hover:bg-blue-50" onClick={resetToStartScreen}>
                                                        Take Another Assessment
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>

                                        <Card className="rounded-[2.5rem] border-none bg-slate-900 p-8 text-white">
                                            <div className="flex items-center gap-3 mb-6">
                                                <MessageSquare className="h-6 w-6 text-blue-400" />
                                                <h4 className="font-bold">AI Coach Analysis</h4>
                                            </div>
                                            <p className="text-sm text-slate-300 leading-relaxed italic mb-6">
                                                {assessmentResult.score >= 80 
                                                    ? `Excellent work! Your performance shows strong ${assessmentResult.skillUpdate.skillId} fundamentals. You're ready to tackle more advanced topics.`
                                                    : assessmentResult.score >= 60
                                                    ? `Good progress! You've demonstrated solid understanding of ${assessmentResult.strongAreas.join(", ") || "key concepts"}. Focus on ${assessmentResult.weakAreas.join(", ") || "continued practice"} to reach mastery.`
                                                    : `Keep going! ${assessmentResult.skillUpdate.skillId} takes time to master. Review the explanations above and try the recommended resources before your next attempt.`
                                                }
                                            </p>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                                    <Sparkles className="h-5 w-5 text-blue-400" />
                                                </div>
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-blue-400">
                                                    Personalized Analysis
                                                </div>
                                            </div>
                                        </Card>
                                    </aside>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
