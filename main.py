from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import date
import pandas as pd
from Betting import MLBBettingAnalyzer

app = FastAPI(title="MLB Betting Analysis API")

# Initialize the analyzer (you'll need to implement DataCollector)
class DataCollector:
    def get_real_team_stats(self, games_df):
        # Implement real data collection
        return {}
    
    def get_starting_pitchers(self, games_df):
        # Implement pitcher data collection
        return {}
    
    def get_player_stats_for_props(self, games_df):
        # Implement player stats collection
        return {}
    
    def get_pitcher_props_data(self, games_df):
        # Implement pitcher props collection
        return {}
    
    def get_bullpen_analysis(self, games_df):
        # Implement bullpen analysis
        return {}

analyzer = MLBBettingAnalyzer(DataCollector())

class GameData(BaseModel):
    games: list
    weather: list = []

@app.get("/")
async def root():
    return {"message": "MLB Betting Analysis API"}

@app.post("/analyze/props")
async def analyze_props(data: GameData):
    try:
        # Convert games data to DataFrame
        games_df = pd.DataFrame(data.games)
        
        # Get prop recommendations
        props = analyzer.analyze_player_props(games_df)
        advanced_props = analyzer.analyze_advanced_prop_matchups(games_df)
        situational_props = analyzer.analyze_situational_props(games_df, data.weather)
        streak_props = analyzer.analyze_streak_props(games_df)
        
        return {
            "props": props,
            "advanced_props": advanced_props,
            "situational_props": situational_props,
            "streak_props": streak_props
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/weather")
async def analyze_weather(data: GameData):
    try:
        recommendations = analyzer.analyze_weather_impact(data.weather)
        return {"recommendations": recommendations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/trends")
async def analyze_trends(data: GameData):
    try:
        games_df = pd.DataFrame(data.games)
        recommendations = analyzer.analyze_team_trends(games_df)
        return {"recommendations": recommendations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/pitchers")
async def analyze_pitchers(data: GameData):
    try:
        games_df = pd.DataFrame(data.games)
        recommendations = analyzer.analyze_starting_pitchers(games_df)
        return {"recommendations": recommendations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
