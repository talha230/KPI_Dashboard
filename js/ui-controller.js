// =============================================
// UI CONTROLLER - Handles all user interactions
// =============================================

const UI = {
    // Initialize
    init: function() {
        // Set up event listeners
        document.getElementById('plantFilter').addEventListener('change', () => ChartRenderer.updateAll());
        document.getElementById('showFactorBtn').addEventListener('click', () => this.showFactorPaste());
        
        // Try to load data from files first
        DataManager.init().catch(() => {
            // If files not found, show paste bar
            document.getElementById('pasteBar').classList.remove('hidden');
        });
    },
    
    // Show dashboard after data load
    showDashboard: function() {
        document.getElementById('pasteBar').classList.add('hidden');
        document.getElementById('factorPasteBar').style.display = 'none';
        document.getElementById('dashboardContent').style.display = 'block';
        document.getElementById('dataBadge').style.display = 'inline-block';
        document.getElementById('showFactorBtn').style.display = 'inline-block';
    },
    
    // Manual data paste (fallback)
    embedMainData: function() {
        const rawData = document.getElementById('mainDataInput').value.trim();
        if (!rawData) {
            alert('Please paste your data first');
            return;
        }
        
        DataManager.parseMainData(rawData);
        this.showDashboard();
        ChartRenderer.updateAll();
        document.getElementById('lastUpdated').innerText = 'Last updated: ' + new Date().toLocaleString();
    },
    
    // Manual factor data paste
    embedFactorData: function() {
        const kpi = document.getElementById('factorKPI').value;
        const rawData = document.getElementById('factorDataInput').value.trim();
        
        if (!rawData) {
            alert('Please paste factor data');
            return;
        }
        
        DataManager.parseFactorData(kpi, rawData);
        alert(`${kpi} factors loaded successfully!`);
        this.hideFactorPaste();
    },
    
    // Reset to paste bar
    resetDashboard: function() {
        if (confirm('Reset to paste new data?')) {
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