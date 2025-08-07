# PFMT Complete Application - Deployment Guide

## 🎯 What This Repository Contains

This is a **complete, fixed version** of your PFMT application with all wizard and project listing issues resolved. It's a 1:1 replacement for your current repository.

## ✅ Issues Fixed

### 1. Project Wizard Complete Functionality
- **5-Step Wizard**: Template Selection → Basic Info → Budget → Team → Review & Create
- **All Screens Present**: Your original repository already had the complete wizard
- **UUID Authentication**: Fixed backend authentication mismatch
- **Project Creation**: Wizard now successfully creates projects and redirects to details

### 2. Project Listing & Filtering
- **"My Projects"**: Shows only user-assigned projects
- **"All Projects"**: Shows all accessible projects based on role
- **Role-Based Access**: Project Managers, Directors, and Senior PMs see appropriate projects
- **Enhanced API**: Backend now supports all filtering parameters

### 3. Database & Infrastructure
- **UUID Support**: Complete UUID schema fixes
- **Required Tables**: All wizard tables created automatically
- **Seed Data**: Default users, templates, and sample projects
- **Docker Ready**: Complete container setup with proper initialization

## 🚀 Quick Deployment

### Option 1: Docker Deployment (Recommended)
```bash
# 1. Replace your current repository with this complete version
# 2. Start the application
docker-compose up -d

# 3. Verify deployment
curl http://localhost:3002/api/health
open http://localhost:3000
```

### Option 2: Local Development
```bash
# 1. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 2. Start backend
cd backend && npm start

# 3. Start frontend (separate terminal)
cd frontend && npm run dev
```

## 🔧 What's Included

### Backend Enhancements
- **devAuth Middleware**: Development authentication with UUID support
- **Enhanced Project Routes**: User-based filtering for "My Projects" vs "All Projects"
- **Project Model Updates**: Role-based access control
- **Database Migrations**: Automated UUID fixes and table creation

### Frontend Enhancements
- **API Service Updates**: Complete filter parameter support
- **Existing Wizard**: Your complete 5-step wizard (already working)
- **Project Navigation**: Proper redirect after wizard completion

### Database & Infrastructure
- **Complete Schema**: All required tables with UUID support
- **Seed Data**: Default users, project templates, sample data
- **Docker Configuration**: Proper initialization and health checks
- **Migration System**: Automated database updates

## 📋 Verification Checklist

After deployment, verify these work:

### Backend Health
- [ ] Backend starts without errors
- [ ] Health endpoint responds: `curl http://localhost:3002/api/health`
- [ ] Wizard initialization works: `curl -H "x-user-id: 550e8400-e29b-41d4-a716-446655440002" http://localhost:3002/api/project-wizard/init`

### Frontend Functionality
- [ ] Frontend loads: `http://localhost:3000`
- [ ] "Create New Project" button works (no 500 errors)
- [ ] Complete 5-step wizard without errors
- [ ] Project creation redirects to project details
- [ ] "My Projects" vs "All Projects" show different filtered results

### Database Integration
- [ ] Database containers start successfully
- [ ] All required tables exist
- [ ] Sample data is loaded
- [ ] User authentication works

## 🔒 Security Notes

### Development vs Production

**This version includes development features:**
- `BYPASS_AUTH=true` for easy development
- Development users with simple passwords
- devAuth middleware for automatic user context

**For production deployment:**
1. Set `BYPASS_AUTH=false`
2. Implement proper authentication
3. Remove development users
4. Use secure passwords and secrets
5. Enable SSL/HTTPS

See `DEPLOYMENT_CHECKLIST.md` for complete production security guide.

## 🐛 Troubleshooting

### Common Issues

**500 Error on Wizard:**
```bash
# Check backend logs
docker-compose logs backend

# Verify database connection
docker-compose exec postgres psql -U pfmt_user -d pfmt_integrated -c "SELECT 1;"
```

**Empty Project Lists:**
```bash
# Check if sample projects exist
docker-compose exec postgres psql -U pfmt_user -d pfmt_integrated -c "SELECT COUNT(*) FROM projects;"
```

**Docker Issues:**
```bash
# Reset everything
docker-compose down -v
docker-compose up -d
```

## 📞 Support

### Test Commands
```bash
# Test wizard initialization
curl -X POST -H "x-user-id: 550e8400-e29b-41d4-a716-446655440002" \
     -H "x-user-role: Project Manager" \
     -H "x-user-name: Test User" \
     http://localhost:3002/api/project-wizard/init

# Test project listing with filters
curl -H "x-user-id: 550e8400-e29b-41d4-a716-446655440002" \
     "http://localhost:3002/api/projects?userId=550e8400-e29b-41d4-a716-446655440002"
```

### Development Users
- **Project Manager**: ID `550e8400-e29b-41d4-a716-446655440002`
- **Director**: ID `550e8400-e29b-41d4-a716-446655440003`
- **Senior PM**: ID `550e8400-e29b-41d4-a716-446655440004`

## 🎉 Success!

When everything is working:
- ✅ No 500 errors on wizard initialization
- ✅ Complete 5-step wizard flow works
- ✅ Project creation and redirect to details
- ✅ "My Projects" and "All Projects" filtering
- ✅ Role-based project access control

Your complete PFMT application with working wizard and project management is ready! 🎯

