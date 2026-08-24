<div align="center">

# 🎓 UniShare

*A full-stack campus marketplace and community platform — students buy, sell, barter, and share subscriptions, chat in real time, and post to a campus feed, all behind university ID verification.*

<br/>

🔗 **Live app:** https://unishare-chi.vercel.app/

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/express-000000?style=for-the-badge&logo=express&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)
![SQLite](https://img.shields.io/badge/sqlite-%2307405e.svg?style=for-the-badge&logo=sqlite&logoColor=white)
![Firebase](https://img.shields.io/badge/firebase-ffca28?style=for-the-badge&logo=firebase&logoColor=black)

</div>

---

## 📖 Table of Contents
- [✨ Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [🧪 Testing](#-testing)
- [📦 Production Build](#-production-build)
- [🌐 Deployment](#-deployment)
- [🗂️ Project Structure](#️-project-structure)

---

## ✨ Features

**Marketplace**
* **🛍️ Buy, sell & barter listings** — post items to sell for cash, share for free, or trade, with categories, condition, and images.
* **🤝 Borrow & trade requests** — request to borrow an item or propose a trade, with a full accept/decline/return lifecycle tracked in the requester's and seller's dashboards.
* **🛒 Cart & checkout** — cart management with real payment processing via **SSLCommerz** (sandbox/mock mode supported for local dev).
* **⭐ Reviews & ratings** — buyers rate sellers after completed orders.
* **❤️ Favorites & seller profiles** — save listings and browse a seller's public profile and rating history.

**Subscription & Group Sharing**
* **👥 Co-subs (subscription groups)** — pool and split shared subscriptions or sublets with configurable spots, price, and duration.

**Campus Community**
* **📰 Real-time community feed** — posts with categories (general, help, lost & found, events, study, housing), urgency flags, resolved status, image/video attachments, likes, and threaded comments.
* **🚩 Moderation & reporting** — users can report posts; admins review, dismiss, restrict, or ban from a dedicated admin queue.

**Real-Time & Notifications**
* **💬 Live chat & inbox** — direct messaging with reactions, replies, edit/delete, and read receipts over **Socket.IO**.
* **🔔 Push notifications** — instant in-app notifications for new requests, messages, order updates, and community activity, with deep links to the relevant page.

**Accounts & Trust**
* **🔐 Email/password + Google sign-in** — JWT-based auth with **Firebase Authentication** for Google OAuth, plus secure password reset via emailed tokens.
* **🪪 University ID verification** — students submit their university email/ID for admin review before unlocking marketplace transactions.
* **🛠️ Admin dashboard** — manage users, verification requests, orders, and community reports from one place.

**Platform**
* **⚡ Modern React 19 UI** — fast, strictly-typed frontend built on **Vite** with **React Router DOM** and **TanStack Query** for data fetching/caching.
* **📱 Responsive design** — fluid, mobile-first UI styled with **Tailwind CSS**.
* **📊 Personal dashboard** — track listings, groups, requests, orders, and account settings in one view.

---

## 🛠️ Tech Stack

| Category | Technologies |
| --- | --- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, React Router DOM, Zod, Framer Motion, Lucide-React |
| **Backend** | Node.js, Express.js, Socket.IO, Better-SQLite3 |
| **Auth** | JWT (jsonwebtoken + bcryptjs), Firebase Authentication (Google OAuth) |
| **Payments** | SSLCommerz (sslcommerz-lts), with mock mode for local development |
| **Email** | Nodemailer-based mailer for password reset flows |
| **Testing** | Vitest, React Testing Library, JSDOM |
| **Deployment** | Vercel (frontend static build) + Railway (Node/Express/Socket.IO API), with a GitHub Pages workflow also available |
| **CI/CD** | GitHub Actions |

---

## 🚀 Getting Started

### Prerequisites

You will need [Node.js](https://nodejs.org/) (v20.19.0 or newer) installed on your local machine.

### Environment Setup

1. Copy the example env files:
   ```bash
   cp .env.example .env
   cp frontend/.env.example frontend/.env
   ```
2. Update `JWT_SECRET` in the root `.env` before using the app outside local development.
3. Fill in Firebase config values if you want Google sign-in working locally (see `frontend/src/lib/firebase.ts`).
4. The frontend talks to the backend through the Vite dev proxy, so `VITE_API_URL` can be left as `/api` in `frontend/.env` during local development.
5. SSLCommerz falls back to a mock checkout flow automatically when store credentials aren't set, so payments can be tested without a merchant account.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Tanjamul-Azad/UniShare.git
   cd UniShare
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```
   > *Note: This runs `dev:frontend` and `dev:backend` concurrently — the Vite dev server and the Express/Socket.IO API — via `concurrently`.*

4. **Open your browser**
   Navigate to the local URL output in the terminal (usually `http://localhost:5173`).

---

## 🧪 Testing

The repository uses `Vitest` as the testing framework.

* **Run all tests once:**  
  ```bash
  npm run test
  ```
* **Run tests in watch mode:**  
  ```bash
  npm run test:watch
  ```

---

## 📦 Production Build

To compile the project for deployment:

```bash
npm run build
```

This command generates production-ready static assets positioned inside the `frontend/dist` directory.

---

## 🌐 Deployment

UniShare deploys as two services:

* **Frontend** — static build deployed to **Vercel** (`vercel.json`), served at [unishare-chi.vercel.app](https://unishare-chi.vercel.app/).
* **Backend** — the Express/Socket.IO API deploys to **Railway** (`railway.toml`), with a health check at `/api/health`.

A GitHub Pages workflow (`.github/workflows/deploy-pages.yml`) is also available for deploying a static frontend build directly from `main`, as an alternative to Vercel.

> **⚠️ Backend Hosting Note:**  
> If self-hosting the backend elsewhere, make sure the environment supports long-lived Node.js processes (for Socket.IO) and update the client-side `VITE_API_URL` to point at that host.

---

## 🗂️ Project Structure

```text
📦 UniShare
├── 📂 .github/          # GitHub Actions CI/CD workflows
├── 📂 backend/           # Node.js Express & Socket.io server
│   ├── 📂 db/            # SQLite schema, seed data, DB access
│   ├── 📂 lib/            # Firebase Admin, mailer
│   ├── 📂 middleware/    # Auth middleware
│   ├── 📂 routes/         # REST API (auth, marketplace, community, orders, ...)
│   └── 📂 socket/         # Socket.IO event handlers
├── 📂 frontend/          # React application
│   ├── 📂 src/
│   │   ├── 📂 components/ # Shared UI + community components
│   │   ├── 📂 context/    # Socket/auth context providers
│   │   ├── 📂 lib/         # API client, types, validation
│   │   └── 📂 pages/       # Route-level pages, incl. admin & dashboard
│   ├── 📂 test/            # Vitest setup scripts
│   └── 📄 vite.config.ts  # Vite builder setup
├── 📂 scripts/            # Workspace maintenance scripts
├── 📄 vercel.json         # Vercel deployment config (frontend)
├── 📄 railway.toml        # Railway deployment config (backend)
└── 📄 package.json        # NPM dependencies & workspace scripts
```
