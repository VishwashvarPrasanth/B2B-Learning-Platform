# B2B Learning Path Generator

A B2B SaaS platform that lets organizations onboard employees, auto-generate personalized learning roadmaps, and track progress through an admin analytics dashboard — built as a full backend-heavy MERN system with async job processing and real-time updates.

## Why this project

Most tutorial CRUD apps stop at basic auth and CRUD routes. This project was built to go further — handling background jobs, real-time notifications, LLM-generated content with validation guardrails, and admin-facing analytics, the kind of problems that come up in real production backends.

## Core Features

- **Role-based auth** — JWT access + refresh token rotation, with middleware-enforced role separation (Admin / Org Owner / Employee)
- **AI-generated learning roadmaps** — LLM-generated personalized learning paths per employee, with hard validation guardrails to reject malformed or unsafe output before it reaches the database
- **Background job processing** — BullMQ-backed queues handle roadmap generation and email dispatch asynchronously, so API responses stay fast even for long-running LLM calls
- **Real-time notifications** — Server-Sent Events (SSE) push job completion and progress updates to the client without polling
- **Automated email pipeline** — Nodemailer-based email delivery for onboarding, roadmap-ready notifications, and progress nudges, with delivery logs tracked in the database
- **Admin analytics dashboard** — Cron-scheduled jobs aggregate organization-wide progress data, including a drop-off heatmap that flags where employees stall in their learning paths
- **Clean schema design** — Six core MongoDB collections (`Organization`, `User`, `Course`, `Assessment`, `Progress`, `EmailLog`) modeling the full B2B relationship between orgs, employees, and content

## Tech Stack

**Backend:** Node.js, Express, MongoDB (Mongoose), BullMQ + Redis, JWT, Nodemailer, node-cron
**Frontend:** React (Vite)
**Architecture:** Monorepo — `backend/` and `frontend/` in a single repo, tightly coupled release cycle for solo development

## Project Structure

```
backend/
├── config/          # DB connection, environment setup
├── controllers/      # Route logic (auth, assessments, etc.)
├── middleware/        # JWT auth, role-based access control
├── models/            # Mongoose schemas
├── routes/            # Express route definitions
├── data/              # Seed data, question banks
└── server.js
frontend/               # React app (in progress)
```

## Design Decisions

- **Monorepo over polyrepo:** Backend and frontend are tightly coupled with a shared release cycle during solo development, so schema changes and their corresponding frontend updates land in the same commit. Will split into separate repos when independent deploy pipelines or team ownership makes sense.
- **BullMQ for job processing:** LLM roadmap generation is slow and shouldn't block the request-response cycle — jobs are queued and processed asynchronously, with SSE notifying the client on completion.
- **Local MongoDB over Atlas:** Switched to a local MongoDB instance after DNS/carrier-level blocking issues with Atlas during development.

## Status

Actively in development. Backend auth, schema design, job queues, SSE, and admin analytics are built. Frontend (React) is in progress.

## Author

Prasanth — transitioning into backend software development from an Agricultural Engineering background.
