#!/usr/bin/env python3
"""
Quick MLB Analysis Runner
Runs analysis and shows summary without interactive menu
"""

import sys
import os
from datetime import datetime

def run_quick_analysis():
    """Run analysis and show quick summary"""
    
    # Change to correct directory
    script_dir = "/Users/steveracinski/Documents/my_project/venv/job-listing-analyzer"
    os.chdir(script_dir)
    
    print("⚾ MLB BETTING ANALYSIS - QUICK RUN")
    print("=" * 60)
    print(f"🕐 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    try:
        # Import and run the analysis
        betting_file_path = 'Betting'
        
        # Create a namespace to execute the betting analysis
        namespace = {}
        with open(betting_file_path, 'r') as f:
            betting_code = f.read()
        
        print("🔄 Loading analysis engine...")
        exec(betting_code, namespace)
        
        # Get the classes from the namespace
        MLBDataCollector = namespace.get('MLBDataCollector')
        MLBBettingAnalyzer = namespace.get('MLBBettingAnalyzer')
        
        if not MLBDataCollector or not MLBBettingAnalyzer:
            print("❌ Could not find required analysis classes")
            return
        
        print("📊 Running comprehensive analysis...")
        
        # Create instances and run analysis
        data_collector = MLBDataCollector()
        analyzer = MLBBettingAnalyzer(data_collector)
        
        # Run the advanced analysis (this will show the full output)
        result = analyzer.run_comprehensive_analysis()
        
        print()
        print("=" * 60)
        print("✅ QUICK ANALYSIS COMPLETE")
        print("💡 For interactive browsing, run: python3 launch_mlb_ui.py")
        print("=" * 60)
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Analysis interrupted by user")
    except Exception as e:
        print(f"❌ Error running analysis: {str(e)}")
        print("Make sure all required files are present and APIs are accessible")

if __name__ == "__main__":
    run_quick_analysis()
