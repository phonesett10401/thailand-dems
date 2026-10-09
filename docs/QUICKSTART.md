# 🚀 Quick Start Guide - Thailand DEMS

## Prerequisites Check

✅ **Node.js v18+** installed  
✅ **MySQL 8.0+** installed and running  
✅ **npm v9+** installed

---

## 🔧 5-Minute Setup

### 1. Database Setup (2 minutes)

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE disaster_management_db;
exit;

# Import schema
cd backend/db
mysql -u root -p disaster_management_db < schema-disaster.sql

# Import Thailand data
mysql -u root -p disaster_management_db < seed-thailand.sql
```

**PowerShell Alternative:**
```powershell
cd "C:\Program Files\MySQL\MySQL Server 8.0\bin"
Get-Content "path\to\DEMS\backend\db\schema-disaster.sql" | .\mysql.exe -u root -p disaster_management_db
Get-Content "path\to\DEMS\backend\db\seed-thailand.sql" | .\mysql.exe -u root -p disaster_management_db
```

---

### 2. Backend Setup (1 minute)

```bash
cd backend
npm install
```

Edit `.env` file:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=disaster_management_db
DB_PORT=3306
PORT=5000
```

Start backend:
```bash
npm run dev
```

**Expected output:**
```
🚀 Server is running on port 5000
✅ Database connected successfully
```

---

### 3. Frontend Setup (2 minutes)

```bash
cd frontend
npm install
npm run dev
```

**Expected output:**
```
▲ Next.js 14.0.4
- Local: http://localhost:3000
✓ Ready in 1325ms
```

---

## 🌐 Access the Application

Open your browser and navigate to:

**Main Dashboard:** http://localhost:3000  
**API Endpoint:** http://localhost:5000

---

## 📍 Key Pages

| Page | URL | Description |
|------|-----|-------------|
| Dashboard | `/` | Main dashboard with map & stats |
| Disaster Map | `/disasters` | Full-page interactive map |
| Shelters | `/shelters` | Shelter management |
| Supplies | `/supplies` | Relief supplies inventory |
| Volunteers | `/volunteers` | Volunteer coordination |

---

## 🎯 First Things to Try

1. **View Interactive Map**
   - Click on disaster markers to see details
   - Click on shelter icons to check capacity
   - View affected areas (circles on map)

2. **Explore Dashboard**
   - Check statistics cards (8 metrics)
   - View active alerts
   - Click disasters in table to zoom on map

3. **Browse Shelters**
   - See capacity and occupancy
   - View linked disasters
   - Check facilities available

4. **Check Supplies**
   - View inventory levels
   - Identify low stock items
   - Track allocations

5. **Review Volunteers**
   - See available volunteers
   - Check skills and locations
   - Monitor deployments

---

## 🔍 Verify Installation

Run these checks:

### Backend Check
```bash
curl http://localhost:5000
```
Should return: API endpoint information

### Database Check
```bash
mysql -u root -p -e "USE disaster_management_db; SELECT COUNT(*) FROM Disasters;"
```
Should return: 12 disasters

### Frontend Check
Open http://localhost:3000  
Should see: Dashboard with Thailand map

---

## 🐛 Quick Troubleshooting

### Backend won't start
```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000

# Kill process if needed (PowerShell)
Get-Process -Id <PID> | Stop-Process -Force
```

### Database connection failed
- Verify MySQL is running
- Check credentials in `.env`
- Ensure database exists: `SHOW DATABASES;`

### Frontend errors
```bash
# Clear cache and rebuild
cd frontend
Remove-Item -Recurse -Force .next
npm run dev
```

### Map not loading
- Check browser console for errors
- Verify Leaflet CSS is loading
- Try refreshing the page

---

## 📦 What's Included

### Sample Data
- ✅ 12 Thailand disasters (floods, earthquakes, wildfires, etc.)
- ✅ 10 shelters across Thailand
- ✅ 15 volunteers with Thai names
- ✅ 12 relief supply types
- ✅ 13 active alerts
- ✅ Real Thai coordinates for all locations

### Features Ready to Use
- ✅ Interactive Leaflet map
- ✅ Real-time disaster tracking
- ✅ Shelter capacity monitoring
- ✅ Supply inventory management
- ✅ Volunteer coordination
- ✅ Emergency alerts system
- ✅ Responsive design
- ✅ Color-coded severity system

---

## 🎨 Customization

### Change Map Center
Edit `frontend/components/ThailandDisasterMap.js`:
```javascript
<MapContainer center={[13.7563, 100.5018]} zoom={6}>
// Change to your preferred coordinates
```

### Add New Disaster Type
Edit `backend/db/schema-disaster.sql`:
```sql
DisasterType ENUM('Earthquake', 'Flood', ..., 'YourType')
```

### Modify Color Scheme
Edit `frontend/app/globals.css` for global styles  
Or modify inline styles in page components

---

## 📚 Next Steps

1. **Explore the API**
   - Try API endpoints at http://localhost:5000/api/disasters
   - Read API documentation in README.md

2. **Customize Data**
   - Add your own disasters via database
   - Update shelter information
   - Add volunteers

3. **Extend Features**
   - Add authentication
   - Implement CRUD forms
   - Add more visualizations

4. **Deploy to Production**
   - Build frontend: `npm run build`
   - Set up production database
   - Configure environment variables
   - Deploy to hosting service

---

## 🆘 Need Help?

1. Check `README.md` for detailed documentation
2. Review `git log` for recent changes
3. Inspect browser console for errors
4. Check backend terminal for API errors
5. Verify database data: `SELECT * FROM Disasters LIMIT 5;`

---

## ✅ Success Indicators

You're all set when you see:

- ✅ Dashboard loads at http://localhost:3000
- ✅ Map displays with disaster markers
- ✅ Statistics show real data (not zeros)
- ✅ Clicking disasters shows details panel
- ✅ All pages load without errors
- ✅ Backend responds at http://localhost:5000

---

**🎉 Congratulations! Your Thailand Disaster Management System is ready!**

**Version:** 2.0  
**Last Updated:** November 22, 2025
