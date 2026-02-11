export const ROLE_SKILLS: Record<string, string[]> = {
    "AI Engineer": ["Mathematical Foundations", "Machine Learning", "Deep Learning", "MLOps & Deployment"],
    "Data Analyst": ["SQL Proficiency", "Python for Data", "Data Visualization", "Statistical Analysis"],
    "Software Engineer": ["Data Structures & Algorithms", "Backend Development", "Frontend Development", "System Design"],
    "Product Manager": ["Product Strategy", "Technical Specs", "Product Analytics", "User Perspective"],
    "UX Designer": ["User Research", "Visual Design", "Information Architecture", "Usability Testing"],
    "Cybersecurity Analyst": ["Network Security", "Threat Analysis", "SOC Operations", "Security Compliance"],
};

export const ROLE_QUIZ_KEYS: Record<string, Record<string, number>> = {
    "Software Engineer": {
        "swe_1": 1, "swe_2": 1, "swe_3": 2, "swe_4": 2, "swe_5": 1,
        "swe_6": 1, "swe_7": 1, "swe_8": 2, "swe_9": 1, "swe_10": 0
    },
    "AI Engineer": {
        "ai_1": 0, "ai_2": 1, "ai_3": 1, "ai_4": 2, "ai_5": 1,
        "ai_6": 0, "ai_7": 1, "ai_8": 1, "ai_9": 1, "ai_10": 1
    },
    "Data Analyst": {
        "da_1": 2, "da_2": 1, "da_3": 2, "da_4": 2, "da_5": 1,
        "da_6": 2, "da_7": 1, "da_8": 1, "da_9": 2, "da_10": 1
    },
    "Product Manager": {
        "pm_1": 1, "pm_2": 0, "pm_3": 1, "pm_4": 1, "pm_5": 1,
        "pm_6": 1, "pm_7": 1, "pm_8": 1, "pm_9": 1, "pm_10": 1
    },
    "UX Designer": {
        "ux_1": 1, "ux_2": 1, "ux_3": 1, "ux_4": 1, "ux_5": 1,
        "ux_6": 1, "ux_7": 1, "ux_8": 1, "ux_9": 1, "ux_10": 1
    },
    "Cybersecurity Analyst": {
        "cyb_1": 1, "cyb_2": 1, "cyb_3": 1, "cyb_4": 0, "cyb_5": 1,
        "cyb_6": 1, "cyb_7": 1, "cyb_8": 1, "cyb_9": 1, "cyb_10": 1
    }
};

// Target mastery levels for each role's skills
export const ROLE_REQUIREMENTS: Record<string, Record<string, number>> = {
    "AI Engineer": {
        "Mathematical Foundations": 75,
        "Machine Learning": 85,
        "Deep Learning": 80,
        "MLOps & Deployment": 70
    },
    "Data Analyst": {
        "SQL Proficiency": 80,
        "Python for Data": 75,
        "Data Visualization": 70,
        "Statistical Analysis": 75
    },
    "Software Engineer": {
        "Data Structures & Algorithms": 85,
        "Backend Development": 80,
        "Frontend Development": 75,
        "System Design": 70
    },
    "Product Manager": {
        "Product Strategy": 80,
        "Technical Specs": 70,
        "Product Analytics": 75,
        "User Perspective": 75
    },
    "UX Designer": {
        "User Research": 80,
        "Visual Design": 75,
        "Information Architecture": 70,
        "Usability Testing": 75
    },
    "Cybersecurity Analyst": {
        "Network Security": 85,
        "Threat Analysis": 80,
        "SOC Operations": 75,
        "Security Compliance": 70
    }
};

// Skill Dependencies for each role
export const ROLE_SKILL_GRAPH: Record<string, { id: string; label: string; prerequisites: string[] }[]> = {
    "AI Engineer": [
        { id: "Mathematical Foundations", label: "Mathematical Foundations", prerequisites: [] },
        { id: "Machine Learning", label: "Machine Learning", prerequisites: ["Mathematical Foundations"] },
        { id: "Deep Learning", label: "Deep Learning", prerequisites: ["Machine Learning"] },
        { id: "MLOps & Deployment", label: "MLOps & Deployment", prerequisites: ["Deep Learning"] },
    ],
    "Data Analyst": [
        { id: "SQL Proficiency", label: "SQL Proficiency", prerequisites: [] },
        { id: "Python for Data", label: "Python for Data", prerequisites: [] },
        { id: "Statistical Analysis", label: "Statistical Analysis", prerequisites: ["Python for Data"] },
        { id: "Data Visualization", label: "Data Visualization", prerequisites: ["SQL Proficiency", "Statistical Analysis"] },
    ],
    "Software Engineer": [
        { id: "Data Structures & Algorithms", label: "Data Structures & Algorithms", prerequisites: [] },
        { id: "Backend Development", label: "Backend Development", prerequisites: ["Data Structures & Algorithms"] },
        { id: "Frontend Development", label: "Frontend Development", prerequisites: [] },
        { id: "System Design", label: "System Design", prerequisites: ["Backend Development", "Frontend Development"] },
    ],
    "Product Manager": [
        { id: "User Perspective", label: "User Perspective", prerequisites: [] },
        { id: "Technical Specs", label: "Technical Specs", prerequisites: ["User Perspective"] },
        { id: "Product Analytics", label: "Product Analytics", prerequisites: ["Technical Specs"] },
        { id: "Product Strategy", label: "Product Strategy", prerequisites: ["Product Analytics"] },
    ],
    "UX Designer": [
        { id: "User Research", label: "User Research", prerequisites: [] },
        { id: "Information Architecture", label: "Information Architecture", prerequisites: ["User Research"] },
        { id: "Visual Design", label: "Visual Design", prerequisites: ["Information Architecture"] },
        { id: "Usability Testing", label: "Usability Testing", prerequisites: ["Visual Design"] },
    ],
    "Cybersecurity Analyst": [
        { id: "Network Security", label: "Network Security", prerequisites: [] },
        { id: "Threat Analysis", label: "Threat Analysis", prerequisites: ["Network Security"] },
        { id: "SOC Operations", label: "SOC Operations", prerequisites: ["Threat Analysis"] },
        { id: "Security Compliance", label: "Security Compliance", prerequisites: ["SOC Operations"] },
    ],
};
