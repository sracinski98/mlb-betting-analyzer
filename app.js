// Store chart instances globally
let confidenceChartInstance = null;
let distributionChartInstance = null;

// Button event handlers
function trackBet(bet) {
    console.log('Tracking bet:', bet);
    // Save the bet to local storage
    const trackedBets = JSON.parse(localStorage.getItem('trackedBets') || '[]');
    trackedBets.push({
        ...bet,
        trackingId: Date.now(),
        trackDate: new Date().toISOString()
    });
    localStorage.setItem('trackedBets', JSON.stringify(trackedBets));
    updateTrackingUI();
}

function updateTrackingUI() {
    const trackedBetsContainer = document.getElementById('trackedBets');
    if (!trackedBetsContainer) return;

    const trackedBets = JSON.parse(localStorage.getItem('trackedBets') || '[]');
    if (trackedBets.length === 0) {
        trackedBetsContainer.innerHTML = '<p>No bets tracked yet</p>';
        return;
    }

    trackedBetsContainer.innerHTML = `
        <div class="tracked-bets-grid">
            ${trackedBets.map(bet => `
                <div class="tracked-bet-card">
                    <h4>${bet.betType}</h4>
                    ${bet.player ? `<p>Player: ${bet.player}</p>` : ''}
                    ${bet.propLine ? `<p>Line: ${bet.propLine}</p>` : ''}
                    <p>Confidence: ${bet.confidence}</p>
                    <button class="remove-bet-btn" data-id="${bet.trackingId}">Remove</button>
                </div>
            `).join('')}
        </div>
    `;

    // Add event listeners for remove buttons
    trackedBetsContainer.querySelectorAll('.remove-bet-btn').forEach(btn => {
        btn.addEventListener('click', () => removeBet(btn.dataset.id));
    });
}

function removeBet(trackingId) {
    const trackedBets = JSON.parse(localStorage.getItem('trackedBets') || '[]');
    const updatedBets = trackedBets.filter(bet => bet.trackingId !== parseInt(trackingId));
    localStorage.setItem('trackedBets', JSON.stringify(updatedBets));
    updateTrackingUI();
}

function renderPropCards(props, category) {
    if (!Array.isArray(props)) {
        console.error('Props is not an array:', props);
        return '';
    }
    
    // Log incoming props for debugging
    console.log(`Rendering ${props.length} props for category ${category}`);
    
    // Deduplicate props based on betType and reason
    const uniqueProps = props.reduce((acc, prop) => {
        const key = `${prop.betType}-${prop.reason}`;
        if (!acc[key] || prop.score > acc[key].score) {
            acc[key] = prop;
        }
        return acc;
    }, {});

    return Object.values(uniqueProps).map(prop => {
        // Log each prop being rendered
        console.log('Rendering prop:', prop);
        
        return `
        <div class="prop-card ${category} ${prop.confidence ? prop.confidence.toLowerCase() : 'medium'}">
            <div class="prop-header">
                <div class="confidence-score">${prop.score?.toFixed(1) || '0.0'}/10</div>
                <div class="confidence-label">${prop.confidenceLabel || (prop.confidence ? prop.confidence.toUpperCase() : 'MEDIUM')}</div>
            </div>
            <div class="prop-content">
                <h4>${prop.player || formatBetType(prop.betType)}</h4>
                ${prop.propLine ? `<p class="prop-line">${prop.propLine}</p>` : ''}
                ${prop.odds ? `<p class="odds">Odds: ${prop.odds}</p>` : ''}
                <p class="reason">${prop.reason || 'No analysis available'}</p>
                ${prop.team ? `<p class="team">Team: ${prop.team}</p>` : ''}
                ${prop.matchup ? `<p class="matchup">${prop.matchup}</p>` : ''}
            </div>
            <button class="track-bet-btn" data-bet='${JSON.stringify(prop)}'>
                <i class="fas fa-plus"></i> Track Bet
            </button>
        </div>
    `}).join('');
}

