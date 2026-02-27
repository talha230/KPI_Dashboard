// config/factors/oee-config.js
const OEEConfig = {
    kpi: 'OEE',
    title: 'OEE Loss Factors',
    description: 'Loss percentage by factor',
    chartType: 'horizontalBar',
    colors: ['#f44336', '#ff9800', '#2196f3', '#4caf50', '#9c27b0', '#ffeb3b', '#00bcd4', '#e91e63'],
    dataFile: 'data/oee.txt',
    
    // Parse OEE data from your specific format
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
                plant05Data.push({
                    month,
                    reason: factor,
                    value: p05Val
                });
            }
            
            if (p06Val > 0) {
                plant06Data.push({
                    month,
                    reason: factor,
                    value: p06Val
                });
            }
        });
        
        return {
            plant05: plant05Data,
            plant06: plant06Data,
            months: Array.from(months).sort((a,b) => CONFIG.monthOrder[a] - CONFIG.monthOrder[b])
        };
    },
    
    // Get data for specific month and plant
    getData: function(data, plant, month) {
        const plantData = plant === 'Plant-05' ? data.plant05 : data.plant06;
        
        if (month === 'All') {
            // Average across all months
            const reasons = [...new Set(plantData.map(d => d.reason))];
            return reasons.map(reason => {
                const values = plantData.filter(d => d.reason === reason).map(d => d.value);
                const avg = values.reduce((a,b) => a + b, 0) / values.length;
                return { reason, value: avg };
            }).sort((a,b) => b.value - a.value);
        } else {
            // Filter by month
            const monthData = plantData.filter(d => d.month === month);
            return monthData.map(d => ({ reason: d.reason, value: d.value }))
                           .sort((a,b) => b.value - a.value);
        }
    }
};

registerFactor('OEE', OEEConfig);