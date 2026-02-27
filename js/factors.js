// =============================================
// FACTORS - Handles factor modal and charts
// =============================================

const Factors = {
    currentKPI: 'OTD',
    currentMonth: 'All',
    
    // Open modal for specific KPI
    openModal: function(kpi) {
        console.log(`Opening modal for ${kpi}`);
        this.currentKPI = kpi;
        this.currentMonth = 'All';
        
        const modal = document.getElementById('factorModal');
        if (!modal) return;
        
        modal.classList.add('active');
        
        const modalTitle = document.getElementById('modalKPI');
        if (modalTitle) modalTitle.innerText = kpi + ' Factors';
        
        // Update tab buttons
        document.querySelectorAll('.factor-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const tab = document.getElementById(`tab${kpi}`);
        if (tab) tab.classList.add('active');
        
        // Update month filter
        this.updateMonthFilter(kpi);
        
        // Load and display factor data
        this.loadFactorData(kpi, 'All');
    },
    
    // Update month filter dropdown
    updateMonthFilter: function(kpi) {
        const months = DataManager.getFactorMonths(kpi);
        const select = document.getElementById('factorMonthSelect');
        if (!select) return;
        
        select.innerHTML = months.map(m => 
            `<option value="${m}" ${m === this.currentMonth ? 'selected' : ''}>${m}</option>`
        ).join('');
    },
    
    // Change month filter
    changeMonth: function(month) {
        this.currentMonth = month;
        this.loadFactorData(this.currentKPI, month);
    },
    
    // Switch between factor tabs
    switchTab: function(kpi) {
        console.log(`Switching to tab: ${kpi}`);
        this.currentKPI = kpi;
        this.currentMonth = 'All';
        
        const modalTitle = document.getElementById('modalKPI');
        if (modalTitle) modalTitle.innerText = kpi + ' Factors';
        
        document.querySelectorAll('.factor-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const tab = document.getElementById(`tab${kpi}`);
        if (tab) tab.classList.add('active');
        
        this.updateMonthFilter(kpi);
        this.loadFactorData(kpi, 'All');
    },
    
    // Load factor data from DataManager
    loadFactorData: function(kpi, month) {
        console.log(`Loading factor data for ${kpi}, month: ${month}`);
        
        const config = getFactorConfig(kpi);
        if (!config) {
            console.error(`No config found for ${kpi}`);
            this.showNoData(kpi, 'No configuration found');
            return;
        }
        
        const plant05Data = DataManager.getFactorDataByMonth(kpi, 'Plant-05', month);
        const plant06Data = DataManager.getFactorDataByMonth(kpi, 'Plant-06', month);
        
        console.log(`Plant-05 data: ${plant05Data.length} items`);
        console.log(`Plant-06 data: ${plant06Data.length} items`);
        
        if (plant05Data.length === 0 || plant06Data.length === 0) {
            this.showNoData(kpi, 'No factor data available');
        } else {
            this.renderCharts(kpi, plant05Data, plant06Data, month, config);
        }
    },
    
    // Show no data message
    showNoData: function(kpi, message) {
        const reasons = ['No Data'];
        const values = [1];
        
        const layout = {
            margin: { l: 50, r: 20, t: 30, b: 50 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0.2)',
            font: { color: '#fff', size: 11 }
        };
        
        Plotly.newPlot('factorChart05', [{
            x: reasons,
            y: values,
            type: 'bar',
            marker: { color: '#666' },
            text: [message || `No ${kpi} factor data`],
            textposition: 'auto'
        }], layout);
        
        Plotly.newPlot('factorChart06', [{
            x: reasons,
            y: values,
            type: 'bar',
            marker: { color: '#666' },
            text: [message || `No ${kpi} factor data`],
            textposition: 'auto'
        }], layout);
    },
    
    // Render factor charts based on config
    renderCharts: function(kpi, plant05Data, plant06Data, month, config) {
        const monthText = month === 'All' ? 'All Months (Average)' : month;
        
        const title05 = document.getElementById('plant05Title');
        const title06 = document.getElementById('plant06Title');
        
        if (title05) title05.innerHTML = `🔵 PLANT-05 - ${config.title} (${monthText})`;
        if (title06) title06.innerHTML = `🟠 PLANT-06 - ${config.title} (${monthText})`;
        
        const reasons = plant05Data.map(d => d.reason);
        const plant05Values = plant05Data.map(d => d.value);
        const plant06Values = plant06Data.map(d => d.value);
        
        // Choose chart type based on config
        if (config.chartType === 'donut') {
            // Donut chart for YMR
            this.renderDonutChart('factorChart05', plant05Values, reasons, config.colors);
            this.renderDonutChart('factorChart06', plant06Values, reasons, config.colors);
        } else if (config.chartType === 'horizontalBar') {
            // Horizontal bar chart for OEE
            this.renderHorizontalBarChart('factorChart05', reasons, plant05Values, CONFIG.colors['Plant-05']);
            this.renderHorizontalBarChart('factorChart06', reasons, plant06Values, CONFIG.colors['Plant-06']);
        } else {
            // Default bar chart for OTD
            this.renderBarChart('factorChart05', reasons, plant05Values, CONFIG.colors['Plant-05']);
            this.renderBarChart('factorChart06', reasons, plant06Values, CONFIG.colors['Plant-06']);
        }
    },
    
    renderBarChart: function(containerId, reasons, values, color) {
        Plotly.newPlot(containerId, [{
            x: reasons,
            y: values,
            type: 'bar',
            marker: { color: color },
            text: values.map(v => v.toFixed(2) + '%'),
            textposition: 'auto',
            hoverinfo: 'x+y',
            hovertemplate: '%{x}<br>%{y:.2f}%<extra></extra>'
        }], {
            margin: { l: 50, r: 20, t: 20, b: 100 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0.2)',
            font: { color: '#fff', size: 11 },
            xaxis: { 
                tickangle: -45,
                tickfont: { size: 9 },
                gridcolor: 'rgba(255,255,255,0.1)'
            },
            yaxis: { 
                title: 'Percentage (%)',
                ticksuffix: '%',
                gridcolor: 'rgba(255,255,255,0.1)'
            }
        });
    },
    
    renderHorizontalBarChart: function(containerId, reasons, values, color) {
        Plotly.newPlot(containerId, [{
            x: values,
            y: reasons,
            type: 'bar',
            orientation: 'h',
            marker: { color: color },
            text: values.map(v => v.toFixed(2) + '%'),
            textposition: 'outside',
            hoverinfo: 'x+y',
            hovertemplate: '%{y}<br>%{x:.2f}%<extra></extra>'
        }], {
            margin: { l: 150, r: 30, t: 20, b: 30 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0.2)',
            font: { color: '#fff', size: 11 },
            xaxis: { 
                title: 'Percentage (%)',
                ticksuffix: '%',
                gridcolor: 'rgba(255,255,255,0.1)'
            },
            yaxis: { 
                tickfont: { size: 10 },
                automargin: true
            }
        });
    },
    
    renderDonutChart: function(containerId, values, labels, colors) {
        Plotly.newPlot(containerId, [{
            values: values,
            labels: labels,
            type: 'pie',
            hole: 0.4,
            marker: { 
                colors: colors.slice(0, values.length),
                line: { color: '#fff', width: 1 }
            },
            textinfo: 'label+percent',
            textposition: 'inside',
            hoverinfo: 'label+value+percent',
            hovertemplate: '%{label}<br>%{value:.2f}%<extra></extra>'
        }], {
            margin: { l: 20, r: 20, t: 30, b: 20 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0.2)',
            font: { color: '#fff', size: 11 },
            showlegend: false
        });
    }
};