function formatBetType(betType) {
    if (!betType) return 'Unknown Bet Type';
    return betType
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function filterPropsByCategory(category) {
    console.log('Filtering by category:', category);
    
    // Get all content sections
    const topPicksSection = document.getElementById('topPicks');
    const playerPropsSection = document.getElementById('playerProps');
    const parlaysSection = document.getElementById('parlaysList');
    
    // Log section visibility before change
    console.log('Section visibility before filter:', {
        topPicks: topPicksSection?.style.display,
        playerProps: playerPropsSection?.style.display,
        parlays: parlaysSection?.style.display,
        category: category
    });
    
    // Update active button state
    const buttons = document.querySelectorAll('.category-btn');
    buttons.forEach(btn => {
        if (btn.dataset.category === category) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Show/hide sections based on category
    switch (category) {
        case 'team':
            if (topPicksSection) topPicksSection.style.display = 'block';
            if (playerPropsSection) playerPropsSection.style.display = 'none';
            if (parlaysSection) parlaysSection.style.display = 'none';
            break;
        case 'props':
            if (topPicksSection) topPicksSection.style.display = 'none';
            if (playerPropsSection) playerPropsSection.style.display = 'block';
            if (parlaysSection) parlaysSection.style.display = 'none';
            break;
        case 'parlays':
            if (topPicksSection) topPicksSection.style.display = 'none';
            if (playerPropsSection) playerPropsSection.style.display = 'none';
            if (parlaysSection) parlaysSection.style.display = 'block';
            break;
        case 'all':
        default:
            if (topPicksSection) topPicksSection.style.display = 'block';
            if (playerPropsSection) playerPropsSection.style.display = 'block';
            if (parlaysSection) parlaysSection.style.display = 'block';
            break;
    }
    
    // If we're in the player props section, also handle sub-categories
    if (playerPropsSection && (category === 'props' || category === 'all')) {
        const sections = playerPropsSection.querySelectorAll('.prop-section');
        sections.forEach(section => {
            if (!section.classList.contains('empty')) {
                section.style.display = 'block';
            } else {
                section.style.display = 'none';
            }
        });
    }
}

function updateParlays(parlays) {
    console.log('Updating parlays with data:', parlays);
    
    const parlayContainer = document.getElementById('parlaysList');
    if (!parlayContainer) {
        console.error('Parlay container not found in the DOM: Make sure there is an element with id="parlaysList"');
        return;
    }
    console.log('Found parlay container:', parlayContainer);

    if (!Array.isArray(parlays)) {
        console.error('Parlays is not an array:', parlays);
        parlayContainer.innerHTML = '<div class="no-data">Invalid parlay data</div>';
        return;
    }

    // Group parlays by category
    const groupedParlays = parlays.reduce((acc, parlay) => {
        console.log('Processing parlay:', parlay);
        const category = parlay.parlayCategory || parlay.type || 'other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(parlay);
        return acc;
    }, {});

    parlayContainer.innerHTML = `
        <div class="parlay-sections">
            ${Object.entries(groupedParlays).map(([category, categoryParlays]) => `
                <div class="parlay-section">
                    <h3 class="section-title">${formatCategory(category)} (${categoryParlays.length})</h3>
                    <div class="parlay-grid">
                        ${categoryParlays.map(parlay => `
                            <div class="prop-card parlay ${parlay.riskLevel.toLowerCase()}">
                                <div class="prop-header">
                                    <div class="confidence-score">${parlay.avgScore?.toFixed(1) || '0.0'}/10</div>
                                    <div class="confidence-label">${parlay.riskLevel.toUpperCase()}</div>
                                    <div class="parlay-type-badge">${parlay.type}</div>
                                </div>
                                <div class="prop-content">
                                    <div class="parlay-summary">
                                        <p class="odds-line">Expected Odds: ${parlay.expectedOdds || 'N/A'}</p>
                                        <p class="parlay-legs-count">${parlay.legs.length}-leg parlay</p>
                                        <div class="bet-summary">
                                            ${parlay.legs.map(leg => `
                                                <div class="bet-line">
                                                    <strong>${leg.betType.toLowerCase().includes('under') ? 'Under' : 'Over'}</strong>
                                                    ${leg.total} ${leg.propType || ''} 
                                                    ${leg.player ? `(${leg.player})` : ''}
                                                    <span class="confidence-indicator ${leg.confidence?.toLowerCase()}">${leg.confidence?.toUpperCase()}</span>
                                                </div>
                                            `).join('')}
                                        </div>
                                        <p class="analysis">${parlay.reasoning || 'No analysis available'}</p>
                                    </div>
                                    <div class="parlay-legs">
                                        ${parlay.legs.map(leg => `
                                            <div class="parlay-leg ${leg.confidence ? leg.confidence.toLowerCase() : ''}">
                                                <div class="leg-header">
                                                    <span class="leg-type">${formatBetType(leg.betType)}</span>
                                                    ${leg.confidence ? `<span class="confidence-pill ${leg.confidence.toLowerCase()}">${leg.confidence.toUpperCase()}</span>` : ''}
                                                </div>
                                                ${leg.player ? `<p class="player-name">${leg.player}</p>` : ''}
                                                ${leg.total ? 
                                                    `<p class="prop-line highlight">
                                                        ${leg.betType.toLowerCase().includes('under') ? 'Under' : 'Over'} 
                                                        ${leg.total} 
                                                        ${leg.propType || ''}
                                                    </p>` : 
                                                    (leg.propLine ? `<p class="prop-line">${leg.propLine}</p>` : '')}
                                                <p class="leg-analysis">${leg.reason || 'No analysis available'}</p>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                                <button class="track-bet-btn" data-parlay='${JSON.stringify(parlay)}'>
                                    <i class="fas fa-plus"></i> Track Parlay
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    // Add event listeners for track buttons
    parlayContainer.querySelectorAll('.track-parlay-btn').forEach(btn => {
        btn.addEventListener('click', () => trackBet(JSON.parse(btn.dataset.parlay)));
    });
}

function formatCategory(category) {
    if (!category) return 'Other';
    return category
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function filterParlaysByType(type) {
    console.log('Filtering parlays by type:', type);
    
    const parlayContainer = document.getElementById('parlaysList');
    if (!parlayContainer) {
        console.error('Parlay container not found while filtering');
        return;
    }
    
    const parlayCards = parlayContainer.querySelectorAll('.parlay-card');
    parlayCards.forEach(card => {
        if (type === 'all') {
            card.style.display = 'block';
        } else {
            const parlayType = card.querySelector('.parlay-type')?.textContent?.toLowerCase();
            card.style.display = (parlayType === type.toLowerCase()) ? 'block' : 'none';
        }
    });
}

function updateConfidenceChart(data) {
    const ctx = document.getElementById('confidenceChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (confidenceChartInstance) {
        confidenceChartInstance.destroy();
    }
    
    // Create new chart
    confidenceChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Elite', 'Very High', 'High', 'Medium', 'Low'],
            datasets: [{
                label: 'Confidence Distribution',
                data: data,
                backgroundColor: [
                    '#4CAF50',
                    '#8BC34A',
                    '#CDDC39',
                    '#FFC107',
                    '#FF5722'
                ]
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function updateAnalytics(recommendations) {
    const confidenceData = [0, 0, 0, 0, 0]; // Elite, Very High, High, Medium, Low
    
    recommendations.forEach(rec => {
        switch(rec.confidence) {
            case 'elite': confidenceData[0]++; break;
            case 'very-high': confidenceData[1]++; break;
            case 'high': confidenceData[2]++; break;
            case 'medium': case 'medium-high': case 'medium-low': confidenceData[3]++; break;
            case 'low': case 'very-low': confidenceData[4]++; break;
        }
    });
    
    updateConfidenceChart(confidenceData);
}

function updateUI(result) {
    try {
        console.log("Starting UI update with result:", result);
        
        // Validate result structure
        if (!result || !result.recommendations || !result.parlays) {
            throw new Error('Invalid result structure');
        }
        
        console.log("Result contains:", {
            recommendations: result.recommendations.length,
            parlays: result.parlays.length,
            games: result.games?.length
        });
        
        // Sort recommendations by score
        const sortedRecommendations = [...result.recommendations].sort((a, b) => (b.score || 0) - (a.score || 0));
        
        // Update top picks section
        const topPicks = document.getElementById('topPicks');
        if (topPicks) {
            const topRecommendations = sortedRecommendations.slice(0, 5);
            console.log("Top picks to display:", topRecommendations);
            if (topRecommendations.length > 0) {
                topPicks.innerHTML = renderPropCards(topRecommendations, 'top-pick');
            } else {
                topPicks.innerHTML = '<div class="no-data">No top picks available</div>';
            }
        }
        
        // Update analytics with all recommendations
        console.log("Updating analytics with recommendations:", result.recommendations.length);
        if (result.recommendations.length > 0) {
            updateAnalytics(result.recommendations);
        }
        
        // Update parlays section
        console.log("Updating parlays with:", result.parlays);
        if (!Array.isArray(result.parlays)) {
            console.error("Parlays is not an array:", result.parlays);
            return;
        }
        console.log("Parlay details:", result.parlays.map(p => ({
            type: p.type,
            legs: p.legs?.length,
            category: p.parlayCategory
        })));
        
        const parlayContainer = document.getElementById('parlaysList');
        if (!parlayContainer) {
            console.error("Parlay container not found - Make sure there is an element with id='parlaysList'");
            return;
        }
        console.log("Found parlay container:", parlayContainer);
        
        if (result.parlays.length > 0) {
            updateParlays(result.parlays);
        } else {
            parlayContainer.innerHTML = '<div class="no-data">No parlay recommendations available</div>';
        }
        
//Update team bets section
console.log("Updating team bets with recommendations:", result.recommendations.length);
const teamBetsContainer = document.getElementById('teamBets');
if (teamBetsContainer) {
    const teamBets = result.recommendations.filter(rec => 
        !rec.player && (rec.betType?.toLowerCase().includes('ml') || 
        rec.betType?.toLowerCase().includes('total') || 
        rec.betType?.toLowerCase().includes('line'))
    );
    console.log("Team bets filtered:", teamBets.length);
    if (teamBets.length > 0) {
        teamBetsContainer.innerHTML = renderPropCards(teamBets, 'team-bet');
    } else {
        teamBetsContainer.innerHTML = '<div class="no-data">No team bets available</div>';
    }
}

//Update player props section
console.log("Updating player props with recommendations:", result.recommendations.length);
const propsContainer = document.getElementById('playerProps');
if (propsContainer) {
    const playerProps = result.recommendations.filter(rec => rec.player || rec.betType?.toLowerCase().includes('player'));
    console.log("Player props filtered:", playerProps.length);
    if (playerProps.length > 0) {
        updatePlayerProps(playerProps);
    } else {
        propsContainer.innerHTML = '<div class="no-data">No player props available</div>';
    }
}

// Remove duplicate parlay update section since it's handled above        // Update stats
        const totalOppElement = document.getElementById('totalOpportunities');
        if (totalOppElement) {
            totalOppElement.textContent = result.recommendations.length.toString();
        }
        
        const highConfElement = document.getElementById('highConfidence');
        if (highConfElement) {
            const highConfCount = result.recommendations.filter(r => 
                ['elite', 'very-high', 'high'].includes(r.confidence?.toLowerCase())
            ).length;
            highConfElement.textContent = highConfCount.toString();
        }
        
        // Show any games found
        if (result.games?.length > 0) {
            console.log("Games for today:", result.games.map(g => `${g.awayTeam} @ ${g.homeTeam}`));
        }
        
    } catch (error) {
        console.error('UI update error:', error);
        console.error('Error stack:', error.stack);
        alert('An error occurred while updating the UI. Check the console for details.');
        throw error;
    }
}

async function runAnalysis() {
    console.log("Starting analysis...");
    
    if (!window.MLBAnalyticsEngine) {
        console.error("MLBAnalyticsEngine not found!");
        alert("Error: Analytics engine not loaded properly. Please refresh the page and try again.");
        return;
    }
    
    try {
        // Create engine instance with error handling
        let engine;
        try {
            engine = new window.MLBAnalyticsEngine();
            console.log("Created MLBAnalyticsEngine instance:", engine);
        } catch (error) {
            console.error("Failed to create MLBAnalyticsEngine instance:", error);
            throw new Error("Failed to initialize analytics engine");
        }
        
        // Show loading state
        const analyzeButton = document.getElementById('analyzeBtn');
        const loadingContainer = document.getElementById('loadingContainer');
        
        if (analyzeButton) {
            analyzeButton.disabled = true;
            analyzeButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
        }
        
        if (loadingContainer) {
            loadingContainer.style.display = 'block';
        }
        
        console.log("Running comprehensive analysis...");
        let result;
        try {
            result = await engine.runComprehensiveAnalysis();
            console.log("Analysis complete, raw result:", result);
        } catch (error) {
            console.error("Failed during analysis:", error);
            throw new Error("Analysis failed: " + error.message);
        }
        
        // Validate result structure
        if (!result || !result.recommendations || !result.parlays) {
            console.error("Invalid result structure:", result);
            throw new Error("Analysis result is missing required data");
        }
        
        if (!result.games || result.games.length === 0) {
            console.warn("No games found for today");
        }
        
        // Log the data we're working with
        console.log("Analysis results:", {
            games: result.games?.length || 0,
            recommendations: result.recommendations.length,
            parlays: result.parlays.length,
            highConfidence: result.recommendations.filter(r => 
                ['elite', 'very-high', 'high'].includes(r.confidence?.toLowerCase())
            ).length
        });
        
        if (result.recommendations.length > 0) {
            console.log("Sample recommendation:", result.recommendations[0]);
        }
        if (result.parlays.length > 0) {
            console.log("Sample parlay:", result.parlays[0]);
        }
        
        // Update UI with results
        try {
            updateUI(result);
        } catch (error) {
            console.error("Failed to update UI:", error);
            throw new Error("Failed to display results: " + error.message);
        }
        
        // Reset loading state
        if (analyzeButton) {
            analyzeButton.disabled = false;
            analyzeButton.innerHTML = '<i class="fas fa-play"></i> Run Analysis';
        }
        if (loadingContainer) {
            loadingContainer.style.display = 'none';
        }
        
    } catch (error) {
        console.error("Analysis failed:", error);
        alert("An error occurred while running the analysis: " + error.message);
        
        // Reset loading state
        const analyzeButton = document.getElementById('analyzeBtn');
        const loadingContainer = document.getElementById('loadingContainer');
        
        if (analyzeButton) {
            analyzeButton.disabled = false;
            analyzeButton.innerHTML = '<i class="fas fa-play"></i> Run Analysis';
        }
        if (loadingContainer) {
            loadingContainer.style.display = 'none';
        }
    }
}

function switchTab(tabId) {
    console.log('Switching to tab:', tabId);
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.dataset.tab === tabId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Update tab panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
        if (pane.id === tabId) {
            pane.classList.add('active');
            pane.style.display = 'block';
        } else {
            pane.classList.remove('active');
            pane.style.display = 'none';
        }
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content Loaded - Setting up event listeners");
    
    // Set up analyze button
    const analyzeButton = document.getElementById('analyzeBtn');
    if (analyzeButton) {
        console.log("Analyze button found - adding click listener");
        analyzeButton.addEventListener('click', runAnalysis);
    } else {
        console.error("Analyze button not found in the DOM");
    }
    
    // Set up tab navigation
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const tabId = event.target.closest('.tab-btn').dataset.tab;
            console.log('Tab button clicked:', tabId);
            switchTab(tabId);
        });
    });
    
    // Set up category filter buttons
    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const button = event.target.closest('.category-btn');
            if (!button) return;
            
            const category = button.dataset.category;
            console.log('Category button clicked:', category);
            
            // Remove active class from all buttons
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Filter content
            filterPropsByCategory(category);
        });
    });
    
    // Set up parlay type filter buttons
    const parlayButtons = document.querySelectorAll('.parlay-btn');
    console.log('Found parlay filter buttons:', parlayButtons.length);
    parlayButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const clickedButton = event.target.closest('.parlay-btn');
            if (!clickedButton) return;

            const type = clickedButton.dataset.type;
            console.log('Parlay type button clicked:', type);
            
            // Remove active class from all buttons
            parlayButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            clickedButton.classList.add('active');
            
            // Filter parlays by type
            filterParlaysByType(type);
        });
    });
    
    // Set initial active states
    const initialActiveButton = document.querySelector('.tab-btn.active');
    if (initialActiveButton) {
        switchTab(initialActiveButton.dataset.tab);
    } else if (tabButtons.length > 0) {
        switchTab(tabButtons[0].dataset.tab);
    }
    
    const activeButton = document.querySelector('.category-btn.active');
    if (!activeButton && categoryButtons.length > 0) {
        categoryButtons[0].classList.add('active');
        filterPropsByCategory(categoryButtons[0].dataset.category || 'all');
    }
    
    // Verify MLBAnalyticsEngine is available
    if (window.MLBAnalyticsEngine) {
        console.log("MLBAnalyticsEngine is available");
    } else {
        console.error("MLBAnalyticsEngine not found - analysis functionality may not work");
    }
});

