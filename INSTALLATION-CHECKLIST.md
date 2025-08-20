# PFMT Application - Installation Checklist

## ✅ Pre-Installation Requirements

### System Requirements
- [ ] Node.js 20.0.0 or higher installed
- [ ] npm 10.0.0 or higher installed
- [ ] Git installed (optional, for version control)
- [ ] PostgreSQL installed (optional, for full database features)

### Check Your System
```bash
node --version    # Should be 20.0.0+
npm --version     # Should be 10.0.0+
```

## 📦 Installation Steps

### Step 1: Extract Application
- [ ] Extract `pfmt_complete_fixed.zip` to your desired location
- [ ] Navigate to the extracted folder: `cd pfmt_complete_fixed`

### Step 2: Backend Setup
```bash
cd backend
```
- [ ] Install dependencies: `npm install`
- [ ] Copy environment file: `cp .env.example .env`
- [ ] Edit `.env` file with your settings (optional)
- [ ] Test backend: `node server.js` (should start on port 3001)

### Step 3: Frontend Setup
```bash
cd ../frontend
```
- [ ] Install dependencies: `npm install`
- [ ] Copy environment file: `cp .env.example .env.local` (optional)
- [ ] Test frontend build: `npm run build` (should complete without errors)

### Step 4: Development Start
```bash
cd ..
```
- [ ] Make startup script executable: `chmod +x start-dev.sh`
- [ ] Start development environment: `./start-dev.sh`
- [ ] Verify frontend loads: http://localhost:5173
- [ ] Verify backend API: http://localhost:3001/health

## 🔧 Configuration Verification

### Backend Configuration Check
- [ ] Server starts without errors
- [ ] Port 3001 is available and accessible
- [ ] CORS origins include localhost:5173
- [ ] All routes load successfully (17 routes expected)
- [ ] Health endpoint responds: `curl http://localhost:3001/health`

### Frontend Configuration Check
- [ ] Vite dev server starts on port 5173
- [ ] API proxy correctly forwards to backend
- [ ] No TypeScript compilation errors
- [ ] Application loads in browser
- [ ] API calls work (check browser network tab)

## 🚨 Troubleshooting Common Issues

### Port Conflicts
**Issue**: "EADDRINUSE: address already in use"
**Solution**: 
```bash
# Check what's using the port
lsof -i :3001
# Kill the process or change PORT in .env
```

### Dependency Issues
**Issue**: "Module not found" errors
**Solution**:
```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install
```

### CORS Errors
**Issue**: API calls blocked by CORS
**Solution**: Verify ALLOWED_ORIGINS in backend/.env includes your frontend URL

### Database Connection
**Issue**: Database connection errors
**Solution**: Set `BYPASS_AUTH=true` in backend/.env for development

## 📋 Post-Installation Verification

### Functional Tests
- [ ] Frontend loads without console errors
- [ ] Backend API responds to health checks
- [ ] Navigation between pages works
- [ ] API calls complete successfully
- [ ] File uploads work (if applicable)
- [ ] Authentication flow works (if enabled)

### Performance Tests
- [ ] Frontend builds in reasonable time (< 2 minutes)
- [ ] Backend starts quickly (< 10 seconds)
- [ ] API responses are fast (< 1 second)
- [ ] Hot reload works in development

## 🎯 Success Criteria

Your installation is successful when:

✅ **Backend Status**
- Server starts on port 3001
- Health check returns 200 OK
- All 17 routes load successfully
- No critical errors in console

✅ **Frontend Status**
- Vite dev server runs on port 5173
- Application loads in browser
- No TypeScript errors
- API calls work through proxy

✅ **Integration Status**
- Frontend can communicate with backend
- CORS allows cross-origin requests
- Authentication works (if enabled)
- File operations work (if applicable)

## 📞 Getting Help

If you encounter issues:

1. **Check the logs**: Look for error messages in terminal output
2. **Review configuration**: Ensure .env files are properly set
3. **Verify dependencies**: Run `npm list` to check installed packages
4. **Test individually**: Start backend and frontend separately
5. **Check documentation**: Review DEPLOYMENT-GUIDE.md for detailed instructions

## 🔄 Next Steps After Installation

1. **Development**: Start building features using the development environment
2. **Database**: Set up PostgreSQL if you need full database functionality
3. **Testing**: Run the test suites to ensure everything works
4. **Deployment**: Follow production deployment guide when ready

Your PFMT application is now ready for development! 🚀

