// =============================================
// CHART RENDERER - Handles all chart creation
// =============================================

const ChartRenderer = {
    showValues: true,
    currentTheme: 'default',
    
    // Theme configurations
    themes: {
        default: {
            background: 'rgba(0,0,0,0)',
            plotBg: 'rgba(0,0,0,0.2)',
            textColor: '#fff',
            gridColor: 'rgba(255,255,255,0.1)',
            plant05: '#2196f3',
            plant06: '#ff9800'
        },
        ocean: {
            background: 'rgba(0,20,40,0)',
            plotBg: 'rgba(0,40,80,0.3)',
            textColor: '#0d47a1',
            gridColor: 'rgba(25,118,210,0.2)',
            plant05: '#1976d2',
            plant06: '#ff9800'
        },
        sunset: {
            background: 'rgba(255,255,255,0)',
            plotBg: 'rgba(255,200,150,0.1)',
            textColor: '#e65100',
            gridColor: 'rgba(230,81,0,0.2)',
            plant05: '#e65100',
            plant06: '#ff9800'
        }
    },
    
    // Change theme
    changeTheme: function(themeName) {
        this.currentTheme = themeName;
        this.updateAll();
    },
    
    // Update all charts and table
    updateAll: function() {
        console.log('ChartRenderer.updateAll called');
        
        const plantFilter = document.getElementById('plantFilter').value;
        
        // Get unique KPIs from both monthly and YTD data
        const allKpis = new Set();
        DataManager.monthlyData.forEach(d => allKpis.add(d.KPI));
        DataManager.ytdData.forEach(d => allKpis.add(d.KPI));
        const kpis = Array.from(allKpis).sort();
        
        console.log('KPIs found:', kpis);
        
        if (kpis.length === 0) {
            console.log('No KPIs to display');
            return;
        }
        
        const latestMonth = this.getLatestMonth();
        console.log('Latest month:', latestMonth);
        
        // Update section title with latest month
        const sectionTitle = document.querySelector('.section-title');
        if (sectionTitle) {
            sectionTitle.innerHTML = `📋 ${latestMonth} Performance`;
        }
        
        const latestMonthly = DataManager.monthlyData.filter(d => d.Month === latestMonth);
        console.log('Latest monthly data:', latestMonthly.length, 'rows');
        
        this.renderGrid(kpis, latestMonthly, plantFilter);
        
        // Wait for DOM to update before rendering charts
        setTimeout(() => {
            kpis.forEach(kpi => {
                this.createChart(kpi, plantFilter);
            });
            // Render table after charts
            this.renderTable(kpis, latestMonthly);
        }, 100);
    },
    
    // Render KPI grid
    renderGrid: function(kpis, latestMonthly, plantFilter) {
        console.log('Rendering grid with', kpis.length, 'KPIs');
        
        const grid = document.getElementById('kpiGrid');
        if (!grid) {
            console.error('kpiGrid element not found');
            return;
        }
        
        grid.innerHTML = '';
        
        kpis.forEach(kpi => {
            const plant05monthly = latestMonthly.find(d => d.Plant === 'Plant-05' && d.KPI === kpi);
            const plant06monthly = latestMonthly.find(d => d.Plant === 'Plant-06' && d.KPI === kpi);
            
            if (!plant05monthly && !plant06monthly) return;
            
            const card = this.createCard(kpi, plant05monthly, plant06monthly, plantFilter);
            grid.appendChild(card);
        });
    },
    
    // Create individual card
    createCard: function(kpi, plant05, plant06, plantFilter) {
        const direction = plant05?.Direction || plant06?.Direction || CONFIG.defaultDirection;
        const card = document.createElement('div');
        card.className = 'kpi-card';
        
        const chartId = 'chart_' + kpi.replace(/[^a-zA-Z0-9]/g, '_');
        
        // Add YTD boxes
        const ytdHtml = this.createYTDBoxes(kpi, direction);
        
        // Add factor button
        const factorKPI = kpi === 'Actual OEE' ? 'OEE' : kpi;
        const hasFactor = window.getFactorConfig && getFactorConfig(factorKPI) ? true : false;
        
        let factorButtonHtml = '';
        if (hasFactor) {
            factorButtonHtml = `<button class="factor-btn" onclick="Factors.openModal('${kpi}')">🔍 VIEW ${kpi} FACTORS</button>`;
        }
        
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
                ${factorButtonHtml}
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
                        <div class="ytd-value ${plant05Good ? 'on-target' : 'off-target'}">
                            ${this.formatValue(plant05ytd.Achieved, plant05ytd.IsPercent)}
                        </div>
                        <div class="ytd-target">Target: ${this.formatValue(plant05ytd.Target, plant05ytd.IsPercent)}</div>
                    </div>
                    <div class="ytd-box plant06">
                        <div class="ytd-label">PLANT-06 YTD</div>
                        <div class="ytd-value ${plant06Good ? 'on-target' : 'off-target'}">
                            ${this.formatValue(plant06ytd.Achieved, plant06ytd.IsPercent)}
                        </div>
                        <div class="ytd-target">Target: ${this.formatValue(plant06ytd.Target, plant06ytd.IsPercent)}</div>
                    </div>
                </div>
            `;
        } else if (plant05ytd) {
            const plant05Good = this.isGood(plant05ytd.Achieved, plant05ytd.Target, direction);
            return `
                <div class="ytd-container">
                    <div class="ytd-box plant05">
                        <div class="ytd-label">PLANT-05 YTD</div>
                        <div class="ytd-value ${plant05Good ? 'on-target' : 'off-target'}">
                            ${this.formatValue(plant05ytd.Achieved, plant05ytd.IsPercent)}
                        </div>
                        <div class="ytd-target">Target: ${this.formatValue(plant05ytd.Target, plant05ytd.IsPercent)}</div>
                    </div>
                </div>
            `;
        } else if (plant06ytd) {
            const plant06Good = this.isGood(plant06ytd.Achieved, plant06ytd.Target, direction);
            return `
                <div class="ytd-container">
                    <div class="ytd-box plant06">
                        <div class="ytd-label">PLANT-06 YTD</div>
                        <div class="ytd-value ${plant06Good ? 'on-target' : 'off-target'}">
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
        console.log('Creating chart for', kpi);
        
        const allMonthly = DataManager.monthlyData.filter(d => d.KPI === kpi);
        if (allMonthly.length === 0) {
            console.log('No monthly data for', kpi);
            return;
        }
        
        const theme = this.themes[this.currentTheme];
        const months = this.sortMonths([...new Set(allMonthly.map(d => d.Month))]);
        const chartId = 'chart_' + kpi.replace(/[^a-zA-Z0-9]/g, '_');
        
        const chartElement = document.getElementById(chartId);
        if (!chartElement) {
            console.log('Chart element not found:', chartId);
            return;
        }
        
        console.log('Chart ID:', chartId);
        console.log('Months:', months);
        
        const traces = [];
        let maxValue = 0;
        
        if(plantFilter === 'ALL' || plantFilter === 'Plant-05') {
            let plantData = allMonthly.filter(d => d.Plant === 'Plant-05')
                .sort((a,b) => CONFIG.monthOrder[a.Month] - CONFIG.monthOrder[b.Month]);
            
            if(plantData.length > 0) {
                const values = plantData.map(d => {
                    if (d.IsPercent) {
                        return d.Achieved * 100;
                    }
                    return d.Achieved;
                });
                
                maxValue = Math.max(maxValue, ...values);
                
                traces.push({
                    x: plantData.map(d => d.Month),
                    y: values,
                    mode: this.showValues ? 'lines+markers+text' : 'lines+markers',
                    text: this.showValues ? plantData.map(d => this.formatValue(d.Achieved, d.IsPercent)) : [],
                    textposition: 'top center',
                    textfont: { size: 10, color: theme.plant05 },
                    line: { color: theme.plant05, width: 2 },
                    marker: { 
                        size: 8,
                        color: theme.plant05,
                        line: { color: '#fff', width: 1 }
                    },
                    name: 'Plant-05',
                    hovertemplate: '<b>%{y:.1f}%</b><extra></extra>',
                });
            }
        }
        
        if(plantFilter === 'ALL' || plantFilter === 'Plant-06') {
            let plantData = allMonthly.filter(d => d.Plant === 'Plant-06')
                .sort((a,b) => CONFIG.monthOrder[a.Month] - CONFIG.monthOrder[b.Month]);
            
            if(plantData.length > 0) {
                const values = plantData.map(d => {
                    if (d.IsPercent) {
                        return d.Achieved * 100;
                    }
                    return d.Achieved;
                });
                
                maxValue = Math.max(maxValue, ...values);
                
                traces.push({
                    x: plantData.map(d => d.Month),
                    y: values,
                    mode: this.showValues ? 'lines+markers+text' : 'lines+markers',
                    text: this.showValues ? plantData.map(d => this.formatValue(d.Achieved, d.IsPercent)) : [],
                    textposition: 'bottom center',
                    textfont: { size: 10, color: theme.plant06 },
                    line: { color: theme.plant06, width: 2 },
                    marker: { 
                        size: 8,
                        color: theme.plant06,
                        line: { color: '#fff', width: 1 }
                    },
                    name: 'Plant-06',
                    hovertemplate: '<b>%{y:.1f}%</b><extra></extra>',
                });
            }
        }
        
        if(traces.length > 0) {
            const layout = {
                margin: { l: 40, r: 10, t: 10, b: 40 },
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                font: { color: theme.textColor, size: 10 },
                xaxis: { 
                    tickangle: -45,
                    gridcolor: theme.gridColor,
                    tickfont: { color: theme.textColor === '#fff' ? '#aaa' : theme.textColor, size: 9 },
                    categoryorder: 'array',
                    categoryarray: months,
                    showticklabels: true,
                    title: ''
                },
                yaxis: { 
                    gridcolor: theme.gridColor,
                    tickfont: { color: theme.textColor === '#fff' ? '#aaa' : theme.textColor, size: 9 },
                    range: [0, maxValue * CONFIG.yAxisPadding],
                    title: ''
                },
                showlegend: false,
                hovermode: 'closest'
            };
            
            Plotly.newPlot(chartId, traces, layout, {displayModeBar: false, responsive: true});
            console.log('Chart plotted for', kpi);
        } else {
            console.log('No traces for', kpi);
            // Show empty chart with message
            Plotly.newPlot(chartId, [{
                x: [0], y: [0], 
                type: 'scatter', 
                mode: 'text',
                text: ['No data'],
                textfont: { size: 14, color: '#aaa' }
            }], {
                margin: { l: 0, r: 0, t: 0, b: 0 },
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                xaxis: { visible: false },
                yaxis: { visible: false }
            });
        }
    },
    
    // Render table
    renderTable: function(kpis, latestMonthly) {
        console.log('Rendering table with', kpis.length, 'KPIs');
        
        const tbody = document.getElementById('tableBody');
        if (!tbody) {
            console.error('tableBody element not found');
            return;
        }
        
        tbody.innerHTML = '';
        
        kpis.forEach(kpi => {
            const plant05 = latestMonthly.find(d => d.Plant === 'Plant-05' && d.KPI === kpi);
            const plant06 = latestMonthly.find(d => d.Plant === 'Plant-06' && d.KPI === kpi);
            
            const direction = plant05?.Direction || plant06?.Direction || CONFIG.defaultDirection;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="color:${this.themes[this.currentTheme].textColor}; font-weight:600;">${kpi}</td>
                <td style="color:${this.themes[this.currentTheme].plant05};">${plant05 ? this.formatValue(plant05.Achieved, plant05.IsPercent) : '-'}</td>
                <td style="color:#aaa;">${plant05 ? this.formatValue(plant05.Target, plant05.IsPercent) : '-'}</td>
                <td>${plant05 ? this.getStatusBadge(plant05.Achieved, plant05.Target, direction) : '-'}</td>
                <td style="color:${this.themes[this.currentTheme].plant06};">${plant06 ? this.formatValue(plant06.Achieved, plant06.IsPercent) : '-'}</td>
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
        if (val === undefined || val === null) return '-';
        
        if (isPercent) {
            return (val * 100).toFixed(1) + '%';
        }
        if (Number.isInteger(val)) {
            return val.toString();
        }
        return val.toFixed(1);
    },
    
    getStatusBadge: function(achieved, target, direction) {
        const good = this.isGood(achieved, target, direction);
        return `<span class="${good ? 'green-bg' : 'red-bg'}">${good ? '✓ ON TARGET' : '✗ BELOW'}</span>`;
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