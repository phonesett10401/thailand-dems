# 🚨 Thailand DEMS - Disaster and Emergency Management System

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/thailand-dems&project-name=thailand-dems&repository-name=thailand-dems&root-directory=frontend&env=NEXT_PUBLIC_API_URL)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

A comprehensive full-stack disaster management system for Thailand, built with Next.js and Node.js.

![DEMS](https://img.shields.io/badge/Status-Student%20demo-blue)
![Next.js](https://img.shields.io/badge/Next.js-14.0-black)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![MySQL](https://img.shields.io/badge/MySQL-8.0-blue)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## 🚀 Quick Deploy (5 Minutes)

**Option 1: One-Click Deploy**
1. Click the "Deploy with Vercel" button above for frontend
2. Click the "Deploy on Railway" button above for backend + database
3. Configure environment variables
4. Done! 🎉

**Option 2: Manual Deploy**
See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for step-by-step guide.

---

## 🌟 Features

### For Citizens
- **Hazard map** - live GDACS disaster alerts and USGS earthquakes, plus sample disasters from the demo database
- **Shelter finder** - sample shelters sorted by distance, with directions handed off to your phone's maps app
- **Evacuation** - nearest open shelters and sample evacuation routes (no automatic route planning)
- **Weather** - live forecast, PM2.5 air quality and river-flow model data from Open-Meteo
- **Incident reporting** - three-step report with optional GPS location
- **Volunteer portal** - register to help during emergencies
- **English / Thai** - full language switch (Thai copy awaiting native review)
- **Assistant** - placeholder; an offline, on-device assistant is planned

### For Administrators
- 📊 **Comprehensive Dashboard** - Real-time statistics and analytics
- 🔥 **Disaster Management** - Create, update, and monitor disasters
- 🏠 **Shelter Coordination** - Manage emergency shelters and capacity
- 📦 **Supply Tracking** - Monitor emergency supplies and resources
- 👥 **Volunteer Management** - Organize and assign volunteers
- 🏛️ **Agency Coordination** - Collaborate with partner organizations
- ⚠️ **Alert System** - Send emergency notifications
- 📈 **Capacity Planning** - Rule-based shelter and volunteer gap suggestions

### What's real vs sample

| Data | Where it comes from |
|---|---|
| Weather, air quality, river flow | Open-Meteo (live) |
| Disaster alerts | GDACS (live) |
| Earthquakes | USGS (live) |
| Shelters, disasters, alerts, volunteers, supplies | Demo data in Supabase Postgres (marked **SAMPLE** in the UI) |
| Evacuation routes | Hard-coded sample list (marked **SAMPLE**) |
| Admin / volunteer login | Supabase Auth, invite-only; the old Next.js `frontend/` still has the legacy demo login |

The new citizen UI lives in `web/` (SvelteKit). The old Next.js UI in `frontend/` is kept until the redesign is complete.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MySQL 8.0+
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/thailand-dems.git
cd thailand-dems
```

**Replace `YOUR_USERNAME` with your actual GitHub username**

2. **Setup Backend**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
```

3. **Setup Database**
```bash
# Create database
mysql -u root -p -e "CREATE DATABASE disaster_management_db;"

# Import schema
mysql -u root -p disaster_management_db < db/schema-disaster.sql
mysql -u root -p disaster_management_db < db/enhanced_system_schema.sql

# Import seed data
mysql -u root -p disaster_management_db < db/seed-disaster.sql
mysql -u root -p disaster_management_db < db/thailand_locations.sql
```

4. **Setup Frontend**
```bash
cd ../frontend
npm install
cp .env.example .env.local
# Edit .env.local with API URL
```

5. **Run Development Servers**
```bash
# Terminal 1 - Backend
cd backend
node server-disaster.js

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

6. **Access the Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📱 Tech Stack

### Frontend
- **Framework**: Next.js 14 (React 18)
- **Styling**: Tailwind CSS
- **Maps**: Leaflet.js
- **Animations**: Framer Motion
- **Icons**: React Icons
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL 8.0
- **Authentication**: JWT (planned)
- **Weather**: `/api/weather` returns mock data; the new UI uses Open-Meteo directly

### Features
- **Assistant**: placeholder only (the old keyword-matching chatbot is not AI)
- **Live data**: public hazard sources fetched on page load
- **Responsive Design**: Mobile, Tablet, Desktop
- **Role-based Access**: Admin vs User permissions
- **Interactive Maps**: Disaster and shelter locations
- **Glassmorphism UI**: Modern, beautiful interface

## 📂 Project Structure

```
DEMS/
├── backend/
│   ├── controllers/       # Business logic
│   ├── routes/           # API endpoints  
│   ├── db/               # Database files
│   │   ├── schema-disaster.sql
│   │   ├── seed-disaster.sql
│   │   └── connection.js
│   ├── middleware/       # Auth & validation
│   └── server-disaster.js
│
├── frontend/
│   ├── app/              # Next.js pages
│   │   ├── admin/       # Admin pages
│   │   ├── disasters/   # Public pages
│   │   └── page.js      # Dashboard
│   ├── components/       # React components
│   │   ├── AIAssistant.js
│   │   ├── ClientLayout.js
│   │   └── ThailandDisasterMap.js
│   └── lib/             # Utilities
│
└── docs/                # Documentation
```

## 🔐 Default Credentials

**Admin Account:**
- Email: admin@dems.go.th
- Password: admin123

**User Account:**
- Email: citizen@example.com  
- Password: user123

⚠️ **Change these immediately in production!**

## 🌐 Live Demo

🔗 **Try it now**: [thailand-dems.vercel.app](https://thailand-dems.vercel.app)

**Demo Credentials:**
- Admin: `admin` / `admin123`
- User: `user` / `user123`

## 🚀 Deployment

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for complete deployment instructions.

**New UI + API (`web/`)**: import the repo in Vercel with Root Directory `web` and set `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `DATABASE_URL` (see `web/.env.example`).

**Recommended Free Stack:**
- **Frontend**: Vercel (Perfect for Next.js)
- **Backend**: Railway.app (Free $5/month credit)
- **Database**: Railway MySQL (Included)
- **Cost**: 100% Free!

## 📖 Documentation

- [Deployment Guide](DEPLOYMENT_GUIDE.md) - How to deploy online
- [UI redesign spec](docs/superpowers/specs/2026-10-09-ui-redesign-design.md) - Design of the new `web/` UI
- [Agency System](docs/AGENCY_SYSTEM_DOCUMENTATION.md) - Partner coordination
- [Shelter System](docs/SHELTER_SYSTEM_DOCUMENTATION.md) - Shelter management
- [Volunteer System](docs/VOLUNTEER_SYSTEM_DOCUMENTATION.md) - Volunteer coordination
- [Alert System](docs/ALERT_SYSTEM_INTEGRATION.md) - Notification system

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- OpenWeatherMap for weather data
- Leaflet.js for mapping
- Thailand government for disaster data
- All contributors and volunteers

## 📞 Support

For support and questions:
- 📧 Email: support@thailand-dems.com
- 🐛 Issues: GitHub Issues
- 📖 Docs: `/docs` folder

## 🗺️ Roadmap

- [ ] Mobile App (React Native)
- [ ] Push Notifications
- [ ] SMS Alerts Integration
- [x] Multi-language Support (Thai/English)
- [ ] Offline on-device emergency assistant (WebLLM + retrieval)
- [ ] Phase 2: optional citizen accounts ("my reports" status, saved province alerts, notifications) as a `citizen` role; needs self sign-up with email confirmation + CAPTCHA, and everything must keep working without an account
- [ ] Drone Integration
- [ ] Blockchain for Aid Tracking
- [ ] API for Third-party Integration

---

**Built with ❤️ for Thailand's Safety**

🚨 **In case of emergency, always call 1669**
