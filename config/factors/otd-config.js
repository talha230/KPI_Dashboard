// config/factors/otd-config.js
const OTDConfig = {
    kpi: 'OTD',
    title: 'OTD Delay Analysis',
    description: 'Hierarchical view of On-Time vs Delayed orders',
    chartType: 'hierarchical',  // Special type for drill-down
    colors: {
        onTime: '#4caf50',
        delayed: '#f44336',
        responsibility: ['#ff9800', '#2196f3', '#9c27b0', '#00bcd4', '#ffeb3b']
    },
    dataFile: 'data/otd.txt',
    
    // Parse the detailed OTD data
    parseData: function(rawData) {
        console.log('Parsing hierarchical OTD data...');
        const rows = rawData.split('\n').filter(row => row.trim());
        
        // Skip header row
        const dataRows = rows.slice(1);
        
        const months = new Set();
        const totals = {}; // { month: { totalOrders, onTime, delayed } }
        const delaysByResponsibility = {}; // { month: { responsibility: count } }
        const delaysByCustomer = {}; // { month: { custId: { total, byResponsibility } } }
        
        dataRows.forEach(row => {
            const cols = row.split('\t').map(c => c.trim());
            if (cols.length < 6) return;
            
            const month = cols[0];
            const status = cols[1];
            const custId = cols[2];
            const responsibility = cols[3];
            const hd5 = parseInt(cols[4]) || 0;
            const hd6 = parseInt(cols[5]) || 0;
            
            months.add(month);
            
            // Initialize month data
            if (!totals[month]) {
                totals[month] = { totalOrders: 0, onTime: 0, delayed: 0 };
                delaysByResponsibility[month] = {};
                delaysByCustomer[month] = {};
            }
            
            // Add to totals (both plants combined for percentage calculation)
            const totalForRow = hd5 + hd6;
            totals[month].totalOrders += totalForRow;
            
            if (status === 'On Time') {
                totals[month].onTime += totalForRow;
            } else if (status === 'Delayed') {
                totals[month].delayed += totalForRow;
                
                // Track by responsibility
                if (!delaysByResponsibility[month][responsibility]) {
                    delaysByResponsibility[month][responsibility] = 0;
                }
                delaysByResponsibility[month][responsibility] += totalForRow;
                
                // Track by customer
                if (custId) {
                    if (!delaysByCustomer[month][custId]) {
                        delaysByCustomer[month][custId] = {
                            total: 0,
                            byResponsibility: {}
                        };
                    }
                    delaysByCustomer[month][custId].total += totalForRow;
                    
                    if (!delaysByCustomer[month][custId].byResponsibility[responsibility]) {
                        delaysByCustomer[month][custId].byResponsibility[responsibility] = 0;
                    }
                    delaysByCustomer[month][custId].byResponsibility[responsibility] += totalForRow;
                }
            }
        });
        
        // Calculate percentages
        const result = {};
        Array.from(months).forEach(month => {
            const total = totals[month].totalOrders;
            const onTime = totals[month].onTime;
            const delayed = totals[month].delayed;
            
            // On-Time vs Delayed percentages
            result[month] = {
                total: total,
                onTime: {
                    count: onTime,
                    percentage: (onTime / total * 100).toFixed(1)
                },
                delayed: {
                    count: delayed,
                    percentage: (delayed / total * 100).toFixed(1),
                    byResponsibility: {},
                    byCustomer: {}
                }
            };
            
            // Calculate responsibility percentages (of total orders)
            Object.entries(delaysByResponsibility[month] || {}).forEach(([resp, count]) => {
                result[month].delayed.byResponsibility[resp] = {
                    count: count,
                    percentage: (count / total * 100).toFixed(1)
                };
            });
            
            // Calculate customer percentages (of total orders)
            Object.entries(delaysByCustomer[month] || {}).forEach(([custId, data]) => {
                result[month].delayed.byCustomer[custId] = {
                    count: data.total,
                    percentage: (data.total / total * 100).toFixed(1),
                    byResponsibility: {}
                };
                
                // Calculate responsibility percentages within this customer
                Object.entries(data.byResponsibility).forEach(([resp, count]) => {
                    result[month].delayed.byCustomer[custId].byResponsibility[resp] = {
                        count: count,
                        percentage: (count / data.total * 100).toFixed(1)
                    };
                });
            });
        });
        
        // Sort months
        const sortedMonths = Array.from(months).sort(
            (a,b) => CONFIG.monthOrder[a] - CONFIG.monthOrder[b]
        );
        
        return {
            months: sortedMonths,
            data: result
        };
    },
    
    // Get data for specific month
    getData: function(data, month) {
        return data.data[month] || null;
    },
    
    // Get available months
    getMonths: function(data) {
        return data.months;
    }
};

registerFactor('OTD', OTDConfig);