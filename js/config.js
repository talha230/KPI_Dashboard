// =============================================
// CONFIGURATION - Easy to modify
// =============================================

const CONFIG = {
    // Month order for sorting
    monthOrder: {
        'Jul-25': 1, 'Aug-25': 2, 'Sep-25': 3, 'Oct-25': 4, 'Nov-25': 5, 'Dec-25': 6,
        'Jan-26': 7, 'Feb-26': 8, 'Mar-26': 9, 'Apr-26': 10, 'May-26': 11, 'Jun-26': 12,
        'Jul': 1, 'Aug': 2, 'Sep': 3, 'Oct': 4, 'Nov': 5, 'Dec': 6,
        'Jan': 7, 'Feb': 8, 'Mar': 9, 'Apr': 10, 'May': 11, 'Jun': 12
    },
    
    // Plant colors
    colors: {
        'Plant-05': '#2196f3',
        'Plant-06': '#ff9800',
        'target-green': '#8bc34a',
        'target-red': '#ff6b6b'
    },
    
    // Default direction if not specified
    defaultDirection: 'HIGHER_IS_BETTER',
    
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