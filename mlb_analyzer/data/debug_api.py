"""Minimal test version of MLBApi for debugging"""
import pandas as pd
import requests
from datetime import datetime
import logging

class MLBApi:
    ESPN_MLB_ENDPOINT = "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb"
    
    def __init__(self, odds_api_key: str = "fe3e1db58259d6d7d3599e2ae3d22ecc"):
        self.logger = logging.getLogger(__name__)
        from mlb_analyzer.data.providers.odds_api_provider import TheOddsAPIProvider
        self.odds_provider = TheOddsAPIProvider(odds_api_key)
    
    def get_live_games(self) -> pd.DataFrame:
        """Fetch today's MLB games"""
        try:
            response = requests.get(f"{self.ESPN_MLB_ENDPOINT}/scoreboard")
            data = response.json()
            
            games = []
            for event in data.get('events', []):
                game_data = {
                    'game_id': event['id'],
                    'status': event['status']['type']['name'],
                    'home_team': event['competitions'][0]['competitors'][0]['team']['abbreviation'],
                    'away_team': event['competitions'][0]['competitors'][1]['team']['abbreviation'],
                }
                games.append(game_data)
            
            return pd.DataFrame(games)
            
        except Exception as e:
            self.logger.error(f"Error fetching games: {str(e)}")
            return pd.DataFrame()
