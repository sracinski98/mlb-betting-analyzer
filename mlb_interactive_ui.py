#!/usr/bin/env python3
"""
Interactive MLB Betting Analysis Interface
Enhanced command-line interface with menus and better formatting
"""

import os
import sys
import time
from datetime import datetime
import json

# Add color support for better terminal display
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

class MLBInteractiveUI:
    def __init__(self):
        self.analysis_data = None
        self.last_update = None
        
    def clear_screen(self):
        """Clear the terminal screen"""
        os.system('cls' if os.name == 'nt' else 'clear')
    
    def print_header(self):
        """Print the main header"""
        self.clear_screen()
        print(Colors.HEADER + Colors.BOLD)
        print("=" * 80)
        print("⚾ MLB BETTING ANALYSIS ENGINE - INTERACTIVE INTERFACE")
        print("=" * 80)
        print(Colors.ENDC)
        
        if self.last_update:
            time_diff = datetime.now() - self.last_update
            minutes_ago = int(time_diff.total_seconds() / 60)
            print(f"{Colors.OKCYAN}Last Update: {minutes_ago} minutes ago{Colors.ENDC}")
        print()
    
    def print_main_menu(self):
        """Print the main menu options"""
        print(f"{Colors.BOLD}🎯 MAIN MENU{Colors.ENDC}")
        print("-" * 40)
        print("1. 🔄 Run Full Analysis")
        print("2. 📊 View Team Betting Opportunities")
        print("3. 🎯 View Player Props")
        print("4. 🎰 View Parlay Suggestions")
        print("5. 📈 View Analytics & Stats")
        print("6. 🚨 View Line Movement Alerts")
        print("7. ⚙️  Quick Settings")
        print("8. 🆘 Help & Tips")
        print("9. 🚪 Exit")
        print()
    
    def run_analysis(self):
        """Run the MLB betting analysis"""
        print(f"{Colors.WARNING}🔄 Running comprehensive MLB analysis...{Colors.ENDC}")
        print("This may take 30-60 seconds to gather all data...")
        print()
        
        try:
            # Import and run the analysis by executing the Betting file
            betting_file_path = '/Users/steveracinski/Documents/my_project/venv/job-listing-analyzer/Betting'
            
            # Create a namespace to execute the betting analysis
            namespace = {}
            with open(betting_file_path, 'r') as f:
                betting_code = f.read()
            
            # Execute the betting analysis code
            exec(betting_code, namespace)
            
            # Get the classes from the namespace
            MLBDataCollector = namespace.get('MLBDataCollector')
            MLBBettingAnalyzer = namespace.get('MLBBettingAnalyzer')
            
            if not MLBDataCollector or not MLBBettingAnalyzer:
                print(f"{Colors.FAIL}❌ Could not find MLBDataCollector or MLBBettingAnalyzer classes{Colors.ENDC}")
                input(f"\n{Colors.OKCYAN}Press Enter to continue...{Colors.ENDC}")
                return False
            
            # Create instances and run analysis
            data_collector = MLBDataCollector()
            analyzer = MLBBettingAnalyzer(data_collector)
            
            # Run the analysis
            result = analyzer.get_daily_recommendations()
            
            if result:
                self.analysis_data = result
                self.last_update = datetime.now()
                
                print(f"{Colors.OKGREEN}✅ Analysis completed successfully!{Colors.ENDC}")
                print(f"Found {len(result['recommendations'])} total betting opportunities")
                print(f"Team bets: {len(result['team_bets'])}")
                print(f"Player props: {len(result['player_props'])}")
                print(f"Parlays: {len(result['parlays'])}")
                
                input(f"\n{Colors.OKCYAN}Press Enter to continue...{Colors.ENDC}")
                return True
            else:
                print(f"{Colors.FAIL}❌ No analysis data returned{Colors.ENDC}")
                input(f"\n{Colors.OKCYAN}Press Enter to continue...{Colors.ENDC}")
                return False
                
        except Exception as e:
            print(f"{Colors.FAIL}❌ Error running analysis: {str(e)}{Colors.ENDC}")
            print(f"Make sure the Betting file exists and contains the required classes")
            input(f"\n{Colors.OKCYAN}Press Enter to continue...{Colors.ENDC}")
            return False
    
    def display_team_bets(self):
        """Display team betting opportunities with interactive navigation"""
        if not self.analysis_data:
            print(f"{Colors.WARNING}⚠️  No analysis data available. Please run analysis first.{Colors.ENDC}")
            input(f"\n{Colors.OKCYAN}Press Enter to continue...{Colors.ENDC}")
            return
        
        team_bets = self.analysis_data['team_bets']
        
        while True:
            self.print_header()
            print(f"{Colors.BOLD}🏆 TEAM BETTING OPPORTUNITIES ({len(team_bets)} total){Colors.ENDC}")
            print("-" * 60)
            
            if not team_bets:
                print(f"{Colors.WARNING}No team betting opportunities found today{Colors.ENDC}")
                input(f"\n{Colors.OKCYAN}Press Enter to return to main menu...{Colors.ENDC}")
                return
            
            # Filter options
            print("Filter by confidence:")
            print("1. All bets")
            print("2. High confidence only")
            print("3. Medium confidence only")
            print("4. View detailed analysis")
            print("0. Return to main menu")
            print()
            
            choice = input("Select option (0-4): ").strip()
            
            if choice == '0':
                return
            elif choice == '1':
                self._show_team_bets(team_bets, "All")
            elif choice == '2':
                high_conf_bets = [b for b in team_bets if b['confidence'] == 'high']
                self._show_team_bets(high_conf_bets, "High Confidence")
            elif choice == '3':
                med_conf_bets = [b for b in team_bets if b['confidence'] == 'medium']
                self._show_team_bets(med_conf_bets, "Medium Confidence")
            elif choice == '4':
                self._show_detailed_team_analysis(team_bets)
            else:
                print(f"{Colors.FAIL}Invalid choice. Please try again.{Colors.ENDC}")
                time.sleep(1)
    
    def _show_team_bets(self, bets, category):
        """Show team bets in a formatted way"""
        self.print_header()
        print(f"{Colors.BOLD}🏆 {category.upper()} TEAM BETS ({len(bets)} opportunities){Colors.ENDC}")
        print("-" * 60)
        
        if not bets:
            print(f"{Colors.WARNING}No bets in this category{Colors.ENDC}")
            input(f"\n{Colors.OKCYAN}Press Enter to continue...{Colors.ENDC}")
            return
        
        for i, bet in enumerate(bets[:15], 1):  # Show top 15
            game = self.analysis_data['games'][self.analysis_data['games']['game_id'] == bet['game_id']].iloc[0]
            
            # Confidence color coding
            if bet['confidence'] == 'high':
                conf_color = Colors.FAIL  # Red for high (hot)
                conf_emoji = "🔥"
            elif bet['confidence'] == 'medium':
                conf_color = Colors.WARNING  # Yellow for medium
                conf_emoji = "⚡"
            else:
                conf_color = Colors.OKBLUE  # Blue for low
                conf_emoji = "💡"
            
            print(f"\n{i}. {conf_emoji} {Colors.BOLD}{bet['bet_type'].upper().replace('_', ' ')}{Colors.ENDC}")
            print(f"   🏟️  {game['away_team']} @ {game['home_team']}")
            print(f"   📍 Venue: {game['venue']}")
            print(f"   {conf_color}Confidence: {bet['confidence'].title()} ({bet['score']:.1f}/3.0){Colors.ENDC}")
            print(f"   🔢 Supporting Factors: {bet['num_factors']}")
            
            # Show first reason
            if bet['reasons']:
                print(f"   💡 {bet['reasons'][0]}")
            
            if bet.get('line_alert'):
                print(f"   {Colors.WARNING}🚨 Line Alert: {bet['line_alert']['message']}{Colors.ENDC}")
        
        print(f"\n{Colors.OKCYAN}Showing top {min(15, len(bets))} of {len(bets)} opportunities{Colors.ENDC}")
        input(f"\n{Colors.OKCYAN}Press Enter to continue...{Colors.ENDC}")
    
    def _show_detailed_team_analysis(self, bets):
        """Show detailed analysis for team bets"""
        self.print_header()
        print(f"{Colors.BOLD}📊 DETAILED TEAM BET ANALYSIS{Colors.ENDC}")
        print("-" * 60)
        
        # Confidence breakdown
        confidence_counts = {'high': 0, 'medium': 0, 'low': 0}
        for bet in bets:
            confidence_counts[bet['confidence']] += 1
        
        print(f"{Colors.BOLD}Confidence Distribution:{Colors.ENDC}")
        print(f"🔥 High: {confidence_counts['high']} ({confidence_counts['high']/len(bets)*100:.1f}%)")
        print(f"⚡ Medium: {confidence_counts['medium']} ({confidence_counts['medium']/len(bets)*100:.1f}%)")
        print(f"💡 Low: {confidence_counts['low']} ({confidence_counts['low']/len(bets)*100:.1f}%)")
        
        # Bet type breakdown
        bet_types = {}
        for bet in bets:
            bet_type = bet['bet_type']
            bet_types[bet_type] = bet_types.get(bet_type, 0) + 1
        
        print(f"\n{Colors.BOLD}Bet Type Distribution:{Colors.ENDC}")
        for bet_type, count in sorted(bet_types.items(), key=lambda x: x[1], reverse=True)[:8]:
            print(f"• {bet_type.replace('_', ' ').title()}: {count}")
        
        # Top games analysis
        game_counts = {}
        for bet in bets:
            game_id = bet['game_id']
            if game_id not in game_counts:
                game = self.analysis_data['games'][self.analysis_data['games']['game_id'] == game_id].iloc[0]
                game_counts[game_id] = {
                    'count': 0,
                    'matchup': f"{game['away_team']} @ {game['home_team']}"
                }
            game_counts[game_id]['count'] += 1
        
        print(f"\n{Colors.BOLD}Games with Most Opportunities:{Colors.ENDC}")
        sorted_games = sorted(game_counts.items(), key=lambda x: x[1]['count'], reverse=True)
        for game_id, data in sorted_games[:5]:
            print(f"• {data['matchup']}: {data['count']} opportunities")
        
        input(f"\n{Colors.OKCYAN}Press Enter to continue...{Colors.ENDC}")
    
    def display_player_props(self):
        """Display player prop opportunities"""
        if not self.analysis_data:
            print(f"{Colors.WARNING}⚠️  No analysis data available. Please run analysis first.{Colors.ENDC}")
            input(f"\n{Colors.OKCYAN}Press Enter to continue...{Colors.ENDC}")
            return
        
        player_props = self.analysis_data['player_props']
        
        while True:
            self.print_header()
            print(f"{Colors.BOLD}🎯 PLAYER PROP OPPORTUNITIES ({len(player_props)} total){Colors.ENDC}")
            print("-" * 60)
            
            if not player_props:
                print(f"{Colors.WARNING}No player prop opportunities found today{Colors.ENDC}")
                input(f"\n{Colors.OKCYAN}Press Enter to return to main menu...{Colors.ENDC}")
                return
            
            # Categorize props
            hitting_props = [p for p in player_props if any(x in p['bet_type'] for x in ['hits', 'hr', 'rbi', 'runs', 'total_bases'])]
            pitching_props = [p for p in player_props if 'pitcher_' in p['bet_type']]
            situational_props = [p for p in player_props if p.get('prop_factor') in ['weather_boost', 'venue_boost', 'matchup_advantage']]
            streak_props = [p for p in player_props if p.get('prop_factor') in ['hot_streak', 'cold_streak', 'rbi_streak']]
            
            print("Select category:")
            print(f"1. 🔥 Hot Streaks & Trends ({len(streak_props)} props)")
            print(f"2. ⚾ Hitting Props ({len(hitting_props)} props)")
            print(f"3. 🎯 Situational Advantages ({len(situational_props)} props)")
            print(f"4. 🥎 Pitcher Props ({len(pitching_props)} props)")
            print("5. 📊 View all props summary")
            print("0. Return to main menu")
            print()
            
            choice = input("Select option (0-5): ").strip()
            
            if choice == '0':
                return
            elif choice == '1':
                self._show_prop_category(streak_props, "🔥 Hot Streaks & Trends")
            elif choice == '2':
                self._show_prop_category(hitting_props, "⚾ Hitting Props")
            elif choice == '3':
                self._show_prop_category(situational_props, "🎯 Situational Advantages")
            elif choice == '4':
                self._show_prop_category(pitching_props, "🥎 Pitcher Props")
            elif choice == '5':
                self._show_props_summary(player_props)
            else:
                print(f"{Colors.FAIL}Invalid choice. Please try again.{Colors.ENDC}")
                time.sleep(1)
    
    def _show_prop_category(self, props, category_name):
        """Show props in a specific category"""
        self.print_header()
        print(f"{Colors.BOLD}{category_name} ({len(props)} opportunities){Colors.ENDC}")
        print("-" * 60)
        
        if not props:
            print(f"{Colors.WARNING}No props in this category{Colors.ENDC}")
            input(f"\n{Colors.OKCYAN}Press Enter to continue...{Colors.ENDC}")
            return
        
        for i, prop in enumerate(props[:12], 1):  # Show top 12
            game = self.analysis_data['games'][self.analysis_data['games']['game_id'] == prop['game_id']].iloc[0]
            
            # Confidence color coding
            if prop['confidence'] == 'high':
                conf_color = Colors.FAIL
                conf_emoji = "🔥"
            elif prop['confidence'] == 'medium':
                conf_color = Colors.WARNING
                conf_emoji = "⚡"
            else:
                conf_color = Colors.OKBLUE
                conf_emoji = "💡"
            
            print(f"\n{i}. {conf_emoji} {Colors.BOLD}{prop.get('player', 'Player')}{Colors.ENDC}")
            print(f"   🎯 {prop['bet_type'].upper().replace('PLAYER_', '').replace('PITCHER_', '').replace('_', ' ')}")
            
            if 'prop_line' in prop:
                print(f"   📊 Line: {prop['prop_line']}")
            
            print(f"   🏟️  {game['away_team']} @ {game['home_team']}")
            print(f"   {conf_color}Confidence: {prop['confidence'].title()} ({prop['score']:.1f}/3.0){Colors.ENDC}")
            
            # Show analysis
            reason = prop['reasons'][0] if isinstance(prop.get('reasons'), list) else prop.get('reason', 'No analysis available')
            print(f"   💡 {reason}")
        
        print(f"\n{Colors.OKCYAN}Showing top {min(12, len(props))} of {len(props)} opportunities{Colors.ENDC}")
        input(f"\n{Colors.OKCYAN}Press Enter to continue...{Colors.ENDC}")
    
    def _show_props_summary(self, props):
        """Show summary of all props"""
        self.print_header()
        print(f"{Colors.BOLD}📊 PLAYER PROPS SUMMARY{Colors.ENDC}")
        print("-" * 60)
        
        # Top players with most props
        player_counts = {}
        for prop in props:
            player = prop.get('player', 'Unknown')
            if player not in player_counts:
                player_counts[player] = {'count': 0, 'high_conf': 0}
            player_counts[player]['count'] += 1
            if prop['confidence'] == 'high':
                player_counts[player]['high_conf'] += 1
        
        print(f"{Colors.BOLD}Players with Most Opportunities:{Colors.ENDC}")
        sorted_players = sorted(player_counts.items(), key=lambda x: x[1]['count'], reverse=True)
        for player, data in sorted_players[:8]:
            print(f"• {player}: {data['count']} props ({data['high_conf']} high confidence)")
        
        # Prop type breakdown
        prop_types = {}
        for prop in props:
            prop_type = prop['bet_type'].replace('player_', '').replace('pitcher_', '')
            prop_types[prop_type] = prop_types.get(prop_type, 0) + 1
        
        print(f"\n{Colors.BOLD}Most Common Prop Types:{Colors.ENDC}")
        for prop_type, count in sorted(prop_types.items(), key=lambda x: x[1], reverse=True)[:8]:
            print(f"• {prop_type.replace('_', ' ').title()}: {count}")
        
        input(f"\n{Colors.OKCYAN}Press Enter to continue...{Colors.ENDC}")
    
    def display_parlays(self):
        """Display parlay suggestions"""
        if not self.analysis_data:
            print(f"{Colors.WARNING}⚠️  No analysis data available. Please run analysis first.{Colors.ENDC}")
            input(f"\n{Colors.OKCYAN}Press Enter to continue...{Colors.ENDC}")
            return
        
        parlays = self.analysis_data['parlays']
        
        self.print_header()
        print(f"{Colors.BOLD}🎰 PARLAY SUGGESTIONS ({len(parlays)} total){Colors.ENDC}")
        print("-" * 60)
        
        if not parlays:
            print(f"{Colors.WARNING}No parlay opportunities found today{Colors.ENDC}")
            input(f"\n{Colors.OKCYAN}Press Enter to return to main menu...{Colors.ENDC}")
            return
        
        # Group by category
        specialty_parlays = [p for p in parlays if p['parlay_category'] == 'specialty']
        sgp_parlays = [p for p in parlays if p['parlay_category'] == 'same_game']
        multi_game_parlays = [p for p in parlays if p['parlay_category'] == 'multi_game']
        
        categories = [
            ("🏅 Specialty Parlays", specialty_parlays),
            ("🎲 Same Game Parlays (SGP)", sgp_parlays),
            ("🌟 Multi-Game Parlays", multi_game_parlays)
        ]
        
        for category_name, category_parlays in categories:
            if category_parlays:
                print(f"\n{Colors.BOLD}{category_name}:{Colors.ENDC}")
                print("-" * 40)
                
                for i, parlay in enumerate(category_parlays[:3], 1):  # Top 3 per category
                    # Risk color coding
                    if parlay['risk_level'] == 'low':
                        risk_color = Colors.OKGREEN
                        risk_emoji = "🟢"
                    elif parlay['risk_level'] == 'medium':
                        risk_color = Colors.WARNING
                        risk_emoji = "🟡"
                    else:
                        risk_color = Colors.FAIL
                        risk_emoji = "🔴"
                    
                    print(f"\n{i}. {risk_emoji} {Colors.BOLD}{parlay['type'].upper()}{Colors.ENDC}")
                    print(f"   {risk_color}Risk: {parlay['risk_level'].title()}{Colors.ENDC}")
                    print(f"   💰 Expected Odds: {parlay['expected_odds']}")
                    print(f"   🎯 Strategy: {parlay['reasoning']}")
                    print(f"   🦵 Legs: {len(parlay['legs'])}")
                    
                    # Show first two legs
                    for j, leg in enumerate(parlay['legs'][:2], 1):
                        game = self.analysis_data['games'][self.analysis_data['games']['game_id'] == leg['game_id']].iloc[0]
                        leg_display = leg['bet_type'].replace('_', ' ').title()
                        if 'player' in leg:
                            leg_display = f"{leg['player']} {leg_display.replace('Player ', '')}"
                        print(f"     {j}. {leg_display}")
                        print(f"        {game['away_team']} @ {game['home_team']}")
                    
                    if len(parlay['legs']) > 2:
                        print(f"     ... and {len(parlay['legs']) - 2} more legs")
        
        input(f"\n{Colors.OKCYAN}Press Enter to continue...{Colors.ENDC}")
    
    def display_analytics(self):
        """Display analytics and statistics"""
        if not self.analysis_data:
            print(f"{Colors.WARNING}⚠️  No analysis data available. Please run analysis first.{Colors.ENDC}")
            input(f"\n{Colors.OKCYAN}Press Enter to continue...{Colors.ENDC}")
            return
        
        self.print_header()
        print(f"{Colors.BOLD}📈 ANALYTICS & STATISTICS{Colors.ENDC}")
        print("-" * 60)
        
        data = self.analysis_data
        
        # Overall stats
        print(f"{Colors.BOLD}📊 OVERALL ANALYSIS SUMMARY{Colors.ENDC}")
        print(f"🎯 Total Opportunities: {len(data['recommendations'])}")
        print(f"🏆 Team Bets: {len(data['team_bets'])}")
        print(f"🎯 Player Props: {len(data['player_props'])}")
        print(f"🎰 Parlays Available: {len(data['parlays'])}")
        print(f"🏟️  Games Analyzed: {len(data['games'])}")
        
        # Confidence breakdown
        high_conf = len([r for r in data['recommendations'] if r['confidence'] == 'high'])
        medium_conf = len([r for r in data['recommendations'] if r['confidence'] == 'medium'])
        low_conf = len([r for r in data['recommendations'] if r['confidence'] == 'low'])
        
        print(f"\n{Colors.BOLD}🎯 CONFIDENCE DISTRIBUTION{Colors.ENDC}")
        print(f"🔥 High Confidence: {high_conf} ({high_conf/len(data['recommendations'])*100:.1f}%)")
        print(f"⚡ Medium Confidence: {medium_conf} ({medium_conf/len(data['recommendations'])*100:.1f}%)")
        print(f"💡 Low Confidence: {low_conf} ({low_conf/len(data['recommendations'])*100:.1f}%)")
        
        # Weather analysis
        if data.get('weather'):
            print(f"\n{Colors.BOLD}🌤️  WEATHER CONDITIONS{Colors.ENDC}")
            
            temps = []
            wind_speeds = []
            conditions = {}
            
            for weather_info in data['weather']:
                weather = weather_info['weather']
                temps.append(weather['temperature_f'])
                wind_speeds.append(weather['wind_mph'])
                condition = weather['condition']
                conditions[condition] = conditions.get(condition, 0) + 1
            
            if temps:
                avg_temp = sum(temps) / len(temps)
                max_temp = max(temps)
                min_temp = min(temps)
                avg_wind = sum(wind_speeds) / len(wind_speeds)
                
                print(f"🌡️  Temperature Range: {min_temp:.0f}°F - {max_temp:.0f}°F (avg: {avg_temp:.0f}°F)")
                print(f"💨 Average Wind Speed: {avg_wind:.1f} mph")
                
                print(f"\n🌤️  Weather Conditions:")
                for condition, count in sorted(conditions.items(), key=lambda x: x[1], reverse=True):
                    print(f"• {condition}: {count} games")
        
        # Line alerts
        if data.get('line_alerts'):
            print(f"\n{Colors.BOLD}🚨 LINE MOVEMENT SUMMARY{Colors.ENDC}")
            print(f"Active Alerts: {len(data['line_alerts'])}")
            for alert in data['line_alerts'][:3]:
                print(f"• {alert['alert_type'].title()}: {alert['message']}")
        
        input(f"\n{Colors.OKCYAN}Press Enter to continue...{Colors.ENDC}")
    
    def display_line_alerts(self):
        """Display line movement alerts"""
        if not self.analysis_data:
            print(f"{Colors.WARNING}⚠️  No analysis data available. Please run analysis first.{Colors.ENDC}")
            input(f"\n{Colors.OKCYAN}Press Enter to continue...{Colors.ENDC}")
            return
        
        self.print_header()
        print(f"{Colors.BOLD}🚨 LINE MOVEMENT ALERTS{Colors.ENDC}")
        print("-" * 60)
        
        line_alerts = self.analysis_data.get('line_alerts', [])
        
        if not line_alerts:
            print(f"{Colors.OKGREEN}✅ No significant line movement detected{Colors.ENDC}")
            print("This could indicate:")
            print("• Stable betting markets")
            print("• Limited sharp money action")
            print("• Balanced public betting")
        else:
            print(f"Found {len(line_alerts)} line movement alerts:")
            print()
            
            for i, alert in enumerate(line_alerts, 1):
                print(f"{i}. {Colors.WARNING}⚠️  {alert['alert_type'].upper()}{Colors.ENDC}")
                print(f"   📝 {alert['message']}")
                print(f"   🎯 Game ID: {alert['game_id']}")
                print()
        
        input(f"\n{Colors.OKCYAN}Press Enter to continue...{Colors.ENDC}")
    
    def show_settings(self):
        """Show quick settings menu"""
        while True:
            self.print_header()
            print(f"{Colors.BOLD}⚙️  QUICK SETTINGS{Colors.ENDC}")
            print("-" * 40)
            print("1. 📊 Export analysis to JSON")
            print("2. 🔄 Force refresh analysis")
            print("3. 📈 View system status")
            print("4. 🎯 Change display preferences")
            print("0. Return to main menu")
            print()
            
            choice = input("Select option (0-4): ").strip()
            
            if choice == '0':
                return
            elif choice == '1':
                self._export_analysis()
            elif choice == '2':
                self.run_analysis()
            elif choice == '3':
                self._show_system_status()
            elif choice == '4':
                self._display_preferences()
            else:
                print(f"{Colors.FAIL}Invalid choice. Please try again.{Colors.ENDC}")
                time.sleep(1)
    
    def _export_analysis(self):
        """Export analysis data to JSON"""
        if not self.analysis_data:
            print(f"{Colors.WARNING}⚠️  No analysis data to export{Colors.ENDC}")
            input(f"\n{Colors.OKCYAN}Press Enter to continue...{Colors.ENDC}")
            return
        
        try:
            filename = f"mlb_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            
            # Convert pandas DataFrames to dict for JSON serialization
            export_data = self.analysis_data.copy()
            if 'games' in export_data:
                export_data['games'] = export_data['games'].to_dict('records')
            
            with open(filename, 'w') as f:
                json.dump(export_data, f, indent=2, default=str)
            
            print(f"{Colors.OKGREEN}✅ Analysis exported to {filename}{Colors.ENDC}")
        except Exception as e:
            print(f"{Colors.FAIL}❌ Export failed: {str(e)}{Colors.ENDC}")
        
        input(f"\n{Colors.OKCYAN}Press Enter to continue...{Colors.ENDC}")
    
    def _show_system_status(self):
        """Show system status"""
        self.print_header()
        print(f"{Colors.BOLD}📈 SYSTEM STATUS{Colors.ENDC}")
        print("-" * 40)
        
        print(f"Analysis Status: {'✅ Loaded' if self.analysis_data else '❌ No Data'}")
        print(f"Last Update: {self.last_update.strftime('%Y-%m-%d %H:%M:%S') if self.last_update else 'Never'}")
        print(f"Python Version: {sys.version.split()[0]}")
        print(f"Working Directory: {os.getcwd()}")
        
        if self.analysis_data:
            print(f"\nData Summary:")
            print(f"• Recommendations: {len(self.analysis_data['recommendations'])}")
            print(f"• Team Bets: {len(self.analysis_data['team_bets'])}")
            print(f"• Player Props: {len(self.analysis_data['player_props'])}")
            print(f"• Parlays: {len(self.analysis_data['parlays'])}")
        
        input(f"\n{Colors.OKCYAN}Press Enter to continue...{Colors.ENDC}")
    
    def _display_preferences(self):
        """Display preferences (placeholder for future features)"""
        self.print_header()
        print(f"{Colors.BOLD}🎯 DISPLAY PREFERENCES{Colors.ENDC}")
        print("-" * 40)
        print("Current settings:")
        print("• Color output: Enabled")
        print("• Max results per page: 15")
        print("• Confidence threshold: All levels")
        print("• Auto-refresh: Disabled")
        print()
        print(f"{Colors.OKCYAN}Note: Preferences customization coming in future updates{Colors.ENDC}")
        
        input(f"\n{Colors.OKCYAN}Press Enter to continue...{Colors.ENDC}")
    
    def show_help(self):
        """Show help and tips"""
        self.print_header()
        print(f"{Colors.BOLD}🆘 HELP & BETTING TIPS{Colors.ENDC}")
        print("-" * 60)
        
        print(f"{Colors.BOLD}🎯 HOW TO USE THIS TOOL:{Colors.ENDC}")
        print("1. Run full analysis to gather today's MLB data")
        print("2. Review team bets for money line, totals, and run lines")
        print("3. Check player props for individual performance bets")
        print("4. Consider parlays for higher payouts")
        print("5. Monitor line alerts for value opportunities")
        
        print(f"\n{Colors.BOLD}💡 BETTING STRATEGY TIPS:{Colors.ENDC}")
        print("🔥 Focus on high-confidence bets for consistent value")
        print("⚡ Weather and venue factors significantly impact outcomes")
        print("🎯 Player props often have less market attention = more value")
        print("🎰 Same Game Parlays offer correlation but require precision")
        print("📊 First 5 innings bets eliminate bullpen uncertainty")
        print("🌟 Run lines (+/-1.5) often provide better value than ML")
        
        print(f"\n{Colors.BOLD}⚠️  RESPONSIBLE GAMBLING:{Colors.ENDC}")
        print("• Never bet more than you can afford to lose")
        print("• These are analytical suggestions, not guaranteed wins")
        print("• Set daily/weekly limits and stick to them")
        print("• Take breaks and don't chase losses")
        print("• Consider betting as entertainment, not investment")
        
        print(f"\n{Colors.BOLD}🔧 TROUBLESHOOTING:{Colors.ENDC}")
        print("• If analysis fails, check your internet connection")
        print("• API limits may cause temporary failures")
        print("• Some games may not have complete data")
        print("• Weather data depends on stadium location accuracy")
        
        input(f"\n{Colors.OKCYAN}Press Enter to continue...{Colors.ENDC}")
    
    def run(self):
        """Main application loop"""
        while True:
            self.print_header()
            
            # Show quick status
            if self.analysis_data:
                total_ops = len(self.analysis_data['recommendations'])
                high_conf = len([r for r in self.analysis_data['recommendations'] if r['confidence'] == 'high'])
                print(f"{Colors.OKGREEN}📊 Analysis Loaded: {total_ops} opportunities ({high_conf} high confidence){Colors.ENDC}")
                print()
            
            self.print_main_menu()
            
            choice = input(f"{Colors.BOLD}Select option (1-9): {Colors.ENDC}").strip()
            
            if choice == '1':
                self.run_analysis()
            elif choice == '2':
                self.display_team_bets()
            elif choice == '3':
                self.display_player_props()
            elif choice == '4':
                self.display_parlays()
            elif choice == '5':
                self.display_analytics()
            elif choice == '6':
                self.display_line_alerts()
            elif choice == '7':
                self.show_settings()
            elif choice == '8':
                self.show_help()
            elif choice == '9':
                print(f"\n{Colors.OKCYAN}Thanks for using MLB Betting Analysis Engine!{Colors.ENDC}")
                print("Remember to bet responsibly! 🎯")
                break
            else:
                print(f"{Colors.FAIL}Invalid choice. Please try again.{Colors.ENDC}")
                time.sleep(1)

if __name__ == "__main__":
    ui = MLBInteractiveUI()
    ui.run()
