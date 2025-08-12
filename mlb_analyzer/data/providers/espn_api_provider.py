"""ESPN API provider for MLB team stats"""
import pandas as pd
import requests
from datetime import datetime, timedelta
import logging

class ESPNStatsProvider:
    ESPN_MLB_ENDPOINT = "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb"
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.cache = {}
        self.cache_ttl = timedelta(hours=1)  # Cache team stats for 1 hour
    
    def get_team_stats(self, team_abbrev: str) -> pd.DataFrame:
        """Get recent team performance stats"""
        cache_key = f'team_stats_{team_abbrev}'
        
        # Check cache first
        if cache_key in self.cache:
            cache_entry = self.cache[cache_key]
            if datetime.now() - cache_entry['timestamp'] < self.cache_ttl:
                return cache_entry['data']
        
        try:
            # Get team schedule/results for last 10 games
            today = datetime.now()
            thirty_days_ago = (today - timedelta(days=30)).strftime('%Y%m%d')
            today_str = today.strftime('%Y%m%d')
            
            response = requests.get(
                f"{self.ESPN_MLB_ENDPOINT}/scoreboard",
                params={
                    'limit': 100,
                    'dates': f"{thirty_days_ago}-{today_str}"
                }
            )
            
            if response.status_code != 200:
                self.logger.error(f"Error fetching team stats for {team_abbrev}: {response.status_code}")
                return pd.DataFrame()
                
            data = response.json()
            recent_games = []
            
            for event in data.get('events', []):
                if event['status']['type']['name'] == 'STATUS_FINAL':
                    competition = event['competitions'][0]
                    for competitor in competition['competitors']:
                        if competitor['team']['abbreviation'] == team_abbrev:
                            opponent = [c for c in competition['competitors'] if c['team']['abbreviation'] != team_abbrev][0]
                            game_data = {
                                'date': event['date'],
                                'runs_scored': int(competitor['score']),
                                'winner': competitor['winner'],
                                'opponent': opponent['team']['abbreviation']
                            }
                            recent_games.append(game_data)
            
            if not recent_games:
                return pd.DataFrame()
                
            # Convert to DataFrame
            df = pd.DataFrame(recent_games)
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date', ascending=False).head(10)  # Last 10 games
            
            # Calculate stats
            stats = pd.DataFrame([{
                'team': team_abbrev,
                'games_analyzed': len(df),
                'recent_win_pct': df['winner'].mean(),
                'recent_runs_per_game': df['runs_scored'].mean(),
                'last_update': datetime.now().isoformat()
            }])
            
            # Cache results
            self.cache[cache_key] = {
                'data': stats,
                'timestamp': datetime.now()
            }
            
            return stats
            
        except Exception as e:
            self.logger.error(f"Error processing team stats for {team_abbrev}: {str(e)}")
            return pd.DataFrame()
