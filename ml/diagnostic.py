from typing import Dict, List, Any
from role_config import ROLE_CONFIGS

class DiagnosticGenerator:
    """
    Step 2: Role-Specific Diagnostic Assessment.
    Generates assessment questions grounded in the role's skill graph.
    """
    
    # Mock question bank for demonstration
    # In production, this would be an LLM-generated set or a large curated bank.
    QUESTION_BANK = {
        "sql.joins": [
            {"id": "q1", "text": "What is the difference between LEFT JOIN and INNER JOIN?", "level": "Beginner"},
            {"id": "q2", "text": "Explain the performance impact of joining a 1M row table with a 10M row table.", "level": "Advanced"}
        ],
        "ml.supervised": [
            {"id": "q3", "text": "What is the primary difference between classification and regression?", "level": "Beginner"},
            {"id": "q4", "text": "How do you handle feature selection for high-dimensional datasets?", "level": "Intermediate"}
        ],
        "backend.node": [
            {"id": "q5", "text": "Explain the Node.js Event Loop.", "level": "Intermediate"},
            {"id": "q6", "text": "How do you handle horizontal scaling in a stateful Express application?", "level": "Advanced"}
        ],
         "design.figma": [
            {"id": "q7", "text": "What are Auto Layouts in Figma and why are they used?", "level": "Beginner"},
            {"id": "q8", "text": "How do you manage Design Tokens in a multi-platform design system?", "level": "Advanced"}
        ],
         "network.protocols": [
            {"id": "q9", "text": "What is the difference between TCP and UDP?", "level": "Beginner"},
            {"id": "q10", "text": "Explain how a SYN flood attack works at the protocol level.", "level": "Advanced"}
        ],
         "strategy.roadmap": [
            {"id": "q11", "text": "What is the difference between a project roadmap and a product roadmap?", "level": "Beginner"},
            {"id": "q12", "text": "How do you pivot a roadmap based on a 20% drop in DAU?", "level": "Advanced"}
        ]
    }

    def generate(self, goal_role: str, level: str) -> List[Dict[str, Any]]:
        config = ROLE_CONFIGS.get(goal_role, ROLE_CONFIGS["Data Analyst"])
        assessment_questions = []
        
        # Select 1-2 questions for each primary skill in the role graph
        for skill_id, info in config.items():
            # Filter question bank for this skill and level
            candidates = [q for q in self.QUESTION_BANK.get(skill_id, []) if q["level"] == level or level == "Advanced"]
            if candidates:
                # Add metadata to question for Step 3 correlation
                q = candidates[0].copy()
                q["skill_id"] = skill_id
                q["skill_name"] = info["name"]
                assessment_questions.append(q)
                
        return assessment_questions[:10] # Cap at 10 for diagnostic
