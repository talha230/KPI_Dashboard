// config/factors/oee-config.js
const OEEConfig = {
    kpi: 'OEE',
    title: 'OEE Loss Factors',
    description: 'Loss percentage by factor',
    chartType: 'horizontalBar',
    colors: ['#f44336', '#ff9800', '#2196f3', '#4caf50', '#9c27b0', '#ffeb3b', '#00bcd4', '#e91e63'],
    dataFile: 'data/oee.txt',
    
    // Parse OEE data
    parseData: function(rawData) {
        console.log('Parsing OEE data...');
        const rows = rawData.split('\n').filter(row => row.trim());
        
        // Skip header row
        const dataRows = rows.slice(1);
        
        const plant05Data = [];
        const plant06Data = [];
        const months = new Set();
        
        dataRows.forEach(row => {
            const cols = row.split('\t');
            if (cols.length < 4) return;
            
            const month = cols[0].trim();
            const factor = cols[1].trim();
            const p05Val = parseFloat(cols[2]?.replace('%', '')) || 0;
            const p06Val = parseFloat(cols[3]?.replace('%', '')) || 0;
            
            months.add(month);
            
            if (p05Val > 0) {
                plant05Data.push({ month, reason: factor, value: p05Val });
            }
            
            if (p06Val > 0) {
                plant06Data.push({ month, reason: factor, value: p06Val });
            }
        });
        
        // Sort months with YTD last
        const sortedMonths = Array.from(months).sort((a,b) => {
            if (a === 'YTD') return 1;
            if (b === 'YTD') return -1;
            return 0;
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
        
        if (month === 'YTD') {
            // Average across all months for YTD
            const reasons = [...new Set(plantData.map(d => d.reason))];
            return reasons.map(reason => {
                const values = plantData.filter(d => d.reason === reason).map(d => d.value);
                const avg = values.reduce((a,b) => a + b, 0) / values.length;
                return { reason, value: avg };
            }).filter(d => d.value > 0.1).sort((a,b) => b.value - a.value);
        } else {
            // Filter by specific month
            const monthData = plantData.filter(d => d.month === month);
            const reasons = [...new Set(monthData.map(d => d.reason))];
            return reasons.map(reason => {
                const value = monthData.find(d => d.reason === reason)?.value || 0;
                return { reason, value };
            }).filter(d => d.value > 0.1).sort((a,b) => b.value - a.value);
        }
    },
    
    // Get YTD data (averaged)
    getYTDData: function(data, plant) {
        return this.getData(data, plant, 'YTD');
    }
};

registerFactor('OEE', OEEConfig);