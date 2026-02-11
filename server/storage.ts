import {
  type User, type InsertUser,
  type Profile, type InsertProfile,
  type Skill, type SkillPrerequisite,
  type UserSkill, type LearningPath,
  type PathWeek, type PathTask,
  type Resource, type ResourceSkill,
  type ResourceFeedback,
  type Question, type Assessment,
  type AssessmentAttempt,
  type Rubric, type ProjectSubmission,
  type EvaluationResult,
  type Recommendation, type RecommendationExperiment,
  type Notification, type NotificationPreference,
  type EventLog, type FunnelStep, type MetricSnapshot
} from "@shared/schema";
import { randomUUID } from "crypto";
import { EventEmitter } from "events";
import { ROLE_SKILLS } from "../shared/roles";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Profile methods
  getProfile(userId: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile & { userId: string }): Promise<Profile>;
  updateProfile(userId: string, profile: Partial<InsertProfile>): Promise<Profile>;

  // Skill Graph methods
  getSkills(): Promise<Skill[]>;
  getSkill(id: string): Promise<Skill | undefined>;
  getPrerequisites(skillId: string): Promise<SkillPrerequisite[]>;

  // User Skill Mastery
  getUserSkills(userId: string): Promise<UserSkill[]>;
  getUserSkill(userId: string, skillId: string): Promise<UserSkill | undefined>;
  updateSkillMastery(userId: string, skillId: string, performance: number, weight: number): Promise<UserSkill>;
  inferSkillMastery(userId: string, events: any[]): Promise<UserSkill[]>;
  checkPrerequisites(userId: string, skillId: string): Promise<{ met: boolean; unmet: any[] }>;

  // Learning Path methods
  getLearningPath(userId: string): Promise<LearningPath | undefined>;
  getLearningPathById(pathId: string): Promise<LearningPath | undefined>;
  getPathWeeks(pathId: string): Promise<PathWeek[]>;
  getPathTasks(weekId: string): Promise<PathTask[]>;
  getAllPathTasks(pathId: string): Promise<PathTask[]>;
  generatePath(userId: string, options?: {
    horizonWeeks?: number;
    constraints?: { timePerWeek?: number; preferredFormats?: string[] };
    triggeredBy?: string;
  }): Promise<{ path: LearningPath; weeks: any[]; rationale: string }>;
  updateTaskStatus(taskId: string, status: string): Promise<PathTask>;
  shouldRegeneratePath(userId: string, eventType: string, payload?: any): Promise<boolean>;
  getCompletedTaskCount(userId: string): Promise<number>;

  // Resource methods
  getResources(): Promise<Resource[]>;
  getResource(id: string): Promise<Resource | undefined>;
  getResourceSkills(resourceId: string): Promise<ResourceSkill[]>;
  submitFeedback(feedback: Omit<ResourceFeedback, "id" | "createdAt">): Promise<ResourceFeedback>;

  // Assessment methods
  getQuestions(skillId: string, difficulty: string): Promise<Question[]>;
  startAssessment(userId: string, skillId: string): Promise<Assessment>;
  submitAssessment(assessmentId: string, responses: { questionId: string; userAnswer: string }[]): Promise<Assessment>;
  getAssessment(id: string): Promise<Assessment | undefined>;
  getAssessmentAttempts(assessmentId: string): Promise<AssessmentAttempt[]>;

  // Project Evaluation methods
  getRubric(projectId: string): Promise<Rubric | undefined>;
  submitProject(userId: string, projectId: string, type: string, reference: string): Promise<ProjectSubmission>;
  evaluateProject(submissionId: string): Promise<EvaluationResult>;
  getEvaluation(submissionId: string): Promise<EvaluationResult | undefined>;

  // Recommendation methods
  getRecommendations(userId: string, type: "skill" | "resource" | "project"): Promise<Recommendation[]>;
  generateHybridRecommendations(userId: string, timeBudget: number): Promise<Recommendation[]>;
  updateRecommendationStatus(id: string, status: string): Promise<Recommendation>;

  // Notification methods
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notif: Omit<Notification, "id" | "status" | "sentAt">): Promise<Notification>;
  getNotificationPreferences(userId: string): Promise<NotificationPreference>;
  updateNotificationPreferences(userId: string, update: Partial<NotificationPreference>): Promise<NotificationPreference>;

  // Analytics & Logging methods
  logEvent(userId: string | null, type: string, service: string, payload: any): Promise<EventLog>;
  trackFunnelStep(userId: string, funnel: string, step: string): Promise<FunnelStep>;
  getUserSummary(userId: string): Promise<any>;
  createMetricSnapshot(name: string, value: number, entityId?: string): Promise<MetricSnapshot>;
}

export class MemStorage extends EventEmitter implements IStorage {
  private users: Map<string, User>;
  private profiles: Map<string, Profile>;
  private skills: Map<string, Skill>;
  private prerequisites: Map<string, SkillPrerequisite>;
  private userSkills: Map<string, UserSkill>;
  private learningPaths: Map<string, LearningPath>;
  private pathWeeks: Map<string, PathWeek>;
  private pathTasks: Map<string, PathTask>;
  private resources: Map<string, Resource>;
  private resourceSkills: Map<string, ResourceSkill>;
  private resourceFeedback: Map<string, ResourceFeedback>;
  private questions: Map<string, Question>;
  private assessments: Map<string, Assessment>;
  private assessmentAttempts: Map<string, AssessmentAttempt>;
  private rubrics: Map<string, Rubric>;
  private projectSubmissions: Map<string, ProjectSubmission>;
  private evaluationResults: Map<string, EvaluationResult>;
  private recommendations: Map<string, Recommendation>;
  private experiments: Map<string, RecommendationExperiment>;
  private notifications: Map<string, Notification>;
  private notificationPreferences: Map<string, NotificationPreference>;
  private eventLogs: Map<string, EventLog>;
  private funnelSteps: Map<string, FunnelStep>;
  private metricSnapshots: Map<string, MetricSnapshot>;

  constructor() {
    super();
    this.users = new Map();
    this.profiles = new Map();
    this.skills = new Map();
    this.prerequisites = new Map();
    this.userSkills = new Map();
    this.learningPaths = new Map();
    this.pathWeeks = new Map();
    this.pathTasks = new Map();
    this.resources = new Map();
    this.resourceSkills = new Map();
    this.resourceFeedback = new Map();
    this.questions = new Map();
    this.assessments = new Map();
    this.assessmentAttempts = new Map();
    this.rubrics = new Map();
    this.projectSubmissions = new Map();
    this.evaluationResults = new Map();
    this.recommendations = new Map();
    this.experiments = new Map();
    this.notifications = new Map();
    this.notificationPreferences = new Map();
    this.eventLogs = new Map();
    this.funnelSteps = new Map();
    this.metricSnapshots = new Map();

    // Setup Event Listeners for Recommendation Refresh
    this.on("TASK_COMPLETED", (userId) => this.refreshRecommendations(userId));
    this.on("ASSESSMENT_COMPLETED", (userId) => this.refreshRecommendations(userId));
    this.on("PROJECT_EVALUATED", (userId) => this.refreshRecommendations(userId));

    // Seed data
    this.seedSkills();
    this.seedResources();
    this.seedQuestions();
    this.seedRubrics();
    this.seedExperiments();
  }

