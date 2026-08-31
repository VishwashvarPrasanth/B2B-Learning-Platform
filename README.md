# B2B Learning Platform

A full-stack corporate learning platform that assesses a user's skill level, generates a personalized AI-powered learning roadmap, and tracks their progress through courses, videos, and quizzes — with an admin dashboard and automated email notifications running in the background.

🔗 **Live demo:** [add your deployed link here]
💻 **Frontend:** React + Vite · **Backend:** Node.js + Express + MongoDB

---

## ✨ Features

- **Skill Assessment Engine** — users take a topic-based assessment; scores are computed per topic and stored against their profile.
- **AI-Generated Learning Roadmaps** — powered by **Groq LLM (Llama 3.3)**, generates a personalized course roadmap based on assessment results.
- **Course & Module System** — structured courses broken into modules, with video content and per-module quizzes.
- **Progress Tracking** — tracks video watch progress and quiz attempts per user, per course.
- **Enrollment System** — users enroll in courses and their progress is tracked independently per course.
- **Role-Based Access Control** — separate flows and permissions for regular users and admins.
- **Admin Dashboard** — course/user oversight with scheduled weekly stats via cron jobs.
- **Background Job Processing** — email notifications are queued and processed asynchronously using **BullMQ + Redis**, instead of blocking the main request.
- **Media Uploads** — Cloudinary integration for handling media assets.

---

## 🏗️ Architecture

The backend follows a layered structure: **Routes → Controllers → Models (Mongoose)**, with two async side-systems running independently of the main request/response cycle:

- **BullMQ + Redis** — queues email jobs (e.g. welcome emails, notifications) so they don't block API responses; a separate worker process consumes the queue.
- **node-cron** — runs scheduled jobs (e.g. weekly stats aggregation) independently of user requests.

A detailed sequence-diagram breakdown of the full request flow (auth → assessment → AI roadmap generation → course access → progress tracking) is documented in [`Project_Documentation.md`](./Project_Documentation.md).

---

## 🛠️ Tech Stack

**Backend**
- Node.js, Express 5
- MongoDB with Mongoose
- JWT authentication
- BullMQ + Redis (ioredis) for background job queues
- node-cron for scheduled tasks
- Nodemailer for transactional email
- Groq SDK (Llama 3.3) for AI roadmap generation
- Cloudinary for media storage

**Frontend**
- React + Vite
- React Router (protected routes for auth-gated pages)

---

## 📡 API Overview

**32 REST endpoints** across 9 route modules:

| Module | Endpoints | Handles |
|---|---|---|
| Auth | 2 | Register, login (JWT issuance) |
| Assessment | 2 | Fetch questions, submit & score assessment |
| Roadmap | 2 | AI-generated learning roadmap |
| Courses | 4 | Course listing and content |
| Enrollment | 2 | Enroll in / manage course enrollment |
| Progress | 2 | Track user progress through courses |
| Quiz | 11 | Module quizzes, attempts, and results |
| Video | 6 | Video content and watch-progress tracking |
| Admin | 1 | Admin dashboard operations |

---

## 📂 Project Structure

```
B2B-Learning-Platform/
├── backend/
│   ├── config/         # DB connection, Cloudinary config
│   ├── controllers/     # Route handler logic
│   ├── cron/             # Scheduled jobs (weekly stats)
│   ├── middleware/       # Auth, error handling
│   ├── models/            # Mongoose schemas (User, Course, Quiz, etc.)
│   ├── queues/            # BullMQ email queue + worker
│   ├── routes/             # Express route definitions
│   ├── utils/               # Mailer, helpers
│   └── server.js
└── frontend/
    ├── src/
    │   ├── components/     # Shared components (e.g. ProtectedRoute)
    │   ├── pages/            # Dashboard, CoursePage, Assessment, AdminDashboard, etc.
    │   └── services/         # API client
    └── vite.config.js
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js
- MongoDB instance (local or Atlas)
- Redis instance (for background job queues)
- Groq API key (for roadmap generation)
- Cloudinary account (for media uploads)

### Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in `backend/` with:
```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
REDIS_URL=your_redis_connection_string
GROQ_API_KEY=your_groq_api_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
EMAIL_USER=your_email
EMAIL_PASS=your_email_app_password
```

```bash
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 📖 Further Documentation

- [`Project_Documentation.md`](./Project_Documentation.md) — detailed backend architecture, sequence diagrams, and entity relationships.
- [`USER_MANUAL.md`](./USER_MANUAL.md) — end-user walkthrough of the platform.

---

## 📌 Status

Actively in development — currently expanding the quiz and video-progress systems and refining the admin dashboard.
