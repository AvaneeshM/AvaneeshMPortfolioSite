# Portfolio Website (React) + Resume Chatbot

Single-page personal portfolio built with **React + TypeScript (Vite)**, including a built-in chatbot that answers questions using the content of your resume.

## Run locally

```bash
cd portfolio
npm install
npm run dev
```

## Update your content (important)

- **Portfolio content + resume chatbot “training data”**: edit `portfolio/src/data/resume.ts`
  - Replace the placeholder fields (name, experience, projects, links, etc.) with your real resume.
  - The chatbot reads from this file and answers based on it.

## Build

```bash
cd portfolio
npm run build
npm run preview
```