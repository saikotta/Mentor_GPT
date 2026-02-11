# MentorGPT - Full Implementation Plan

## Current Status: 30% Complete

### ✅ Completed (Modules 1-3)
- [x] Onboarding wizard (basic)
- [x] Dashboard with skill tracking
- [x] Skill map visualization
- [x] Zustand state management
- [x] Rule-based plan generation

### 🚧 In Progress: Upgrading to Full Vision

---

## Phase 1: Core Intelligence (Week 1-2)

### Priority 1: Assessment & Evidence System

#### Module 4: Assessment Center (`/assessments`)
**Purpose**: Capture skill evidence through quizzes & coding challenges

**Features**:
- [ ] Diagnostic quiz on onboarding (10-15 questions)
- [ ] Weekly skill assessments (adaptive difficulty)
- [ ] Coding challenges (optional, for dev roles)
- [ ] Mistake taxonomy tracking
- [ ] Review wrong answers with explanations
- [ ] Progress history timeline

**Data Model**:
```typescript
type Assessment = {
  id: string;
  type: "diagnostic" | "weekly" | "skill_check";
  skillsCovered: string[];
  questions: Question[];
  completedAt?: number;
  score: number; // 0-100
  timeSpent: number; // seconds
};

type Question = {
  id: string;
  skill: string;
  difficulty: "easy" | "medium" | "hard";
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  userAnswer?: number;
  isCorrect?: boolean;
};

type AssessmentResult = {
  assessmentId: string;
  skillScores: Record<string, number>; // skill -> score
  weakAreas: string[];
  strongAreas: string[];
  recommendations: string[];
};
```

**UI Components**:
- Quiz interface with timer
- Progress indicator
- Results dashboard with breakdown
- Mistake review panel

---

#### Module 5: Project Studio (`/projects`)
**Purpose**: Project-based learning with rubric scoring

**Features**:
- [ ] Project briefs (auto-generated or curated)
- [ ] Project submission (file upload + GitHub link)
- [ ] Rubric-based evaluation
- [ ] AI feedback on submissions
- [ ] Portfolio gallery (completed projects)
- [ ] Shareable project cards

**Data Model**:
```typescript
type Project = {
  id: string;
  title: string;
  description: string;
  skillsRequired: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedHours: number;
  rubric: RubricItem[];
  resources: string[];
  status: "not_started" | "in_progress" | "submitted" | "completed";
};

type RubricItem = {
  criterion: string;
  weight: number; // 0-1
  description: string;
  score?: number; // 0-100
  feedback?: string;
};

type ProjectSubmission = {
  projectId: string;
  submittedAt: number;
  githubUrl?: string;
  files?: string[];
  notes: string;
  rubricScores: Record<string, number>;
  totalScore: number;
  feedback: string;
};
```

---

### Priority 2: Skill Inference Engine

**Purpose**: Update mastery scores based on evidence (Bayesian/EMA)

**Algorithm**:
```typescript
function updateMasteryScore(
  currentMastery: number,
  newEvidence: Evidence,
  confidence: number
): number {
  // Exponential Moving Average approach
  const alpha = 0.3; // Learning rate (0-1)
  const evidenceScore = calculateEvidenceScore(newEvidence);
  const weightedScore = alpha * evidenceScore + (1 - alpha) * currentMastery;
  
  // Confidence adjustment
  const confidenceBoost = newEvidence.type === "assessment" ? 10 : 5;
  const newConfidence = Math.min(100, confidence + confidenceBoost);
  
  return {
    mastery: weightedScore,
    confidence: newConfidence,
    lastUpdated: Date.now()
  };
}

type Evidence = {
  type: "quiz" | "project" | "practice" | "streak";
  skill: string;
  score: number; // 0-100
  difficulty: number; // 0-1
  timeSpent: number;
  mistakes?: string[]; // Sub-skill weaknesses
};
```

---

### Priority 3: Enhanced Dashboard

**Upgrades**:
- [ ] **Skill Radar Chart** (replace bar chart)
  - 6-8 axes for main skills
  - Overlay: current vs. target (role requirement)
  - Interactive hover tooltips

- [ ] **Career Fit Score** (top metric)
  - Calculate: weighted average of skill gaps
  - Formula: `100 - avg(roleRequirements - currentMastery)`
  - Show trend arrow (↑↓→)

