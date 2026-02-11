import { create } from "zustand";
import { ROLE_SKILLS } from "../../../shared/roles";
export { ROLE_SKILLS };

export type ExperienceLevel = "Beginner" | "Intermediate" | "Advanced";

export type User = {
  id: string;
  email: string;
};

export type UserProfile = {
  targetRole: string;
  experienceLevel: ExperienceLevel;
  timePerWeek: number;
  interests: string[];
  createdAt: number;
};

export type SkillState = {
  skill: string;
  masteryScore: number; // 0-100
  confidence: number; // 0-100
  lastUpdated: number;
};

export type LearningTaskType = "video" | "article" | "quiz" | "project";

export type LearningTaskStatus = "not_started" | "in_progress" | "completed";

export type LearningTask = {
  id: string;
  title: string;
  type: LearningTaskType;
  relatedSkills: string[];
  estimatedTime: number; // minutes
  status: LearningTaskStatus;
  reason: string;
};

export type LearningPlanWeek = {
  week: number;
  focus?: string;
  rationale?: string;
  tasks: LearningTask[];
};

export const DEFAULT_SKILLS = ROLE_SKILLS["Data Analyst"];

export type ServerLearningPath = {
  pathId: string;
  targetRole: string;
  horizonWeeks: number;
  status: string;
  version: number;
  rationale: string;
  triggeredBy: string;
  createdAt: string;
  updatedAt: string;
  weeks: LearningPlanWeek[];
};

