import * as React from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
    Brain,
    Sparkles,
    Target,
    TrendingUp,
    MessageSquare,
    Zap,
    CheckCircle2,
    ArrowRight,
    BarChart3,
    Award,
    Clock,
    Users,
    ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
};

const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.1,
        },
    },
};

export default function HomePage() {
    const [, setLocation] = useLocation();

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-xl shadow-sm">
                <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-600 shadow-lg shadow-blue-900/30">
                            <Brain className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-slate-900">MentorGPT</div>
                            <div className="text-xs text-slate-600">Adaptive Skill Coach</div>
                        </div>
                    </div>

                    <div className="hidden items-center gap-8 md:flex">
                        <a href="#features" className="text-sm text-slate-700 transition hover:text-blue-900">
                            Features
                        </a>
                        <a href="#how-it-works" className="text-sm text-slate-700 transition hover:text-blue-900">
                            How It Works
                        </a>
                        <a href="#proof" className="text-sm text-slate-700 transition hover:text-blue-900">
                            Results
                        </a>
                        <Button
                            onClick={() => setLocation("/login")}
                            className="rounded-full bg-gradient-to-r from-blue-900 to-indigo-600 hover:from-blue-800 hover:to-indigo-500 text-white shadow-lg shadow-blue-900/20"
                        >
                            Get Started
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative overflow-hidden px-6 pt-32 pb-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
                {/* Animated background elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-200/40 blur-3xl" />
                    <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-indigo-200/40 blur-3xl" />
                </div>

                <div className="relative mx-auto max-w-[1600px]">
                    <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
                        {/* Left: Text Content */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                            className="flex flex-col justify-center"
                        >
                            <Badge className="mb-6 w-fit rounded-full bg-blue-50 text-blue-900 border-blue-100 px-4 py-1.5 font-bold shadow-none">
                                <Sparkles className="mr-2 h-3.5 w-3.5" />
                                AI-Powered Learning Platform
                            </Badge>

                            <h1 className="mb-6 text-5xl font-bold leading-tight lg:text-6xl">
                                Your Personal{" "}
                                <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                                    AI Mentor
                                </span>{" "}
                                for Skills, Projects, and Careers
                            </h1>

                            <p className="mb-8 text-lg text-slate-300 lg:text-xl">
                                MentorGPT builds a dynamic skill graph, tracks your progress, and creates an
                                adaptive learning path tailored to your career goals and time.
                            </p>

                            <div className="flex flex-col gap-4 sm:flex-row">
                                <Button
                                    size="lg"
                                    onClick={() => setLocation("/login")}
                                    className="rounded-full bg-blue-900 px-8 py-6 text-lg font-semibold text-white shadow-xl shadow-blue-900/20 hover:bg-blue-800"
                                >
                                    Start My Roadmap Free
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    onClick={() => setLocation("/dashboard")}
                                    className="rounded-full border-slate-200 bg-white px-8 py-6 text-lg font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-blue-900"
                                >
                                    See How It Works
                                    <ChevronRight className="ml-2 h-5 w-5" />
                                </Button>
                            </div>

                            {/* Quick Stats */}
                            <div className="mt-12 grid grid-cols-3 gap-6">
                                <div>
                                    <div className="text-3xl font-bold text-blue-900">42%</div>
                                    <div className="text-sm font-medium text-slate-500">Skill Mastery ↑</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-indigo-600">35%</div>
                                    <div className="text-sm font-medium text-slate-500">Dropout Risk ↓</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-sky-600">8-12</div>
                                    <div className="text-sm font-medium text-slate-500">Weeks to Ready</div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Right: Visual */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="relative"
                        >
                            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">
                                {/* Mock Dashboard Preview */}
                                <div className="mb-6 flex items-center justify-between">
                                    <div className="text-sm font-bold text-slate-900 uppercase tracking-wider">Skill Overview</div>
                                    <Badge className="rounded-full bg-blue-900 text-white shadow-lg shadow-blue-900/10 px-3 py-1">
                                        Career Fit: 67%
                                    </Badge>
                                </div>

                                {/* Skill Bars */}
                                <div className="space-y-4">
                                    {[
                                        { skill: "SQL", value: 85, color: "bg-blue-900" },
                                        { skill: "Python", value: 70, color: "bg-indigo-600" },
                                        { skill: "Data Modeling", value: 60, color: "bg-sky-500" },
                                        { skill: "Statistics", value: 75, color: "bg-blue-800" },
                                        { skill: "Visualization", value: 90, color: "bg-indigo-500" },
                                        { skill: "Communication", value: 80, color: "bg-blue-700" },
                                    ].map((item, idx) => (
                                        <motion.div
                                            key={item.skill}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.4 + idx * 0.1 }}
                                        >
                                            <div className="mb-2 flex items-center justify-between text-sm">
                                                <span className="font-semibold text-slate-700">{item.skill}</span>
                                                <span className="font-bold text-blue-900">{item.value}%</span>
                                            </div>
                                            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${item.value}%` }}
                                                    transition={{ duration: 1, delay: 0.6 + idx * 0.1 }}
                                                    className={`h-full ${item.color} rounded-full`}
                                                />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Floating Cards */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1.2 }}
                                    className="mt-8 rounded-2xl bg-blue-900 p-5 text-white shadow-xl shadow-blue-900/20"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10">
                                            <Target className="h-5 w-5 text-blue-200" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold">Next Recommended</div>
                                            <div className="text-xs text-blue-100">SQL Joins Practice Quiz</div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Floating Badge */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 1.4 }}
                                className="absolute -right-4 -top-4 rounded-xl bg-white border border-slate-100 px-4 py-3 shadow-2xl"
                            >
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-amber-500" />
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">AI-Powered</div>
                                        <div className="text-sm font-bold text-blue-900">Adaptive Path</div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="px-6 py-20 relative overflow-hidden">
                <div className="mx-auto max-w-[1600px]">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-16 text-center"
                    >
                        <Badge className="mb-4 rounded-full bg-blue-50 text-blue-900 border-blue-100 px-4 py-1.5 font-bold shadow-none">
                            <Zap className="mr-2 h-3.5 w-3.5" />
                            Intelligent Features
                        </Badge>
                        <h2 className="mb-4 text-4xl font-bold lg:text-5xl text-slate-900 tracking-tight">
                            Not Just Learning.{" "}
                            <span className="text-blue-900 italic">
                                Intelligent Growth.
                            </span>
                        </h2>
                        <p className="mx-auto max-w-2xl text-lg text-slate-600 leading-relaxed">
                            MentorGPT combines skill graphs, adaptive assessments, and AI feedback loops to
                            accelerate your career readiness.
                        </p>
                    </motion.div>

                    <motion.div
                        variants={staggerContainer}
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true }}
                        className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
                    >
                        {/* Feature 1 */}
                        <motion.div variants={fadeInUp}>
                            <Card className="group h-full rounded-3xl border-slate-100 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                                <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-900 group-hover:bg-blue-900 group-hover:text-white transition-colors">
                                    <BarChart3 className="h-7 w-7" />
                                </div>
                                <h3 className="mb-3 text-xl font-bold text-slate-900">Personalized Skill Intelligence</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    Tracks skills, progress, confidence, and gaps in real time with dynamic skill
                                    graphs and mastery scoring.
                                </p>
                            </Card>
                        </motion.div>

                        {/* Feature 2 */}
                        <motion.div variants={fadeInUp}>
                            <Card className="group h-full rounded-3xl border-slate-100 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                                <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-900 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <TrendingUp className="h-7 w-7" />
                                </div>
                                <h3 className="mb-3 text-xl font-bold text-slate-900">Adaptive Learning Paths</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    Weekly goals, projects, and resources tailored to your time, ability, and career
                                    target with explainable recommendations.
                                </p>
                            </Card>
                        </motion.div>

                        {/* Feature 3 */}
                        <motion.div variants={fadeInUp}>
                            <Card className="group h-full rounded-3xl border-slate-100 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                                <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-sky-50 text-sky-900 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                                    <Target className="h-7 w-7" />
                                </div>
                                <h3 className="mb-3 text-xl font-bold text-slate-900">Learn by Doing</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    Auto-generated projects aligned to your interests and career goals with rubric
                                    scoring and portfolio building.
                                </p>
                            </Card>
                        </motion.div>

                        {/* Feature 4 */}
                        <motion.div variants={fadeInUp}>
                            <Card className="group h-full rounded-3xl border-slate-100 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                                <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-900 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                                    <MessageSquare className="h-7 w-7" />
                                </div>
                                <h3 className="mb-3 text-xl font-bold text-slate-900">AI Mentor Chat</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    Ask doubts, get explanations, feedback, and motivation 24/7 with context-aware AI
                                    responses and learning support.
                                </p>
                            </Card>
                        </motion.div>

                        {/* Feature 5 */}
                        <motion.div variants={fadeInUp}>
                            <Card className="group h-full rounded-3xl border-slate-100 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                                <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-900 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                    <Award className="h-7 w-7" />
                                </div>
                                <h3 className="mb-3 text-xl font-bold text-slate-900">Career Readiness Score</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    See how close you are to your dream role with skill gap analysis and actionable
                                    improvement plans.
                                </p>
                            </Card>
                        </motion.div>

                        {/* Feature 6 */}
                        <motion.div variants={fadeInUp}>
                            <Card className="group h-full rounded-3xl border-slate-100 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                                <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-900 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                                    <Sparkles className="h-7 w-7" />
                                </div>
                                <h3 className="mb-3 text-xl font-bold text-slate-900">Evidence-Based Mastery</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    Bayesian skill updates from quiz scores, project outcomes, and activity tracking
                                    for accurate progress measurement.
                                </p>
                            </Card>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Proof Section */}
            <section id="proof" className="px-6 py-20">
                <div className="mx-auto max-w-[1600px]">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="rounded-[3rem] border border-blue-100 bg-blue-50/50 p-12 lg:p-16 shadow-inner"
                    >
                        <div className="mb-16 text-center">
                            <h2 className="mb-4 text-4xl font-bold text-slate-900 tracking-tight">Measurable Career Gains</h2>
                            <p className="text-lg text-slate-600 leading-relaxed">
                                Verified outcomes from our active pilot community.
                            </p>
                        </div>

                        <div className="grid gap-12 md:grid-cols-3">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 }}
                                className="text-center"
                            >
                                <div className="mb-3 text-6xl font-black text-blue-900">↑ 42%</div>
                                <div className="text-lg font-bold text-slate-900 uppercase tracking-wide">Skill Mastery</div>
                                <div className="mt-3 text-sm text-slate-500 leading-relaxed">
                                    Average improvement per month using our adaptive engine
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 }}
                                className="text-center md:border-x border-blue-200 px-8"
                            >
                                <div className="mb-3 text-6xl font-black text-indigo-600">↓ 35%</div>
                                <div className="text-lg font-bold text-slate-900 uppercase tracking-wide">Dropout Risk</div>
                                <div className="mt-3 text-sm text-slate-500 leading-relaxed">
                                    Reduced anxiety and higher retention through pacing
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.3 }}
                                className="text-center"
                            >
                                <div className="mb-3 text-6xl font-black text-sky-500">8-12</div>
                                <div className="text-lg font-bold text-slate-900 uppercase tracking-wide">Weeks to Ready</div>
                                <div className="mt-3 text-sm text-slate-500 leading-relaxed">
                                    Faster career pivot with focused dependency paths
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="px-6 py-20 relative overflow-hidden">
                <div className="mx-auto max-w-[1600px]">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-20 text-center"
                    >
                        <h2 className="mb-4 text-4xl font-bold lg:text-5xl text-slate-900 lg:leading-tight">How It Works</h2>
                        <p className="mx-auto max-w-2xl text-lg text-slate-600">
                            Transforming your vision into an executable roadmap.
                        </p>
                    </motion.div>

                    <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
                        {[
                            {
                                step: "01",
                                icon: Target,
                                title: "Choose Your Goal",
                                description: "Select your target role, experience level, and weekly time budget.",
                                color: "bg-blue-900",
                            },
                            {
                                step: "02",
                                icon: CheckCircle2,
                                title: "Establish Baseline",
                                description: "Take a 12-question diagnostic toestablish your current skill graph.",
                                color: "bg-indigo-600",
                            },
                            {
                                step: "03",
                                icon: TrendingUp,
                                title: "Execute Roadmap",
                                description: "Complete weekly goals and projects generated just for you.",
                                color: "bg-sky-500",
                            },
                            {
                                step: "04",
                                icon: Award,
                                title: "Get Hired",
                                description: "Reach targeted readiness and build a verified career portfolio.",
                                color: "bg-blue-800",
                            },
                        ].map((item, idx) => (
                            <motion.div
                                key={item.step}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="relative group"
                            >
                                <div className="flex flex-col items-center text-center">
                                    <div className={`mb-6 grid h-16 w-16 place-items-center rounded-2xl ${item.color} text-white shadow-lg transition-transform group-hover:scale-110`}>
                                        <item.icon className="h-8 w-8" />
                                    </div>
                                    <div className="mb-2 text-3xl font-black text-slate-100 absolute -top-4 -z-10 select-none group-hover:text-blue-50 transition-colors">
                                        {item.step}
                                    </div>
                                    <h3 className="mb-3 text-xl font-bold text-slate-900 tracking-tight">{item.title}</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed px-2">{item.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="px-6 py-24 relative overflow-hidden">
                <div className="mx-auto max-w-[1600px]">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="rounded-[3rem] bg-blue-900 p-12 text-center text-white shadow-2xl shadow-blue-900/40 relative overflow-hidden"
                    >
                        {/* Background accents */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full -ml-32 -mb-32 blur-3xl" />

                        <div className="relative">
                            <h2 className="mb-6 text-4xl font-bold lg:text-5xl leading-tight">
                                Stop Guessing. Start Growing.
                            </h2>
                            <p className="mb-10 text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
                                Join our pilot and let MentorGPT architect your career path with clinical precision and AI intelligence.
                            </p>
                            <Button
                                size="lg"
                                onClick={() => setLocation("/login")}
                                className="rounded-full bg-white px-12 py-7 text-lg font-bold text-blue-900 shadow-2xl hover:bg-blue-50 transition-all hover:scale-105"
                            >
                                Build My Personalized Path
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-white px-6 py-16">
                <div className="mx-auto max-w-[1600px]">
                    <div className="flex flex-col items-center justify-between gap-10 md:flex-row pb-12 border-b border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-900 shadow-lg shadow-blue-900/20">
                                <Brain className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <div className="text-xl font-black text-slate-900 tracking-tight">MentorGPT</div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">AI Career Architect</div>
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-center gap-8 text-sm font-bold text-slate-500">
                            <a href="#features" className="transition hover:text-blue-900">Features</a>
                            <a href="#how-it-works" className="transition hover:text-blue-900">Process</a>
                            <a href="#proof" className="transition hover:text-blue-900">Outcomes</a>
                            <button onClick={() => setLocation("/dashboard")} className="transition hover:text-blue-900 text-blue-900 font-black">Launch Dashboard</button>
                        </div>
                    </div>

                    <div className="mt-10 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-500 font-medium">
                        <div>© 2026 MentorGPT. Built for learners who demand intelligence.</div>
                        <div className="flex gap-8">
                            <a href="#" className="hover:text-blue-900">Privacy Policy</a>
                            <a href="#" className="hover:text-blue-900">Term of Service</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
