#!/usr/bin/env python3
"""
Production MLB Dashboard Launcher
Simple one-command launcher for daily betting analysis
"""

import subprocess
import sys
import os
import time

def main():
    """Launch the MLB betting dashboard"""
    
    print("⚾ MLB BETTING ANALYSIS DASHBOARD")
    print("=" * 50)
    
    # Change to the correct directory
    script_dir = "/Users/steveracinski/Documents/my_project/venv/job-listing-analyzer"
    os.chdir(script_dir)
    
    # Check if required files exist
    required_files = ["mlb_dashboard.py", "Betting"]
    missing_files = [f for f in required_files if not os.path.exists(f)]
    
    if missing_files:
        print(f"❌ Missing required files: {missing_files}")
        return
    
    print("🚀 Starting MLB Betting Analysis Dashboard...")
    print("📊 Loading at: http://localhost:8501")
    print("⚠️  Press Ctrl+C to stop")
    print("=" * 50)
    
    try:
        # Try to run with streamlit
        result = subprocess.run([
            sys.executable, "-m", "streamlit", "run", "mlb_dashboard.py",
            "--server.port", "8501",
            "--server.headless", "false"
        ], check=True)
        
    except FileNotFoundError:
        print("❌ Streamlit not found. Installing...")
        try:
            subprocess.run([sys.executable, "-m", "pip", "install", "streamlit", "plotly", "pandas"], check=True)
            print("✅ Packages installed. Launching dashboard...")
            subprocess.run([
                sys.executable, "-m", "streamlit", "run", "mlb_dashboard.py",
                "--server.port", "8501"
            ], check=True)
        except Exception as e:
            print(f"❌ Installation failed: {e}")
            print("\nFallback: Using interactive terminal interface...")
            subprocess.run([sys.executable, "mlb_interactive_ui.py"])
    
    except KeyboardInterrupt:
        print("\n\n👋 Dashboard stopped by user")
    
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\nFallback: Using interactive terminal interface...")
        try:
            subprocess.run([sys.executable, "mlb_interactive_ui.py"])
        except Exception as fallback_error:
            print(f"❌ Fallback failed: {fallback_error}")
            print("Try running: python3 quick_analysis.py")

if __name__ == "__main__":
    main()
