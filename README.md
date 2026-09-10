# FieldFlow Pro — Enterprise Field Service Ticket System
> **VISION71 TECHNOLOGIES — INTERNAL DEVELOPMENT SPRINT**

FieldFlow Pro is a full-featured, enterprise-grade Field Service Management and Escalation Tracking solution built with **TanStack Start**, **React 19**, **Tailwind CSS**, and **Plus Jakarta Sans**. 

Designed for commercial HVAC, Industrial Automation, and Solar Energy operations, FieldFlow bridges dispatch operations, field technicians, and enterprise clients with real-time status tracking, SLA monitoring, mobile field workflows, and automated customer notifications.

---

## 🚀 Key Features

### 👨‍💼 Dispatch & Operations Management
- **8-Stage Ticket Lifecycle**: Unassigned → Assigned → Scheduled → In Transit → In Progress → On Hold → Resolved → Closed.
- **SLA Countdown & Overdue Alerting**: Real-time SLA breach timers based on priority levels (Critical, High, Medium, Low).
- **Technician Workload Balancing**: Real-time technician active job counters & status indicators (Available, In Field, Off Duty).
- **Multi-Filter Dispatch Board**: Search by ticket ID, customer name, date range, status, priority, and technician assignment.
- **Full Audit Trail & History**: Historical log tracking dispatch events, field notes, time logs, and status updates.

### 📱 Mobile Technician Field Workflow
- **Focused Dispatch View**: Mobile-optimized checklist and job priority queue for field technicians.
- **Status Progression**: One-tap status updates (*Start Travel*, *Begin Work*, *Pause/Hold*, *Submit Resolution*).
- **Evidence & Resolution Log**: Capture diagnostic resolution notes, parts replaced, and customer sign-off timestamps.
- **Offline-ready Responsive Layout**: Optimized for mobile handsets, rugged field tablets, and desktop workstations.

### 👤 Customer Self-Service Portal
- **Ticket Tracking**: Dedicated portal for clients to lodge service issues, track real-time technician ETA/status, and view resolution proof.
- **Role-Gated Security**: Direct login & routing for Manager, Field Technician, and Customer views.

---

## 🛠️ Quick Start & Local Development

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** / **bun** / **pnpm**

### Installation

1. **Clone repository**:
   ```bash
   git clone <repository-url>
   cd fieldflow-pro
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start local development server**:
   ```bash
   npm run dev
   ```

4. **Production Build**:
   ```bash
   npm run build
   ```

---

## 🔒 Role-Based Access Credentials (Demo Environment)

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Operations Manager** | `manager@vision71.com` | `admin123` | Full Dispatch, Assign, SLA Controls & Analytics |
| **Field Technician** | `tech@vision71.com` | `tech123` | Assigned Mobile Job Queue, Work Notes & Status |
| **Customer Portal** | `customer@client.com` | `client123` | Own Service Tickets, Real-time Tracker & Resolution Proof |

---

## 🎨 Tech Stack & Architecture

- **Framework**: TanStack Start / React 19 / TypeScript
- **Styling**: Tailwind CSS & Plus Jakarta Sans typography
- **Icons**: Lucide React
- **State Management**: Reactive React Context Store (`src/lib/store.tsx`)
- **Routing**: TanStack Router with role-guarded layout routing
