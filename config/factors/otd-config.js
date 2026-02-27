// config/factors/otd-config.js
const OTDConfig = {
    kpi: 'OTD',
    title: 'OTD Delay Reasons',
    description: 'Percentage of delayed orders by reason',
    chartType: 'bar',
    colors: ['#ff9800', '#2196f3', '#4caf50', '#f44336', '#9c27b0', '#ffeb3b'],
    dataFile: 'data/otd.txt',
    
    // Parse OTD data from your specific format
    parseData: function(rawData) {
        console.log('Parsing OTD data...');
        const rows = rawData.split('\n').filter(row => row.trim());
        
        // Skip first two header rows
        const dataRows = rows.slice(2);
        
        const plant05Data = [];
        const plant06Data = [];
        const months = new Set();
        
        dataRows.forEach(row => {
            const cols = row.split('\t');
            if (cols.length < 7) return;
            
            const month = cols[0].trim();
            const status = cols[1].trim();
            const responsibility = cols[2].trim();
            const p05Percent = parseFloat(cols[4]?.replace('%', '')) || 0;
            const p06Percent = parseFloat(cols[6]?.replace('%', '')) || 0;
            
            months.add(month);
            
            if (status === 'Delayed' && responsibility !== 'On Time') {
                // Clean up responsibility name
                let reason = responsibility;
                if (reason.includes('P & S')) reason = 'P&S Yarns';
                if (reason.includes('Logistics')) reason = 'Logistics';
                if (reason.includes('AR/OSP')) reason = 'AR/OSP';
                if (reason === '') reason = 'Unspecified';
                
                plant05Data.push({
                    month,
                    reason,
                    value: p05Percent
                });
                
                plant06Data.push({
                    month,
                    reason,
                    value: p06Percent
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
            });
        } else {
            // Filter by month
            const monthData = plantData.filter(d => d.month === month);
            const reasons = [...new Set(monthData.map(d => d.reason))];
            return reasons.map(reason => {
                const value = monthData.find(d => d.reason === reason)?.value || 0;
                return { reason, value };
            });
        }
    }
};

registerFactor('OTD', OTDConfig);