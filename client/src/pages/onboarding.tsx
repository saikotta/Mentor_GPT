import * as React from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  Target,
  BarChart3,
  Wand2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

import {
  ExperienceLevel,
  ROLE_SKILLS,
  useMentorStore,
  type UserProfile,
  type SkillState,
} from "@/store/useMentorStore";

const ROLES = [
  "Data Analyst",
  "Software Engineer",
  "Product Manager",
  "UX Designer",
  "Cybersecurity Analyst",
  "AI Engineer",
];

const INTERESTS = [
  "Career switch",
  "Interview prep",
  "Portfolio projects",
  "AI fundamentals",
  "Data visualization",
  "Systems design",
  "Leadership",
  "Cloud",
];

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-indigo-200/30 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-600 shadow-lg shadow-blue-900/30">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <div
                className="text-xl font-semibold text-slate-900"
                data-testid="text-app-title"
              >
                MentorGPT
              </div>
              <div className="text-sm text-slate-600">
                Adaptive Skill Coach
              </div>
            </div>
          </div>

          <Badge
            variant="secondary"
            className="gap-2 rounded-full border-blue-200 bg-blue-50 px-3 py-1 text-blue-900"
            data-testid="badge-prototype"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Prototype
          </Badge>
        </div>

        {children}

        <div
          className="mt-10 text-center text-xs text-slate-600"
          data-testid="text-onboarding-footnote"
        >
          Your plan is generated locally with explainable, rule-based logic.
        </div>
      </div>
    </div>
  );
}

function StepPill({
  step,
  current,
  label,
}: {
  step: number;
  current: number;
  label: string;
}) {
  const active = step === current;
  const done = step < current;

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "grid h-7 w-7 place-items-center rounded-full border text-xs font-semibold transition-colors duration-200",
          active && "border-blue-900 bg-blue-900 text-white shadow-sm",
          done && "border-blue-200 bg-blue-50 text-blue-900",
          !active && !done && "border-slate-200 bg-white text-slate-400",
        )}
        data-testid={`step-indicator-${step}`}
      >
        {step}
      </div>
      <div className={cn(
        "hidden text-sm sm:block",
        active ? "font-semibold text-slate-900" : "text-slate-500"
      )}>
        {label}
      </div>
    </div>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function ratingToMastery(rating: number) {
  // 1..5 -> 20..90
  const base = 10 + rating * 18;
  return clamp(Math.round(base), 0, 100);
}

import { ROLE_QUIZZES, calculateQuizScore } from "@/data/diagnosticQuiz";

