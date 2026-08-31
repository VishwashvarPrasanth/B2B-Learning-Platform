# B2B Learning Platform - Backend Flow & Relationship Documentation

This document provides a detailed architectural breakdown of the B2B Learning Platform backend (located in the `/backend` folder). It covers the complete request-response flow from User Login to the Dashboard, the background processing pipelines (BullMQ, Redis, Cron, and Mailer), and the Database Entity-Relationship (ER) model.

---

## 1. Complete End-to-End User Flow

The diagram below details the step-by-step workflow of a user navigating the platform, showing how HTTP routes, controllers, Mongoose models, external APIs (Groq LLM), Redis/BullMQ queues, and Nodemailer integrate.

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Client
    participant AuthAPI as Auth Routes & Controller
    participant AssessAPI as Assessment Routes & Controller
    participant RoadmapAPI as Roadmap Routes & Controller
    participant CourseAPI as Course Routes & Controller
    participant ProgressAPI as Progress Routes & Controller
    participant AdminAPI as Admin Routes & Controller
    participant DB as MongoDB
    participant Redis as Redis Server
    participant Queue as BullMQ (emailQueue)
    participant Worker as BullMQ (emailWorker)
    participant LLM as Groq LLM (Llama 3.3)
    participant SMTP as Nodemailer (Gmail)

    %% Auth Flow
    rect rgb(240, 248, 255)
        Note over User, DB: 1. Registration & Authentication Flow
        User->>AuthAPI: POST /api/auth/register { name, email, password, role }
        AuthAPI->>DB: Find existing User / Hash Password / Save User
        DB-->>AuthAPI: User Created
        AuthAPI-->>User: Success response + JWT Token (signed with JWT_SECRET)

        User->>AuthAPI: POST /api/auth/login { email, password }
        AuthAPI->>DB: Query User by Email
        DB-->>AuthAPI: User Object (Hashed Password)
        AuthAPI-->>User: Return JWT Token (role, user details)
    end

    %% Assessment Flow
    rect rgb(255, 240, 245)
        Note over User, DB: 2. Assessment Phase
        User->>AssessAPI: GET /api/assessment/questions (Header: Bearer JWT)
        AssessAPI->>DB: Question.find({}, { correctAnswer: 0 }) [Hide correct answers]
        DB-->>AssessAPI: Questions List
        AssessAPI-->>User: Returns Questions list to Client

        User->>AssessAPI: POST /api/assessment/submit { answers: [{ questionId, selectedAnswer }] }
        AssessAPI->>DB: Question.find() [Fetch all questions to verify]
        DB-->>AssessAPI: Questions with Correct Answers
        Note over AssessAPI: Computes score % per Topic
        AssessAPI->>DB: User.findByIdAndUpdate(userId, { metadata: { assessmentDone: true, scores } })
        DB-->>AssessAPI: Saved
        AssessAPI-->>User: Returns Computed Scores per Topic
    end

    %% Roadmap Generation Flow
    rect rgb(245, 255, 250)
        Note over User, SMTP: 3. Roadmap Generation (LLM & Background Messaging)
        User->>RoadmapAPI: POST /api/roadmap/generate (Header: Bearer JWT)
        RoadmapAPI->>DB: User.findById(userId) [Get user scores]
        DB-->>RoadmapAPI: User Document
        Note over RoadmapAPI: Formulates Prompt with scores & static availableModules

        RoadmapAPI->>LLM: Send Prompt to groq.chat.completions.create (llama-3.3-70b-versatile)
        LLM-->>RoadmapAPI: JSON Array of recommended topics, levels, order, & reasons
        RoadmapAPI->>DB: Roadmap.create({ userId, modules })
        DB-->>RoadmapAPI: Roadmap Created

        alt Direct Nodemailer Flow (Implemented)
            RoadmapAPI->>SMTP: sendWelcomeEmail(user.email, user.name, roadmap)
            SMTP-->>RoadmapAPI: Email Sent
        else BullMQ Queue Flow (Configured Architecture)
            RoadmapAPI->>Queue: emailQueue.add('sendWelcomeEmail', { to, name, roadmap })
            Queue->>Redis: Persist job metadata in Redis
            Redis-->>Queue: Acknowledged
            Note over Worker: Worker continuously polls Redis
            Worker->>Redis: Fetch next job
            Redis-->>Worker: Job Data
            Worker->>SMTP: sendWelcomeEmail(to, name, roadmap)
            SMTP-->>Worker: Email Transmitted
        end
        RoadmapAPI-->>User: Returns Generated Roadmap
    end

    %% Course Listing Flow
    rect rgb(253, 245, 230)
        Note over User, DB: 4. Course Enrollment & Retrieval
        User->>CourseAPI: GET /api/courses (Header: Bearer JWT)
        CourseAPI->>DB: Course.find({ isPublished: true })
        DB-->>CourseAPI: List of published courses
        CourseAPI-->>User: Return Courses

        User->>CourseAPI: GET /api/courses/:courseId
        CourseAPI->>DB: Course.findById(courseId) & Module.find({ courseId }).sort({ order: 1 })
        DB-->>CourseAPI: Course metadata & ordered modules list
        CourseAPI-->>User: Return Course and modules details
    end

    %% Dashboard / Progress Flow
    rect rgb(240, 255, 240)
        Note over User, DB: 5. Dashboard & Progress Tracking
        User->>ProgressAPI: GET /api/progress/:courseId
        ProgressAPI->>DB: Module.countDocuments({ courseId }) & Progress.countDocuments({ userId, courseId })
        DB-->>ProgressAPI: Total vs Completed count
        Note over ProgressAPI: Computes percentage
        ProgressAPI-->>User: Returns { totalModules, completed, completePercentage }

        User->>ProgressAPI: POST /api/progress/complete { courseId, moduleId }
        ProgressAPI->>DB: Progress.findOne({ userId, courseId, moduleId })
        alt Not Completed Yet
            ProgressAPI->>DB: Progress.create({ userId, courseId, moduleId })
            DB-->>ProgressAPI: Progress Created
        end
        ProgressAPI-->>User: Complete confirmation
    end

    %% Admin Analytics & Cron Flow
    rect rgb(255, 250, 240)
        Note over User, DB: 6. Admin Dashboard & Weekly Scheduled Cron Job
        AdminAPI->>DB: User.countDocuments() / Course.countDocuments() / Module.countDocuments()
        AdminAPI->>DB: DailyStats.findOne().sort({ date: -1 })
        DB-->>AdminAPI: Stats
        AdminAPI-->>User: Returns Global Platform Analytics

        Note over DB: Scheduled node-cron triggers every Monday at 7:00 AM ('0 7 * * 1')
        DB->>DB: Count Users, Courses, and Progress documents
        Note over DB: Computes avgProgress = (totalProgress / totalUsers) * 100
        DB->>DB: DailyStats.create({ totalUsers, totalCourses, avgProgress })
    end