  private seedExperiments() {
    const e1: RecommendationExperiment = { id: "ex1", name: "Hybrid Adaptive v1", strategy: "hybrid_v1", trafficSplit: 100, isActive: true };
    this.experiments.set(e1.id, e1);
  }

  private seedSkills() {
    // Collect all unique skills across all roles
    const allSkills = new Set<string>();
    Object.values(ROLE_SKILLS).forEach((skills: string[]) => {
      skills.forEach((s: string) => allSkills.add(s));
    });

    // Seed all skills
    allSkills.forEach(skillName => {
      const id = skillName.toLowerCase().replace(/ /g, "-").replace(/&/g, "and");
      const domain = this.inferDomain(skillName);
      const skill: Skill = {
        id,
        name: skillName,
        parentId: null,
        domain,
        difficulty: "Beginner",
        careerWeight: this.inferWeight(skillName)
      };
      this.skills.set(id, skill);
    });

    // Add some dependencies for "Software Engineer" as example
    this.addPrereq("backend-development", "data-structures-and-algorithms", 60);
    this.addPrereq("system-design", "backend-development", 70);
  }

  private inferDomain(skill: string): string {
    if (skill.includes("SQL") || skill.includes("Data") || skill.includes("Analytics") || skill.includes("Statistics")) return "Data";
    if (skill.includes("Design") || skill.includes("UX") || skill.includes("Visual") || skill.includes("Architecture")) return "Design";
    if (skill.includes("Security") || skill.includes("Network") || skill.includes("Threat")) return "Security";
    if (skill.includes("Product") || skill.includes("Strategy") || skill.includes("Specs")) return "Product";
    return "Programming";
  }

  private inferWeight(skill: string): number {
    if (skill.includes("Design") || skill.includes("Structures") || skill.includes("Strategy") || skill.includes("Security")) return 9;
    if (skill.includes("Python") || skill.includes("SQL") || skill.includes("Machine")) return 8;
    return 7;
  }

  private addPrereq(skillId: string, prereqId: string, minMastery: number) {
    const id = randomUUID();
    this.prerequisites.set(id, { id, skillId, prerequisiteId: prereqId, minMastery });
  }

  private seedResources() {
    const data: Array<{ id: string; title: string; type: string; difficulty: string; time: number; source: string; skill: string }> = [
      // Software Engineer
      { id: "r_swe_1", title: "Mastering Data Structures", type: "course", difficulty: "Beginner", time: 300, source: "Coursera", skill: "data-structures-and-algorithms" },
      { id: "r_swe_2", title: "Express.js Mastery", type: "article", difficulty: "Intermediate", time: 45, source: "Medium", skill: "backend-development" },
      { id: "r_swe_3", title: "System Design Interview Prep", type: "video", difficulty: "Advanced", time: 120, source: "YouTube", skill: "system-design" },

      // UX Designer
      { id: "r_ux_1", title: "User Research 101", type: "article", difficulty: "Beginner", time: 20, source: "NN/g", skill: "user-research" },
      { id: "r_ux_2", title: "Visual Design Principles", type: "video", difficulty: "Beginner", time: 60, source: "Skillshare", skill: "visual-design" },
      { id: "r_ux_3", title: "Information Architecture Basics", type: "book", difficulty: "Intermediate", time: 120, source: "O'Reilly", skill: "information-architecture" },
      { id: "r_ux_4", title: "Usability Testing Guide", type: "practice", difficulty: "Intermediate", time: 45, source: "Coursera", skill: "usability-testing" },
      { id: "r_ux_5", title: "Advanced User Research", type: "project", difficulty: "Advanced", time: 180, source: "UxCel", skill: "user-research" },
      { id: "r_ux_6", title: "Design Systems & Tokens", type: "video", difficulty: "Advanced", time: 90, source: "Figma", skill: "visual-design" },

      // AI Engineer
      { id: "r_ai_1", title: "Deep Learning Specialization", type: "course", difficulty: "Advanced", time: 600, source: "DeepLearning.AI", skill: "deep-learning" },
      { id: "r_ai_2", title: "MLOps Best Practices", type: "article", difficulty: "Intermediate", time: 30, source: "TowardsDataScience", skill: "mlops-and-deployment" },
      { id: "r_ai_3", title: "Mathematical Foundations for ML", type: "book", difficulty: "Beginner", time: 240, source: "Pearson", skill: "mathematical-foundations" },
      { id: "r_ai_4", title: "Machine Learning Projects", type: "project", difficulty: "Intermediate", time: 300, source: "Kaggle", skill: "machine-learning" },

      // Product Manager
      { id: "r_pm_1", title: "Product Strategy Frameworks", type: "video", difficulty: "Intermediate", time: 40, source: "Reforge", skill: "product-strategy" },
      { id: "r_pm_2", title: "Writing Great Tech Specs", type: "article", difficulty: "Beginner", time: 15, source: "Intercom", skill: "technical-specs" },

      // Data Analyst
      { id: "r_da_1", title: "SQL for Analytics", type: "practice", difficulty: "Intermediate", time: 60, source: "MentorGPT", skill: "sql-proficiency" },
      { id: "r_da_2", title: "Statistical Analysis in Python", type: "course", difficulty: "Intermediate", time: 180, source: "DataCamp", skill: "statistical-analysis" },
      { id: "r_da_3", title: "Data Visualization with Tableau", type: "project", difficulty: "Beginner", time: 120, source: "Tableau", skill: "data-visualization" },
      { id: "r_da_4", title: "Advanced Python for Data", type: "video", difficulty: "Advanced", time: 90, source: "RealPython", skill: "python-for-data" },

      // Software Engineer
      { id: "r_swe_4", title: "Frontend Frameworks Deep Dive", type: "course", difficulty: "Intermediate", time: 300, source: "FrontendMasters", skill: "frontend-development" },
      { id: "r_swe_5", title: "System Design for Scale", type: "article", difficulty: "Advanced", time: 45, source: "HighScalability", skill: "system-design" },

      // Cybersecurity Analyst
      { id: "r_cyb_1", title: "Network Security Fundamentals", type: "course", difficulty: "Beginner", time: 240, source: "Cybrary", skill: "network-security" },
      { id: "r_cyb_2", title: "Threat Analysis Techniques", type: "article", difficulty: "Intermediate", time: 30, source: "SANS", skill: "threat-analysis" },
      { id: "r_cyb_3", title: "SOC Operations Guide", type: "video", difficulty: "Intermediate", time: 60, source: "YouTube", skill: "soc-operations" },
      { id: "r_cyb_4", title: "Security Compliance Standards", type: "article", difficulty: "Beginner", time: 45, source: "NIST", skill: "security-compliance" },
      { id: "r_cyb_5", title: "Penetration Testing Lab", type: "project", difficulty: "Advanced", time: 180, source: "HackTheBox", skill: "threat-analysis" },

    ];

    data.forEach(d => {
      const r: Resource = {
        id: d.id,
        title: d.title,
        description: `Comprehensive ${d.type} on ${d.title}`,
        type: d.type as any,
        difficulty: d.difficulty as any,
        estimatedTime: d.time,
        source: d.source,
        url: `https://example.com/${d.id}`,
        qualityScore: 85 + Math.floor(Math.random() * 15)
      };
      this.resources.set(r.id, r);
      this.resourceSkills.set(`rs_${d.id}`, { id: `rs_${d.id}`, resourceId: d.id, skillId: d.skill, weight: 8 });
    });
  }

