// =============================================
// CONFIGURATION - Easy to modify
// =============================================

const CONFIG = {
    // Month order for sorting
    monthOrder: {
        'Jul-25': 1, 'Aug-25': 2, 'Sep-25': 3, 'Oct-25': 4, 'Nov-25': 5, 'Dec-25': 6,
        'Jan-26': 7, 'Feb-26': 8, 'Mar-26': 9, 'Apr-26': 10, 'May-26': 11, 'Jun-26': 12
    },
    
    // Plant colors
    colors: {
        'Plant-05': '#2196f3',
        'Plant-06': '#ff9800',
        'target-green': '#8bc34a',
        'target-red': '#ff6b6b'
    },
    
    // KPIs that have factor buttons (now loaded from registry)
    get factorKPIs() {
        return getAllFactors ? getAllFactors() : [];
    },
    
    // Default direction if not specified
    defaultDirection: 'HIGHER_IS_BETTER',
    
    // Chart dimensions
    chartHeight: 260,
    
    // Y-axis padding (to prevent cutoff)
    yAxisPadding: 1.15,
    
    // Data file paths (relative to index.html)
    dataFiles: {
        main: 'data/main-data.txt',
        factors: {
            OTD: 'data/otd.txt',
            OEE: 'data/oee.txt',
            YMR: 'data/ymr.txt'
        }
    }
};