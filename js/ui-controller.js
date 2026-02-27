// =============================================
// UI CONTROLLER - Handles all user interactions
// =============================================

const UI = {
    // Initialize
    init: function() {
        console.log('UI Controller initializing...');
        
        // Set up event listeners
        const plantFilter = document.getElementById('plantFilter');
        if (plantFilter) {
            plantFilter.addEventListener('change', () => ChartRenderer.updateAll());
        }
        
        const showFactorBtn = document.getElementById('showFactorBtn');
        if (showFactorBtn) {
            showFactorBtn.addEventListener('click', () => this.showFactorPaste());
        }
        
        // Try to load data from files first
        this.loadFromFiles();
    },
    
    // Load data from files
    loadFromFiles: async function() {
        try {
            await DataManager.loadMainData();
            await DataManager.loadAllFactorData();
            this.showDashboard();
            ChartRenderer.updateAll();
            document.getElementById('lastUpdated').innerText = 'Data loaded from files: ' + new Date().toLocaleString();
        } catch (error) {
            console.log('No data files found, showing paste bar');
            document.getElementById('pasteBar').classList.remove('hidden');
        }
    },
    
    // Show dashboard after data load
    showDashboard: function() {
        document.getElementById('pasteBar').classList.add('hidden');
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
            document.getElementById('pasteBar').classList.remove('hidden');
            document.getElementById('factorPasteBar').style.display = 'none';
            document.getElementById('dashboardContent').style.display = 'none';
            document.getElementById('dataBadge').style.display = 'none';
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