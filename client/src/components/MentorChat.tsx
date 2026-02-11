import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MessageSquare,
    X,
    Send,
    Sparkles,
    ChevronRight,
    Brain,
    Target,
    Clock,
    Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMentorStore } from "@/store/useMentorStore";

interface Message {
    role: "mentor" | "user";
    content: string;
    timestamp: number;
}

export function MentorChat() {
    const [isOpen, setIsOpen] = React.useState(false);
    const [input, setInput] = React.useState("");
    const [messages, setMessages] = React.useState<Message[]>([
        {
            role: "mentor",
            content: "Hi there! I'm your MentorGPT. How can I help you move closer to your goal today?",
            timestamp: Date.now(),
        },
    ]);
    const [isTyping, setIsTyping] = React.useState(false);

    const profile = useMentorStore((s) => s.userProfile);
    const skills = useMentorStore((s) => s.skills);
    const plan = useMentorStore((s) => s.learningPlan);

    const scrollRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    if (!profile) return null;

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage: Message = {
            role: "user",
            content: input,
            timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsTyping(true);

        try {
            const response = await fetch("/api/mentor/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: input })
            });

            if (!response.ok) throw new Error("Failed to fetch AI response");

            const data = await response.json();

            // Handle structured response from Module 3 (Grounded AI Mentor)
            let mentorContent = "";
            if (data.explanation) {
                mentorContent = data.explanation;
                if (data.diagnosis) mentorContent += `\n\n**Diagnosis:** ${data.diagnosis}`;
                if (data.mini_quiz && data.mini_quiz.length > 0) {
                    mentorContent += `\n\n**Quick Check:**\n${data.mini_quiz.map((q: any, i: number) => `${i + 1}. ${q.question}`).join("\n")}`;
                }
            } else if (data.reply) {
                mentorContent = data.reply;
            } else {
                mentorContent = "I'm sorry, I'm having trouble processing that right now.";
            }

            const mentorMessage: Message = {
                role: "mentor",
                content: mentorContent,
                timestamp: Date.now(),
            };

            setMessages((prev) => [...prev, mentorMessage]);
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages((prev) => [...prev, {
                role: "mentor",
                content: "I'm having trouble connecting to my knowledge base. Please try again in a moment.",
                timestamp: Date.now()
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="mb-4 w-[400px] overflow-hidden rounded-[2.5rem] border-slate-200 bg-white shadow-2xl shadow-blue-900/10"
                    >
                        {/* Header */}
                        <div className="bg-blue-900 p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 backdrop-blur-md">
                                        <Brain className="h-5 w-5 text-blue-100" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold">MentorGPT</h3>
                                        <div className="flex items-center gap-1.5">
                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                            <span className="text-[10px] uppercase font-bold text-blue-300">Active Coach</span>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsOpen(false)}
                                    className="rounded-xl text-blue-300 hover:bg-white/10 hover:text-white"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>

                            {/* Context Strip */}
                            <div className="mt-4 flex flex-wrap gap-2">
                                <Badge variant="outline" className="border-blue-400/30 bg-white/5 text-[10px] text-blue-100">
                                    <Target className="mr-1 h-3 w-3" />
                                    {profile.targetRole}
                                </Badge>
                                <Badge variant="outline" className="border-blue-400/30 bg-white/5 text-[10px] text-blue-100">
                                    <Zap className="mr-1 h-3 w-3" />
                                    Focus: SQL
                                </Badge>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="h-[400px] overflow-y-auto bg-slate-50/50 p-6" ref={scrollRef}>
                            <div className="space-y-6">
                                {messages.map((msg, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "flex flex-col gap-2",
                                            msg.role === "user" ? "items-end" : "items-start"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "max-w-[85%] rounded-[1.5rem] p-4 text-sm leading-relaxed",
                                                msg.role === "user"
                                                    ? "bg-blue-900 text-white shadow-lg shadow-blue-900/10"
                                                    : "bg-white border border-slate-100 text-slate-700 shadow-sm"
                                            )}
                                        >
                                            {msg.content}
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                                            {msg.role === "mentor" ? "MentorGPT" : "You"} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                ))}
                                {isTyping && (
                                    <div className="flex flex-col items-start gap-2">
                                        <div className="rounded-[1.5rem] bg-white border border-slate-100 p-4 shadow-sm">
                                            <div className="flex gap-1">
                                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300" />
                                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:0.2s]" />
                                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:0.4s]" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="border-t border-slate-100 bg-white p-4">
                            <div className="flex gap-2">
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                    placeholder="Ask me anything..."
                                    className="rounded-xl border-slate-200 focus:ring-blue-500 h-11"
                                />
                                <Button
                                    onClick={handleSend}
                                    disabled={!input.trim() || isTyping}
                                    className="rounded-xl bg-blue-900 text-white shadow-lg shadow-blue-900/20 hover:bg-blue-800 h-11 w-11 p-0"
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="mt-3 flex items-center justify-center gap-1.5 opacity-50">
                                <Sparkles className="h-3 w-3 text-blue-900" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    AI-Powered Guidance
                                </span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Button */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "h-16 w-16 rounded-full shadow-2xl transition-all duration-500",
                        isOpen
                            ? "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50"
                            : "bg-blue-900 text-white hover:bg-blue-800"
                    )}
                >
                    {isOpen ? (
                        <X className="h-7 w-7" />
                    ) : (
                        <div className="relative">
                            <MessageSquare className="h-7 w-7" />
                            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 border-2 border-blue-900" />
                        </div>
                    )}
                </Button>
            </motion.div>
        </div>
    );
}

function cn(...classes: string[]) {
    return classes.filter(Boolean).join(" ");
}
