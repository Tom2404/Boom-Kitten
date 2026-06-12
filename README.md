# Mèo Nổ (Boom-Kitten)

Full-stack multiplayer **Exploding Kittens** style game scaffold with React + Vite frontend and Node.js + Express + Socket.io backend.

## Project Structure

- `client/` — React 18 + Vite + Tailwind + Socket.io-client + Framer Motion
- `server/` — Express + Socket.io + MongoDB (Mongoose) + JWT auth

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB connection string

## Setup

### 1) Install dependencies

To install dependencies for root, client, and server all at once, run:

```bash
npm run install:all
```

### 2) Configure environment

Copy the backend environment template and customize your values:

```bash
cd server
cp .env.example .env
# Then edit .env values
```

### 3) Run Frontend & Backend together

Start both frontend and backend development servers concurrently with a single command from the root directory:

```bash
npm run dev
```

Frontend runs on `http://localhost:2404`, backend on `http://localhost:5000`.

## Implemented Highlights

- JWT auth with access + refresh tokens
- Auth middleware attaching `req.user`
- Core room/deck/game logic modules under `server/game/`
- Socket events for rooms, card play, draw, Nope window (3s), Favor timeout (15s), chat, emotes
- Private hand emission per player (`game:privateHand`)
- Economy model + transaction logging for daily bonus, shop purchase, and game rewards
- REST APIs for auth, users, rooms, shop, and leaderboard
