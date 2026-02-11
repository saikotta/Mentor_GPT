import * as React from "react";
import { useLocation } from "wouter";
import {
  ArrowRight,
  BarChart3,
  Brain,
  Flame,
  Target,
  Wand2,
  Sparkles,
  Layout,
  Library,
  Terminal,
  FlaskConical,
  TrendingUp,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";

import {
  DEFAULT_SKILLS,
  useMentorStore,
  type LearningTask,
  ROLE_SKILLS,
} from "@/store/useMentorStore";

import { ROLE_REQUIREMENTS } from "@shared/roles";
import { AIDashboardInsights } from "@/components/AIDashboardInsights";

function masteryBadge(mastery: number) {
  if (mastery < 40) return "border-rose-500/20 bg-rose-200 text-rose-800";
  if (mastery < 70) return "border-amber-500/20 bg-amber-100 text-amber-800";
  return "border-emerald-500/20 bg-emerald-100 text-emerald-800";
}

function formatStatus(s: string) {
  return s.replaceAll("_", " ");
}

function unslugify(s: string) {
  return s.split('-').map(word => {
    if (word === 'and') return '&';
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const profile = useMentorStore((s) => s.userProfile);
  const skills = useMentorStore((s) => s.skills);
  const plan = useMentorStore((s) => s.learningPlan);
  const serverPath = useMentorStore((s) => s.serverPath);
  const pathLoading = useMentorStore((s) => s.pathLoading);
  const hydrateSkillsFromServer = useMentorStore((s) => s.hydrateSkillsFromServer);
  const hydrateLearningPathFromServer = useMentorStore((s) => s.hydrateLearningPathFromServer);
  const generatePlan = useMentorStore((s) => s.generatePlan);

  React.useEffect(() => {
    if (!profile) setLocation("/onboarding");
  }, [profile, setLocation]);

  React.useEffect(() => {
    // Hydrate skills and learning path from server on mount
    hydrateSkillsFromServer();
    hydrateLearningPathFromServer();
  }, [hydrateSkillsFromServer, hydrateLearningPathFromServer]);

  const role = profile?.targetRole ?? "Your role";

  // Role-specific insights and guidance
  const roleInsights: Record<string, { focus: string; tip: string; nextMilestone: string }> = {
    "Software Engineer": {
      focus: "Master algorithms and system design to build scalable applications",
      tip: "Practice coding daily on LeetCode or similar platforms",
      nextMilestone: "Build a full-stack project to showcase your skills"
    },
    "AI Engineer": {
      focus: "Develop expertise in ML algorithms and model deployment",
      tip: "Work on Kaggle competitions to gain practical experience",
      nextMilestone: "Deploy a machine learning model to production"
    },
    "Data Analyst": {
      focus: "Excel at data visualization and statistical analysis",
      tip: "Create a portfolio of data stories using real-world datasets",
      nextMilestone: "Build an interactive dashboard for business insights"
    },
    "Product Manager": {
      focus: "Balance user needs with technical feasibility and business goals",
      tip: "Study successful product launches and write case analyses",
      nextMilestone: "Lead a product feature from concept to launch"
    },
    "UX Designer": {
      focus: "Create user-centered designs backed by research and testing",
      tip: "Conduct usability tests and iterate based on feedback",
      nextMilestone: "Build a complete design system for a product"
    },
    "Cybersecurity Analyst": {
      focus: "Protect systems through proactive threat detection and response",
      tip: "Set up a home lab to practice penetration testing",
      nextMilestone: "Earn a security certification (e.g., CompTIA Security+)"
    }
  };

  const currentRoleInsight = role && roleInsights[role] ? roleInsights[role] : {
    focus: "Build skills aligned with your career goals",
    tip: "Complete your onboarding to get personalized recommendations",
    nextMilestone: "Define your target role and take the diagnostic quiz"
  };

  const relevantSkills = React.useMemo(() => {
    if (!profile?.targetRole) return [];
    const roleSkills = ROLE_SKILLS[profile.targetRole] || [];
    return skills.filter(s => roleSkills.includes(unslugify(s.skill)));
  }, [skills, profile?.targetRole]);

  const readiness = React.useMemo(() => {
    const source = relevantSkills.length ? relevantSkills : [];
    if (!source.length) return 0;
    const avg = source.reduce((sum, s) => sum + s.masteryScore, 0) / source.length;
    return Math.round(avg);
  }, [relevantSkills]);

  // Career fit score calculation
  const careerFitScore = React.useMemo(() => {
    if (!skills.length || !profile?.targetRole) return 0;

    const requirements = ROLE_REQUIREMENTS[profile.targetRole];
    if (!requirements) return Math.round(readiness); // Fallback to average mastery

    const gaps = skills.map((s) => {
      const required = requirements[s.skill] || 70;
      return Math.max(0, required - s.masteryScore);
    });

    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    return Math.round(Math.max(0, 100 - avgGap));
  }, [skills, profile?.targetRole, readiness]);

  const weakest = React.useMemo(() => {
    const sorted = [...relevantSkills].sort((a, b) => a.masteryScore - b.masteryScore);
    return sorted.slice(0, 2);
  }, [relevantSkills]);

  const week1 = plan?.[0];
  const tasks = (week1?.tasks ?? []).slice(0, 4);

  const resumeTask: LearningTask | undefined = React.useMemo(() => {
    const all = (plan ?? []).flatMap((w) => w.tasks);
    return all.find((t) => t.status !== "completed") ?? all[0];
  }, [plan]);

  // Radar chart data
  const radarData = React.useMemo(() => {
    if (!profile?.targetRole) return [];

    const requirements = ROLE_REQUIREMENTS[profile.targetRole];
    const roleSkills = ROLE_SKILLS[profile.targetRole] || [];
    if (!requirements) return [];

    // Use relevantSkills or fallback to zeroed role skills
    const source = relevantSkills.length
      ? relevantSkills
      : roleSkills.map(s => ({ skill: s, masteryScore: 0 }));

    return source.map((s) => {
      const humanName = unslugify(typeof s === 'string' ? s : s.skill);
      return {
        skill: humanName,
        current: Math.round(typeof s === 'string' ? 0 : s.masteryScore),
        target: requirements[humanName] || 70,
      };
    });
  }, [relevantSkills, profile?.targetRole]);

  const chartData = React.useMemo(() => {
    const roleSkills = profile?.targetRole ? ROLE_SKILLS[profile.targetRole] : [];

    const source = relevantSkills.length
      ? relevantSkills
      : roleSkills.map((s) => ({ skill: s, masteryScore: 0 }));

    return source.map((s) => ({
      skill: unslugify(typeof s === 'string' ? s : s.skill),
      mastery: Math.round(typeof s === 'string' ? 0 : s.masteryScore),
    }));
  }, [relevantSkills, profile?.targetRole]);

  const chartConfig = React.useMemo(
    () => ({
      mastery: {
        label: "Mastery",
        color: "hsl(var(--chart-1))",
      },
    }),
    [],
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-100/50 blur-3xl opacity-50" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-indigo-100/50 blur-3xl opacity-50" />
      </div>

      <div className="relative mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-8 sm:py-12">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-600 shadow-lg shadow-blue-900/20">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div
                    className="text-2xl font-semibold tracking-tight text-slate-900"
                    data-testid="text-dashboard-title"
                  >
                    Command Center
                  </div>
                  <div
                    className="text-sm text-slate-600"
                    data-testid="text-dashboard-subtitle"
                  >
                    Tracking your progress toward{" "}
                    <span className="font-medium text-blue-900">{role}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className="rounded-full bg-slate-200/50 px-3 py-1 text-slate-700 hover:bg-slate-200"
                data-testid="badge-readiness"
              >
                <Target className="mr-2 h-3.5 w-3.5" />
                Readiness: {readiness}%
              </Badge>
              <Badge
                variant={careerFitScore >= 70 ? "default" : "secondary"}
                className={`rounded-full px-3 py-1 ${careerFitScore >= 70 ? "bg-blue-900 text-white" : "bg-slate-200/50 text-slate-700"}`}
                data-testid="badge-career-fit"
              >
                <Wand2 className="mr-2 h-3.5 w-3.5" />
                Career Fit: {careerFitScore}%
              </Badge>
              <Badge
                variant="secondary"
                className="rounded-full bg-slate-200/50 px-3 py-1 text-slate-700"
                data-testid="badge-streak"
              >
                <Flame className="mr-2 h-3.5 w-3.5 text-amber-600" />
                Streak: 5
              </Badge>
              <Button
                type="button"
                variant="secondary"
                className="rounded-full bg-slate-200/50 text-slate-700 hover:bg-slate-200"
                onClick={() => setLocation("/learning-path")}
                data-testid="button-open-learning-path"
              >
                <Layout className="h-4 w-4" />
                Path
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="rounded-full bg-slate-200/50 text-slate-700 hover:bg-slate-200"
                onClick={() => setLocation("/resources")}
                data-testid="button-open-resources"
              >
                <Library className="h-4 w-4" />
                Library
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="rounded-full bg-slate-200/50 text-slate-700 hover:bg-slate-200"
                onClick={() => setLocation("/projects")}
                data-testid="button-open-projects"
              >
                <Terminal className="h-4 w-4" />
                Studio
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="rounded-full bg-slate-200/50 text-slate-700 hover:bg-slate-200"
                onClick={() => setLocation("/assessments")}
                data-testid="button-open-assessments"
              >
                <FlaskConical className="h-4 w-4" />
                Tests
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="rounded-full bg-slate-200/50 text-slate-700 hover:bg-slate-200"
                onClick={() => setLocation("/career-report")}
                data-testid="button-open-report"
              >
                <TrendingUp className="h-4 w-4" />
                Report
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="rounded-full bg-slate-200/50 text-slate-700 hover:bg-slate-200"
                onClick={() => setLocation("/skill-map")}
                data-testid="button-open-skill-map"
              >
                <BarChart3 className="h-4 w-4" />
                Skill map
              </Button>
            </div>
          </div>

          <div className="grid gap-10 lg:grid-cols-12">
            <Card className="rounded-3xl border-slate-200 bg-white p-8 shadow-sm lg:col-span-8 min-w-0">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div
                    className="text-sm text-slate-500"
                    data-testid="text-skill-overview-label"
                  >
                    Skill mastery overview
                  </div>
                  <div
                    className="mt-1 text-xl font-semibold text-slate-900"
                    data-testid="text-skill-overview-title"
                  >
                    Your current mastery
                  </div>
                </div>

                <div
                  className="text-xs text-slate-500"
                  data-testid="text-skill-overview-note"
                >
                  Focusing on: {weakest.map((w) => unslugify(w.skill)).join(", ")}
                </div>
              </div>

              <div className="mt-8 grid gap-10 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div
                      className="text-sm font-medium text-slate-900"
                      data-testid="text-chart-title"
                    >
                      Mastery vs. Target
                    </div>
                    <Badge
                      variant="secondary"
                      className="rounded-full bg-white text-xs text-slate-500"
                      data-testid="badge-chart-scale"
                    >
                      Score 0–100
                    </Badge>
                  </div>

                  <div className="mt-4 h-[400px]" data-testid="chart-skill-mastery">
                    {radarData.length > 0 ? (
                      <ChartContainer
                        config={{
                          current: {
                            label: "Current",
                            color: "#1E3A8A",
                          },
                          target: {
                            label: "Target",
                            color: "#38BDF8",
                          },
                        }}
                        className="h-full w-full"
                        data-testid="container-skill-chart"
                      >
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="#e2e8f0" />
                          <PolarAngleAxis
                            dataKey="skill"
                            tick={{ fontSize: 11, fill: "#64748b" }}
                          />
                          <PolarRadiusAxis
                            angle={90}
                            domain={[0, 100]}
                            tick={{ fontSize: 10, fill: "#94a3b8" }}
                            axisLine={false}
                          />
                          <Radar
                            name="Current"
                            dataKey="current"
                            stroke="#1E3A8A"
                            fill="#1E3A8A"
                            fillOpacity={0.5}
                          />
                          <Radar
                            name="Target"
                            dataKey="target"
                            stroke="#38BDF8"
                            fill="#38BDF8"
                            fillOpacity={0.2}
                          />
                          <ChartTooltip
                            content={
                              <ChartTooltipContent
                                indicator="line"
                                nameKey="skill"
                              />
                            }
                          />
                        </RadarChart>
                      </ChartContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-slate-400">
                        Complete onboarding to see your skill radar
                      </div>
                    )}
                  </div>

                  <div
                    className="mt-4 rounded-xl border border-slate-100 bg-white p-4"
                    data-testid="card-chart-explain"
                  >
                    <div
                      className="text-xs font-semibold uppercase tracking-wider text-slate-500"
                      data-testid="text-chart-explain-title"
                    >
                      Analysis
                    </div>
                    <div
                      className="mt-1 text-sm text-slate-600 leading-relaxed"
                      data-testid="text-chart-explain-body"
                    >
                      The radar chart shows your current mastery (deep blue) against target levels for {role} (light blue). Larger gaps indicate priority areas.
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-1">
                  {chartData.map((s, idx) => {
                    const isWeak = weakest.some((w) => w.skill === s.skill);
                    return (
                      <div
                        key={s.skill}
                        className={`rounded-2xl border p-4 transition duration-200 ${isWeak
                          ? "border-blue-200 bg-blue-50/30"
                          : "border-slate-100 bg-white"
                          }`}
                        data-testid={`row-skill-${idx}`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div
                            className="text-sm font-semibold text-slate-900"
                            data-testid={`text-skill-name-${idx}`}
                          >
                            {unslugify(s.skill)}
                          </div>
                          <Badge
                            className={`rounded-full ${masteryBadge(s.mastery)} shadow-none`}
                            data-testid={`badge-skill-score-${idx}`}
                          >
                            {s.mastery}%
                          </Badge>
                        </div>
                        <div className="mt-3">
                          <Progress
                            value={s.mastery}
                            className="h-1.5"
                            data-testid={`progress-skill-${idx}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            <div className="flex flex-col gap-6 lg:col-span-4 min-w-0">
              <Card className="rounded-3xl border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div
                      className="text-sm text-slate-500"
                      data-testid="text-weekly-plan-label"
                    >
                      Learning plan preview
                    </div>
                    <div
                      className="mt-1 text-xl font-semibold text-slate-900"
                      data-testid="text-weekly-plan-title"
                    >
                      This week
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="rounded-full border-blue-200 bg-blue-50 text-blue-800"
                    data-testid="badge-week"
                  >
                    Week {week1?.week ?? 1}
                  </Badge>
                </div>

                <div className="mt-6 space-y-3">
                  {pathLoading ? (
                    <div
                      className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500"
                      data-testid="loading-tasks"
                    >
                      <div className="animate-pulse">Loading your learning path...</div>
                    </div>
                  ) : tasks.length ? (
                    tasks.map((t) => (
                      <div
                        key={t.id}
                        className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 hover:border-blue-200 transition-colors"
                        data-testid={`card-task-${t.id}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div
                              className="text-sm font-semibold text-slate-900"
                              data-testid={`text-task-title-${t.id}`}
                            >
                              {t.title}
                            </div>
                            <div
                              className="mt-1 text-[10px] font-medium uppercase tracking-wider text-slate-500"
                              data-testid={`text-task-meta-${t.id}`}
                            >
                              {t.type} • {t.estimatedTime} min
                            </div>
                            {t.reason && (
                              <div className="mt-2 text-xs text-slate-400 italic">
                                {t.reason}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div
                      className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500"
                      data-testid="empty-week"
                    >
                      <p>No learning path yet.</p>
                      <Button
                        type="button"
                        onClick={() => generatePlan()}
                        className="mt-4 rounded-xl bg-blue-900 text-white hover:bg-blue-800"
                        disabled={pathLoading}
                      >
                        Generate Your Plan
                      </Button>
                    </div>
                  )}
                </div>

                {/* Path Rationale */}
                {serverPath?.rationale && (
                  <div className="mt-4 rounded-xl bg-blue-50 border border-blue-100 p-3">
                    <div className="text-xs font-medium text-blue-800 mb-1">AI Plan Rationale</div>
                    <div className="text-xs text-blue-700">{serverPath.rationale}</div>
                    {serverPath.version > 1 && (
                      <div className="mt-2 text-[10px] text-blue-500">
                        Plan version {serverPath.version} • Updated due to: {serverPath.triggeredBy}
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-6 flex flex-col gap-3">
                  <Button
                    type="button"
                    onClick={() => setLocation("/onboarding")}
                    variant="outline"
                    className="w-full rounded-2xl border-slate-200 text-slate-700 hover:bg-slate-50"
                    data-testid="button-edit-profile"
                  >
                    Adjust Goals
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setLocation("/learning-path")}
                    className="w-full rounded-2xl bg-blue-900 text-white shadow-lg shadow-blue-900/20 hover:bg-blue-800"
                    disabled={!resumeTask}
                    data-testid="button-resume"
                  >
                    Launch Roadmap
                    <Wand2 className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Card>

              <Card className="rounded-3xl border-slate-200 bg-blue-900 p-6 text-white shadow-lg">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-300 mb-3">
                  <Target className="h-4 w-4" />
                  {role} Focus
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-blue-400 mb-1">Your Path</div>
                    <div className="text-sm leading-relaxed text-blue-50">
                      {currentRoleInsight.focus}
                    </div>
                  </div>
                  <div className="border-t border-white/10 pt-4">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-blue-400 mb-1">Pro Tip</div>
                    <div className="text-sm leading-relaxed text-blue-50">
                      {currentRoleInsight.tip}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-amber-500/20 p-2">
                        <Sparkles className="h-4 w-4 text-amber-300" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold tracking-wider text-amber-300 mb-1">Next Milestone</div>
                        <div className="text-sm text-blue-50">
                          {currentRoleInsight.nextMilestone}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
