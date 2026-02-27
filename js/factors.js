// =============================================
// FACTORS - Handles factor modal and charts
// =============================================

const Factors = {
    currentKPI: 'OTD',
    currentMonth: 'All',
    
    // Open modal for specific KPI
    openModal: function(kpi) {
        this.currentKPI = kpi;
        this.currentMonth = 'All';
        document.getElementById('modalKPI').innerText = kpi + ' Factors';
        document.getElementById('factorModal').classList.add('active');
        
        // Update tab buttons
        document.querySelectorAll('.factor-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById(`tab${kpi}`).classList.add('active');
        
        // Create month filter dropdown
        this.createMonthFilter(kpi);
        
        // Load and display factor data
        this.loadFactorData(kpi, 'All');
    },
    
    // Create month filter dropdown
    createMonthFilter: function(kpi) {
        const months = DataManager.getFactorMonths(kpi);
        const filterContainer = document.getElementById('factorMonthFilter');
        
        if (!filterContainer) {
            // Create filter if it doesn't exist
            const modalHeader = document.querySelector('.modal-header');
            const filterDiv = document.createElement('div');
            filterDiv.id = 'factorMonthFilter';
            filterDiv.className = 'factor-month-filter';
            filterDiv.innerHTML = `
                <label>📅 Month:</label>
                <select id="factorMonthSelect" onchange="Factors.changeMonth(this.value)">
                    ${months.map(m => `<option value="${m}" ${m === 'All' ? 'selected' : ''}>${m}</option>`).join('')}
                </select>
            `;
            modalHeader.appendChild(filterDiv);
        } else {
            // Update existing filter
            const select = document.getElementById('factorMonthSelect');
            select.innerHTML = months.map(m => `<option value="${m}" ${m === this.currentMonth ? 'selected' : ''}>${m}</option>`).join('');
        }
    },
    
    // Change month filter
    changeMonth: function(month) {
        this.currentMonth = month;
        this.loadFactorData(this.currentKPI, month);
    },
    
    // Switch between factor tabs
    switchTab: function(kpi) {
        this.currentKPI = kpi;
        this.currentMonth = 'All';
        document.getElementById('modalKPI').innerText = kpi + ' Factors';
        
        document.querySelectorAll('.factor-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById(`tab${kpi}`).classList.add('active');
        
        this.createMonthFilter(kpi);
        this.loadFactorData(kpi, 'All');
    },
    
    // Load factor data from DataManager
    loadFactorData: function(kpi, month) {
        const plant05Data = DataManager.getFactorDataByMonth(kpi, 'Plant-05', month);
        const plant06Data = DataManager.getFactorDataByMonth(kpi, 'Plant-06', month);
        
        if (plant05Data.length === 0 || plant06Data.length === 0) {
            this.showNoData();
        } else {
            this.renderCharts(kpi, plant05Data, plant06Data, month);
        }
    },
    
    // Show no data message
    showNoData: function() {
        const reasons = ['No Data Available'];
        const values = [1];
        
        Plotly.newPlot('factorChart05', [{
            x: reasons,
            y: values,
            type: 'bar',
            marker: { color: '#666' },
            text: ['No factor data loaded'],
            textposition: 'auto'
        }], {
            margin: { l: 50, r: 20, t: 30, b: 50 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0.2)',
            font: { color: '#fff', size: 11 }
        });
        
        Plotly.newPlot('factorChart06', [{
            x: reasons,
            y: values,
            type: 'bar',
            marker: { color: '#666' },
            text: ['No factor data loaded'],
            textposition: 'auto'
        }], {
            margin: { l: 50, r: 20, t: 30, b: 50 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0.2)',
            font: { color: '#fff', size: 11 }
        });
    },
    
    // Render factor charts
    renderCharts: function(kpi, plant05Data, plant06Data, month) {
        // Set titles with month
        const monthText = month === 'All' ? 'All Months (Average)' : month;
        document.getElementById('plant05Title').innerHTML = `🔵 PLANT-05 - ${kpi} Factors (${monthText})`;
        document.getElementById('plant06Title').innerHTML = `🟠 PLANT-06 - ${kpi} Factors (${monthText})`;
        
        const reasons = plant05Data.map(d => d.reason);
        const plant05Values = plant05Data.map(d => d.value);
        const plant06Values = plant06Data.map(d => d.value);
        
        // Determine chart title based on KPI
        let chartTitle = 'Factors';
        if (kpi === 'OTD') chartTitle = 'Delay Reasons (Count)';
        if (kpi === 'OEE') chartTitle = 'Loss Factors (%)';
        if (kpi === 'YMR') chartTitle = 'Breakdown (%)';
        
        // Plant-05 Chart
        Plotly.newPlot('factorChart05', [{
            x: reasons,
            y: plant05Values,
            type: 'bar',
            marker: { color: CONFIG.colors['Plant-05'] },
            text: plant05Values.map(v => v.toFixed(1)),
            textposition: 'auto',
            textfont: { color: '#fff', size: 11 },
            hoverinfo: 'x+y',
            hovertemplate: '<b>%{x}</b><br>Value: %{y:.2f}<extra></extra>'
        }], {
            margin: { l: 50, r: 20, t: 40, b: 80 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0.2)',
            font: { color: '#fff', size: 11 },
            title: { text: chartTitle, font: { color: '#fff', size: 14 } },
            xaxis: { 
                tickangle: -45, 
                tickfont: { color: '#aaa', size: 10 },
                automargin: true
            },
            yaxis: { 
                gridcolor: 'rgba(255,255,255,0.1)', 
                tickfont: { color: '#aaa', size: 10 },
                automargin: true
            }
        });
        
        // Plant-06 Chart
        Plotly.newPlot('factorChart06', [{
            x: reasons,
            y: plant06Values,
            type: 'bar',
            marker: { color: CONFIG.colors['Plant-06'] },
            text: plant06Values.map(v => v.toFixed(1)),
            textposition: 'auto',
            textfont: { color: '#fff', size: 11 },
            hoverinfo: 'x+y',
            hovertemplate: '<b>%{x}</b><br>Value: %{y:.2f}<extra></extra>'
        }], {
            margin: { l: 50, r: 20, t: 40, b: 80 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0.2)',
            font: { color: '#fff', size: 11 },
            title: { text: chartTitle, font: { color: '#fff', size: 14 } },
            xaxis: { 
                tickangle: -45, 
                tickfont: { color: '#aaa', size: 10 },
                automargin: true
            },
            yaxis: { 
                gridcolor: 'rgba(255,255,255,0.1)', 
                tickfont: { color: '#aaa', size: 10 },
                automargin: true
            }
        });
    }
};