# B2B Learning Platform - User Manual & Guide

Welcome to the **B2B Learning Platform**! This guide explains how general users (employees) and administrators use the system, detailing the step-by-step workflow from authentication to progress tracking.

---

## Table of Contents
1. [User Roles](#1-user-roles)
2. [General User Workflow](#2-general-user-workflow)
   - [Step 1: Registration & Login](#step-1-registration--login)
   - [Step 2: Taking the Skill Assessment](#step-2-taking-the-skill-assessment)
   - [Step 3: Generating Your AI Roadmap](#step-3-generating-your-ai-roadmap)
   - [Step 4: Email Notification](#step-4-email-notification)
   - [Step 5: Viewing Courses and Modules](#step-5-viewing-courses-and-modules)
   - [Step 6: Dashboard & Tracking Progress](#step-6-dashboard--tracking-progress)
3. [Administrator Workflow](#3-administrator-workflow)
   - [Creating Courses & Modules](#creating-courses--modules)
   - [Monitoring Analytics](#monitoring-analytics)
4. [Testing the Flows (Using cURL / Postman)](#4-testing-the-flows-using-curl--postman)

---

## 1. User Roles
The platform defines two main roles in [`User.js`](file:///d:/B2B-Learning%20Platform/backend/models/User.js):
* **`user` (Employee)**: Can take assessments, generate personal roadmaps, view courses, and track their learning progress.
* **`admin` (Organization Admin / Instructor)**: Can create courses, add learning modules, and view overall platform usage analytics.

---

## 2. General User Workflow

### Step 1: Registration & Login
To start using the platform, register a new account and log in.

* **Register**: Create an account with the role set to `"user"`.
  * Endpoint: `POST /api/auth/register`
* **Login**: Authenticate using your credentials.
  * Endpoint: `POST /api/auth/login`
  * Response contains a **JWT Token**. Keep this token safe; you must include it in the `Authorization` header as `Bearer <JWT_TOKEN>` for all subsequent requests.

---

### Step 2: Taking the Skill Assessment
Before learning, you must take a skill assessment to evaluate your current knowledge levels across various topics (HTML, CSS, JavaScript, React, etc.).

1. **Retrieve Questions**: 
   * Endpoint: `GET /api/assessment/questions`
   * This fetches questions from the question pool. Correct answers are hidden to prevent cheating.
2. **Submit Answers**: 
   * Endpoint: `POST /api/assessment/submit`
   * Send your chosen options in the request. The backend calculates your score percentage for each topic (e.g., 80% on HTML, 30% on JavaScript) and updates your profile metadata (`assessmentDone: true`).

---

### Step 3: Generating Your AI Roadmap
Once the assessment is completed, you can trigger the AI roadmap generator to analyze your scores and build a personalized path.

* Endpoint: `POST /api/roadmap/generate`
* **What happens behind the scenes**:
  1. The backend gathers your topic scores.
  2. It formats a prompt detailing your scores and sends it to the **Groq LLM (Llama-3.3-70b-versatile)**.
  3. The LLM designs a customized list of recommended modules (suggesting beginners' content for weak areas and skipping basics for topics you scored highly in).
  4. The generated roadmap is stored in MongoDB, linked to your user account.

---

### Step 4: Email Notification
As soon as your roadmap is generated, the backend automatically triggers a welcome email via **Nodemailer**.

* **Nodemailer / SMTP**: Sends a beautifully styled HTML summary of your customized modules directly to your inbox.
* **BullMQ Pipeline**: (Optional architecture) Relies on a Redis queue (`emailQueue`) and background workers to handle email dispatches asynchronously without slowing down your roadmap generation page load.

---

### Step 5: Viewing Courses and Modules
With your roadmap in hand, browse the official courses listed on the platform.

* **Get All Published Courses**:
  * Endpoint: `GET /api/courses`
  * Displays a list of all courses curated by administrators.
* **Get Course Details & Modules**:
  * Endpoint: `GET /api/courses/:courseId`
  * Returns the full course details and all its individual learning modules sorted in sequential order.

---

### Step 6: Dashboard & Tracking Progress
As you study each module, you can keep track of what you have finished:

1. **Mark Module as Completed**:
   * Endpoint: `POST /api/progress/complete`
   * Logs a progress stamp in the database for the active module.
2. **Retrieve Progress Summary**:
   * Endpoint: `GET /api/progress/:courseId`
   * Displays the total modules in the course, how many you have completed, and your calculated overall progress percentage (e.g., `45% completed`).

---

## 3. Administrator Workflow

### Creating Courses & Modules
Administrators populate the learning catalog.
1. **Create Course**:
   * Endpoint: `POST /api/courses`
   * Allows creating a course header specifying titles and descriptions.
2. **Add Module**:
   * Endpoint: `POST /api/courses/:courseId/modules`
   * Appends educational modules (specifying difficulty level, description, duration, and order) to a specific course.

### Monitoring Analytics
* **Admin Dashboard**:
  * Endpoint: `GET /api/admin/dashboard`
  * Retrieves global user counts, course counts, module counts, and latest analytics stats.
* **Weekly Automated Cron Job**:
  * Executed every Monday at 7:00 AM.
  * Measures global platform engagement and saves historical snapshots to the `DailyStats` collection.

---

## 4. Testing the Flows (Using cURL / Postman)

Refer to the API endpoints and payloads below to test the general user workflow:

### A. Register a User
```bash
curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"name": "John Doe", "email": "john@example.com", "password": "password123", "role": "user"}'
```

### B. Submit Assessment Answers
```bash
curl -X POST http://localhost:5000/api/assessment/submit \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     -d '{"answers": [{"questionId": "64c8a...", "selectedAnswer": "Option A"}]}'
```

### C. Generate Roadmap
```bash
curl -X POST http://localhost:5000/api/roadmap/generate \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### D. Complete a Module
```bash
curl -X POST http://localhost:5000/api/progress/complete \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     -d '{"courseId": "COURSE_ID", "moduleId": "MODULE_ID"}'
```
