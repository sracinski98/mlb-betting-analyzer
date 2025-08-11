/**
 * Phase 2: Mobile-First Application Controller
 * Enhanced UX with mobile-responsive design, confidence filtering, and user preferences
 */
import safeDOM from './js/utils/dom-safety.js';

class MobileMLBApp {
    // Private fields
    #state;
    #dom;
    
    // Required containers
    static #requiredContainers = [
        'quickPicksContent',
        'teamBetsContent',
        'playerPropsContent',
        'parlaysContent',
        'loadingState',
        'errorState',
        'errorMessage',
        'welcomeState',
        'resultsContainer',
        'progressBar',
        'loadingStep'
    ];
    
    constructor() {
        this.#state = {
            engine: null,
            currentData: null,
            currentTab: 'quick-picks',
            isAnalyzing: false,
            isMobile: window.innerWidth <= 768,
            preferences: null,
            containers: {}
        };
        
        this.#dom = safeDOM;    // Required containers
    static #requiredContainers = [
        'quickPicksContent',
        'teamBetsContent',
        'playerPropsContent',
        'parlaysContent',
        'loadingState',
        'errorState',
        'errorMessage',
        'welcomeState',
        'resultsContainer',
        'progressBar',
        'loadingStep'
    ];

    // Instance getters
    get engine() { return this.#state.engine; }
    get currentData() { return this.#state.currentData; }
    get currentTab() { return this.#state.currentTab; }
    get isAnalyzing() { return this.#state.isAnalyzing; }
    get isMobile() { return this.#state.isMobile; }
    get preferences() { return this.#state.preferences; }

    constructor() {
        // Begin async initialization
        this.init().catch(error => {
            console.error('Failed to initialize:', error);
            this.showErrorState('Failed to initialize. Please refresh.');
        });
    }

    // Core initialization
    init = async () => {
        try {
            // Basic setup
            this.isMobile = window.innerWidth <= 768;
            this.safeDOM = SafeDOM;
            
            // Create engine and containers
            await this.createEngine();
            await this.initContainers();
            
            // Load preferences
            this.preferences = this.loadUserPreferences();
            
            // Initialize features
            await Promise.all([
                this.setupEventListeners(),
                this.setupMobileFeatures()
            ]);
            
            // Setup filters
            this.setupConfidenceFiltering();
            
            // Apply preferences
            this.applyUserPreferences();
            
            // Add resize handler
            window.addEventListener('resize', this.handleResize);
            
            // Show initial state
            this.showWelcomeState();
            
            return true;
        } catch (error) {
            console.error('Initialization error:', error);
            throw error;
        }
    };

    // Engine creation
    createEngine = async () => {
        this.engine = await new MLBAnalyticsEngine();
    };

    // Container initialization
    initContainers = async () => {
        await Promise.all(this.requiredContainers.map(id => 
            this.safeDOM.ensureContainer(id).then(container => {
                this.containers[id] = container;
                return container;
            })
        ));
    };
    }

    async #initializeApp() {
        // Initialize engine
        this.#state.engine = await new MLBAnalyticsEngine();
        
        // Initialize DOM containers
        await this.#initContainers();
        
        // Load user preferences
        this.#state.preferences = this.loadUserPreferences();
        
        // Start application
        await this.#initialize();
        
        // Show welcome state
        this.showWelcomeState();
        
        console.log('Application initialized successfully');
    }
    
    async #initContainers() {
        await Promise.all(this.#requiredContainers.map(id => {
            const container = SafeDOM.ensureContainer(id);
            if (!container) {
                throw new Error(`Failed to ensure container: ${id}`);
            }
            this.#state.containers[id] = container;
            return container;
        }));
    }
    
    initializeApp = async () => {
        try {
            // Initialize the engine
            this.state.engine = await new MLBAnalyticsEngine();
            
            // Initialize containers
            await this.initContainers();
            
            // Load preferences
            this.state.preferences = this.loadUserPreferences();
            
            // Setup core functionality
            await this.setupEventListeners();
            await this.setupMobileFeatures();
            this.setupConfidenceFiltering();
            
            // Apply preferences
            this.applyUserPreferences();
            
            // Add resize listener
            window.addEventListener('resize', () => this.handleResize());
            
            // Show initial state
            this.showWelcomeState();
            
            return true;
        } catch (error) {
            console.error('Failed to initialize app:', error);
            throw error;
        }
    }
    
    initContainers = async () => {
        await Promise.all(this.requiredContainers.map(id => {
            const container = this.safeDOM.ensureContainer(id);
            if (!container) {
                throw new Error(`Failed to ensure container: ${id}`);
            }
            this.state.containers[id] = container;
            return container;
        }));
    }
    
    setupEventListeners = async () => {
        // Implementation for setting up event listeners
    }
    
    setupMobileFeatures = async () => {
        await Promise.all([
            this.setupSwipeGestures(),
            this.setupPullToRefresh(),
            this.setupMobileKeyboard()
        ]);
    }
    
    setupSwipeGestures = async () => {
        // Implementation for swipe gestures
    }
    
    setupPullToRefresh = async () => {
        // Implementation for pull to refresh
    }
    
    setupMobileKeyboard = async () => {
        // Implementation for mobile keyboard handling
    }
    
    setupConfidenceFiltering = () => {
        // Setup confidence filtering system
        this.confidenceFilters = {
            'all': { min: 0, max: 10, label: 'All Levels' },
            'elite': { min: 9.0, max: 10, label: 'Elite (9.0+)' },
            'very-high': { min: 8.0, max: 8.9, label: 'Very High (8.0+)' },
            'high': { min: 7.0, max: 7.9, label: 'High (7.0+)' },
            'medium-high': { min: 6.0, max: 6.9, label: 'Medium-High (6.0+)' },
            'medium': { min: 5.0, max: 5.9, label: 'Medium (5.0+)' }
        };
    }
    
    showWelcomeState = () => {
        // Hide all containers
        Object.keys(this.containers).forEach(id => {
            const container = this.containers[id];
            if (container) {
                container.classList.add('hidden');
            }
        });
        
        // Show welcome state
        const welcomeState = this.containers.welcomeState;
        if (welcomeState) {
            welcomeState.classList.remove('hidden');
        }
    };
    
    showErrorState = (message) => {
        // Hide all containers
        Object.keys(this.containers).forEach(id => {
            const container = this.containers[id];
            if (container) {
                container.classList.add('hidden');
            }
        });
        
        // Show error state and message
        const errorState = this.containers.errorState;
        const errorMessage = this.containers.errorMessage;
        
        if (errorState) {
            errorState.classList.remove('hidden');
        }
        
        if (errorMessage) {
            errorMessage.textContent = message;
        }
    };
    constructor() {
        this.#isMobile = window.innerWidth <= 768;
        this.#safeDOM = SafeDOM;

        // Initialize the app
        this.#initializeApp();
    }
    
    #initializeApp = async () => {
        try {
            this.#state.engine = await new MLBAnalyticsEngine();
            
            // Create any missing containers safely
            const containers = await Promise.all(this.constructor.#requiredContainers.map(id => {
                const container = this.#dom.ensureContainer(id);
                if (!container) {
                    throw new Error(`Failed to ensure container: ${id}`);
                }
                this.#state.containers[id] = container;
                return container;
            }));

            // Initialize the application
            await this.init();
            
            return containers;
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showErrorState('Failed to initialize application');
            throw error;
        }
    };        // User preferences (Phase 2 feature)
        this.userPreferences = this.loadUserPreferences();
        
        // Mobile-specific state
        this.isFiltersOpen = false;
        this.touchStartY = 0;
        this.swipeThreshold = 50;
        
        this.init();
    }

    init = async () => {
        // Setup core functionality
        await Promise.all([
            this.setupEventListeners(),
            this.setupMobileFeatures(),
            this.setupConfidenceFiltering(),
            this.applyUserPreferences()
        ]);

        // Show welcome state
        await this.showWelcomeState();
        
        // Add resize listener for responsive behavior
        window.addEventListener('resize', () => this.handleResize());
        
        return true;
    }

    /**
     * Setup mobile-specific event listeners
     */
    setupEventListeners = () => {
        // Main action buttons
        ['analyzeBtn', 'startAnalysisBtn'].forEach(id => {
            const btn = this.safeDOM.addListener(id, 'click', () => this.runAnalysis());
        });
        
        // Refresh and retry buttons
        ['refreshBtn', 'retryBtn'].forEach(id => {
            const btn = this.safeDOM.addListener(id, 'click', () => this.refreshData());
        });
        
        // Mobile filters toggle
        this.safeDOM.addListener('filtersToggle', 'click', () => this.toggleFilters());
        
        // Filter controls
        const confidenceFilter = document.getElementById('confidenceFilter');
        const betTypeFilter = document.getElementById('betTypeFilter');
        const clearFilters = document.getElementById('clearFilters');
        
        // Desktop filter controls (if they exist)
        const confidenceFilterDesktop = document.getElementById('confidenceFilterDesktop');
        const betTypeFilterDesktop = document.getElementById('betTypeFilterDesktop');
        
        if (confidenceFilter) {
            confidenceFilter.addEventListener('change', (e) => this.applyFilters());
        }
        if (betTypeFilter) {
            betTypeFilter.addEventListener('change', (e) => this.applyFilters());
        }
        if (clearFilters) {
            clearFilters.addEventListener('click', () => this.clearAllFilters());
        }
        
        // Sync desktop filters if they exist
        if (confidenceFilterDesktop) {
            confidenceFilterDesktop.addEventListener('change', (e) => {
                if (confidenceFilter) confidenceFilter.value = e.target.value;
                this.applyFilters();
            });
        }
        if (betTypeFilterDesktop) {
            betTypeFilterDesktop.addEventListener('change', (e) => {
                if (betTypeFilter) betTypeFilter.value = e.target.value;
                this.applyFilters();
            });
        }
        
        // Tab navigation (both top tabs and mobile bottom nav)
        document.querySelectorAll('.tab-btn, .mobile-nav-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = btn.dataset.tab || btn.dataset.nav;
                if (tab) this.switchTab(tab);
            });
        });
        
        // Bet tracking modal
        this.setupBetTrackingModal();
    }

    /**
     * Setup mobile-specific features
     */
    setupMobileFeatures = async () => {
        // Touch gestures for tab switching
        this.setupSwipeGestures();
        
        // Pull to refresh (mobile)
        this.setupPullToRefresh();
        
        // Mobile keyboard handling
        this.setupMobileKeyboard();
        
        // Service worker for offline capability (future enhancement)
        this.registerServiceWorker();
    }

    /**
     * Setup swipe gestures for mobile tab navigation
     */
    setupSwipeGestures = () => {
        const tabContent = document.querySelector('.tab-content');
        if (!tabContent) return;
        
        let startX = 0;
        let currentX = 0;
        let isDragging = false;
        
        tabContent.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isDragging = true;
        }, { passive: true });
        
        tabContent.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            currentX = e.touches[0].clientX;
        }, { passive: true });
        
        tabContent.addEventListener('touchend', () => {
            if (!isDragging) return;
            isDragging = false;
            
            const deltaX = currentX - startX;
            const threshold = 50;
            
            if (Math.abs(deltaX) > threshold) {
                if (deltaX > 0) {
                    this.switchToPreviousTab();
                } else {
                    this.switchToNextTab();
                }
            }
        }, { passive: true });
    }

    /**
     * Setup pull-to-refresh functionality
     */
    setupPullToRefresh = () => {
        let startY = 0;
        let currentY = 0;
        let isPulling = false;
        
        document.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            isPulling = window.scrollY === 0;
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            if (!isPulling) return;
            currentY = e.touches[0].clientY;
            const deltaY = currentY - startY;
            
            if (deltaY > 100 && window.scrollY === 0) {
                // Show pull to refresh indicator
                this.showPullToRefreshIndicator();
            }
        }, { passive: true });
        
        document.addEventListener('touchend', () => {
            if (!isPulling) return;
            isPulling = false;
            
            const deltaY = currentY - startY;
            if (deltaY > 100 && window.scrollY === 0) {
                this.refreshData();
            }
            this.hidePullToRefreshIndicator();
        }, { passive: true });
    }

    /**
     * Setup mobile keyboard handling
     */
    setupMobileKeyboard = () => {
        // Adjust viewport when mobile keyboard appears
        if (this.isMobile) {
            let initialHeight = window.innerHeight;
            
            window.addEventListener('resize', () => {
                const currentHeight = window.innerHeight;
                const heightDifference = initialHeight - currentHeight;
                
                if (heightDifference > 150) {
                    // Keyboard is likely open
                    document.body.classList.add('keyboard-open');
                } else {
                    document.body.classList.remove('keyboard-open');
                }
            });
        }
    }

    /**
     * Setup confidence filtering system
     */
    setupConfidenceFiltering = () => {
        this.confidenceFilters = {
            'all': { min: 0, max: 10, label: 'All Levels' },
            'elite': { min: 9.0, max: 10, label: 'Elite (9.0+)' },
            'very-high': { min: 8.0, max: 8.9, label: 'Very High (8.0+)' },
            'high': { min: 7.0, max: 7.9, label: 'High (7.0+)' },
            'medium-high': { min: 6.0, max: 6.9, label: 'Medium-High (6.0+)' },
            'medium': { min: 5.0, max: 5.9, label: 'Medium (5.0+)' }
        };
        
        this.betTypeFilters = {
            'all': 'All Types',
            'moneyline': 'Moneyline',
            'runline': 'Run Line', 
            'total': 'Over/Under',
            'player_prop': 'Player Props',
            'parlay': 'Parlays'
        };
    }

    /**
     * Toggle mobile filters panel
     */
    toggleFilters = () => {
        const filtersPanel = document.getElementById('filtersPanel');
        if (!filtersPanel) return;
        
        this.isFiltersOpen = !this.isFiltersOpen;
        
        if (this.isFiltersOpen) {
            filtersPanel.classList.remove('hidden');
            filtersPanel.classList.add('fade-in');
        } else {
            filtersPanel.classList.add('hidden');
            filtersPanel.classList.remove('fade-in');
        }
    }

    /**
     * Apply active filters to displayed data
     */
    applyFilters = () => {
        if (!this.currentData) return;
        
        const confidenceFilter = document.getElementById('confidenceFilter')?.value || 'all';
        const betTypeFilter = document.getElementById('betTypeFilter')?.value || 'all';
        
        // Save filter preferences
        this.userPreferences.filters = { confidence: confidenceFilter, betType: betTypeFilter };
        this.saveUserPreferences();
        
        // Apply filters to current data
        this.filterAndDisplayData(confidenceFilter, betTypeFilter);
        
        // Update filter indicator
        this.updateFilterIndicator();
    }

    /**
     * Filter and redisplay data based on current filters
     */
    filterAndDisplayData = (confidenceFilter, betTypeFilter) => {
        const confidenceRange = this.confidenceFilters[confidenceFilter];
        
        // Filter each data category
        const filteredData = {
            quickPicks: this.filterRecommendations(this.currentData.quickPicks, confidenceRange, betTypeFilter),
            teamBets: this.filterRecommendations(this.currentData.teamBets, confidenceRange, betTypeFilter),
            playerProps: this.filterRecommendations(this.currentData.playerProps, confidenceRange, betTypeFilter),
            parlays: this.filterRecommendations(this.currentData.parlays, confidenceRange, betTypeFilter)
        };
        
        // Update displays
        this.displayQuickPicks(filteredData.quickPicks);
        this.displayTeamBets(filteredData.teamBets);
        this.displayPlayerProps(filteredData.playerProps);
        this.displayParlays(filteredData.parlays);
        
        // Update counts
        this.updateFilteredCounts(filteredData);
    }

    /**
     * Filter recommendations array based on criteria
     */
    filterRecommendations = (recommendations, confidenceRange, betTypeFilter) => {
        if (!recommendations) return [];
        
        return recommendations.filter(rec => {
            // Confidence filter - handle different data structures
            let score = rec.score || rec.confidence || 0;
            
            // For parlays, use parlay-specific scoring
            if (rec.parlayCategory || rec.type?.includes('parlay')) {
                score = rec.avgScore || rec.score || rec.confidence || 5.0;
            }
            
            // Convert confidence strings to numbers if needed
            if (typeof score === 'string') {
                const confidenceMap = {
                    'elite': 9.5, 'very-high': 8.5, 'high': 7.5,
                    'medium-high': 6.5, 'medium': 5.5, 'medium-low': 4.5,
                    'low': 3.5, 'very-low': 2.5
                };
                score = confidenceMap[score] || 5.0;
            }
            
            const confidenceMatch = score >= confidenceRange.min && 
                                  (confidenceRange.max === 10 ? score <= confidenceRange.max : score < confidenceRange.max);
            
            // Bet type filter - handle parlays differently
            let typeMatch = betTypeFilter === 'all';
            if (!typeMatch) {
                if (betTypeFilter === 'parlays') {
                    typeMatch = rec.parlayCategory || rec.type?.includes('parlay') || rec.legs;
                } else {
                    typeMatch = rec.type === betTypeFilter || rec.betType === betTypeFilter;
                }
            }
            
            return confidenceMatch && typeMatch;
        });
    }

    /**
     * Clear all active filters
     */
    clearAllFilters = () => {
        document.getElementById('confidenceFilter').value = 'all';
        document.getElementById('betTypeFilter').value = 'all';
        
        this.userPreferences.filters = { confidence: 'all', betType: 'all' };
        this.saveUserPreferences();
        
        this.applyFilters();
        this.updateFilterIndicator();
    }

    /**
     * Update filter indicator badge
     */
    updateFilterIndicator = () => {
        const filtersToggle = document.getElementById('filtersToggle');
        if (!filtersToggle) return;
        
        const confidenceFilter = document.getElementById('confidenceFilter')?.value;
        const betTypeFilter = document.getElementById('betTypeFilter')?.value;
        
        const hasActiveFilters = confidenceFilter !== 'all' || betTypeFilter !== 'all';
        
        if (hasActiveFilters) {
            filtersToggle.classList.add('has-filters');
            if (!filtersToggle.querySelector('.filter-badge')) {
                const badge = document.createElement('span');
                badge.className = 'filter-badge';
                badge.textContent = '•';
                filtersToggle.appendChild(badge);
            }
        } else {
            filtersToggle.classList.remove('has-filters');
            const badge = filtersToggle.querySelector('.filter-badge');
            if (badge) badge.remove();
        }
    }

    /**
     * Switch to specific tab
     */
    switchTab = (tabName) => {
        // Store current scroll position to maintain it
        const currentScrollY = window.scrollY;
        
        // Update active states
        document.querySelectorAll('.tab-btn, .mobile-nav-item').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        
        // Activate new tab
        document.querySelectorAll(`[data-tab="${tabName}"], [data-nav="${tabName}"]`).forEach(btn => {
            btn.classList.add('active');
        });

        const targetPanel = document.getElementById(tabName);
        if (targetPanel) {
            targetPanel.classList.add('active');
            // Remove problematic scroll behavior that jumps to bottom
            // targetPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        
        // Restore scroll position to prevent jumping
        setTimeout(() => {
            window.scrollTo(0, currentScrollY);
        }, 0);
        
        this.currentTab = tabName;
        
        // Save preference
        this.userPreferences.lastTab = tabName;
        this.saveUserPreferences();
        
        // Close mobile filters if open
        if (this.isFiltersOpen) {
            this.toggleFilters();
        }
    }

    /**
     * Switch to next tab (swipe gesture)
     */
    switchToNextTab = () => {
        const tabs = ['quick-picks', 'team-bets', 'player-props', 'parlays', 'analytics'];
        const currentIndex = tabs.indexOf(this.currentTab);
        const nextIndex = (currentIndex + 1) % tabs.length;
        this.switchTab(tabs[nextIndex]);
    }

    /**
     * Switch to previous tab (swipe gesture)
     */
    switchToPreviousTab = () => {
        const tabs = ['quick-picks', 'team-bets', 'player-props', 'parlays', 'analytics'];
        const currentIndex = tabs.indexOf(this.currentTab);
        const prevIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
        this.switchTab(tabs[prevIndex]);
    }

    /**
     * Organize engine results for mobile display categories
     */
    organizeDataForMobile = (results) => {
        try {
            const recommendations = results.recommendations || [];
            const parlays = results.parlays || [];
            
            console.log(`📊 DEBUGGING: Organizing data - ${recommendations.length} recommendations, ${parlays.length} parlays`);
            console.log('Raw parlays data:', parlays);
            
            // Categorize recommendations by type
            let quickPicks = recommendations.filter(r => 
                ['elite', 'very-high', 'high'].includes(r.confidence) || r.score >= 7.0
            ).slice(0, 8);
            
            let teamBets = recommendations.filter(r => 
                r.betType && (r.betType.includes('_ml') || r.betType.includes('spread') || r.betType.includes('total'))
            ).slice(0, 12);
            
            let playerProps = recommendations.filter(r => 
                r.betType && (r.betType.includes('player_') || r.recommendation.toLowerCase().includes('hit') || 
                             r.recommendation.toLowerCase().includes('strikeout') || r.recommendation.toLowerCase().includes('rbi'))
            ).slice(0, 10);
            
            // Ensure all categories have content
            if (quickPicks.length === 0 && recommendations.length > 0) {
                quickPicks = quickPicks.concat(recommendations.slice(0, 3));
            }
            if (teamBets.length === 0 && recommendations.length > 0) {
                teamBets = teamBets.concat(recommendations.slice(0, 6));
            }
            if (playerProps.length === 0 && recommendations.length > 0) {
                playerProps = playerProps.concat(recommendations.slice(-4)); // Last few as player props
            }
            
            // PARLAY DEBUGGING
            console.log(`🎯 PARLAYS DEBUG: ${parlays.length} parlays found`);
            if (parlays.length > 0) {
                console.log('First parlay structure:', JSON.stringify(parlays[0], null, 2));
            }
            
            console.log(`✅ FINAL: ${quickPicks.length} quick picks, ${teamBets.length} team bets, ${playerProps.length} player props, ${parlays.length} parlays`);
            
            const organizedData = Object.assign({}, results, {
                quickPicks: quickPicks,
                teamBets: teamBets,
                playerProps: playerProps,
                parlays: parlays
            });
            
            console.log('📤 ORGANIZED DATA:', organizedData);
            return organizedData;
        } catch (error) {
            console.error('❌ Error organizing data for mobile:', error);
            // Fallback: return original results with basic organization
            const recommendations = results.recommendations || [];
            return Object.assign({}, results, {
                quickPicks: recommendations.slice(0, 8),
                teamBets: recommendations.slice(0, 12),
                playerProps: recommendations.slice(0, 10),
                parlays: results.parlays || []
            });
        }
    }

    /**
     * Enhanced run analysis with mobile optimizations
     */
    runAnalysis = async () => {
        if (this.isAnalyzing) return;
        
        try {
            this.isAnalyzing = true;
            
            // Ensure all required containers exist before proceeding
            const containers = {
                loading: document.getElementById('loadingState'),
                welcome: document.getElementById('welcomeState'),
                results: document.getElementById('resultsContainer'),
                error: document.getElementById('errorState')
            };
            
            // Create containers if they don't exist
            if (!containers.loading) {
                const loadingContainer = document.createElement('div');
                loadingContainer.id = 'loadingState';
                document.body.appendChild(loadingContainer);
                containers.loading = loadingContainer;
            }
            
            if (!containers.error) {
                const errorContainer = document.createElement('div');
                errorContainer.id = 'errorState';
                errorContainer.innerHTML = '<div id="errorMessage"></div>';
                document.body.appendChild(errorContainer);
                containers.error = errorContainer;
            }
            
            this.showLoadingState();
            this.hideWelcomeState();
            
            // Show progress updates for mobile users
            this.updateLoadingStep('Initializing Phase 1 enhanced analysis...', 10);
            
            // Run enhanced analysis with Phase 1 features
            console.log('Starting comprehensive analysis...');
            const results = await this.engine.runComprehensiveAnalysis();
            console.log('Analysis results received:', results);
            
            this.updateLoadingStep('Processing expert trends...', 40);
            await this.delay(500); // Give user feedback
            
            this.updateLoadingStep('Analyzing live odds data...', 70);
            await this.delay(500);
            
            this.updateLoadingStep('Generating recommendations...', 90);
            await this.delay(500);
            
            // Organize data for mobile display
            console.log('Organizing data for mobile display...');
            const organizedData = this.organizeDataForMobile(results);
            console.log('Organized data:', organizedData);
            this.currentData = organizedData;
            
            this.hideLoadingState();
            this.showResultsContainer();
            
            // Display data with current filters
            this.applyFilters();
            
            // Update header stats
            this.updateHeaderStats(results);
            
            // Show success feedback on mobile
            this.showSuccessToast('Analysis complete!');
            
        } catch (error) {
            console.error('Analysis failed:', error);
            this.showErrorState(error.message);
        } finally {
            this.isAnalyzing = false;
        }
    }

    /**
     * Update loading progress with mobile-friendly messaging
     */
    updateLoadingStep = (message, progress = 0) => {
        const loadingStep = document.getElementById('loadingStep');
        const progressBar = document.getElementById('progressBar');
        
        if (loadingStep) loadingStep.textContent = message;
        if (progressBar) progressBar.style.width = `${progress}%`;
    }

    /**
     * Enhanced display functions with mobile optimizations
     */
    displayQuickPicks = (picks) => {
        const container = document.getElementById('quickPicksContent');
        if (!container) {
            console.warn('Quick picks container not found');
            return;
        }
        
        try {
            // Create a temporary div to validate the content before inserting
            const tempDiv = document.createElement('div');
            
            if (!picks || picks.length === 0) {
                tempDiv.appendChild(this.createEmptyState('No quick picks match your current filters'));
                this.safeDOM.setHTML('quickPicksContent', tempDiv.innerHTML);
                return;
            }
            
            const gridContent = picks.slice(0, 10)
                .map(pick => {
                    try {
                        return this.createMobileRecommendationCard(pick);
                    } catch (err) {
                        console.warn('Error creating recommendation card:', err);
                        return '';
                    }
                })
                .filter(card => card !== '')
                .join('');
                
            if (!gridContent) {
                tempDiv.appendChild(this.createEmptyState('Unable to display picks at this time'));
                this.safeDOM.setHTML('quickPicksContent', tempDiv.innerHTML);
                return;
            }
            
            tempDiv.innerHTML = `
                <div class="recommendations-grid">
                    ${gridContent}
                </div>
            `;
            
            this.safeDOM.setHTML('quickPicksContent', tempDiv.innerHTML);
    }

    displayTeamBets = (bets) => {
        const container = document.getElementById('teamBetsContent');
        if (!container) return;
        
        if (!bets || bets.length === 0) {
            container.innerHTML = this.getEmptyState('No team bets match your current filters');
            return;
        }
        
        container.innerHTML = `
            <div class="recommendations-grid">
                ${bets.slice(0, 20).map(bet => this.createMobileRecommendationCard(bet)).join('')}
            </div>
        `;
    };

    displayPlayerProps = (props) => {
        const container = document.getElementById('playerPropsContent');
        if (!container) return;
        
        if (!props || props.length === 0) {
            container.innerHTML = this.getEmptyState('No player props match your current filters');
            return;
        }
        
        container.innerHTML = `
            <div class="recommendations-grid">
                ${props.slice(0, 15).map(prop => this.createMobileRecommendationCard(prop)).join('')}
            </div>
        `;
    };

    displayParlays = (parlays) => {
        const container = document.getElementById('parlaysContent');
        if (!container) {
            console.error('❌ Parlays container not found!');
            return;
        }
        
        console.log(`📊 Displaying ${parlays?.length || 0} parlays`);
        
        // EMERGENCY: If no parlays, try to get from currentData.parlays directly
        if (!parlays || parlays.length === 0) {
            console.log('🔍 No parlays in filtered data, checking original data...');
            const originalParlays = this.currentData?.parlays || [];
            console.log(`Found ${originalParlays.length} parlays in original data`);
            
            if (originalParlays.length > 0) {
                console.log('📊 Using original parlays data');
                parlays = originalParlays;
            } else {
                container.innerHTML = this.getEmptyState('No parlays available yet. Try running a new analysis!');
                return;
            }
        }
        
        // Debug first parlay structure
        if (parlays.length > 0) {
            console.log('First parlay structure:', parlays[0]);
        }
        
        container.innerHTML = `
            <div class="recommendations-grid">
                ${parlays.slice(0, 8).map(parlay => this.createMobileParlayCard(parlay)).join('')}
            </div>
        `;
        
        console.log(`✅ Parlays container updated with ${parlays.length} parlays`);
    }

    /**
     * Create mobile-optimized recommendation card
     */
    createMobileRecommendationCard = (rec) => {
        // Enhanced metrics like dimers.com
        const probabilityScore = rec.probabilityScore || Math.min(Math.max((rec.score || 5) * 10, 35), 85);
        const edge = rec.edge || Math.max((rec.score || 5) - 5, 0.5);
        const confidenceLabel = rec.confidenceLabel || rec.confidence || 'MEDIUM';
        
        // Determine signal badges
        let signalBadges = '';
        if (edge >= 4.0) {
            signalBadges += '<div class="signal-badge high-value">High Value</div>';
        }
        if (rec.confidence === 'elite' || rec.confidence === 'very-high') {
            signalBadges += '<div class="signal-badge elite">Elite Pick</div>';
        }
        if (rec.expertBoost) {
            signalBadges += '<div class="signal-badge expert">Expert</div>';
        }
        
        return `
            <div class="recommendation-card mobile-card dimers-style" data-rec-id="${rec.id || Math.random()}">
                <div class="card-header">
                    <div class="game-info">
                        <div class="game-matchup">${rec.game || rec.teams || 'Game Info'}</div>
                        <div class="team-info">${rec.team || this.formatBetType(rec.type)}</div>
                    </div>
                    <div class="signal-badges">
                        ${signalBadges}
                    </div>
                </div>
                
                <div class="bet-details">
                    <div class="bet-type">${this.formatBetType(rec.type)}</div>
                    <div class="confidence-metrics">
                        <div class="probability">
                            <span class="label">Probability:</span>
                            <span class="value">${probabilityScore.toFixed(1)}%</span>
                        </div>
                        <div class="edge">
                            <span class="label">Edge:</span>
                            <span class="value">${edge.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
                
                <div class="confidence-row">
                    <div class="confidence-badge ${rec.confidence}">
                        ${confidenceLabel}
                    </div>
                    <div class="odds">${rec.odds || 'Check Sportsbook'}</div>
                </div>
                
                <div class="reasoning">
                    ${rec.description || rec.reasoning || 'Analysis based on multiple factors'}
                </div>
                
                <div class="card-footer">
                    <button class="track-bet-btn" onclick="if(window.betTracker) window.betTracker.trackBet(this.closest('.recommendation-card'), 0)">
                        📊 Track Bet
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Create mobile-optimized parlay card
     */
    createMobileParlayCard = (parlay) => {
        try {
            const confidence = this.getConfidenceInfo(parlay.avgScore || parlay.score || parlay.confidence || 5.0);
            
            // Handle parlay legs safely
            const legs = parlay.legs || [];
            const legsHtml = legs.slice(0, 4).map(leg => {
                const game = leg.game || leg.teams || leg.gameKey || 'Game';
                const bet = leg.bet || leg.selection || leg.recommendation || leg.type || 'Bet';
                
                return `
                    <div class="parlay-leg">
                        <span class="leg-game">${game}</span>
                        <span class="leg-bet">${bet}</span>
                    </div>
                `;
            }).join('');
            
            const moreLegs = legs.length > 4 ? `<div class="more-legs">+${legs.length - 4} more</div>` : '';
            
            return `
                <div class="parlay-card mobile-card dimers-style">
                    <div class="card-header">
                        <div class="game-info">
                            <div class="game-matchup">${parlay.type || 'Multi-Game Parlay'}</div>
                            <div class="team-info">${legs.length}-Leg Parlay</div>
                        </div>
                        <div class="signal-badges">
                            <div class="confidence-badge ${confidence.class}">
                                ${confidence.label}
                            </div>
                        </div>
                    </div>
                    
                    <div class="bet-details">
                        <div class="bet-type">Parlay</div>
                        <div class="confidence-metrics">
                            <div class="probability">
                                <span class="label">Avg Score:</span>
                                <span class="value">${(parlay.avgScore || parlay.score || 5.0).toFixed(1)}</span>
                            </div>
                            <div class="edge">
                                <span class="label">Payout:</span>
                                <span class="value">${parlay.odds ? `+${parlay.odds}` : 'TBD'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="parlay-legs">
                        ${legsHtml}
                        ${moreLegs}
                    </div>
                    
                    <div class="card-footer">
                        <button class="track-bet-btn" onclick="if(window.betTracker) window.betTracker.trackBet(this.closest('.parlay-card'), 0)">
                            📊 Track Parlay
                        </button>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error creating parlay card:', error, parlay);
            return `
                <div class="parlay-card mobile-card error">
                    <div class="card-body">
                        <p>Error displaying parlay</p>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Get confidence information with mobile-friendly display
     */
    getConfidenceInfo = (score) => {
        const numScore = parseFloat(score) || 0;
        
        if (numScore >= 9.0) return { class: 'elite', emoji: '🔥', label: 'Elite' };
        if (numScore >= 8.0) return { class: 'very-high', emoji: '⭐', label: 'Very High' };
        if (numScore >= 7.0) return { class: 'high', emoji: '👍', label: 'High' };
        if (numScore >= 6.0) return { class: 'medium-high', emoji: '✅', label: 'Medium-High' };
        if (numScore >= 5.0) return { class: 'medium', emoji: '⚖️', label: 'Medium' };
        return { class: 'low', emoji: '⚠️', label: 'Low' };
    }

    /**
     * Get factor tags for recommendation
     */
    getFactorTags = (rec) => {
        const tags = [];
        
        if (rec.expertTrends) tags.push('<span class="factor-tag expert">Expert Consensus</span>');
        if (rec.hasValueBet) tags.push('<span class="factor-tag value">Value Bet</span>');
        if (rec.historicalBoost) tags.push('<span class="factor-tag historical">Historical Edge</span>');
        if (rec.weatherFactor) tags.push('<span class="factor-tag weather">Weather Factor</span>');
        if (rec.pitcherFactor) tags.push('<span class="factor-tag pitcher">Pitcher Edge</span>');
        
        return tags.join('');
    }

    /**
     * Bet tracking modal setup
     */
    setupBetTrackingModal = () => {
        // Track bet buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.track-bet-btn')) {
                const btn = e.target.closest('.track-bet-btn');
                const recData = JSON.parse(btn.dataset.rec);
                this.showBetTrackingModal(recData);
            }
            
            if (e.target.closest('.track-parlay-btn')) {
                const btn = e.target.closest('.track-parlay-btn');
                const parlayData = JSON.parse(btn.dataset.parlay);
                this.showBetTrackingModal(parlayData, true);
            }
        });
        
        // Modal close handlers
        const modal = document.getElementById('betTrackingModal');
        const closeBtn = modal?.querySelector('.modal-close');
        const cancelBtn = document.getElementById('cancelBetTracking');
        
        if (closeBtn) closeBtn.addEventListener('click', () => this.hideBetTrackingModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.hideBetTrackingModal());
        
        // Form submission
        const form = document.getElementById('betTrackingForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitBetTracking();
            });
        }
    }

    /**
     * Show bet tracking modal
     */
    showBetTrackingModal = (betData, isParlay = false) => {
        const modal = document.getElementById('betTrackingModal');
        if (!modal) return;
        
        this.currentBetData = betData;
        this.currentBetData.isParlay = isParlay;
        
        modal.classList.remove('hidden');
        modal.classList.add('fade-in');
        
        // Focus on stake input for better mobile UX
        setTimeout(() => {
            const stakeInput = document.getElementById('stakeAmount');
            if (stakeInput) stakeInput.focus();
        }, 300);
    }

    /**
     * Hide bet tracking modal
     */
    hideBetTrackingModal = () => {
        const modal = document.getElementById('betTrackingModal');
        if (!modal) return;
        
        modal.classList.add('hidden');
        modal.classList.remove('fade-in');
        
        // Clear form
        const form = document.getElementById('betTrackingForm');
        if (form) form.reset();
    }

    /**
     * Submit bet tracking
     */
    submitBetTracking = () => {
        const stake = parseFloat(document.getElementById('stakeAmount').value) || 0;
        const notes = document.getElementById('betNotes').value || '';
        
        if (stake <= 0) {
            this.showErrorToast('Please enter a valid stake amount');
            return;
        }
        
        const betData = {
            ...this.currentBetData,
            stake: stake,
            notes: notes,
            gameId: this.currentBetData.gameId || 'unknown',
            homeTeam: this.currentBetData.homeTeam || 'Unknown',
            awayTeam: this.currentBetData.awayTeam || 'Unknown'
        };
        
        // Add bet to tracking system
        const bet = this.engine.betTracker.addBet(betData);
        
        this.hideBetTrackingModal();
        this.showSuccessToast(`Bet tracked! ID: ${bet.id.slice(-6)}`);
    }

    /**
     * User preferences management
     */
    loadUserPreferences = () => {
        try {
            const stored = localStorage.getItem('mlb_user_preferences');
            return stored ? JSON.parse(stored) : {
                lastTab: 'quick-picks',
                filters: { confidence: 'all', betType: 'all' },
                notifications: true,
                theme: 'auto'
            };
        } catch {
            return {
                lastTab: 'quick-picks',
                filters: { confidence: 'all', betType: 'all' },
                notifications: true,
                theme: 'auto'
            };
        }
    }

    saveUserPreferences = () => {
        try {
            localStorage.setItem('mlb_user_preferences', JSON.stringify(this.userPreferences));
        } catch (error) {
            console.warn('Failed to save user preferences:', error);
        }
    }

    applyUserPreferences = () => {
        // Restore last tab
        if (this.userPreferences.lastTab) {
            this.switchTab(this.userPreferences.lastTab);
        }
        
        // Restore filters
        if (this.userPreferences.filters) {
            const confidenceFilter = document.getElementById('confidenceFilter');
            const betTypeFilter = document.getElementById('betTypeFilter');
            
            if (confidenceFilter) confidenceFilter.value = this.userPreferences.filters.confidence || 'all';
            if (betTypeFilter) betTypeFilter.value = this.userPreferences.filters.betType || 'all';
        }
    }

    /**
     * Utility functions
     */
    formatBetType = (type) => {
        const typeMap = {
            'moneyline': 'ML',
            'runline': 'RL', 
            'total': 'O/U',
            'player_prop': 'Prop',
            'parlay': 'Parlay'
        };
        return typeMap[type] || type;
    }

    createEmptyState = (message) => {
        const div = document.createElement('div');
        div.className = 'empty-state';
        
        const icon = document.createElement('i');
        icon.className = 'fas fa-search';
        div.appendChild(icon);
        
        const p = document.createElement('p');
        p.textContent = message;
        div.appendChild(p);
        
        return div;
    }
    
    getEmptyState = (message) => {
        const div = document.createElement('div');
        div.appendChild(this.createEmptyState(message));
        return div.innerHTML;
    }

    showSuccessToast(message) {
        this.showToast(message, 'success');
    }

    showErrorToast(message) {
        this.showToast(message, 'error');
    }

    showToast = (message, type = 'info') => {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Remove after delay
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }

    delay = (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    handleResize = () => {
        const newIsMobile = window.innerWidth <= 768;
        if (newIsMobile !== this.isMobile) {
            this.isMobile = newIsMobile;
            // Reapply mobile-specific features if needed
            if (this.isMobile) {
                this.setupMobileFeatures();
            }
        }
    }

    // Placeholder methods for states
    showWelcomeState() {
        document.getElementById('welcomeState')?.classList.remove('hidden');
        document.getElementById('resultsContainer')?.classList.add('hidden');
        document.getElementById('loadingState')?.classList.add('hidden');
        document.getElementById('errorState')?.classList.add('hidden');
    }

    hideWelcomeState() {
        document.getElementById('welcomeState')?.classList.add('hidden');
    }

    showLoadingState() {
        document.getElementById('loadingState')?.classList.remove('hidden');
        document.getElementById('resultsContainer')?.classList.add('hidden');
        document.getElementById('errorState')?.classList.add('hidden');
    }

    hideLoadingState() {
        document.getElementById('loadingState')?.classList.add('hidden');
    }

    showResultsContainer() {
        const container = document.getElementById('resultsContainer');
        if (container) {
            container.classList.remove('hidden');
            // Initialize any components that need setup after showing results
            this.initializeResultsComponents();
        }
    }

    initializeResultsComponents() {
        // Make sure all required elements are present and set up properly
        const requiredElements = [
            'totalOpportunities',
            'highConfidence',
            'gamesAnalyzed',
            'expertTrends'
        ];

        requiredElements.forEach(id => {
            const element = document.getElementById(id);
            if (!element) {
                console.warn(`Required element #${id} not found in the DOM`);
            }
        });
    }

    showErrorState(message) {
        try {
            // Ensure error container exists
            const errorContainer = SafeDOM.ensureContainer('errorState');
            if (!errorContainer) {
                console.error('Could not create error container');
                return;
            }

            // Create error message container if it doesn't exist
            let errorMessage = document.getElementById('errorMessage');
            if (!errorMessage) {
                errorMessage = SafeDOM.createElement('errorState', 'div', { id: 'errorMessage' });
            }

            // Set the error message
            SafeDOM.setText('errorMessage', message);

            // Update visibility
            SafeDOM.toggleClass('errorState', 'hidden', false);
            SafeDOM.toggleClass('loadingState', 'hidden', true);
            SafeDOM.toggleClass('resultsContainer', 'hidden', true);
        } catch (error) {
            console.error('Failed to show error state:', error);
        }
    }

    updateHeaderStats(results) {
        // Update mobile stats
        const totalOppEl = document.getElementById('totalOpportunities');
        const highConfEl = document.getElementById('highConfidence');
        const gamesAnalyzedEl = document.getElementById('gamesAnalyzed');
        const expertTrendsEl = document.getElementById('expertTrends');

        if (totalOppEl) {
            totalOppEl.textContent = (results.quickPicks?.length || 0) + (results.teamBets?.length || 0);
        }
        if (highConfEl) {
            highConfEl.textContent = [...(results.quickPicks || []), ...(results.teamBets || [])]
                .filter(r => (r.score || r.confidence) >= 8.0).length;
        }
        if (gamesAnalyzedEl) {
            gamesAnalyzedEl.textContent = results.summary?.totalGames || 0;
        }
        if (expertTrendsEl) {
            expertTrendsEl.textContent = results.enhancedData?.expertTrends?.summary?.strongConsensus || 0;
        }
        
        // Update desktop stats (if they exist)
        const desktopTotal = document.getElementById('totalOpportunitiesDesktop');
        const desktopHigh = document.getElementById('highConfidenceDesktop');
        const desktopGames = document.getElementById('gamesAnalyzedDesktop');
        
        if (desktopTotal) desktopTotal.textContent = 
            (results.quickPicks?.length || 0) + (results.teamBets?.length || 0);
        if (desktopHigh) desktopHigh.textContent = 
            [...(results.quickPicks || []), ...(results.teamBets || [])]
                .filter(r => (r.score || r.confidence) >= 8.0).length;
        if (desktopGames) desktopGames.textContent = results.summary?.totalGames || 0;
    }

    updateFilteredCounts(filteredData) {
        const totalFiltered = Object.values(filteredData).reduce((sum, arr) => sum + (arr?.length || 0), 0);
        const highConfFiltered = Object.values(filteredData)
            .flat()
            .filter(r => (r?.score || r?.confidence || 0) >= 8.0).length;
        
        document.getElementById('totalOpportunities').textContent = totalFiltered;
        document.getElementById('highConfidence').textContent = highConfFiltered;
    }

    refreshData() {
        this.runAnalysis();
    }

    showPullToRefreshIndicator() {
        // Implementation for pull-to-refresh visual feedback
    }

    hidePullToRefreshIndicator() {
        // Implementation for hiding pull-to-refresh indicator
    }

    registerServiceWorker() {
        // Future enhancement for offline capability
        if ('serviceWorker' in navigator) {
            // Register service worker for offline functionality
        }
    }
}

// Initialize the mobile app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.mlbApp = new MobileMLBApp();
});
