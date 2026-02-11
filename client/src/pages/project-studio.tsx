import * as React from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
    Briefcase,
    Target,
    Wand2,
    Clock,
    ArrowRight,
    ChevronRight,
    CheckCircle2,
    Upload,
    Link2,
    FileCode,
    Sparkles,
    Info,
    ChevronLeft,
    Layout,
    Star,
    Zap,
    Award,
    Terminal,
    BarChart3,
    MessageSquare,
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useMentorStore } from "@/store/useMentorStore";

type ProjectView = "list" | "brief" | "submission" | "feedback";

interface RubricItem {
    skill: string;
    weight: number;
    criteria: string;
    currentMastery?: number;
    currentConfidence?: number;
}

interface ProjectBrief {
    id: string;
    title: string;
    scenario: string;
    problemStatement: string;
    stakeholder: string;
    objectives: string[];
    constraints: string[];
    deliverables: string[];
    skills: string[];
    difficulty: "Beginner" | "Intermediate" | "Advanced";
    estimatedTime: string;
    rubric: RubricItem[];
    resumeBullet: string;
    readinessScore?: number;
    recommended?: boolean;
    status?: string;
}

interface RubricBreakdown {
    skill: string;
    score: number;
    weight: number;
    feedback: string;
}

interface SkillUpdate {
    skillId: string;
    previousMastery: number;
    newMastery: number;
    masteryDelta: number;
    previousConfidence: number;
    newConfidence: number;
    confidenceDelta: number;
    level: string;
}

interface EvaluationResult {
    submissionId: string;
    projectId: string;
    overallScore: number;
    rubricBreakdown: RubricBreakdown[];
    skillUpdates: SkillUpdate[];
    strengths: string[];
    improvements: string[];
    suggestions: string[];
    explanation: string;
    resumeBullet: string;
    pathAdjusted: boolean;
    evaluatedAt: string;
}

