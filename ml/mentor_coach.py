import json
from dataclasses import dataclass
from typing import List, Dict, Any, Optional

@dataclass
class KnowledgeChunk:
    resource_id: str
    skill: str
    subskill: str
    difficulty: str
    content: str

class MockVectorDB:
    """
    Simulates a vector database (FAISS/Pinecone) for the Grounded AI Mentor.
    Ensures 'No Retrieval = No Knowledge'.
    """
    def __init__(self):
        self.chunks: List[KnowledgeChunk] = [
            KnowledgeChunk(
                "sql_join_doc_01", "sql.joins", "inner_join", "beginner",
                "Inner joins return rows only when there is at least one match in both tables. "
                "The syntax is SELECT * FROM table1 INNER JOIN table2 ON table1.id = table2.id."
            ),
            KnowledgeChunk(
                "sql_join_doc_03", "sql.joins", "left_join", "beginner",
                "A LEFT JOIN returns all records from the left table, and the matched records from the right table. "
                "If no match is found, NULL values are returned for the right table columns. This is often where "
                "beginners struggle because NULLs can affect calculations."
            ),
            KnowledgeChunk(
                "sql_join_doc_05", "sql.joins", "left_join", "beginner",
                "Common LEFT JOIN mistakes include putting filters in the WHERE clause instead of the ON clause, "
                "which effectively turns the LEFT JOIN into an INNER JOIN by filtering out the NULL values."
            ),
            KnowledgeChunk(
                "react_state_01", "react.hooks", "useState", "beginner",
                "useState allows you to track state in a function component. It returns a pair: the current "
                "state value and a function that lets you update it."
            )
        ]

    def query(self, enriched_query: str, skill_filter: str, difficulty_limit: str) -> List[KnowledgeChunk]:
        """
        Simulated Semantic Search. 
        In production, this would use cosine similarity on embeddings.
        """
        results = []
        # Simple keyword/metadata matching for demonstration
        for chunk in self.chunks:
            # Rule: Difficulty must NOT exceed learner level
            # (Simple map: beginner < intermediate < advanced)
            if chunk.difficulty == "beginner" or chunk.difficulty == difficulty_limit:
                # Rule: Skill must match or be child
                if skill_filter in chunk.skill or chunk.skill in skill_filter:
                    if any(word.lower() in chunk.content.lower() for word in enriched_query.split()):
                        results.append(chunk)
        return results[:3]

class GroundedMentorCoach:
    """
    Senior AI Architect Implementation: Grounded RAG Mentor Module.
    Ensures Zero-Hallucination and Source-Backed Pedagogical Guidance.
    """
    
    def __init__(self, vector_db: MockVectorDB):
        self.vdb = vector_db

    def chat(self, user_query: str, m1_state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main Mentor Pipeline: 
        Enrich -> Retrieve -> Assemble -> Synthesize -> Guardrail
        """
        # 1. Query Enrichment (Module 1 State Awareness)
        enriched_query = self._enrich_query(user_query, m1_state)
        
        # 2. Retrieval with Filtering
        # We target the primary skill the user is struggling with
        skill_context = list(m1_state['skills'].keys())[0] if m1_state['skills'] else "general"
        retrieved_chunks = self.vdb.query(user_query, skill_context, "beginner")

        # 3. Context Assembly & Hallucination Check
        if not retrieved_chunks:
            return {
                "explanation": "I don’t know based on the provided materials.",
                "diagnosis": "No internal documentation covers this query.",
                "mini_quiz": [],
                "next_action": {"resource_id": "null", "reason": "No context found."},
                "encouragement": "Let's try focusing on foundational SQL topics."
            }

        context_block = "\n".join([f"[{c.resource_id}] {c.content}" for c in retrieved_chunks])

        # 4. LLM synthesis (Mocked logic following STRICT RULES)
        # In production, this call passes the Context Block + System Prompt to GPT-4o
        return self._generate_structured_response(context_block, m1_state, retrieved_chunks)

    def _enrich_query(self, query: str, m1_state: Dict[str, Any]) -> str:
        weaknesses = ", ".join(m1_state.get('weak_subskills', []))
        return f"{query}. Learner weakness: {weaknesses}. Current mastery is {m1_state['skills'].get('sql.joins', {}).get('mastery', 0)}%."

    def _generate_structured_response(self, context: str, state: Dict[str, Any], chunks: List[KnowledgeChunk]) -> Dict[str, Any]:
        """
        Simulates the output of a locked-down LLM system prompt.
        """
        # Note: In a real implementation, this would be a prompt to an LLM.
        # Here we demonstrate the EXACT EXPECTED OUTPUT FORMAT.
        
        # Concept Explanation (Derived from sql_join_doc_03)
        # Step 8: Role-specific coaching logic
        role = state.get('goal_role', 'Professional')
        explanation = (
            f"As a future {role}, mastering this is critical because it directly impacts your job performance. "
            "Based on our materials, you might be finding SQL joins tricky because a LEFT JOIN "
            "returns all records from the left table, but fills the right table with NULLs if no match exists. "
            "These NULLs can often disrupt your results if not handled correctly. "
            f"(Source: {chunks[0].resource_id})"
        )

        # Diagnostic Insight (Derived from sql_join_doc_05)
        diagnosis = (
            "A common mistake you're likely encountering is placing filters for the right-hand table "
            "in the WHERE clause. This effectively turns your LEFT JOIN into an INNER JOIN, "
            "stripping away the rows you intended to keep. (Source: sql_join_doc_05)"
        )

        # Mini Quiz
        mini_quiz = [
            {
                "question": "What happens in a LEFT JOIN when no match is found in the right table?",
                "options": ["Row is deleted", "NULL values are returned", "An error occurs"],
                "answer": "NULL values are returned"
            },
            {
                "question": "Where should you place filters to maintain a true LEFT JOIN?",
                "options": ["WHERE clause", "ON clause", "HAVING clause"],
                "answer": "ON clause"
            }
        ]

        # Next Action (Grounding in Module 2 logic)
        next_action = {
            "resource_id": "sql_left_join_practice_01",
            "reason": "Targets the NULL-handling edge cases you are struggling with."
        }

        encouragement = "This is a common hurdle — fixing it will unlock many complex SQL problems."

        return {
            "explanation": explanation,
            "diagnosis": diagnosis,
            "mini_quiz": mini_quiz,
            "next_action": next_action,
            "encouragement": encouragement
        }

# --- MODULE INTEGRATION TEST ---
if __name__ == "__main__":
    db = MockVectorDB()
    mentor = GroundedMentorCoach(db)

    # State from Module 1
    m1_output = {
        "user_id": "u123",
        "skills": {
            "sql.joins": { "mastery": 48, "confidence": 0.42 }
        },
        "weak_subskills": ["LEFT JOIN edge cases"]
    }

    print("\n--- GROUNDED AI MENTOR RESPONSE ---")
    query = "Why am I bad at SQL joins?"
    response = mentor.chat(query, m1_output)
    print(json.dumps(response, indent=2))
