#!/usr/bin/env python3
"""
MLB Betting Analysis Web Interface
Professional UI for viewing betting recommendations
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import json
from datetime import datetime
import requests
import time

# Set page config
st.set_page_config(
    page_title="MLB Betting Analysis Engine",
    page_icon="⚾",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for better styling
st.markdown("""
<style>
    .main-header {
        font-size: 3rem;
        font-weight: bold;
        text-align: center;
        background: linear-gradient(45deg, #1f4e79, #2e8b57);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 2rem;
    }
    
    .metric-card {
        background: white;
        padding: 1rem;
        border-radius: 10px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        border-left: 4px solid #1f4e79;
    }
    
    .confidence-high {
        background: linear-gradient(135deg, #ff6b6b, #ee5a24);
        color: white;
        padding: 0.5rem;
        border-radius: 5px;
        font-weight: bold;
    }
    
    .confidence-medium {
        background: linear-gradient(135deg, #ffa726, #ff7043);
        color: white;
        padding: 0.5rem;
        border-radius: 5px;
        font-weight: bold;
    }
    
    .confidence-low {
        background: linear-gradient(135deg, #42a5f5, #1e88e5);
        color: white;
        padding: 0.5rem;
        border-radius: 5px;
        font-weight: bold;
    }
    
    .bet-card {
        border: 1px solid #e0e0e0;
        border-radius: 10px;
        padding: 1rem;
        margin: 0.5rem 0;
        background: white;
    }
    
    .game-header {
        font-size: 1.2rem;
        font-weight: bold;
        color: #1f4e79;
        margin-bottom: 0.5rem;
    }
    
    .sidebar-metric {
        text-align: center;
        padding: 1rem;
        margin: 0.5rem 0;
        background: #f8f9fa;
        border-radius: 10px;
    }
</style>
""", unsafe_allow_html=True)

class MLBBettingUI:
    def __init__(self):
        self.load_analysis_data()
    
    def load_analysis_data(self):
        """Load or run the MLB analysis"""
        if 'analysis_data' not in st.session_state:
            st.session_state.analysis_data = None
            st.session_state.last_update = None
    
    def run_analysis(self):
        """Run the MLB betting analysis"""
        with st.spinner("🔄 Running comprehensive MLB analysis..."):
            try:
                # Import and run the analysis
                exec(open('/Users/steveracinski/Documents/my_project/venv/job-listing-analyzer/Betting').read())
                
                data_collector = MLBDataCollector()
                analyzer = MLBBettingAnalyzer(data_collector)
                
                # Run comprehensive analysis
                result = analyzer.get_daily_recommendations()
                
                if result:
                    st.session_state.analysis_data = result
                    st.session_state.last_update = datetime.now()
                    return True
                else:
                    st.error("No analysis data returned")
                    return False
                    
            except Exception as e:
                st.error(f"Error running analysis: {str(e)}")
                return False
    
    def display_main_dashboard(self):
        """Display the main dashboard"""
        st.markdown('<h1 class="main-header">⚾ MLB Betting Analysis Engine</h1>', unsafe_allow_html=True)
        
        # Top metrics row
        if st.session_state.analysis_data:
            data = st.session_state.analysis_data
            
            col1, col2, col3, col4, col5 = st.columns(5)
            
            with col1:
                st.metric(
                    label="🎯 Total Opportunities",
                    value=len(data['recommendations']),
                    delta=f"+{len(data['team_bets'])} team bets"
                )
            
            with col2:
                high_conf = len([r for r in data['recommendations'] if r['confidence'] == 'high'])
                st.metric(
                    label="🔥 High Confidence",
                    value=high_conf,
                    delta=f"{(high_conf/len(data['recommendations'])*100):.0f}%" if data['recommendations'] else "0%"
                )
            
            with col3:
                st.metric(
                    label="⚾ Player Props",
                    value=len(data['player_props']),
                    delta=f"+{len(data['parlays'])} parlays"
                )
            
            with col4:
                st.metric(
                    label="🏟️ Games Today",
                    value=len(data['games']),
                    delta="Live analysis"
                )
            
            with col5:
                if st.session_state.last_update:
                    time_diff = datetime.now() - st.session_state.last_update
                    minutes_ago = int(time_diff.total_seconds() / 60)
                    st.metric(
                        label="🕐 Last Update",
                        value=f"{minutes_ago}m ago",
                        delta="Real-time data"
                    )
    
    def display_team_bets(self):
        """Display team betting recommendations"""
        if not st.session_state.analysis_data:
            return
            
        data = st.session_state.analysis_data
        team_bets = data['team_bets']
        
        if not team_bets:
            st.info("No team betting opportunities found today")
            return
        
        st.subheader("🏆 Team Betting Opportunities")
        
        # Confidence filter
        confidence_filter = st.selectbox(
            "Filter by confidence:",
            ["All", "High", "Medium", "Low"],
            key="team_confidence_filter"
        )
        
        # Bet type filter
        bet_types = list(set([bet['bet_type'] for bet in team_bets]))
        bet_type_filter = st.selectbox(
            "Filter by bet type:",
            ["All"] + bet_types,
            key="team_bet_type_filter"
        )
        
        # Apply filters
        filtered_bets = team_bets
        if confidence_filter != "All":
            filtered_bets = [b for b in filtered_bets if b['confidence'] == confidence_filter.lower()]
        if bet_type_filter != "All":
            filtered_bets = [b for b in filtered_bets if b['bet_type'] == bet_type_filter]
        
        # Display bets
        for i, bet in enumerate(filtered_bets[:10]):
            game = data['games'][data['games']['game_id'] == bet['game_id']].iloc[0]
            
            with st.container():
                st.markdown('<div class="bet-card">', unsafe_allow_html=True)
                
                col1, col2, col3 = st.columns([3, 2, 1])
                
                with col1:
                    st.markdown(f'<div class="game-header">{game["away_team"]} @ {game["home_team"]}</div>', unsafe_allow_html=True)
                    st.write(f"🏟️ **Venue:** {game['venue']}")
                    st.write(f"🎯 **Bet:** {bet['bet_type'].replace('_', ' ').title()}")
                    if 'line' in bet:
                        st.write(f"📊 **Line:** {bet['line']}")
                
                with col2:
                    confidence_class = f"confidence-{bet['confidence']}"
                    st.markdown(f'<div class="{confidence_class}">Confidence: {bet["confidence"].title()}</div>', unsafe_allow_html=True)
                    st.write(f"📈 **Score:** {bet['score']:.1f}/3.0")
                    st.write(f"🔢 **Factors:** {bet['num_factors']}")
                
                with col3:
                    if bet.get('line_alert'):
                        st.warning("🚨 Line Alert!")
                    
                    # Expandable details
                    with st.expander("View Details"):
                        st.write("**Reasons:**")
                        for reason in bet['reasons']:
                            st.write(f"• {reason}")
                
                st.markdown('</div>', unsafe_allow_html=True)
    
    def display_player_props(self):
        """Display player prop recommendations"""
        if not st.session_state.analysis_data:
            return
            
        data = st.session_state.analysis_data
        player_props = data['player_props']
        
        if not player_props:
            st.info("No player prop opportunities found today")
            return
        
        st.subheader("🎯 Player Prop Opportunities")
        
        # Create tabs for different prop categories
        hitting_props = [p for p in player_props if any(x in p['bet_type'] for x in ['hits', 'hr', 'rbi', 'runs', 'total_bases'])]
        pitching_props = [p for p in player_props if 'pitcher_' in p['bet_type']]
        situational_props = [p for p in player_props if p.get('prop_factor') in ['weather_boost', 'venue_boost', 'matchup_advantage']]
        streak_props = [p for p in player_props if p.get('prop_factor') in ['hot_streak', 'cold_streak', 'rbi_streak']]
        
        tab1, tab2, tab3, tab4 = st.tabs(["🔥 Hot Streaks", "⚾ Hitting Props", "🎯 Situational", "🥎 Pitcher Props"])
        
        with tab1:
            self._display_prop_category(streak_props, data['games'], "Hot streaks and trending plays")
        
        with tab2:
            self._display_prop_category(hitting_props, data['games'], "Standard hitting props")
        
        with tab3:
            self._display_prop_category(situational_props, data['games'], "Weather and venue advantages")
        
        with tab4:
            self._display_prop_category(pitching_props, data['games'], "Pitcher performance props")
    
    def _display_prop_category(self, props, games_df, description):
        """Helper to display a category of props"""
        if not props:
            st.info(f"No {description.lower()} found today")
            return
        
        st.write(f"*{description}*")
        
        for prop in props[:8]:  # Limit display
            game = games_df[games_df['game_id'] == prop['game_id']].iloc[0]
            
            with st.container():
                col1, col2, col3 = st.columns([2, 2, 1])
                
                with col1:
                    st.write(f"**{prop.get('player', 'Player')}**")
                    st.write(f"{game['away_team']} @ {game['home_team']}")
                    if 'prop_line' in prop:
                        st.write(f"📊 {prop['prop_line']}")
                
                with col2:
                    confidence_class = f"confidence-{prop['confidence']}"
                    st.markdown(f'<div class="{confidence_class}">{prop["confidence"].title()}</div>', unsafe_allow_html=True)
                    
                    # Show analysis
                    reason = prop['reasons'][0] if isinstance(prop.get('reasons'), list) else prop.get('reason', 'No analysis available')
                    st.write(reason)
                
                with col3:
                    bet_type = prop['bet_type'].replace('player_', '').replace('_', ' ').title()
                    st.write(f"**{bet_type}**")
                    st.write(f"Score: {prop['score']:.1f}")
                
                st.divider()
    
    def display_parlays(self):
        """Display parlay suggestions"""
        if not st.session_state.analysis_data:
            return
            
        data = st.session_state.analysis_data
        parlays = data['parlays']
        
        if not parlays:
            st.info("No parlay opportunities found today")
            return
        
        st.subheader("🎰 Parlay Suggestions")
        
        # Group by category
        specialty_parlays = [p for p in parlays if p['parlay_category'] == 'specialty']
        sgp_parlays = [p for p in parlays if p['parlay_category'] == 'same_game']
        multi_game_parlays = [p for p in parlays if p['parlay_category'] == 'multi_game']
        
        tab1, tab2, tab3 = st.tabs(["🏅 Specialty", "🎲 Same Game", "🌟 Multi-Game"])
        
        with tab1:
            self._display_parlay_category(specialty_parlays, data['games'], "Themed parlays (slugfest, pitcher's duel, etc.)")
        
        with tab2:
            self._display_parlay_category(sgp_parlays, data['games'], "Correlated bets within single games")
        
        with tab3:
            self._display_parlay_category(multi_game_parlays, data['games'], "High-confidence bets across multiple games")
    
    def _display_parlay_category(self, parlays, games_df, description):
        """Helper to display parlay category"""
        if not parlays:
            st.info(f"No {description.lower()} found today")
            return
        
        st.write(f"*{description}*")
        
        for i, parlay in enumerate(parlays):
            with st.expander(f"{parlay['type']} - {parlay['risk_level'].title()} Risk (Odds: {parlay['expected_odds']})"):
                st.write(f"**Strategy:** {parlay['reasoning']}")
                
                st.write("**Legs:**")
                for j, leg in enumerate(parlay['legs'], 1):
                    game = games_df[games_df['game_id'] == leg['game_id']].iloc[0]
                    
                    leg_display = leg['bet_type'].replace('_', ' ').title()
                    if 'player' in leg:
                        leg_display = f"{leg['player']} {leg_display.replace('Player ', '')}"
                    if leg.get('prop_line'):
                        leg_display += f" ({leg['prop_line']})"
                    if leg.get('line'):
                        leg_display += f" ({leg['line']})"
                    
                    confidence_emoji = "🔥" if leg['confidence'] == 'high' else "⚡" if leg['confidence'] == 'medium' else "💡"
                    st.write(f"{j}. {confidence_emoji} {leg_display}")
                    st.write(f"   {game['away_team']} @ {game['home_team']}")
                
                # Risk assessment
                risk_color = {"low": "🟢", "medium": "🟡", "high": "🔴"}[parlay['risk_level']]
                st.write(f"**Risk Level:** {risk_color} {parlay['risk_level'].title()}")
    
    def display_analytics(self):
        """Display analytics and charts"""
        if not st.session_state.analysis_data:
            return
            
        data = st.session_state.analysis_data
        
        st.subheader("📊 Betting Analytics")
        
        col1, col2 = st.columns(2)
        
        with col1:
            # Confidence distribution
            confidence_counts = {}
            for rec in data['recommendations']:
                conf = rec['confidence']
                confidence_counts[conf] = confidence_counts.get(conf, 0) + 1
            
            if confidence_counts:
                fig_conf = px.pie(
                    values=list(confidence_counts.values()),
                    names=list(confidence_counts.keys()),
                    title="Confidence Distribution",
                    color_discrete_map={
                        'high': '#ff6b6b',
                        'medium': '#ffa726',
                        'low': '#42a5f5'
                    }
                )
                st.plotly_chart(fig_conf, use_container_width=True)
        
        with col2:
            # Bet type distribution
            bet_type_counts = {}
            for rec in data['recommendations']:
                bet_type = rec['bet_type'].replace('_', ' ').title()
                bet_type_counts[bet_type] = bet_type_counts.get(bet_type, 0) + 1
            
            if bet_type_counts:
                # Show top 10 bet types
                sorted_types = sorted(bet_type_counts.items(), key=lambda x: x[1], reverse=True)[:10]
                
                fig_types = px.bar(
                    x=[item[1] for item in sorted_types],
                    y=[item[0] for item in sorted_types],
                    orientation='h',
                    title="Top Bet Types",
                    labels={'x': 'Count', 'y': 'Bet Type'}
                )
                fig_types.update_layout(height=400)
                st.plotly_chart(fig_types, use_container_width=True)
        
        # Weather impact analysis
        if data.get('weather'):
            st.subheader("🌤️ Weather Impact Analysis")
            
            weather_data = []
            for weather_info in data['weather']:
                weather_data.append({
                    'Venue': weather_info['venue'],
                    'Temperature': weather_info['weather']['temperature_f'],
                    'Condition': weather_info['weather']['condition'],
                    'Wind Speed': weather_info['weather']['wind_mph'],
                    'Humidity': weather_info['weather']['humidity']
                })
            
            if weather_data:
                weather_df = pd.DataFrame(weather_data)
                
                col1, col2 = st.columns(2)
                
                with col1:
                    fig_temp = px.bar(
                        weather_df,
                        x='Venue',
                        y='Temperature',
                        title="Stadium Temperatures",
                        color='Temperature',
                        color_continuous_scale='RdYlBu_r'
                    )
                    fig_temp.update_xaxes(tickangle=45)
                    st.plotly_chart(fig_temp, use_container_width=True)
                
                with col2:
                    fig_wind = px.scatter(
                        weather_df,
                        x='Wind Speed',
                        y='Temperature',
                        size='Humidity',
                        hover_data=['Venue', 'Condition'],
                        title="Weather Conditions Overview"
                    )
                    st.plotly_chart(fig_wind, use_container_width=True)
    
    def display_line_alerts(self):
        """Display line movement alerts"""
        if not st.session_state.analysis_data:
            return
            
        data = st.session_state.analysis_data
        line_alerts = data.get('line_alerts', [])
        
        if not line_alerts:
            st.info("No line movement alerts detected")
            return
        
        st.subheader("🚨 Line Movement Alerts")
        
        for alert in line_alerts:
            st.warning(f"**{alert['alert_type'].title()}:** {alert['message']}")
    
    def run_ui(self):
        """Main UI runner"""
        # Sidebar
        with st.sidebar:
            st.title("⚾ MLB Analysis")
            
            # Control buttons
            if st.button("🔄 Run Analysis", type="primary", use_container_width=True):
                if self.run_analysis():
                    st.success("Analysis completed!")
                    st.rerun()
            
            if st.button("🔥 Quick Refresh", use_container_width=True):
                if st.session_state.analysis_data:
                    st.info("Refreshing display...")
                    st.rerun()
            
            # Analysis status
            if st.session_state.last_update:
                st.markdown('<div class="sidebar-metric">', unsafe_allow_html=True)
                st.metric("Last Update", st.session_state.last_update.strftime("%H:%M"))
                st.markdown('</div>', unsafe_allow_html=True)
            
            # Quick stats
            if st.session_state.analysis_data:
                data = st.session_state.analysis_data
                
                st.markdown('<div class="sidebar-metric">', unsafe_allow_html=True)
                st.metric("Total Bets", len(data['recommendations']))
                st.markdown('</div>', unsafe_allow_html=True)
                
                st.markdown('<div class="sidebar-metric">', unsafe_allow_html=True)
                high_conf = len([r for r in data['recommendations'] if r['confidence'] == 'high'])
                st.metric("High Confidence", high_conf)
                st.markdown('</div>', unsafe_allow_html=True)
        
        # Main content
        self.display_main_dashboard()
        
        if st.session_state.analysis_data:
            # Navigation tabs
            tab1, tab2, tab3, tab4, tab5 = st.tabs([
                "🏆 Team Bets", 
                "🎯 Player Props", 
                "🎰 Parlays", 
                "📊 Analytics",
                "🚨 Alerts"
            ])
            
            with tab1:
                self.display_team_bets()
            
            with tab2:
                self.display_player_props()
            
            with tab3:
                self.display_parlays()
            
            with tab4:
                self.display_analytics()
            
            with tab5:
                self.display_line_alerts()
        
        else:
            st.info("Click 'Run Analysis' to start the MLB betting analysis")
            
            # Show sample data or instructions
            st.markdown("""
            ### 🎯 What This Tool Provides:
            
            **Team Betting Analysis:**
            - Money line recommendations
            - Over/Under totals with weather impact
            - Run line (+/-1.5) analysis
            - First 5 innings (F5) betting
            
            **Advanced Player Props:**
            - Hitting props (hits, HRs, RBIs, runs, total bases)
            - Pitcher props (strikeouts, walks, hits allowed)
            - Situational advantages (weather, venue, matchups)
            - Hot streak and trending analysis
            
            **Smart Parlays:**
            - Same Game Parlays (SGP) with correlated bets
            - Multi-game parlays with high-confidence picks
            - Specialty parlays (slugfest, pitcher's duel, etc.)
            
            **Advanced Analytics:**
            - Real-time weather impact modeling
            - Pitcher fatigue and workload analysis
            - Platoon advantage calculations
            - Line movement alerts
            """)

if __name__ == "__main__":
    ui = MLBBettingUI()
    ui.run_ui()
