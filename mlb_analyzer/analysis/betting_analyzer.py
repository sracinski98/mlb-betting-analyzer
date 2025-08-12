"""
MLB betting analysis module combining pybaseball, sports-betting, and AlphaPy.
"""

from typing import Dict, List, Optional, Tuple
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging

from pybaseball import statcast, standings, schedule_and_record
from sports_betting import BookmakerOdds, BettingData, BettingModel
from sports_betting.bettors import KellyCriterionBettor
from alphapy.frame import Frame
from alphapy.model import Model
from alphapy.system import System

class MLBBettingAnalyzer:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.system = System()
        self.odds_scraper = BookmakerOdds()
        self.bettor = KellyCriterionBettor()
        
    def analyze_games(self, date: str) -> pd.DataFrame:
        """
        Analyze MLB games for a specific date.
        
        Args:
            date (str): Date in format 'YYYY-MM-DD'
            
        Returns:
            DataFrame with betting recommendations
        """
        try:
            # Get game data
            games_df = self._get_games(date)
            if games_df.empty:
                return pd.DataFrame()
                
            # Get odds data
            odds_df = self._get_odds(games_df)
            if odds_df.empty:
                return pd.DataFrame()
                
            # Prepare features
            features_df = self._prepare_features(games_df)
            
            # Get predictions
            predictions = self._predict(features_df)
            
            # Calculate betting edges
            recommendations = self._find_value_bets(predictions, odds_df)
            
            return recommendations
            
        except Exception as e:
            self.logger.error(f"Error analyzing games: {str(e)}")
            return pd.DataFrame()
            
    def _get_games(self, date: str) -> pd.DataFrame:
        """Get MLB games for the specified date."""
        try:
            game_date = datetime.strptime(date, "%Y-%m-%d")
            games = []
            
            # Get all team schedules for the date
            for team in standings().index.unique():
                try:
                    schedule = schedule_and_record(game_date.year, team)
                    game = schedule[schedule['Date'] == game_date.strftime("%A, %B %d")]
                    if not game.empty:
                        games.append(game)
                except Exception as e:
                    self.logger.warning(f"Error fetching schedule for {team}: {str(e)}")
                    continue
                    
            return pd.concat(games) if games else pd.DataFrame()
            
        except Exception as e:
            self.logger.error(f"Error getting games: {str(e)}")
            return pd.DataFrame()
            
    def _get_odds(self, games_df: pd.DataFrame) -> pd.DataFrame:
        """Get betting odds for the games."""
        try:
            odds_list = []
            for _, game in games_df.iterrows():
                home_team = game['Home']
                away_team = game['Away']
                
                # Use sports-betting library to get odds from multiple bookmakers
                odds = self.odds_scraper.get_odds(
                    sport='baseball',
                    league='mlb',
                    home_team=home_team,
                    away_team=away_team
                )
                odds_list.append(odds)
                
            return pd.concat(odds_list) if odds_list else pd.DataFrame()
            
        except Exception as e:
            self.logger.error(f"Error getting odds: {str(e)}")
            return pd.DataFrame()
            
    def _prepare_features(self, games_df: pd.DataFrame) -> pd.DataFrame:
        """Prepare features for ML model."""
        try:
            features = []
            for _, game in games_df.iterrows():
                home_team = game['Home']
                away_team = game['Away']
                
                # Get Statcast data for recent games
                end_date = datetime.strptime(game['Date'], "%A, %B %d")
                start_date = end_date - timedelta(days=30)
                
                home_stats = statcast(start_date.strftime("%Y-%m-%d"), 
                                    end_date.strftime("%Y-%m-%d"),
                                    team=home_team)
                away_stats = statcast(start_date.strftime("%Y-%m-%d"),
                                    end_date.strftime("%Y-%m-%d"),
                                    team=away_team)
                
                # Calculate advanced metrics using sports-betting
                home_features = BettingData.calculate_features(home_stats)
                away_features = BettingData.calculate_features(away_stats)
                
                # Combine features
                game_features = {
                    'game_id': f"{game['Date']}_{home_team}_{away_team}",
                    **home_features,
                    **{f"away_{k}": v for k, v in away_features.items()}
                }
                features.append(game_features)
                
            return pd.DataFrame(features)
            
        except Exception as e:
            self.logger.error(f"Error preparing features: {str(e)}")
            return pd.DataFrame()
            
    def _predict(self, features_df: pd.DataFrame) -> pd.DataFrame:
        """Make predictions using AlphaPy model."""
        try:
            # Create AlphaPy frame
            frame = Frame(features_df)
            
            # Configure and train model
            model = Model(self.system, frame)
            model.specs['algorithms'] = ['rf', 'xgb', 'lgb']  # Multiple algorithms
            model.specs['cv_folds'] = 5
            model.train()
            
            # Make predictions
            predictions = model.predict(features_df)
            
            return predictions
            
        except Exception as e:
            self.logger.error(f"Error making predictions: {str(e)}")
            return pd.DataFrame()
            
    def _find_value_bets(self, predictions: pd.DataFrame, odds_df: pd.DataFrame) -> pd.DataFrame:
        """Identify value betting opportunities."""
        try:
            # Calculate true probabilities from model predictions
            true_probs = predictions['probability']
            
            # Calculate implied probabilities from odds
            implied_probs = 1 / odds_df['decimal_odds']
            
            # Find value bets using Kelly Criterion
            recommendations = self.bettor.get_bets(
                true_probabilities=true_probs,
                implied_probabilities=implied_probs,
                odds=odds_df['decimal_odds']
            )
            
            return recommendations
            
        except Exception as e:
            self.logger.error(f"Error finding value bets: {str(e)}")
            return pd.DataFrame()
