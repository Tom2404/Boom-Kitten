<div align="center">
  <h1>Boom-Kitten</h1>
  <p><strong>A Full-stack Multiplayer Card Game Inspired by Exploding Kittens</strong></p>

<p>
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#project-structure">Architecture</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#game-mechanics">Mechanics</a>
  </p>
</div>

---

## 📖 Overview

**Boom-Kitten** is an interactive, real-time multiplayer card game scaffold built with modern web technologies. Inspired by the popular game *Exploding Kittens*, players take turns drawing cards and using various action cards to avoid being eliminated by the explosive "Boom-Kitten" card.

This project serves as a robust template for real-time web gaming, featuring secure authentication, a scalable Node.js backend with Socket.io, and a responsive React frontend.

---

## ✨ Features

### Real-Time Gameplay

- **Seamless Synchronization:** Powered by WebSockets (Socket.io) for instant state updates.
- **Complex Turn Logic:** Includes drawing cards, playing action cards, turn skipping, and targeted attacks.
- **Advanced Mechanics:** Features a dynamic "Nope" window (3s) and "Favor" timeout (15s) system.

### Secure & Scalable Architecture

- **JWT Authentication:** Robust access and refresh token management.
- **Account Recovery:** Change-password and one-time, 15-minute password-reset flows with optional SMTP delivery.
- **Safe Profiles:** Editable usernames and server-approved preset avatars.
- **Room Management:** Players can create, join, and manage custom game rooms.
- **Private Hands:** Sensitive player data is masked and transmitted securely (`game:privateHand`).

### Meta-Game Progression

- **Economy System:** In-game currency with transaction logging for match rewards, daily bonuses, and shop purchases.
- **Top 20 Leaderboard:** Public ranking by matchmaking rating, then wins, at `/api/leaderboard`.
- **Friends:** Search, send/accept/decline requests, remove friends, and invite online friends into waiting rooms without exposing room passwords.
- **Player Safety:** In-game reports feed an admin moderation inbox with case assignment, notes, priority, and status workflow.
- **Cosmetics & Emotes:** Real-time chat and in-game emote system to taunt opponents.

---

## 🛠️ Tech Stack

**Frontend (`client/`)**

- ⚛️ **React 18** - UI Library
- ⚡ **Vite** - Build Tool
- 🎨 **Tailwind CSS** - Styling & Layout
- 🎬 **Framer Motion** - Fluid Animations
- 🔌 **Socket.io-client** - Real-time Communication

**Backend (`server/`)**

- 🟢 **Node.js + Express** - API Framework
- 🔌 **Socket.io** - WebSocket Server
- 🍃 **MongoDB (Mongoose)** - Database ORM
- 🔐 **JWT** - Secure Authentication

---

## 📁 Project Structure

```text
Boom-Kitten/
├── client/src/      # React pages, components, contexts, hooks, and UI utilities
├── client/test/     # Frontend contract and source-level tests
├── server/routes/   # Express REST routes
├── server/services/ # Account, social, moderation, game, and admin services
├── server/sockets/  # Socket.io room and game event handlers
├── server/models/   # Mongoose models
├── server/test/     # Backend unit and integration-contract tests
└── docs/            # Project specifications and documentation
```

---

## 🚀 Getting Started

Follow these steps to run Boom-Kitten locally on your machine.

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** (v9 or higher)
- **MongoDB** instance (Local or Atlas connection string)

### 1. Installation

Install dependencies for the root, frontend, and backend environments simultaneously using the root package script:

```bash
# From the project root directory
npm run install:all
```

### 2. Environment Configuration

Navigate to the `server` directory and set up your environment variables:

```bash
cd server
cp .env.example .env
```

Edit the newly created `.env` file and provide your MongoDB URI, JWT secrets, and desired ports. Configure the optional `SMTP_*` values to deliver password-reset links by email; in development the reset link is also returned by the API for local testing.

### 3. Running the Application

You can start both the frontend and backend development servers concurrently with a single command from the project root:

```bash
npm run dev
```

- **Frontend:** [http://localhost:2404](http://localhost:2404)
- **Backend:** [http://localhost:5000](http://localhost:5000)

---

## 🎮 Game Mechanics Overview

- **Exploding Kitten:** If you draw this, you explode and are out of the game!
- **Defuse:** The only way to survive drawing an Exploding Kitten.
- **Attack:** End your turn without drawing and force the next player to take 2 turns.
- **Skip:** End your turn without drawing a card.
- **Favor:** Force another player to give you a card from their hand.
- **Nope:** Stop any action except an Exploding Kitten or a Defuse (3-second window).

---

## 📜 License

This project is open-source and available under the MIT License.
