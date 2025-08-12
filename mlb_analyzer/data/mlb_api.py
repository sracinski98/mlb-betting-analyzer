"""
MLB Stats integration module for real-time and historical data.
Combines live game data with historical statistics.
"""

from typing import Dict, List, Optional, Tuple
import logging
import pandas as pd
import requests
import time
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
import re

class MLBApi:
    # ESPN API endpoints
    ESPN_MLB_ENDPOINT = "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb"
    ESPN_TEAM_ENDPOINT = "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams"
    ESPN_STATS_ENDPOINT = "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/statistics"
    ESPN_SCOREBOARD_ENDPOINT = "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard"
    ESPN_SCHEDULE_ENDPOINT = "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/schedule"
    ESPN_PLAYER_ENDPOINT = "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/athletes"
    
    # ESPN endpoints
    ESPN_ODDS_ENDPOINT = "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard"
    
    # Common prop types
    PROP_TYPES = {
        'STRIKEOUTS': 'pitcher_strikeouts',
        'HITS': 'batter_hits',
        'RUNS': 'batter_runs',
        'BASES': 'total_bases',
        'RBI': 'runs_batted_in',
        'WALKS': 'walks_recorded',
        'HOME_RUNS': 'home_runs',
        'PITCHES': 'pitches_thrown'
    }
    
    def __init__(self, odds_api_key: str = "fe3e1db58259d6d7d3599e2ae3d22ecc"):
        """
        Initialize MLBApi.
        
        Args:
            odds_api_key (str): API key for The Odds API. Defaults to provided key.
            
        Sets up logging and cache with configurable settings.
        """
        self.logger = logging.getLogger(__name__)
        # Initialize The Odds API provider
        from mlb_analyzer.data.providers.odds_api_provider import TheOddsAPIProvider
        self.odds_provider = TheOddsAPIProvider(odds_api_key)
        self.cache = {}
        self.cache_ttl = {
            'odds': timedelta(minutes=5),  # Odds data cached for 5 minutes
            'games': timedelta(minutes=1),  # Live games cached for 1 minute
            'stats': timedelta(hours=1)     # Team/player stats cached for 1 hour
        }
        self.max_retries = 3  # Number of times to retry failed requests
        self.retry_delay = 1  # Seconds to wait between retries
    
    def get_live_games(self) -> pd.DataFrame:
        """
        Fetch today's MLB games with live data from ESPN.
        
        Returns:
            pd.DataFrame: DataFrame containing today's games with live data
        """
        try:
            # Get scoreboard data from ESPN
            response = requests.get(f"{self.ESPN_MLB_ENDPOINT}/scoreboard")
            response.raise_for_status()
            data = response.json()
            
            games = []
            for event in data.get('events', []):
                game_data = {
                    'game_id': event['id'],
                    'status': event['status']['type']['name'],
                    'date': event['date'],
                    'venue': event['competitions'][0]['venue']['fullName'],
                    'home_team': event['competitions'][0]['competitors'][0]['team']['abbreviation'],
                    'away_team': event['competitions'][0]['competitors'][1]['team']['abbreviation'],
                    'home_score': event['competitions'][0]['competitors'][0].get('score', 0),
                    'away_score': event['competitions'][0]['competitors'][1].get('score', 0),
                    'home_win_probability': event['competitions'][0]['competitors'][0].get('probability', 0.5),
                    'inning': event['competitions'][0].get('status', {}).get('period', 0),
                    'pitchers': self._extract_pitchers(event['competitions'][0])
                }
                games.append(game_data)
            
            return pd.DataFrame(games)
            
        except Exception as e:
            self.logger.error(f"Error fetching live games: {str(e)}")
            return pd.DataFrame()
    
    def get_live_odds(self) -> pd.DataFrame:
        """
        Fetch current MLB betting odds from the configured provider.
        
        Returns:
            pd.DataFrame: DataFrame containing current odds
            
        Note:
            Odds data is cached for 5 minutes to avoid excessive API calls.
            Use force_refresh=True to bypass cache.
        """
        cache_key = 'live_odds'
        
        # Check cache
        if cache_key in self.cache:
            cache_entry = self.cache[cache_key]
            if datetime.now() - cache_entry['timestamp'] < self.cache_ttl['odds']:
                self.logger.debug("Returning cached odds data")
                return cache_entry['data']
        
        try:
            if self.odds_provider:
                # Get odds from the configured provider
                df = self.odds_provider.get_all_odds()
            else:
                # Fallback to ESPN odds endpoint
                data = self._make_request(self.ESPN_ODDS_ENDPOINT)
                
                odds_list = []
                for event in data.get('events', []):
                    competition = event.get('competitions', [])[0] if event.get('competitions') else None
                    if not competition:
                        continue
                        
                    odds_data = {
                        'game_id': event['id'],
                        'date': event['date'],
                        'home_team': competition['competitors'][0]['team']['abbreviation'],
                        'away_team': competition['competitors'][1]['team']['abbreviation'],
                        'bookmaker': 'ESPN',
                        'last_update': datetime.now().isoformat()
                    }
                    
                    # Extract odds information
                    odds = competition.get('odds', [{}])[0] if competition.get('odds') else {}
                    
                    # Get moneyline odds
                    odds_data.update({
                        'home_moneyline': odds.get('homeTeamOdds', {}).get('moneyLine'),
                        'away_moneyline': odds.get('awayTeamOdds', {}).get('moneyLine')
                    })
                    
                    # Get spread (run line) odds
                    spread = odds.get('spread')
                    if spread is not None:
                        odds_data.update({
                            'home_spread': spread,
                            'home_spread_odds': odds.get('homeTeamOdds', {}).get('spreadOdds'),
                            'away_spread_odds': odds.get('awayTeamOdds', {}).get('spreadOdds')
                        })
                    
                    # Get over/under (total runs) odds
                    over_under = odds.get('overUnder')
                    if over_under is not None:
                        odds_data.update({
                            'total_runs': over_under,
                            'over_odds': odds.get('overOdds'),
                            'under_odds': odds.get('underOdds')
                        })
                    
                    odds_list.append(odds_data)
                
                df = pd.DataFrame(odds_list)
            
            # Cache the results if we have data
            if not df.empty:
                self.cache[cache_key] = {
                    'data': df,
                    'timestamp': datetime.now()
                }
            
            return df
            
        except Exception as e:
            self.logger.error(f"Error fetching odds data: {str(e)}")
            # If we have cached data and it's less than 30 minutes old, return it as fallback
            if 'live_odds' in self.cache:
                cache_entry = self.cache['live_odds']
                if datetime.now() - cache_entry['timestamp'] < timedelta(minutes=30):
                    self.logger.warning("Using cached odds data as fallback due to API error")
                    return cache_entry['data']
            return pd.DataFrame()
            
    def _extract_pitchers(self, competition: Dict) -> Dict[str, str]:
        """Extract pitcher information from ESPN competition data."""
        pitchers = {'home': 'TBD', 'away': 'TBD'}
        try:
            for competitor in competition['competitors']:
                if competitor.get('homeAway') == 'home':
                    pitchers['home'] = competitor.get('probablePitcher', {}).get('displayName', 'TBD')
                else:
                    pitchers['away'] = competitor.get('probablePitcher', {}).get('displayName', 'TBD')
        except Exception:
            pass
        return pitchers
    
    def _normalize_team_name(self, team: str) -> str:
        """
        Normalize team abbreviation to match pybaseball's expected format.
        
        Args:
            team (str): Team abbreviation or name
            
        Returns:
            str: Normalized team abbreviation
        """
        # Mapping of common variations to pybaseball's expected format
        team_mapping = {
            'ATH': 'OAK',  # Oakland Athletics
            'CWS': 'CHW',  # Chicago White Sox
            'WSH': 'WSN',  # Washington Nationals
            'TB': 'TBR',   # Tampa Bay Rays
            'SD': 'SDP',   # San Diego Padres
            'SF': 'SFG',   # San Francisco Giants
            'KC': 'KCR',   # Kansas City Royals
        }
        
        team = team.upper()
        return team_mapping.get(team, team)
    
    def get_team_stats(self, team: str) -> pd.DataFrame:
        """
        Fetch current team statistics from ESPN.
        
        Args:
            team (str): Team abbreviation (e.g., 'NYY', 'BOS')
            
        Returns:
            pd.DataFrame: Team statistics including record, stats, and standings
        """
        cache_key = f"team_stats_{team}"
        if cache_key in self.cache:
            return self.cache[cache_key]
            
        try:
            # First get team ID and basic info from ESPN
            response = requests.get(f"{self.ESPN_TEAM_ENDPOINT}/{team}")
            response.raise_for_status()
            team_data = response.json()
            
            self.logger.info(f"Team data response for {team}")
            
            # Initialize stats dictionary
            stats = {
                'team': team,
                'last_updated': datetime.now().isoformat(),
                'wins': 0,
                'losses': 0,
                'win_pct': 0.0,
                'games_played': 0,
                'streak': 0,
                'last_ten': 0.0
            }
            
            # Safely convert values to float
            def safe_float(value, default=0.0):
                try:
                    if isinstance(value, (int, float)):
                        return float(value)
                    elif isinstance(value, str) and value.strip():
                        # Remove percentage signs and convert
                        clean_val = value.strip('% ')
                        return float(clean_val)
                    elif isinstance(value, dict) and 'value' in value:
                        return float(value['value'])
                    return default
                except (ValueError, TypeError):
                    return default
            
            # Extract team info
            if isinstance(team_data, dict) and 'team' in team_data:
                team_info = team_data['team']
                
                    # Get team ID
                team_id = str(team_info.get('id', ''))
                stats['team_id'] = team_id
                
                # Extract record data
                if 'record' in team_info:
                    record_items = team_info['record'].get('items', [])
                    if record_items:
                        record = record_items[0]
                        if 'stats' in record and record['stats']:
                            for stat in record['stats']:
                                name = stat.get('name', '').lower()
                                if name in ['wins', 'losses', 'winpercent', 'gameplayed', 'streak']:
                                    value = safe_float(stat.get('value'))
                                    if name == 'winpercent':
                                        stats['win_pct'] = value
                                        stats['recent_win_pct'] = value  # Use current win percentage as recent
                                    elif name == 'gameplayed':
                                        stats['games_played'] = value
                                    else:
                                        stats[name] = value
                                        
                # Add default values for recent performance if not set
                if 'recent_win_pct' not in stats:
                    stats['recent_win_pct'] = stats.get('win_pct', 0.500)
                if 'recent_runs_per_game' not in stats:
                    stats['recent_runs_per_game'] = 4.5  # League average                # Get detailed stats
                response = requests.get(
                    f"{self.ESPN_STATS_ENDPOINT}/teams/{team_id}",
                    params={
                        'limit': 100,
                        'categories': 'batting,pitching'
                    }
                )
                response.raise_for_status()
                stats_data = response.json()
                
                # Process batting stats
                if 'batting' in stats_data:
                    batting = stats_data['batting'].get('statistics', {})
                    for stat in batting:
                        name = f"batting_{stat.get('name', '').lower().replace(' ', '_')}"
                        stats[name] = safe_float(stat.get('value'))
                
                # Process pitching stats
                if 'pitching' in stats_data:
                    pitching = stats_data['pitching'].get('statistics', {})
                    for stat in pitching:
                        name = f"pitching_{stat.get('name', '').lower().replace(' ', '_')}"
                        stats[name] = safe_float(stat.get('value'))
                
                # Create DataFrame and cache it
                result = pd.DataFrame([stats])
                self.cache[cache_key] = result
                
                return result
            
            else:
                self.logger.error(f"Invalid team data format for {team}")
                return pd.DataFrame()
            
            # Get detailed team stats
            stats_response = requests.get(
                f"{self.ESPN_STATS_ENDPOINT}/teams/{team_id}",
                params={
                    'limit': 100,
                    'categories': 'batting,pitching'
                }
            )
            stats_response.raise_for_status()
            stats_data = stats_response.json()
            
            if not isinstance(stats_data, dict):
                raise ValueError(f"Unexpected stats data format for {team}")
            
            # Process stats
            stats = {
                'team': team,
                'last_updated': datetime.now().isoformat(),
                **team_record
            }
            
            # Process batting stats
            batting = stats_data.get('batting', {}).get('statistics', {})
            if batting:
                for stat in batting:
                    name = stat.get('name', '').lower().replace(' ', '_')
                    if 'displayValue' in stat:
                        try:
                            value = stat['displayValue']
                            if isinstance(value, str):
                                if '%' in value:
                                    value = float(value.strip('%')) / 100
                                else:
                                    value = float(''.join(c for c in value if c.isdigit() or c in '.-'))
                            stats[f"batting_{name}"] = float(value)
                        except (ValueError, TypeError):
                            continue
            
            # Process pitching stats
            pitching = stats_data.get('pitching', {}).get('statistics', {})
            if pitching:
                for stat in pitching:
                    name = stat.get('name', '').lower().replace(' ', '_')
                    if 'displayValue' in stat:
                        try:
                            value = stat['displayValue']
                            if isinstance(value, str):
                                if '%' in value:
                                    value = float(value.strip('%')) / 100
                                else:
                                    value = float(''.join(c for c in value if c.isdigit() or c in '.-'))
                            stats[f"pitching_{name}"] = float(value)
                        except (ValueError, TypeError):
                            continue

            self.logger.debug(f"Processed stats for {team}")
                
            # Get recent schedule and results
            schedule_response = requests.get(
                f"{self.ESPN_TEAM_ENDPOINT}/{team_id}/schedule",
                params={'limit': 10}
            )
            schedule_response.raise_for_status()
            schedule_data = schedule_response.json()
            
            # Calculate recent performance
            if isinstance(schedule_data, dict) and 'events' in schedule_data:
                total_games = len(schedule_data['events'])
                if total_games > 0:
                    recent_runs_scored = 0
                    recent_runs_allowed = 0
                    recent_wins = 0
                    
                    for game in schedule_data['events'][:10]:  # Last 10 games
                        if 'competitions' in game and game['competitions']:
                            comp = game['competitions'][0]
                            for team_stats in comp.get('competitors', []):
                                if team_stats['id'] == team_id:
                                    if team_stats.get('winner'):
                                        recent_wins += 1
                                    recent_runs_scored += int(team_stats.get('score', 0))
                                else:
                                    recent_runs_allowed += int(team_stats.get('score', 0))
                    
                    stats.update({
                        'recent_win_pct': float(recent_wins) / min(total_games, 10),
                        'recent_runs_per_game': float(recent_runs_scored) / min(total_games, 10),
                        'recent_runs_allowed_per_game': float(recent_runs_allowed) / min(total_games, 10)
                    })
            
            # Create DataFrame
            result = pd.DataFrame([stats])
            
            # Cache the results
            self.cache[cache_key] = result
            
            return result
            
        except Exception as e:
            self.logger.error(f"Error fetching team stats for {team}: {str(e)}")
            return pd.DataFrame()
            
    def _process_espn_stats(self, stats_data: List[Dict]) -> Dict[str, float]:
        """Process ESPN API stats data into a dictionary."""
        processed_stats = {}
        
        if not stats_data:
            self.logger.debug("Empty stats_data received")
            return processed_stats
            
        # Handle different data structures
        if isinstance(stats_data, dict):
            # If it's a dictionary, try to get the stats array
            self.logger.debug("Stats data is a dictionary, extracting stats array")
            stats_data = stats_data.get('stats', [])
        elif isinstance(stats_data, list) and len(stats_data) == 1 and isinstance(stats_data[0], dict):
            # If it's a list with one dictionary that has stats
            if 'stats' in stats_data[0]:
                self.logger.debug("Stats data is a list with one dictionary containing stats")
                stats_data = stats_data[0]['stats']
        
        # Ensure we have a list to process
        if not isinstance(stats_data, list):
            self.logger.debug(f"Stats data is not a list: {type(stats_data)}")
            return processed_stats
            
        for stat in stats_data:
            if not isinstance(stat, dict):
                self.logger.debug(f"Skipping non-dictionary stat: {stat}")
                continue
                
            stat_name = str(stat.get('name', '')).lower().replace(' ', '_')
            if not stat_name:
                self.logger.debug("Skipping stat with no name")
                continue

            try:
                value = None
                stat_type = None
                
                # First check the stat structure
                if 'value' in stat:
                    value = stat['value']
                    stat_type = 'direct'
                elif 'stats' in stat and isinstance(stat['stats'], list):
                    stats_list = stat['stats']
                    if stats_list:
                        first_stat = stats_list[0]
                        if isinstance(first_stat, dict):
                            if 'value' in first_stat:
                                value = first_stat['value']
                                stat_type = 'stats_list'
                            elif 'displayValue' in first_stat:
                                value = first_stat['displayValue']
                                stat_type = 'stats_list_display'
                
                # If no value found, try displayValue
                if value is None and 'displayValue' in stat:
                    value = stat['displayValue']
                    stat_type = 'display'
                
                self.logger.debug(f"Processing stat {stat_name}: value={value} type={stat_type}")
                
                # Handle nested dictionary values
                if isinstance(value, dict):
                    # Look for numeric values in the dictionary
                    nested_value = None
                    for key in ['value', 'displayValue', 'number', 'raw', 'stat']:
                        if key in value:
                            nested_val = value[key]
                            if isinstance(nested_val, (int, float, str)):
                                nested_value = nested_val
                                stat_type = f'nested_{key}'
                                break
                    
                    if nested_value is not None:
                        value = nested_value
                    else:
                        self.logger.debug(f"Could not extract value from nested dict for {stat_name}: {value}")
                        continue
                
                # Convert value to float
                if value is not None:
                    if isinstance(value, (int, float)):
                        processed_stats[stat_name] = float(value)
                    elif isinstance(value, str):
                        try:
                            if '%' in value:
                                # Handle percentage values
                                processed_stats[stat_name] = float(value.strip('%')) / 100
                            else:
                                # Handle other numeric strings, preserving negative signs
                                clean_value = ''.join(c for c in value if c.isdigit() or c in '.-')
                                if clean_value:
                                    processed_stats[stat_name] = float(clean_value)
                                else:
                                    self.logger.debug(f"No numeric content in string value for {stat_name}: {value}")
                        except ValueError as e:
                            self.logger.debug(f"Could not convert string value for {stat_name}: {value}, {str(e)}")
                            continue
                    else:
                        self.logger.debug(f"Unexpected value type for {stat_name}: {type(value)}")
                else:
                    self.logger.debug(f"No value found for {stat_name}")

            except Exception as e:
                self.logger.debug(f"Error processing stat {stat_name}: {str(e)}")
                continue
        
        return processed_stats
        
    def _calculate_recent_performance(self, games: List[Dict]) -> Dict[str, float]:
        """Calculate recent performance metrics from game data."""
        total_games = len(games)
        if total_games == 0:
            return {}
            
        wins = 0
        runs_scored = 0
        runs_allowed = 0
        
        for game in games:
            if game.get('competitions'):
                comp = game['competitions'][0]
                for team in comp.get('competitors', []):
                    if team.get('winner'):
                        wins += 1
                    runs_scored += int(team.get('score', 0))
                    # The other team's score is runs allowed
                    for other in comp.get('competitors', []):
                        if other['id'] != team['id']:
                            runs_allowed += int(other.get('score', 0))
        
        return {
            'recent_win_pct': wins / total_games,
            'recent_runs_per_game': runs_scored / total_games,
            'recent_runs_allowed': runs_allowed / total_games
        }
        
    def get_player_stats(self, player_id: str = None, team: str = None) -> pd.DataFrame:
        """
        Fetch player statistics from ESPN.
        
        Args:
            player_id (str, optional): ESPN player ID
            team (str, optional): Team abbreviation to get all players' stats
            
        Returns:
            pd.DataFrame: Player statistics
        """
        try:
            if player_id:
                # Get individual player stats
                response = requests.get(f"{self.ESPN_PLAYER_ENDPOINT}/{player_id}")
                response.raise_for_status()
                data = response.json()
                
                if not isinstance(data, dict):
                    raise ValueError(f"Unexpected player data format for ID {player_id}")
                
                player_data = {
                    'id': player_id,
                    'name': data.get('fullName', ''),
                    'position': data.get('position', {}).get('abbreviation', ''),
                    'team': data.get('team', {}).get('abbreviation', ''),
                }
                
                # Process statistics
                statistics = data.get('statistics', [])
                if statistics:
                    for stat_group in statistics:
                        for stat in stat_group.get('stats', []):
                            name = stat.get('name', '').lower().replace(' ', '_')
                            value = stat.get('value')
                            if name and value is not None:
                                try:
                                    player_data[name] = float(value)
                                except (ValueError, TypeError):
                                    continue
                
                return pd.DataFrame([player_data])
                
            elif team:
                # Get team roster with stats
                response = requests.get(
                    f"{self.ESPN_TEAM_ENDPOINT}/{team}/roster"
                )
                response.raise_for_status()
                data = response.json()
                
                if not isinstance(data, dict):
                    raise ValueError(f"Unexpected roster data format for team {team}")
                
                players = []
                for athlete in data.get('athletes', []):
                    player_data = {
                        'id': str(athlete['id']) if isinstance(athlete, dict) and 'id' in athlete else '',
                        'name': athlete['fullName'] if isinstance(athlete, dict) and 'fullName' in athlete else '',
                        'position': (athlete.get('position', {}).get('abbreviation', '') 
                                   if isinstance(athlete, dict) and isinstance(athlete.get('position'), dict) 
                                   else ''),
                        'team': team
                    }
                    
                    # Process statistics
                    if isinstance(athlete, dict):
                        statistics = athlete.get('statistics', [])
                        if isinstance(statistics, list):
                            for stat_group in statistics:
                                if isinstance(stat_group, dict):
                                    stats = stat_group.get('stats', [])
                                    if isinstance(stats, list):
                                        for stat in stats:
                                            if isinstance(stat, dict):
                                                name = str(stat.get('name', '')).lower().replace(' ', '_')
                                                value = stat.get('value')
                                                if name and value is not None:
                                                    try:
                                                        player_data[name] = float(value)
                                                    except (ValueError, TypeError):
                                                        continue
                    
                    players.append(player_data)
                
                return pd.DataFrame(players)
            
            else:
                raise ValueError("Either player_id or team must be provided")
                
        except Exception as e:
            self.logger.error(f"Error fetching player stats: {str(e)}")
            return pd.DataFrame()
            
    def _make_request(self, url: str, params: Optional[Dict] = None) -> Dict:
        """
        Make an HTTP request with retry logic and error handling.
        
        Args:
            url (str): The URL to request
            params (Dict, optional): Query parameters to include
            
        Returns:
            Dict: JSON response data
            
        Raises:
            requests.RequestException: If request fails after all retries
        """
        for attempt in range(self.max_retries):
            try:
                response = requests.get(url, params=params)
                response.raise_for_status()
                return response.json()
            except requests.RequestException as e:
                if attempt == self.max_retries - 1:  # Last attempt
                    self.logger.error(f"Failed to fetch data from {url} after {self.max_retries} attempts: {str(e)}")
                    raise
                self.logger.warning(f"Request failed (attempt {attempt + 1}/{self.max_retries}): {str(e)}")
                time.sleep(self.retry_delay * (attempt + 1))  # Exponential backoff
    
    def get_player_props(self, player_id: str = None, game_id: str = None, prop_types: List[str] = None) -> pd.DataFrame:
        """
        Fetch player proposition bets from the configured provider.
        
        Args:
            player_id (str, optional): ESPN player ID to get specific player's props
            game_id (str, optional): Game ID to get all player props for a game
            prop_types (List[str], optional): List of prop types to retrieve (e.g., ['STRIKEOUTS', 'HITS'])
            
        Returns:
            pd.DataFrame: DataFrame containing player props and their odds
        """
        cache_key = f"player_props_{player_id or game_id}"
        
        # Check cache
        if cache_key in self.cache:
            cache_entry = self.cache[cache_key]
            if datetime.now() - cache_entry['timestamp'] < self.cache_ttl['odds']:
                self.logger.debug("Returning cached props data")
                return cache_entry['data']
        
        try:
            props_list = []
            
            if self.odds_provider:
                # Get props from the configured provider
                if player_id:
                    data = self.odds_provider.get_player_props(player_id, game_id)
                elif game_id:
                    # For game props, we need to get each player's props
                    game_data = self.get_live_games()
                    if not game_data.empty:
                        game = game_data[game_data['game_id'] == game_id].iloc[0]
                        home_pitcher = game['pitchers']['home']
                        away_pitcher = game['pitchers']['away']
                        
                        # Get pitcher props
                        for pitcher in [home_pitcher, away_pitcher]:
                            player_data = self.get_player_stats(team=game[f"{pitcher}_team"])
                            if not player_data.empty:
                                pitcher_id = player_data[player_data['name'] == pitcher]['id'].iloc[0]
                                pitcher_props = self.odds_provider.get_player_props(pitcher_id, game_id)
                                if pitcher_props:
                                    props_list.append(pitcher_props)
                
                # Convert provider data to DataFrame format
                flattened_props = []
                for prop_data in props_list:
                    for prop in prop_data.get('props', []):
                        prop_name = prop.get('name', '').lower()
                        prop_type = next(
                            (k for k, v in self.PROP_TYPES.items() if v == prop_name),
                            'OTHER'
                        )
                        
                        if not prop_types or prop_type in prop_types:
                            flattened_prop = {
                                'player_id': prop_data.get('player_id'),
                                'player_name': prop_data.get('player_name'),
                                'game_id': prop_data.get('game_id'),
                                'prop_type': prop_type,
                                'prop_name': prop_name,
                                'line': prop.get('line'),
                                'over_odds': prop.get('over_odds'),
                                'under_odds': prop.get('under_odds'),
                                'timestamp': datetime.now().isoformat()
                            }
                            flattened_props.append(flattened_prop)
                
                df = pd.DataFrame(flattened_props)
            
            else:
                df = pd.DataFrame()  # Empty DataFrame if no provider configured
            
            # Cache the results if we have data
            if not df.empty:
                self.cache[cache_key] = {
                    'data': df,
                    'timestamp': datetime.now()
                }
            
            return df
            
        except Exception as e:
            self.logger.error(f"Error fetching player props: {str(e)}")
            return pd.DataFrame()
    
    def calculate_parlay_odds(self, odds_list: List[float], stake: float = 100.0) -> Dict[str, float]:
        """
        Calculate parlay odds and potential payout.
        
        Args:
            odds_list (List[float]): List of American odds for each leg of the parlay
            stake (float, optional): Amount being wagered. Defaults to 100.0
            
        Returns:
            Dict[str, float]: Dictionary containing combined odds and potential payout
        """
        try:
            # Convert American odds to decimal
            decimal_odds = []
            for odds in odds_list:
                if odds >= 0:
                    decimal = (odds / 100) + 1
                else:
                    decimal = (100 / abs(odds)) + 1
                decimal_odds.append(decimal)
            
            # Calculate combined decimal odds
            combined_decimal = 1
            for odds in decimal_odds:
                combined_decimal *= odds
            
            # Convert back to American odds
            if combined_decimal >= 2:
                combined_american = (combined_decimal - 1) * 100
            else:
                combined_american = -100 / (combined_decimal - 1)
            
            # Calculate potential payout
            potential_payout = stake * combined_decimal
            
            return {
                'decimal_odds': combined_decimal,
                'american_odds': combined_american,
                'potential_payout': potential_payout,
                'stake': stake
            }
            
        except Exception as e:
            self.logger.error(f"Error calculating parlay odds: {str(e)}")
            return {}
    
    def get_optimal_parlays(self, min_probability: float = 0.6, max_legs: int = 4) -> pd.DataFrame:
        """
        Generate statistically optimal parlay combinations across games and prop types.
        
        Args:
            min_probability (float): Minimum calculated probability for each leg (0-1)
            max_legs (int): Maximum number of legs in a parlay
            
        Returns:
            pd.DataFrame: DataFrame containing optimal parlay combinations with probabilities
        """
        try:
            # Get current games and odds
            games_df = self.get_live_games()
            if games_df.empty:
                return pd.DataFrame()
            
            optimal_parlays = []
            
            # Get all available props and odds for today's games
            all_props = {}
            all_odds = {}
            team_stats = {}
            pitcher_stats = {}
            
            for _, game in games_df.iterrows():
                game_id = game['game_id']
                
                # Get props for this game
                props_df = self.get_player_props(game_id=game_id)
                if not props_df.empty:
                    all_props[game_id] = props_df
                
                # Get odds for this game
                odds = self.get_live_odds()
                if not odds.empty:
                    all_odds[game_id] = odds[odds['game_id'] == game_id].iloc[0]
                
                # Get team stats
                home_stats = self.get_team_stats(game['home_team'])
                away_stats = self.get_team_stats(game['away_team'])
                if not home_stats.empty and not away_stats.empty:
                    team_stats[game_id] = {
                        'home': home_stats.iloc[0],
                        'away': away_stats.iloc[0]
                    }
                
                # Get pitcher stats if available
                pitchers = game['pitchers']
                if pitchers:
                    pitcher_stats[game_id] = {
                        'home': self.get_player_stats(team=game['home_team']),
                        'away': self.get_player_stats(team=game['away_team'])
                    }
            
            # Define parlay patterns with statistical analysis
            parlay_patterns = [
                # Same Game Parlays
                {
                    'type': 'pitcher_dominant',
                    'description': 'High K pitcher + Under + Team Win',
                    'conditions': ['pitcher_strikeouts', 'under', 'moneyline'],
                    'analysis': self._analyze_pitcher_dominance
                },
                {
                    'type': 'batter_hot_streak',
                    'description': 'Player hits + RBI + Team Over',
                    'conditions': ['batter_hits', 'runs_batted_in', 'over'],
                    'analysis': self._analyze_batter_performance
                },
                # Cross Game Parlays
                {
                    'type': 'favorites_parlay',
                    'description': 'Strong favorites across different games',
                    'conditions': ['moneyline'],
                    'analysis': self._analyze_favorite_teams
                },
                {
                    'type': 'starting_pitcher_props',
                    'description': 'Top pitchers strikeout props',
                    'conditions': ['pitcher_strikeouts'],
                    'analysis': self._analyze_pitcher_matchups
                }
            ]
            
            optimal_combinations = []
            
            # Analyze each pattern for optimal combinations
            for pattern in parlay_patterns:
                analysis_func = pattern['analysis']
                if pattern['type'].startswith('same_game'):
                    # Generate same-game parlays
                    for game_id, props in all_props.items():
                        if game_id in team_stats and game_id in all_odds:
                            game_analysis = analysis_func(
                                props,
                                team_stats[game_id],
                                pitcher_stats.get(game_id, {}),
                                all_odds[game_id]
                            )
                            if game_analysis['probability'] >= min_probability:
                                optimal_combinations.extend(game_analysis['combinations'])
                else:
                    # Generate cross-game parlays
                    cross_game_analysis = analysis_func(
                        all_props,
                        team_stats,
                        pitcher_stats,
                        all_odds
                    )
                    optimal_combinations.extend([
                        combo for combo in cross_game_analysis['combinations']
                        if combo['probability'] >= min_probability
                    ])
            
            # Sort combinations by probability and limit legs
            filtered_combos = [
                combo for combo in optimal_combinations
                if len(combo['legs']) <= max_legs
            ]
            filtered_combos.sort(key=lambda x: x['probability'], reverse=True)
            
            # Calculate parlay odds for each combination
            parlay_results = []
            for combo in filtered_combos:
                odds_list = [leg['odds'] for leg in combo['legs']]
                parlay_odds = self.calculate_parlay_odds(odds_list)
                
                if parlay_odds:
                    result = {
                        'parlay_type': combo['type'],
                        'description': combo['description'],
                        'probability': combo['probability'],
                        'legs': [f"{leg['type']}: {leg['description']}" for leg in combo['legs']],
                        'num_legs': len(combo['legs']),
                        **parlay_odds
                    }
                    parlay_results.append(result)
            
            return pd.DataFrame(parlay_results)
            
        except Exception as e:
            self.logger.error(f"Error generating optimal parlays: {str(e)}")
            return pd.DataFrame()
            
        except Exception as e:
            self.logger.error(f"Error getting popular prop parlays: {str(e)}")
            return pd.DataFrame()
    
    def _analyze_pitcher_dominance(self, props: pd.DataFrame, team_stats: Dict, pitcher_stats: Dict, odds: Dict) -> Dict:
        """Analyze pitcher performance for strikeout props and team win probability."""
        analysis = {
            'probability': 0.0,
            'combinations': []
        }
        
        try:
            # Get pitcher stats
            home_pitcher = pitcher_stats.get('home', pd.DataFrame())
            away_pitcher = pitcher_stats.get('away', pd.DataFrame())
            
            for side, pitcher_df in [('home', home_pitcher), ('away', away_pitcher)]:
                if pitcher_df.empty:
                    continue
                    
                # Analyze strikeout rate and recent performance
                pitcher_data = pitcher_df.iloc[0]
                if 'pitching_strikeouts_per_nine' in pitcher_data:
                    k_rate = pitcher_data['pitching_strikeouts_per_nine']
                    recent_performance = team_stats[side].get('recent_win_pct', 0.5)
                    
                    # Calculate probability based on multiple factors
                    k_prob = min(k_rate / 12.0, 0.8)  # Normalize K/9 to probability
                    team_prob = recent_performance
                    combined_prob = (k_prob * 0.7) + (team_prob * 0.3)
                    
                    if combined_prob >= 0.6:
                        combination = {
                            'type': 'pitcher_dominant',
                            'description': f"{pitcher_data['name']} Ks + Team Win",
                            'probability': combined_prob,
                            'legs': [
                                {
                                    'type': 'strikeouts',
                                    'description': f"{pitcher_data['name']} Over Ks",
                                    'odds': props.get('over_odds', -110)
                                },
                                {
                                    'type': 'moneyline',
                                    'description': f"{side.upper()} ML",
                                    'odds': odds[f'{side}_moneyline']
                                }
                            ]
                        }
                        analysis['combinations'].append(combination)
                        analysis['probability'] = max(analysis['probability'], combined_prob)
        
        except Exception as e:
            self.logger.error(f"Error in pitcher dominance analysis: {str(e)}")
        
        return analysis
    
    def _analyze_batter_performance(self, props: pd.DataFrame, team_stats: Dict, pitcher_stats: Dict, odds: Dict) -> Dict:
        """Analyze batter performance for hits and runs props."""
        analysis = {
            'probability': 0.0,
            'combinations': []
        }
        
        try:
            for team_side, team_data in team_stats.items():
                batting_avg = team_data.get('batting_avg', 0.0)
                runs_per_game = team_data.get('recent_runs_per_game', 0.0)
                
                # Calculate probabilities
                hits_prob = batting_avg * 1.2  # Adjust based on league average
                runs_prob = min(runs_per_game / 6.0, 0.8)  # Normalize runs to probability
                
                combined_prob = (hits_prob * 0.6) + (runs_prob * 0.4)
                
                if combined_prob >= 0.55:
                    combination = {
                        'type': 'batter_hot_streak',
                        'description': f"{team_side.upper()} Hits + Runs",
                        'probability': combined_prob,
                        'legs': [
                            {
                                'type': 'team_hits',
                                'description': f"{team_side.upper()} Team Total Hits",
                                'odds': odds.get('over_odds', -110)
                            },
                            {
                                'type': 'team_runs',
                                'description': f"{team_side.upper()} Team Total Runs",
                                'odds': odds.get('over_odds', -110)
                            }
                        ]
                    }
                    analysis['combinations'].append(combination)
                    analysis['probability'] = max(analysis['probability'], combined_prob)
        
        except Exception as e:
            self.logger.error(f"Error in batter performance analysis: {str(e)}")
        
        return analysis
    
    def _analyze_favorite_teams(self, all_props: Dict, team_stats: Dict, pitcher_stats: Dict, all_odds: Dict) -> Dict:
        """Analyze strong favorites across different games."""
        analysis = {
            'probability': 0.0,
            'combinations': []
        }
        
        try:
            strong_favorites = []
            
            for game_id, odds in all_odds.items():
                home_stats = team_stats[game_id]['home']
                away_stats = team_stats[game_id]['away']
                
                # Calculate win probability based on multiple factors
                for side in ['home', 'away']:
                    team_stats_data = home_stats if side == 'home' else away_stats
                    win_pct = team_stats_data.get('win_pct', 0.0)
                    recent_win_pct = team_stats_data.get('recent_win_pct', 0.0)
                    run_diff = team_stats_data.get('recent_runs_per_game', 0) - team_stats_data.get('recent_runs_allowed_per_game', 0)
                    
                    # Weight different factors
                    probability = (
                        (win_pct * 0.4) +
                        (recent_win_pct * 0.4) +
                        (min(max(0.3 + (run_diff / 10), 0), 0.8) * 0.2)
                    )
                    
                    if probability >= 0.6:
                        strong_favorites.append({
                            'game_id': game_id,
                            'team_side': side,
                            'probability': probability,
                            'odds': odds[f'{side}_moneyline']
                        })
            
            # Create combinations of strong favorites
            strong_favorites.sort(key=lambda x: x['probability'], reverse=True)
            for i in range(min(len(strong_favorites), 3)):
                fav = strong_favorites[i]
                combination = {
                    'type': 'strong_favorite',
                    'description': f"Strong Favorite ML - {fav['team_side'].upper()}",
                    'probability': fav['probability'],
                    'legs': [
                        {
                            'type': 'moneyline',
                            'description': f"{fav['team_side'].upper()} ML",
                            'odds': fav['odds']
                        }
                    ]
                }
                analysis['combinations'].append(combination)
                analysis['probability'] = max(analysis['probability'], fav['probability'])
        
        except Exception as e:
            self.logger.error(f"Error in favorite teams analysis: {str(e)}")
        
        return analysis
    
    def _analyze_pitcher_matchups(self, all_props: Dict, team_stats: Dict, pitcher_stats: Dict, all_odds: Dict) -> Dict:
        """Analyze pitcher matchups across games for strikeout props."""
        analysis = {
            'probability': 0.0,
            'combinations': []
        }
        
        try:
            good_matchups = []
            
            for game_id, pitchers in pitcher_stats.items():
                for side, pitcher_df in pitchers.items():
                    if pitcher_df.empty:
                        continue
                        
                    pitcher_data = pitcher_df.iloc[0]
                    
                    # Get opponent team's strikeout rate
                    opp_side = 'away' if side == 'home' else 'home'
                    opp_stats = team_stats[game_id][opp_side]
                    
                    if 'batting_strikeouts' in opp_stats:
                        k_rate = pitcher_data.get('pitching_strikeouts_per_nine', 0)
                        opp_k_rate = opp_stats['batting_strikeouts']
                        
                        # Calculate probability based on pitcher K rate and opponent K rate
                        matchup_prob = (
                            (k_rate / 12.0 * 0.6) +  # Normalize K/9 to probability
                            (opp_k_rate / 0.25 * 0.4)  # Normalize opponent K% to probability
                        )
                        
                        if matchup_prob >= 0.65:
                            good_matchups.append({
                                'game_id': game_id,
                                'pitcher_name': pitcher_data['name'],
                                'probability': matchup_prob,
                                'k_rate': k_rate,
                                'opp_k_rate': opp_k_rate
                            })
            
            # Create combinations of good strikeout matchups
            good_matchups.sort(key=lambda x: x['probability'], reverse=True)
            for matchup in good_matchups[:2]:  # Take top 2 matchups
                combination = {
                    'type': 'strikeout_matchup',
                    'description': f"{matchup['pitcher_name']} Strikeouts",
                    'probability': matchup['probability'],
                    'legs': [
                        {
                            'type': 'strikeouts',
                            'description': f"{matchup['pitcher_name']} Over Ks",
                            'odds': -110  # Default to standard odds if not available
                        }
                    ]
                }
                analysis['combinations'].append(combination)
                analysis['probability'] = max(analysis['probability'], matchup['probability'])
        
        except Exception as e:
            self.logger.error(f"Error in pitcher matchup analysis: {str(e)}")
        
        return analysis
    
    def _process_player_props(self, data: Dict, player_id: str) -> List[Dict]:
        """Process raw player props data into a list of dictionaries."""
        props_list = []
        
        try:
            player_name = data.get('playerName', 'Unknown')
            game_id = data.get('gameId', '')
            
            for prop in data.get('props', []):
                prop_type = prop.get('type', '').lower()
                if not prop_type:
                    continue
                
                prop_data = {
                    'player_id': player_id,
                    'player_name': player_name,
                    'game_id': game_id,
                    'prop_type': prop_type,
                    'market_name': prop.get('marketName', ''),
                    'line': prop.get('line'),
                    'over_odds': prop.get('overOdds'),
                    'under_odds': prop.get('underOdds'),
                    'last_update': datetime.now().isoformat()
                }
                props_list.append(prop_data)
                
        except Exception as e:
            self.logger.debug(f"Error processing props for player {player_id}: {str(e)}")
            
        return props_list
    
    def _process_player_stats(self, players: List[Dict]) -> pd.DataFrame:
        """Process ESPN API player stats data into a DataFrame."""
        stats_list = []
        
        for player in players:
            if not isinstance(player, dict):
                continue
                
            player_stats = {
                'player_id': player.get('id'),
                'name': player.get('displayName'),
                'position': player.get('position', {}).get('abbreviation'),
                'team': player.get('team', {}).get('abbreviation'),
                'age': player.get('age'),
                'jersey': player.get('jersey'),
                'last_updated': datetime.now().isoformat()
            }
            
            # Process statistics
            for stat_type in ['batting', 'pitching']:
                stats = player.get('statistics', {}).get(stat_type, {})
                if stats:
                    for stat in stats:
                        name = f"{stat_type}_{stat.get('name', '').lower().replace(' ', '_')}"
                        if 'displayValue' in stat:
                            try:
                                value = stat['displayValue']
                                if isinstance(value, str):
                                    if '%' in value:
                                        value = float(value.strip('%')) / 100
                                    else:
                                        value = float(''.join(c for c in value if c.isdigit() or c in '.-'))
                                player_stats[name] = float(value)
                            except (ValueError, TypeError):
                                continue
            
            stats_list.append(player_stats)
        
        return pd.DataFrame(stats_list)
