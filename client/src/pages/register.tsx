import * as React from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Brain, Mail, Lock, User, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function RegisterPage() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();

    const [name, setName] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [confirmPassword, setConfirmPassword] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!name || !email || !password || !confirmPassword) {
            toast({
                title: "Missing fields",
                description: "Please fill in all fields",
                variant: "destructive",
            });
            return;
        }

        if (password !== confirmPassword) {
            toast({
                title: "Passwords don't match",
                description: "Please make sure your passwords match",
                variant: "destructive",
            });
            return;
        }

        if (password.length < 6) {
            toast({
                title: "Password too short",
                description: "Password must be at least 6 characters",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ name, email, password }),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error || "Registration failed");
            }

            toast({
                title: "Account created!",
                description: "Welcome to MentorGPT. Let's set up your learning path.",
            });

            setLocation("/onboarding");
        } catch (error: any) {
            toast({
                title: "Registration failed",
                description: error.message || "Please try again",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-100/50 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-indigo-100/50 blur-3xl" />
            </div>

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <button
                        onClick={() => setLocation("/")}
                        className="flex items-center gap-3 transition hover:opacity-80"
                    >
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-900 shadow-lg shadow-blue-900/20">
                            <Brain className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-slate-900">MentorGPT</div>
                            <div className="text-xs font-bold text-slate-400 tracking-widest uppercase">AI Skill Coach</div>
                        </div>
                    </button>

                    <Button
                        variant="ghost"
                        onClick={() => setLocation("/")}
                        className="text-slate-600 hover:text-blue-900 font-semibold"
                    >
                        Back to Home
                    </Button>
                </div>
            </nav>

            {/* Registration Form */}
            <div className="relative flex min-h-screen items-center justify-center px-6 pt-28 pb-12">
                <div className="grid w-full max-w-6xl gap-12 lg:grid-cols-2 lg:gap-16">
                    {/* Left: Form */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="mb-8">
                            <Badge className="mb-4 rounded-full bg-blue-50 text-blue-900 border-blue-100 px-4 py-1.5 font-bold shadow-none">
                                <Sparkles className="mr-2 h-3.5 w-3.5" />
                                Get Started
                            </Badge>
                            <h1 className="mb-3 text-4xl font-bold tracking-tight text-slate-900">Create Account</h1>
                            <p className="text-lg text-slate-600">
                                Start your personalized learning journey today
                            </p>
                        </div>

                        <Card className="rounded-3xl border-slate-200 bg-white p-8 shadow-2xl shadow-blue-900/5">
                            <form onSubmit={handleRegister} className="space-y-5">
                                {/* Name Field */}
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-sm font-bold text-slate-700">
                                        Full Name
                                    </Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                        <Input
                                            id="name"
                                            type="text"
                                            placeholder="John Doe"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="h-12 rounded-xl border-slate-200 bg-slate-50/50 pl-11 text-slate-900 placeholder:text-slate-400 focus:border-blue-900 focus:ring-blue-900"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

                                {/* Email Field */}
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-bold text-slate-700">
                                        Email Address
                                    </Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="h-12 rounded-xl border-slate-200 bg-slate-50/50 pl-11 text-slate-900 placeholder:text-slate-400 focus:border-blue-900 focus:ring-blue-900"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

                                {/* Password Field */}
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-sm font-bold text-slate-700">
                                        Password
                                    </Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="h-12 rounded-xl border-slate-200 bg-slate-50/50 pl-11 text-slate-900 placeholder:text-slate-400 focus:border-blue-900 focus:ring-blue-900"
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <p className="text-xs font-medium text-slate-400">Must be at least 6 characters</p>
                                </div>

                                {/* Confirm Password Field */}
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword" className="text-sm font-bold text-slate-700">
                                        Confirm Password
                                    </Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="h-12 rounded-xl border-slate-200 bg-slate-50/50 pl-11 text-slate-900 placeholder:text-slate-400 focus:border-blue-900 focus:ring-blue-900"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

                                {/* Terms */}
                                <div className="flex items-start gap-2">
                                    <input
                                        type="checkbox"
                                        id="terms"
                                        required
                                        className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                                    />
                                    <label htmlFor="terms" className="text-sm text-slate-600 font-medium">
                                        I agree to the{" "}
                                        <button type="button" className="font-bold text-blue-900 hover:text-blue-800 transition-colors">
                                            Terms of Service
                                        </button>{" "}
                                        and{" "}
                                        <button type="button" className="font-bold text-blue-900 hover:text-blue-800 transition-colors">
                                            Privacy Policy
                                        </button>
                                    </label>
                                </div>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    size="lg"
                                    disabled={isLoading}
                                    className="w-full rounded-xl bg-blue-900 py-6 text-lg font-bold text-white shadow-lg shadow-blue-900/20 hover:bg-blue-800 disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                            Creating account...
                                        </>
                                    ) : (
                                        <>
                                            Create Account
                                            <ArrowRight className="ml-2 h-5 w-5" />
                                        </>
                                    )}
                                </Button>
                            </form>

                            {/* Divider */}
                            <div className="my-8 flex items-center gap-4">
                                <div className="h-px flex-1 bg-slate-100" />
                                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">or</span>
                                <div className="h-px flex-1 bg-slate-100" />
                            </div>

                            {/* Login Link */}
                            <div className="text-center">
                                <p className="text-sm text-slate-600 font-medium">
                                    Already have an account?{" "}
                                    <button
                                        type="button"
                                        onClick={() => setLocation("/login")}
                                        className="font-bold text-blue-900 transition hover:text-blue-800"
                                    >
                                        Sign In
                                    </button>
                                </p>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Right: Benefits */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="flex flex-col justify-center"
                    >
                        <h2 className="mb-8 text-3xl font-bold tracking-tight text-slate-900">What You'll Get</h2>

                        <div className="space-y-6">
                            {[
                                {
                                    icon: CheckCircle2,
                                    title: "Personalized Learning Path",
                                    description: "AI-generated roadmap tailored to your goals, time, and skill level.",
                                    color: "text-blue-900",
                                    bgColor: "bg-blue-50"
                                },
                                {
                                    icon: CheckCircle2,
                                    title: "Skill Tracking Dashboard",
                                    description: "Real-time mastery scores with visual skill graphs and progress charts.",
                                    color: "text-indigo-600",
                                    bgColor: "bg-indigo-50"
                                },
                                {
                                    icon: CheckCircle2,
                                    title: "Adaptive Assessments",
                                    description: "Quizzes and projects that adjust to your performance and learning pace.",
                                    color: "text-sky-500",
                                    bgColor: "bg-sky-50"
                                },
                                {
                                    icon: CheckCircle2,
                                    title: "AI Mentor Support",
                                    description: "24/7 chat support with context-aware explanations and motivation.",
                                    color: "text-blue-700",
                                    bgColor: "bg-slate-100"
                                },
                                {
                                    icon: CheckCircle2,
                                    title: "Career Readiness Score",
                                    description: "Track your progress toward your target role with gap analysis.",
                                    color: "text-emerald-600",
                                    bgColor: "bg-emerald-50"
                                },
                                {
                                    icon: CheckCircle2,
                                    title: "Portfolio Building",
                                    description: "Hands-on projects with rubric scoring to showcase your skills.",
                                    color: "text-amber-600",
                                    bgColor: "bg-amber-50"
                                },
                            ].map((benefit, idx) => (
                                <motion.div
                                    key={benefit.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 + idx * 0.1 }}
                                    className="flex gap-4 p-4 rounded-2xl transition hover:bg-white hover:shadow-sm"
                                >
                                    <div className={`mt-1 flex-shrink-0 grid h-10 w-10 place-items-center rounded-xl ${benefit.bgColor} ${benefit.color}`}>
                                        <benefit.icon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="mb-1 font-bold text-slate-900">{benefit.title}</h3>
                                        <p className="text-sm text-slate-600 leading-relaxed font-medium">{benefit.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                            className="mt-10 rounded-2xl bg-blue-900 p-6 text-white shadow-xl shadow-blue-900/20"
                        >
                            <p className="text-center text-sm font-medium">
                                <span className="font-bold">Join 10,000+ learners</span> who are
                                accelerating their career readiness with MentorGPT.
                            </p>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
