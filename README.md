# CodeSync AI — Enterprise-grade Real-Time Collaborative Coding & Interview Platform

CodeSync AI is an open-source, startup-quality, real-time collaborative IDE, whiteboarding, and technical interviewing platform. Designed with premium aesthetics, rich dark UI elements, glassmorphism, and smooth micro-animations, it serves as the ultimate multiplayer playground for engineers and hiring teams.

---

## 🚀 Key Features

* **Multiplayer Code Workspace**: Real-time collaborative document editing leveraging localized version synchronization and custom cursor/selection overlay tracking inside Monaco Editor.
* **Integrated Audio/Video & Chat**: True P2P WebRTC-based voice/video channels signaling over WebSocket (STOMP), with live messaging and typing indicator feedback.
* **Collaborative whiteboard**: Sync-synchronized drawing workspace mapping rectangles, circles, freehand, colors, and line widths across all participants.
* **Docker Sandboxed Code Execution**: Custom, resource-restricted containerization engine executing user programs inside secure, un-networked sub-processes with 5-second CPU hard limits.
* **AI Coding Copilot Panel**: Side-pane assistant facilitating instant code evaluations, automated time/space complexity estimates, algorithm hint generations, and technical interview feedbacks.
* **Session Playbacks Timeline**: Media-controller scrubbing that replays complete typing strokes and drawing coordinates step-by-step for post-interview audits.
* **Interactive Dashboards**: Rich charts analyzing coding streaks, problem completion distributions, language preferences, and room durations.

---

## 🛠 Tech Stack

* **Backend**: Java 21, Spring Boot 3, Spring Security, JWT (io.jsonwebtoken), WebSockets (STOMP), Hibernate JPA, PostgreSQL, Redis.
* **Frontend**: React, TypeScript, Tailwind CSS, Monaco Editor (`@monaco-editor/react`), Zustand, Axios, Recharts, Framer Motion.
* **DevOps**: Docker, Docker Compose, Nginx.

---

## 📂 Project Structure

```text
codesync-ai/
├── backend/                  # Spring Boot backend
├── frontend/                 # React SPA frontend
├── docker-compose.yml        # Multi-container conductor
└── README.md                 # Project handbook
```

---

## 🏁 Quick Start (Local Run)

### Prerequisites
* **Java 21** & **Maven**
* **Node.js v20+**
* **Docker** & **Docker Compose**

### Step 1: Clone and Scrape Database Settings
Launch the background datastores (PostgreSQL and Redis):
```bash
docker-compose up -d postgres redis
```

### Step 2: Configure Environment Variables
Create a `.env` file at the root or set the variables in your execution shells:
```properties
JWT_SECRET=5367566B59703373367639792F423F4528482B4D6251655468576D5A71347437
OPENAI_API_KEY=your-openai-api-key-here # Optional: AI defaults to demo sandbox mode if blank
```

### Step 3: Run Backend Service
Navigate to `/backend` and execute:
```bash
mvn spring-boot:run
```
The server will boot on port `8080` with endpoints exposed at `http://localhost:8080/api/v1/...` and WebSocket entry point at `ws://localhost:8080/ws-collab`.

### Step 4: Run Frontend Workspace
Navigate to `/frontend`, install packages, and boot Vite server:
```bash
npm install
npm run dev
```
Open `http://localhost:5173` to see the live, gorgeous glassmorphic dashboard!

---

## 🛰 REST API & WebSocket Specifications

### Authentication REST Endpoints
* `POST /api/v1/auth/register` — Create user profile
* `POST /api/v1/auth/login` — Sign in and acquire Bearer JWT Token
* `GET /api/v1/auth/me` — Read current logged-in session profiles

### Room Management REST Endpoints
* `POST /api/v1/rooms` — Open a new public or private collaboration room
* `GET /api/v1/rooms/{roomCode}` — Read active participants and editor settings for a room
* `GET /api/v1/rooms/history` — Fetch recently participated coding rooms

### Execution & AI REST Endpoints
* `POST /api/v1/rooms/{roomId}/execute` — Run active code safely in Docker/Cloud Execution
* `POST /api/v1/rooms/{roomId}/ai-query` — Issue coding feedback requests to OpenAI models

### WebSocket Messaging Channels (STOMP)
* Destination Prefix: `/app`
* Topic Subscriptions:
  * `/topic/room/{roomCode}/code` — Listens for editor code changes
  * `/topic/room/{roomCode}/cursors` — Listens for user caret selections
  * `/topic/room/{roomCode}/chat` — Live room message board
  * `/topic/room/{roomCode}/whiteboard` — Real-time drawing canvas sync
  * `/topic/room/{roomCode}/webrtc` — Voice/Video Peer signaling SDP blocks
  * `/topic/room/{roomCode}/participants` — Live member lists
