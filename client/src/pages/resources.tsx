import * as React from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    Filter,
    Info,
    ExternalLink,
    Bookmark,
    Plus,
    MessageSquare,
    Sparkles,
    ArrowRight,
    Clock,
    BookOpen,
    Video,
    FileText,
    Code,
    CheckCircle2,
    X,
    Target,
    Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

import { useMentorStore, DEFAULT_SKILLS } from "@/store/useMentorStore";

type ResourceType = "course" | "video" | "article" | "documentation" | "practice";

interface Resource {
    id: string;
    title: string;
    type: ResourceType;
    platform: string;
    skills: string[];
    level: "Beginner" | "Intermediate" | "Advanced";
    duration: string;
    durationMinutes: number;
    isFree: boolean;
    whyRecommended: string;
    aiTag?: string;
}

const MOCK_RESOURCES: Resource[] = [
    {
        id: "1",
        title: "SQL Joins: The Visual Guide",
        type: "article",
        platform: "SQLZoo",
        skills: ["SQL"],
        level: "Beginner",
        duration: "15 mins",
        durationMinutes: 15,
        isFree: true,
        whyRecommended: "You scored 0% on Join-related questions in your diagnostic quiz. This visual guide is the fastest way to master the logic before moving to complex queries.",
        aiTag: "Best match for you",
    },
    {
        id: "2",
        title: "Python for Data Analysis Masterclass",
        type: "course",
        platform: "Coursera",
        skills: ["Python", "Statistics"],
        level: "Intermediate",
        duration: "4.5 hrs",
        durationMinutes: 270,
        isFree: false,
        whyRecommended: "Based on your interest in Data Science, this course covers the exact libraries (Pandas, Numpy) required for your target role as a Software Engineer.",
        aiTag: "High impact for your goal",
    },
    {
        id: "3",
        title: "Understanding Star Schemas in Data Modeling",
        type: "video",
        platform: "YouTube",
        skills: ["Data Modeling"],
        level: "Beginner",
        duration: "25 mins",
        durationMinutes: 25,
        isFree: true,
        whyRecommended: "Data Modeling is currently one of your weakest areas (0% mastery). This high-quality video simplifies complex database design concepts.",
    },
    {
        id: "4",
        title: "Communicating Data Insights to Stakeholders",
        type: "article",
        platform: "Medium",
        skills: ["Communication", "Visualization"],
        level: "Advanced",
        duration: "10 mins",
        durationMinutes: 10,
        isFree: true,
        whyRecommended: "Your communication score is strong (50%), but advanced stakeholder management is a critical requirement for Senior roles in your target path.",
    },
    {
        id: "5",
        title: "Complete Pandas Practice Set",
        type: "practice",
        platform: "LeetCode",
        skills: ["Python"],
        level: "Beginner",
        duration: "1 hr",
        durationMinutes: 60,
        isFree: true,
        whyRecommended: "You mentioned a preference for 'Project-first' learning. These hands-on drills will reinforce your core Python skills through direct application.",
        aiTag: "Recommended for this week",
    },
    {
        id: "6",
        title: "Probability & Statistics for Modern Engineering",
        type: "documentation",
        platform: "Official Docs",
        skills: ["Statistics"],
        level: "Intermediate",
        duration: "45 mins",
        durationMinutes: 45,
        isFree: true,
        whyRecommended: "A technical deep-dive aligned with your diagnostic response on normal distributions. Perfect for rigorous conceptual grounding.",
    },
];