```

---

## 2. Database Schema & Relationships (ERD)

The databases are connected through document-oriented references (`mongoose.Schema.Types.ObjectId`). The Entity-Relationship Diagram below displays exactly how the database collections link together.

```mermaid
erDiagram
    User {
        ObjectId _id PK
        String name
        String email "Unique"
        String password "Hashed"
        String role "user / admin"
        Object metadata "assessmentDone, scores"
        Date createdAt
        Date updatedAt
    }

    Course {
        ObjectId _id PK
        String title
        String description
        ObjectId createdBy FK "Refers to User"
        Boolean isPublished
        Date createdAt
        Date updatedAt
    }

    Module {
        ObjectId _id PK
        ObjectId courseId FK "Refers to Course"
        String title
        String description
        String contentUrl
        Number duration
        Number order
        String skillTag
        String difficulty "beginner / intermediate / advanced"
        Date createdAt
        Date updatedAt
    }

    Progress {
        ObjectId _id PK
        ObjectId userId FK "Refers to User"
        ObjectId courseId FK "Refers to Course"
        ObjectId moduleId FK "Refers to Module"
        Date completedAt
        Date createdAt
        Date updatedAt
    }

    Roadmap {
        ObjectId _id PK
        ObjectId userId FK "Refers to User"
        Array modules "topic, level, reason, order, completed"
        Date generatedAt
        Date createdAt
        Date updatedAt
    }

    Question {
        ObjectId _id PK
        String question
        Array options
        String correctAnswer
        String topic
        String difficulty "easy / medium / hard"
        Date createdAt
        Date updatedAt
    }

    DailyStats {
        ObjectId _id PK
        Date date
        Number totalUsers
        Number totalCourses
        Number avgProgress
        Date createdAt
        Date updatedAt
    }

    %% Relationships
    User ||--o{ Course : "creates"
    User ||--o{ Progress : "records progress for"
    User ||--o| Roadmap : "has personalized"
    Course ||--|{ Module : "contains"
    Course ||--o{ Progress : "tracked under"
    Module ||--o{ Progress : "marks completion of"
```

### Relationship Details:
1. **User ↔ Course**: A 1-to-many relationship (`createdBy` links to `User`). This signifies which administrator created the course.
2. **Course ↔ Module**: A 1-to-many relationship. The `Module` schema references `Course` via `courseId`. A course contains multiple learning modules sorted sequentially.
3. **User ↔ Progress**: A 1-to-many relationship. The `Progress` collection links `userId`, `courseId`, and `moduleId` to track exactly which user completed what module.
4. **User ↔ Roadmap**: A 1-to-1 relationship mapping user skill assessments to an LLM-tailored learning plan.
5. **Question & DailyStats**:
   - `Question` represents assessment pool components and has no direct DB keys linking to other models. Instead, questions are matched logically in memory via their `topic` attribute.
   - `DailyStats` records snapshots of global usage analytics generated on a scheduler.

---

## 3. Background Processing Integration Detail
The system utilizes a modern asynchronous stack for mail delivery:
* **Redis (`ioredis`)**: Instantiated via [connection.js](file:///d:/B2B-Learning%20Platform/backend/queues/connection.js). Serves as the storage and message broker backend.
* **BullMQ (`Queue` & `Worker`)**: 
  - [emailQueue.js](file:///d:/B2B-Learning%20Platform/backend/queues/emailQueue.js) creates an entrypoint named `emailQueue`.
  - [emailWorker.js](file:///d:/B2B-Learning%20Platform/backend/queues/emailWorker.js) processes jobs of type `sendWelcomeEmail` by polling Redis.
* **Nodemailer**: Connects via Gmail SMTP configured in [mailer.js](file:///d:/B2B-Learning%20Platform/backend/utils/mailer.js) to compile and send template emails containing the dynamic user roadmap.
