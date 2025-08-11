/**
 * MLB Betting Analytics Engine - Client-Side Implementation
 * Comprehensive betting analysis with advanced models and real-time data
 */

class MLBAnalyticsEngine {
    constructor() {
        this.apiKeys = {
            odds: 'b1cc0151482fcdf0d3d970d1355b1323',
            weather: 'ced43351fe454b3d9a815907251008'
        };
        
        this.config = {
            mlbStatsUrl: 'https://statsapi.mlb.com/api/v1',
            oddsUrl: 'https://api.the-odds-api.com/v4',
            weatherUrl: 'https://api.weatherapi.com/v1'
        };
        
        this.cache = {
            games: null,
            odds: null,
            weather: null,
            lastUpdate: null
        };
        
        this.recommendations = [];
        this.currentFilters = {
            confidence: 'all',
            betType: 'all'
        };
        
        this.playerDatabase = this.initializePlayerDatabase();
        this.pitcherDatabase = this.initializePitcherDatabase();
        this.venueFactors = this.initializeVenueFactors();
        
        // Initialize Phase 1 components
        this.expertTrends = new ExpertTrendsAnalyzer();
        this.hardRockIntegration = new HardRockIntegration();
        this.betTracker = new BetTrackingSystem();
        
        // Enhanced analytics data
        this.enhancedData = {
            expertTrends: null,
            hardRockOdds: null,
            betPerformance: null,
            lastAnalysis: null
        };
    }

    initializePlayerDatabase() {
        return {
            'Mookie Betts': { team: 'LAD', position: 'OF', handedness: 'R', power: 25, avg: .280, hotStreak: true },
            'Fernando Tatis Jr.': { team: 'SD', position: 'SS', handedness: 'R', power: 30, avg: .285, hotStreak: false },
            'Ronald Acuna Jr.': { team: 'ATL', position: 'OF', handedness: 'R', power: 35, avg: .295, hotStreak: true },
            'Aaron Judge': { team: 'NYY', position: 'OF', handedness: 'R', power: 40, avg: .275, hotStreak: true },
            'Mike Trout': { team: 'LAA', position: 'OF', handedness: 'R', power: 35, avg: .290, hotStreak: false },
            'Juan Soto': { team: 'SD', position: 'OF', handedness: 'L', power: 30, avg: .300, hotStreak: true },
            'Vladimir Guerrero Jr.': { team: 'TOR', position: '1B', handedness: 'R', power: 32, avg: .285, hotStreak: false },
            'Francisco Lindor': { team: 'NYM', position: 'SS', handedness: 'S', power: 25, avg: .270, hotStreak: true },
            'Trea Turner': { team: 'PHI', position: 'SS', handedness: 'R', power: 20, avg: .295, hotStreak: true },
            'Freddie Freeman': { team: 'LAD', position: '1B', handedness: 'L', power: 22, avg: .305, hotStreak: false },
            'Bo Bichette': { team: 'TOR', position: 'SS', handedness: 'R', power: 18, avg: .275, hotStreak: false },
            'Pete Alonso': { team: 'NYM', position: '1B', handedness: 'R', power: 35, avg: .250, hotStreak: true },
            'Rafael Devers': { team: 'BOS', position: '3B', handedness: 'L', power: 28, avg: .285, hotStreak: false },
            'Yordan Alvarez': { team: 'HOU', position: 'DH', handedness: 'L', power: 38, avg: .290, hotStreak: true },
            'Kyle Schwarber': { team: 'PHI', position: 'OF', handedness: 'L', power: 30, avg: .235, hotStreak: false }
        };
    }

    initializePitcherDatabase() {
        return {
            'Gerrit Cole': { team: 'NYY', throws: 'R', tier: 'ace', era: 2.85, whip: 1.05, kPer9: 11.2, durability: 6.5 },
            'Shane Bieber': { team: 'CLE', throws: 'R', tier: 'ace', era: 2.95, whip: 1.00, kPer9: 12.5, durability: 6.2 },
            'Jacob deGrom': { team: 'TEX', throws: 'R', tier: 'ace', era: 2.52, whip: 0.95, kPer9: 13.8, durability: 5.8 },
            'Spencer Strider': { team: 'ATL', throws: 'R', tier: 'ace', era: 2.67, whip: 1.08, kPer9: 13.9, durability: 6.0 },
            'Walker Buehler': { team: 'LAD', throws: 'R', tier: 'tier1', era: 3.15, whip: 1.12, kPer9: 10.5, durability: 6.1 },
            'Dylan Cease': { team: 'SD', throws: 'R', tier: 'tier1', era: 3.28, whip: 1.18, kPer9: 11.8, durability: 5.9 },
            'Framber Valdez': { team: 'HOU', throws: 'L', tier: 'tier1', era: 3.45, whip: 1.25, kPer9: 8.9, durability: 6.3 },
            'Julio Urias': { team: 'LAD', throws: 'L', tier: 'tier1', era: 3.55, whip: 1.22, kPer9: 9.2, durability: 5.7 },
            'Carlos Rodon': { team: 'NYY', throws: 'L', tier: 'tier2', era: 3.75, whip: 1.28, kPer9: 10.1, durability: 5.5 },
            'Logan Webb': { team: 'SF', throws: 'R', tier: 'tier2', era: 3.65, whip: 1.20, kPer9: 8.8, durability: 6.0 }
        };
    }

    initializeVenueFactors() {
        return {
            'Coors Field': {
                altitude: 5280,
                runFactor: 1.25,
                hrFactor: 1.35,
                favors: 'offense',
                keyFactors: ['thin_air', 'large_foul_territory']
            },
            'Fenway Park': {
                greenMonster: 310,
                runFactor: 1.05,
                hrFactor: 0.95,
                favors: 'doubles',
                keyFactors: ['short_left_field', 'tall_wall']
            },
            'Yankee Stadium': {
                shortPorch: 314,
                runFactor: 1.10,
                hrFactor: 1.15,
                favors: 'righties',
                keyFactors: ['short_right_field', 'foul_territory']
            },
            'Petco Park': {
                dimensions: 'large',
                runFactor: 0.90,
                hrFactor: 0.85,
                favors: 'pitchers',
                keyFactors: ['marine_layer', 'spacious_foul']
            }
        };
    }