- [ ] **Evidence Timeline**
  - Recent assessments, projects, achievements
  - Visual timeline with icons

- [ ] **Intervention Alerts**
  - "You haven't practiced SQL in 5 days"
  - "Your Python score dropped - try a refresher quiz"

**New Components**:
```typescript
// Radar chart with Recharts
<RadarChart data={skillRadarData}>
  <PolarGrid />
  <PolarAngleAxis dataKey="skill" />
  <PolarRadiusAxis domain={[0, 100]} />
  <Radar name="Current" dataKey="current" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
  <Radar name="Target" dataKey="target" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
</RadarChart>

// Career fit calculation
const careerFitScore = useMemo(() => {
  const roleRequirements = getRoleRequirements(profile.targetRole);
  const gaps = skills.map(s => {
    const required = roleRequirements[s.skill] || 70;
    return Math.max(0, required - s.masteryScore);
  });
  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  return Math.round(100 - avgGap);
}, [skills, profile.targetRole]);
```

---

## Phase 2: Backend & Intelligence (Week 3-4)

### Backend Architecture

**Tech Stack**:
- **API**: FastAPI (Python) or NestJS (Node.js)
- **Database**: PostgreSQL (users, progress, assessments, projects)
- **Cache**: Redis (sessions, rate limiting, leaderboards)
- **Storage**: AWS S3 / Cloudinary (project files, avatars)
- **Vector DB**: Pinecone / Weaviate (resource embeddings)

**Services**:

#### 1. Auth Service
```python
# FastAPI example
from fastapi import FastAPI, Depends
from fastapi.security import OAuth2PasswordBearer

app = FastAPI()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

@app.post("/auth/register")
async def register(email: str, password: str):
    # Hash password, create user, return JWT
    pass

@app.post("/auth/login")
async def login(email: str, password: str):
    # Validate, return JWT + refresh token
    pass

@app.get("/auth/me")
async def get_current_user(token: str = Depends(oauth2_scheme)):
    # Decode JWT, return user profile
    pass
```

#### 2. Skill Graph Service
```python
@app.get("/skills/graph")
async def get_skill_graph(role: str):
    # Return skill ontology for role
    return {
        "nodes": [...],
        "edges": [...],
        "requirements": {...}
    }

@app.post("/skills/update")
async def update_skill_mastery(user_id: str, skill: str, evidence: Evidence):
    # Run Bayesian update
    # Save to DB
    # Trigger recommendation refresh
    pass
```

#### 3. Assessment Service
```python
@app.get("/assessments/diagnostic")
async def get_diagnostic_quiz(role: str, skills: List[str]):
    # Generate adaptive quiz
    # Pull from question bank
    # Return 10-15 questions
    pass

@app.post("/assessments/submit")
async def submit_assessment(user_id: str, answers: List[Answer]):
    # Score assessment
    # Update skill mastery
    # Generate feedback
    # Return results + recommendations
    pass
```

#### 4. Recommendation Service
```python
@app.get("/recommendations/next")
async def get_next_recommendations(user_id: str, count: int = 5):
    # Hybrid recommendation:
    # 1. Content-based (skill gap + embeddings)
    # 2. Collaborative filtering (similar users)
    # 3. Multi-objective ranking
    
    resources = rank_resources(
        user_vector=user.skill_vector,
        skill_gaps=user.skill_gaps,
        time_budget=user.time_per_week,
        learning_style=user.preferences
    )
    
    return {
        "resources": resources,
        "projects": recommended_projects,
        "assessments": next_assessments
    }
```

#### 5. LLM Coach Service
```python
from openai import OpenAI

client = OpenAI()

@app.post("/coach/chat")
async def chat_with_mentor(user_id: str, message: str):
    # RAG pipeline
    context = retrieve_relevant_context(user_id, message)
    
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": MENTOR_SYSTEM_PROMPT},
            {"role": "user", "content": f"Context: {context}\n\nQuestion: {message}"}
        ]
    )
    
    return {
        "response": response.choices[0].message.content,
        "sources": context.sources
    }

@app.post("/coach/generate-project")
async def generate_project_brief(user_id: str, skills: List[str], interest: str):
    # LLM generates custom project
    prompt = f"""
    Create a project brief for a learner with:
    - Skills to practice: {skills}
    - Interest: {interest}
    - Difficulty: intermediate
    
    Include: title, description, requirements, rubric, estimated hours
    """
    
    project = client.chat.completions.create(...)
    return parse_project_brief(project)
```

