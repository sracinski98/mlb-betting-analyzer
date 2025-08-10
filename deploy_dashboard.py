#!/usr/bin/env python3
"""
MLB Betting Dashboard Deployment Script
Sets up and launches the professional betting analysis dashboard
"""

import subprocess
import sys
import os
import time

def install_requirements():
    """Install required packages for the dashboard"""
    print("🔧 Setting up MLB Betting Dashboard...")
    print("=" * 50)
    
    required_packages = [
        "streamlit>=1.28.0",
        "plotly>=5.15.0",
        "pandas>=2.0.0",
        "requests>=2.31.0"
    ]
    
    print("📦 Installing required packages...")
    
    for package in required_packages:
        try:
            print(f"Installing {package}...")
            result = subprocess.run([sys.executable, "-m", "pip", "install", package], 
                                 capture_output=True, text=True, check=True)
            print(f"✅ {package} installed successfully")
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install {package}: {e}")
            return False
    
    return True

def create_requirements_file():
    """Create requirements.txt for deployment"""
    requirements = """streamlit>=1.28.0
plotly>=5.15.0
pandas>=2.0.0
requests>=2.31.0
"""
    
    with open("requirements.txt", "w") as f:
        f.write(requirements)
    
    print("📄 Created requirements.txt")

def launch_dashboard():
    """Launch the Streamlit dashboard"""
    print("\n🚀 Launching MLB Betting Analysis Dashboard...")
    print("=" * 50)
    print("📊 Dashboard will open in your browser")
    print("🌐 URL: http://localhost:8501")
    print("⚠️  Press Ctrl+C to stop the dashboard")
    print("=" * 50)
    
    # Change to the correct directory
    script_dir = "/Users/steveracinski/Documents/my_project/venv/job-listing-analyzer"
    os.chdir(script_dir)
    
    try:
        # Launch Streamlit dashboard
        subprocess.run([
            sys.executable, "-m", "streamlit", "run", "mlb_dashboard.py",
            "--server.port", "8501",
            "--server.address", "localhost",
            "--server.headless", "false",
            "--browser.gatherUsageStats", "false"
        ], check=True)
    except KeyboardInterrupt:
        print("\n\n👋 Dashboard stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Error launching dashboard: {e}")

def main():
    """Main deployment function"""
    print("⚾ MLB BETTING ANALYSIS DASHBOARD DEPLOYMENT")
    print("=" * 60)
    
    # Check if dashboard file exists
    dashboard_file = "/Users/steveracinski/Documents/my_project/venv/job-listing-analyzer/mlb_dashboard.py"
    if not os.path.exists(dashboard_file):
        print(f"❌ Dashboard file not found: {dashboard_file}")
        return
    
    # Ask user for installation preference
    print("\n📋 Dashboard Deployment Options:")
    print("1. 🚀 Quick Launch (assume packages installed)")
    print("2. 📦 Install Requirements + Launch")
    print("3. 📄 Just create requirements.txt file")
    
    choice = input("\nSelect option (1-3): ").strip()
    
    if choice == "1":
        print("🚀 Launching dashboard with existing packages...")
        launch_dashboard()
    
    elif choice == "2":
        print("📦 Installing requirements first...")
        create_requirements_file()
        
        if install_requirements():
            print("\n✅ All packages installed successfully!")
            time.sleep(2)
            launch_dashboard()
        else:
            print("\n❌ Package installation failed. Please install manually:")
            print("pip install streamlit plotly pandas requests")
    
    elif choice == "3":
        create_requirements_file()
        print("✅ requirements.txt created")
        print("\nTo install packages manually:")
        print("pip install -r requirements.txt")
        print("\nTo launch dashboard manually:")
        print("streamlit run mlb_dashboard.py")
    
    else:
        print("❌ Invalid choice. Please run again and select 1, 2, or 3.")

if __name__ == "__main__":
    main()