export default function OnboardingPage() {
  const [, setLocation] = useLocation();
  const setUserProfile = useMentorStore((s) => s.setUserProfile);
  const setSkills = useMentorStore((s) => s.setSkills);
  const generatePlan = useMentorStore((s) => s.generatePlan);

  const [step, setStep] = React.useState(1);

  const [targetRole, setTargetRole] = React.useState<string>("");
  const [experienceLevel, setExperienceLevel] =
    React.useState<ExperienceLevel | "">("");
  const [timePerWeek, setTimePerWeek] = React.useState<number>(6);
  const [interests, setInterests] = React.useState<string[]>([]);
  const [selfRatings, setSelfRatings] = React.useState<Record<string, number>>({});

  // Update skills when role changes
  const activeSkills = React.useMemo(() => {
    return ROLE_SKILLS[targetRole] || ROLE_SKILLS["Data Analyst"];
  }, [targetRole]);

  React.useEffect(() => {
    const initialRatings: Record<string, number> = {};
    activeSkills.forEach((s: string) => (initialRatings[s] = 3));
    setSelfRatings(initialRatings);
  }, [activeSkills]);

  // Quiz state
  const activeQuiz = React.useMemo(() => {
    return ROLE_QUIZZES[targetRole] || ROLE_QUIZZES["Data Analyst"];
  }, [targetRole]);

  const [quizAnswers, setQuizAnswers] = React.useState<Record<string, number>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);

  const totalSteps = 6;
  const progress = Math.round((step / totalSteps) * 100);

  const canNext = React.useMemo(() => {
    if (step === 1) return targetRole.trim().length > 0;
    if (step === 2) return experienceLevel !== "";
    if (step === 3) return timePerWeek >= 1;
    if (step === 4) return interests.length > 0;
    if (step === 5) return true;
    if (step === 6) return Object.keys(quizAnswers).length === activeQuiz.length;
    return false;
  }, [step, targetRole, experienceLevel, timePerWeek, interests.length, quizAnswers]);

  const onNext = () => setStep((s) => Math.min(totalSteps, s + 1));
  const onBack = () => setStep((s) => Math.max(1, s - 1));

  const onToggleInterest = (v: string) => {
    setInterests((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
    );
  };

  const onChangeRating = (skill: string, rating: number) => {
    setSelfRatings((prev) => ({ ...prev, [skill]: rating }));
  };

  const onFinish = async () => {
    const profile: UserProfile = {
      targetRole,
      experienceLevel: experienceLevel as ExperienceLevel,
      timePerWeek,
      interests,
      createdAt: Date.now(),
    };

    try {
      // Submit diagnostic to server for validation and persistence
      const diagnosticResponse = await fetch("/api/assessments/diagnostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          answers: quizAnswers,
          selfRatings,
          interests,
          targetRole,
          experienceLevel,
        }),
      });

      if (!diagnosticResponse.ok) {
        throw new Error("Failed to submit diagnostic");
      }

      const diagnosticData = await diagnosticResponse.json();

      // Persist profile to server
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          careerGoal: targetRole,
          skillInterests: interests,
          availability: timePerWeek,
          learningPreference: "mixed",
          pace: experienceLevel.toLowerCase(),
        }),
      });

      // Update Zustand with server-validated skills
      const skills: SkillState[] = diagnosticData.skills.map((s: any) => ({
        skill: s.skill,
        masteryScore: s.masteryScore,
        confidence: s.confidence,
        lastUpdated: s.lastUpdated,
      }));

      setUserProfile(profile);
      setSkills(skills);

      // Generate learning path on server (async, don't block)
      generatePlan().catch((err) => console.error("Failed to generate plan:", err));

      setLocation("/dashboard");
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
      // Still update local state as fallback (but flag as unvalidated)
      setUserProfile(profile);
      setLocation("/dashboard");
    }
  };

  return (
    <Shell>
      <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
        <Card className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1
                  className="text-3xl font-bold tracking-tight text-slate-900 leading-tight sm:text-4xl"
                  data-testid="text-onboarding-title"
                >
                  Build your personalized plan
                </h1>
                <p
                  className="mt-2 max-w-prose text-sm text-slate-600 sm:text-base leading-relaxed"
                  data-testid="text-onboarding-subtitle"
                >
                  Tell MentorGPT where you're going. We'll adapt your weekly roadmap and
                  explain every recommendation.
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-900 grid place-items-center shadow-sm">
                  <Target className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-blue-900 uppercase tracking-wider">Progress</span>
                <span className="text-xs font-bold text-slate-900">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2 bg-slate-100" data-testid="progress-onboarding" />
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <StepPill step={1} current={step} label="Role" />
                <StepPill step={2} current={step} label="Level" />
                <StepPill step={3} current={step} label="Time" />
                <StepPill step={4} current={step} label="Interests" />
                <StepPill step={5} current={step} label="Skills" />
                <StepPill step={6} current={step} label="Quiz" />
              </div>
            </div>

            <div className="mt-8">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Briefcase className="h-4 w-4" />
                      <span>Choose a target role</span>
                    </div>

                    <Label htmlFor="role" data-testid="label-role">
                      Target role
                    </Label>
                    <Select
                      value={targetRole}
                      onValueChange={(v) => setTargetRole(v)}
                    >
                      <SelectTrigger
                        id="role"
                        className="h-11 rounded-xl"
                        data-testid="select-role"
                      >
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r} data-testid={`option-role-${r}`}
                          >
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="rounded-2xl border bg-muted/40 p-4">
                      <div
                        className="text-sm font-medium"
                        data-testid="text-role-explain-title"
                      >
                        Why we ask
                      </div>
                      <div
                        className="mt-1 text-sm text-muted-foreground"
                        data-testid="text-role-explain"
                      >
                        Your role determines the skill map, readiness score, and the kinds
                        of tasks we prioritize.
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      <span>Set your starting point</span>
                    </div>

                    <Label data-testid="label-experience">Experience level</Label>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {(["Beginner", "Intermediate", "Advanced"] as const).map((lvl) => {
                        const selected = experienceLevel === lvl;
                        return (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setExperienceLevel(lvl)}
                            className={cn(
                              "rounded-2xl border p-4 text-left transition hover:shadow-sm",
                              selected
                                ? "border-primary/40 bg-primary/10"
                                : "border-border bg-card/70",
                            )}
                            data-testid={`button-level-${lvl}`}
                          >
                            <div className="font-medium">{lvl}</div>
                            <div className="mt-1 text-sm text-muted-foreground">
                              {lvl === "Beginner" && "New to the role or core skills."}
                              {lvl === "Intermediate" &&
                                "Some practice; ready to level up."}
                              {lvl === "Advanced" &&
                                "Optimizing depth, speed, and rigor."}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="rounded-2xl border bg-muted/40 p-4">
                      <div className="text-sm font-medium" data-testid="text-level-why">
                        Why this matters
                      </div>
                      <div
                        className="mt-1 text-sm text-muted-foreground"
                        data-testid="text-level-why-body"
                      >
                        We tune difficulty, pacing, and explanations to your experience
                        level.
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Weekly time budget</span>
                    </div>

                    <div className="rounded-2xl border bg-card/70 p-5">
                      <div className="flex items-baseline justify-between gap-4">
                        <Label data-testid="label-time">Hours per week</Label>
                        <div
                          className="display text-2xl font-semibold"
                          data-testid="text-time-value"
                        >
                          {timePerWeek}h
                        </div>
                      </div>
                      <div className="mt-4">
                        <Slider
                          value={[timePerWeek]}
                          onValueChange={(v) => setTimePerWeek(v[0] ?? 6)}
                          min={1}
                          max={20}
                          step={1}
                          data-testid="slider-time"
                        />
                      </div>
                      <div
                        className="mt-3 text-sm text-muted-foreground"
                        data-testid="text-time-hint"
                      >
                        We’ll keep your plan realistic: fewer hours = fewer tasks.
                      </div>
                    </div>

                    <div className="rounded-2xl border bg-muted/40 p-4">
                      <div className="text-sm font-medium" data-testid="text-time-why">
                        Why we ask
                      </div>
                      <div
                        className="mt-1 text-sm text-muted-foreground"
                        data-testid="text-time-why-body"
                      >
                        Your roadmap is optimized to fit your schedule — not overwhelm it.
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div
                    key="step-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      <span>What motivates you?</span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {INTERESTS.map((i) => {
                        const selected = interests.includes(i);
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => onToggleInterest(i)}
                            className={cn(
                              "rounded-2xl border px-4 py-3 text-left transition",
                              selected
                                ? "border-primary/40 bg-primary/10"
                                : "border-border bg-card/70 hover:bg-muted/60",
                            )}
                            data-testid={`button-interest-${i}`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="font-medium">{i}</div>
                              {selected && (
                                <Badge
                                  className="rounded-full"
                                  data-testid={`badge-interest-selected-${i}`}
                                >
                                  Selected
                                </Badge>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="rounded-2xl border bg-muted/40 p-4">
                      <div
                        className="text-sm font-medium"
                        data-testid="text-interests-why"
                      >
                        Why this matters
                      </div>
                      <div
                        className="mt-1 text-sm text-muted-foreground"
                        data-testid="text-interests-why-body"
                      >
                        We’ll recommend projects and examples aligned with your interests,
                        so learning feels relevant.
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 5 && (
                  <motion.div
                    key="step-5"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      <span>Quick self-assessment</span>
                    </div>

                    <div className="rounded-3xl border bg-card/70 p-4 sm:p-5">
                      <div
                        className="text-sm font-medium"
                        data-testid="text-skill-rating-title"
                      >
                        Rate yourself (1–5)
                      </div>
                      <div
                        className="mt-1 text-sm text-muted-foreground"
                        data-testid="text-skill-rating-subtitle"
                      >
                        This seeds your initial mastery scores. Don’t worry — assessments
                        will adapt your plan.
                      </div>

                      <div className="mt-4 space-y-4">
                        {activeSkills.map((skill: string) => {
                          const value = selfRatings[skill] ?? 3;
                          return (
                            <div
                              key={skill}
                              className="rounded-2xl border bg-muted/30 p-4"
                              data-testid={`card-skill-rating-${skill}`}
                            >
                              <div className="flex items-center justify-between gap-4">
                                <div className="font-medium" data-testid={`text-skill-${skill}`}>
                                  {skill}
                                </div>
                                <div
                                  className="text-sm text-muted-foreground"
                                  data-testid={`text-skill-rating-${skill}`}
                                >
                                  {value}/5
                                </div>
                              </div>

                              <div className="mt-3 flex items-center gap-2">
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="secondary"
                                  onClick={() => onChangeRating(skill, clamp(value - 1, 1, 5))}
                                  data-testid={`button-rating-dec-${skill}`}
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                </Button>

                                <div className="grid flex-1 grid-cols-5 gap-2">
                                  {[1, 2, 3, 4, 5].map((n) => {
                                    const selected = n === value;
                                    return (
                                      <button
                                        key={n}
                                        type="button"
                                        onClick={() => onChangeRating(skill, n)}
                                        className={cn(
                                          "h-10 rounded-xl border text-sm font-semibold transition",
                                          selected
                                            ? "border-primary/40 bg-primary/10 text-primary"
                                            : "border-border bg-card/70 hover:bg-muted/60",
                                        )}
                                        data-testid={`button-rating-${skill}-${n}`}
                                      >
                                        {n}
                                      </button>
                                    );
                                  })}
                                </div>

                                <Button
                                  type="button"
                                  size="icon"
                                  variant="secondary"
                                  onClick={() => onChangeRating(skill, clamp(value + 1, 1, 5))}
                                  data-testid={`button-rating-inc-${skill}`}
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>

                              <div
                                className="mt-3 text-xs text-muted-foreground"
                                data-testid={`text-skill-seed-${skill}`}
                              >
                                Seeds mastery ≈ <span className="font-medium">{ratingToMastery(value)}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-2xl border bg-muted/40 p-4">
                      <div className="text-sm font-medium" data-testid="text-skill-why">
                        Why we ask
                      </div>
                      <div
                        className="mt-1 text-sm text-muted-foreground"
                        data-testid="text-skill-why-body"
                      >
                        This gives you instant personalization: your roadmap starts by
                        strengthening the skills you rated lowest.
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 6 && (
                  <motion.div
                    key="step-6"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Sparkles className="h-4 w-4" />
                      <span>Diagnostic Assessment: {targetRole}</span>
                    </div>

                    <div className="rounded-2xl border bg-muted/40 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">
                            Question {currentQuestionIndex + 1} of {activeQuiz.length}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {Object.keys(quizAnswers).length} of {activeQuiz.length} answered
                          </div>
                        </div>
                        {Object.keys(quizAnswers).length === activeQuiz.length ? (
                          <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">
                            Complete ✓
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            {activeQuiz.length - Object.keys(quizAnswers).length} left
                          </Badge>
                        )}
                      </div>
                    </div>

                    {(() => {
                      const q = activeQuiz[currentQuestionIndex];
                      if (!q) return null;
                      const selectedAnswer = quizAnswers[q.id];

                      return (
                        <div className="space-y-4">
                          <div>
                            <div className="mb-2 flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {q.skill}
                              </Badge>
                              <Badge
                                variant={q.difficulty === "easy" ? "secondary" : q.difficulty === "medium" ? "default" : "destructive"}
                                className="text-xs"
                              >
                                {q.difficulty}
                              </Badge>
                            </div>
                            <Label className="text-base font-medium">
                              {q.question}
                            </Label>
                          </div>

                          <div className="space-y-2">
                            {q.options.map((option, idx) => {
                              const isSelected = selectedAnswer === idx;
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    setQuizAnswers(prev => ({ ...prev, [q.id]: idx }));
                                  }}
                                  className={cn(
                                    "w-full rounded-xl border p-4 text-left transition hover:shadow-sm",
                                    isSelected
                                      ? "border-primary/40 bg-primary/10"
                                      : "border-border bg-card/70"
                                  )}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className={cn(
                                      "mt-0.5 grid h-5 w-5 place-items-center rounded-full border-2 transition",
                                      isSelected
                                        ? "border-primary bg-primary"
                                        : "border-muted-foreground/30"
                                    )}>
                                      {isSelected && (
                                        <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                                      )}
                                    </div>
                                    <div className="flex-1 text-sm">{option}</div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          {selectedAnswer !== undefined && (
                            <div className="rounded-2xl border bg-muted/40 p-4">
                              <div className="text-sm font-medium">Explanation</div>
                              <div className="mt-1 text-sm text-muted-foreground">
                                {q.explanation}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-3 pt-4">
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                              disabled={currentQuestionIndex === 0}
                              size="sm"
                            >
                              <ChevronLeft className="h-4 w-4" />
                              Previous
                            </Button>

                            <div className="text-sm text-muted-foreground">
                              {currentQuestionIndex + 1} / {activeQuiz.length}
                            </div>

                            <Button
                              type="button"
                              onClick={() => setCurrentQuestionIndex(prev => Math.min(activeQuiz.length - 1, prev + 1))}
                              disabled={currentQuestionIndex === activeQuiz.length - 1}
                              size="sm"
                            >
                              Next
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="rounded-2xl border bg-muted/40 p-4">
                      <div className="text-sm font-medium">Why we ask</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        This diagnostic quiz provides evidence-based skill assessment instead of self-ratings, giving you accurate mastery scores to build your personalized learning path.
                        {Object.keys(quizAnswers).length < activeQuiz.length && (
                          <span className="mt-2 block font-medium text-amber-600">
                            ⚠️ Answer all {activeQuiz.length} questions to enable "Finish & Build Plan"
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-8 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={step === 1}
                className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
                data-testid="button-back"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>

              {step < totalSteps ? (
                <Button
                  type="button"
                  onClick={onNext}
                  disabled={!canNext}
                  className="rounded-xl bg-blue-900 text-white shadow-lg shadow-blue-900/20 hover:bg-blue-800"
                  data-testid="button-next"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={onFinish}
                  disabled={!canNext}
                  className="rounded-xl bg-blue-900 text-white shadow-lg shadow-blue-900/20 hover:bg-blue-800"
                  data-testid="button-finish"
                >
                  Finish & Build Plan
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-900 uppercase tracking-wider">
              <Sparkles className="h-4 w-4" />
              <span data-testid="text-preview-title">What you'll get</span>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                <div className="flex items-center gap-4">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-900 shadow-sm border border-blue-100">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900" data-testid="text-preview-1-title">
                      Personalized roadmap
                    </div>
                    <div
                      className="text-xs text-slate-600 leading-relaxed"
                      data-testid="text-preview-1-body"
                    >
                      Tasks are prioritized by your weakest skills and time budget.
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                <div className="flex items-center gap-4">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-900 shadow-sm border border-indigo-100">
                    <Brain className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900" data-testid="text-preview-2-title">
                      Explainable AI
                    </div>
                    <div
                      className="text-xs text-slate-600 leading-relaxed"
                      data-testid="text-preview-2-body"
                    >
                      Every task includes "Why this?" in plain, honest language.
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                <div className="flex items-center gap-4">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-50 text-sky-900 shadow-sm border border-sky-100">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900" data-testid="text-preview-3-title">
                      Mastery tracking
                    </div>
                    <div
                      className="text-xs text-slate-600 leading-relaxed"
                      data-testid="text-preview-3-body"
                    >
                      Skill scores update dynamically as you learn and self-assess.
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                <div className="flex items-center gap-4">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-900 shadow-sm border border-emerald-100">
                    <Wand2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900" data-testid="text-preview-4-title">
                      Career alignment
                    </div>
                    <div
                      className="text-xs text-slate-600 leading-relaxed"
                      data-testid="text-preview-4-body"
                    >
                      Your readiness score is computed from your target role requirements.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-2xl bg-blue-900 p-5 text-white shadow-lg shadow-blue-900/20">
              <div className="text-sm font-bold flex items-center gap-2" data-testid="text-preview-rule-title">
                <Sparkles className="h-4 w-4 text-blue-300" />
                Explainability Promise
              </div>
              <div
                className="mt-2 text-xs text-blue-100 leading-relaxed"
                data-testid="text-preview-rule-body"
              >
                You'll always see the logic behind every step: weakest skill, role relevance, and time fit.
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Shell>
  );
}