export default function ResourceExplorerPage() {
    const [, setLocation] = useLocation();
    const profile = useMentorStore((s) => s.userProfile);
    const userSkills = useMentorStore((s) => s.skills);

    const [resources, setResources] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [selectedSkill, setSelectedSkill] = React.useState<string>("all");
    const [selectedLevel, setSelectedLevel] = React.useState<string>("all");
    const [selectedType, setSelectedType] = React.useState<string>("all");

    React.useEffect(() => {
        const fetchResources = async () => {
            try {
                const res = await fetch("/api/resources");
                if (res.ok) {
                    const data = await res.json();
                    setResources(data);
                }
            } catch (err) {
                console.error("Failed to fetch resources:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchResources();
    }, []);

    const weakestSkill = React.useMemo(() => {
        if (!userSkills.length) return "N/A";
        const sorted = [...userSkills].sort((a, b) => a.masteryScore - b.masteryScore);
        const skillId = sorted[0]?.skill;
        return skillId ? unslugify(skillId) : "N/A";
    }, [userSkills]);

    function unslugify(s: string) {
        return s.split('-').map(word => {
            if (word === 'and') return '&';
            return word.charAt(0).toUpperCase() + word.slice(1);
        }).join(' ');
    }

    const filteredResources = React.useMemo(() => {
        return resources.filter((res) => {
            const matchesSearch = res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                res.source.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesSkill = selectedSkill === "all" || res.skills.includes(selectedSkill);
            const matchesLevel = selectedLevel === "all" || res.difficulty === selectedLevel;
            const matchesType = selectedType === "all" || res.type === selectedType;

            return matchesSearch && matchesSkill && matchesLevel && matchesType;
        });
    }, [resources, searchQuery, selectedSkill, selectedLevel, selectedType]);

    React.useEffect(() => {
        if (!profile) setLocation("/onboarding");
    }, [profile, setLocation]);

    if (!profile) return null;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
            {/* Background Decor */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-blue-50/50 blur-[120px]" />
                <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-indigo-50/50 blur-[120px]" />
            </div>

            <div className="relative mx-auto w-full max-w-[1600px] px-6 py-10">
                {/* 1️⃣ Header Section */}
                <header className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black tracking-tight text-slate-900">Resource Explorer</h1>
                        <p className="text-lg text-slate-500 font-medium">
                            AI-curated learning resources tailored to your skills, goals, and progress.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Badge variant="outline" className="rounded-xl border-blue-100 bg-white px-4 py-2 text-sm font-bold shadow-sm">
                            <Target className="mr-2 h-4 w-4 text-blue-600" />
                            {profile.targetRole}
                        </Badge>
                        <Badge variant="outline" className="rounded-xl border-rose-100 bg-white px-4 py-2 text-sm font-bold shadow-sm">
                            <Zap className="mr-2 h-4 w-4 text-rose-500" />
                            Focus: {weakestSkill}
                        </Badge>
                        <Badge variant="outline" className="rounded-xl border-indigo-100 bg-white px-4 py-2 text-sm font-bold shadow-sm">
                            <BookOpen className="mr-2 h-4 w-4 text-indigo-600" />
                            Project-first
                        </Badge>
                    </div>
                </header>

                <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
                    {/* 2️⃣ Smart Filter Panel */}
                    <aside className="space-y-8">
                        <div className="sticky top-24 space-y-6">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search resources..."
                                    className="pl-10 h-11 rounded-xl border-slate-200 bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                                    <Filter className="h-3 w-3" />
                                    Filters
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-600">Primary Skill</label>
                                    <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                                        <SelectTrigger className="rounded-xl border-slate-200 bg-white">
                                            <SelectValue placeholder="All Skills" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Skills</SelectItem>
                                            {DEFAULT_SKILLS.map(s => (
                                                <SelectItem key={s} value={s}>{s}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-600">Difficulty</label>
                                    <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                                        <SelectTrigger className="rounded-xl border-slate-200 bg-white">
                                            <SelectValue placeholder="All Levels" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Levels</SelectItem>
                                            <SelectItem value="Beginner">Beginner</SelectItem>
                                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                                            <SelectItem value="Advanced">Advanced</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-600">Resource Type</label>
                                    <Select value={selectedType} onValueChange={setSelectedType}>
                                        <SelectTrigger className="rounded-xl border-slate-200 bg-white">
                                            <SelectValue placeholder="All Types" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Types</SelectItem>
                                            <SelectItem value="course">Course</SelectItem>
                                            <SelectItem value="video">Video</SelectItem>
                                            <SelectItem value="article">Article</SelectItem>
                                            <SelectItem value="documentation">Documentation</SelectItem>
                                            <SelectItem value="practice">Practice</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-xs font-bold text-slate-400 hover:text-slate-900 px-2"
                                    onClick={() => {
                                        setSelectedSkill("all");
                                        setSelectedLevel("all");
                                        setSelectedType("all");
                                        setSearchQuery("");
                                    }}
                                >
                                    <X className="mr-2 h-3.5 w-3.5" />
                                    Reset all filters
                                </Button>
                            </div>

                            {/* AI Coaching Sidebar Inset */}
                            <div className="rounded-2xl bg-blue-900 p-5 text-white shadow-lg shadow-blue-900/10">
                                <div className="flex items-center gap-2 mb-3">
                                    <Sparkles className="h-4 w-4 text-blue-300" />
                                    <span className="text-xs font-bold uppercase tracking-wider">AI Optimizer</span>
                                </div>
                                <p className="text-[11px] leading-relaxed text-blue-100">
                                    I'm ranking technical documentation higher this week because you indicated a preference for documentation-based learning in your history.
                                </p>
                            </div>
                        </div>
                    </aside>

                    {/* 3️⃣ Resource Cards Grid */}
                    <main className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-bold text-slate-500">
                                Showing <span className="text-slate-900">{filteredResources.length}</span> curated resources
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-slate-400">Sort by:</span>
                                <span className="text-xs font-bold text-blue-900 flex items-center gap-1 cursor-pointer">
                                    AI Recommendation <Sparkles className="h-3 w-3" />
                                </span>
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            {loading ? (
                                <div className="col-span-2 py-20 text-center animate-pulse text-slate-400">
                                    Curating your personalized resources...
                                </div>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    {filteredResources.map((res, idx) => (
                                        <ResourceCard key={res.id} resource={res} index={idx} unslugify={unslugify} />
                                    ))}
                                </AnimatePresence>
                            )}
                        </div>

                        {filteredResources.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="mb-4 rounded-full bg-slate-100 p-6">
                                    <Search className="h-10 w-10 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">No resources found</h3>
                                <p className="text-slate-500 max-w-xs mx-auto">
                                    Try adjusting your filters or search query to explore more results.
                                </p>
                                <Button
                                    variant="outline"
                                    className="mt-6 rounded-xl"
                                    onClick={() => {
                                        setSelectedSkill("all");
                                        setSelectedLevel("all");
                                        setSelectedType("all");
                                        setSearchQuery("");
                                    }}
                                >
                                    Reset all
                                </Button>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}

function ResourceCard({ resource, index, unslugify }: { resource: any; index: number; unslugify: (s: string) => string }) {
    const [isWhyExpanded, setIsWhyExpanded] = React.useState(false);

    const getTypeIcon = (type: ResourceType) => {
        switch (type) {
            case "video": return <Video className="h-4 w-4" />;
            case "course": return <BookOpen className="h-4 w-4" />;
            case "article": return <FileText className="h-4 w-4" />;
            case "documentation": return <Code className="h-4 w-4" />;
            case "practice": return <Zap className="h-4 w-4" />;
            default: return <FileText className="h-4 w-4" />;
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
        >
            <Card className="group relative flex flex-col h-full overflow-hidden rounded-[2rem] border-slate-100 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                {/* AI Highlight Bar */}
                {resource.aiTag && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
                )}

                <div className="flex flex-col p-6 h-full">
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="rounded-full bg-slate-50 border-slate-100 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                {getTypeIcon(resource.type)}
                                <span className="ml-1.5">{resource.type}</span>
                            </Badge>
                            <Badge variant="outline" className="rounded-full bg-slate-50 border-slate-100 py-1 text-[10px] font-bold text-slate-500">
                                {resource.source}
                            </Badge>
                        </div>
                        {resource.aiTag && (
                            <Badge className="rounded-full bg-blue-900 text-white text-[10px] py-1 px-3 shadow-lg shadow-blue-900/10">
                                <Sparkles className="mr-1.5 h-3 w-3" />
                                {resource.aiTag}
                            </Badge>
                        )}
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 leading-tight mb-3 group-hover:text-blue-900 transition-colors">
                        {resource.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-400 mb-6">
                        <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {resource.estimatedTime} mins
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className={cn(
                                "h-2 w-2 rounded-full",
                                resource.difficulty === "Beginner" ? "bg-emerald-500" : resource.difficulty === "Intermediate" ? "bg-amber-500" : "bg-rose-500"
                            )} />
                            {resource.difficulty}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Badge variant="secondary" className={cn(
                                "rounded-md py-0 px-2 border-none",
                                resource.qualityScore >= 90 ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
                            )}>
                                {resource.qualityScore >= 90 ? "Premium" : "Curated"}
                            </Badge>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                        {resource.skills.map((s: string) => (
                            <Badge key={s} variant="outline" className="rounded-lg bg-white border-slate-200 text-slate-600 font-bold px-2 py-0.5">
                                {unslugify(s)}
                            </Badge>
                        ))}
                    </div>

                    <div className="mt-auto space-y-4">
                        {/* 4️⃣ Why Recommended Toggle */}
                        <div className="pt-4 border-t border-slate-50">
                            <button
                                onClick={() => setIsWhyExpanded(!isWhyExpanded)}
                                className="flex items-center gap-1.5 text-xs font-bold text-blue-900 transition-opacity hover:opacity-80"
                            >
                                <Info className="h-3.5 w-3.5" />
                                {isWhyExpanded ? "Hide reasoning" : "Why this?"}
                            </button>

                            <AnimatePresence>
                                {isWhyExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="mt-3 rounded-xl bg-blue-50/50 p-4 text-[11px] leading-relaxed text-blue-900 font-medium">
                                            {resource.description}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* 6️⃣ Actions */}
                        <div className="flex items-center gap-2">
                            <Button className="flex-1 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 h-11">
                                Start Learning
                                <ExternalLink className="ml-2 h-4 w-4" />
                            </Button>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" size="icon" className="rounded-2xl border-slate-200 h-11 w-11">
                                            <Bookmark className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Save for later</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" size="icon" className="rounded-2xl border-slate-200 h-11 w-11">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Add to this week's plan</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
