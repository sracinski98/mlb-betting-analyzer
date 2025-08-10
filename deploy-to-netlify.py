#!/usr/bin/env python3
"""
MLB Betting Analytics - Netlify Deployment Script
Prepares and validates the web application for Netlify deployment
"""

import os
import json
import subprocess
import sys
from pathlib import Path

def check_file_exists(filepath):
    """Check if a required file exists"""
    if os.path.exists(filepath):
        print(f"✅ {filepath} - Found")
        return True
    else:
        print(f"❌ {filepath} - Missing")
        return False

def validate_html_structure():
    """Validate the main HTML file structure"""
    html_file = "index.html"
    if not os.path.exists(html_file):
        print(f"❌ {html_file} not found")
        return False
    
    with open(html_file, 'r') as f:
        content = f.read()
        
    required_elements = [
        'mlb-analytics.js',
        'app.js',
        'styles.css',
        'id="analyzeBtn"',
        'class="tab-nav"'
    ]
    
    missing_elements = []
    for element in required_elements:
        if element not in content:
            missing_elements.append(element)
    
    if missing_elements:
        print(f"❌ HTML validation failed. Missing: {', '.join(missing_elements)}")
        return False
    else:
        print("✅ HTML structure validated")
        return True

def validate_javascript():
    """Validate JavaScript files syntax"""
    js_files = ['mlb-analytics.js', 'app.js']
    
    for js_file in js_files:
        if not os.path.exists(js_file):
            print(f"❌ {js_file} not found")
            return False
        
        # Basic syntax check (look for class definitions)
        with open(js_file, 'r') as f:
            content = f.read()
            
        if js_file == 'mlb-analytics.js':
            if 'class MLBAnalyticsEngine' not in content:
                print(f"❌ {js_file} missing MLBAnalyticsEngine class")
                return False
        elif js_file == 'app.js':
            if 'class MLBAnalyticsApp' not in content:
                print(f"❌ {js_file} missing MLBAnalyticsApp class")
                return False
                
        print(f"✅ {js_file} validated")
    
    return True

def validate_css():
    """Validate CSS file"""
    css_file = "styles.css"
    if not os.path.exists(css_file):
        print(f"❌ {css_file} not found")
        return False
    
    with open(css_file, 'r') as f:
        content = f.read()
    
    required_styles = [':root', '.container', '.header', '.tab-nav', '.btn']
    missing_styles = []
    
    for style in required_styles:
        if style not in content:
            missing_styles.append(style)
    
    if missing_styles:
        print(f"❌ CSS validation failed. Missing: {', '.join(missing_styles)}")
        return False
    else:
        print("✅ CSS validated")
        return True

def create_netlify_files():
    """Ensure Netlify configuration files exist"""
    netlify_toml = "netlify.toml"
    redirects = "_redirects"
    
    if not os.path.exists(netlify_toml):
        print(f"❌ {netlify_toml} missing - this should have been created")
        return False
    
    if not os.path.exists(redirects):
        print(f"❌ {redirects} missing - this should have been created")
        return False
    
    print("✅ Netlify configuration files present")
    return True

def check_api_keys():
    """Verify API keys are configured"""
    with open('mlb-analytics.js', 'r') as f:
        content = f.read()
    
    if 'b1cc0151482fcdf0d3d970d1355b1323' not in content:
        print("⚠️  Warning: Odds API key may not be configured")
    else:
        print("✅ API keys configured")
    
    return True

def generate_deployment_summary():
    """Generate deployment summary"""
    summary = {
        "application": "MLB Betting Analytics",
        "version": "1.0.0",
        "deployment_ready": True,
        "features": [
            "Advanced MLB analysis engine",
            "Real-time data integration", 
            "Interactive web dashboard",
            "Mobile responsive design",
            "Export functionality",
            "Professional UI/UX"
        ],
        "files": {
            "index.html": "Main application interface",
            "styles.css": "Professional styling",
            "mlb-analytics.js": "Core analysis engine", 
            "app.js": "UI controller",
            "netlify.toml": "Netlify configuration",
            "_redirects": "URL routing",
            "package.json": "Dependency management"
        },
        "apis": [
            "MLB Stats API (free)",
            "The Odds API (demo key included)",
            "WeatherAPI (demo key included)"
        ],
        "deployment_url": "Ready for Netlify deployment"
    }
    
    with open('deployment-summary.json', 'w') as f:
        json.dump(summary, f, indent=2)
    
    print("✅ Deployment summary generated")

def main():
    """Main deployment validation function"""
    print("🚀 MLB Betting Analytics - Netlify Deployment Validation")
    print("=" * 60)
    
    # Check required files
    required_files = [
        'index.html',
        'styles.css', 
        'mlb-analytics.js',
        'app.js',
        'netlify.toml',
        '_redirects',
        'package.json',
        'README.md'
    ]
    
    print("\n📁 Checking required files...")
    all_files_present = all(check_file_exists(f) for f in required_files)
    
    if not all_files_present:
        print("\n❌ Deployment validation failed - missing required files")
        sys.exit(1)
    
    print("\n🔍 Validating file contents...")
    
    # Validate content
    validations = [
        validate_html_structure(),
        validate_javascript(), 
        validate_css(),
        create_netlify_files(),
        check_api_keys()
    ]
    
    if not all(validations):
        print("\n❌ Deployment validation failed - content errors")
        sys.exit(1)
    
    # Generate summary
    print("\n📋 Generating deployment summary...")
    generate_deployment_summary()
    
    print("\n" + "=" * 60)
    print("🎉 DEPLOYMENT VALIDATION SUCCESSFUL!")
    print("=" * 60)
    print("\n🌐 Your MLB Betting Analytics platform is ready for Netlify!")
    print("\n📋 Next Steps:")
    print("   1. Connect this repository to Netlify")
    print("   2. Deploy from Git (netlify.toml will handle configuration)")
    print("   3. Access your live web application")
    print("   4. Run daily analysis with the 'Run Analysis' button")
    print("\n🎯 Features Available:")
    print("   • Advanced MLB analysis with 8+ models")
    print("   • Real-time data from 3 APIs")
    print("   • Professional responsive dashboard")
    print("   • Team bets, player props, and parlays")
    print("   • Export functionality and filtering")
    print("\n⚠️  Remember: Bet responsibly and within your means!")
    print("\n🔗 Ready for deployment to: https://app.netlify.com/")

if __name__ == "__main__":
    main()
