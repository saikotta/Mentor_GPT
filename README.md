# Mentor_GPT

> An AI-powered mentor platform that provides personalized learning paths, assessments, and interactive feedback to help learners grow their skills.

---

## Key Features

- Personalized learning-path generation
- Diagnostic assessments and quiz feedback
- AI-powered mentor chat and explanations
- Project studio and curated resources
- Role- and skill-based recommendations

## Repository Structure

- `client/` — React + Vite front-end application
- `server/` — API and server-side routes (TypeScript)
- `ml/` — Machine-learning helpers and models used by the mentor
- `shared/` — Shared types and utilities
- `script/` — Build and maintenance scripts

See the folder layout in the repository root for full details.

## Quick Start (Development)

Prerequisites:

- Node.js 18+ and npm (or pnpm/yarn)
- Git

Steps:

1. Clone the repo (already present if working locally):

   git clone https://github.com/saikotta/Mentor_GPT.git

2. Install dependencies and run the client + server locally:

   npm install
   npm run dev

3. Open the app in your browser (Vite will show the URL, usually `http://localhost:5173`).

## Environment Variables

Do NOT commit secrets. Required env vars (example):

- `OPENROUTER_API_KEY` — OpenRouter API key used by the server (set in your environment)
- Any database or third-party API keys used by the project

Create a `.env` file locally or use your environment management to provide secrets.

## Security & Post-Secret Steps

- If any secret was previously committed, rotate it immediately (treat as compromised).
- This repository has been cleaned of the detected OpenRouter key; ensure you rotate that key.

## Contributing

- Create issues for bugs or feature requests
- Open pull requests from feature branches and include tests where applicable

## License

This project does not include a license file in this repository. Add a `LICENSE` file if you want to make the project open source.

## Contact

If you need help with deployment, secrets rotation, or CI configuration, open an issue or reach out to the repo owner.