export default function ProjectStudioPage() {
    const [, setLocation] = useLocation();
    const profile = useMentorStore((s) => s.userProfile);
    const hydrateSkillsFromServer = useMentorStore((s) => s.hydrateSkillsFromServer);
    const hydrateLearningPathFromServer = useMentorStore((s) => s.hydrateLearningPathFromServer);

    const [view, setView] = React.useState<ProjectView>("list");
    const [availableProjects, setAvailableProjects] = React.useState<ProjectBrief[]>([]);
    const [selectedProject, setSelectedProject] = React.useState<ProjectBrief | null>(null);
    const [submissionId, setSubmissionId] = React.useState<string | null>(null);
    const [evaluationResult, setEvaluationResult] = React.useState<EvaluationResult | null>(null);
    
    const [code, setCode] = React.useState("");
    const [link, setLink] = React.useState("");
    const [notes, setNotes] = React.useState("");
    const [timeSpent, setTimeSpent] = React.useState("");
    
    const [loading, setLoading] = React.useState(false);
    const [submitting, setSubmitting] = React.useState(false);
    const [evaluating, setEvaluating] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!profile) setLocation("/onboarding");
    }, [profile, setLocation]);

    // Fetch available projects on mount
    React.useEffect(() => {
        if (profile) {
            fetchAvailableProjects();
        }
    }, [profile]);

    async function fetchAvailableProjects() {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/projects/available", {
                credentials: "include"
            });
            if (!response.ok) throw new Error("Failed to fetch projects");
            const data = await response.json();
            setAvailableProjects(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function fetchProjectBrief(projectId: string) {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/projects/${projectId}/brief`, {
                credentials: "include"
            });
            if (!response.ok) throw new Error("Failed to fetch project brief");
            const data = await response.json();
            setSelectedProject(data);
            setView("brief");
            window.scrollTo(0, 0);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function submitProject() {
        if (!selectedProject || (!code && !link)) {
            setError("Please provide your code or a link to your work");
            return;
        }
        
        setSubmitting(true);
        setError(null);
        try {
            const response = await fetch(`/api/projects/${selectedProject.id}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    code,
                    link,
                    notes,
                    timeSpent: timeSpent ? parseInt(timeSpent) : undefined
                })
            });
            
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Failed to submit project");
            }
            
            const result = await response.json();
            setSubmissionId(result.submissionId);
            
            // Now trigger evaluation
            await evaluateSubmission(result.submissionId);
        } catch (err: any) {
            setError(err.message);
            setSubmitting(false);
        }
    }

    async function evaluateSubmission(subId: string) {
        setEvaluating(true);
        try {
            const response = await fetch(`/api/submissions/${subId}/evaluate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include"
            });
            
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Failed to evaluate submission");
            }
            
            const result: EvaluationResult = await response.json();
            setEvaluationResult(result);
            setView("feedback");
            window.scrollTo(0, 0);
            
            // Sync skills and learning path from server
            await hydrateSkillsFromServer();
            if (result.pathAdjusted) {
                await hydrateLearningPathFromServer();
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setEvaluating(false);
            setSubmitting(false);
        }
    }

    function resetToList() {
        setView("list");
        setSelectedProject(null);
        setSubmissionId(null);
        setEvaluationResult(null);
        setCode("");
        setLink("");
        setNotes("");
        setTimeSpent("");
        fetchAvailableProjects();
    }

    if (!profile) return null;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
            {/* Background Decor */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-blue-50/50 blur-[120px]" />
                <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-indigo-50/50 blur-[120px]" />
            </div>

            <div className="relative mx-auto w-full max-w-[1400px] px-6 py-10">
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

                {/* Header Section */}
                <header className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-600 shadow-lg shadow-blue-900/20">
                                <Terminal className="h-6 w-6 text-white" />
                            </div>
                            <h1 className="text-4xl font-black tracking-tight text-slate-900">Project Studio</h1>
                        </div>
                        <p className="text-lg text-slate-500 font-medium">
                            Build real-world projects tailored to your skills and career goals.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Badge variant="outline" className="rounded-xl border-blue-100 bg-white px-4 py-2 text-sm font-bold shadow-sm">
                            <Briefcase className="mr-2 h-4 w-4 text-blue-600" />
                            {profile.targetRole}
                        </Badge>
                        <Badge variant="outline" className="rounded-xl border-indigo-100 bg-white px-4 py-2 text-sm font-bold shadow-sm">
                            <Award className="mr-2 h-4 w-4 text-indigo-600" />
                            Skill Reinforcement
                        </Badge>
                    </div>
                </header>

                <AnimatePresence mode="wait">
                    {view === "list" && (
                        <motion.div
                            key="list-view"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                    <span className="ml-3 text-slate-500">Loading projects...</span>
                                </div>
                            ) : (
                                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-2">
                                    {availableProjects.map((project) => (
                                        <ProjectCard
                                            key={project.id}
                                            project={project}
                                            onView={() => fetchProjectBrief(project.id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {view === "brief" && selectedProject && (
                        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
                            <motion.div
                                key="brief-view"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-8"
                            >
                                <Button
                                    variant="ghost"
                                    className="rounded-xl px-0 hover:bg-transparent text-slate-500 hover:text-slate-900"
                                    onClick={resetToList}
                                >
                                    <ChevronLeft className="mr-2 h-4 w-4" />
                                    Back to projects
                                </Button>

                                <Card className="rounded-[2.5rem] border-slate-200 bg-white p-8 sm:p-12 shadow-sm">
                                    <div className="space-y-10">
                                        <section className="space-y-4">
                                            <Badge className="rounded-full bg-blue-50 text-blue-900 border-blue-100 px-4 py-1.5 font-bold shadow-none">
                                                Problem Statement
                                            </Badge>
                                            <h2 className="text-3xl font-black text-slate-900">{selectedProject.title}</h2>
                                            <p className="text-lg text-slate-600 leading-relaxed">
                                                {selectedProject.problemStatement}
                                            </p>
                                            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                                                <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                                    <Target className="h-5 w-5 text-blue-900" />
                                                </div>
                                                <div>
                                                    <div className="text-[10px] uppercase font-black text-slate-400">Stakeholder</div>
                                                    <div className="text-sm font-bold text-slate-900">{selectedProject.stakeholder}</div>
                                                </div>
                                            </div>
                                        </section>

                                        <Separator className="bg-slate-100" />

                                        <div className="grid gap-10 md:grid-cols-2">
                                            <section className="space-y-4">
                                                <div className="flex items-center gap-2 text-sm font-bold text-slate-900 uppercase tracking-widest">
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                    Objectives
                                                </div>
                                                <ul className="space-y-3">
                                                    {selectedProject.objectives.map((obj, i) => (
                                                        <li key={i} className="flex gap-3 text-sm text-slate-600 leading-relaxed">
                                                            <span className="font-bold text-blue-900">{i + 1}.</span>
                                                            {obj}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </section>

                                            <section className="space-y-4">
                                                <div className="flex items-center gap-2 text-sm font-bold text-slate-900 uppercase tracking-widest">
                                                    <Layout className="h-4 w-4 text-amber-500" />
                                                    Constraints
                                                </div>
                                                <ul className="space-y-3">
                                                    {selectedProject.constraints.map((con, i) => (
                                                        <li key={i} className="flex gap-2 text-sm text-slate-600 leading-relaxed">
                                                            <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-300" />
                                                            {con}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </section>
                                        </div>

                                        <section className="space-y-4 rounded-[2rem] bg-slate-900 p-8 text-white shadow-xl shadow-slate-900/20">
                                            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400">
                                                <Upload className="h-4 w-4 text-blue-400" />
                                                Required Deliverables
                                            </div>
                                            <div className="grid gap-4 sm:grid-cols-3">
                                                {selectedProject.deliverables.map((del, i) => (
                                                    <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs font-bold leading-relaxed text-blue-100">
                                                        {del}
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    </div>
                                </Card>
                            </motion.div>

                            <aside className="space-y-6">
                                <Card className="rounded-[2.5rem] border-slate-200 bg-white p-8 shadow-sm lg:sticky lg:top-12">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                                <Star className="h-5 w-5" />
                                            </div>
                                            <h3 className="font-bold text-slate-900">Evaluation Rubric</h3>
                                        </div>

                                        <div className="space-y-4">
                                            {selectedProject.rubric.map((item, i) => (
                                                <div key={i} className="space-y-1.5">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="font-bold text-slate-900">{item.skill}</span>
                                                        <span className="text-slate-400">{item.weight}% weight</span>
                                                    </div>
                                                    <div className="text-[11px] leading-relaxed text-slate-500 italic">
                                                        "{item.criteria}"
                                                    </div>
                                                    {item.currentMastery !== undefined && (
                                                        <div className="flex items-center gap-2 text-[10px]">
                                                            <span className="text-slate-400">Your level:</span>
                                                            <Badge className={cn(
                                                                "text-[9px]",
                                                                item.currentMastery >= 70 ? "bg-emerald-50 text-emerald-700" :
                                                                item.currentMastery >= 40 ? "bg-amber-50 text-amber-700" :
                                                                "bg-slate-50 text-slate-600"
                                                            )}>
                                                                {item.currentMastery}%
                                                            </Badge>
                                                        </div>
                                                    )}
                                                    <Progress value={item.currentMastery || 0} className="h-1 bg-slate-100" />
                                                </div>
                                            ))}
                                        </div>

                                        <Separator className="bg-slate-100" />

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-900">
                                                <Sparkles className="h-3 w-3" />
                                                Ready to Build?
                                            </div>
                                            <Button
                                                className="w-full rounded-2xl bg-blue-900 py-6 text-lg font-bold text-white shadow-xl shadow-blue-900/20 hover:bg-blue-800"
                                                onClick={() => setView("submission")}
                                            >
                                                Start Submission
                                                <ArrowRight className="ml-2 h-5 w-5" />
                                            </Button>
                                            <p className="text-[10px] text-center text-slate-400">
                                                Estimated work time: <b>{selectedProject.estimatedTime}</b>
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </aside>
                        </div>
                    )}

                    {view === "submission" && selectedProject && (
                        <motion.div
                            key="submission-view"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="mx-auto max-w-3xl space-y-8"
                        >
                            <Button
                                variant="ghost"
                                className="rounded-xl px-0 hover:bg-transparent text-slate-500 hover:text-slate-900"
                                onClick={() => setView("brief")}
                            >
                                <ChevronLeft className="mr-2 h-4 w-4" />
                                Back to brief
                            </Button>

                            <Card className="rounded-[2.5rem] border-slate-200 bg-white p-8 sm:p-12 shadow-sm">
                                <div className="space-y-8">
                                    <div className="text-center space-y-2">
                                        <Badge variant="outline" className="rounded-full bg-blue-50 border-blue-100 text-blue-900">
                                            Step 2: Submission
                                        </Badge>
                                        <h2 className="text-3xl font-black text-slate-900">Submit Your Work</h2>
                                        <p className="text-slate-500">Provide your code, documentation, and findings below.</p>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                                <FileCode className="h-4 w-4 text-blue-500" />
                                                Project Work / Code
                                            </label>
                                            <Textarea
                                                placeholder="Paste your SQL queries, Python code, or a detailed summary here..."
                                                className="min-h-[300px] rounded-2xl border-slate-200 focus:ring-blue-500"
                                                value={code}
                                                onChange={(e) => setCode(e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                                <Link2 className="h-4 w-4 text-indigo-500" />
                                                Dashboard / GitHub Link (Optional)
                                            </label>
                                            <Input
                                                placeholder="https://github.com/your-username/project-repo"
                                                className="rounded-xl border-slate-200 h-12"
                                                value={link}
                                                onChange={(e) => setLink(e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-amber-500" />
                                                Time Spent (hours)
                                            </label>
                                            <Input
                                                type="number"
                                                placeholder="e.g., 5"
                                                className="rounded-xl border-slate-200 h-12 w-32"
                                                value={timeSpent}
                                                onChange={(e) => setTimeSpent(e.target.value)}
                                            />
                                        </div>

                                        <div className="rounded-2xl bg-amber-50 p-6 border border-amber-100">
                                            <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2 mb-2">
                                                <Info className="h-4 w-4" />
                                                Pre-submission Checklist
                                            </h4>
                                            <ul className="space-y-2">
                                                {selectedProject.deliverables.map((item, i) => (
                                                    <li key={i} className="flex items-center gap-3 text-xs text-amber-800 font-medium">
                                                        <div className="h-4 w-4 rounded border border-amber-300 flex-shrink-0" />
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <Button
                                            className="w-full rounded-2xl bg-blue-900 py-7 text-xl font-bold text-white shadow-2xl shadow-blue-900/20 hover:bg-blue-800 disabled:opacity-50"
                                            onClick={submitProject}
                                            disabled={submitting || evaluating || (!code && !link)}
                                        >
                                            {submitting || evaluating ? (
                                                <>
                                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                    {evaluating ? "Evaluating Project..." : "Submitting..."}
                                                </>
                                            ) : (
                                                <>
                                                    Submit Project for Review
                                                    <ChevronRight className="ml-2 h-6 w-6" />
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    )}

                    {view === "feedback" && selectedProject && evaluationResult && (
                        <motion.div
                            key="feedback-view"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mx-auto max-w-4xl space-y-8"
                        >
                            <div className="flex flex-col gap-6 lg:flex-row">
                                {/* Feedback Left: Score Card */}
                                <div className="flex-1 space-y-6">
                                    <Card className="rounded-[2.5rem] border-none bg-blue-900 p-10 text-white shadow-2xl">
                                        <div className="flex flex-col items-center text-center space-y-4">
                                            <div className="relative h-40 w-40">
                                                <svg className="h-full w-full" viewBox="0 0 100 100">
                                                    <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                                                    <motion.circle
                                                        cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="8"
                                                        strokeLinecap="round" strokeDasharray="282.7"
                                                        initial={{ strokeDashoffset: 282.7 }}
                                                        animate={{ strokeDashoffset: 282.7 * (1 - evaluationResult.overallScore / 100) }}
                                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <span className="text-4xl font-black">{evaluationResult.overallScore}%</span>
                                                    <span className="text-[10px] uppercase font-bold text-blue-300">Overall Score</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-2xl font-bold">
                                                    {evaluationResult.overallScore >= 80 ? "Excellent Work!" :
                                                     evaluationResult.overallScore >= 60 ? "Good Effort!" :
                                                     "Keep Practicing!"}
                                                </h3>
                                                <p className="text-sm text-blue-100 italic">
                                                    {evaluationResult.explanation}
                                                </p>
                                            </div>
                                        </div>

                                        <Separator className="my-8 bg-white/10" />

                                        <div className="space-y-6">
                                            <h4 className="text-[10px] uppercase font-bold tracking-[0.2em] text-blue-300">Skill Breakdown</h4>
                                            <div className="space-y-4">
                                                {evaluationResult.rubricBreakdown.map((item, i) => (
                                                    <div key={i} className="space-y-2">
                                                        <div className="flex justify-between text-xs font-bold">
                                                            <span>{item.skill}</span>
                                                            <span>{item.score}%</span>
                                                        </div>
                                                        <Progress value={item.score} className="h-1.5 bg-white/10 [&>div]:bg-white" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Skill Updates */}
                                        <div className="mt-8 space-y-4">
                                            <h4 className="text-[10px] uppercase font-bold tracking-[0.2em] text-blue-300">Mastery Changes</h4>
                                            <div className="grid gap-2">
                                                {evaluationResult.skillUpdates.map((update, i) => (
                                                    <div key={i} className="flex items-center justify-between rounded-xl bg-white/5 p-3 text-xs">
                                                        <span className="font-bold">{update.skillId}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-blue-300">{update.previousMastery}%</span>
                                                            <ArrowRight className="h-3 w-3" />
                                                            <span className="font-bold">{update.newMastery}%</span>
                                                            <Badge className={cn(
                                                                "text-[9px] border-none",
                                                                update.masteryDelta >= 0 ? "bg-emerald-500/30 text-emerald-300" : "bg-rose-500/30 text-rose-300"
                                                            )}>
                                                                {update.masteryDelta >= 0 ? "+" : ""}{update.masteryDelta}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {evaluationResult.pathAdjusted && (
                                                <Badge className="bg-amber-500/20 text-amber-300 border-none text-[10px]">
                                                    Learning Path Updated
                                                </Badge>
                                            )}
                                        </div>
                                    </Card>

                                    <Card className="rounded-[2rem] border-emerald-100 bg-emerald-50 p-8">
                                        <div className="flex items-center gap-3 text-emerald-900 mb-4">
                                            <Award className="h-6 w-6" />
                                            <h4 className="font-bold">Resume Boost Unlocked</h4>
                                        </div>
                                        <p className="text-sm text-emerald-800 leading-relaxed mb-4">
                                            You've demonstrated competency. Use this bullet point on your resume:
                                        </p>
                                        <div className="rounded-xl bg-white p-4 border border-emerald-200 text-xs font-mono text-slate-700 italic">
                                            "{evaluationResult.resumeBullet}"
                                        </div>
                                    </Card>
                                </div>

                                {/* Feedback Right: AI Analysis */}
                                <div className="w-full lg:w-[450px] space-y-6">
                                    <Card className="rounded-[2.5rem] border-slate-200 bg-white p-8 shadow-sm">
                                        <div className="space-y-8">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center">
                                                    <MessageSquare className="h-5 w-5" />
                                                </div>
                                                <h3 className="font-bold text-slate-900">AI Tutor Feedback</h3>
                                            </div>

                                            <div className="space-y-6">
                                                {evaluationResult.strengths.length > 0 && (
                                                    <div className="space-y-3">
                                                        <h5 className="text-xs font-bold text-emerald-600 uppercase tracking-widest">What you did well</h5>
                                                        {evaluationResult.strengths.map((s, i) => (
                                                            <p key={i} className="text-sm text-slate-600 leading-relaxed">
                                                                {s}
                                                            </p>
                                                        ))}
                                                    </div>
                                                )}

                                                {evaluationResult.improvements.length > 0 && (
                                                    <div className="space-y-3">
                                                        <h5 className="text-xs font-bold text-amber-600 uppercase tracking-widest">Growth areas</h5>
                                                        {evaluationResult.improvements.map((imp, i) => (
                                                            <p key={i} className="text-sm text-slate-600 leading-relaxed">
                                                                {imp}
                                                            </p>
                                                        ))}
                                                    </div>
                                                )}

                                                {evaluationResult.suggestions.length > 0 && (
                                                    <div className="space-y-3">
                                                        <h5 className="text-xs font-bold text-blue-600 uppercase tracking-widest">Next Steps</h5>
                                                        {evaluationResult.suggestions.map((sug, i) => (
                                                            <p key={i} className="text-sm text-slate-600 leading-relaxed">
                                                                {sug}
                                                            </p>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <Button
                                                className="w-full rounded-2xl bg-blue-900 py-6 text-lg font-bold text-white shadow-xl shadow-blue-900/20 hover:bg-blue-800"
                                                onClick={() => setLocation("/dashboard")}
                                            >
                                                Back to Dashboard
                                                <ChevronRight className="ml-2 h-5 w-5" />
                                            </Button>
                                        </div>
                                    </Card>

                                    <Card className="rounded-[2rem] border-none bg-indigo-900 p-8 text-white">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Zap className="h-4 w-4 text-amber-400" />
                                            <span className="text-xs font-bold uppercase tracking-widest">Try Another Project</span>
                                        </div>
                                        <p className="text-xs text-indigo-100 leading-relaxed mb-6">
                                            Continue building your portfolio with more hands-on projects tailored to your skill level.
                                        </p>
                                        <Button 
                                            variant="ghost" 
                                            className="w-full border border-white/20 text-white hover:bg-white/10 rounded-xl"
                                            onClick={resetToList}
                                        >
                                            Browse More Projects
                                        </Button>
                                    </Card>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function ProjectCard({ project, onView }: { project: ProjectBrief; onView: () => void }) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            transition={{ duration: 0.2 }}
        >
            <Card className="group overflow-hidden rounded-[2.5rem] border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl">
                <div className="flex flex-col h-full gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Badge variant="outline" className="rounded-full bg-slate-50 border-slate-100 px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                {project.difficulty} • {project.estimatedTime}
                            </Badge>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-900 uppercase">
                                <Award className="h-3 w-3" />
                                Resume-ready
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 group-hover:text-blue-900 transition-colors">
                            {project.title}
                        </h3>
                        <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">
                            {project.scenario}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {project.skills.map(s => (
                            <Badge key={s} variant="secondary" className="rounded-lg bg-blue-50 text-blue-700 border-none font-bold text-[10px]">
                                {s}
                            </Badge>
                        ))}
                    </div>

                    {/* Readiness Indicator */}
                    {project.readinessScore !== undefined && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Your Readiness</span>
                                <Badge className={cn(
                                    "text-[9px]",
                                    project.readinessScore >= 70 ? "bg-emerald-50 text-emerald-700" :
                                    project.readinessScore >= 40 ? "bg-amber-50 text-amber-700" :
                                    "bg-slate-50 text-slate-600"
                                )}>
                                    {project.readinessScore}%
                                </Badge>
                            </div>
                            <Progress value={project.readinessScore} className="h-1.5" />
                        </div>
                    )}

                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50">
                        {project.recommended && (
                            <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[9px]">
                                Recommended for you
                            </Badge>
                        )}
                        <Button
                            className="rounded-xl bg-slate-900 h-10 px-6 font-bold text-white group-hover:bg-blue-900 transition-colors ml-auto"
                            onClick={onView}
                        >
                            View Brief
                        </Button>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