type MentorState = {
  user: User | null;
  userProfile: UserProfile | null;
  skills: SkillState[];
  learningPlan: LearningPlanWeek[];
  serverPath: ServerLearningPath | null;
  pathLoading: boolean;
  pathError: string | null;

  setUser: (user: User | null) => void;
  clearUser: () => void;
  hydrateFromServer: () => Promise<void>;
  hydrateSkillsFromServer: () => Promise<void>;
  hydrateLearningPathFromServer: () => Promise<void>;
  setUserProfile: (profile: UserProfile) => void;
  setSkills: (skills: SkillState[]) => void;

  generatePlan: () => Promise<void>;
  updateTaskStatus: (taskId: string, status: LearningTaskStatus) => Promise<void>;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function stableId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function pickWeakest(skills: SkillState[], count: number) {
  return [...skills]
    .sort((a, b) => a.masteryScore - b.masteryScore)
    .slice(0, count);
}

function computeWeeklyCapacityMinutes(timePerWeekHours: number) {
  // Keep the prototype "reasonable" and consistent.
  const hours = clamp(timePerWeekHours, 1, 20);
  return hours * 60;
}

function recommendTasksForWeek(params: {
  week: number;
  role: string;
  timePerWeek: number;
  weakest: SkillState[];
  allSkills: SkillState[];
  interests: string[];
  experienceLevel: ExperienceLevel;
}) {
  const { week, role, timePerWeek, weakest, interests, experienceLevel } = params;
  const capacity = computeWeeklyCapacityMinutes(timePerWeek);

  const baseTasks: LearningTask[] = [];

  const focusSkills = weakest.length ? weakest : params.allSkills.slice(0, 2);

  const experienceModifier =
    experienceLevel === "Beginner" ? 1.0 : experienceLevel === "Intermediate" ? 0.9 : 0.85;

  // Rule: always include a quick concept task for the weakest skill
  focusSkills.slice(0, 2).forEach((s, idx) => {
    const t: LearningTask = {
      id: stableId(`w${week}_concept_${idx}`),
      title: `Explain ${s.skill} like I’m five`,
      type: "article",
      relatedSkills: [s.skill],
      estimatedTime: Math.round(20 * experienceModifier),
      status: "not_started",
      reason: `Your mastery in ${s.skill} is ${Math.round(s.masteryScore)}%, one of your lowest. Building foundations improves readiness for ${role}.`,
    };
    baseTasks.push(t);
  });

  // Rule: if mastery < 50, add practice task
  focusSkills
    .filter((s) => s.masteryScore < 50)
    .slice(0, 2)
    .forEach((s, idx) => {
      const t: LearningTask = {
        id: stableId(`w${week}_practice_${idx}`),
        title: `Practice: ${s.skill} mini-drills`,
        type: "quiz",
        relatedSkills: [s.skill],
        estimatedTime: Math.round(25 * experienceModifier),
        status: "not_started",
        reason: `Because ${s.skill} is below 50%, we’re adding focused practice to quickly raise your mastery.`,
      };
      baseTasks.push(t);
    });

  // Rule: add a small project aligned to interests
  const interest = interests[0] ?? "portfolio projects";
  baseTasks.push({
    id: stableId(`w${week}_project_0`),
    title: `Mini-project: ${role} scenario (${interest})`,
    type: "project",
    relatedSkills: focusSkills.slice(0, 2).map((s) => s.skill),
    estimatedTime: Math.round(60 * experienceModifier),
    status: "not_started",
    reason: `Projects make skills "stick". This one is aligned with ${interest} and uses your current focus skills for practical career relevance.`,
  });

  // Fit tasks to time budget (simple cut-off)
  const picked: LearningTask[] = [];
  let used = 0;
  for (const t of baseTasks) {
    if (used + t.estimatedTime <= capacity) {
      picked.push(t);
      used += t.estimatedTime;
    }
  }

  // Ensure at least 2 tasks even on very low time budgets
  if (picked.length < 2) return baseTasks.slice(0, 2);
  return picked;
}

export const useMentorStore = create<MentorState>((set, get) => ({
  user: null,
  userProfile: null,
  skills: [],
  learningPlan: [],
  serverPath: null,
  pathLoading: false,
  pathError: null,

  setUser: (user) => set({ user }),

  clearUser: () => set({ user: null, userProfile: null, skills: [], learningPlan: [], serverPath: null }),

  hydrateFromServer: async () => {
    try {
      const response = await fetch("/api/me", {
        credentials: "include",
      });

      if (response.ok) {
        const user = await response.json();
        set({ user });
      } else {
        set({ user: null });
      }
    } catch (error) {
      set({ user: null });
    }
  },

  hydrateSkillsFromServer: async () => {
    try {
      const response = await fetch("/api/user/skills", {
        credentials: "include",
      });

      if (response.ok) {
        const userSkills = await response.json();
        // Convert UserSkill[] to SkillState[]
        const skills: SkillState[] = userSkills.map((us: any) => ({
          skill: us.skillId,
          masteryScore: us.masteryScore,
          confidence: us.confidenceScore,
          lastUpdated: new Date(us.lastUpdated).getTime(),
        }));
        set({ skills });
      }
    } catch (error) {
      console.error("Failed to hydrate skills:", error);
    }
  },

  hydrateLearningPathFromServer: async () => {
    set({ pathLoading: true, pathError: null });
    try {
      const response = await fetch("/api/learning-path", {
        credentials: "include",
      });

      if (response.ok) {
        const pathData = await response.json();

        // Convert server format to client LearningPlanWeek format
        const learningPlan: LearningPlanWeek[] = pathData.weeks.map((w: any) => ({
          week: w.week,
          focus: w.focus,
          rationale: w.rationale,
          tasks: w.tasks.map((t: any) => ({
            id: t.id,
            title: t.title,
            type: mapTaskType(t.type),
            relatedSkills: t.skillId ? [t.skillId] : [],
            estimatedTime: t.estimatedTime,
            status: t.status as LearningTaskStatus,
            reason: t.reason || "",
          })),
        }));

        set({
          serverPath: pathData,
          learningPlan,
          pathLoading: false
        });
      } else if (response.status === 404) {
        // No path exists yet - that's okay
        set({ serverPath: null, learningPlan: [], pathLoading: false });
      } else {
        set({ pathError: "Failed to load learning path", pathLoading: false });
      }
    } catch (error) {
      console.error("Failed to hydrate learning path:", error);
      set({ pathError: "Failed to load learning path", pathLoading: false });
    }
  },

  setUserProfile: (profile) => set({ userProfile: profile }),
  setSkills: (skills) => set({ skills }),

  generatePlan: async () => {
    const { userProfile } = get();
    set({ pathLoading: true, pathError: null });

    try {
      const response = await fetch("/api/learning-path/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          horizonWeeks: 6,
          constraints: {
            timePerWeek: userProfile?.timePerWeek ?? 5,
            preferredFormats: ["concept", "practice", "project"]
          },
          triggeredBy: "user_initiated"
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate learning path");
      }

      const pathData = await response.json();

      // Convert server format to client LearningPlanWeek format
      const learningPlan: LearningPlanWeek[] = pathData.weeks.map((w: any) => ({
        week: w.week,
        focus: w.focus,
        rationale: w.rationale,
        tasks: w.tasks.map((t: any) => ({
          id: t.id,
          title: t.title,
          type: mapTaskType(t.type),
          relatedSkills: t.skillId ? [t.skillId] : [],
          estimatedTime: t.estimatedTime,
          status: t.status as LearningTaskStatus,
          reason: t.reason || "",
        })),
      }));

      set({
        serverPath: {
          pathId: pathData.pathId,
          targetRole: userProfile?.targetRole || "",
          horizonWeeks: pathData.horizonWeeks,
          status: pathData.status,
          version: pathData.version,
          rationale: pathData.rationale,
          triggeredBy: "user_initiated",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          weeks: learningPlan
        },
        learningPlan,
        pathLoading: false
      });
    } catch (error: any) {
      console.error("Failed to generate learning path:", error);
      set({ pathError: error.message, pathLoading: false });
    }
  },

  updateTaskStatus: async (taskId, status) => {
    // Optimistic update
    const { learningPlan } = get();
    const next = learningPlan.map((w) => ({
      ...w,
      tasks: w.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
    }));
    set({ learningPlan: next });

    // Persist to server
    try {
      await fetch(`/api/learning-path/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
    } catch (error) {
      console.error("Failed to update task status:", error);
      // Revert optimistic update on failure
      set({ learningPlan });
    }
  },
}));

// Helper to map server task types to client task types
function mapTaskType(serverType: string): LearningTaskType {
  const typeMap: Record<string, LearningTaskType> = {
    concept: "article",
    practice: "quiz",
    project: "project",
    reinforcement: "article",
    learn: "article",
  };
  return typeMap[serverType] || "article";
}
