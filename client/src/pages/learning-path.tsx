import * as React from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
    Brain,
    CheckCircle2,
    ChevronRight,
    Clock,
    Sparkles,
    Target,
    Wand2,
    BookOpen,
    FlaskConical,
    Layout,
    ArrowRight,
    ChevronDown,
    Info,
    Zap,
    MessageSquare,
    History,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

import { useMentorStore, type LearningTask } from "@/store/useMentorStore";

function unslugify(s: string) {
    return s.split('-').map(word => {
        if (word === 'and') return '&';
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
}

export default function LearningPathPage() {
    const [, setLocation] = useLocation();
    const profile = useMentorStore((s) => s.userProfile);
    const plan = useMentorStore((s) => s.learningPlan);
    const serverPath = useMentorStore((s) => s.serverPath);
    const pathLoading = useMentorStore((s) => s.pathLoading);
    const updateTaskStatus = useMentorStore((s) => s.updateTaskStatus);
    const hydrateLearningPathFromServer = useMentorStore((s) => s.hydrateLearningPathFromServer);
    const generatePlan = useMentorStore((s) => s.generatePlan);

    const [expandedWeek, setExpandedWeek] = React.useState<number | null>(1);

    React.useEffect(() => {
        if (!profile) setLocation("/onboarding");
    }, [profile, setLocation]);

    React.useEffect(() => {
        // Hydrate learning path from server on mount
        hydrateLearningPathFromServer();
    }, [hydrateLearningPathFromServer]);


    if (!profile) return null;

    // Show loading state or generate prompt if no plan
    if (pathLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin h-12 w-12 border-4 border-blue-900 border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-slate-600">Loading your learning roadmap...</p>
                </div>
            </div>
        );
    }

    if (!plan || plan.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Card className="p-8 text-center max-w-md">
                    <Layout className="h-12 w-12 text-blue-900 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-900 mb-2">No Learning Path Yet</h2>
                    <p className="text-slate-600 mb-6">Generate a personalized learning roadmap based on your skills and goals.</p>
                    <Button
                        onClick={() => generatePlan()}
                        className="bg-blue-900 text-white hover:bg-blue-800"
                    >
                        Generate My Roadmap
                        <Sparkles className="ml-2 h-4 w-4" />
                    </Button>
                </Card>
            </div>
        );
    }

    const totalTasks = plan.flatMap((w) => w.tasks).length;
    const completedTasks = plan.flatMap((w) => w.tasks).filter((t) => t.status === "completed").length;
    const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-100/50 blur-3xl opacity-50" />
                <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-indigo-100/50 blur-3xl opacity-50" />
            </div>

            <div className="relative mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-8 sm:py-12">
                {/* 1️⃣ Header Section */}
                <header className="mb-12 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-600 shadow-lg shadow-blue-900/20">
                                <Layout className="h-6 w-6 text-white" />
                            </div>
                            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                                Your Learning Roadmap
                            </h1>
                        </div>
                        <p className="max-w-2xl text-lg font-medium text-slate-600 leading-relaxed">
                            This plan adapts <span className="text-blue-900">weekly</span> based on your progress, time, and performance.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Target Career</span>
                            <Badge variant="secondary" className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-900 border-blue-100/50 shadow-sm">
                                <Target className="mr-2 h-4 w-4" />
                                {profile.targetRole}
                            </Badge>
                        </div>
                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Commitment</span>
                            <Badge variant="secondary" className="rounded-xl bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-900 border-indigo-100/50 shadow-sm">
                                <Clock className="mr-2 h-4 w-4" />
                                {profile.timePerWeek} hrs/week
                            </Badge>
                        </div>
                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</span>
                            <Badge variant="secondary" className="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-900 border-emerald-100/50 shadow-sm">
                                <Zap className="mr-2 h-4 w-4" />
                                Foundation Phase
                            </Badge>
                        </div>
                    </div>
                </header>

                {/* 2️⃣ Weekly Timeline View */}
                <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
                    <div className="space-y-8 relative">
                        {/* Timeline Line */}
                        <div className="absolute left-8 top-0 bottom-0 w-px bg-slate-200 hidden sm:block" />

                        <AnimatePresence>
                            {plan.map((weekData, idx) => {
                                const isExpanded = expandedWeek === weekData.week;
                                const weekCompletedCount = weekData.tasks.filter(t => t.status === 'completed').length;
                                const weekProgress = Math.round((weekCompletedCount / weekData.tasks.length) * 100);
                                const isCurrent = weekData.week === 1; // Prototype logic

                                return (
                                    <motion.div
                                        key={weekData.week}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="relative sm:pl-20"
                                    >
                                        {/* Timeline Node */}
                                        <div className={cn(
                                            "absolute left-5 top-8 h-6 w-6 rounded-full border-4 border-white shadow-md z-10 hidden sm:block transition-colors duration-500",
                                            weekProgress === 100 ? "bg-emerald-500" : isCurrent ? "bg-blue-900" : "bg-slate-300"
                                        )} />

                                        <Card className={cn(
                                            "group overflow-hidden rounded-[2.5rem] border-slate-200 bg-white shadow-sm transition-all duration-300",
                                            isExpanded ? "ring-2 ring-blue-900 shadow-2xl" : "hover:shadow-md cursor-pointer"
                                        )}
                                            onClick={() => !isExpanded && setExpandedWeek(weekData.week)}
                                        >
                                            {/* Week Header */}
                                            <div className="p-8 sm:p-10">
                                                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-3">
                                                            <Badge variant="outline" className="rounded-full border-blue-200 bg-blue-50 text-blue-900 font-bold uppercase tracking-widest text-[10px]">
                                                                Week {weekData.week}
                                                            </Badge>
                                                            {isCurrent && (
                                                                <Badge className="bg-blue-900 text-white animate-pulse">
                                                                    Current Focus
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <h2 className="text-2xl font-bold text-slate-900">
                                                            {weekData.focus ? unslugify(weekData.focus) : `Week ${weekData.week} Objectives`}
                                                        </h2>
                                                    </div>

                                                    <div className="flex items-center gap-6">
                                                        <div className="text-right">
                                                            <div className="text-sm font-bold text-slate-900">{weekProgress}%</div>
                                                            <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${weekProgress}%` }}
                                                                    className="h-full bg-emerald-500"
                                                                />
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className={cn("rounded-full transition-transform", isExpanded && "rotate-180")}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setExpandedWeek(isExpanded ? null : weekData.week);
                                                            }}
                                                        >
                                                            <ChevronDown className="h-5 w-5" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Expanded Content */}
                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="mt-10 grid gap-8 md:grid-cols-3">
                                                                {/* 📘 Learning Modules */}
                                                                <div className="space-y-4">
                                                                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900 uppercase tracking-wider">
                                                                        <BookOpen className="h-4 w-4 text-blue-500" />
                                                                        Learning Modules
                                                                    </div>
                                                                    <div className="space-y-3">
                                                                        {weekData.tasks.filter(t => t.type === 'video' || t.type === 'article').map(t => (
                                                                            <TaskCard key={t.id} task={t} onToggle={() => updateTaskStatus(t.id, t.status === 'completed' ? 'not_started' : 'completed')} />
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                {/* 🧪 Practice Tasks */}
                                                                <div className="space-y-4">
                                                                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900 uppercase tracking-wider">
                                                                        <FlaskConical className="h-4 w-4 text-indigo-500" />
                                                                        Practice & Drills
                                                                    </div>
                                                                    <div className="space-y-3">
                                                                        {weekData.tasks.filter(t => t.type === 'quiz').map(t => (
                                                                            <TaskCard key={t.id} task={t} onToggle={() => updateTaskStatus(t.id, t.status === 'completed' ? 'not_started' : 'completed')} />
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                {/* 🛠 Mini-Project */}
                                                                <div className="space-y-4">
                                                                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900 uppercase tracking-wider">
                                                                        <Wand2 className="h-4 w-4 text-emerald-500" />
                                                                        Mini-Project
                                                                    </div>
                                                                    <div className="space-y-3">
                                                                        {weekData.tasks.filter(t => t.type === 'project').map(t => (
                                                                            <TaskCard key={t.id} task={t} isProject onToggle={() => updateTaskStatus(t.id, t.status === 'completed' ? 'not_started' : 'completed')} />
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="mt-12 flex flex-col gap-4 border-t border-slate-100 pt-8 sm:flex-row sm:items-center sm:justify-between">
                                                                <div className="flex items-center gap-4">
                                                                    <Badge variant="outline" className="rounded-full bg-slate-50 border-slate-100 py-1.5 px-3">
                                                                        <Clock className="mr-2 h-3.5 w-3.5 text-slate-400" />
                                                                        Est. {weekData.tasks.reduce((acc, t) => acc + t.estimatedTime, 0)} mins total
                                                                    </Badge>
                                                                    <TooltipProvider>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-widest cursor-help">
                                                                                    <Sparkles className="h-3 w-3" />
                                                                                    Custom Path
                                                                                </div>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent className="bg-slate-900 text-white rounded-xl border-none p-3 shadow-xl">
                                                                                <p className="text-xs font-bold leading-relaxed max-w-[200px]">
                                                                                    Difficulty rebalanced based on your quiz performance.
                                                                                </p>
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    </TooltipProvider>
                                                                </div>

                                                                <div className="flex gap-3">
                                                                    <Button
                                                                        variant="outline"
                                                                        className="rounded-2xl border-slate-200"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setLocation(`/learning/week/${weekData.week}`);
                                                                        }}
                                                                    >
                                                                        View Resources
                                                                    </Button>
                                                                    <Button
                                                                        className="rounded-2xl bg-blue-900 text-white shadow-lg shadow-blue-900/20 hover:bg-blue-800"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setLocation(`/learning/week/${weekData.week}`);
                                                                        }}
                                                                    >
                                                                        Start Week {weekData.week}
                                                                        <ChevronRight className="ml-2 h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    <aside className="space-y-6">
                        {/* AI Assistant Sidebar Card */}
                        <Card className="rounded-[2rem] border-none bg-blue-900 p-8 text-white shadow-2xl shadow-blue-900/20 sticky top-12 overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Brain className="h-24 w-24" />
                            </div>

                            <div className="relative">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/10 p-2 rounded-xl">
                                        <Sparkles className="h-5 w-5 text-blue-300" />
                                    </div>
                                    <h3 className="font-bold text-lg">AI Planning Insights</h3>
                                </div>

                                <div className="mt-8 space-y-6">
                                    <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                                        <p className="text-sm leading-relaxed text-blue-100">
                                            {serverPath?.rationale || "Your path is optimized for career-critical skills and your preferred learning style."}
                                        </p>
                                        <div className="mt-3 text-[10px] font-bold uppercase tracking-widest text-blue-300">
                                            Adaptive Strategy • Updated
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-blue-300">Next Action</h4>
                                        <Button
                                            className="w-full rounded-2xl bg-white text-blue-900 hover:bg-blue-50 font-bold group"
                                            onClick={() => setLocation("/learning/week/1")}
                                        >
                                            Resume Session
                                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </Button>
                                    </div>
                                </div>

                                <Separator className="my-8 bg-white/10" />

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-sm font-medium text-blue-100">
                                        <MessageSquare className="h-4 w-4" />
                                        Have questions about the plan?
                                    </div>
                                    <Button variant="ghost" className="w-full border border-white/10 text-white hover:bg-white/5 rounded-2xl">
                                        Ask AI Mentor
                                    </Button>
                                </div>
                            </div>
                        </Card>

                        <Card className="rounded-[2rem] border-slate-200 bg-white p-8 shadow-sm">
                            <h3 className="font-bold text-slate-900">Progress Overview</h3>
                            <div className="mt-6 space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">Overall Progress</span>
                                    <span className="font-bold text-slate-900">{overallProgress}%</span>
                                </div>
                                <Progress value={overallProgress} className="h-2" />
                                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-2">
                                    <History className="h-3 w-3" />
                                    On Track for {profile.targetRole}
                                </div>
                            </div>
                        </Card>
                    </aside>
                </div>
            </div>

            {/* Mobile Sticky Button */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 sm:hidden w-[calc(100%-2rem)]">
                <Button className="w-full rounded-2xl bg-blue-900 py-6 text-lg font-bold text-white shadow-2xl shadow-blue-900/40">
                    Start Next Task
                    <Zap className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

function TaskCard({ task, isProject, onToggle }: { task: LearningTask; isProject?: boolean; onToggle: () => void }) {
    const isCompleted = task.status === 'completed';

    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                onToggle();
            }}
            className={cn(
                "group relative flex flex-col gap-2 rounded-2xl border p-4 transition-all duration-200 cursor-pointer",
                isCompleted ? "bg-emerald-50/30 border-emerald-100" : "bg-white border-slate-100 hover:border-blue-200 shadow-xs"
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-200" />}
                        <h4 className={cn("text-xs font-bold leading-tight", isCompleted ? "text-slate-500 line-through" : "text-slate-900")}>
                            {task.title}
                        </h4>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400">
                        <span>{task.estimatedTime} min</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span className="capitalize">{task.type}</span>
                    </div>
                </div>
            </div>

            {isProject && (
                <div className="mt-2 space-y-2 border-t border-slate-100 pt-2">
                    <div className="text-[10px] text-slate-500 leading-relaxed italic">
                        "Apply what you learned to a real {task.relatedSkills[0]} scenario."
                    </div>
                    <div className="flex items-center gap-1.5">
                        {task.relatedSkills.map(s => (
                            <Badge key={s} variant="secondary" className="px-1.5 py-0 rounded-md text-[9px] bg-slate-100 text-slate-600 border-none">
                                {unslugify(s)}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function Separator({ className }: { className?: string }) {
    return <div className={cn("h-px w-full", className)} />;
}
