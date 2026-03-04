// =============================================
// UI CONTROLLER - Handles all user interactions
// =============================================

const UI = {
    // Initialize
    init: function() {
        console.log('UI Controller initializing...');
        console.log('Current path:', window.location.pathname);
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Try to load data from files first
        this.loadFromFiles();
    },
    
    setupEventListeners: function() {
        // Plant filter
        const plantFilter = document.getElementById('plantFilter');
        if (plantFilter) {
            plantFilter.addEventListener('change', () => ChartRenderer.updateAll());
        }
        
        // Theme selector
        const themeSelector = document.getElementById('themeSelector');
        if (themeSelector) {
            themeSelector.addEventListener('change', (e) => this.changeTheme(e.target.value));
            // Set initial theme
            this.changeTheme(themeSelector.value);
        }
        
        // Show/Hide values buttons
        const showBtn = document.getElementById('showBtn');
        const hideBtn = document.getElementById('hideBtn');
        if (showBtn) {
            showBtn.addEventListener('click', () => this.setValueDisplay(true));
        }
        if (hideBtn) {
            hideBtn.addEventListener('click', () => this.setValueDisplay(false));
        }
        
        // Show factor paste button
        const showFactorBtn = document.getElementById('showFactorBtn');
        if (showFactorBtn) {
            showFactorBtn.addEventListener('click', () => this.showFactorPaste());
        }
        
        // Reset link
        const resetLink = document.getElementById('resetLink');
        if (resetLink) {
            resetLink.addEventListener('click', () => this.resetDashboard());
        }
        
        // Data badge
        const dataBadge = document.getElementById('dataBadge');
        if (dataBadge) {
            dataBadge.addEventListener('click', () => this.showPasteBar());
        }
        
        // Modal close button
        const closeModalBtn = document.getElementById('closeModalBtn');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => this.closeModal());
        }
        
        // Factor tabs
        const tabOTD = document.getElementById('tabOTD');
        const tabOEE = document.getElementById('tabOEE');
        const tabYMR = document.getElementById('tabYMR');
        
        if (tabOTD) {
            tabOTD.addEventListener('click', () => Factors.switchTab('OTD'));
        }
        if (tabOEE) {
            tabOEE.addEventListener('click', () => Factors.switchTab('OEE'));
        }
        if (tabYMR) {
            tabYMR.addEventListener('click', () => Factors.switchTab('YMR'));
        }
        
        // Factor filters
        const factorMonthSelect = document.getElementById('factorMonthSelect');
        const factorPlantSelect = document.getElementById('factorPlantSelect');
        
        if (factorMonthSelect) {
            factorMonthSelect.addEventListener('change', (e) => Factors.changeMonth(e.target.value));
        }
        if (factorPlantSelect) {
            factorPlantSelect.addEventListener('change', (e) => Factors.changePlant(e.target.value));
        }
        
        // Create dashboard button
        const createBtn = document.querySelector('button[onclick="UI.embedMainData()"]');
        if (createBtn) {
            createBtn.onclick = () => this.embedMainData();
        }
        
        // Clear button
        const clearBtn = document.querySelector('button[onclick="UI.resetDashboard()"]');
        if (clearBtn) {
            clearBtn.onclick = () => this.resetDashboard();
        }
        
        // Load factors button
        const loadFactorsBtn = document.querySelector('button[onclick="UI.embedFactorData()"]');
        if (loadFactorsBtn) {
            loadFactorsBtn.onclick = () => this.embedFactorData();
        }
        
        // Cancel factor button
        const cancelFactorBtn = document.querySelector('button[onclick="UI.hideFactorPaste()"]');
        if (cancelFactorBtn) {
            cancelFactorBtn.onclick = () => this.hideFactorPaste();
        }
    },
    
    // Change theme for entire screen
    changeTheme: function(themeName) {
        document.body.className = '';
        document.body.classList.add('theme-' + themeName);
        if (ChartRenderer) {
            ChartRenderer.changeTheme(themeName);
        }
    },
    
    // Load data from files
    loadFromFiles: async function() {
        try {
            console.log('Attempting to load data from files...');
            
            // Try to load main data
            const mainLoaded = await DataManager.loadMainData();
            
            if (mainLoaded) {
                console.log('Main data loaded successfully');
                
                // Try to load factor data
                try {
                    await DataManager.loadAllFactorData();
                    console.log('Factor data loaded successfully');
                } catch (err) {
                    console.log('Factor data not found:', err);
                }
                
                this.showDashboard();
                ChartRenderer.updateAll();
                document.getElementById('lastUpdated').innerText = 'Data loaded from files: ' + new Date().toLocaleString();
            } else {
                throw new Error('No main data file found');
            }
        } catch (error) {
            console.log('No data files found, showing paste bar:', error);
            document.getElementById('pasteBar').style.display = 'block';
        }
    },
    
    // Show dashboard after data load
    showDashboard: function() {
        document.getElementById('pasteBar').style.display = 'none';
        document.getElementById('factorPasteBar').style.display = 'none';
        document.getElementById('dashboardContent').style.display = 'block';
        document.getElementById('dataBadge').style.display = 'inline-block';
        document.getElementById('showFactorBtn').style.display = 'inline-block';
    },
    
    // Manual main data paste
    embedMainData: function() {
        console.log('Embedding main data...');
        
        const input = document.getElementById('mainDataInput');
        if (!input) {
            alert('Input field not found');
            return;
        }
        
        const rawData = input.value.trim();
        if (!rawData) {
            alert('Please paste your data first');
            return;
        }
        
        // Parse data
        DataManager.parseMainData(rawData);
        
        // Check if we got any data
        if (DataManager.monthlyData.length === 0 && DataManager.ytdData.length === 0) {
            alert('No valid data found. Please check your format.');
            return;
        }
        
        console.log(`✅ Parsed ${DataManager.monthlyData.length} monthly rows and ${DataManager.ytdData.length} YTD rows`);
        
        // Show dashboard
        this.showDashboard();
        ChartRenderer.updateAll();
        document.getElementById('lastUpdated').innerText = 'Last updated: ' + new Date().toLocaleString();
        
        // Clear the textarea
        input.value = '';
    },
    
    // Manual factor data paste
    embedFactorData: function() {
        console.log('Embedding factor data...');
        
        const kpiSelect = document.getElementById('factorKPI');
        const input = document.getElementById('factorDataInput');
        
        if (!kpiSelect || !input) {
            alert('Input fields not found');
            return;
        }
        
        const kpi = kpiSelect.value;
        const rawData = input.value.trim();
        
        if (!rawData) {
            alert('Please paste factor data first');
            return;
        }
        
        const config = getFactorConfig(kpi);
        if (!config) {
            alert(`No configuration found for ${kpi}`);
            return;
        }
        
        try {
            // Parse the factor data
            DataManager.factorData[kpi] = config.parseData(rawData);
            console.log(`✅ Loaded ${kpi} factor data`);
            
            // Show success message
            alert(`${kpi} factors loaded successfully!`);
            
            // Clear the textarea and hide paste bar
            input.value = '';
            this.hideFactorPaste();
            
            // If we have main data already, update the factor buttons
            if (document.getElementById('dashboardContent').style.display === 'block') {
                ChartRenderer.updateAll();
            }
            
            // Update month filter for this KPI
            if (Factors.currentKPI === kpi) {
                Factors.updateMonthFilter(kpi);
            }
            
        } catch (error) {
            console.error('Error parsing factor data:', error);
            alert(`Error parsing ${kpi} data. Please check your format.`);
        }
    },
    
    // Reset to paste bar
    resetDashboard: function() {
        if (confirm('Reset to paste new data?')) {
            // Clear all data
            DataManager.monthlyData = [];
            DataManager.ytdData = [];
            DataManager.factorData = {};
            
            // Reset UI
            document.getElementById('pasteBar').style.display = 'block';
            document.getElementById('factorPasteBar').style.display = 'none';
            document.getElementById('dashboardContent').style.display = 'none';
            document.getElementById('dataBadge').style.display = 'none';
            document.getElementById('showFactorBtn').style.display = 'none';
            document.getElementById('mainDataInput').value = '';
            document.getElementById('factorDataInput').value = '';
        }
    },
    
    // Show factor paste bar
    showFactorPaste: function() {
        document.getElementById('factorPasteBar').style.display = 'block';
    },
    
    // Hide factor paste bar
    hideFactorPaste: function() {
        document.getElementById('factorPasteBar').style.display = 'none';
        document.getElementById('factorDataInput').value = '';
    },
    
    // Show paste bar from badge
    showPasteBar: function() {
        if (confirm('Replace current data with new data?')) {
            this.resetDashboard();
        }
    },
    
    // Toggle value display
    setValueDisplay: function(show) {
        ChartRenderer.showValues = show;
        document.getElementById('showBtn').className = show ? 'value-btn active' : 'value-btn';
        document.getElementById('hideBtn').className = show ? 'value-btn' : 'value-btn active';
        ChartRenderer.updateAll();
    },
    
    // Close modal
    closeModal: function() {
        document.getElementById('factorModal').classList.remove('active');
    }
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => UI.init());