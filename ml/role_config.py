from typing import Dict, List, Any

# Step 1: Role-Specific Skill Graph (Hierarchical)
# Format: { role_name: { skill_id: { name, parent, weight, target_mastery } } }

ROLE_CONFIGS = {
    "AI Engineer": {
        "math": {"name": "Mathematical Foundations", "parent": None, "weight": 4, "target": 80},
        "math.linear_algebra": {"name": "Linear Algebra", "parent": "math", "weight": 5, "target": 85},
        "math.calculus": {"name": "Calculus", "parent": "math", "weight": 3, "target": 75},
        "ml": {"name": "Machine Learning", "parent": None, "weight": 5, "target": 90},
        "ml.supervised": {"name": "Supervised Learning", "parent": "ml", "weight": 5, "target": 90},
        "ml.unsupervised": {"name": "Unsupervised Learning", "parent": "ml", "weight": 3, "target": 70},
        "dl": {"name": "Deep Learning", "parent": None, "weight": 5, "target": 85},
        "dl.cnn": {"name": "Computer Vision (CNN)", "parent": "dl", "weight": 4, "target": 80},
        "dl.nlp": {"name": "NLP (Transformers)", "parent": "dl", "weight": 4, "target": 80},
        "mlops": {"name": "MLOps & Deployment", "parent": None, "weight": 4, "target": 75}
    },
    "Data Analyst": {
        "sql": {"name": "SQL Proficiency", "parent": None, "weight": 5, "target": 90},
        "sql.joins": {"name": "Complex Joins", "parent": "sql", "weight": 5, "target": 95},
        "sql.window": {"name": "Window Functions", "parent": "sql", "weight": 4, "target": 85},
        "python": {"name": "Python for Data", "parent": None, "weight": 4, "target": 80},
        "python.pandas": {"name": "Pandas/NumPy", "parent": "python", "weight": 5, "target": 85},
        "viz": {"name": "Data Visualization", "parent": None, "weight": 5, "target": 80},
        "viz.tableau": {"name": "Tableau/PowerBI", "parent": "viz", "weight": 4, "target": 75},
        "stats": {"name": "Statistical Analysis", "parent": None, "weight": 4, "target": 75}
    },
    "Software Engineer": {
        "dsa": {"name": "Data Structures & Algorithms", "parent": None, "weight": 5, "target": 85},
        "dsa.complexity": {"name": "Big O Analysis", "parent": "dsa", "weight": 5, "target": 90},
        "backend": {"name": "Backend Development", "parent": None, "weight": 5, "target": 85},
        "backend.node": {"name": "Node.js Express", "parent": "backend", "weight": 5, "target": 90},
        "backend.db": {"name": "Database Design", "parent": "backend", "weight": 4, "target": 80},
        "frontend": {"name": "Frontend Development", "parent": None, "weight": 4, "target": 75},
        "frontend.react": {"name": "React Hooks", "parent": "frontend", "weight": 5, "target": 80},
        "sys_design": {"name": "System Design", "parent": None, "weight": 5, "target": 70}
    },
    "Product Manager": {
        "strategy": {"name": "Product Strategy", "parent": None, "weight": 5, "target": 85},
        "strategy.roadmap": {"name": "Roadmapping", "parent": "strategy", "weight": 5, "target": 90},
        "specs": {"name": "Technical Specs (PRDs)", "parent": None, "weight": 5, "target": 90},
        "metrics": {"name": "Product Analytics", "parent": None, "weight": 5, "target": 80},
        "metrics.ab_test": {"name": "A/B Testing", "parent": "metrics", "weight": 4, "target": 75},
        "ux_pm": {"name": "User Perspective", "parent": None, "weight": 4, "target": 70}
    },
    "UX Designer": {
        "research": {"name": "User Research", "parent": None, "weight": 5, "target": 90},
        "research.interviews": {"name": "User Interviews", "parent": "research", "weight": 5, "target": 85},
        "design": {"name": "Visual Design", "parent": None, "weight": 5, "target": 85},
        "design.figma": {"name": "Figma Prototyping", "parent": "design", "weight": 5, "target": 95},
        "ia": {"name": "Information Architecture", "parent": None, "weight": 4, "target": 80},
        "usability": {"name": "Usability Testing", "parent": None, "weight": 5, "target": 85}
    },
    "Cybersecurity Analyst": {
        "network": {"name": "Network Security", "parent": None, "weight": 5, "target": 85},
        "network.protocols": {"name": "TCP/IP & Firewalls", "parent": "network", "weight": 5, "target": 90},
        "threats": {"name": "Threat Analysis", "parent": None, "weight": 5, "target": 80},
        "threats.malware": {"name": "Malware Analysis", "parent": "threats", "weight": 4, "target": 75},
        "ops": {"name": "SOC Operations", "parent": None, "weight": 5, "target": 80},
        "compliance": {"name": "Security Compliance", "parent": None, "weight": 4, "target": 70}
    }
}