---

### Database Schema

```sql
-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    target_role VARCHAR,
    experience_level VARCHAR,
    time_per_week INT,
    interests JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Skills
CREATE TABLE user_skills (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    skill VARCHAR NOT NULL,
    mastery_score FLOAT CHECK (mastery_score >= 0 AND mastery_score <= 100),
    confidence FLOAT,
    last_updated TIMESTAMP,
    UNIQUE(user_id, skill)
);

-- Assessments
CREATE TABLE assessments (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    type VARCHAR,
    skills_covered JSONB,
    questions JSONB,
    score FLOAT,
    time_spent INT,
    completed_at TIMESTAMP
);

-- Projects
CREATE TABLE projects (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    title VARCHAR,
    description TEXT,
    skills_required JSONB,
    rubric JSONB,
    status VARCHAR,
    submitted_at TIMESTAMP,
    total_score FLOAT
);

-- Evidence Log
CREATE TABLE skill_evidence (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    skill VARCHAR,
    evidence_type VARCHAR,
    score FLOAT,
    metadata JSONB,
    created_at TIMESTAMP
);

-- Learning Path
CREATE TABLE learning_plans (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    week_number INT,
    tasks JSONB,
    generated_at TIMESTAMP
);
```

---

## Phase 3: AI/ML Layer (Week 5-6)

### 1. Recommendation Engine

**Approach**: Hybrid (Content + Collaborative)

```python
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

class RecommendationEngine:
    def __init__(self, resource_embeddings, user_history):
        self.resource_embeddings = resource_embeddings
        self.user_history = user_history
    
    def recommend(self, user_id, skill_gaps, time_budget, top_k=10):
        # 1. Content-based: skill gap matching
        user_vector = self.get_user_skill_vector(user_id)
        gap_vector = self.compute_gap_vector(user_vector, skill_gaps)
        
        # 2. Compute similarity to resources
        similarities = cosine_similarity([gap_vector], self.resource_embeddings)[0]
        
        # 3. Filter by time budget
        feasible = self.filter_by_time(similarities, time_budget)
        
        # 4. Multi-objective ranking
        scores = self.rank_multi_objective(
            feasible,
            skill_gain_weight=0.5,
            difficulty_fit_weight=0.3,
            engagement_weight=0.2
        )
        
        # 5. Return top-k
        return self.get_top_k(scores, top_k)
```

### 2. Skill Mastery Model

**Bayesian Knowledge Tracing** (simplified):

```python
def bayesian_update(prior_mastery, evidence_score, evidence_weight=0.3):
    """
    Update skill mastery using Bayesian-like approach
    
    Args:
        prior_mastery: Current mastery (0-100)
        evidence_score: New evidence score (0-100)
        evidence_weight: How much to trust new evidence (0-1)
    
    Returns:
        Updated mastery score
    """
    # Convert to probability
    prior_prob = prior_mastery / 100.0
    evidence_prob = evidence_score / 100.0
    
    # Weighted update
    posterior_prob = (
        evidence_weight * evidence_prob + 
        (1 - evidence_weight) * prior_prob
    )
    
    # Convert back to 0-100 scale
    return posterior_prob * 100
```

### 3. Dropout Predictor

```python
from sklearn.ensemble import RandomForestClassifier

class DropoutPredictor:
    def __init__(self):
        self.model = RandomForestClassifier()
    
    def predict_risk(self, user_features):
        """
        Features:
        - days_inactive
        - avg_quiz_score (last 3)
        - completion_rate
        - retry_count
        - time_vs_planned_ratio
        """
        risk_score = self.model.predict_proba([user_features])[0][1]
        
        if risk_score > 0.7:
            return {
                "risk": "high",
                "interventions": [
                    "Send motivational message",
                    "Suggest easier path",
                    "Offer 1-on-1 mentor chat"
                ]
            }
        return {"risk": "low"}
```

---

## Phase 4: Frontend Enhancements (Week 7-8)

### Module 6: AI Mentor Chat (`/mentor`)

**Features**:
- [ ] Chat interface with message history
- [ ] Context-aware responses (knows your progress)
- [ ] Quick actions: "Generate quiz", "Suggest project", "Explain concept"
- [ ] Voice input (optional)
- [ ] Shareable chat snippets

