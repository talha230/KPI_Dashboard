// =============================================
// FACTORS - Handles factor modal and charts
// =============================================

const Factors = {
    currentKPI: 'OTD',
    currentMonth: null,
    drillLevel: 0, // 0: main, 1: responsibility, 2: customer
    selectedResponsibility: null,
    selectedCustomer: null,
    
    // Open modal for specific KPI
    openModal: function(kpi) {
        console.log(`Opening modal for ${kpi}`);
        this.currentKPI = kpi;
        this.drillLevel = 0;
        this.selectedResponsibility = null;
        this.selectedCustomer = null;
        
        const modal = document.getElementById('factorModal');
        if (!modal) return;
        
        modal.classList.add('active');
        
        const modalTitle = document.getElementById('modalKPI');
        if (modalTitle) modalTitle.innerText = kpi + ' Factor Analysis';
        
        // Update tab buttons
        document.querySelectorAll('.factor-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const tab = document.getElementById(`tab${kpi}`);
        if (tab) tab.classList.add('active');
        
        // Update month filter
        this.updateMonthFilter(kpi);
    },
    
    // Update month filter dropdown
    updateMonthFilter: function(kpi) {
        const data = DataManager.factorData[kpi];
        if (!data || !data.months) return;
        
        const select = document.getElementById('factorMonthSelect');
        if (!select) return;
        
        select.innerHTML = data.months.map(m => 
            `<option value="${m}">${m}</option>`
        ).join('');
        
        // Set first month as default
        if (data.months.length > 0) {
            this.currentMonth = data.months[0];
            this.loadFactorData(kpi, this.currentMonth);
        }
    },
    
    // Change month filter
    changeMonth: function(month) {
        this.currentMonth = month;
        this.drillLevel = 0;
        this.selectedResponsibility = null;
        this.selectedCustomer = null;
        this.loadFactorData(this.currentKPI, month);
    },
    
    // Switch between factor tabs
    switchTab: function(kpi) {
        console.log(`Switching to tab: ${kpi}`);
        this.currentKPI = kpi;
        this.drillLevel = 0;
        this.selectedResponsibility = null;
        this.selectedCustomer = null;
        
        const modalTitle = document.getElementById('modalKPI');
        if (modalTitle) modalTitle.innerText = kpi + ' Factor Analysis';
        
        document.querySelectorAll('.factor-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const tab = document.getElementById(`tab${kpi}`);
        if (tab) tab.classList.add('active');
        
        this.updateMonthFilter(kpi);
    },
    
    // Load factor data
    loadFactorData: function(kpi, month) {
        console.log(`Loading factor data for ${kpi}, month: ${month}`);
        
        const config = getFactorConfig(kpi);
        if (!config) {
            this.showNoData(kpi, 'No configuration found');
            return;
        }
        
        const data = DataManager.factorData[kpi];
        if (!data) {
            this.showNoData(kpi, 'No factor data available');
            return;
        }
        
        const monthData = config.getData(data, month);
        if (!monthData) {
            this.showNoData(kpi, `No data for ${month}`);
            return;
        }
        
        // Render based on KPI type
        if (kpi === 'OTD') {
            this.renderOTDCharts(monthData);
        } else if (kpi === 'OEE') {
            this.renderOEECharts(monthData);
        } else if (kpi === 'YMR') {
            this.renderYMRCharts(monthData);
        }
    },
    
    // Render OTD hierarchical charts
    renderOTDCharts: function(data) {
        const monthText = this.currentMonth;
        
        document.getElementById('plant05Title').innerHTML = `📊 OTD Analysis - ${monthText}`;
        document.getElementById('plant06Title').innerHTML = `📊 Drill-down View`;
        
        if (this.drillLevel === 0) {
            // Level 0: On-Time vs Delayed Donut
            this.renderOTDMainDonut(data);
        } else if (this.drillLevel === 1) {
            // Level 1: Responsibility breakdown
            this.renderOTDResponsibilityChart(data);
        } else if (this.drillLevel === 2) {
            // Level 2: Customer breakdown for selected responsibility
            this.renderOTDCustomerChart(data);
        }
    },
    
    renderOTDMainDonut: function(data) {
        // Left chart: On-Time vs Delayed donut
        Plotly.newPlot('factorChart05', [{
            values: [data.onTime.count, data.delayed.count],
            labels: [`On-Time (${data.onTime.percentage}%)`, `Delayed (${data.delayed.percentage}%)`],
            type: 'pie',
            hole: 0.4,
            marker: {
                colors: ['#4caf50', '#f44336'],
                line: { color: '#fff', width: 1 }
            },
            textinfo: 'label+percent',
            textposition: 'inside',
            hoverinfo: 'label+value+percent',
            hovertemplate: '%{label}<br>Orders: %{value}<extra></extra>'
        }], {
            margin: { l: 20, r: 20, t: 40, b: 20 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0.2)',
            font: { color: '#fff', size: 12 },
            title: { text: 'On-Time vs Delayed', font: { size: 14 } },
            showlegend: false
        });
        
        // Right chart: Instructions
        Plotly.newPlot('factorChart06', [{
            x: [0],
            y: [0],
            type: 'scatter',
            mode: 'text',
            text: ['Click on "Delayed" slice to see responsibility breakdown'],
            textfont: { size: 14, color: '#fff' },
            showlegend: false
        }], {
            margin: { l: 20, r: 20, t: 40, b: 20 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0.2)',
            xaxis: { visible: false },
            yaxis: { visible: false }
        });
        
        // Add click handler
        document.getElementById('factorChart05').on('plotly_click', (data) => {
            if (data.points[0].label.includes('Delayed')) {
                this.drillLevel = 1;
                this.renderOTDResponsibilityChart(data);
            }
        });
    },
    
    renderOTDResponsibilityChart: function(data) {
        // Left chart: Responsibility breakdown (as % of total orders)
        const responsibilities = Object.keys(data.delayed.byResponsibility);
        const respPercentages = responsibilities.map(r => 
            parseFloat(data.delayed.byResponsibility[r].percentage)
        );
        
        Plotly.newPlot('factorChart05', [{
            x: responsibilities,
            y: respPercentages,
            type: 'bar',
            marker: { color: '#ff9800' },
            text: respPercentages.map(p => p + '%'),
            textposition: 'auto',
            hoverinfo: 'x+y',
            hovertemplate: '%{x}<br>%{y}% of total orders<extra></extra>'
        }], {
            margin: { l: 50, r: 20, t: 40, b: 100 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0.2)',
            font: { color: '#fff', size: 11 },
            title: { text: 'Delay by Responsibility (% of total orders)', font: { size: 14 } },
            xaxis: { tickangle: -45, tickfont: { size: 10 } },
            yaxis: { title: 'Percentage (%)', ticksuffix: '%' }
        });
        
        // Right chart: Back button and instructions
        Plotly.newPlot('factorChart06', [{
            x: [0],
            y: [0],
            type: 'scatter',
            mode: 'text',
            text: ['Click on any bar to see customer breakdown<br><br>⬅️ Back to Main View'],
            textfont: { size: 14, color: '#fff' },
            showlegend: false
        }], {
            margin: { l: 20, r: 20, t: 40, b: 20 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0.2)',
            xaxis: { visible: false },
            yaxis: { visible: false }
        });
        
        // Add back button (using HTML)
        const backBtn = document.createElement('button');
        backBtn.textContent = '← Back to Main View';
        backBtn.className = 'back-btn';
        backBtn.onclick = () => {
            this.drillLevel = 0;
            this.loadFactorData(this.currentKPI, this.currentMonth);
        };
        
        const container = document.getElementById('factorChart06').parentNode;
        if (!document.querySelector('.back-btn')) {
            container.appendChild(backBtn);
        }
        
        // Add click handler for bars
        document.getElementById('factorChart05').on('plotly_click', (data) => {
            this.selectedResponsibility = data.points[0].x;
            this.drillLevel = 2;
            this.renderOTDCustomerChart(data);
        });
    },
    
    renderOTDCustomerChart: function(data) {
        // Get customers for selected responsibility
        const customers = [];
        const percentages = [];
        
        Object.entries(data.delayed.byCustomer).forEach(([custId, custData]) => {
            if (custData.byResponsibility[this.selectedResponsibility]) {
                customers.push(`Cust-${custId}`);
                percentages.push(parseFloat(custData.byResponsibility[this.selectedResponsibility].percentage));
            }
        });
        
        Plotly.newPlot('factorChart05', [{
            x: customers,
            y: percentages,
            type: 'bar',
            marker: { color: '#2196f3' },
            text: percentages.map(p => p + '%'),
            textposition: 'auto',
            hoverinfo: 'x+y',
            hovertemplate: '%{x}<br>%{y}% of total orders<extra></extra>'
        }], {
            margin: { l: 50, r: 20, t: 60, b: 100 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0.2)',
            font: { color: '#fff', size: 11 },
            title: { text: `Customer Delay for ${this.selectedResponsibility}`, font: { size: 14 } },
            xaxis: { tickangle: -45, tickfont: { size: 10 } },
            yaxis: { title: 'Percentage (%)', ticksuffix: '%' }
        });
        
        // Right chart: Back buttons
        Plotly.newPlot('factorChart06', [{
            x: [0],
            y: [0],
            type: 'scatter',
            mode: 'text',
            text: ['⬅️ Back to Responsibility<br>⬅️⬅️ Back to Main'],
            textfont: { size: 14, color: '#fff' },
            showlegend: false
        }], {
            margin: { l: 20, r: 20, t: 40, b: 20 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0.2)',
            xaxis: { visible: false },
            yaxis: { visible: false }
        });
        
        // Update back buttons
        const backBtns = document.querySelectorAll('.back-btn');
        backBtns.forEach(btn => btn.remove());
        
        const container = document.getElementById('factorChart06').parentNode;
        
        const backToResp = document.createElement('button');
        backToResp.textContent = '← Back to Responsibility';
        backToResp.className = 'back-btn';
        backToResp.style.marginRight = '10px';
        backToResp.onclick = () => {
            this.drillLevel = 1;
            this.loadFactorData(this.currentKPI, this.currentMonth);
        };
        
        const backToMain = document.createElement('button');
        backToMain.textContent = '←← Back to Main';
        backToMain.className = 'back-btn';
        backToMain.onclick = () => {
            this.drillLevel = 0;
            this.selectedResponsibility = null;
            this.loadFactorData(this.currentKPI, this.currentMonth);
        };
        
        container.appendChild(backToResp);
        container.appendChild(backToMain);
    },
    
    // OEE Charts (horizontal bar)
    renderOEECharts: function(data) {
        // ... existing OEE code ...
    },
    
    // YMR Charts (donut)
    renderYMRCharts: function(data) {
        // ... existing YMR code ...
    },
    
    showNoData: function(kpi, message) {
        // ... existing no data code ...
    }
};