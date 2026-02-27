// config/factors/ymr-config.js
const YMRConfig = {
    kpi: 'YMR',
    title: 'YMR Breakdown',
    description: 'Yield components',
    chartType: 'donut',
    colors: ['#4caf50', '#f44336', '#ff9800', '#9c27b0', '#2196f3', '#ffeb3b'],
    dataFile: 'data/ymr.txt',
    
    // Parse YMR data from your specific format
    parseData: function(rawData) {
        console.log('Parsing YMR data...');
        const rows = rawData.split('\n').filter(row => row.trim());
        
        // Skip header row
        const dataRows = rows.slice(1);
        
        const plant05Data = [];
        const plant06Data = [];
        const months = new Set();
        
        // Map parameter names to display names
        const paramMap = {
            'C Grade': 'C Grade',
            'Shortfall': 'Shortfall',
            'Yarn Waste': 'Yarn Waste',
            'UC Small Lots': 'UC Small Lots',
            'Knitting Yield': 'Knitting Yield',
            'Invisible': 'Invisible G/L'
        };
        
        dataRows.forEach(row => {
            const cols = row.split('\t');
            if (cols.length < 4) return;
            
            const month = cols[0].trim();
            let parameter = cols[1].replace(/\n/g, ' ').trim();
            const p05Val = parseFloat(cols[2]?.replace('%', '')) || 0;
            const p06Val = parseFloat(cols[3]?.replace('%', '')) || 0;
            
            months.add(month);
            
            // Simplify parameter name
            let displayName = parameter;
            if (parameter.includes('C Grade')) displayName = 'C Grade';
            else if (parameter.includes('Shortfall')) displayName = 'Shortfall';
            else if (parameter.includes('Yarn Waste')) displayName = 'Yarn Waste';
            else if (parameter.includes('UC Small')) displayName = 'UC Small Lots';
            else if (parameter.includes('Knitting Yield')) displayName = 'Knitting Yield';
            else if (parameter.includes('Invisible')) displayName = 'Invisible G/L';
            
            plant05Data.push({
                month,
                reason: displayName,
                value: p05Val
            });
            
            plant06Data.push({
                month,
                reason: displayName,
                value: p06Val
            });
        });
        
        return {
            plant05: plant05Data,
            plant06: plant06Data,
            months: Array.from(months).sort((a,b) => CONFIG.monthOrder[a] - CONFIG.monthOrder[b])
        };
    },
    
    // Get data for specific month and plant (for donut chart)
    getData: function(data, plant, month) {
        const plantData = plant === 'Plant-05' ? data.plant05 : data.plant06;
        
        if (month === 'All') {
            // Average across all months
            const reasons = [...new Set(plantData.map(d => d.reason))];
            return reasons.map(reason => {
                const values = plantData.filter(d => d.reason === reason).map(d => d.value);
                const avg = values.reduce((a,b) => a + b, 0) / values.length;
                return { reason, value: avg };
            }).filter(d => d.value > 0.1); // Filter out near-zero values
        } else {
            // Filter by month
            const monthData = plantData.filter(d => d.month === month);
            const reasons = [...new Set(monthData.map(d => d.reason))];
            return reasons.map(reason => {
                const value = monthData.find(d => d.reason === reason)?.value || 0;
                return { reason, value };
            }).filter(d => d.value > 0.1); // Filter out near-zero values
        }
    }
};

registerFactor('YMR', YMRConfig);