  private seedQuestions() {
    const q1: Question = { id: "q1", skillId: "sql-basics", type: "mcq", difficulty: "Beginner", content: { text: "Which SQL clause filters records?", options: ["S", "W", "O", "G"] }, correctAnswer: "W", explanation: "WHERE filters." };
    const q2: Question = { id: "q2", skillId: "sql-joins", type: "mcq", difficulty: "Intermediate", content: { text: "Which join returns all left records?", options: ["I", "L", "R", "F"] }, correctAnswer: "L", explanation: "LEFT JOIN returns all left." };
    this.questions.set(q1.id, q1);
    this.questions.set(q2.id, q2);
  }

  private seedRubrics() {
    const r1: Rubric = {
      id: "rub1",
      projectId: "sql-dashboard-project",
      criteria: [
        { category: "Functionality", weight: 40, guidelines: "Proper join usage and correct filters." },
        { category: "Design", weight: 30, guidelines: "Visual clarity and efficient query structure." },
        { category: "Documentation", weight: 30, guidelines: "Comments and README explanation." }
      ]
    };
    this.rubrics.set(r1.id, r1);
  }

  async getUser(id: string): Promise<User | undefined> { return this.users.get(id); }
  async getUserByEmail(email: string): Promise<User | undefined> { return Array.from(this.users.values()).find(u => u.email === email); }
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id, role: "student", createdAt: new Date(), lastLogin: null };
    this.users.set(id, user);
    return user;
  }

  async getProfile(userId: string): Promise<Profile | undefined> { return Array.from(this.profiles.values()).find(p => p.userId === userId); }
  async createProfile(insertProfile: InsertProfile & { userId: string }): Promise<Profile> {
    const id = randomUUID();
    const profile: Profile = { ...insertProfile, id, skillInterests: insertProfile.skillInterests || [], availability: insertProfile.availability || 5, learningPreference: insertProfile.learningPreference || "mixed", pace: insertProfile.pace || "balanced", isPublic: insertProfile.isPublic || false };
    this.profiles.set(id, profile);
    return profile;
  }
  async updateProfile(userId: string, update: Partial<InsertProfile>): Promise<Profile> {
    const existing = await this.getProfile(userId);
    if (!existing) throw new Error("404");
    const updated = { ...existing, ...update };
    this.profiles.set(existing.id, updated);
    return updated;
  }

  async getSkills(): Promise<Skill[]> { return Array.from(this.skills.values()); }
  async getSkill(id: string): Promise<Skill | undefined> { return this.skills.get(id); }
  async getPrerequisites(skillId: string): Promise<SkillPrerequisite[]> { return Array.from(this.prerequisites.values()).filter(p => p.skillId === skillId); }
  async getUserSkills(userId: string): Promise<UserSkill[]> { return Array.from(this.userSkills.values()).filter(us => us.userId === userId); }
  async getUserSkill(userId: string, skillId: string): Promise<UserSkill | undefined> { return Array.from(this.userSkills.values()).find(us => us.userId === userId && us.skillId === skillId); }

  async updateSkillMastery(userId: string, skillId: string, performance: number, weight: number): Promise<UserSkill> {
    const existing = await this.getUserSkill(userId, skillId);
    let newScore: number;
    let newConfidence: number;
    if (existing) {
      const lr = (weight / 100) * (1 + (100 - existing.confidenceScore) / 200);
      newScore = Math.round((existing.masteryScore * (1 - lr)) + (performance * lr));
      newConfidence = Math.min(100, existing.confidenceScore + Math.round(weight / 2));
    } else {
      newScore = performance; newConfidence = Math.round(weight);
    }
    const level = newScore >= 80 ? "Advanced" : newScore >= 50 ? "Intermediate" : "Beginner";
    const us: UserSkill = {
      id: existing?.id || randomUUID(),
      userId,
      skillId,
      masteryScore: Math.max(0, Math.min(100, newScore)),
      confidenceScore: newConfidence,
      level,
      lastUpdated: new Date(),
      evidenceJson: null
    };
    this.userSkills.set(us.id, us);
    return us;
  }

  async inferSkillMastery(userId: string, events: any[]): Promise<UserSkill[]> {
    const updatedSkills: UserSkill[] = [];

    for (const event of events) {
      const { skillId, type, score, rubricScore, attempts = 1, difficulty = "Beginner" } = event;
      const existing = await this.getUserSkill(userId, skillId);

      let evidenceScore = 0;
      let alpha = 0.1;

      if (type === "quiz") {
        evidenceScore = score * (1 / Math.sqrt(attempts));
        alpha = difficulty === "Advanced" ? 0.25 : difficulty === "Intermediate" ? 0.2 : 0.15;
      } else if (type === "project") {
        evidenceScore = rubricScore;
        alpha = 0.4;
      } else if (type === "assessment") {
        evidenceScore = score;
        alpha = 0.5;
      } else if (type === "diagnostic") {
        // Diagnostic is the initial baseline - use score directly with high weight
        evidenceScore = score;
        alpha = 1.0; // Full weight for initial diagnostic since there's no prior data
      }

      const oldMastery = existing?.masteryScore || 0;
      const newMastery = Math.round((alpha * evidenceScore * 100) + (1 - alpha) * oldMastery);
      let oldConfidence = existing?.confidenceScore || 0;

      if (existing) {
        const daysSinceUpdate = (new Date().getTime() - existing.lastUpdated.getTime()) / (1000 * 3600 * 24);
        if (daysSinceUpdate > 14) {
          oldConfidence = Math.max(0, oldConfidence - Math.floor(daysSinceUpdate));
        }
      }

      const confidenceBoost = type === "project" ? 15 : type === "assessment" ? 20 : type === "diagnostic" ? 30 : 10;
      const newConfidence = Math.min(100, oldConfidence + confidenceBoost);
      const level = newMastery >= 80 ? "Advanced" : newMastery >= 50 ? "Intermediate" : "Beginner";
      const explanation = this.generateExplanation(type, newMastery - oldMastery, skillId);

      const us: UserSkill = {
        id: existing?.id || randomUUID(),
        userId,
        skillId,
        masteryScore: Math.max(0, Math.min(100, newMastery)),
        confidenceScore: newConfidence,
        level,
        lastUpdated: new Date(),
        evidenceJson: {
          lastEvent: { type, score: evidenceScore, weight: alpha },
          explanation,
          historyDelta: newMastery - oldMastery
        }
      };

      this.userSkills.set(us.id, us);
      updatedSkills.push(us);
      this.emit("MASTERY_UPDATED", userId, us);
    }
    return updatedSkills;
  }

  private generateExplanation(type: string, delta: number, skillId: string): string {
    const trend = delta > 0 ? "increased" : delta < 0 ? "refined" : "maintained";
    const source = type === "quiz" ? "consistent quiz performance" :
      type === "project" ? "successful project application" :
        type === "diagnostic" ? "initial diagnostic assessment" :
          "formal assessment verification";
    return `Your ${skillId} mastery ${trend} because of ${source}.`;
  }

  async checkPrerequisites(userId: string, skillId: string): Promise<{ met: boolean; unmet: any[] }> {
    const prereqs = await this.getPrerequisites(skillId);
    const unmet = [];
    for (const p of prereqs) {
      const us = await this.getUserSkill(userId, p.prerequisiteId);
      if (!us || us.masteryScore < p.minMastery) {
        const s = await this.getSkill(p.prerequisiteId);
        unmet.push({ skillId: p.prerequisiteId, name: s?.name, current: us?.masteryScore || 0, required: p.minMastery });
      }
    }
    return { met: unmet.length === 0, unmet };
  }

  async getLearningPath(userId: string): Promise<LearningPath | undefined> { return Array.from(this.learningPaths.values()).find(lp => lp.userId === userId && lp.status === "active"); }
  async getLearningPathById(pathId: string): Promise<LearningPath | undefined> { return this.learningPaths.get(pathId); }
  async getPathWeeks(pathId: string): Promise<PathWeek[]> { return Array.from(this.pathWeeks.values()).filter(pw => pw.pathId === pathId).sort((a, b) => a.weekNumber - b.weekNumber); }
  async getPathTasks(weekId: string): Promise<PathTask[]> { return Array.from(this.pathTasks.values()).filter(pt => pt.weekId === weekId).sort((a, b) => (a.priority || 1) - (b.priority || 1)); }
  async getAllPathTasks(pathId: string): Promise<PathTask[]> {
    const weeks = await this.getPathWeeks(pathId);
    const tasks: PathTask[] = [];
    for (const w of weeks) {
      const weekTasks = await this.getPathTasks(w.id);
      tasks.push(...weekTasks);
    }
    return tasks;
  }
  async getCompletedTaskCount(userId: string): Promise<number> {
    const allPaths = Array.from(this.learningPaths.values()).filter(p => p.userId === userId);
    let count = 0;
    for (const p of allPaths) {
      const tasks = await this.getAllPathTasks(p.id);
      count += tasks.filter(t => t.status === "completed").length;
    }
    return count;
  }

  /**
   * LEARNING PATH ENGINE
   * 
   * A production-grade, server-driven, adaptive learning path generator
   * that integrates with Skill Inference Engine and Recommendation Engine.
   */
  async generatePath(userId: string, options?: {
    horizonWeeks?: number;
    constraints?: { timePerWeek?: number; preferredFormats?: string[] };
    triggeredBy?: string;
  }): Promise<{ path: LearningPath; weeks: any[]; rationale: string }> {
    const profile = await this.getProfile(userId);
    if (!profile) throw new Error("Profile not found - complete onboarding first");

    // ========================================
    // 1️⃣ GATHER DATA SOURCES
    // ========================================
    const allSkillsRaw = await this.getSkills();

    // Filter skills based on user's target role
    const targetRole = profile.careerGoal;
    const roleSkills = targetRole ? ROLE_SKILLS[targetRole] : null;

    const allSkills = roleSkills
      ? allSkillsRaw.filter(s => {
        // Check if skill name matches or is included in role skills
        return roleSkills.includes(s.name) || roleSkills.some(rs => rs.toLowerCase() === s.name.toLowerCase());
      })
      : allSkillsRaw;

    // If no skills found for role, fallback to showing all (safety mechanism)
    if (allSkills.length === 0 && roleSkills) {
      console.warn(`No skills found matching role ${targetRole}, falling back to all skills.`);
      allSkills.push(...allSkillsRaw);
    }
    const userSkills = await this.getUserSkills(userId);
    const completedTasks = await this.getCompletedTaskCount(userId);
    const recommendations = await this.getRecommendations(userId, "skill");

    // Build skill lookup maps
    const userSkillMap = new Map(userSkills.map(us => [us.skillId, us]));
    const skillMap = new Map(allSkills.map(s => [s.id, s]));

    // Get prerequisites for each skill
    const prereqMap = new Map<string, SkillPrerequisite[]>();
    for (const skill of allSkills) {
      const prereqs = await this.getPrerequisites(skill.id);
      prereqMap.set(skill.id, prereqs);
    }

    // ========================================
    // 2️⃣ DYNAMIC HORIZON SELECTION
    // ========================================
    const timePerWeek = options?.constraints?.timePerWeek ?? profile.availability ?? 5;
    let horizonWeeks = options?.horizonWeeks ?? 6;
    let horizonRationale = "";

    // Adjust horizon based on user behavior and time budget
    if (timePerWeek < 3) {
      horizonWeeks = 4;
      horizonRationale = "Shortened to 4 weeks due to limited weekly time budget";
    } else if (completedTasks > 20 && profile.pace === "fast") {
      horizonWeeks = 8;
      horizonRationale = "Extended to 8 weeks for consistent high-engagement learner";
    } else if (completedTasks < 5 && userSkills.length > 0) {
      horizonWeeks = 4;
      horizonRationale = "Shortened to 4 weeks to reduce dropout risk for new learner";
    } else {
      horizonRationale = "Standard 6-week horizon for balanced learning pace";
    }

    // Clamp to valid range
    horizonWeeks = Math.max(4, Math.min(8, horizonWeeks));

    // ========================================
    // 3️⃣ SKILL PRIORITIZATION
    // ========================================
    type ScoredSkill = {
      skill: Skill;
      userSkill: UserSkill | undefined;
      priority: number;
      reasons: string[];
    };

    const scoredSkills: ScoredSkill[] = allSkills.map(skill => {
      const us = userSkillMap.get(skill.id);
      const mastery = us?.masteryScore ?? 0;
      const confidence = us?.confidenceScore ?? 0;
      let priority = 0;
      const reasons: string[] = [];

      // Career weight (0-30 points)
      priority += skill.careerWeight * 3;
      if (skill.careerWeight >= 8) reasons.push("career-critical");

      // Mastery gap (0-40 points) - lower mastery = higher priority
      const masteryGap = 100 - mastery;
      priority += masteryGap * 0.4;
      if (mastery < 40) reasons.push("low mastery");

      // Confidence penalty (0-20 points) - low confidence = higher priority
      if (confidence < 50) {
        priority += (50 - confidence) * 0.4;
        reasons.push("unstable confidence");
      }

      // Boost if in recommendations
      const isRecommended = recommendations.some(r => r.targetId === skill.id);
      if (isRecommended) {
        priority += 15;
        reasons.push("AI-recommended");
      }

      // Already mastered penalty
      if (mastery >= 80) {
        priority -= 50;
      }

      return { skill, userSkill: us, priority, reasons };
    });

    // Sort by priority (highest first)
    scoredSkills.sort((a, b) => b.priority - a.priority);

    // ========================================
    // 4️⃣ PREREQUISITE-AWARE SKILL ORDERING
    // ========================================
    const orderedSkills: ScoredSkill[] = [];
    const addedSkillIds = new Set<string>();

    const canAddSkill = (skillId: string): boolean => {
      const prereqs = prereqMap.get(skillId) || [];
      for (const p of prereqs) {
        const prereqMastery = userSkillMap.get(p.prerequisiteId)?.masteryScore ?? 0;
        if (prereqMastery < p.minMastery && !addedSkillIds.has(p.prerequisiteId)) {
          return false;
        }
      }
      return true;
    };

    // Add skills respecting prerequisites
    for (const scored of scoredSkills) {
      if (scored.priority < 0) continue; // Skip already-mastered skills

      // Check if prerequisites are met or will be added
      const prereqs = prereqMap.get(scored.skill.id) || [];
      for (const p of prereqs) {
        const prereqMastery = userSkillMap.get(p.prerequisiteId)?.masteryScore ?? 0;
        if (prereqMastery < p.minMastery && !addedSkillIds.has(p.prerequisiteId)) {
          // Add prerequisite first
          const prereqScored = scoredSkills.find(s => s.skill.id === p.prerequisiteId);
          if (prereqScored && !addedSkillIds.has(p.prerequisiteId)) {
            orderedSkills.push(prereqScored);
            addedSkillIds.add(p.prerequisiteId);
          }
        }
      }

      if (!addedSkillIds.has(scored.skill.id)) {
        orderedSkills.push(scored);
        addedSkillIds.add(scored.skill.id);
      }
    }

    // ========================================
    // 5️⃣ PAUSE EXISTING PATH
    // ========================================
    const existing = await this.getLearningPath(userId);
    if (existing) {
      existing.status = "paused";
      this.learningPaths.set(existing.id, existing);
    }

    // ========================================
    // 6️⃣ CREATE NEW PATH
    // ========================================
    const pathId = randomUUID();
    const version = existing ? (existing.version ?? 0) + 1 : 1;

    const mainRationale = this.buildPathRationale(orderedSkills, profile, horizonRationale);

    const path: LearningPath = {
      id: pathId,
      userId,
      targetRole: profile.careerGoal,
      horizonWeeks,
      status: "active",
      version,
      rationale: mainRationale,
      triggeredBy: options?.triggeredBy ?? "manual",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.learningPaths.set(pathId, path);

    // ========================================
    // 7️⃣ WEEKLY FOCUS SELECTION & TASK ALLOCATION
    // ========================================
    const weeklyMinutes = timePerWeek * 60;
    const preferredFormats = options?.constraints?.preferredFormats ?? ["concept", "practice", "project"];
    const weeksOutput: any[] = [];

    let skillPointer = 0;
    let lastProjectWeek = 0;

    for (let w = 1; w <= horizonWeeks; w++) {
      // Select focus skills (1 primary, up to 2 secondary)
      const weekSkills: ScoredSkill[] = [];

      // Primary skill logic
      if (skillPointer < orderedSkills.length) {
        weekSkills.push(orderedSkills[skillPointer]);
        skillPointer++;
      } else {
        // Fallback: Cycle back to skills with lowest mastery
        if (orderedSkills.length > 0) {
          // Sort by current mastery to find weakest link
          const weakest = [...orderedSkills].sort((a, b) => {
            const ma = userSkillMap.get(a.skill.id)?.masteryScore ?? 0;
            const mb = userSkillMap.get(b.skill.id)?.masteryScore ?? 0;
            return ma - mb;
          })[0];
          weekSkills.push(weakest);

          // If we're cycling, move pointer to next one next time to avoid repeating same skill every week
          // (Simulate round robin on top of ordered skills)
          const cycleIndex = (w - 1) % orderedSkills.length;
          if (orderedSkills[cycleIndex].skill.id !== weakest.skill.id) {
            weekSkills.push(orderedSkills[cycleIndex]);
          }
        }
      }

      // Secondary skills (Reinforcement or Preview - DO NOT consume main pointer)
      // Add 1-2 secondary skills
      if (weekSkills.length > 0) {
        // 1. Try to add a complementary skill (next in line)
        if (skillPointer < orderedSkills.length) {
          weekSkills.push(orderedSkills[skillPointer]);
        }
        // 2. Or add a review skill (previous)
        else if (skillPointer > 1) {
          weekSkills.push(orderedSkills[skillPointer - 2]);
        }
      }

      // Build week rationale
      const focusSkillNames = weekSkills.map(ws => ws.skill.name);
      const primaryReasons = weekSkills[0]?.reasons?.join(", ") || "progression";
      const weekRationale = `Focus on ${focusSkillNames.join(", ")} because: ${primaryReasons}`;

      const week: PathWeek = {
        id: randomUUID(),
        pathId,
        weekNumber: w,
        focusSkills: [weekSkills[0]?.skill.id].filter(Boolean),
        secondarySkills: weekSkills.slice(1).map(ws => ws.skill.id),
        estimatedTime: weeklyMinutes,
        rationale: weekRationale
      };
      this.pathWeeks.set(week.id, week);

      // ========================================
      // TASK ALLOCATION FOR THIS WEEK
      // ========================================
      const tasks: PathTask[] = [];
      let remainingTime = weeklyMinutes;
      let taskPriority = 1;

      for (const ws of weekSkills) {
        const mastery = ws.userSkill?.masteryScore ?? 0;
        const skillName = ws.skill.name;
        const skillId = ws.skill.id;

        // Concept task (always include for primary skill)
        if (remainingTime >= 20 && preferredFormats.includes("concept")) {
          const conceptTime = mastery < 30 ? 30 : 20;
          if (remainingTime >= conceptTime) {
            tasks.push({
              id: randomUUID(),
              weekId: week.id,
              taskType: "concept",
              title: mastery < 30 ? `Learn: ${skillName} fundamentals` : `Review: ${skillName} concepts`,
              skillId,
              estimatedTime: conceptTime,
              deadline: null,
              status: "not_started",
              reason: mastery < 30
                ? `Building foundation in ${skillName} (currently at ${mastery}%)`
                : `Reinforcing ${skillName} knowledge before practice`,
              resourceId: null,
              priority: taskPriority++
            });
            remainingTime -= conceptTime;
          }
        }

        // Practice task (if mastery < 60)
        if (mastery < 60 && remainingTime >= 25 && preferredFormats.includes("practice")) {
          tasks.push({
            id: randomUUID(),
            weekId: week.id,
            taskType: "practice",
            title: `Practice: ${skillName} exercises`,
            skillId,
            estimatedTime: 25,
            deadline: null,
            status: "not_started",
            reason: `Targeted practice to raise ${skillName} mastery from ${mastery}% toward 60%+`,
            resourceId: null,
            priority: taskPriority++
          });
          remainingTime -= 25;
        }

        // Reinforcement task (if mastery 60-80 and low confidence)
        const confidence = ws.userSkill?.confidenceScore ?? 0;
        if (mastery >= 60 && mastery < 80 && confidence < 60 && remainingTime >= 20) {
          tasks.push({
            id: randomUUID(),
            weekId: week.id,
            taskType: "reinforcement",
            title: `Reinforce: ${skillName} application`,
            skillId,
            estimatedTime: 20,
            deadline: null,
            status: "not_started",
            reason: `Stabilizing ${skillName} confidence (currently ${confidence}%)`,
            resourceId: null,
            priority: taskPriority++
          });
          remainingTime -= 20;
        }
      }

      // Project task (every 2-3 weeks)
      const weeksSinceProject = w - lastProjectWeek;
      if (weeksSinceProject >= 2 && remainingTime >= 45 && preferredFormats.includes("project")) {
        const projectSkills = weekSkills.slice(0, 2).map(ws => ws.skill.name);
        tasks.push({
          id: randomUUID(),
          weekId: week.id,
          taskType: "project",
          title: `Mini-Project: Apply ${projectSkills.join(" & ")}`,
          skillId: weekSkills[0]?.skill.id,
          estimatedTime: Math.min(60, remainingTime),
          deadline: null,
          status: "not_started",
          reason: `Hands-on project to solidify ${projectSkills.join(" and ")} skills for ${profile.careerGoal} readiness`,
          resourceId: null,
          priority: taskPriority++
        });
        remainingTime -= Math.min(60, remainingTime);
        lastProjectWeek = w;
      }

      // Ensure at least 2 tasks per week
      if (tasks.length < 2 && weekSkills.length > 0) {
        const ws = weekSkills[0];
        if (remainingTime >= 15) {
          tasks.push({
            id: randomUUID(),
            weekId: week.id,
            taskType: "concept",
            title: `Quick Review: ${ws.skill.name}`,
            skillId: ws.skill.id,
            estimatedTime: 15,
            deadline: null,
            status: "not_started",
            reason: "Supplementary learning to ensure weekly progress",
            resourceId: null,
            priority: taskPriority++
          });
        }
      }

      // Store tasks
      for (const t of tasks) {
        this.pathTasks.set(t.id, t);
      }

      weeksOutput.push({
        week: w,
        focus: weekSkills[0]?.skill.name || "General",
        focusSkillId: weekSkills[0]?.skill.id,
        secondarySkills: weekSkills.slice(1).map(ws => ws.skill.name),
        tasks: tasks.map(t => ({
          id: t.id,
          type: t.taskType,
          title: t.title,
          skillId: t.skillId,
          estimatedTime: t.estimatedTime,
          reason: t.reason,
          status: t.status
        })),
        rationale: weekRationale
      });
    }

    // ========================================
    // 8️⃣ LOG EVENT
    // ========================================
    await this.logEvent(userId, "PATH_GENERATED", "LearningPathEngine", {
      pathId,
      horizonWeeks,
      totalWeeks: weeksOutput.length,
      triggeredBy: options?.triggeredBy ?? "manual"
    });

    this.emit("PATH_GENERATED", userId, pathId);

    return {
      path,
      weeks: weeksOutput,
      rationale: mainRationale
    };
  }

  private buildPathRationale(orderedSkills: any[], profile: Profile, horizonRationale: string): string {
    const topSkills = orderedSkills.slice(0, 3);
    const skillFocus = topSkills.map(s => s.skill.name).join(", ");
    const mainReasons = Array.from(new Set(topSkills.flatMap(s => s.reasons))).slice(0, 3);

    return `${horizonRationale}. Your plan prioritizes ${skillFocus} because they are ${mainReasons.join(", ")}. ` +
      `This path is optimized for your ${profile.careerGoal} career goal with ${profile.availability}h/week availability.`;
  }

  async shouldRegeneratePath(userId: string, eventType: string, payload?: any): Promise<boolean> {
    // Only regenerate on significant events
    const significantEvents = [
      "ASSESSMENT_COMPLETED",
      "PROJECT_EVALUATED",
      "SIGNIFICANT_MASTERY_SHIFT",
      "USER_PROFILE_UPDATED"
    ];

    if (!significantEvents.includes(eventType)) {
      return false;
    }

    // For mastery shift, check if delta > 15
    if (eventType === "SIGNIFICANT_MASTERY_SHIFT" && payload?.delta) {
      return Math.abs(payload.delta) >= 15;
    }

    return true;
  }
  async updateTaskStatus(taskId: string, status: string): Promise<PathTask> {
    const t = this.pathTasks.get(taskId); if (!t) throw new Error("404");
    t.status = status; this.pathTasks.set(taskId, t);
    if (status === "completed") {
      const path = Array.from(this.learningPaths.values()).find(p => {
        return Array.from(this.pathWeeks.values()).some(w => w.pathId === p.id && w.id === t.weekId);
      });
      if (path) this.emit("TASK_COMPLETED", path.userId);
    }
    return t;
  }

  async getResources(): Promise<Resource[]> { return Array.from(this.resources.values()); }
  async getResource(id: string): Promise<Resource | undefined> { return this.resources.get(id); }
  async getResourceSkills(resourceId: string): Promise<ResourceSkill[]> { return Array.from(this.resourceSkills.values()).filter(rs => rs.resourceId === resourceId); }
  async submitFeedback(f: Omit<ResourceFeedback, "id" | "createdAt">): Promise<ResourceFeedback> {
    const id = randomUUID(); const fb = { ...f, id, createdAt: new Date() }; this.resourceFeedback.set(id, fb);
    const res = this.resources.get(f.resourceId);
    if (res) {
      // Simple update: adjust quality score based on feedback rating (e.g., +5 for 5-star, -5 for 1-star)
      // This is a simplified model. A more robust system would average or use a weighted average.
      res.qualityScore = Math.min(100, Math.max(0, res.qualityScore + (f.rating - 3) * 5));
      this.resources.set(res.id, res); // Ensure the updated resource is stored back
    }
    return fb;
  }

  async getQuestions(skillId: string, difficulty: string): Promise<Question[]> { return Array.from(this.questions.values()).filter(q => q.skillId === skillId && q.difficulty === difficulty); }
  async startAssessment(userId: string, skillId: string): Promise<Assessment> {
    // Idempotency: Return existing active assessment if it exists
    const existing = Array.from(this.assessments.values()).find(a => a.userId === userId && a.skillId === skillId && a.status === "started");
    if (existing) return existing;

    const us = await this.getUserSkill(userId, skillId);
    let diff: "Beginner" | "Intermediate" | "Advanced" = "Beginner";
    if (us && us.masteryScore >= 80) diff = "Advanced"; else if (us && us.masteryScore >= 50) diff = "Intermediate";
    const a: Assessment = { id: randomUUID(), userId, skillId, status: "started", difficulty: diff, score: null, createdAt: new Date(), completedAt: null };
    this.assessments.set(a.id, a); return a;
  }
  async submitAssessment(aId: string, responses: { questionId: string; userAnswer: string }[]): Promise<Assessment> {
    const a = this.assessments.get(aId); if (!a) throw new Error("404");
    if (a.status === "completed") return a;

    let correctCount = 0;
    for (const resp of responses) {
      const q = this.questions.get(resp.questionId);
      if (!q) continue;

      const isCorrect = q.correctAnswer === resp.userAnswer;
      if (isCorrect) correctCount++;

      const attempt: AssessmentAttempt = {
        id: randomUUID(),
        assessmentId: aId,
        questionId: resp.questionId,
        userAnswer: resp.userAnswer,
        isCorrect,
        timeTaken: 0 // Mock for now
      };
      this.assessmentAttempts.set(attempt.id, attempt);
    }

    const score = responses.length > 0 ? Math.round((correctCount / responses.length) * 100) : 0;
    a.status = "completed"; a.score = score; a.completedAt = new Date();
    this.assessments.set(aId, a);

    await this.updateSkillMastery(a.userId, a.skillId, a.score, 30);
    this.emit("ASSESSMENT_COMPLETED", a.userId);
    return a;
  }
  async getAssessment(id: string): Promise<Assessment | undefined> { return this.assessments.get(id); }
  async getAssessmentAttempts(aId: string): Promise<AssessmentAttempt[]> { return Array.from(this.assessmentAttempts.values()).filter(att => att.assessmentId === aId); }

  // Project Evaluation Implementation
  async getRubric(projectId: string): Promise<Rubric | undefined> {
    return Array.from(this.rubrics.values()).find(r => r.projectId === projectId);
  }

  async submitProject(userId: string, projectId: string, type: string, reference: string): Promise<ProjectSubmission> {
    const id = randomUUID();
    const submission: ProjectSubmission = { id, userId, projectId, submissionType: type, artifactReference: reference, status: "pending", submittedAt: new Date() };
    this.projectSubmissions.set(id, submission);
    return submission;
  }

  async evaluateProject(submissionId: string): Promise<EvaluationResult> {
    const sub = this.projectSubmissions.get(submissionId);
    if (!sub) throw new Error("404");
    const rubric = await this.getRubric(sub.projectId);
    if (!rubric) throw new Error("Rubric not found");

    // Async Decoupling: Return immediately with "processing"
    sub.status = "processing";
    this.projectSubmissions.set(sub.id, sub);

    // Simulated Background Worker
    setTimeout(async () => {
      const rubricScores: Record<string, number> = {};
      let totalScore = 0;
      const criteria = rubric.criteria as { category: string, weight: number }[];

      for (const c of criteria) {
        const score = 70 + Math.floor(Math.random() * 30);
        rubricScores[c.category] = score;
        totalScore += (score * c.weight) / 100;
      }

      const result: EvaluationResult = {
        id: randomUUID(),
        submissionId,
        overallScore: Math.round(totalScore),
        rubricScores,
        strengths: `Strong demonstration of ${criteria[0].category}. AI Coach Context: user is targeting ${sub.projectId} with high learning velocity.`,
        improvements: "Documentation needs deeper technical explanation of design choices.",
        suggestions: "Consider implementing better error boundaries and retry logic for network requests.",
        confidence: 90,
        evaluatedAt: new Date()
      };

      this.evaluationResults.set(result.id, result);
      sub.status = "evaluated";
      this.projectSubmissions.set(sub.id, sub);

      await this.updateSkillMastery(sub.userId, "sql-joins", result.overallScore, 40);
      this.emit("PROJECT_EVALUATED", sub.userId);
    }, 2000);

    // Return current state (which is processing)
    // In a real system, we'd return a placeholder or wait for the first stage.
    // For this mock, we'll return a minimal completion to satisfy the API and let polling take over.
    return {
      id: "pending",
      submissionId,
      overallScore: 0,
      rubricScores: {},
      strengths: "Evaluating...",
      improvements: "",
      suggestions: "",
      confidence: 0,
      evaluatedAt: new Date()
    };
  }

  async getEvaluation(submissionId: string): Promise<EvaluationResult | undefined> {
    return Array.from(this.evaluationResults.values()).find(e => e.submissionId === submissionId);
  }

  // Notification Service Implementation
  async getNotifications(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(n => n.userId === userId)
      .sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime());
  }

  async createNotification(notif: Omit<Notification, "id" | "status" | "sentAt">): Promise<Notification> {
    const id = randomUUID();
    const notification: Notification = {
      ...notif,
      id,
      status: "pending",
      sentAt: null
    };
    this.notifications.set(id, notification);

    // Auto-send in mock (usually handled by a worker)
    setTimeout(() => {
      notification.status = "sent";
      notification.sentAt = new Date();
      this.notifications.set(id, notification);
    }, 1000);

    return notification;
  }

  async getNotificationPreferences(userId: string): Promise<NotificationPreference> {
    let prefs = Array.from(this.notificationPreferences.values()).find(p => p.userId === userId);
    if (!prefs) {
      prefs = {
        id: randomUUID(),
        userId,
        enabledChannels: ["email", "push"],
        quietHoursStart: "22:00",
        quietHoursEnd: "08:00",
        frequencyLimit: 3
      };
      this.notificationPreferences.set(prefs.id, prefs);
    }
    return prefs;
  }

  async updateNotificationPreferences(userId: string, update: Partial<NotificationPreference>): Promise<NotificationPreference> {
    const existing = await this.getNotificationPreferences(userId);
    const updated = { ...existing, ...update };
    this.notificationPreferences.set(existing.id, updated);
    return updated;
  }

  private async triggerNotificationEvent(userId: string, eventType: string, data: any) {
    const prefs = await this.getNotificationPreferences(userId);
    const channels = prefs.enabledChannels as string[];

    let title = "";
    let content = "";

    switch (eventType) {
      case "ASSESSMENT_COMPLETED":
        title = "Assessment Result! 🎉";
        content = `You scored ${data.score}% in the ${data.skillName} assessment. Great job!`;
        break;
      case "PROJECT_EVALUALTED":
        title = "Project Feedback Ready 🚀";
        content = `Your submission for ${data.projectName} has been evaluated. Read your feedback now.`;
        break;
      case "REMINDER_TASK":
        title = "Learning Reminder ⏰";
        content = `Don't forget to complete your task: ${data.taskTitle}. Consistency is key!`;
        break;
      default:
        return;
    }

    for (const channel of channels) {
      await this.createNotification({
        userId,
        channel,
        title,
        content,
        scheduledAt: new Date(),
        metadata: { eventType, priority: "medium" }
      });
    }
  }

  // Recommendation Service Implementation
  async getRecommendations(userId: string, type: "skill" | "resource" | "project"): Promise<Recommendation[]> {
    const userSkills = await this.getUserSkills(userId);
    const profile = await this.getProfile(userId);

    const results: Recommendation[] = [];

    if (type === "skill") {
      const allSkills = await this.getSkills();
      const needs = allSkills.filter(s => {
        const us = userSkills.find(u => u.skillId === s.id);
        return !us || us.masteryScore < 80;
      });

      for (const s of needs) {
        const us = userSkills.find(u => u.skillId === s.id);
        const score = us ? 50 + (100 - us.masteryScore) / 2 : 90; // Higher score for new or low mastery skills

        results.push({
          id: randomUUID(),
          userId,
          type: "skill",
          targetId: s.id,
          rankScore: Math.round(score),
          explanation: `Recommended because it aligns with your target role as a ${profile?.careerGoal || "Learner"} and matches your current skill gaps.`,
          strategy: "hybrid_v1",
          status: "pending",
          createdAt: new Date()
        });
      }
    } else if (type === "resource") {
      const allResources = await this.getResources();
      for (const r of allResources) {
        results.push({
          id: randomUUID(),
          userId,
          type: "resource",
          targetId: r.id,
          rankScore: r.qualityScore,
          explanation: `This high-quality ${r.type} is recommended based on its effectiveness for other learners following your path.`,
          strategy: "hybrid_v1",
          status: "pending",
          createdAt: new Date()
        });
      }
    }

    return results.sort((a, b) => b.rankScore - a.rankScore).slice(0, 5);
  }

  async generateHybridRecommendations(userId: string, timeBudget: number): Promise<Recommendation[]> {
    const userSkills = await this.getUserSkills(userId);
    const profile = await this.getProfile(userId);
    const allSkills = await this.getSkills();
    const allResources = await this.getResources();
    const summary = await this.getUserSummary(userId);

    // Context Signals
    const dropoutRisk = summary.averageMastery < 30 ? 0.8 : 0.2;
    const learningVelocity = summary.totalEvents / 10; // events per unit time

    const candidates: Array<{
      resource: Resource,
      skill: Skill,
      score: number,
      reasons: string[]
    }> = [];

    // STEP 1: Candidate Generation
    for (const r of allResources) {
      const rSkills = await this.getResourceSkills(r.id);
      for (const rs of rSkills) {
        const skill = allSkills.find(s => s.id === rs.skillId);
        if (!skill) continue;

        const us = userSkills.find(u => u.skillId === skill.id);
        const mastery = us?.masteryScore || 0;
        const confidence = (us?.confidenceScore || 0) / 100;

        // Prerequisite Safety Check
        const { met } = await this.checkPrerequisites(userId, skill.id);
        if (!met) continue;

        // Time Feasibility Check
        if (r.estimatedTime > timeBudget * 1.5) continue;

        const reasons: string[] = [];
        let score = 0;

        // STEP 2: Scoring Functions

        // A. Skill Gain Potential (Gap Severity + Career Weight)
        const isGap = mastery < 60;
        if (isGap) {
          score += 40 * (skill.careerWeight / 5);
          reasons.push(`matches your goal as a ${profile?.careerGoal || 'Learner'}`);
        }

        // B. Confidence Reinforcement (Fragile Knowledge)
        const isFragile = mastery >= 80 && confidence < 0.5;
        if (isFragile) {
          score += 30;
          reasons.push("reinforces essential concepts where your confidence is shaky");
        }

        // C. Time Fit Score
        const timeDiff = Math.abs(r.estimatedTime - timeBudget);
        const timeScore = Math.max(0, 20 - (timeDiff / 10));
        score += timeScore;

        // D. Dropout Risk Penalty / Quick Win Bonus
        if (dropoutRisk > 0.5 && r.estimatedTime < 30) {
          score += 25;
          reasons.push("is a quick win to keep your momentum high");
        } else if (r.estimatedTime > 120) {
          score -= 20; // Long content penalty for high-risk users
        }

        // Content Quality Bonus
        score += (r.qualityScore / 10);

        if (score > 30) {
          candidates.push({ resource: r, skill, score, reasons });
        }
      }
    }

    // STEP 3: Multi-Objective Ranking & Formatting
    const results = candidates
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(c => {
        const explanation = `Recommended because this ${c.resource.type} ${c.reasons.join(" and ")}.`;
        return {
          id: randomUUID(),
          userId,
          type: "resource",
          targetId: c.resource.id,
          rankScore: Math.round(c.score),
          explanation,
          strategy: "hybrid_v2_mentor",
          status: "pending",
          createdAt: new Date()
        };
      });

    // Store in memory
    results.forEach(r => this.recommendations.set(r.id, r));
    return results;
  }

  async updateRecommendationStatus(id: string, status: string): Promise<Recommendation> {
    const rec = this.recommendations.get(id);
    if (!rec) throw new Error("Recommendation not found");
    rec.status = status;
    this.recommendations.set(id, rec);
    return rec;
  }

  private async refreshRecommendations(userId: string) {
    console.log(`[EVENT] Refreshing Hybrid Recommendations for user: ${userId}`);
    // Clear old pending recs
    Array.from(this.recommendations.values())
      .filter(r => r.userId === userId && r.status === "pending")
      .forEach(r => this.recommendations.delete(r.id));

    const profile = await this.getProfile(userId);
    const budget = profile?.availability ? (profile.availability * 60) / 7 : 45; // daily budget
    await this.generateHybridRecommendations(userId, budget);
  }

  // Analytics & Logging Implementation
  async logEvent(userId: string | null, eventType: string, serviceName: string, payload: any): Promise<EventLog> {
    const id = randomUUID();
    const log: EventLog = {
      id,
      userId,
      eventType,
      serviceName,
      payload,
      timestamp: new Date()
    };
    this.eventLogs.set(id, log);
    console.log(`[ANALYTICS] ${serviceName} - ${eventType} for User: ${userId || 'SYSTEM'}`);
    return log;
  }

  async trackFunnelStep(userId: string, funnelName: string, stepName: string): Promise<FunnelStep> {
    const id = randomUUID();
    const step: FunnelStep = {
      id,
      userId,
      funnelName,
      stepName,
      completedAt: new Date()
    };
    this.funnelSteps.set(id, step);
    await this.logEvent(userId, "FUNNEL_STEP_COMPLETED", "AnalyticsService", { funnelName, stepName });
    return step;
  }

  async createMetricSnapshot(metricName: string, value: number, entityId?: string): Promise<MetricSnapshot> {
    const id = randomUUID();
    const snapshot: MetricSnapshot = {
      id,
      metricName,
      entityId: entityId || null,
      value,
      timestamp: new Date()
    };
    this.metricSnapshots.set(id, snapshot);
    return snapshot;
  }

  async getUserSummary(userId: string): Promise<any> {
    const logs = Array.from(this.eventLogs.values()).filter(l => l.userId === userId);
    const skills = await this.getUserSkills(userId);
    const assessments = Array.from(this.assessments.values()).filter(a => a.userId === userId);

    // Aggregate data for a rich summary
    return {
      totalEvents: logs.length,
      skillsMastered: skills.filter(s => s.masteryScore >= 80).length,
      averageMastery: skills.length > 0 ? skills.reduce((acc, s) => acc + s.masteryScore, 0) / skills.length : 0,
      assessmentsTaken: assessments.length,
      lastActive: logs.length > 0 ? logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0].timestamp : null,
      recentActivity: logs.slice(-5).map(l => ({ type: l.eventType, time: l.timestamp }))
    };
  }
}

// Import DatabaseStorage
import { DatabaseStorage } from "./db-storage";
import { isDatabaseConnected } from "./db";

// Export the appropriate storage based on environment
function createStorage(): IStorage {
  if (process.env.DATABASE_URL && isDatabaseConnected()) {
    console.log("✅ Using PostgreSQL database storage");
    return new DatabaseStorage();
  } else {
    console.log("⚠️ DATABASE_URL not set - using in-memory storage (data will be lost on restart)");
    return new MemStorage();
  }
}

export const storage = createStorage();
