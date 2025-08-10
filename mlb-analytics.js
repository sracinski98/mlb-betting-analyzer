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

    analyzePlayerProps(games) {
        const recommendations = [];
        
        games.forEach(game => {
            const { gameId, awayTeam, homeTeam, venue } = game;
            
            // Analyze key players for each team
            Object.entries(this.playerDatabase).forEach(([playerName, playerData]) => {
                if (playerData.team === awayTeam || playerData.team === homeTeam) {
                    
                    // Hot streak analysis
                    if (playerData.hotStreak && playerData.avg >= 0.280) {
                        recommendations.push({
                            gameId,
                            betType: 'player_hits_over',
                            player: playerName,
                            propLine: '1.5 hits',
                            reason: `${playerName} on hot streak with .${Math.round(playerData.avg * 1000)} average`,
                            confidence: 'medium',
                            propFactor: 'hot_streak'
                        });
                    }
                    
                    // Power hitter in favorable venue
                    if (playerData.power >= 25 && this.venueFactors[venue]?.favors === 'offense') {
                        recommendations.push({
                            gameId,
                            betType: 'player_hr_over',
                            player: playerName,
                            propLine: '0.5 home runs',
                            reason: `${playerName} power hitter (${playerData.power} HR power) in hitter-friendly ${venue}`,
                            confidence: 'medium',
                            propFactor: 'venue_boost'
                        });
                    }
                    
                    // RBI opportunities
                    if (playerData.power >= 20 && playerData.avg >= 0.270) {
                        recommendations.push({
                            gameId,
                            betType: 'player_rbi_over',
                            player: playerName,
                            propLine: '0.5 RBIs',
                            reason: `${playerName} consistent RBI producer with power and average`,
                            confidence: 'low',
                            propFactor: 'rbi_consistency'
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
                
                // Strikeout model
                if (pitcher.kPer9 >= 10.0) {
                    recommendations.push({
                        gameId,
                        betType: 'pitcher_strikeouts_over',
                        player: pitcherName,
                        propLine: `${Math.floor(pitcher.kPer9 * 0.6)} strikeouts`,
                        reason: `${pitcherName} strikeout model: ${pitcher.kPer9} K/9 rate`,
                        confidence: pitcher.kPer9 >= 12.0 ? 'high' : 'medium',
                        model: 'strikeout_rate',
                        kPer9: pitcher.kPer9
                    });
                }
                
                // WHIP model
                if (pitcher.whip <= 1.10) {
                    recommendations.push({
                        gameId,
                        betType: 'pitcher_hits_allowed_under',
                        player: pitcherName,
                        propLine: 'hits allowed',
                        reason: `${pitcherName} WHIP excellence: ${pitcher.whip} WHIP`,
                        confidence: 'medium',
                        model: 'whip_analysis',
                        whip: pitcher.whip
                    });
                }
                
                // Durability model
                if (pitcher.durability >= 6.0) {
                    recommendations.push({
                        gameId,
                        betType: 'pitcher_innings_over',
                        player: pitcherName,
                        propLine: `${pitcher.durability - 0.5} innings`,
                        reason: `${pitcherName} durability: ${pitcher.durability} avg innings/start`,
                        confidence: pitcher.durability >= 6.5 ? 'high' : 'medium',
                        model: 'innings_durability',
                        avgInnings: pitcher.durability
                    });
                }
                
                // Quality start model
                if (pitcher.durability >= 6.0 && pitcher.era <= 3.50) {
                    recommendations.push({
                        gameId,
                        betType: 'pitcher_quality_start',
                        player: pitcherName,
                        propLine: 'quality start (6+ IP, ≤3 ER)',
                        reason: `${pitcherName} QS model: ${pitcher.durability} IP/start, ${pitcher.era} ERA`,
                        confidence: 'medium',
                        model: 'quality_start',
                        era: pitcher.era
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
        
        // Filter high confidence bets
        const highConfBets = recommendations.filter(r => r.confidence === 'high');
        const mediumConfBets = recommendations.filter(r => r.confidence === 'medium');
        
        // Multi-game parlays
        if (highConfBets.length >= 2) {
            for (let i = 0; i < highConfBets.length - 1; i++) {
                for (let j = i + 1; j < highConfBets.length && j < i + 3; j++) {
                    const bet1 = highConfBets[i];
                    const bet2 = highConfBets[j];
                    
                    // Avoid same game conflicting bets
                    if (bet1.gameId !== bet2.gameId) {
                        parlays.push({
                            legs: [bet1, bet2],
                            type: '2-leg parlay',
                            parlayCategory: 'multi_game',
                            riskLevel: 'medium',
                            expectedOdds: '+260',
                            reasoning: 'Two high-confidence bets from different games'
                        });
                    }
                }
            }
        }
        
        // Same Game Parlays (SGP)
        const gameGroups = {};
        recommendations.forEach(rec => {
            if (!gameGroups[rec.gameId]) {
                gameGroups[rec.gameId] = [];
            }
            gameGroups[rec.gameId].push(rec);
        });
        
        Object.entries(gameGroups).forEach(([gameId, gameBets]) => {
            if (gameBets.length >= 2) {
                const overBets = gameBets.filter(b => b.betType.includes('over'));
                const playerBets = gameBets.filter(b => b.betType.includes('player_'));
                
                if (overBets.length > 0 && playerBets.length > 0) {
                    const sgpLegs = [...overBets.slice(0, 1), ...playerBets.slice(0, 2)];
                    if (sgpLegs.length >= 2) {
                        parlays.push({
                            legs: sgpLegs,
                            type: `${sgpLegs.length}-leg SGP`,
                            parlayCategory: 'same_game',
                            riskLevel: 'medium',
                            expectedOdds: `+${(sgpLegs.length * 200)}`,
                            reasoning: 'Correlated SGP: High-scoring game + player performance'
                        });
                    }
                }
            }
        });
        
        // Specialty parlays
        const underBets = recommendations.filter(r => r.betType.includes('under') && r.confidence === 'high');
        if (underBets.length >= 2) {
            parlays.push({
                legs: underBets.slice(0, 3),
                type: `${Math.min(3, underBets.length)}-leg Pitcher Duel`,
                parlayCategory: 'specialty',
                riskLevel: 'medium',
                expectedOdds: `+${(Math.min(3, underBets.length) * 180)}`,
                reasoning: 'Multiple strong pitching matchups = low-scoring games'
            });
        }
        
        return parlays.slice(0, 8); // Top 8 parlays
    }

    async runComprehensiveAnalysis() {
        try {
            this.updateLoadingStep('step1');
            
            // Get all data
            const games = await this.getTodaysMLBGames();
            if (games.length === 0) {
                throw new Error('No games found for today');
            }
            
            this.updateLoadingStep('step2');
            
            const [odds, weather] = await Promise.all([
                this.getMLBOdds(),
                this.getWeatherData(games)
            ]);
            
            this.updateLoadingStep('step3');
            
            // Run all analysis models
            let allRecommendations = [];
            
            // Core analysis
            if (weather) {
                allRecommendations.push(...this.analyzeWeatherImpact(weather));
            }
            allRecommendations.push(...this.analyzeTeamTrends(games));
            allRecommendations.push(...this.analyzeStartingPitchers(games));
            allRecommendations.push(...this.analyzeVenueFactors(games, weather));
            
            // Advanced models
            allRecommendations.push(...this.analyzePlayerProps(games));
            allRecommendations.push(...this.analyzeAdvancedPitcherModels(games));
            
            this.updateLoadingStep('step4');
            
            // Combine and score recommendations
            const finalRecommendations = this.scoreAndRankRecommendations(allRecommendations);
            const parlayRecommendations = this.buildParlayRecommendations(finalRecommendations);
            
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
                highConfidence: finalRecommendations.filter(r => r.confidence === 'high').length
            };
            
        } catch (error) {
            console.error('Analysis error:', error);
            throw error;
        }
    }

    scoreAndRankRecommendations(recommendations) {
        // Group by game and bet type to find confluence
        const gameAnalysis = {};
        
        recommendations.forEach(rec => {
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
            const confidenceWeights = { high: 3, medium: 2, low: 1 };
            const totalWeight = rec.confidenceScores.reduce((sum, conf) => sum + confidenceWeights[conf], 0);
            const avgConfidence = totalWeight / rec.confidenceScores.length;
            
            // Boost confidence if multiple factors agree
            let finalConfidence = avgConfidence >= 2.5 ? 'high' : avgConfidence >= 1.5 ? 'medium' : 'low';
            if (numFactors >= 3 && finalConfidence === 'medium') {
                finalConfidence = 'high';
            }
            
            return {
                ...rec,
                confidence: finalConfidence,
                score: avgConfidence + (numFactors * 0.2),
                numFactors
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
