#!/usr/bin/env python3
"""
MLB Betting Analysis Launcher
Quick launcher for the interactive MLB betting analysis interface
"""

import subprocess
import sys
import os

def main():
    """Launch the MLB betting analysis interface"""
    
    # Change to the correct directory
    script_dir = "/Users/steveracinski/Documents/my_project/venv/job-listing-analyzer"
    os.chdir(script_dir)
    
    # Check if the interactive UI file exists
    ui_file = os.path.join(script_dir, "mlb_interactive_ui.py")
    if not os.path.exists(ui_file):
        print("❌ Interactive UI file not found!")
        print(f"Expected: {ui_file}")
        return
    
    # Check if the Betting analysis file exists
    betting_file = os.path.join(script_dir, "Betting")
    if not os.path.exists(betting_file):
        print("❌ Betting analysis file not found!")
        print(f"Expected: {betting_file}")
        return
    
    print("🚀 Launching MLB Betting Analysis Interface...")
    print("=" * 50)
    
    try:
        # Launch the interactive UI
        subprocess.run([sys.executable, ui_file], check=True)
    except KeyboardInterrupt:
        print("\n\n👋 Thanks for using MLB Betting Analysis!")
    except Exception as e:
        print(f"❌ Error launching interface: {e}")

if __name__ == "__main__":
    main()
