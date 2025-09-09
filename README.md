# 🖥️ Workstation Monitor Agent

A lightweight cross-platform monitoring agent for Windows, Linux, and macOS.  
It tracks **UltraViewer status**, **network connectivity**, and **speed test metrics**,  
then pushes the data to **Supabase** for storage and real-time monitoring.  

Includes a **live terminal dashboard** using `blessed` and `blessed-contrib`.

---

## ✨ Features
- ✅ Detect if **UltraViewer** is running
- 🌐 Check basic **network connectivity** (ping to 8.8.8.8)
- 🚀 Run periodic **speed tests** (download, upload, ping)
- 📡 Store results in **Supabase** (`workstations` table)
- 📊 Live **terminal dashboard** with real-time updates
- 📝 Logs to `agent.log` via `winston`

---

## 📂 Project Structure
src/
├── agent.js # Main monitoring loop (runs continuously)
├── terminal.js # Live dashboard (blessed + supabase subscription)
├── checkProcess.js # UltraViewer process detection
├── checkNetwork.js # Basic network connectivity
├── checkSpeed.js # Speed test helper
├── utils.js # Host info + logger
├── db/
│ └── supabase.js # Supabase client setup
└── config/
└── settings.js # Config (intervals, cycle count, etc.)

yaml
Copy code

---

## ⚙️ Setup

### 1. Clone repo
```bash
git clone https://github.com/YOUR_USERNAME/workstation-monitor-agent.git
cd workstation-monitor-agent
2. Install dependencies
bash
Copy code
npm install
3. Configure environment
Create a .env file:

ini
Copy code
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-anon-or-service-role-key
4. Run the agent
bash
Copy code
node src/agent.js
5. Run the dashboard
bash
Copy code
node src/terminal.js
🗄️ Supabase Table Schema
sql
Copy code
create table if not exists workstations (
  host_name text primary key,
  os text not null,
  updated_at timestamptz not null default now(),
  is_ultraviewer_on boolean not null,
  is_online boolean not null,
  ping_ms numeric,
  download_mbps numeric,
  upload_mbps numeric
);
Enable realtime:

sql
Copy code
alter publication supabase_realtime add table workstations;
📦 Dependencies
supabase-js

ping

winston

blessed

blessed-contrib