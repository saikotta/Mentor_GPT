import * as React from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
    Briefcase,
    Target,
    ChartBar,
    TrendingUp,
    Clock,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Download,
    Share2,
    Sparkles,
    Award,
    BookOpen,
    Layout,
    ChevronRight,
    ChevronLeft,
    Copy,
    Terminal,
    FileText,
    Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useMentorStore } from "@/store/useMentorStore";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export default function CareerReportPage() {
    const [, setLocation] = useLocation();
    const profile = useMentorStore((s) => s.userProfile);
    const skills = useMentorStore((s) => s.skills);

    const [isCopied, setIsCopied] = React.useState(false);

    React.useEffect(() => {
        if (!profile) setLocation("/onboarding");
    }, [profile, setLocation]);

    if (!profile) return null;

    // Mock Analysis Logic
    const readinessScore = React.useMemo(() => {
        if (skills.length === 0) return 0;
        const avg = skills.reduce((acc, s) => acc + s.masteryScore, 0) / skills.length;
        return Math.round(avg * 0.8 + 20); // Basic weighting for prototype
    }, [skills]);

    const skillGaps = React.useMemo(() => {
        return skills.map(s => ({
            ...s,
            target: 85, // Mock target
            priority: s.masteryScore < 50 ? "High" : "Medium",
            status: s.masteryScore >= 80 ? "Strong" : s.masteryScore >= 50 ? "Developing" : "Critical Gap"
        })).sort((a, b) => a.masteryScore - b.masteryScore);
    }, [skills]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
            {/* Background Decor */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 h-[600px] w-[600px] rounded-full bg-blue-50/50 blur-[140px]" />
                <div className="absolute bottom-0 left-0 h-[600px] w-[600px] rounded-full bg-indigo-50/50 blur-[140px]" />
            </div>

            <div className="relative mx-auto w-full max-w-[1400px] px-6 py-10">
                <Button
                    variant="ghost"
                    className="mb-6 rounded-xl text-slate-500 hover:bg-white"
                    onClick={() => setLocation("/dashboard")}
                >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Return to Dashboard
                </Button>

                {/* 1️⃣ Header Section */}
                <header className="mb-12 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-3">
                        <h1 className="text-4xl font-black tracking-tight text-slate-900">Career Fit Report</h1>
                        <p className="text-lg text-slate-500 font-medium">
                            Your readiness for <span className="text-blue-900 font-bold">{profile.targetRole}</span>, powered by real skill data.
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                            <Badge variant="outline" className="rounded-xl border-slate-200 bg-white px-4 py-2 text-sm font-bold shadow-sm">
                                <Briefcase className="mr-2 h-4 w-4 text-slate-400" />
                                {profile.targetRole}
                            </Badge>
                            <Badge variant="outline" className="rounded-xl border-slate-200 bg-white px-4 py-2 text-sm font-bold shadow-sm">
                                <Layout className="mr-2 h-4 w-4 text-slate-400" />
                                Skill Reinforcement
                            </Badge>
                            <Badge variant="outline" className="rounded-xl border-slate-200 bg-white px-4 py-2 text-sm font-bold shadow-sm">
                                <Clock className="mr-2 h-4 w-4 text-slate-400" />
                                Updated Today
                            </Badge>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="rounded-2xl border-slate-200 bg-white h-12 px-6">
                            <Download className="mr-2 h-4 w-4" />
                            Export PDF
                        </Button>
                        <Button className="rounded-2xl bg-blue-900 text-white shadow-xl shadow-blue-900/20 h-12 px-6">
                            <Share2 className="mr-2 h-4 w-4" />
                            Share Report
                        </Button>
                    </div>
                </header>

                <div className="grid gap-8 lg:grid-cols-[1fr_450px]">
                    <div className="space-y-8">
                        {/* 2️⃣ Role Match Score */}
                        <Card className="overflow-hidden rounded-[2.5rem] border-none bg-blue-900 p-10 text-white shadow-2xl">
                            <div className="relative z-10 grid gap-10 md:grid-cols-[200px_1fr]">
                                <div className="flex flex-col items-center justify-center text-center">
                                    <div className="relative h-44 w-44">
                                        <svg className="h-full w-full rotate-[-90deg]" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                                            <motion.circle
                                                cx="50" cy="50" r="45" fill="none" stroke="#38BDF8" strokeWidth="6"
                                                strokeLinecap="round" strokeDasharray="282.7"
                                                initial={{ strokeDashoffset: 282.7 }}
                                                animate={{ strokeDashoffset: 282.7 * (1 - readinessScore / 100) }}
                                                transition={{ duration: 2, ease: "easeOut" }}
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-5xl font-black">{readinessScore}%</span>
                                            <span className="text-[10px] uppercase font-bold text-blue-300">Ready</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <h2 className="text-3xl font-black underline decoration-blue-400 decoration-4 underline-offset-8">Role Match Potential</h2>
                                        <p className="text-blue-100 font-medium leading-relaxed">
                                            Based on your current skill mastery, completed projects, and technical evaluation performance. You are trending 12% faster than typical {profile.targetRole} candidates.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="rounded-2xl bg-white/5 p-4 border border-white/10">
                                            <div className="text-[10px] font-black uppercase text-blue-300 mb-1">Time to Ready</div>
                                            <div className="text-xl font-bold">~4.5 Weeks</div>
                                        </div>
                                        <div className="rounded-2xl bg-white/5 p-4 border border-white/10">
                                            <div className="text-[10px] font-black uppercase text-blue-300 mb-1">Confidence Rate</div>
                                            <div className="text-xl font-bold">High (88%)</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Background Sparkles for Score Card */}
                            <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
                                <Sparkles className="h-32 w-32" />
                            </div>
                        </Card>

                        {/* 3️⃣ Skill Gap Analysis */}
                        <Card className="rounded-[2.5rem] border-slate-200 bg-white p-8 sm:p-12 shadow-sm">
                            <div className="space-y-8">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-2xl font-black text-slate-900">Skill Gap Breakdown</h3>
                                    <div className="flex gap-2">
                                        <Badge variant="outline" className="rounded-lg bg-emerald-50 text-emerald-700 border-none px-3 font-bold">Ready</Badge>
                                        <Badge variant="outline" className="rounded-lg bg-amber-50 text-amber-700 border-none px-3 font-bold">Building</Badge>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {skillGaps.map((s, i) => (
                                        <div key={i} className="group relative rounded-3xl border border-slate-50 p-6 transition-all hover:bg-slate-50/50">
                                            <div className="grid gap-6 md:grid-cols-[1fr_200px]">
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-3">
                                                        <h4 className="text-lg font-bold text-slate-900">{s.skill}</h4>
                                                        {s.status === "Strong" ? (
                                                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                                        ) : s.status === "Critical Gap" ? (
                                                            <AlertCircle className="h-5 w-5 text-rose-500" />
                                                        ) : (
                                                            <TrendingUp className="h-5 w-5 text-amber-500" />
                                                        )}
                                                        <Badge variant="secondary" className={cn(
                                                            "rounded-full text-[10px] font-bold uppercase",
                                                            s.status === "Strong" ? "bg-emerald-50 text-emerald-700" :
                                                                s.status === "Critical Gap" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"
                                                        )}>
                                                            {s.status}
                                                        </Badge>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between text-xs font-bold text-slate-400">
                                                            <span>Readiness: {s.masteryScore}%</span>
                                                            <span>Path Target: {s.target}%</span>
                                                        </div>
                                                        <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className="absolute inset-y-0 left-0 bg-slate-200 rounded-full" style={{ width: `${s.target}%` }} />
                                                            <motion.div
                                                                className={cn(
                                                                    "absolute inset-y-0 left-0 rounded-full",
                                                                    s.status === "Strong" ? "bg-emerald-500" :
                                                                        s.status === "Critical Gap" ? "bg-rose-500" : "bg-blue-900"
                                                                )}
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${s.masteryScore}%` }}
                                                                transition={{ duration: 1.5, delay: 0.2 + (i * 0.1) }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col justify-center space-y-2 text-right">
                                                    <div className="text-[10px] uppercase font-black tracking-widest text-slate-400">Priority</div>
                                                    <div className={cn(
                                                        "text-sm font-bold",
                                                        s.priority === "High" ? "text-rose-600" : "text-blue-900"
                                                    )}>
                                                        {s.priority} Action Required
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>

                        {/* 6️⃣ Resume Bullet Point Suggestions */}
                        <Card className="rounded-[2.5rem] border-slate-200 bg-white p-8 sm:p-12 shadow-sm">
                            <div className="space-y-8">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-2xl bg-blue-50 flex items-center justify-center">
                                        <FileText className="h-5 w-5 text-blue-900" />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900">Resume Impact Points</h3>
                                </div>

                                <div className="space-y-4">
                                    {[
                                        {
                                            bullet: "Analyzed multi-table retail datasets using SQL joins and aggregations to identify a 15% margin leak across regional operations.",
                                            skills: ["SQL", "Data Analysis"],
                                            relevance: "High"
                                        },
                                        {
                                            bullet: "Engineered a predictive lead scoring model using Python and probability theory to rank 500+ daily incoming leads.",
                                            skills: ["Python", "Statistics"],
                                            relevance: "Direct Match"
                                        }
                                    ].map((point, i) => (
                                        <div key={i} className="group p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-all">
                                            <div className="flex items-start justify-between gap-4 mb-4">
                                                <p className="text-sm font-medium text-slate-700 leading-relaxed italic">
                                                    "{point.bullet}"
                                                </p>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="rounded-xl h-9 w-9 text-slate-400 hover:text-blue-900 hover:bg-white shrink-0"
                                                    onClick={() => copyToClipboard(point.bullet)}
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex gap-2">
                                                    {point.skills.map(s => <Badge key={s} variant="outline" className="rounded-lg bg-white border-none text-[10px] font-bold text-slate-500 uppercase">{s}</Badge>)}
                                                </div>
                                                <Badge className="bg-blue-900 text-white text-[10px] px-3 font-bold">{point.relevance}</Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {isCopied && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-center text-xs font-bold text-emerald-600"
                                    >
                                        Copied to clipboard!
                                    </motion.div>
                                )}
                            </div>
                        </Card>
                    </div>

                    <aside className="space-y-8">
                        {/* 4️⃣ Estimated Time to Readiness */}
                        <Card className="rounded-[2.5rem] border-slate-200 bg-white p-8 shadow-sm">
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                                        <TrendingUp className="h-5 w-5 text-indigo-600" />
                                    </div>
                                    <h3 className="font-black text-slate-900">Readiness Timeline</h3>
                                </div>

                                <div className="relative pt-2 pb-6 px-4">
                                    <div className="absolute left-4 top-2 bottom-6 w-0.5 bg-slate-100" />
                                    <div className="space-y-8 relative">
                                        {[
                                            { label: "Phase 1: Foundations", date: "Completed", status: "completed" },
                                            { label: "Phase 2: Reinforcement", date: "Current Week", status: "current" },
                                            { label: "Phase 3: Portfolio Build", date: "In 2 Weeks", status: "upcoming" },
                                            { label: "Job Ready", date: "In 4.5 Weeks", status: "target" },
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-start gap-4">
                                                <div className={cn(
                                                    "mt-1.5 h-3 w-3 rounded-full border-2 bg-white relative z-10",
                                                    item.status === "completed" ? "border-emerald-500 bg-emerald-500" :
                                                        item.status === "current" ? "border-blue-900 bg-blue-900 animate-pulse" : "border-slate-300"
                                                )} />
                                                <div>
                                                    <div className={cn(
                                                        "text-sm font-bold",
                                                        item.status === "current" ? "text-blue-900" : "text-slate-900"
                                                    )}>{item.label}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.date}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* 5️⃣ Actionable Next Steps */}
                        <Card className="rounded-[2.5rem] border-none bg-slate-900 p-8 text-white shadow-xl">
                            <div className="space-y-8">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                                        <Zap className="h-5 w-5 text-amber-400" />
                                    </div>
                                    <h3 className="font-black">Critical Path Actions</h3>
                                </div>

                                <div className="space-y-4">
                                    {[
                                        { title: "Master SQL Joins", desc: "Targeted practice in Assessment Center", icon: <ChartBar className="h-4 w-4" /> },
                                        { title: "Finalize Retail Project", desc: "Complete in Project Studio", icon: <Terminal className="h-4 w-4" /> },
                                        { title: "Skill Map Optimization", desc: "Visualize and confirm mastery", icon: <Target className="h-4 w-4" /> }
                                    ].map((action, i) => (
                                        <Button
                                            key={i}
                                            variant="ghost"
                                            className="w-full justify-between h-auto py-5 px-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="text-white/40 group-hover:text-amber-400 transition-colors">
                                                    {action.icon}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-white mb-1">{action.title}</div>
                                                    <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{action.desc}</div>
                                                </div>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-white/20 group-hover:text-white transition-all group-hover:translate-x-1" />
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </Card>

                        {/* 7️⃣ Portfolio Project Recommendations */}
                        <Card className="rounded-[2.5rem] border-slate-200 bg-white p-8 shadow-sm">
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                                        <Award className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <h3 className="font-black text-slate-900">Portfolio Recommendations</h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                                        <h4 className="text-sm font-bold text-slate-900">Customer Churn Analysis</h4>
                                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                            "This project fills your critical gaps in **Data Modeling** and **Visualization** while providing high-impact proof for your target role."
                                        </p>
                                        <Button variant="outline" className="w-full h-10 rounded-xl bg-white text-xs font-bold text-emerald-700 border-none hover:bg-emerald-50">
                                            Launch in Studio
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* AI Advisor Badge */}
                        <div className="p-6 rounded-[2rem] bg-indigo-50 border border-indigo-100 flex items-start gap-4">
                            <div className="mt-1 h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                                <Sparkles className="h-4 w-4 text-white" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">AI Career Advisor</p>
                                <p className="text-xs text-indigo-900 leading-relaxed font-medium italic">
                                    "I've optimized your next two weeks to prioritize SQL Joins. Once that mastering hits 80%, your readiness score will jump to 78% automatically."
                                </p>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
