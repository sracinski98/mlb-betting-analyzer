#!/usr/bin/env python3
"""
MLB Betting Analysis Dashboard
Professional web interface for daily betting picks deployment
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import json
from datetime import datetime, timedelta
import sys
import os
import time

# Page configuration
st.set_page_config(
    page_title="MLB Betting Analysis Dashboard",
    page_icon="⚾",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for professional styling
st.markdown("""
<style>
    .main-header {
        background: linear-gradient(90deg, #1f4e79, #2d5aa0);
        padding: 1rem;
        border-radius: 10px;
        color: white;
        text-align: center;
        margin-bottom: 2rem;
    }
    
    .metric-card {
        background: white;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        border-left: 4px solid #1f4e79;
    }
    
    .confidence-high {
        background: linear-gradient(90deg, #ff4444, #ff6666);
        color: white;
        padding: 0.3rem 0.6rem;
        border-radius: 15px;
        font-weight: bold;
    }
    
    .confidence-medium {
        background: linear-gradient(90deg, #ffaa00, #ffcc44);
        color: white;
        padding: 0.3rem 0.6rem;
        border-radius: 15px;
        font-weight: bold;
    }
    
    .confidence-low {
        background: linear-gradient(90deg, #4488ff, #66aaff);
        color: white;
        padding: 0.3rem 0.6rem;
        border-radius: 15px;
        font-weight: bold;
    }
    
    .bet-card {
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        padding: 1rem;
        margin: 0.5rem 0;
    }
    
    .parlay-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 10px;
        padding: 1rem;
        margin: 0.5rem 0;
    }
</style>
""", unsafe_allow_html=True)

class MLBDashboard:
    def __init__(self):
        self.analysis_data = None
        self.last_update = None
        
    def load_analysis_engine(self):
        """Load the MLB betting analysis engine"""
        try:
            # Import the betting analysis code
            betting_file_path = '/Users/steveracinski/Documents/my_project/venv/job-listing-analyzer/Betting'
            
            namespace = {}
            with open(betting_file_path, 'r') as f:
                betting_code = f.read()
            
            exec(betting_code, namespace)
            
            MLBDataCollector = namespace.get('MLBDataCollector')
            MLBBettingAnalyzer = namespace.get('MLBBettingAnalyzer')
            
            if not MLBDataCollector or not MLBBettingAnalyzer:
                return None, None
                
            return MLBDataCollector(), MLBBettingAnalyzer
            
        except Exception as e:
            st.error(f"Error loading analysis engine: {str(e)}")
            return None, None
    
    def run_analysis(self):
        """Run the comprehensive MLB analysis"""
        data_collector, analyzer_class = self.load_analysis_engine()
        
        if not data_collector or not analyzer_class:
            st.error("Failed to load analysis engine")
            return None
            
        try:
            analyzer = analyzer_class(data_collector)
            
            # Show progress
            progress_bar = st.progress(0)
            status_text = st.empty()
            
            status_text.text("🔄 Gathering MLB games data...")
            progress_bar.progress(20)
            
            # Run the analysis using the comprehensive method
            result = analyzer.run_comprehensive_analysis()
            progress_bar.progress(60)
            
            status_text.text("📊 Processing recommendations...")
            
            # Get the detailed recommendations
            detailed_result = analyzer.get_daily_recommendations()
            progress_bar.progress(100)
            
            status_text.text("✅ Analysis complete!")
            time.sleep(1)
            status_text.empty()
            progress_bar.empty()
            
            self.analysis_data = detailed_result
            self.last_update = datetime.now()
            
            return detailed_result
            
        except Exception as e:
            st.error(f"Error running analysis: {str(e)}")
            return None
    
    def display_header(self):
        """Display the main dashboard header"""
        st.markdown("""
        <div class="main-header">
            <h1>⚾ MLB Betting Analysis Dashboard</h1>
            <p>Professional Daily Picks & Analytics Platform</p>
        </div>
        """, unsafe_allow_html=True)
        
        # Status bar
        col1, col2, col3, col4 = st.columns(4)
        
        if self.analysis_data:
            with col1:
                st.metric("Total Opportunities", len(self.analysis_data['recommendations']))
            with col2:
                high_conf = len([r for r in self.analysis_data['recommendations'] if r['confidence'] == 'high'])
                st.metric("High Confidence", high_conf)
            with col3:
                st.metric("Games Analyzed", len(self.analysis_data['games']))
            with col4:
                if self.last_update:
                    time_ago = datetime.now() - self.last_update
                    minutes_ago = int(time_ago.total_seconds() / 60)
                    st.metric("Last Update", f"{minutes_ago}m ago")
        else:
            with col1:
                st.metric("Status", "No Data")
            with col2:
                st.metric("Ready", "❌")
            with col3:
                st.metric("Analysis", "Pending")
            with col4:
                st.metric("Last Update", "Never")
    
    def display_quick_picks(self):
        """Display today's top picks in a quick view"""
        if not self.analysis_data:
            st.warning("Run analysis first to see picks")
            return
            
        st.header("🎯 Today's Top Picks")
        
        # Get top recommendations
        recommendations = self.analysis_data['recommendations']
        team_bets = [r for r in recommendations if 'player_' not in r['bet_type']]
        player_props = [r for r in recommendations if 'player_' in r['bet_type']]
        
        # Top Team Bets
        st.subheader("🏆 Best Team Bets")
        
        if team_bets:
            for i, bet in enumerate(team_bets[:5], 1):
                game = self.analysis_data['games'][self.analysis_data['games']['game_id'] == bet['game_id']].iloc[0]
                
                confidence_class = f"confidence-{bet['confidence']}"
                
                with st.container():
                    col1, col2, col3 = st.columns([1, 3, 1])
                    
                    with col1:
                        st.markdown(f"<div class='{confidence_class}'>🔥 {bet['confidence'].upper()}</div>", unsafe_allow_html=True)
                    
                    with col2:
                        st.write(f"**{bet['bet_type'].upper().replace('_', ' ')}**")
                        st.write(f"{game['away_team']} @ {game['home_team']}")
                        if bet['reasons']:
                            st.write(f"💡 {bet['reasons'][0]}")
                    
                    with col3:
                        st.metric("Score", f"{bet['score']:.1f}/3.0")
                
                st.divider()
        
        # Top Player Props
        st.subheader("🎯 Best Player Props")
        
        if player_props:
            for i, prop in enumerate(player_props[:5], 1):
                game = self.analysis_data['games'][self.analysis_data['games']['game_id'] == prop['game_id']].iloc[0]
                
                confidence_class = f"confidence-{prop['confidence']}"
                
                with st.container():
                    col1, col2, col3 = st.columns([1, 3, 1])
                    
                    with col1:
                        st.markdown(f"<div class='{confidence_class}'>⚡ {prop['confidence'].upper()}</div>", unsafe_allow_html=True)
                    
                    with col2:
                        player_name = prop.get('player', 'Player')
                        prop_type = prop['bet_type'].upper().replace('PLAYER_', '').replace('PITCHER_', '').replace('_', ' ')
                        st.write(f"**{player_name} - {prop_type}**")
                        st.write(f"{game['away_team']} @ {game['home_team']}")
                        reason = prop['reasons'][0] if isinstance(prop.get('reasons'), list) else prop.get('reason', 'Analysis available')
                        st.write(f"💡 {reason}")
                    
                    with col3:
                        st.metric("Score", f"{prop['score']:.1f}/3.0")
                
                st.divider()
    
    def display_team_bets_tab(self):
        """Display comprehensive team betting opportunities"""
        if not self.analysis_data:
            st.warning("Run analysis first to see team bets")
            return
            
        team_bets = [r for r in self.analysis_data['recommendations'] if 'player_' not in r['bet_type']]
        
        if not team_bets:
            st.info("No team betting opportunities found today")
            return
        
        # Filters
        col1, col2, col3 = st.columns(3)
        
        with col1:
            confidence_filter = st.selectbox(
                "Filter by Confidence",
                ["All", "High", "Medium", "Low"]
            )
        
        with col2:
            bet_type_filter = st.selectbox(
                "Filter by Bet Type",
                ["All"] + list(set([bet['bet_type'] for bet in team_bets]))
            )
        
        with col3:
            min_score = st.slider("Minimum Score", 0.0, 3.0, 0.0, 0.1)
        
        # Apply filters
        filtered_bets = team_bets
        
        if confidence_filter != "All":
            filtered_bets = [b for b in filtered_bets if b['confidence'] == confidence_filter.lower()]
        
        if bet_type_filter != "All":
            filtered_bets = [b for b in filtered_bets if b['bet_type'] == bet_type_filter]
        
        filtered_bets = [b for b in filtered_bets if b['score'] >= min_score]
        
        st.write(f"**Showing {len(filtered_bets)} of {len(team_bets)} team bets**")
        
        # Display bets
        for i, bet in enumerate(filtered_bets, 1):
            game = self.analysis_data['games'][self.analysis_data['games']['game_id'] == bet['game_id']].iloc[0]
            
            with st.expander(f"{i}. {bet['bet_type'].upper().replace('_', ' ')} - {game['away_team']} @ {game['home_team']}", expanded=False):
                col1, col2 = st.columns(2)
                
                with col1:
                    confidence_class = f"confidence-{bet['confidence']}"
                    st.markdown(f"<div class='{confidence_class}'>{bet['confidence'].upper()} CONFIDENCE</div>", unsafe_allow_html=True)
                    st.metric("Confidence Score", f"{bet['score']:.1f}/3.0")
                    st.write(f"**Venue:** {game['venue']}")
                    st.write(f"**Supporting Factors:** {bet['num_factors']}")
                
                with col2:
                    st.write("**Analysis Reasons:**")
                    for reason in bet['reasons']:
                        st.write(f"• {reason}")
                    
                    if bet.get('line_alert'):
                        st.warning(f"🚨 Line Alert: {bet['line_alert']['message']}")
    
    def display_player_props_tab(self):
        """Display player prop opportunities"""
        if not self.analysis_data:
            st.warning("Run analysis first to see player props")
            return
            
        player_props = [r for r in self.analysis_data['recommendations'] if 'player_' in r['bet_type']]
        
        if not player_props:
            st.info("No player prop opportunities found today")
            return
        
        # Categorize props
        hitting_props = [p for p in player_props if any(x in p['bet_type'] for x in ['hits', 'hr', 'rbi', 'runs', 'total_bases'])]
        pitching_props = [p for p in player_props if 'pitcher_' in p['bet_type']]
        situational_props = [p for p in player_props if p.get('prop_factor') in ['weather_boost', 'venue_boost', 'matchup_advantage']]
        streak_props = [p for p in player_props if p.get('prop_factor') in ['hot_streak', 'cold_streak', 'rbi_streak']]
        
        # Category tabs
        prop_tab1, prop_tab2, prop_tab3, prop_tab4 = st.tabs([
            f"🔥 Hot Streaks ({len(streak_props)})",
            f"⚾ Hitting Props ({len(hitting_props)})",
            f"🎯 Situational ({len(situational_props)})",
            f"🥎 Pitcher Props ({len(pitching_props)})"
        ])
        
        categories = [
            (prop_tab1, streak_props, "Hot Streaks & Trends"),
            (prop_tab2, hitting_props, "Hitting Props"),
            (prop_tab3, situational_props, "Situational Advantages"),
            (prop_tab4, pitching_props, "Pitcher Props")
        ]
        
        for tab, props, category_name in categories:
            with tab:
                if not props:
                    st.info(f"No {category_name.lower()} found today")
                    continue
                
                for i, prop in enumerate(props, 1):
                    game = self.analysis_data['games'][self.analysis_data['games']['game_id'] == prop['game_id']].iloc[0]
                    
                    with st.container():
                        col1, col2, col3 = st.columns([2, 4, 1])
                        
                        with col1:
                            confidence_class = f"confidence-{prop['confidence']}"
                            st.markdown(f"<div class='{confidence_class}'>{prop['confidence'].upper()}</div>", unsafe_allow_html=True)
                            st.write(f"**{prop.get('player', 'Player')}**")
                        
                        with col2:
                            prop_type = prop['bet_type'].upper().replace('PLAYER_', '').replace('PITCHER_', '').replace('_', ' ')
                            st.write(f"**{prop_type}**")
                            if 'prop_line' in prop:
                                st.write(f"Line: {prop['prop_line']}")
                            st.write(f"Game: {game['away_team']} @ {game['home_team']}")
                            reason = prop['reasons'][0] if isinstance(prop.get('reasons'), list) else prop.get('reason', 'Analysis available')
                            st.write(f"💡 {reason}")
                        
                        with col3:
                            st.metric("Score", f"{prop['score']:.1f}")
                    
                    st.divider()
    
    def display_parlays_tab(self):
        """Display parlay suggestions"""
        if not self.analysis_data:
            st.warning("Run analysis first to see parlays")
            return
            
        parlays = self.analysis_data.get('parlays', [])
        
        if not parlays:
            st.info("No parlay opportunities found today")
            return
        
        # Group parlays by category
        specialty_parlays = [p for p in parlays if p['parlay_category'] == 'specialty']
        sgp_parlays = [p for p in parlays if p['parlay_category'] == 'same_game']
        multi_game_parlays = [p for p in parlays if p['parlay_category'] == 'multi_game']
        
        parlay_tab1, parlay_tab2, parlay_tab3 = st.tabs([
            f"🏅 Specialty ({len(specialty_parlays)})",
            f"🎲 Same Game ({len(sgp_parlays)})",
            f"🌟 Multi-Game ({len(multi_game_parlays)})"
        ])
        
        categories = [
            (parlay_tab1, specialty_parlays, "Specialty Parlays"),
            (parlay_tab2, sgp_parlays, "Same Game Parlays"),
            (parlay_tab3, multi_game_parlays, "Multi-Game Parlays")
        ]
        
        for tab, parlays_cat, category_name in categories:
            with tab:
                if not parlays_cat:
                    st.info(f"No {category_name.lower()} found today")
                    continue
                
                for i, parlay in enumerate(parlays_cat, 1):
                    risk_color = {"low": "🟢", "medium": "🟡", "high": "🔴"}[parlay['risk_level']]
                    
                    with st.container():
                        st.markdown(f"""
                        <div class="parlay-card">
                            <h4>{risk_color} {parlay['type'].upper()} - {parlay['risk_level'].upper()} RISK</h4>
                            <p><strong>Expected Odds:</strong> {parlay['expected_odds']}</p>
                            <p><strong>Strategy:</strong> {parlay['reasoning']}</p>
                        </div>
                        """, unsafe_allow_html=True)
                        
                        st.write(f"**Legs ({len(parlay['legs'])}):**")
                        
                        for j, leg in enumerate(parlay['legs'], 1):
                            game = self.analysis_data['games'][self.analysis_data['games']['game_id'] == leg['game_id']].iloc[0]
                            
                            leg_display = leg['bet_type'].replace('_', ' ').title()
                            if 'player' in leg:
                                leg_display = f"{leg['player']} {leg_display.replace('Player ', '')}"
                            if leg.get('prop_line'):
                                leg_display += f" ({leg['prop_line']})"
                            if leg.get('line'):
                                leg_display += f" ({leg['line']})"
                            
                            st.write(f"{j}. **{leg_display}**")
                            st.write(f"   {game['away_team']} @ {game['home_team']}")
                    
                    st.divider()
    
    def display_analytics_tab(self):
        """Display analytics and visualizations"""
        if not self.analysis_data:
            st.warning("Run analysis first to see analytics")
            return
        
        # Overview metrics
        recommendations = self.analysis_data['recommendations']
        
        # Confidence distribution
        confidence_counts = {'high': 0, 'medium': 0, 'low': 0}
        for rec in recommendations:
            confidence_counts[rec['confidence']] += 1
        
        # Create confidence chart
        fig_confidence = px.pie(
            values=list(confidence_counts.values()),
            names=list(confidence_counts.keys()),
            title="Confidence Distribution",
            color_discrete_map={'high': '#ff4444', 'medium': '#ffaa00', 'low': '#4488ff'}
        )
        
        # Bet type distribution
        bet_types = {}
        for rec in recommendations:
            bet_type = rec['bet_type'].replace('_', ' ').title()
            bet_types[bet_type] = bet_types.get(bet_type, 0) + 1
        
        # Create bet types chart
        fig_bet_types = px.bar(
            x=list(bet_types.values()),
            y=list(bet_types.keys()),
            orientation='h',
            title="Bet Types Distribution",
            labels={'x': 'Count', 'y': 'Bet Type'}
        )
        
        # Display charts
        col1, col2 = st.columns(2)
        
        with col1:
            st.plotly_chart(fig_confidence, use_container_width=True)
        
        with col2:
            st.plotly_chart(fig_bet_types, use_container_width=True)
        
        # Score distribution
        scores = [rec['score'] for rec in recommendations]
        fig_scores = px.histogram(scores, title="Confidence Score Distribution", nbins=20)
        st.plotly_chart(fig_scores, use_container_width=True)
        
        # Weather analysis if available
        if self.analysis_data.get('weather'):
            st.subheader("🌤️ Weather Analysis")
            
            weather_data = []
            for weather_info in self.analysis_data['weather']:
                weather = weather_info['weather']
                weather_data.append({
                    'Temperature': weather['temperature_f'],
                    'Wind Speed': weather['wind_mph'],
                    'Condition': weather['condition']
                })
            
            if weather_data:
                weather_df = pd.DataFrame(weather_data)
                
                col1, col2 = st.columns(2)
                
                with col1:
                    fig_temp = px.histogram(weather_df, x='Temperature', title="Temperature Distribution")
                    st.plotly_chart(fig_temp, use_container_width=True)
                
                with col2:
                    fig_wind = px.histogram(weather_df, x='Wind Speed', title="Wind Speed Distribution")
                    st.plotly_chart(fig_wind, use_container_width=True)
        
        # Summary statistics
        st.subheader("📊 Summary Statistics")
        
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric("Total Opportunities", len(recommendations))
        
        with col2:
            avg_score = sum(rec['score'] for rec in recommendations) / len(recommendations)
            st.metric("Average Score", f"{avg_score:.2f}")
        
        with col3:
            team_bets = len([r for r in recommendations if 'player_' not in r['bet_type']])
            st.metric("Team Bets", team_bets)
        
        with col4:
            player_props = len([r for r in recommendations if 'player_' in r['bet_type']])
            st.metric("Player Props", player_props)

def main():
    """Main dashboard application"""
    dashboard = MLBDashboard()
    
    # Display header
    dashboard.display_header()
    
    # Sidebar controls
    with st.sidebar:
        st.header("⚙️ Dashboard Controls")
        
        if st.button("🔄 Run Fresh Analysis", type="primary", use_container_width=True):
            with st.spinner("Running comprehensive MLB analysis..."):
                result = dashboard.run_analysis()
                if result:
                    st.success("✅ Analysis completed successfully!")
                    st.rerun()
                else:
                    st.error("❌ Analysis failed")
        
        st.divider()
        
        if dashboard.analysis_data:
            st.success("📊 Data Loaded")
            st.write(f"Last updated: {dashboard.last_update.strftime('%H:%M:%S')}")
            
            # Export options
            st.subheader("📥 Export Options")
            
            if st.button("📄 Export to JSON"):
                export_data = dashboard.analysis_data.copy()
                if 'games' in export_data:
                    export_data['games'] = export_data['games'].to_dict('records')
                
                st.download_button(
                    label="Download JSON",
                    data=json.dumps(export_data, default=str, indent=2),
                    file_name=f"mlb_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
                    mime="application/json"
                )
        else:
            st.warning("⚠️ No data loaded")
            st.write("Click 'Run Fresh Analysis' to get started")
        
        st.divider()
        
        # Settings
        st.subheader("⚙️ Settings")
        auto_refresh = st.checkbox("Auto-refresh every 30 minutes")
        show_advanced = st.checkbox("Show advanced metrics", value=True)
        
        # Help
        with st.expander("ℹ️ Help & Tips"):
            st.write("""
            **How to use this dashboard:**
            1. Click 'Run Fresh Analysis' to get today's picks
            2. Browse tabs for different bet types
            3. Use filters to narrow down opportunities
            4. Export data for external use
            
            **Confidence Levels:**
            - 🔥 High: Strong analytical confidence
            - ⚡ Medium: Good analytical support
            - 💡 Low: Moderate analytical support
            
            **Remember to bet responsibly!**
            """)
    
    # Main content area
    if not dashboard.analysis_data:
        st.info("👆 Click 'Run Fresh Analysis' in the sidebar to get started with today's MLB betting opportunities!")
        
        # Show sample data explanation
        st.subheader("📋 What You'll Get")
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.write("**🏆 Team Bets**")
            st.write("• Money Lines")
            st.write("• Totals (Over/Under)")
            st.write("• Run Lines (+/-1.5)")
            st.write("• First 5 Innings")
        
        with col2:
            st.write("**🎯 Player Props**")
            st.write("• Hitting Props")
            st.write("• Pitcher Props")
            st.write("• Situational Advantages")
            st.write("• Hot Streaks")
        
        with col3:
            st.write("**🎰 Parlays**")
            st.write("• Same Game Parlays")
            st.write("• Multi-Game Parlays")
            st.write("• Specialty Parlays")
            st.write("• Risk-Adjusted Options")
        
    else:
        # Main dashboard tabs
        tab1, tab2, tab3, tab4, tab5 = st.tabs([
            "🎯 Quick Picks",
            "🏆 Team Bets", 
            "🎯 Player Props",
            "🎰 Parlays",
            "📊 Analytics"
        ])
        
        with tab1:
            dashboard.display_quick_picks()
        
        with tab2:
            dashboard.display_team_bets_tab()
        
        with tab3:
            dashboard.display_player_props_tab()
        
        with tab4:
            dashboard.display_parlays_tab()
        
        with tab5:
            dashboard.display_analytics_tab()

if __name__ == "__main__":
    main()
