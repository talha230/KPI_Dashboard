// =============================================
// CHART RENDERER - Handles all chart creation
// =============================================

const ChartRenderer = {
    showValues: true,
    
    // Update all charts and table
    updateAll: function() {
        const plantFilter = document.getElementById('plantFilter').value;
        const kpis = [...new Set([...DataManager.monthlyData.map(d => d.KPI), 
                                  ...DataManager.ytdData.map(d => d.KPI)])].sort();
        const latestMonth = this.getLatestMonth();
        const latestMonthly = DataManager.monthlyData.filter(d => d.Month === latestMonth);
        
        this.renderGrid(kpis, latestMonthly, plantFilter);
        this.renderTable(kpis, latestMonthly);
    },
    
    // Render KPI grid
    renderGrid: function(kpis, latestMonthly, plantFilter) {
        const grid = document.getElementById('kpiGrid');
        grid.innerHTML = '';
        
        kpis.forEach(kpi => {
            const plant05monthly = latestMonthly.find(d => d.Plant === 'Plant-05' && d.KPI === kpi);
            const plant06monthly = latestMonthly.find(d => d.Plant === 'Plant-06' && d.KPI === kpi);
            
            if (!plant05monthly && !plant06monthly) return;
            
            const card = this.createCard(kpi, plant05monthly, plant06monthly, plantFilter);
            grid.appendChild(card);
            
            // Create chart after card is added
            setTimeout(() => this.createChart(kpi, plantFilter), 100);
        });
    },
    
    // Create individual card
    createCard: function(kpi, plant05, plant06, plantFilter) {
        const direction = plant05?.Direction || plant06?.Direction || CONFIG.defaultDirection;
        const card = document.createElement('div');
        card.className = 'kpi-card';
        card.id = `card-${kpi}`;
        
        const chartId = 'chart_' + kpi.replace(/[^a-zA-Z0-9]/g, '_');
        
        // Add YTD boxes
        const ytdHtml = this.createYTDBoxes(kpi, direction);
        
        // Add factor button if applicable
        const factorButton = CONFIG.factorKPIs.includes(kpi) ? 
            `<button class="factor-btn" onclick="Factors.openModal('${kpi}')">🔍 VIEW ${kpi} FACTORS</button>` : '';
        
        card.innerHTML = `
            <div class="kpi-header">
                <span class="kpi-title">${kpi}</span>
                <span class="direction-badge ${direction === 'HIGHER_IS_BETTER' ? 'higher' : 'lower'}">
                    ${direction === 'HIGHER_IS_BETTER' ? '↑ HIGHER IS BETTER' : '↓ LOWER IS BETTER'}
                </span>
            </div>
            <div class="kpi-content">
                <div id="${chartId}" class="chart-container"></div>
                ${ytdHtml}
                ${factorButton}
            </div>
        `;
        
        return card;
    },
    
    // Create YTD boxes HTML
    createYTDBoxes: function(kpi, direction) {
        const plant05ytd = DataManager.ytdData.find(d => d.Plant === 'Plant-05' && d.KPI === kpi);
        const plant06ytd = DataManager.ytdData.find(d => d.Plant === 'Plant-06' && d.KPI === kpi);
        
        if (plant05ytd && plant06ytd) {
            const plant05Good = this.isGood(plant05ytd.Achieved, plant05ytd.Target, direction);
            const plant06Good = this.isGood(plant06ytd.Achieved, plant06ytd.Target, direction);
            
            return `
                <div class="ytd-container">
                    <div class="ytd-box plant05">
                        <div class="ytd-label">PLANT-05 YTD</div>
                        <div class="ytd-value" style="color: ${plant05Good ? CONFIG.colors['target-green'] : CONFIG.colors['target-red']}">
                            ${this.formatValue(plant05ytd.Achieved, plant05ytd.IsPercent)}
                        </div>
                        <div class="ytd-target">Target: ${this.formatValue(plant05ytd.Target, plant05ytd.IsPercent)}</div>
                    </div>
                    <div class="ytd-box plant06">
                        <div class="ytd-label">PLANT-06 YTD</div>
                        <div class="ytd-value" style="color: ${plant06Good ? CONFIG.colors['target-green'] : CONFIG.colors['target-red']}">
                            ${this.formatValue(plant06ytd.Achieved, plant06ytd.IsPercent)}
                        </div>
                        <div class="ytd-target">Target: ${this.formatValue(plant06ytd.Target, plant06ytd.IsPercent)}</div>
                    </div>
                </div>
            `;
        }
        return '';
    },
    
    // Create individual chart
    createChart: function(kpi, plantFilter) {
        const allMonthly = DataManager.monthlyData.filter(d => d.KPI === kpi);
        const direction = allMonthly[0]?.Direction || CONFIG.defaultDirection;
        const months = this.sortMonths([...new Set(allMonthly.map(d => d.Month))]);
        const chartId = 'chart_' + kpi.replace(/[^a-zA-Z0-9]/g, '_');
        
        const traces = [];
        let maxValue = 0;
        
        if(plantFilter === 'ALL' || plantFilter === 'Plant-05') {
            let plantData = allMonthly.filter(d => d.Plant === 'Plant-05')
                .sort((a,b) => CONFIG.monthOrder[a.Month] - CONFIG.monthOrder[b.Month]);
            
            if(plantData.length > 0) {
                const values = plantData.map(d => d.Achieved * (d.IsPercent ? 100 : 1));
                maxValue = Math.max(maxValue, ...values);
                
                traces.push({
                    x: plantData.map(d => d.Month),
                    y: values,
                    mode: this.showValues ? 'lines+markers+text' : 'lines+markers',
                    text: this.showValues ? plantData.map(d => this.formatValue(d.Achieved, d.IsPercent)) : [],
                    textposition: 'top center',
                    textfont: { size: 11, color: CONFIG.colors['Plant-05'] },
                    line: { color: CONFIG.colors['Plant-05'], width: 3 },
                    marker: { 
                        size: 10,
                        color: plantData.map(d => this.isGood(d.Achieved, d.Target, direction) ? '#4caf50' : '#f44336'),
                        line: { color: '#fff', width: 1 }
                    },
                    name: 'Plant-05',
                    hoverinfo: 'x+y',
                    hovertemplate: '<b>%{x}</b><br>Plant-05: %{y:.2f}<extra></extra>'
                });
            }
        }
        
        if(plantFilter === 'ALL' || plantFilter === 'Plant-06') {
            let plantData = allMonthly.filter(d => d.Plant === 'Plant-06')
                .sort((a,b) => CONFIG.monthOrder[a.Month] - CONFIG.monthOrder[b.Month]);
            
            if(plantData.length > 0) {
                const values = plantData.map(d => d.Achieved * (d.IsPercent ? 100 : 1));
                maxValue = Math.max(maxValue, ...values);
                
                traces.push({
                    x: plantData.map(d => d.Month),
                    y: values,
                    mode: this.showValues ? 'lines+markers+text' : 'lines+markers',
                    text: this.showValues ? plantData.map(d => this.formatValue(d.Achieved, d.IsPercent)) : [],
                    textposition: 'bottom center',
                    textfont: { size: 11, color: CONFIG.colors['Plant-06'] },
                    line: { color: CONFIG.colors['Plant-06'], width: 3 },
                    marker: { 
                        size: 10,
                        color: plantData.map(d => this.isGood(d.Achieved, d.Target, direction) ? '#4caf50' : '#f44336'),
                        line: { color: '#fff', width: 1 }
                    },
                    name: 'Plant-06',
                    hoverinfo: 'x+y',
                    hovertemplate: '<b>%{x}</b><br>Plant-06: %{y:.2f}<extra></extra>'
                });
            }
        }
        
        if(traces.length > 0) {
            Plotly.newPlot(chartId, traces, {
                margin: { l: 50, r: 20, t: 20, b: 50 },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0.2)',
                font: { color: '#fff', size: 11 },
                xaxis: { 
                    tickangle: -45,
                    gridcolor: 'rgba(255,255,255,0.1)',
                    tickfont: { color: '#aaa', size: 10 },
                    categoryorder: 'array',
                    categoryarray: months
                },
                yaxis: { 
                    gridcolor: 'rgba(255,255,255,0.1)',
                    tickfont: { color: '#aaa', size: 10 },
                    range: [0, maxValue * CONFIG.yAxisPadding]
                },
                showlegend: traces.length > 1,
                legend: { orientation: 'h', y: -0.4, font: { color: '#fff', size: 10 } },
                hovermode: 'x'
            });
        }
    },
    
    // Render table
    renderTable: function(kpis, latestMonthly) {
        const tbody = document.getElementById('tableBody');
        tbody.innerHTML = '';
        
        kpis.forEach(kpi => {
            const plant05 = latestMonthly.find(d => d.Plant === 'Plant-05' && d.KPI === kpi);
            const plant06 = latestMonthly.find(d => d.Plant === 'Plant-06' && d.KPI === kpi);
            if (!plant05 && !plant06) return;
            
            const direction = plant05?.Direction || plant06?.Direction || CONFIG.defaultDirection;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="color:#fff; font-weight:600;">${kpi}</td>
                <td style="color:${CONFIG.colors['Plant-05']};">${plant05 ? this.formatValue(plant05.Achieved, plant05.IsPercent) : '-'}</td>
                <td style="color:#aaa;">${plant05 ? this.formatValue(plant05.Target, plant05.IsPercent) : '-'}</td>
                <td>${plant05 ? this.getStatusBadge(plant05.Achieved, plant05.Target, direction) : '-'}</td>
                <td style="color:${CONFIG.colors['Plant-06']};">${plant06 ? this.formatValue(plant06.Achieved, plant06.IsPercent) : '-'}</td>
                <td style="color:#aaa;">${plant06 ? this.formatValue(plant06.Target, plant06.IsPercent) : '-'}</td>
                <td>${plant06 ? this.getStatusBadge(plant06.Achieved, plant06.Target, direction) : '-'}</td>
            `;
            tbody.appendChild(row);
        });
    },
    
    // Utility functions
    isGood: function(achieved, target, direction) {
        if(direction === 'HIGHER_IS_BETTER') return achieved >= target - 0.001;
        if(direction === 'LOWER_IS_BETTER') return achieved <= target + 0.001;
        return false;
    },
    
    formatValue: function(val, isPercent) {
        if (Number.isInteger(val)) {
            return isPercent ? (val * 100).toFixed(0) + '%' : val.toFixed(0);
        }
        if (Math.abs(val * 10 - Math.round(val * 10)) < 0.0001) {
            return isPercent ? (val * 100).toFixed(1) + '%' : val.toFixed(1);
        }
        return isPercent ? (val * 100).toFixed(2) + '%' : val.toFixed(2);
    },
    
    getStatusBadge: function(achieved, target, direction) {
        const good = this.isGood(achieved, target, direction);
        return `<span class="${good ? 'green-bg' : 'red-bg'}">
                    ${good ? '✓ ON TARGET' : '✗ BELOW'}
                </span>`;
    },
    
    sortMonths: function(months) {
        return months.sort((a, b) => (CONFIG.monthOrder[a] || 999) - (CONFIG.monthOrder[b] || 999));
    },
    
    getLatestMonth: function() {
        const months = [...new Set(DataManager.monthlyData.map(d => d.Month))];
        if (months.length === 0) return '';
        return this.sortMonths(months)[months.length - 1];
    }
};