# 🚀 Git Repository Setup & Netlify Deployment Guide

## 📋 **COMPLETE STEP-BY-STEP GUIDE**

Follow these steps to create a Git repository, deploy to Netlify, and set up for continuous development.

---

## 🔧 **STEP 1: Initialize Git Repository**

### **1.1 Open Terminal in Project Directory**
```bash
cd /Users/steveracinski/Documents/my_project/venv/job-listing-analyzer
```

### **1.2 Initialize Git Repository**
```bash
# Initialize git repository
git init

# Add all files to staging
git add .

# Create initial commit
git commit -m "🎉 Initial commit: MLB Betting Analytics Web Application

- Complete web-based MLB analysis platform
- Advanced pitcher models and weather analysis  
- Interactive dashboard with 5 organized tabs
- Real-time data from MLB Stats API, Odds API, WeatherAPI
- Mobile responsive design ready for Netlify deployment"
```

---

## 🌐 **STEP 2: Create GitHub Repository**

### **2.1 Create Repository on GitHub**
1. Go to [github.com](https://github.com) and login
2. Click **"New repository"** (green button)
3. **Repository name**: `sports-betting-analytics`
4. **Description**: `Advanced sports betting analysis platform with AI models and real-time data`
5. Set as **Public** (so Netlify can access it)
6. **Do NOT** initialize with README (we already have files)
7. Click **"Create repository"**

### **2.2 Connect Local Repository to GitHub**
```bash
# Add GitHub as remote origin (replace 'yourusername' with your GitHub username)
git remote add origin https://github.com/yourusername/sports-betting-analytics.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## 🚀 **STEP 3: Deploy to Netlify from GitHub**

### **3.1 Connect Netlify to GitHub**
1. Go to [netlify.com](https://netlify.com) and login/signup
2. Click **"New site from Git"**
3. Choose **"GitHub"** as your Git provider
4. **Authorize Netlify** to access your GitHub account
5. Find and select **"sports-betting-analytics"** repository

### **3.2 Configure Build Settings**
- **Branch to deploy**: `main`
- **Build command**: Leave empty (static site)
- **Publish directory**: Leave empty (root directory)
- Click **"Deploy site"**

### **3.3 Customize Site Settings** (Optional but Recommended)
1. **Change site name**:
   - Go to Site settings → General → Site details
   - Click "Change site name"
   - Choose: `mlb-betting-analytics` or `sports-analytics-pro`
   - Your URL becomes: `https://mlb-betting-analytics.netlify.app`

2. **Add custom domain** (if you have one):
   - Go to Site settings → Domain management
   - Add your custom domain

---

## 🔄 **STEP 4: Development Workflow Setup**

### **4.1 Create Development Branches**
```bash
# Create and switch to development branch
git checkout -b develop

# Create feature branches for new sports
git checkout -b feature/nfl-analysis
git checkout -b feature/nba-analysis
git checkout -b feature/nhl-analysis

# Switch back to main
git checkout main
```

### **4.2 Set Up Development Workflow**
```bash
# For daily improvements and bug fixes
git checkout develop
# Make your changes
git add .
git commit -m "🔧 Improve pitcher model accuracy"
git push origin develop

# For new sports features
git checkout -b feature/nfl-analysis
# Build NFL analysis
git add .
git commit -m "✨ Add NFL betting analysis with QB models"
git push origin feature/nfl-analysis
```

---

## 📊 **STEP 5: Future Development Structure**

### **5.1 Recommended File Structure for Multi-Sport**
```
sports-betting-analytics/
├── index.html                 # Main dashboard
├── styles.css                 # Global styles
├── app.js                     # Main application controller
├── sports/
│   ├── mlb/
│   │   ├── mlb-analytics.js   # Current MLB engine
│   │   ├── mlb-models.js      # Advanced MLB models
│   │   └── mlb-data.js        # MLB data sources
│   ├── nfl/
│   │   ├── nfl-analytics.js   # NFL analysis engine
│   │   ├── nfl-models.js      # QB, RB, WR models
│   │   └── nfl-data.js        # NFL data sources
│   ├── nba/
│   │   ├── nba-analytics.js   # NBA analysis engine
│   │   └── nba-models.js      # Player performance models
│   └── nhl/
│       ├── nhl-analytics.js   # NHL analysis engine
│       └── nhl-models.js      # Goalie, scorer models
├── shared/
│   ├── api-client.js          # Shared API utilities
│   ├── chart-utils.js         # Chart configurations
│   └── export-utils.js        # Export functionality
├── netlify.toml               # Deployment config
└── README.md                  # Documentation
```

### **5.2 Development Phases**
```bash
# Phase 1: MLB Enhancement (Current)
git checkout -b feature/mlb-enhancements
# - Add more ballparks
# - Improve weather models
# - Add injury tracking

# Phase 2: NFL Integration
git checkout -b feature/nfl-analysis
# - QB performance models
# - Weather impact on outdoor games
# - Injury reports integration

# Phase 3: NBA Integration  
git checkout -b feature/nba-analysis
# - Player prop analysis
# - Back-to-back game impacts
# - Rest vs travel factors

# Phase 4: NHL Integration
git checkout -b feature/nhl-analysis
# - Goalie analysis
# - Home/away splits
# - Schedule density impacts
```

---

## 🎯 **STEP 6: Execute the Setup**

### **Run These Commands Now:**

```bash
# 1. Initialize Git (in your project directory)
git init

# 2. Add all files
git add .

# 3. Initial commit
git commit -m "🎉 Initial commit: MLB Betting Analytics Web Application

- Complete web-based MLB analysis platform
- Advanced pitcher models and weather analysis  
- Interactive dashboard with 5 organized tabs
- Real-time data from MLB Stats API, Odds API, WeatherAPI
- Mobile responsive design ready for Netlify deployment
- Professional UI with filtering and export functionality"

# 4. Create development branch
git checkout -b develop

# 5. Switch back to main for deployment
git checkout main
```

**After creating GitHub repository:**
```bash
# 6. Connect to GitHub (replace 'yourusername')
git remote add origin https://github.com/yourusername/sports-betting-analytics.git

# 7. Push to GitHub
git branch -M main
git push -u origin main

# 8. Push develop branch too
git checkout develop
git push -u origin develop
git checkout main
```

---

## 🔄 **STEP 7: Continuous Deployment Benefits**

### **Automatic Deployments**
- ✅ **Push to main branch** → Automatic Netlify deployment
- ✅ **Pull request previews** → Test before merging
- ✅ **Branch deployments** → Test features independently
- ✅ **Rollback capability** → Revert if needed

### **Development Benefits**
- ✅ **Version control** → Track all changes
- ✅ **Collaboration** → Multiple people can contribute
- ✅ **Branch protection** → Prevent broken deployments
- ✅ **Issue tracking** → Plan features and fixes
- ✅ **Release notes** → Document improvements

---

## 🎮 **STEP 8: Daily Development Workflow**

### **For Daily Improvements:**
```bash
# Work on develop branch
git checkout develop
git pull origin develop

# Make your changes
# Test locally: python -m http.server 8080

# Commit changes
git add .
git commit -m "🔧 Improve [specific feature]"
git push origin develop

# When ready to deploy
git checkout main
git merge develop
git push origin main  # Triggers automatic Netlify deployment
```

### **For New Sports:**
```bash
# Create feature branch
git checkout develop
git checkout -b feature/nfl-analysis

# Build NFL functionality
# Test thoroughly

# Commit and push
git add .
git commit -m "✨ Add NFL betting analysis engine"
git push origin feature/nfl-analysis

# Create pull request on GitHub
# Merge to develop after review
# Then merge develop to main for deployment
```

---

## 🌟 **BENEFITS OF THIS SETUP**

### **Development Benefits:**
- ✅ **Version Control**: Track every change
- ✅ **Backup**: Code stored safely on GitHub
- ✅ **Collaboration**: Others can contribute
- ✅ **Branching**: Work on features safely
- ✅ **History**: See evolution over time

### **Deployment Benefits:**
- ✅ **Automatic**: Push to main = instant deployment
- ✅ **Preview**: Test features before going live
- ✅ **Rollback**: Easy to revert if needed
- ✅ **Fast**: Netlify CDN for speed
- ✅ **Free**: No hosting costs

### **Scaling Benefits:**
- ✅ **Multi-Sport Ready**: Easy to add NFL, NBA, NHL
- ✅ **Team Development**: Multiple contributors
- ✅ **Feature Flags**: Test new features safely
- ✅ **Documentation**: Track decisions and changes

---

## 🎯 **YOUR NEXT ACTIONS**

1. **✅ NOW**: Run the Git commands above
2. **✅ NEXT**: Create GitHub repository
3. **✅ THEN**: Connect to Netlify
4. **✅ FUTURE**: Add NFL analysis (next major feature)
5. **✅ ONGOING**: Daily improvements and refinements

This setup will give you a professional development workflow just like major software companies use!