    // API Data Collection Methods
    async getTodaysMLBGames() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await fetch(`${this.config.mlbStatsUrl}/schedule?sportId=1&date=${today}&hydrate=team,linescore,weather,venue`, {
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.dates || data.dates.length === 0) {
                return [];
            }
            
            return data.dates[0].games.map(game => ({
                gameId: game.gamePk,
                awayTeam: game.teams.away.team.name,
                homeTeam: game.teams.home.team.name,
                venue: game.venue.name,
                startTime: game.gameDate,
                status: game.status.detailedState,
                weather: game.weather || null,
                awayProbablePitcher: game.teams.away.probablePitcher?.fullName || 'TBD',
                homeProbablePitcher: game.teams.home.probablePitcher?.fullName || 'TBD'
            }));
        } catch (error) {
            console.error('Error fetching MLB games:', error);
            return this.getMockGameData();
        }
    }

    async getMLBOdds() {
        try {
            const response = await fetch(`${this.config.oddsUrl}/sports/baseball_mlb/odds?apiKey=${this.apiKeys.odds}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`, {
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching odds:', error);
            return this.getMockOddsData();
        }
    }

    async getWeatherData(games) {
        const weatherPromises = games.map(async (game) => {
            try {
                // Extract city from venue name (simplified)
                const city = this.extractCityFromVenue(game.venue);
                const response = await fetch(`${this.config.weatherUrl}/current.json?key=${this.apiKeys.weather}&q=${city}&aqi=no`, {
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                return {
                    gameId: game.gameId,
                    venue: game.venue,
                    weather: {
                        temperature: data.current.temp_f,
                        condition: data.current.condition.text,
                        windSpeed: data.current.wind_mph,
                        windDirection: data.current.wind_dir,
                        humidity: data.current.humidity
                    }
                };
            } catch (error) {
                console.error(`Error fetching weather for ${game.venue}:`, error);
                return this.getMockWeatherForGame(game);
            }
        });
        
        return Promise.all(weatherPromises);
    }

    extractCityFromVenue(venue) {
        const venueToCity = {
            'Yankee Stadium': 'New York',
            'Fenway Park': 'Boston',
            'Coors Field': 'Denver',
            'Petco Park': 'San Diego',
            'Wrigley Field': 'Chicago',
            'Dodger Stadium': 'Los Angeles',
            'Oracle Park': 'San Francisco',
            'Minute Maid Park': 'Houston',
            'Progressive Field': 'Cleveland',
            'Comerica Park': 'Detroit'
        };
        
        return venueToCity[venue] || 'New York'; // Default fallback
    }

    // Analysis Methods
    analyzeWeatherImpact(weatherData) {
        const recommendations = [];
        
        weatherData.forEach(gameWeather => {
            const { gameId, weather } = gameWeather;
            
            // Temperature analysis
            if (weather.temperature >= 85) {
                recommendations.push({
                    gameId,
                    betType: 'over_total',
                    reason: `High temperature (${weather.temperature}°F) favors offense - balls carry further`,
                    confidence: 'medium',
                    weatherFactor: 'temperature_boost'
                });
            } else if (weather.temperature <= 55) {
                recommendations.push({
                    gameId,
                    betType: 'under_total',
                    reason: `Cold temperature (${weather.temperature}°F) reduces offensive production`,
                    confidence: 'medium',
                    weatherFactor: 'temperature_suppress'
                });
            }
            
            // Wind analysis
            if (weather.windSpeed >= 15) {
                if (weather.windDirection.includes('N') || weather.windDirection.includes('E')) {
                    recommendations.push({
                        gameId,
                        betType: 'under_total',
                        reason: `Strong wind (${weather.windSpeed} mph) blowing in reduces home runs`,
                        confidence: 'medium',
                        weatherFactor: 'wind_suppress'
                    });
                } else if (weather.windDirection.includes('S') || weather.windDirection.includes('W')) {
                    recommendations.push({
                        gameId,
                        betType: 'over_total',
                        reason: `Strong wind (${weather.windSpeed} mph) blowing out increases home runs`,
                        confidence: 'medium',
                        weatherFactor: 'wind_boost'
                    });
                }
            }
        });
        
        return recommendations;
    }

    analyzeTeamTrends(games) {
        const recommendations = [];
        
        // Simplified team strength analysis
        const strongOffenses = ['Los Angeles Dodgers', 'Atlanta Braves', 'Houston Astros', 'New York Yankees'];
        const weakOffenses = ['Miami Marlins', 'Oakland Athletics', 'Detroit Tigers', 'Chicago White Sox'];
        const strongPitching = ['Cleveland Guardians', 'Tampa Bay Rays', 'New York Mets', 'San Francisco Giants'];
        
        games.forEach(game => {
            const { gameId, awayTeam, homeTeam } = game;
            
            // Strong offense vs weak pitching
            if (strongOffenses.includes(awayTeam) && !strongPitching.includes(homeTeam)) {
                recommendations.push({
                    gameId,
                    betType: 'away_ml',
                    reason: `${awayTeam} strong offense vs ${homeTeam} average pitching`,
                    confidence: 'medium',
                    trendFactor: 'offense_vs_pitching'
                });
            }
            
            if (strongOffenses.includes(homeTeam) && !strongPitching.includes(awayTeam)) {
                recommendations.push({
                    gameId,
                    betType: 'home_ml',
                    reason: `${homeTeam} strong offense vs ${awayTeam} average pitching`,
                    confidence: 'medium',
                    trendFactor: 'offense_vs_pitching'
                });
            }
            
            // Both weak offenses = under
            if (weakOffenses.includes(awayTeam) && weakOffenses.includes(homeTeam)) {
                recommendations.push({
                    gameId,
                    betType: 'under_total',
                    reason: `Both teams have weak offenses - low-scoring game expected`,
                    confidence: 'high',
                    trendFactor: 'weak_offenses'
                });
            }
        });
        
        return recommendations;
    }

    analyzeStartingPitchers(games) {
        const recommendations = [];
        
        games.forEach(game => {
            const { gameId, awayProbablePitcher, homeProbablePitcher } = game;
            
            const awayPitcher = this.pitcherDatabase[awayProbablePitcher];
            const homePitcher = this.pitcherDatabase[homeProbablePitcher];
            
            // Ace vs average pitcher
            if (awayPitcher?.tier === 'ace' && (!homePitcher || homePitcher.tier !== 'ace')) {
                recommendations.push({
                    gameId,
                    betType: 'away_ml',
                    reason: `${awayProbablePitcher} (ace) significant advantage on mound`,
                    confidence: 'high',
                    pitcherFactor: 'ace_advantage'
                });
            }
            
            if (homePitcher?.tier === 'ace' && (!awayPitcher || awayPitcher.tier !== 'ace')) {
                recommendations.push({
                    gameId,
                    betType: 'home_ml',
                    reason: `${homeProbablePitcher} (ace) significant advantage on mound`,
                    confidence: 'high',
                    pitcherFactor: 'ace_advantage'
                });
            }
            
            // Both aces = under
            if (awayPitcher?.tier === 'ace' && homePitcher?.tier === 'ace') {
                recommendations.push({
                    gameId,
                    betType: 'under_total',
                    reason: `Pitcher's duel: ${awayProbablePitcher} vs ${homeProbablePitcher} - both aces`,
                    confidence: 'high',
                    pitcherFactor: 'ace_duel'
                });
            }
        });
        
        return recommendations;
    }

    // Helper function to convert numeric scores to confidence categories
    getConfidenceFromScore(score) {
        if (score >= 9.0) return 'elite';
        if (score >= 8.0) return 'very-high';
        if (score >= 7.0) return 'high';
        if (score >= 6.0) return 'medium-high';
        if (score >= 5.0) return 'medium';
        if (score >= 4.0) return 'medium-low';
        if (score >= 3.0) return 'low';
        return 'very-low';
    }

    analyzePlayerProps(games) {
        const recommendations = [];
        
        // Team name mapping (abbreviation to full name)
        const teamMapping = {
            'LAD': 'Los Angeles Dodgers', 'SD': 'San Diego Padres', 'ATL': 'Atlanta Braves',
            'NYY': 'New York Yankees', 'LAA': 'Los Angeles Angels', 'TOR': 'Toronto Blue Jays',
            'NYM': 'New York Mets', 'PHI': 'Philadelphia Phillies', 'BOS': 'Boston Red Sox',
            'HOU': 'Houston Astros', 'SF': 'San Francisco Giants', 'SEA': 'Seattle Mariners',
            'TB': 'Tampa Bay Rays', 'CLE': 'Cleveland Guardians', 'MIN': 'Minnesota Twins',
            'CHC': 'Chicago Cubs', 'STL': 'St. Louis Cardinals', 'MIL': 'Milwaukee Brewers',
            'CIN': 'Cincinnati Reds', 'PIT': 'Pittsburgh Pirates', 'ARI': 'Arizona Diamondbacks',
            'COL': 'Colorado Rockies', 'TEX': 'Texas Rangers', 'OAK': 'Oakland Athletics',
            'KC': 'Kansas City Royals', 'DET': 'Detroit Tigers', 'CWS': 'Chicago White Sox',
            'BAL': 'Baltimore Orioles', 'WSH': 'Washington Nationals', 'MIA': 'Miami Marlins'
        };
        
        games.forEach(game => {
            const { gameId, awayTeam, homeTeam, venue } = game;
            
            // Analyze key players for each team
            Object.entries(this.playerDatabase).forEach(([playerName, playerData]) => {
                const playerTeamName = teamMapping[playerData.team] || playerData.team;
                
                if (playerTeamName === awayTeam || playerTeamName === homeTeam) {
                    console.log(`🎯 Analyzing player: ${playerName} (${playerData.team} → ${playerTeamName})`);
                    
                    // Hot streak analysis (Enhanced scoring)
                    if (playerData.hotStreak && playerData.avg >= 0.280) {
                        const baseScore = 6.0;
                        const avgBonus = (playerData.avg - 0.280) * 10; // Bonus for higher average
                        const finalScore = Math.min(baseScore + avgBonus, 8.5);
                        
                        recommendations.push({
                            gameId,
                            betType: 'player_hits_over',
                            player: playerName,
                            propLine: '1.5 hits',
                            reason: `${playerName} on hot streak with .${Math.round(playerData.avg * 1000)} average`,
                            confidence: this.getConfidenceFromScore(finalScore),
                            propFactor: 'hot_streak',
                            rawScore: finalScore
                        });
                    }
                    
                    // Power hitter in favorable venue (Enhanced scoring)
                    if (playerData.power >= 25 && this.venueFactors[venue]?.favors === 'offense') {
                        const baseScore = 5.5;
                        const powerBonus = (playerData.power - 25) * 0.1; // Bonus for higher power
                        const venueBonus = 1.0; // Venue advantage
                        const finalScore = Math.min(baseScore + powerBonus + venueBonus, 8.0);
                        
                        recommendations.push({
                            gameId,
                            betType: 'player_hr_over',
                            player: playerName,
                            propLine: '0.5 home runs',
                            reason: `${playerName} power hitter (${playerData.power} HR power) in hitter-friendly ${venue}`,
                            confidence: this.getConfidenceFromScore(finalScore),
                            propFactor: 'venue_boost',
                            rawScore: finalScore
                        });
                    }
                    
                    // RBI opportunities (Enhanced scoring)
                    if (playerData.power >= 20 && playerData.avg >= 0.270) {
                        const baseScore = 4.0;
                        const powerBonus = (playerData.power - 20) * 0.08;
                        const avgBonus = (playerData.avg - 0.270) * 8;
                        const finalScore = Math.min(baseScore + powerBonus + avgBonus, 7.0);
                        
                        recommendations.push({
                            gameId,
                            betType: 'player_rbi_over',
                            player: playerName,
                            propLine: '0.5 RBIs',
                            reason: `${playerName} consistent RBI producer with power and average`,
                            confidence: this.getConfidenceFromScore(finalScore),
                            propFactor: 'rbi_consistency',
                            rawScore: finalScore
                        });
                    }
                }
            });
        });
        
        return recommendations;
    }

    analyzeAdvancedPitcherModels(games) {
        const recommendations = [];
        
        games.forEach(game => {
            const { gameId, awayProbablePitcher, homeProbablePitcher } = game;
            
            [awayProbablePitcher, homeProbablePitcher].forEach(pitcherName => {
                const pitcher = this.pitcherDatabase[pitcherName];
                if (!pitcher) return;
                
                // Strikeout model (Enhanced scoring)
                if (pitcher.kPer9 >= 10.0) {
                    const baseScore = 6.0;
                    const kBonus = (pitcher.kPer9 - 10.0) * 0.3; // Bonus for higher K rate
                    const finalScore = Math.min(baseScore + kBonus, 9.0);
                    
                    recommendations.push({
                        gameId,
                        betType: 'pitcher_strikeouts_over',
                        player: pitcherName,
                        propLine: `${Math.floor(pitcher.kPer9 * 0.6)} strikeouts`,
                        reason: `${pitcherName} strikeout model: ${pitcher.kPer9} K/9 rate`,
                        confidence: this.getConfidenceFromScore(finalScore),
                        model: 'strikeout_rate',
                        kPer9: pitcher.kPer9,
                        rawScore: finalScore
                    });
                }
                
                // WHIP model (Enhanced scoring)
                if (pitcher.whip <= 1.10) {
                    const baseScore = 5.5;
                    const whipBonus = (1.10 - pitcher.whip) * 5; // Bonus for lower WHIP
                    const finalScore = Math.min(baseScore + whipBonus, 8.0);
                    
                    recommendations.push({
                        gameId,
                        betType: 'pitcher_hits_allowed_under',
                        player: pitcherName,
                        propLine: 'hits allowed',
                        reason: `${pitcherName} WHIP excellence: ${pitcher.whip} WHIP`,
                        confidence: this.getConfidenceFromScore(finalScore),
                        model: 'whip_analysis',
                        rawScore: finalScore,
                        whip: pitcher.whip
                    });
                }
                
                // Durability model (Enhanced scoring)
                if (pitcher.durability >= 6.0) {
                    const baseScore = 5.5;
                    const durabilityBonus = (pitcher.durability - 6.0) * 0.4;
                    const finalScore = Math.min(baseScore + durabilityBonus, 8.5);
                    
                    recommendations.push({
                        gameId,
                        betType: 'pitcher_innings_over',
                        player: pitcherName,
                        propLine: `${pitcher.durability - 0.5} innings`,
                        reason: `${pitcherName} durability: ${pitcher.durability} avg innings/start`,
                        confidence: this.getConfidenceFromScore(finalScore),
                        model: 'innings_durability',
                        avgInnings: pitcher.durability,
                        rawScore: finalScore
                    });
                }
                
                // Quality start model (Enhanced scoring)
                if (pitcher.durability >= 6.0 && pitcher.era <= 3.50) {
                    const baseScore = 6.0;
                    const eraBonus = (3.50 - pitcher.era) * 0.8;
                    const durabilityBonus = (pitcher.durability - 6.0) * 0.3;
                    const finalScore = Math.min(baseScore + eraBonus + durabilityBonus, 8.5);
                    
                    recommendations.push({
                        gameId,
                        betType: 'pitcher_quality_start',
                        player: pitcherName,
                        propLine: 'quality start (6+ IP, ≤3 ER)',
                        reason: `${pitcherName} QS model: ${pitcher.durability} IP/start, ${pitcher.era} ERA`,
                        confidence: this.getConfidenceFromScore(finalScore),
                        model: 'quality_start',
                        era: pitcher.era,
                        rawScore: finalScore
                    });
                }
            });
        });
        
        return recommendations;
    }

    analyzeVenueFactors(games, weatherData) {
        const recommendations = [];
        
        games.forEach(game => {
            const { gameId, venue } = game;
            const venueData = this.venueFactors[venue];
            
            if (!venueData) return;
            
            // Coors Field special analysis
            if (venue === 'Coors Field') {
                recommendations.push({
                    gameId,
                    betType: 'over_total',
                    reason: `Coors Field altitude (${venueData.altitude} ft) increases offensive production`,
                    confidence: 'high',
                    venueFactor: 'altitude_boost'
                });
                
                recommendations.push({
                    gameId,
                    betType: 'team_total_hits_over',
                    reason: `Coors Field: Thin air increases hit distance and carry`,
                    confidence: 'medium',
                    venueFactor: 'altitude_boost'
                });
            }
            
            // Pitcher-friendly parks
            if (venueData.favors === 'pitchers') {
                recommendations.push({
                    gameId,
                    betType: 'under_total',
                    reason: `${venue} is pitcher-friendly ballpark`,
                    confidence: 'medium',
                    venueFactor: 'pitcher_park'
                });
            }
            
            // Short porch advantages
            if (venueData.favors === 'righties' && venueData.keyFactors?.includes('short_right_field')) {
                recommendations.push({
                    gameId,
                    betType: 'right_handed_hr_props',
                    reason: `${venue}: Short right field favors right-handed power`,
                    confidence: 'medium',
                    venueFactor: 'short_porch'
                });
            }
        });
        
        return recommendations;
    }

    buildParlayRecommendations(recommendations) {
        const parlays = [];
        
        // Filter by confidence levels (updated for 10-point scale)
        const highConfBets = recommendations.filter(r => 
            ['elite', 'very-high', 'high'].includes(r.confidence)
        );
        const mediumConfBets = recommendations.filter(r => 
            ['medium-high', 'medium'].includes(r.confidence)
        );
        const allQualityBets = recommendations.filter(r => 
            (r.score && r.score >= 4.5) || r.finalScore >= 4.5 // Lower threshold for more parlays
        );
        
        console.log(`Parlay Generation: ${highConfBets.length} high-conf, ${mediumConfBets.length} medium-conf, ${allQualityBets.length} total quality bets`);
        
        // FALLBACK: If not enough quality bets, lower the threshold progressively
        let workingBets = allQualityBets;
        if (workingBets.length < 4) {
            workingBets = recommendations.filter(r => (r.score && r.score >= 4.0) || r.finalScore >= 4.0);
            console.log(`Lowered threshold: ${workingBets.length} bets with score >= 4.0`);
        }
        if (workingBets.length < 4) {
            workingBets = recommendations.filter(r => (r.score && r.score >= 3.0) || r.finalScore >= 3.0);
            console.log(`Lowered threshold again: ${workingBets.length} bets with score >= 3.0`);
        }
        
        // EMERGENCY FALLBACK: Always ensure we have some bets to work with
        if (workingBets.length < 2) {
            workingBets = recommendations.slice(0, 8); // Take top 8 regardless of score
            console.log(`Emergency fallback: Using top ${workingBets.length} recommendations`);
        }
        
        // Multi-game parlays (Enhanced)
        if (workingBets.length >= 2) {
            for (let i = 0; i < Math.min(workingBets.length - 1, 10); i++) {
                for (let j = i + 1; j < Math.min(workingBets.length, i + 5); j++) {
                    const bet1 = workingBets[i];
                    const bet2 = workingBets[j];
                    
                    // Avoid same game conflicting bets
                    if (bet1.gameId !== bet2.gameId) {
                        const score1 = bet1.score || bet1.finalScore || 5.0;
                        const score2 = bet2.score || bet2.finalScore || 5.0;
                        const avgScore = (score1 + score2) / 2;
                        
                        parlays.push({
                            legs: [bet1, bet2],
                            type: '2-leg parlay',
                            parlayCategory: 'multi_game',
                            riskLevel: avgScore >= 7.0 ? 'low' : avgScore >= 5.5 ? 'medium' : 'high',
                            expectedOdds: '+260',
                            reasoning: `Two quality bets (avg score: ${avgScore.toFixed(1)}/10) from different games`,
                            avgScore: avgScore,
                            score: avgScore, // Ensure score property is set
                            confidence: avgScore >= 7.0 ? 'high' : avgScore >= 5.5 ? 'medium' : 'low'
                        });
                    }
                }
            }
        }
        
        // Enhanced Same Game Parlays (SGP)
        const gameGroups = {};
        workingBets.forEach(rec => {
            if (!gameGroups[rec.gameId]) {
                gameGroups[rec.gameId] = [];
            }
            gameGroups[rec.gameId].push(rec);
        });
        
        Object.entries(gameGroups).forEach(([gameId, gameBets]) => {
            if (gameBets.length >= 2) {
                const overBets = gameBets.filter(b => b.betType.includes('over'));
                const playerBets = gameBets.filter(b => b.betType.includes('player_'));
                const mlBets = gameBets.filter(b => b.betType.includes('_ml'));
                
                // SGP Strategy 1: Over + Player Props
                if (overBets.length > 0 && playerBets.length > 0) {
                    const sgpLegs = [...overBets.slice(0, 1), ...playerBets.slice(0, 2)];
                    const avgScore = sgpLegs.reduce((sum, leg) => sum + leg.score, 0) / sgpLegs.length;
                    
                    parlays.push({
                        legs: sgpLegs,
                        type: `${sgpLegs.length}-leg SGP`,
                        parlayCategory: 'same_game',
                        riskLevel: avgScore >= 7.0 ? 'low' : 'medium',
                        expectedOdds: `+${(sgpLegs.length * 200)}`,
                        reasoning: `Correlated SGP: High-scoring game + player performance (avg: ${avgScore.toFixed(1)}/10)`,
                        avgScore: avgScore
                    });
                }
                
                // SGP Strategy 2: ML + Player Props
                if (mlBets.length > 0 && playerBets.length > 0) {
                    const sgpLegs = [...mlBets.slice(0, 1), ...playerBets.slice(0, 2)];
                    const avgScore = sgpLegs.reduce((sum, leg) => sum + leg.score, 0) / sgpLegs.length;
                    
                    parlays.push({
                        legs: sgpLegs,
                        type: `${sgpLegs.length}-leg Team SGP`,
                        parlayCategory: 'same_game',
                        riskLevel: 'high',
                        expectedOdds: `+${(sgpLegs.length * 250)}`,
                        reasoning: `Team win + player performance SGP (avg: ${avgScore.toFixed(1)}/10)`,
                        avgScore: avgScore
                    });
                }
            }
        });
        
        // Enhanced Specialty parlays
        const underBets = workingBets.filter(r => r.betType.includes('under') && r.score >= 5.0);
        const overBets = workingBets.filter(r => r.betType.includes('over') && r.score >= 5.0);
        
        if (underBets.length >= 2) {
            const avgScore = underBets.slice(0, 3).reduce((sum, bet) => sum + bet.score, 0) / Math.min(3, underBets.length);
            parlays.push({
                legs: underBets.slice(0, 3),
                type: `${Math.min(3, underBets.length)}-leg Pitcher Duel`,
                parlayCategory: 'specialty',
                riskLevel: avgScore >= 7.0 ? 'low' : 'medium',
                expectedOdds: `+${(Math.min(3, underBets.length) * 180)}`,
                reasoning: `Multiple strong pitching matchups = low-scoring games (avg: ${avgScore.toFixed(1)}/10)`,
                avgScore: avgScore
            });
        }
        
        // Slugfest Parlay - Multiple overs
        if (overBets.length >= 2) {
            const avgScore = overBets.slice(0, 3).reduce((sum, bet) => sum + bet.score, 0) / Math.min(3, overBets.length);
            parlays.push({
                legs: overBets.slice(0, 3),
                type: `${Math.min(3, overBets.length)}-leg Slugfest`,
                parlayCategory: 'specialty',
                riskLevel: avgScore >= 7.0 ? 'low' : 'medium',
                expectedOdds: `+${(Math.min(3, overBets.length) * 200)}`,
                reasoning: `Multiple high-scoring setups = offensive explosion (avg: ${avgScore.toFixed(1)}/10)`,
                avgScore: avgScore
            });
        }
        
        // Favorites Parlay - ML favorites
        const mlFavorites = workingBets.filter(r => r.betType.includes('_ml') && r.score >= 5.0);
        if (mlFavorites.length >= 2) {
            const avgScore = mlFavorites.slice(0, 4).reduce((sum, bet) => sum + bet.score, 0) / Math.min(4, mlFavorites.length);
            parlays.push({
                legs: mlFavorites.slice(0, 4),
                type: `${Math.min(4, mlFavorites.length)}-leg Chalk Parlay`,
                parlayCategory: 'specialty',
                riskLevel: 'low',
                expectedOdds: `+${(Math.min(4, mlFavorites.length) * 120)}`,
                reasoning: `High-confidence favorites - safer parlay (avg: ${avgScore.toFixed(1)}/10)`,
                avgScore: avgScore
            });
        }
        
        // Sort parlays by average score (highest first)
        parlays.sort((a, b) => (b.avgScore || 0) - (a.avgScore || 0));
        
        // GUARANTEED PARLAY FALLBACK: If no parlays generated, create basic ones
        if (parlays.length === 0 && recommendations.length >= 2) {
            console.log('No parlays generated - creating fallback parlays');
            
            // Create basic 2-leg parlay from top 2 recommendations
            const topTwo = recommendations.slice(0, 2);
            parlays.push({
                legs: topTwo,
                type: '2-leg Basic Parlay',
                parlayCategory: 'multi_game',
                riskLevel: 'medium',
                expectedOdds: '+250',
                reasoning: `Best available picks combined (avg: ${(topTwo.reduce((sum, bet) => sum + bet.score, 0) / 2).toFixed(1)}/10)`,
                avgScore: topTwo.reduce((sum, bet) => sum + bet.score, 0) / 2
            });
            
            // Create 3-leg if we have enough
            if (recommendations.length >= 3) {
                const topThree = recommendations.slice(0, 3);
                parlays.push({
                    legs: topThree,
                    type: '3-leg Value Parlay',
                    parlayCategory: 'multi_game',
                    riskLevel: 'medium',
                    expectedOdds: '+400',
                    reasoning: `Top recommendations for solid value (avg: ${(topThree.reduce((sum, bet) => sum + bet.score, 0) / 3).toFixed(1)}/10)`,
                    avgScore: topThree.reduce((sum, bet) => sum + bet.score, 0) / 3
                });
            }
            
            console.log(`Generated ${parlays.length} fallback parlays`);
        }
        
        console.log(`Generated ${parlays.length} parlays total`);
        return parlays.slice(0, 12); // Top 12 parlays for more variety
    }

    async runComprehensiveAnalysis() {
        try {
            console.log("🚀 Starting Phase 1 enhanced comprehensive analysis...");
            this.updateLoadingStep('step1');
            
            // Get all data
            console.log("📊 Getting today's MLB games...");
            const games = await this.getTodaysMLBGames();
            console.log(`✅ Found ${games.length} games`);
            
            if (games.length === 0) {
                throw new Error('No games found for today');
            }
            
            this.updateLoadingStep('step2');
            
            console.log("📈 Getting enhanced data (odds, weather, expert trends, Hard Rock)...");
            const [odds, weather, expertTrends, hardRockOdds] = await Promise.all([
                this.getMLBOdds(),
                this.getWeatherData(games),
                this.expertTrends.analyzeTrends(games),
                this.hardRockIntegration.fetchLiveOdds(games)
            ]);
            
            // Store enhanced data for use throughout analysis
            this.enhancedData = {
                expertTrends: expertTrends,
                hardRockOdds: hardRockOdds,
                betPerformance: this.betTracker.getPerformanceAnalytics(),
                lastAnalysis: Date.now()
            };
            
            console.log(`✅ Enhanced data loaded - Odds: ${odds ? 'loaded' : 'none'}, Weather: ${weather ? weather.length : 0}, Expert trends: ${expertTrends ? 'loaded' : 'none'}, Hard Rock: ${hardRockOdds ? 'loaded' : 'none'}`);
            
            this.updateLoadingStep('step3');
            
            // Run all analysis models with enhanced data
            console.log("🧠 Running enhanced analysis models...");
            let allRecommendations = [];
            
            // Core analysis
            if (weather) {
                console.log("🌤️ Analyzing weather impact...");
                allRecommendations.push(...this.analyzeWeatherImpact(weather));
            }
            console.log("🏟️ Analyzing team trends...");
            allRecommendations.push(...this.analyzeTeamTrends(games));
            console.log("⚾ Analyzing starting pitchers...");
            allRecommendations.push(...this.analyzeStartingPitchers(games));
            console.log("🏟️ Analyzing venue factors...");
            allRecommendations.push(...this.analyzeVenueFactors(games, weather));
            
            // Advanced models
            console.log("🎯 Analyzing player props with enhanced data...");
            allRecommendations.push(...this.analyzePlayerProps(games));
            console.log("🎯 Running advanced pitcher models...");
            allRecommendations.push(...this.analyzeAdvancedPitcherModels(games));
            
            console.log(`📊 Generated ${allRecommendations.length} initial recommendations`);
            
            // Debug: Show first few recommendations
            if (allRecommendations.length > 0) {
                console.log('🔍 Sample recommendations:');
                allRecommendations.slice(0, 3).forEach((rec, i) => {
                    console.log(`${i+1}. ${rec.betType} - ${rec.confidence} - ${rec.reason}`);
                });
            }
            
            this.updateLoadingStep('step4');
            
            // Combine and score recommendations
            console.log("🎯 Scoring and ranking recommendations...");
            const finalRecommendations = this.scoreAndRankRecommendations(allRecommendations);
            console.log(`✅ Final recommendations: ${finalRecommendations.length}`);
            
            // Debug: Show breakdown by bet type
            const teamBets = finalRecommendations.filter(r => !r.betType.includes('player_'));
            const playerProps = finalRecommendations.filter(r => r.betType.includes('player_'));
            console.log(`📊 Team bets: ${teamBets.length}, Player props: ${playerProps.length}`);
            
            // Debug: Show confidence breakdown
            const confidenceBreakdown = {};
            finalRecommendations.forEach(r => {
                confidenceBreakdown[r.confidence] = (confidenceBreakdown[r.confidence] || 0) + 1;
            });
            console.log('🎯 Confidence breakdown:', confidenceBreakdown);
            
            console.log("🎰 Building parlay recommendations...");
            const parlayRecommendations = this.buildParlayRecommendations(finalRecommendations);
            console.log(`🎰 Generated ${parlayRecommendations.length} parlays`);
            
            // Cache results
            this.cache = {
                games,
                odds,
                weather,
                lastUpdate: new Date()
            };
            
            this.recommendations = finalRecommendations;
            
            return {
                games,
                recommendations: finalRecommendations,
                parlays: parlayRecommendations,
                weather,
                odds,
                totalOpportunities: finalRecommendations.length,
                highConfidence: finalRecommendations.filter(r => 
                    r.confidence === 'elite' || r.confidence === 'very-high'
                ).length
            };
            
        } catch (error) {
            console.error('❌ Analysis error:', error);
            console.error('❌ Error stack:', error.stack);
            throw new Error(`Analysis failed: ${error.message}`);
        }
    }

    scoreAndRankRecommendations(recommendations) {
        // ENHANCED: Convert any legacy confidence strings to scores and add Phase 1 enhancements
        const processedRecommendations = recommendations.map(rec => {
            if (rec.rawScore) {
                // Already has score, but enhance with new factors
                let enhancedScore = rec.rawScore;
                
                // Add expert trends adjustment
                if (this.enhancedData?.expertTrends) {
                    const expertAdjustment = this.expertTrends.getExpertAdjustment(
                        rec.gameId, this.enhancedData.expertTrends
                    );
                    enhancedScore += expertAdjustment;
                    if (expertAdjustment > 0) {
                        rec.expertTrends = true;
                        rec.expertBoost = expertAdjustment;
                    }
                }
                
                // Add Hard Rock odds adjustment
                if (this.enhancedData?.hardRockOdds) {
                    const oddsAdjustment = this.hardRockIntegration.getOddsAdjustment(
                        rec.gameId, rec, this.enhancedData.hardRockOdds
                    );
                    enhancedScore += oddsAdjustment;
                    if (oddsAdjustment > 0) {
                        rec.hardRockBoost = oddsAdjustment;
                        rec.hasValueBet = true;
                    }
                }
                
                // Historical performance adjustment from bet tracking
                if (this.enhancedData?.betPerformance) {
                    const performanceData = this.enhancedData.betPerformance.byBetType?.[rec.type];
                    if (performanceData && performanceData.roi > 10) {
                        enhancedScore += 0.3; // Boost for historically profitable bet types
                        rec.historicalBoost = 0.3;
                    } else if (performanceData && performanceData.roi < -10) {
                        enhancedScore -= 0.2; // Reduce for historically unprofitable bet types
                        rec.historicalPenalty = 0.2;
                    }
                }
                
                enhancedScore = Math.min(enhancedScore, 10.0);
                
                return {
                    ...rec,
                    rawScore: enhancedScore,
                    score: Math.round(enhancedScore * 10) / 10,
                };
            } else {
                // Convert legacy confidence to score
                let score = 5.0;
                switch(rec.confidence) {
                    case 'high': score = 7.0; break;
                    case 'medium': score = 5.5; break;
                    case 'low': score = 4.0; break;
                    default: score = 5.0;
                }
                
                // Add existing factor bonuses
                if (rec.weatherFactor === 'temperature_boost') score += 0.8;
                if (rec.weatherFactor === 'wind_boost') score += 0.7;
                if (rec.trendFactor === 'recent_performance') score += 0.5;
                if (rec.venueFactor === 'offense_friendly') score += 0.6;
                if (rec.pitcherFactor === 'elite_starter') score += 1.0;
                if (rec.propFactor === 'hot_streak') score += 0.9;
                
                // Add Phase 1 enhancements
                if (this.enhancedData?.expertTrends) {
                    const expertAdjustment = this.expertTrends.getExpertAdjustment(
                        rec.gameId, this.enhancedData.expertTrends
                    );
                    score += expertAdjustment;
                    if (expertAdjustment > 0) {
                        rec.expertTrends = true;
                        rec.expertBoost = expertAdjustment;
                    }
                }
                
                if (this.enhancedData?.hardRockOdds) {
                    const oddsAdjustment = this.hardRockIntegration.getOddsAdjustment(
                        rec.gameId, rec, this.enhancedData.hardRockOdds
                    );
                    score += oddsAdjustment;
                    if (oddsAdjustment > 0) {
                        rec.hardRockBoost = oddsAdjustment;
                        rec.hasValueBet = true;
                    }
                }
                
                if (this.enhancedData?.betPerformance) {
                    const performanceData = this.enhancedData.betPerformance.byBetType?.[rec.type];
                    if (performanceData && performanceData.roi > 10) {
                        score += 0.3;
                        rec.historicalBoost = 0.3;
                    } else if (performanceData && performanceData.roi < -10) {
                        score -= 0.2;
                        rec.historicalPenalty = 0.2;
                    }
                }
                
                score = Math.min(score, 10.0);
                
                return {
                    ...rec,
                    rawScore: score,
                    score: Math.round(score * 10) / 10,
                    confidence: this.getConfidenceFromScore(score)
                };
            }
        });
        
        // Group by game and bet type to find confluence
        const gameAnalysis = {};
        
        processedRecommendations.forEach(rec => {
            const key = `${rec.gameId}-${rec.betType}`;
            if (!gameAnalysis[key]) {
                gameAnalysis[key] = {
                    ...rec,
                    reasons: [rec.reason],
                    factors: [rec.weatherFactor || rec.trendFactor || rec.pitcherFactor || rec.propFactor || rec.venueFactor].filter(Boolean),
                    confidenceScores: [rec.confidence]
                };
            } else {
                gameAnalysis[key].reasons.push(rec.reason);
                gameAnalysis[key].factors.push(rec.weatherFactor || rec.trendFactor || rec.pitcherFactor || rec.propFactor || rec.venueFactor);
                gameAnalysis[key].confidenceScores.push(rec.confidence);
            }
        });
        
        // Calculate final scores
        const finalRecs = Object.values(gameAnalysis).map(rec => {
            const numFactors = rec.factors.filter(Boolean).length;
            
            // UPGRADED: 10-point confidence scoring system for more granular analysis
            // Updated confidence weights to handle both old and new confidence levels
            const confidenceWeights = { 
                // New 10-point system
                'elite': 10, 'very-high': 9, 'high': 8, 'medium-high': 7,
                'medium': 6, 'medium-low': 5, 'low': 4, 'very-low': 3,
                // Legacy system (fallback)
                'high': 8, 'medium': 6, 'low': 4
            };
            
            const totalWeight = rec.confidenceScores.reduce((sum, conf) => {
                return sum + (confidenceWeights[conf] || 5); // Default to 5 if unknown
            }, 0);
            const baseConfidence = totalWeight / rec.confidenceScores.length;
            
            // Enhanced scoring with factor bonus (more realistic distribution)
            let finalScore = baseConfidence + (numFactors * 0.4); // Reduced factor bonus for realistic distribution
            
            // CALIBRATED: More realistic confidence thresholds like dimers.com
            let finalConfidence, confidenceLabel, probabilityScore, edge;
            
            // Calculate probability and edge percentages
            probabilityScore = Math.min(Math.max((finalScore / 10) * 100, 35), 85); // 35-85% range
            edge = Math.min(Math.max((finalScore - 5) * 1.2, 0.5), 8.0); // 0.5-8% edge range
            
            // REALISTIC confidence distribution (stricter thresholds)
            if (finalScore >= 8.5 && edge >= 5.0) {
                finalConfidence = 'elite';
                confidenceLabel = 'ELITE';
            } else if (finalScore >= 7.8 && edge >= 4.0) {
                finalConfidence = 'very-high';
                confidenceLabel = 'VERY HIGH';
            } else if (finalScore >= 7.2 && edge >= 3.0) {
                finalConfidence = 'high';
                confidenceLabel = 'HIGH';
            } else if (finalScore >= 6.5 && edge >= 2.0) {
                finalConfidence = 'medium-high';
                confidenceLabel = 'MEDIUM-HIGH';
            } else if (finalScore >= 5.8) {
                finalConfidence = 'medium';
                confidenceLabel = 'MEDIUM';
            } else if (finalScore >= 5.0) {
                finalConfidence = 'medium-low';
                confidenceLabel = 'MEDIUM-LOW';
            } else if (finalScore >= 4.0) {
                finalConfidence = 'low';
                confidenceLabel = 'LOW';
            } else {
                finalConfidence = 'very-low';
                confidenceLabel = 'VERY LOW';
            }
            
            // Multi-factor bonus: Boost score when multiple models agree
            if (numFactors >= 4) {
                finalScore += 1.0; // Significant boost for 4+ factors
            } else if (numFactors >= 3) {
                finalScore += 0.5; // Moderate boost for 3+ factors
            }
            
            // Cap at 10.0 maximum
            finalScore = Math.min(finalScore, 10.0);
            
            return {
                ...rec,
                confidence: finalConfidence,
                confidenceLabel: confidenceLabel,
                probabilityScore: probabilityScore,
                edge: edge,
                finalScore: finalScore,
                confidenceLabel: confidenceLabel,
                score: Math.round(finalScore * 10) / 10, // Round to 1 decimal
                numFactors,
                rawScore: baseConfidence
            };
        });
        
        // Sort by score (highest first)
        return finalRecs.sort((a, b) => b.score - a.score);
    }

    updateLoadingStep(stepId) {
        const steps = document.querySelectorAll('.step');
        steps.forEach(step => step.classList.remove('active'));
        const currentStep = document.getElementById(stepId);
        if (currentStep) {
            currentStep.classList.add('active');
        }
    }

    // Mock data methods for fallback
    getMockGameData() {
        return [
            {
                gameId: 1,
                awayTeam: 'New York Yankees',
                homeTeam: 'Boston Red Sox',
                venue: 'Fenway Park',
                startTime: new Date().toISOString(),
                status: 'Scheduled',
                awayProbablePitcher: 'Gerrit Cole',
                homeProbablePitcher: 'Lucas Giolito'
            },
            {
                gameId: 2,
                awayTeam: 'Los Angeles Dodgers',
                homeTeam: 'San Francisco Giants',
                venue: 'Oracle Park',
                startTime: new Date().toISOString(),
                status: 'Scheduled',
                awayProbablePitcher: 'Walker Buehler',
                homeProbablePitcher: 'Logan Webb'
            },
            {
                gameId: 3,
                awayTeam: 'Atlanta Braves',
                homeTeam: 'Philadelphia Phillies',
                venue: 'Citizens Bank Park',
                startTime: new Date().toISOString(),
                status: 'Scheduled',
                awayProbablePitcher: 'Spencer Strider',
                homeProbablePitcher: 'Zack Wheeler'
            }
        ];
    }

    getMockOddsData() {
        return [
            {
                id: 'mock1',
                sport_key: 'baseball_mlb',
                sport_title: 'MLB',
                commence_time: new Date().toISOString(),
                home_team: 'Boston Red Sox',
                away_team: 'New York Yankees',
                bookmakers: [
                    {
                        key: 'draftkings',
                        title: 'DraftKings',
                        markets: [
                            {
                                key: 'h2h',
                                outcomes: [
                                    { name: 'New York Yankees', price: -150 },
                                    { name: 'Boston Red Sox', price: 130 }
                                ]
                            }
                        ]
                    }
                ]
            }
        ];
    }

    getMockWeatherForGame(game) {
        return {
            gameId: game.gameId,
            venue: game.venue,
            weather: {
                temperature: 75,
                condition: 'Clear',
                windSpeed: 8,
                windDirection: 'SW',
                humidity: 45
            }
        };
    }

    // Filter methods
    applyFilters() {
        const { confidence, betType } = this.currentFilters;
        
        return this.recommendations.filter(rec => {
            const confidenceMatch = confidence === 'all' || 
                                   (confidence === 'high' && rec.confidence === 'high') ||
                                   (confidence === 'medium' && ['high', 'medium'].includes(rec.confidence));
            
            const typeMatch = betType === 'all' ||
                             (betType === 'team' && !rec.betType.includes('player_')) ||
                             (betType === 'props' && rec.betType.includes('player_')) ||
                             (betType === 'parlays' && rec.parlayCategory);
            
            return confidenceMatch && typeMatch;
        });
    }

    // Export functionality
    exportResults() {
        const data = {
            timestamp: new Date().toISOString(),
            recommendations: this.recommendations,
            games: this.cache.games,
            summary: {
                totalOpportunities: this.recommendations.length,
                highConfidence: this.recommendations.filter(r => r.confidence === 'high').length,
                gamesAnalyzed: this.cache.games?.length || 0
            }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mlb-analysis-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Export for use in app.js
window.MLBAnalyticsEngine = MLBAnalyticsEngine;
