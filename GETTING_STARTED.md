# 🎬 Thailand DEMS - Getting Started Guide

## 👋 Welcome!

This guide will help you get Thailand DEMS deployed and running in **5 minutes**.

---

## 🎯 Choose Your Path

### 🚀 Path 1: Deploy to Production (Recommended)
**Perfect for**: Making it live on the internet  
**Time**: 5-10 minutes  
**Cost**: 100% Free

➡️ **Follow**: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

### 💻 Path 2: Run Locally (Development)
**Perfect for**: Testing and development  
**Time**: 10 minutes  
**Cost**: Free

➡️ **Follow instructions below**

---

## 💻 Local Development Setup

### Prerequisites
- Windows 10/11
- Node.js 18+ ([Download](https://nodejs.org))
- MySQL 8.0+ ([Download](https://dev.mysql.com/downloads/installer/))
- Git ([Download](https://git-scm.com/download/win))

### Installation

#### 1. Clone or Download
```powershell
# If you have git:
git clone https://github.com/YOUR_USERNAME/thailand-dems.git
cd thailand-dems

# Or download ZIP from GitHub and extract
```

#### 2. Setup Database
```powershell
# Open MySQL Command Line or MySQL Workbench
# Run these commands:

CREATE DATABASE disaster_management_db;
USE disaster_management_db;

# Import schemas
source C:/Users/phone/OneDrive/Desktop/DEMS/backend/db/schema-disaster.sql;
source C:/Users/phone/OneDrive/Desktop/DEMS/backend/db/enhanced_system_schema.sql;

# Optional: Import seed data
source C:/Users/phone/OneDrive/Desktop/DEMS/backend/db/seed-disaster.sql;
source C:/Users/phone/OneDrive/Desktop/DEMS/backend/db/thailand_locations.sql;
```

#### 3. Setup Backend
```powershell
cd backend
npm install

# Create .env file
Copy-Item .env.example .env

# Edit .env with your MySQL password
notepad .env
```

**Edit `.env` file:**
```env
DATABASE_HOST=localhost
DATABASE_USER=root
DATABASE_PASSWORD=YOUR_MYSQL_PASSWORD
DATABASE_NAME=disaster_management_db
PORT=5000
NODE_ENV=development
```

#### 4. Setup Frontend
```powershell
cd ..\frontend
npm install

# Create .env.local file
Copy-Item .env.example .env.local

# Edit .env.local
notepad .env.local
```

**Edit `.env.local` file:**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

#### 5. Start Servers

**Option A: Use Batch Files (Easy)**
```powershell
# Go to project root
cd ..

# Start both servers
.\start-dems.bat
```

**Option B: Manual Start**

Terminal 1 (Backend):
```powershell
cd backend
node server-disaster.js
```

Terminal 2 (Frontend):
```powershell
cd frontend
npm run dev
```

#### 6. Access the App
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **API Test**: http://localhost:5000/api/disasters

---

## 🎓 Quick Tutorial

### First Login
1. Go to http://localhost:3000
2. Click "Roadmap" tab to see development plan
3. Click "Login" tab
4. Select "Admin Access"
5. Use credentials:
   - Username: `admin`
   - Password: `admin123`

### Create Your First Disaster
1. After login, click "Disasters" in sidebar
2. Click "Add Disaster" button
3. Fill in:
   - Type: Flood
   - Severity: High
   - Title: Test Flood Event
   - Description: Testing disaster management
   - Location: Bangkok
   - Coordinates: 13.7563, 100.5018
4. Click "Create Disaster"
5. See it on the map! 🗺️

### Explore Other Features
- **Shelters**: Add emergency shelters
- **Volunteers**: Manage volunteer assignments
- **Supplies**: Track relief supplies
- **Weather**: View 5-day forecasts
- **Agencies**: Partner coordination
- **Reports**: User-submitted reports

---

## 🔧 Troubleshooting

### Backend won't start
**Error**: `ECONNREFUSED` or `Access denied for user`

**Fix**:
1. Check MySQL is running (Services → MySQL80)
2. Verify password in `backend/.env`
3. Check database exists: `SHOW DATABASES;`

### Frontend can't connect to backend
**Error**: `Network Error` in browser console

**Fix**:
1. Verify backend is running on port 5000
2. Check `NEXT_PUBLIC_API_URL` in `frontend/.env.local`
3. Clear browser cache (Ctrl + Shift + Delete)

### Port already in use
**Error**: `Port 3000 is already in use`

**Fix**:
```powershell
# Kill process on port 3000
Get-NetTCPConnection -LocalPort 3000 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }

# Or use different port
$env:PORT=3001; npm run dev
```

### Database connection failed
**Error**: `ER_BAD_DB_ERROR: Unknown database`

**Fix**:
```sql
-- Recreate database
DROP DATABASE IF EXISTS disaster_management_db;
CREATE DATABASE disaster_management_db;
USE disaster_management_db;
SOURCE path/to/schema-disaster.sql;
SOURCE path/to/enhanced_system_schema.sql;
```

---

## 📱 Features Tour

### 🏠 Dashboard
- Real-time disaster statistics
- Active disasters map
- Shelter capacity overview
- Recent activities

### 🔥 Disaster Management
- Create/edit/delete disasters
- Interactive map with markers
- Severity levels (Low/Medium/High/Critical)
- Status tracking (Active/Contained/Resolved)

### 🏘️ Shelter System
- Add emergency shelters
- Track capacity (current/max)
- Assign to disasters
- View on map

### 👥 Volunteer Portal
- Register volunteers
- Assign to disasters
- Track hours and assignments
- Skill management

### 📦 Supply Distribution
- Manage relief supplies
- Track inventory
- Distribution records
- Expiry date alerts

### 🌤️ Weather Integration
- Current weather
- 5-day forecast
- Temperature, humidity, wind
- Weather alerts

---

## 🚀 Deploy to Production

When ready to go live:

1. **Read the guides**:
   - [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Detailed guide

2. **Push to GitHub** (`git push`); Vercel and Railway deploy from the repo.

3. **Follow platform setup**:
   - Vercel (Frontend): 2 minutes
   - Railway (Backend + DB): 3 minutes

4. **Total time**: ~5 minutes  
   **Your live URL**: `https://thailand-dems.vercel.app`

---

## 📚 Additional Resources

### Documentation
- [ERD Diagram](backend/db/ENHANCED_SYSTEM_ERD.md)
- [API Documentation](docs/API_DOCUMENTATION.md)
- [Agency System](docs/AGENCY_SYSTEM_DOCUMENTATION.md)

### Community & Support
- GitHub Issues: Report bugs
- Discussions: Ask questions
- Pull Requests: Contribute

---

## 🎉 Success!

You now have:
- ✅ Thailand DEMS running locally
- ✅ Full disaster management capabilities
- ✅ Interactive maps and real-time data
- ✅ Admin and user access
- ✅ Ready to deploy to production

**Next Steps**:
1. Explore all features
2. Test with sample data
3. Customize for your needs
4. Deploy to production
5. Share with emergency teams!

---

## 🚨 Emergency Hotline

**Thailand Disaster & Emergency Services**: ☎ **1784**

Available 24/7 for real emergencies.

---

**Built with ❤️ for Thailand's Safety**

Version: 2.0.0 | Last Updated: November 24, 2025
