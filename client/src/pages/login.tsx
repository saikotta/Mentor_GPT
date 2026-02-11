import * as React from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Brain, Mail, Lock, ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();

    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            toast({
                title: "Missing fields",
                description: "Please enter both email and password",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Invalid email or password");
            }

            toast({
                title: "Welcome back!",
                description: "Successfully logged in to MentorGPT",
            });

            setLocation("/dashboard");
        } catch (error: any) {
            toast({
                title: "Login failed",
                description: error.message || "Please check your credentials",
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

            {/* Login Form */}
            <div className="relative flex min-h-screen items-center justify-center px-6 pt-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    <div className="mb-8 text-center">
                        <Badge className="mb-4 rounded-full bg-blue-50 text-blue-900 border-blue-100 px-4 py-1.5 font-bold shadow-none">
                            <Sparkles className="mr-2 h-3.5 w-3.5" />
                            Welcome Back
                        </Badge>
                        <h1 className="mb-3 text-4xl font-bold tracking-tight text-slate-900">Sign In</h1>
                        <p className="text-lg text-slate-600">
                            Continue your learning journey with MentorGPT
                        </p>
                    </div>

                    <Card className="rounded-3xl border-slate-200 bg-white p-8 shadow-2xl shadow-blue-900/5">
                        <form onSubmit={handleLogin} className="space-y-6">
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
                            </div>

                            {/* Forgot Password */}
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                                    />
                                    Remember me
                                </label>
                                <button
                                    type="button"
                                    className="text-sm font-bold text-blue-900 transition hover:text-blue-800"
                                >
                                    Forgot password?
                                </button>
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
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        Sign In
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

                        {/* Register Link */}
                        <div className="text-center">
                            <p className="text-sm text-slate-600 font-medium">
                                Don't have an account?{" "}
                                <button
                                    type="button"
                                    onClick={() => setLocation("/register")}
                                    className="font-bold text-blue-900 transition hover:text-blue-800"
                                >
                                    Create Account
                                </button>
                            </p>
                        </div>
                    </Card>


                </motion.div>
            </div>
        </div>
    );
}
