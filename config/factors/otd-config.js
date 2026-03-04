// config/factors/otd-config.js
const OTDConfig = {
    kpi: 'OTD',
    title: 'OTD Delay Analysis',
    description: 'Hierarchical view of On-Time vs Delayed orders',
    chartType: 'hierarchical',
    colors: {
        onTime: '#4caf50',
        delayed: '#f44336',
        responsibility: ['#ff9800', '#2196f3', '#9c27b0', '#00bcd4', '#ffeb3b']
    },
    dataFile: 'data/otd.txt',
    
    // Parse the detailed OTD data
    parseData: function(rawData) {
        console.log('Parsing OTD data...');
        const rows = rawData.split('\n').filter(row => row.trim());
        
        // Skip header row
        const dataRows = rows.slice(1);
        
        const months = new Set();
        const rawDataArray = [];
        
        dataRows.forEach(row => {
            const cols = row.split('\t').map(c => c.trim());
            if (cols.length < 6) return;
            
            const month = cols[0];
            const division = cols[1]; // HD5 or HD6
            const status = cols[2];
            const custId = cols[3];
            const responsibility = cols[4];
            const orders = parseInt(cols[5]) || 0;
            
            // Skip summary rows
            if (status.includes('Total')) return;
            if (!month || !division || !status || orders === 0) return;
            
            // Convert division to plant name
            const plant = division === 'HD5' ? 'Plant-05' : 'Plant-06';
            
            months.add(month);
            
            rawDataArray.push({
                month: month,
                plant: plant,
                status: status,
                custId: custId,
                responsibility: responsibility || 'Unassigned',
                orders: orders
            });
        });
        
        // Sort months (YTD last if exists)
        const sortedMonths = Array.from(months).sort((a,b) => {
            if (a === 'YTD') return 1;
            if (b === 'YTD') return -1;
            const monthOrder = {
                'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
                'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
            };
            return (monthOrder[a] || 99) - (monthOrder[b] || 99);
        });
        
        return {
            months: sortedMonths,
            rawData: rawDataArray
        };
    },
    
    // Get data for specific month
    getData: function(data, month) {
        if (month === 'YTD') {
            return data.rawData; // Return all data for YTD calculation
        }
        return data.rawData.filter(d => d.month === month);
    },
    
    // Calculate YTD totals
    calculateYTD: function(rawData) {
        const totalOrders = rawData.reduce((sum, d) => sum + d.orders, 0);
        const delayedOrders = rawData.filter(d => d.status === 'Delayed')
            .reduce((sum, d) => sum + d.orders, 0);
        const onTimeOrders = rawData.filter(d => d.status === 'On Time')
            .reduce((sum, d) => sum + d.orders, 0);
        
        return {
            total: totalOrders,
            delayed: delayedOrders,
            onTime: onTimeOrders,
            delayedPercent: totalOrders > 0 ? (delayedOrders / totalOrders * 100).toFixed(1) : 0,
            onTimePercent: totalOrders > 0 ? (onTimeOrders / totalOrders * 100).toFixed(1) : 0
        };
    },
    
    // Get responsibility breakdown
    getResponsibilityData: function(rawData, totalOrders) {
        const respData = {};
        rawData.filter(d => d.status === 'Delayed' && d.responsibility)
            .forEach(d => {
                if (!respData[d.responsibility]) {
                    respData[d.responsibility] = 0;
                }
                respData[d.responsibility] += d.orders;
            });
        
        return Object.entries(respData).map(([resp, count]) => ({
            responsibility: resp,
            count: count,
            percent: (count / totalOrders * 100).toFixed(1)
        })).sort((a, b) => b.count - a.count);
    },
    
    // Get customer breakdown
    getCustomerData: function(rawData, responsibility, totalOrders) {
        const custData = {};
        rawData.filter(d => d.status === 'Delayed' && d.responsibility === responsibility && d.custId)
            .forEach(d => {
                if (!custData[d.custId]) {
                    custData[d.custId] = 0;
                }
                custData[d.custId] += d.orders;
            });
        
        return Object.entries(custData).map(([custId, count]) => ({
            customer: custId,
            count: count,
            percent: (count / totalOrders * 100).toFixed(1)
        })).sort((a, b) => b.count - a.count);
    }
};

registerFactor('OTD', OTDConfig);