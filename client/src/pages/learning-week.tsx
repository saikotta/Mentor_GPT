import { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft,
    Play,
    CheckCircle2,
    Clock,
    Sparkles,
    Loader2,
    Info,
    Youtube,
    Layout,
    Target,
    Zap,
    ExternalLink,
    Brain,
    Trophy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";
import { getWeekResources, WeekResourcesResponse } from "@/services/mentorApi";
import { useMentorStore } from "@/store/useMentorStore";
import { cn } from "@/lib/utils";

export default function LearningWeekPage() {
    const { weekNumber } = useParams<{ weekNumber: string }>();
    const [tasks, setTasks] = useState<string[]>([]);
    const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
    const [activeVideo, setActiveVideo] = useState<{ url: string, title: string, task: string } | null>(null);
    const userProfile = useMentorStore((s) => s.userProfile);

    useEffect(() => {
        fetchTasks();
    }, [weekNumber]);

    const fetchTasks = async () => {
        try {
            const response = await fetch("/api/learning-path");
            const path = await response.json();
            const weekInt = parseInt(weekNumber);
            const weekData = path.weeks.find((w: any) => w.week === weekInt);
            if (weekData) {
                setTasks(weekData.tasks.map((t: any) => t.title));
            }
        } catch (e) {
            console.error("Failed to fetch tasks", e);
        }
    };

    const { data: resources, isLoading, error } = useQuery<WeekResourcesResponse>({
        queryKey: ["week-resources", weekNumber, tasks],
        queryFn: () => getWeekResources({
            week: parseInt(weekNumber),
            targetRole: userProfile?.targetRole || "Full Stack Engineer",
            skillLevel: userProfile?.experienceLevel || "Intermediate",
            timePerWeek: userProfile?.timePerWeek || 10,
            tasks
        }),
        enabled: tasks.length > 0
    });

    // Set first video as active when resources load
    useEffect(() => {
        if (resources?.resources?.[0]?.videos?.[0] && !activeVideo) {
            const firstRes = resources.resources[0];
            const firstVid = firstRes.videos[0];
            setActiveVideo({
                url: firstVid.url,
                title: firstVid.title,
                task: firstRes.task
            });
        }
    }, [resources]);

    const toggleTask = (taskName: string) => {
        setCompletedTasks(prev => ({
            ...prev,
            [taskName]: !prev[taskName]
        }));
    };

    const progress = tasks.length > 0
        ? (Object.values(completedTasks).filter(Boolean).length / tasks.length) * 100
        : 0;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-900 p-6">
                <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full animate-pulse" />
                    <Loader2 className="w-16 h-16 text-blue-900 animate-spin relative" />
                </div>
                <h2 className="mt-8 text-2xl font-bold tracking-tight">Preparing Your Curriculum</h2>
                <p className="mt-2 text-slate-600">Your mentor is finding the best YouTube resources for Week {weekNumber}...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-100/50 blur-3xl opacity-50" />
                <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-indigo-100/50 blur-3xl opacity-50" />
            </div>

            <div className="relative mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-8 sm:py-12">
                {/* Header Section */}
                <header className="mb-12 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard">
                                <Button variant="ghost" size="icon" className="rounded-xl border-slate-200 bg-white shadow-sm hover:bg-slate-100">
                                    <ChevronLeft className="w-5 h-5" />
                                </Button>
                            </Link>
                            <div className="flex items-center gap-3">
                                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-600 shadow-lg shadow-blue-900/20">
                                    <Layout className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <Badge variant="outline" className="mb-1 rounded-full border-blue-200 bg-blue-50 text-blue-900 font-bold uppercase tracking-widest text-[10px]">
                                        Learning Loop • Week {weekNumber}
                                    </Badge>
                                    <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl uppercase">
                                        Active Learning Session
                                    </h1>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex flex-col gap-2 min-w-[200px]">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                <span>Week Progress</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-2 bg-slate-200" />
                        </div>
                        <Badge variant="secondary" className="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-900 border-emerald-100/50 shadow-sm">
                            <Zap className="mr-2 h-4 w-4" />
                            Live Session
                        </Badge>
                    </div>
                </header>

                <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
                    {/* Main Content: Video & Tasks */}
                    <div className="space-y-8">
                        {/* Video Player Card */}
                        <Card className="overflow-hidden rounded-[2.5rem] border-none bg-white shadow-2xl">
                            <div className="p-8 pb-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="bg-red-50 p-2 rounded-xl">
                                        <Youtube className="w-5 h-5 text-red-600" />
                                    </div>
                                    <h3 className="font-bold text-lg text-slate-900">
                                        {activeVideo?.title || "Select a video to begin"}
                                    </h3>
                                </div>
                                {activeVideo ? (
                                    <YouTubeEmbed
                                        key={activeVideo.url}
                                        url={activeVideo.url}
                                        title={activeVideo.title}
                                    />
                                ) : (
                                    <div className="aspect-video bg-slate-100 rounded-3xl flex items-center justify-center border-2 border-dashed border-slate-200">
                                        <div className="text-center p-8">
                                            <Play className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                            <p className="text-slate-500 font-medium">Select a resource from the task list to start learning</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100">
                                <div className="flex items-start gap-3">
                                    <div className="mt-1 bg-blue-900/10 p-1.5 rounded-lg">
                                        <Info className="w-4 h-4 text-blue-900" />
                                    </div>
                                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                        {activeVideo ? (
                                            <>Designated for task: <span className="text-blue-900 font-bold">{activeVideo.task}</span>. This video covers the core concepts needed to complete this objective.</>
                                        ) : (
                                            "Your AI mentor has prepared specific video resources for each task in this week's plan."
                                        )}
                                    </p>
                                </div>
                            </div>
                        </Card>

                        {/* Task List Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-6 h-6 text-blue-900" />
                                <h2 className="text-2xl font-bold text-slate-900 italic">Curriculum Tasks</h2>
                            </div>

                            <div className="grid gap-4">
                                {tasks.map((task, idx) => {
                                    const taskResource = resources?.resources.find(r => r.task === task);
                                    const isCompleted = completedTasks[task];

                                    return (
                                        <Card
                                            key={idx}
                                            className={cn(
                                                "group overflow-hidden rounded-[2rem] border-slate-100 bg-white transition-all duration-300",
                                                isCompleted ? "opacity-75" : "hover:border-blue-200 hover:shadow-lg"
                                            )}
                                        >
                                            <div className="p-6">
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-4">
                                                        <button
                                                            onClick={() => toggleTask(task)}
                                                            className={cn(
                                                                "flex-shrink-0 w-8 h-8 rounded-xl border-2 transition-all flex items-center justify-center",
                                                                isCompleted
                                                                    ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                                                    : "border-slate-200 bg-white hover:border-blue-900"
                                                            )}
                                                        >
                                                            {isCompleted && <CheckCircle2 className="w-5 h-5" />}
                                                        </button>
                                                        <div>
                                                            <h4 className={cn(
                                                                "font-bold text-slate-900 transition-all",
                                                                isCompleted && "text-slate-400 line-through"
                                                            )}>
                                                                {task}
                                                            </h4>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                {taskResource?.videos && taskResource.videos.length > 0 && (
                                                                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 text-[10px] font-bold rounded-lg px-2 py-0">
                                                                        {taskResource.videos.length} AI Recommended Videos
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Videos for this task */}
                                                {taskResource?.videos && taskResource.videos.length > 0 && (
                                                    <div className="mt-4 pl-12 space-y-2">
                                                        {taskResource.videos.map((vid, vIdx) => (
                                                            <button
                                                                key={vIdx}
                                                                onClick={() => setActiveVideo({ url: vid.url, title: vid.title, task })}
                                                                className={cn(
                                                                    "w-full text-left p-3 rounded-xl border border-slate-50 flex items-center justify-between transition-all group/vid",
                                                                    activeVideo?.url === vid.url ? "bg-slate-50 border-blue-100" : "hover:bg-slate-50"
                                                                )}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className={cn(
                                                                        "p-2 rounded-lg transition-colors",
                                                                        activeVideo?.url === vid.url ? "bg-blue-900 text-white" : "bg-slate-200 text-slate-500 group-hover/vid:bg-blue-100 group-hover/vid:text-blue-900"
                                                                    )}>
                                                                        <Play className="w-3 h-3 fill-current" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs font-bold text-slate-800 line-clamp-1">{vid.title}</p>
                                                                        <p className="text-[10px] text-slate-500">{vid.channel} • {vid.duration}</p>
                                                                    </div>
                                                                </div>
                                                                <ExternalLink className="w-3 h-3 text-slate-300 opacity-0 group-hover/vid:opacity-100 transition-opacity" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <aside className="space-y-6">
                        {/* AI Insights Card */}
                        <Card className="rounded-[2.5rem] border-none bg-blue-900 p-8 text-white shadow-2xl shadow-blue-900/20 sticky top-12 overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Brain className="h-24 w-24" />
                            </div>

                            <div className="relative">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/10 p-2 rounded-xl">
                                        <Sparkles className="h-5 w-5 text-blue-300" />
                                    </div>
                                    <h3 className="font-bold text-lg">AI Session Guide</h3>
                                </div>

                                <div className="mt-8 space-y-6">
                                    <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                                        <p className="text-sm leading-relaxed text-blue-100">
                                            Your mentor has curated these specific videos to minimize context switching. Focus on one task at a time and mark them complete as you go.
                                        </p>
                                        <div className="mt-3 text-[10px] font-bold uppercase tracking-widest text-blue-300">
                                            Efficiency Mode • Active
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-blue-300">Current Goal</h4>
                                        <div className="rounded-2xl bg-white p-5 text-blue-900">
                                            <div className="text-xs font-bold uppercase tracking-wider text-blue-500 mb-1">Target Skill</div>
                                            <div className="font-bold">{userProfile?.targetRole || "Career Excellence"}</div>
                                            <div className="flex items-center gap-2 mt-4 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                                                <Trophy className="h-3 w-3" />
                                                Foundation Week {weekNumber}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Quick Tips */}
                        <Card className="rounded-[2rem] border-slate-200 bg-white p-8 shadow-sm">
                            <h3 className="font-bold text-slate-900 mb-4">Pro Learning Tips</h3>
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="h-2 w-2 rounded-full bg-blue-900 mt-1.5 flex-shrink-0" />
                                    <p className="text-xs text-slate-600 leading-relaxed">Watch at 1.25x speed to maintain focus during technical segments.</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="h-2 w-2 rounded-full bg-blue-900 mt-1.5 flex-shrink-0" />
                                    <p className="text-xs text-slate-600 leading-relaxed">Take notes on key terms like "SIEM" and "Incident Response".</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="h-2 w-2 rounded-full bg-blue-900 mt-1.5 flex-shrink-0" />
                                    <p className="text-xs text-slate-600 leading-relaxed">Try to explain the concept to someone else after watching.</p>
                                </div>
                            </div>
                        </Card>
                    </aside>
                </div>
            </div>
        </div>
    );
}