**Implementation**:
```typescript
// Chat component
const MentorChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  
  const sendMessage = async () => {
    const response = await fetch("/api/coach/chat", {
      method: "POST",
      body: JSON.stringify({ message: input })
    });
    
    const data = await response.json();
    setMessages([...messages, 
      { role: "user", content: input },
      { role: "assistant", content: data.response }
    ]);
  };
  
  return (
    <div className="chat-container">
      <MessageList messages={messages} />
      <ChatInput value={input} onChange={setInput} onSend={sendMessage} />
    </div>
  );
};
```

### Module 7: Career Fit Report (`/career-fit`)

**Features**:
- [ ] Role match percentage
- [ ] Skill gap breakdown (table + chart)
- [ ] Resume bullet suggestions
- [ ] Interview prep checklist
- [ ] Shareable PDF report
- [ ] Compare multiple roles

**UI Layout**:
```
┌─────────────────────────────────────┐
│  Career Fit: Data Analyst           │
│  Match Score: 67%  ↑ +5% this week  │
├─────────────────────────────────────┤
│  Skill Gaps:                        │
│  ● SQL Joins        [====    ] 60%  │
│  ● Dashboarding     [===     ] 50%  │
│  ● Statistics       [=======  ] 85% │
├─────────────────────────────────────┤
│  Recommended Actions:               │
│  1. Complete "SQL Mastery" course   │
│  2. Build a dashboard project       │
│  3. Take stats assessment           │
└─────────────────────────────────────┘
```

---

## Evaluation Metrics (For Judges)

### 1. Skill Mastery Improvement
- **Metric**: Average mastery increase per week
- **Target**: +10-15% per month
- **Tracking**: `SELECT AVG(mastery_score) FROM user_skills GROUP BY week`

### 2. Completion Rate
- **Metric**: % of recommended tasks completed
- **Target**: >70%
- **Formula**: `completed_tasks / total_recommended_tasks`

### 3. Time-to-Competency
- **Metric**: Weeks to reach 70% career fit
- **Target**: 8-12 weeks for intermediate learners
- **Tracking**: Track career_fit_score over time

### 4. Dropout Reduction
- **Metric**: % of at-risk users who stayed active after intervention
- **Target**: 60% retention
- **A/B Test**: Intervention group vs. control

### 5. Recommendation Relevance
- **Metric**: User rating of recommendations (1-5 stars)
- **Target**: >4.0 average
- **Tracking**: Thumbs up/down on each recommendation

### 6. Career Readiness Trend
- **Metric**: Slope of career_fit_score over time
- **Target**: Positive slope for 90% of active users
- **Visualization**: Line chart in dashboard

---

## Implementation Priority (Next Steps)

### Immediate (This Week)
1. ✅ Create implementation plan (this document)
2. 🔄 Add diagnostic quiz to onboarding
3. 🔄 Build Assessment Center (Module 4)
4. 🔄 Upgrade Dashboard with radar chart + career fit

### Short-term (Next 2 Weeks)
5. Build Project Studio (Module 5)
6. Implement Bayesian skill updates
7. Set up FastAPI backend
8. PostgreSQL database + migrations

### Medium-term (Month 2)
9. LLM Coach integration
10. Recommendation engine (hybrid)
11. AI Mentor Chat interface
12. Career Fit Report

### Long-term (Month 3+)
13. Dropout predictor
14. A/B testing framework
15. Mobile app (React Native)
16. Advanced analytics dashboard

---

## Success Criteria

### MVP (Minimum Viable Product)
- [x] Onboarding with diagnostic quiz
- [x] Skill tracking dashboard with radar chart
- [x] Assessment center with 3+ quizzes
- [x] Project studio with 2+ projects
- [x] Adaptive recommendations (rule-based)
- [x] Career fit score

### Hackathon-Winning Version
- [ ] All MVP features
- [ ] AI Mentor Chat (LLM)
- [ ] Bayesian skill updates
- [ ] Backend API + database
- [ ] Evidence-based mastery tracking
- [ ] Intervention system
- [ ] Shareable progress reports
- [ ] 3+ evaluation metrics tracked

### Production-Ready
- [ ] All hackathon features
- [ ] ML recommendation engine
- [ ] Collaborative filtering
- [ ] Mobile app
- [ ] Analytics dashboard
- [ ] A/B testing
- [ ] 10,000+ users supported
