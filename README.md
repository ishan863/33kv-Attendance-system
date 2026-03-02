<div align="center">

# ⚡ 33kV Attendance System

**A modern, real-time employee attendance management platform built for 33kV electrical team operations.**

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Firebase_Hosting-orange?style=for-the-badge)](https://kv-attendance-4e55c.web.app)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)

**Created by Raja Patel**

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Live Demo](#-live-demo)
- [Features & Achievements](#-features--achievements)
- [Tech Stack](#-tech-stack)
- [Architecture](#architecture)
- [Page-by-Page Guide](#how-it-works--page-by-page-guide)
  - [Splash Screen](#-splash-screen)
  - [Login](#-login-page)
  - [Employee Dashboard](#-employee-dashboard)
  - [Supervisor Dashboard](#-supervisor-dashboard)
  - [Admin Panel](#-admin-panel)
- [Real-Time System](#real-time-system)
- [Role-Based Access](#role-based-access-control)
- [Database Structure](#database-structure)
- [Getting Started](#getting-started)
- [Deployment](#deployment)

---

## Overview

The **33kV Attendance System** is a full-stack, real-time attendance management platform designed for electrical utility field teams. Employees mark daily attendance via selfie capture, supervisors view live team matrices, and admins manage the entire workforce with Excel export — all from a beautifully animated, glassmorphism dark UI.

---

## 🚀 Live Demo

🔗 **[https://kv-attendance-4e55c.web.app](https://kv-attendance-4e55c.web.app)**

> Login with your registered phone number. Contact Admin for credentials.

---

## 🏆 Features & Achievements

### Core Features

| Feature | Description |
|---|---|
| 📸 **Selfie Attendance** | Capture photo via device camera when marking Present |
| 🔴 **Real-Time Sync** | Records update live on all devices via Firestore `onSnapshot` |
| 👤 **3-Role System** | Employee / Supervisor / Admin — each with a separate dashboard |
| 📅 **Leave Management** | Apply single or multi-day leaves with a date range picker |
| 📊 **Attendance Matrix** | Visual daily grid per employee for any date range |
| 📤 **Excel Export** | Color-coded, formatted `.xlsx` export via ExcelJS |
| 🔒 **One Record Per Day** | Upsert logic enforces one attendance entry per employee per date |
| 📱 **Mobile Friendly** | Fully responsive — works on phones, tablets, desktops |
| ⚡ **Animated Splash Screen** | SVG circular progress ring with glow, orbiting rings, bolt icon |
| 🔄 **Persistent Login** | Session stays active — no re-login on page refresh |

### UI / UX Highlights

- Glassmorphism dark design system with animated mesh background
- Skeleton shimmer loaders replacing plain spinners
- Staggered list item fade-in animations
- Badge pulse glow for "Present" status
- Photo modal with smooth scale-in + image fade
- Page slide-in transitions
- Live 🔴 green pulse dot on real-time sections
- Button press scale feedback on all interactive elements
- Mobile bottom-sheet modals for native-like experience

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite 5 |
| **Database** | Firebase Firestore (real-time NoSQL) |
| **Hosting** | Firebase Hosting |
| **Auth** | Custom phone-number login (Firestore lookup) |
| **Camera** | Browser `getUserMedia` API |
| **Photo Storage** | Base64 compressed thumbnail in Firestore (no Firebase Storage needed) |
| **Excel Export** | ExcelJS — formatted sheets with colors & borders |
| **Date Handling** | date-fns |
| **Icons** | Font Awesome 6 |
| **Notifications** | react-hot-toast |
| **Routing** | react-router-dom v6 |
| **Styles** | Custom CSS (glassmorphism design system, no CSS framework) |

---

## Architecture

```
src/
├── components/
│   ├── SplashScreen.jsx    # Animated loading screen (shown once per session)
│   ├── SplashScreen.css
│   ├── Navbar.jsx          # Top navigation bar
│   ├── CameraCapture.jsx   # Selfie camera modal
│   └── Camera.css
├── context/
│   └── AuthContext.jsx     # Global auth state
├── firebase/
│   ├── config.js           # Firebase init + .env validation
│   └── services.js         # All Firestore CRUD + real-time listeners
├── pages/
│   ├── Login.jsx
│   ├── EmployeeDashboard.jsx / .css
│   ├── SupervisorDashboard.jsx / .css
│   ├── AdminPanel.jsx / .css
│   └── SetupScreen.jsx     # Shown when .env is missing
├── styles/
│   └── global.css          # Design tokens, animations, mobile breakpoints
└── App.jsx                 # Routes, splash gate, auth guards
```

---

## How It Works — Page by Page Guide

---

### ⚡ Splash Screen

**File:** `src/components/SplashScreen.jsx`

The first thing every user sees:

- **Circular SVG progress ring** — fills 0→100% with animated cyan gradient stroke and drop shadow glow
- **Glowing ⚡ bolt icon** pulses in the center with radiating glow
- **3 concentric orbiting rings** rotate at different speeds (12s / 18s / 24s)
- **Dot grid background** with floating radial gradient blobs
- Shows brand name, subtitle "Powering Attendance System...", animated 3-dot loader, and "Created by Raja Patel"
- Only appears **once per browser session** — stored via `sessionStorage`
- Exits with a smooth scale + fade-out transition

---

### 🔑 Login Page

**File:** `src/pages/Login.jsx`

1. Enter registered **phone number**
2. System queries Firestore `employees` collection for `phone == input AND status == 'active'`
3. On match → user saved to `AuthContext` + `localStorage` → auto-redirect by role:
   - `employee` → `/dashboard`
   - `supervisor` → `/supervisor`
   - `admin` → `/admin`
4. On mismatch → error toast shown

No passwords, no OTP — designed for internal field teams.

---

### 👷 Employee Dashboard

**File:** `src/pages/EmployeeDashboard.jsx`

**The employee's personal attendance hub — everything in one place.**

#### Header Card
- Greeting (Morning / Afternoon / Evening based on time)
- Full name, team, designation
- Live date number, month/year, day of week

#### Today's Attendance *(🔴 Live — real-time)*
- **Skeleton loader** while status is fetching
- If not yet marked → 3 action buttons:
  | Button | What happens |
  |---|---|
  | ✅ Present | Opens camera → capture selfie → marks Present with photo |
  | 🟡 Leave | Opens Leave modal to pick date range |
  | ❌ Off / Absent | Marks directly, no photo |
- Once marked → colored status card shows (green/yellow/red) with status, time, and "View Photo" button
- **Real-time**: If admin updates your record elsewhere, it reflects instantly

#### Attendance Stats Ring
- Circular SVG donut chart for the current month
- Shows Present / Leave / Off counts with live month total
- Percentage in the center

#### Upcoming Leaves
- Lists all approved future leave dates

#### Attendance History *(month navigation)*
- `← Previous` / `Next Month →` navigation
- Each record: date, weekday label, status badge, time, photo camera icon
- Click camera icon → opens **photo modal** (no new tab)
- Staggered animation as records load

#### Leave Modal
- Pick start and end date (today or future)
- Applies leave to every day in the range (max 31 days)
- Validation: end ≥ start, max range enforced

---

### 👨‍💼 Supervisor Dashboard

**File:** `src/pages/SupervisorDashboard.jsx`

**Live team attendance matrix — the supervisor's command center.**

#### Date Range Controls
- **Week** — last 7 days (default)
- **Month** — full current month
- **Custom** — manual from/to date pickers

#### Team Filter *(Admin only)*
- Dropdown populated from active employees' `team` field
- "All Teams" shows everyone; select a team to filter matrix

#### Attendance Matrix Table
| Column | Description |
|---|---|
| Employee | Avatar initial + name + designation |
| Team | Team name in cyan |
| Date columns | One column per day in selected range |
| Summary | P / L / O counts for the employee |

**Cell values:**
- `P` = Present (green)
- `L` = Leave (yellow)
- `O` = Off/Absent (red)
- `—` = No record (grey)
- 📷 icon = photo available — click cell to view photo in modal

**Real-time**: `onSnapshot` subscription auto-updates the matrix as employees mark attendance.

#### Stats Cards (top)
- Total Records · Present · Leave · Off/Absent

---

### 🛡 Admin Panel

**File:** `src/pages/AdminPanel.jsx`

**Full workforce management — 3 tabs.**

#### Tab 1: Employees
- Searchable list of all employees
- **Add**: Name, Phone, Team, Designation, Role (employee/supervisor/admin), Status
- **Edit**: Update any field — opens pre-filled modal
- **Delete**: Permanently removes employee from Firestore
- **Import Excel**: Bulk upload employees from a `.xlsx` file
- List is **real-time** — reflects changes immediately

#### Tab 2: Teams
- Create teams with name + assigned supervisor
- Edit or delete existing teams

#### Tab 3: Attendance
- **Date range presets**: Last 7 Days / This Month / Custom
- **Employee search filter**
- **Status edit inline**: Change any record's status via dropdown — updates Firestore instantly
- **Photo viewer**: Click 📷 icon → opens modal (no new tab ever)
- **Export to Excel**:
  - Formatted with ExcelJS (colors, borders, bold headers)
  - Green rows = Present, Yellow = Leave, Red = Off
  - Auto column widths, company header row, date range label
- **Real-time**: Table updates automatically without refresh

---

## Real-Time System

```
Employee taps "Present" → takes selfie
              ↓
     markAttendance() writes to Firestore
              ↓
     Firestore onSnapshot fires on all listeners
              ↓
  ┌─────────────────────────────────────────────────┐
  │  Employee Dashboard  → today card updates live   │
  │  Supervisor Matrix   → cell turns green (P)      │
  │  Admin Panel Table   → new row appears / updates │
  └─────────────────────────────────────────────────┘
```

**Three listeners in `services.js`:**

```js
// Employee's own today record
subscribeToTodayAttendance(employeeId, callback)

// Date range for supervisor/admin matrix/table
subscribeToAttendanceRange(startDate, endDate, callback)

// All employees (admin employee list)
subscribeToEmployees(callback)
```

Each returns an `unsubscribe` function called in `useEffect` cleanup — **zero memory leaks**.

---

## Role-Based Access Control

| Route | Employee | Supervisor | Admin |
|---|:---:|:---:|:---:|
| `/dashboard` | ✅ | ✅ | ✅ |
| `/supervisor` | ❌ | ✅ | ✅ |
| `/admin` | ❌ | ❌ | ✅ |

`ProtectedRoute` in `App.jsx` checks `user.role` and redirects automatically if unauthorized.

---

## Database Structure

### `employees`
```json
{
  "name": "JOGESWAR DHAREI",
  "phone": "9876543210",
  "team": "Team Alpha",
  "designation": "Lineman",
  "role": "employee",
  "status": "active",
  "createdAt": "Timestamp"
}
```

### `attendance`
```json
{
  "employeeId": "doc_id",
  "employeeName": "JOGESWAR DHAREI",
  "team": "Team Alpha",
  "date": "2026-03-03",
  "status": "Present",
  "time": "9:05:23 am",
  "photoUrl": "data:image/jpeg;base64,...",
  "markedBy": "self",
  "timestamp": "Timestamp"
}
```

### `teams`
```json
{
  "teamName": "Team Alpha",
  "supervisorName": "RAJESH KUMAR",
  "createdAt": "Timestamp"
}
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- Firebase project (free Spark plan works)

### 1. Clone

```bash
git clone https://github.com/ishan863/33kv-Attendance-system.git
cd 33kv-Attendance-system
npm install
```

### 2. Environment Setup

Create `.env` in the project root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> Get values from: **Firebase Console → Project Settings → Your Apps → SDK config (Web)**

### 3. Run Dev Server

```bash
npm run dev
# → http://localhost:5173
```

### 4. Build

```bash
npm run build
```

---

## Deployment

### Firebase Hosting

```bash
# Install CLI (once)
npm install -g firebase-tools

# Login
firebase login

# Build + Deploy
npm run build
firebase deploy --only hosting
```

Live at: `https://YOUR_PROJECT_ID.web.app`

### Firestore Indexes

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

---

## Project Highlights

- 📸 **No Firebase Storage** — photos stored as ~8KB base64 JPEG thumbnails in Firestore directly (no CORS, no extra billing, no Storage setup)
- ⚡ **Zero polling** — pure `onSnapshot` subscriptions with automatic cleanup
- 🔒 **Session splash** — splash only shows once per session, not on every React route change
- 📱 **Bottom-sheet modals** on mobile viewports for native app feel
- 🎨 **Zero CSS framework** — fully custom design system with CSS custom properties
- 📊 **ExcelJS over XLSX** — full cell-level formatting (colors, borders, fonts), not just raw data dump

---

<div align="center">

**Built with ⚡ by Raja Patel**

*33kV Team Attendance System — Powering field workforce management*

</div>

---

## 🚀 Features

| Feature | Description |
|---|---|
| 📱 Phone Login | Login by mobile number — no OTP |
| 📸 Selfie Attendance | Camera capture + Firebase Storage upload |
| ✅ Mark Present / Leave / Off | One-tap attendance marking |
| 🤖 Auto OFF | Cloud Function marks absent employees as OFF at 8 PM |
| 📊 Matrix Dashboard | Supervisor sees team attendance grid (P/L/O) |
| 🔐 Role-Based Access | Employee / Supervisor / Admin |
| 👤 Admin Panel | Add/Edit/Delete employees, manage teams |
| 📥 Excel Export | Download attendance reports |
| 🎨 3D Glassmorphism UI | Floating cards, animated gradients |

---

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Custom CSS (Glassmorphism, CSS animations)
- **Backend**: Firebase (Firestore + Storage + Hosting + Cloud Functions)
- **Auth**: Custom phone-number lookup (no OTP/Firebase Auth)
- **Export**: SheetJS (xlsx)

---

## 📁 Project Structure

```
src/
├── App.jsx                   # Router + auth
├── main.jsx
├── context/
│   └── AuthContext.jsx       # Auth state (localStorage)
├── firebase/
│   ├── config.js             # Firebase init
│   └── services.js           # Firestore CRUD
├── pages/
│   ├── Login.jsx             # Phone login
│   ├── EmployeeDashboard.jsx # Mark attendance
│   ├── SupervisorDashboard.jsx # Matrix view
│   └── AdminPanel.jsx        # Full admin control
├── components/
│   ├── Navbar.jsx
│   └── CameraCapture.jsx     # Webcam selfie
└── styles/
    └── global.css

functions/
└── index.js                  # Auto-OFF cloud function
```

---

## ⚙️ Setup & Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project (e.g., `33kv-attendance`)
3. Enable **Firestore Database** (production mode)
4. Enable **Firebase Storage**
5. Enable **Firebase Hosting**
6. Get your web app config (`Project Settings > Your apps > Web app`)

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your Firebase values:
```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc
```

### 4. Run Development Server

```bash
npm run dev
```

---

## 🗃️ Firestore Structure

### `employees` Collection
```
{
  name: "Rahul Singh",
  phone: "9876543210",
  team: "Line Team A",
  designation: "Lineman",
  role: "employee",         // employee | supervisor | admin
  status: "active",
  createdAt: Timestamp
}
```

### `attendance` Collection
```
{
  employeeId: "abc123",
  employeeName: "Rahul Singh",
  team: "Line Team A",
  date: "2026-03-02",
  status: "Present",        // Present | Leave | Off
  photoUrl: "https://...",
  time: "09:15 AM",
  timestamp: Timestamp,
  markedBy: "self"          // self | system_auto | admin_manual
}
```

### `teams` Collection
```
{
  teamName: "Line Team A",
  supervisorName: "Amit Sharma",
  createdAt: Timestamp
}
```

---

## 👤 Adding First Admin

Since login requires a registered number, add the admin directly in Firestore:

1. Go to **Firestore > employees** collection
2. Click `+ Add document`
3. Add fields:
   - `name: "Your Name"`
   - `phone: "9876543210"`
   - `role: "admin"`
   - `status: "active"`
   - `team: "Admin"`
   - `designation: "Administrator"`

Then login at your app with that phone number → you'll land on the Admin panel.

---

## 🚀 Deploy to Firebase Hosting

```bash
# Build the app
npm run build

# Install Firebase CLI (once)
npm install -g firebase-tools
firebase login

# Deploy
firebase deploy
```

---

## ⚡ Auto-OFF Cloud Function

Runs **every day at 8:00 PM IST** via Firebase Cloud Scheduler.

```bash
cd functions
npm install

# Deploy only functions
firebase deploy --only functions
```

---

## 📊 Supervisor Matrix View

```
Employee    | 01 | 02 | 03 | 04 | 05 | Summary
──────────────────────────────────────────────
Rahul Singh | P  | P  | L  | O  | P  | 3P 1L 1O
Amit Kumar  | P  | O  | P  | P  | L  | 3P 1L 1O
```
- **P** = Present (click cell → view photo)
- **L** = Leave
- **O** = Off / Absent

---

## 📱 Mobile Responsive

All pages work on mobile browsers. For PWA (installable app), a `manifest.json` can be added.

---

## 🔐 Firestore Security Rules

See `firestore.rules` — allows open reads for login lookups, restricts writes appropriately.

---

## 📝 License

Internal use — 33KV Electrical Department
