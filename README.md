# Mini Kanban Board — Full-Stack Engineering Challenge

A full-stack, collaborative Mini Kanban Board web application built for the **Webbriks Technical Assessment**.

![Tech Stack](https://img.shields.io/badge/Frontend-Next.js%2014%20(React%2C%20TypeScript)-blue)
![Backend](https://img.shields.io/badge/Backend-NestJS%20(TypeScript)-red)
![Database](https://img.shields.io/badge/Database-PostgreSQL%20with%20Prisma-green)
![Package Manager](https://img.shields.io/badge/Package%20Manager-pnpm-orange)

### 🌐 Live Demo & Deployment Links
- 🚀 **Live Web Application:** [https://mini-kanban-board-nu.vercel.app](https://mini-kanban-board-nu.vercel.app)
- 📡 **Live Backend API:** [https://mini-kanban-board-7u8x.onrender.com/api](https://mini-kanban-board-7u8x.onrender.com/api)
- 🗄️ **Managed Database:** Supabase PostgreSQL

---

## 🌟 Features

### 1. Authentication & Collaboration
- **Token-based Authentication:** Secure JWT registration, login, and current user profile verification (`bcrypt` password hashing).
- **Board Sharing:** Boards have an `OWNER` who can invite other registered team members by email or name search as `MEMBER`.
- **Granular Access Control (RBAC):** Strict authorization guards ensure users can only view, edit, or delete boards, columns, and tasks they have explicit access to. Unauthorized cross-board mutation is completely prevented.

### 2. Workflow Management & Task Movement
- **Full CRUD:** Comprehensive management for Boards, Columns, and Tasks.
- **Atomic Task Movement API:**
  - Reordering tasks within the same column.
  - Moving tasks across different columns into specific position indices.
- **Order Consistency:** Powered by atomic Prisma transactions (`$transaction`) that re-normalizes indices deterministically to eliminate collisions, duplicate orders, or indexing gaps.

### 3. Interactive Frontend
- **Fluid Drag-and-Drop:** Smooth and accessible drag-and-drop using `@hello-pangea/dnd`.
- **Optimistic UI:** Instant visual feedback when dragging tasks, with automatic rollback if a network error occurs.
- **Modern Glassmorphic Dark UI:** Styled with Tailwind CSS, custom scrollbars, and modern typography.

---

## 🛠️ Tech Stack

| Layer | Technologies Used |
|---|---|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, `@hello-pangea/dnd`, Lucide Icons, Axios |
| **Backend** | NestJS 10, TypeScript, Passport.js, JWT, bcrypt, class-validator, class-transformer |
| **Database** | PostgreSQL, Prisma ORM 5 |
| **Package Manager** | `pnpm` (Monorepo Workspace) |
| **DevOps** | Docker & `docker-compose.yml` |

---

## 📁 Repository Structure

```
mini-kanban/
├── backend/                  # NestJS API Application
│   ├── prisma/
│   │   └── schema.prisma     # Prisma Data Model (User, Board, BoardMember, Column, Task)
│   ├── src/
│   │   ├── auth/             # JWT Strategy, AuthService, AuthController, Guards
│   │   ├── users/            # User search and profile service
│   │   ├── boards/           # Board CRUD & Member collaboration
│   │   ├── columns/          # Column management and ordering
│   │   ├── tasks/            # Task management & transaction-safe movement engine
│   │   └── prisma/           # Prisma client module
│   ├── .env.example          # Sample backend environment variables
│   └── package.json
├── frontend/                 # Next.js 14 App Router Application
│   ├── src/
│   │   ├── app/              # /login, /register, /boards, /boards/[id]
│   │   ├── components/kanban # KanbanBoard, KanbanColumn, TaskCard, Modals
│   │   ├── context/          # AuthContext & state persistence
│   │   └── lib/              # Axios instance with auth interceptor
│   ├── .env.example          # Sample frontend environment variables
│   └── package.json
├── docker-compose.yml        # Docker Compose configuration for local PostgreSQL
├── pnpm-workspace.yaml       # pnpm monorepo workspace definition
└── README.md
```

---

## 🚀 Step-by-Step Local Setup

### Prerequisites
- **Node.js**: v18 or v20 LTS
- **pnpm**: `npm install -g pnpm`
- **Docker** (optional, for local PostgreSQL)

---

### Step 1: Clone Repository & Install Dependencies
```bash
git clone <your-repository-url>
cd mini-kanban

# Install all dependencies across both backend and frontend
pnpm install
pnpm approve-builds --all
```

---

### Step 2: Configure Environment Variables

#### Backend (`backend/.env`)
Copy sample variables:
```bash
cp backend/.env.example backend/.env
```
Sample contents:
```env
PORT=4000
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/kanbandb"
DIRECT_URL="postgresql://postgres:postgrespassword@localhost:5432/kanbandb"
JWT_SECRET="kanban_super_secret_jwt_key_2026_webbriks"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:3000"
```

*(Note: If using cloud PostgreSQL like Supabase or Neon, paste your cloud connection string into `DATABASE_URL` and `DIRECT_URL`).*

#### Frontend (`frontend/.env.local`)
Copy sample variables:
```bash
cp frontend/.env.example frontend/.env.local
```
Sample contents:
```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

---

### Step 3: Start the Database

#### Option A: Using Docker Compose (Recommended for local evaluation)
```bash
docker compose up -d
```
This starts PostgreSQL 16 on `localhost:5432` with username `postgres`, password `postgrespassword`, and database `kanbandb`.

#### Option B: Using Hosted Database (Supabase / Neon)
Ensure your `.env` contains the Supabase connection string.

---

### Step 4: Run Prisma Migrations
```bash
# Push schema tables to database
pnpm --filter backend prisma db push

# (Optional) Open Prisma Studio GUI
pnpm --filter backend prisma studio
```

---

### Step 5: Start Development Servers

You can start both backend and frontend concurrently from the root:
```bash
# Start backend (port 4000) and frontend (port 3000)
pnpm dev:backend
# In another terminal:
pnpm dev:frontend
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📡 API Endpoints Reference

### Authentication
- `POST /api/auth/register` — Create account (`email`, `password`, `name`)
- `POST /api/auth/login` — Sign in (`email`, `password`) -> returns JWT token
- `GET /api/auth/me` — Get current user (Bearer Token required)

### Users
- `GET /api/users/search?query=` — Search registered users by email/name to invite

### Boards & Access Control
- `POST /api/boards` — Create board (user automatically becomes `OWNER`, auto-generates *To Do*, *In Progress*, *Done* columns)
- `GET /api/boards` — List boards where user is `OWNER` or `MEMBER`
- `GET /api/boards/:id` — Get board with columns, ordered tasks, and member list
- `PATCH /api/boards/:id` — Update board details (Owner only)
- `DELETE /api/boards/:id` — Delete board (Owner only)
- `POST /api/boards/:id/members` — Add collaborator by email (Owner only)
- `DELETE /api/boards/:id/members/:userId` — Remove collaborator (Owner only)

### Columns
- `POST /api/columns/board/:boardId` — Add column to board
- `PATCH /api/columns/:id` — Rename column / update order
- `DELETE /api/columns/:id` — Delete column and its tasks

### Tasks & Movement
- `POST /api/tasks/column/:columnId` — Create task in column
- `PATCH /api/tasks/:id` — Update task title, description, or assignee
- `DELETE /api/tasks/:id` — Delete task and re-index siblings
- `PATCH /api/tasks/:id/move` — **Reorder or cross-column movement endpoint**
  ```json
  {
    "sourceColumnId": "col-uuid-1",
    "targetColumnId": "col-uuid-2",
    "newOrder": 1
  }
  ```

---

## 🚢 Live Deployment

- 🌐 **Frontend (Next.js):** Deployed on [Vercel](https://vercel.com) — [https://mini-kanban-board-nu.vercel.app](https://mini-kanban-board-nu.vercel.app)
- 🔌 **Backend (NestJS):** Deployed on [Render](https://render.com) — [https://mini-kanban-board-7u8x.onrender.com/api](https://mini-kanban-board-7u8x.onrender.com/api)
- 🗄️ **Database:** Hosted on [Supabase](https://supabase.com) PostgreSQL (Singapore region).

---

## 👨‍💻 Submission
- **Candidate:** Samiul Islam
- **Role:** Full-Stack Engineer
- **Challenge:** Mini Kanban Board
- **Assessment by:** **Webbriks**
