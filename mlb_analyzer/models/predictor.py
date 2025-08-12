"""
ML pipeline module using AlphaPy for MLB betting predictions.
"""

from typing import Dict, List, Optional
import pandas as pd
import numpy as np
from alphapy.frame import Frame
from alphapy.model import Model, Predictions
from alphapy.system import System
import logging

class MLBPredictor:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.system = System()
        self.features = [
            'rolling_avg',          # Team's rolling batting average
            'rolling_era',          # Team's rolling ERA
            'home_away',           # Binary: 1 for home, 0 for away
            'rest_days',           # Days since last game
            'runs_scored_last_10', # Runs scored in last 10 games
            'runs_allowed_last_10' # Runs allowed in last 10 games
        ]
        
    def prepare_features(self, game_data: pd.DataFrame, team_stats: Dict[str, pd.DataFrame]) -> pd.DataFrame:
        """
        Prepare features for the ML model.
        
        Args:
            game_data: DataFrame with game information
            team_stats: Dict of team statistics DataFrames
            
        Returns:
            DataFrame with prepared features
        """
        features_df = pd.DataFrame()
        
        try:
            for idx, game in game_data.iterrows():
                home_team = game['home_team']
                away_team = game['away_team']
                
                # Get team stats
                home_stats = team_stats.get(home_team, pd.DataFrame())
                away_stats = team_stats.get(away_team, pd.DataFrame())
                
                if home_stats.empty or away_stats.empty:
                    continue
                
                # Create feature row
                feature_row = {
                    'home_rolling_avg': home_stats['rolling_avg'].iloc[-1],
                    'away_rolling_avg': away_stats['rolling_avg'].iloc[-1],
                    'home_rolling_era': home_stats['rolling_era'].iloc[-1],
                    'away_rolling_era': away_stats['rolling_era'].iloc[-1],
                    'home_away': 1,  # From home team perspective
                    'home_rest_days': self._calculate_rest_days(home_stats, game['date']),
                    'away_rest_days': self._calculate_rest_days(away_stats, game['date']),
                    'home_runs_scored_last_10': home_stats['runs_scored'].rolling(10).sum().iloc[-1],
                    'away_runs_scored_last_10': away_stats['runs_scored'].rolling(10).sum().iloc[-1],
                    'home_runs_allowed_last_10': home_stats['runs_allowed'].rolling(10).sum().iloc[-1],
                    'away_runs_allowed_last_10': away_stats['runs_allowed'].rolling(10).sum().iloc[-1],
                }
                
                features_df = pd.concat([features_df, pd.DataFrame([feature_row])])
                
        except Exception as e:
            self.logger.error(f"Error preparing features: {str(e)}")
            
        return features_df
    
    def train_model(self, features: pd.DataFrame, targets: pd.DataFrame) -> Model:
        """
        Train the ML model using AlphaPy.
        
        Args:
            features: DataFrame of prepared features
            targets: DataFrame of target values (game outcomes)
            
        Returns:
            Trained AlphaPy Model
        """
        try:
            # Create AlphaPy Frame
            frame = Frame(features, targets)
            
            # Configure model settings
            model = Model(self.system, frame)
            model.specs['algorithms'] = ['rf', 'xgb']  # Random Forest and XGBoost
            model.specs['cv_folds'] = 5
            model.specs['grid_search'] = True
            
            # Train model
            model.train()
            
            return model
            
        except Exception as e:
            self.logger.error(f"Error training model: {str(e)}")
            return None
            
    def predict(self, model: Model, features: pd.DataFrame) -> Predictions:
        """
        Make predictions using trained model.
        
        Args:
            model: Trained AlphaPy Model
            features: DataFrame of prepared features
            
        Returns:
            AlphaPy Predictions object
        """
        try:
            return model.predict(features)
        except Exception as e:
            self.logger.error(f"Error making predictions: {str(e)}")
            return None
            
    def _calculate_rest_days(self, team_stats: pd.DataFrame, game_date: str) -> int:
        """Calculate number of rest days before a game."""
        try:
            last_game_date = pd.to_datetime(team_stats.index[-1])
            game_date = pd.to_datetime(game_date)
            return (game_date - last_game_date).days
        except Exception:
            return 0
