// config/factors/ymr-config.js
const YMRConfig = {
    kpi: 'YMR',
    title: 'YMR Breakdown',
    description: 'Yield components',
    chartType: 'donut',
    colors: ['#4caf50', '#f44336', '#ff9800', '#9c27b0', '#2196f3', '#ffeb3b'],
    dataFile: 'data/ymr.txt',
    
    // Parse YMR data
    parseData: function(rawData) {
        console.log('Parsing YMR data...');
        const rows = rawData.split('\n').filter(row => row.trim());
        
        // Skip header row
        const dataRows = rows.slice(1);
        
        const plant05Data = [];
        const plant06Data = [];
        const months = new Set();
        
        dataRows.forEach(row => {
            const cols = row.split('\t');
            if (cols.length < 4) return;
            
            const plant = cols[0].trim();
            const month = cols[1].trim();
            const attribute = cols[2].trim();
            const valueStr = cols[3].trim();
            
            const value = parseFloat(valueStr.replace('%', '')) || 0;
            
            months.add(month);
            
            const dataPoint = {
                month: month,
                reason: attribute,
                value: value
            };
            
            if (plant === 'Plant-05') {
                plant05Data.push(dataPoint);
            } else if (plant === 'Plant-06') {
                plant06Data.push(dataPoint);
            }
        });
        
        // Sort months with YTD last
        const sortedMonths = Array.from(months).sort((a,b) => {
            if (a === 'YTD') return 1;
            if (b === 'YTD') return -1;
            const monthOrder = {
                'Jul-25': 1, 'Aug-25': 2, 'Sep-25': 3, 'Oct-25': 4, 'Nov-25': 5, 'Dec-25': 6,
                'Jan-26': 7, 'Feb-26': 8
            };
            return (monthOrder[a] || 99) - (monthOrder[b] || 99);
        });
        
        return {
            plant05: plant05Data,
            plant06: plant06Data,
            months: sortedMonths
        };
    },
    
    // Get data for specific month and plant
    getData: function(data, plant, month) {
        const plantData = plant === 'Plant-05' ? data.plant05 : data.plant06;
        return plantData.filter(d => d.month === month);
    },
    
    // Get donut data (Knitting Yield vs % Waste)
    getDonutData: function(data, plant, month) {
        const plantData = plant === 'Plant-05' ? data.plant05 : data.plant06;
        const monthData = plantData.filter(d => d.month === month);
        
        const knittingYield = monthData.find(d => d.reason === 'Knitting Yield')?.value || 0;
        const waste = monthData.find(d => d.reason === '% Waste')?.value || 0;
        
        return { knittingYield, waste };
    },
    
    // Get component data (all other factors)
    getComponentData: function(data, plant, month) {
        const plantData = plant === 'Plant-05' ? data.plant05 : data.plant06;
        const monthData = plantData.filter(d => d.month === month);
        
        return monthData.filter(d => 
            d.reason !== 'Knitting Yield' && 
            d.reason !== '% Waste' &&
            Math.abs(d.value) > 0.01
        );
    }
};

registerFactor('YMR', YMRConfig);