// UI update function
function updatePlayerProps(props) {
    const propsContainer = document.getElementById('playerProps');
    
    // Log incoming props
    console.log('Received props for categorization:', props);

    // Initialize categorized props
    const categorizedProps = {
        hitting: [],
        pitching: [],
        streaks: [],
        situational: []
    };

    // Categorize each prop
    props.forEach(prop => {
        // Detailed logging of each prop
        console.log('Processing prop:', {
            type: prop.betType,
            player: prop.player,
            category: prop.category,
            position: prop.position
        });

        let categorized = false;

        // Check for pitching props first
        if (prop.betType?.toLowerCase().includes('pitcher') ||
            prop.betType?.toLowerCase().includes('strikeout') ||
            prop.betType?.toLowerCase().includes('quality_start') ||
            prop.betType?.toLowerCase().includes('innings') ||
            prop.betType?.toLowerCase().includes('outs') ||
            prop.betType?.toLowerCase().includes('earned_runs') ||
            prop.category?.toLowerCase() === 'pitching' ||
            prop.position === 'P' ||
            prop.player?.toLowerCase().includes('pitcher')) {
            console.log(`Categorized as pitching: ${prop.player || prop.betType}`);
            categorizedProps.pitching.push(prop);
            categorized = true;
        }

        // Check for hitting props
        if (!categorized && (
            prop.betType?.toLowerCase().includes('hits') ||
            prop.betType?.toLowerCase().includes('hr') ||
            prop.betType?.toLowerCase().includes('rbi') ||
            prop.betType?.toLowerCase().includes('bases') ||
            prop.betType?.toLowerCase().includes('runs') ||
            prop.category?.toLowerCase() === 'hitting' ||
            (prop.betType?.toLowerCase().includes('player') && !prop.betType?.toLowerCase().includes('pitcher'))
        )) {
            console.log(`Categorized as hitting: ${prop.player || prop.betType}`);
            categorizedProps.hitting.push(prop);
            categorized = true;
        }

        // Check for streaks
        if (!categorized && (
            prop.propFactor === 'hot_streak' ||
            prop.hotStreak ||
            prop.streak ||
            prop.reason?.toLowerCase().includes('streak') ||
            prop.reason?.toLowerCase().includes('consecutive') ||
            (prop.player && window.MLBAnalyticsEngine?.prototype?.playerDatabase?.[prop.player]?.hotStreak)
        )) {
            console.log(`Categorized as streak: ${prop.player || prop.betType}`);
            categorizedProps.streaks.push(prop);
            categorized = true;
        }

        // Check for situational props
        if (prop.venueFactor || prop.weatherFactor ||
            (prop.propFactor && prop.propFactor !== 'hot_streak') ||
            (prop.reason && (
                prop.reason.includes('Coors Field') ||
                prop.reason.includes('Yankee Stadium') ||
                prop.reason.includes('Fenway Park') ||
                prop.reason.includes('temperature') ||
                prop.reason.includes('wind') ||
                prop.reason.includes('humidity')
            ))) {
            console.log(`Categorized as situational: ${prop.player || prop.betType}`);
            categorizedProps.situational.push(prop);
            return;
        }
    });

    // Log categorization results
    Object.entries(categorizedProps).forEach(([category, categoryProps]) => {
        console.log(`${category} props count:`, categoryProps.length);
    });

    // Update the DOM with categorized props
    propsContainer.innerHTML = `
        <div class="props-sections">
            <div id="hittingProps" class="prop-section ${categorizedProps.hitting.length ? '' : 'empty'}">
                <h3>Hitting Props (${categorizedProps.hitting.length})</h3>
                <div class="props-grid">
                    ${renderPropCards(categorizedProps.hitting, 'hitting')}
                </div>
            </div>
            
            <div id="pitchingProps" class="prop-section ${categorizedProps.pitching.length ? '' : 'empty'}">
                <h3>Pitching Props (${categorizedProps.pitching.length})</h3>
                <div class="props-grid">
                    ${renderPropCards(categorizedProps.pitching, 'pitching')}
                </div>
            </div>
            
            <div id="streakProps" class="prop-section ${categorizedProps.streaks.length ? '' : 'empty'}">
                <h3>Hot Streaks (${categorizedProps.streaks.length})</h3>
                <div class="props-grid">
                    ${renderPropCards(categorizedProps.streaks, 'streaks')}
                </div>
            </div>
            
            <div id="situationalProps" class="prop-section ${categorizedProps.situational.length ? '' : 'empty'}">
                <h3>Situational Props (${categorizedProps.situational.length})</h3>
                <div class="props-grid">
                    ${renderPropCards(categorizedProps.situational, 'situational')}
                </div>
            </div>
        </div>
    `;

    // Add event listeners for track buttons
    propsContainer.querySelectorAll('.track-bet-btn').forEach(btn => {
        btn.addEventListener('click', () => trackBet(JSON.parse(btn.dataset.bet)));
    });
    
    // Show relevant sections based on current category filter
    const activeCategory = document.querySelector('.category-btn.active')?.dataset.category;
    filterPropsByCategory(activeCategory || 'all');
}
