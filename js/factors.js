// =============================================
// FACTORS - Handles factor modal and charts
// =============================================

const Factors = {
    currentKPI: 'OTD',
    currentMonth: 'YTD',
    currentPlant: 'All',
    drillLevel: 0,
    selectedResponsibility: null,
    selectedCustomer: null,
    
    // Open modal for specific KPI
    openModal: function(kpi) {
        console.log(`Opening modal for ${kpi}`);
        const factorKPI = kpi === 'Actual OEE' ? 'OEE' : kpi;
        this.currentKPI = factorKPI;
        this.drillLevel = 0;
        this.selectedResponsibility = null;
        this.selectedCustomer = null;
        this.currentMonth = 'YTD';
        this.currentPlant = 'All';
        
        const modal = document.getElementById('factorModal');
        if (!modal) return;
        
        modal.classList.add('active');
        
        const modalTitle = document.getElementById('modalKPI');
        if (modalTitle) modalTitle.innerText = kpi + ' Factor Analysis';
        
        // Update tab buttons
        document.querySelectorAll('.factor-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show only tabs with loaded data
        const loadedFactors = Object.keys(DataManager.factorData);
        document.getElementById('tabOTD').style.display = loadedFactors.includes('OTD') ? 'inline-block' : 'none';
        document.getElementById('tabOEE').style.display = loadedFactors.includes('OEE') ? 'inline-block' : 'none';
        document.getElementById('tabYMR').style.display = loadedFactors.includes('YMR') ? 'inline-block' : 'none';
        
        const tab = document.getElementById(`tab${factorKPI}`);
        if (tab) tab.classList.add('active');
        
        // Reset filters
        const monthSelect = document.getElementById('factorMonthSelect');
        const plantSelect = document.getElementById('factorPlantSelect');
        
        // Update month filter for all KPIs
        this.updateMonthFilter(factorKPI);
        
        if (monthSelect) monthSelect.value = 'YTD';
        if (plantSelect) plantSelect.value = 'All';
        
        this.loadFactorData(factorKPI, 'YTD');
    },
    
    // Update month filter dropdown - For ALL KPIs
    updateMonthFilter: function(kpi) {
        const data = DataManager.factorData[kpi];
        if (!data || !data.months) return;
        
        const select = document.getElementById('factorMonthSelect');
        if (!select) return;
        
        // Include all months including YTD
        let months = [...data.months];
        
        // Make sure YTD is first
        const ytdIndex = months.indexOf('YTD');
        if (ytdIndex > -1) {
            months.splice(ytdIndex, 1);
            months.unshift('YTD');
        }
        
        select.innerHTML = months.map(m => `<option value="${m}">${m}</option>`).join('');
    },
    
    // Change month filter
    changeMonth: function(month) {
        this.currentMonth = month;
        this.drillLevel = 0;
        this.selectedResponsibility = null;
        this.selectedCustomer = null;
        this.loadFactorData(this.currentKPI, month);
    },
    
    // Change plant filter
    changePlant: function(plant) {
        this.currentPlant = plant;
        this.drillLevel = 0;
        this.selectedResponsibility = null;
        this.selectedCustomer = null;
        this.loadFactorData(this.currentKPI, this.currentMonth);
    },
    
    // Switch between factor tabs
    switchTab: function(kpi) {
        console.log(`Switching to tab: ${kpi}`);
        this.currentKPI = kpi;
        this.drillLevel = 0;
        this.selectedResponsibility = null;
        this.selectedCustomer = null;
        this.currentMonth = 'YTD';
        this.currentPlant = 'All';
        
        const modalTitle = document.getElementById('modalKPI');
        if (modalTitle) modalTitle.innerText = kpi + ' Factor Analysis';
        
        document.querySelectorAll('.factor-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const tab = document.getElementById(`tab${kpi}`);
        if (tab) tab.classList.add('active');
        
        // Reset filters
        const monthSelect = document.getElementById('factorMonthSelect');
        const plantSelect = document.getElementById('factorPlantSelect');
        
        // Update month filter for all KPIs
        this.updateMonthFilter(kpi);
        
        if (monthSelect) monthSelect.value = 'YTD';
        if (plantSelect) plantSelect.value = 'All';
        
        this.loadFactorData(kpi, 'YTD');
    },
    
    // Load factor data
    loadFactorData: function(kpi, month) {
        console.log(`Loading factor data for ${kpi}, month: ${month}, plant: ${this.currentPlant}`);
        
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
        
        // Clear factor content container
        const container = document.getElementById('factorContent');
        container.innerHTML = '';
        
        // Render based on KPI type
        if (kpi === 'OTD') {
            this.renderOTDCharts(data, month, config);
        } else if (kpi === 'OEE') {
            this.renderOEECharts(data, month, config);
        } else if (kpi === 'YMR') {
            this.renderYMRCharts(data, month, config);
        }
    },
    
    // ==================== OTD CHARTS ====================
    
    renderOTDCharts: function(data, month, config) {
        // Get data based on month
        let rawData = config.getData(data, month);
        
        // Apply plant filter
        if (this.currentPlant !== 'All') {
            rawData = rawData.filter(d => d.plant === this.currentPlant);
        }
        
        if (rawData.length === 0) {
            this.showSingleChart('No OTD data for selected filters');
            return;
        }
        
        // Calculate YTD totals if needed
        let totalOrders, delayedOrders, onTimeOrders, delayedPercent, onTimePercent;
        
        if (month === 'YTD' && config.calculateYTD) {
            const ytdData = config.calculateYTD(rawData);
            totalOrders = ytdData.total;
            delayedOrders = ytdData.delayed;
            onTimeOrders = ytdData.onTime;
            delayedPercent = ytdData.delayedPercent;
            onTimePercent = ytdData.onTimePercent;
        } else {
            totalOrders = rawData.reduce((sum, d) => sum + d.orders, 0);
            delayedOrders = rawData.filter(d => d.status === 'Delayed')
                .reduce((sum, d) => sum + d.orders, 0);
            onTimeOrders = rawData.filter(d => d.status === 'On Time')
                .reduce((sum, d) => sum + d.orders, 0);
            delayedPercent = totalOrders > 0 ? (delayedOrders / totalOrders * 100).toFixed(1) : 0;
            onTimePercent = totalOrders > 0 ? (onTimeOrders / totalOrders * 100).toFixed(1) : 0;
        }
        
        const monthText = month;
        const plantText = this.currentPlant === 'All' ? 'All Plants' : this.currentPlant;
        
        if (this.drillLevel === 0) {
            this.renderOTDMainView(rawData, totalOrders, delayedOrders, onTimeOrders, delayedPercent, onTimePercent, monthText, plantText, config);
        } else if (this.drillLevel === 1) {
            this.renderOTDResponsibilityView(rawData, totalOrders, monthText, plantText, config);
        } else if (this.drillLevel === 2) {
            this.renderOTDCustomerView(rawData, totalOrders, monthText, plantText, config);
        }
    },
    
    renderOTDMainView: function(rawData, totalOrders, delayedOrders, onTimeOrders, delayedPercent, onTimePercent, monthText, plantText, config) {
        const container = document.getElementById('factorContent');
        
        const leftCard = document.createElement('div');
        leftCard.className = 'factor-card';
        leftCard.innerHTML = `<h3>🔵 OTD Analysis - ${monthText} (${plantText})</h3><div id="factorChartLeft" class="factor-chart" style="height: 400px;"></div>`;
        container.appendChild(leftCard);
        
        const rightCard = document.createElement('div');
        rightCard.className = 'factor-card';
        rightCard.innerHTML = `<h3>📊 Delay by Responsibility</h3><div id="factorChartRight" style="height: 400px; overflow-y: auto;"></div>`;
        container.appendChild(rightCard);
        
        // Donut chart
        Plotly.newPlot('factorChartLeft', [{
            values: [onTimeOrders, delayedOrders],
            labels: ['On-Time', 'Delayed'],
            type: 'pie',
            hole: 0.4,
            marker: { colors: ['#4caf50', '#f44336'] },
            textinfo: 'label+percent',
            textposition: 'inside',
            textfont: { size: 14 },
            hovertemplate: '%{label}<br>%{percent} (%{value} orders)<extra></extra>'
        }], {
            margin: { l: 50, r: 50, t: 50, b: 50 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0.2)',
            font: { color: '#fff', size: 14 },
            showlegend: false,
            annotations: [{
                font: { size: 16, color: '#fff' },
                showarrow: false,
                text: `${delayedPercent}% Delayed`,
                x: 0.5,
                y: 0.5
            }]
        });
        
        // Responsibility buttons
        const respData = config.getResponsibilityData ? 
            config.getResponsibilityData(rawData, totalOrders) :
            this.getResponsibilityData(rawData, totalOrders);
        
        const rightDiv = document.getElementById('factorChartRight');
        const buttonDiv = document.createElement('div');
        buttonDiv.style.padding = '20px';
        
        if (respData.length === 0) {
            buttonDiv.innerHTML = '<p style="color: #aaa; text-align: center;">No delay data available</p>';
        } else {
            respData.forEach(item => {
                const btn = document.createElement('button');
                btn.textContent = `${item.responsibility}: ${item.percent}% (${item.count} orders)`;
                btn.style.width = '100%';
                btn.style.padding = '15px';
                btn.style.margin = '8px 0';
                btn.style.background = 'rgba(255,152,0,0.2)';
                btn.style.border = '1px solid #ff9800';
                btn.style.color = '#fff';
                btn.style.borderRadius = '8px';
                btn.style.cursor = 'pointer';
                btn.style.textAlign = 'left';
                btn.style.fontSize = '16px';
                btn.style.fontWeight = '500';
                
                btn.onclick = () => {
                    this.selectedResponsibility = item.responsibility;
                    this.drillLevel = 1;
                    this.loadFactorData(this.currentKPI, this.currentMonth);
                };
                
                buttonDiv.appendChild(btn);
            });
        }
        
        rightDiv.appendChild(buttonDiv);
    },
    
    renderOTDResponsibilityView: function(rawData, totalOrders, monthText, plantText, config) {
        const container = document.getElementById('factorContent');
        
        const leftCard = document.createElement('div');
        leftCard.className = 'factor-card';
        leftCard.innerHTML = `<h3>📊 Delay by Responsibility - ${monthText} (${plantText})</h3><div id="factorChartLeft" class="factor-chart" style="height: 450px;"></div>`;
        container.appendChild(leftCard);
        
        const rightCard = document.createElement('div');
        rightCard.className = 'factor-card';
        rightCard.innerHTML = `<h3>👥 Customers with ${this.selectedResponsibility} Delay</h3><div id="factorChartRight" style="height: 450px; overflow-y: auto;"></div>`;
        container.appendChild(rightCard);
        
        // Responsibility bar chart
        const respData = config.getResponsibilityData ? 
            config.getResponsibilityData(rawData, totalOrders) :
            this.getResponsibilityData(rawData, totalOrders);
        
        Plotly.newPlot('factorChartLeft', [{
            x: respData.map(d => d.responsibility),
            y: respData.map(d => parseFloat(d.percent)),
            type: 'bar',
            marker: { color: '#ff9800' },
            text: respData.map(d => `${d.percent}%`),
            textposition: 'outside',
            textfont: { size: 12 },
            hovertemplate: '%{x}<br>%{y}% of total orders (%{customdata} orders)<extra></extra>',
            customdata: respData.map(d => d.count)
        }], {
            margin: { l: 80, r: 50, t: 60, b: 120 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0.2)',
            font: { color: '#fff', size: 14 },
            xaxis: { 
                tickangle: -45, 
                tickfont: { size: 12 },
                title: { text: 'Responsibility', font: { size: 14 } }
            },
            yaxis: { 
                title: 'Percentage of Total Orders (%)', 
                ticksuffix: '%',
                tickfont: { size: 12 },
                titlefont: { size: 14 },
                range: [0, Math.max(...respData.map(d => parseFloat(d.percent))) * 1.15]
            }
        });
        
        // Customer buttons
        const customerData = config.getCustomerData ? 
            config.getCustomerData(rawData, this.selectedResponsibility, totalOrders) :
            this.getCustomerData(rawData, this.selectedResponsibility, totalOrders);
        
        const rightDiv = document.getElementById('factorChartRight');
        const buttonDiv = document.createElement('div');
        buttonDiv.style.padding = '20px';
        
        if (customerData.length === 0) {
            buttonDiv.innerHTML = '<p style="color: #aaa; text-align: center;">No customer data available</p>';
        } else {
            customerData.forEach(item => {
                const btn = document.createElement('button');
                btn.textContent = `Customer ${item.customer}: ${item.percent}% (${item.count} orders)`;
                btn.style.width = '100%';
                btn.style.padding = '15px';
                btn.style.margin = '8px 0';
                btn.style.background = 'rgba(33,150,243,0.2)';
                btn.style.border = '1px solid #2196f3';
                btn.style.color = '#fff';
                btn.style.borderRadius = '8px';
                btn.style.cursor = 'pointer';
                btn.style.textAlign = 'left';
                btn.style.fontSize = '16px';
                btn.style.fontWeight = '500';
                
                btn.onclick = () => {
                    this.selectedCustomer = item.customer;
                    this.drillLevel = 2;
                    this.loadFactorData(this.currentKPI, this.currentMonth);
                };
                
                buttonDiv.appendChild(btn);
            });
        }
        
        // Back button
        const backBtn = document.createElement('button');
        backBtn.textContent = '← Back to Main View';
        backBtn.style.width = '100%';
        backBtn.style.padding = '15px';
        backBtn.style.margin = '15px 0 5px 0';
        backBtn.style.background = 'rgba(255,255,255,0.1)';
        backBtn.style.border = '1px solid #fff';
        backBtn.style.color = '#fff';
        backBtn.style.borderRadius = '8px';
        backBtn.style.cursor = 'pointer';
        backBtn.style.fontSize = '16px';
        backBtn.style.fontWeight = '500';
        
        backBtn.onclick = () => {
            this.drillLevel = 0;
            this.selectedResponsibility = null;
            this.loadFactorData(this.currentKPI, this.currentMonth);
        };
        
        buttonDiv.appendChild(backBtn);
        rightDiv.appendChild(buttonDiv);
    },
    
    renderOTDCustomerView: function(rawData, totalOrders, monthText, plantText, config) {
        const container = document.getElementById('factorContent');
        
        const leftCard = document.createElement('div');
        leftCard.className = 'factor-card';
        leftCard.innerHTML = `<h3>👥 Customer Delay for ${this.selectedResponsibility} - ${monthText} (${plantText})</h3><div id="factorChartLeft" class="factor-chart" style="height: 450px;"></div>`;
        container.appendChild(leftCard);
        
        const rightCard = document.createElement('div');
        rightCard.className = 'factor-card';
        rightCard.innerHTML = `<h3>🧭 Navigation</h3><div id="factorChartRight" style="height: 450px;"></div>`;
        container.appendChild(rightCard);
        
        // Customer bar chart
        const customerData = config.getCustomerData ? 
            config.getCustomerData(rawData, this.selectedResponsibility, totalOrders) :
            this.getCustomerData(rawData, this.selectedResponsibility, totalOrders);
        
        Plotly.newPlot('factorChartLeft', [{
            x: customerData.map(d => `Customer ${d.customer}`),
            y: customerData.map(d => parseFloat(d.percent)),
            type: 'bar',
            marker: { color: '#2196f3' },
            text: customerData.map(d => `${d.percent}%`),
            textposition: 'outside',
            textfont: { size: 12 },
            hovertemplate: '%{x}<br>%{y}% of total orders (%{customdata} orders)<extra></extra>',
            customdata: customerData.map(d => d.count)
        }], {
            margin: { l: 80, r: 50, t: 60, b: 120 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0.2)',
            font: { color: '#fff', size: 14 },
            xaxis: { 
                tickangle: -45, 
                tickfont: { size: 12 },
                title: { text: 'Customer', font: { size: 14 } }
            },
            yaxis: { 
                title: 'Percentage of Total Orders (%)', 
                ticksuffix: '%',
                tickfont: { size: 12 },
                titlefont: { size: 14 },
                range: [0, Math.max(...customerData.map(d => parseFloat(d.percent))) * 1.15]
            }
        });
        
        // Navigation buttons
        const rightDiv = document.getElementById('factorChartRight');
        const buttonDiv = document.createElement('div');
        buttonDiv.style.padding = '20px';
        buttonDiv.style.display = 'flex';
        buttonDiv.style.flexDirection = 'column';
        buttonDiv.style.justifyContent = 'center';
        buttonDiv.style.height = '100%';
        
        const title = document.createElement('h4');
        title.textContent = 'Drill Down Navigation';
        title.style.color = '#fff';
        title.style.marginBottom = '30px';
        title.style.textAlign = 'center';
        title.style.fontSize = '18px';
        buttonDiv.appendChild(title);
        
        const backToResp = document.createElement('button');
        backToResp.textContent = '← Back to Responsibility View';
        backToResp.style.width = '100%';
        backToResp.style.padding = '18px';
        backToResp.style.margin = '10px 0';
        backToResp.style.background = 'rgba(255,152,0,0.2)';
        backToResp.style.border = '1px solid #ff9800';
        backToResp.style.color = '#fff';
        backToResp.style.borderRadius = '8px';
        backToResp.style.cursor = 'pointer';
        backToResp.style.fontSize = '16px';
        backToResp.style.fontWeight = '500';
        
        backToResp.onclick = () => {
            this.drillLevel = 1;
            this.selectedCustomer = null;
            this.loadFactorData(this.currentKPI, this.currentMonth);
        };
        
        const backToMain = document.createElement('button');
        backToMain.textContent = '← Back to Main View';
        backToMain.style.width = '100%';
        backToMain.style.padding = '18px';
        backToMain.style.margin = '10px 0';
        backToMain.style.background = 'rgba(255,255,255,0.1)';
        backToMain.style.border = '1px solid #fff';
        backToMain.style.color = '#fff';
        backToMain.style.borderRadius = '8px';
        backToMain.style.cursor = 'pointer';
        backToMain.style.fontSize = '16px';
        backToMain.style.fontWeight = '500';
        
        backToMain.onclick = () => {
            this.drillLevel = 0;
            this.selectedResponsibility = null;
            this.selectedCustomer = null;
            this.loadFactorData(this.currentKPI, this.currentMonth);
        };
        
        buttonDiv.appendChild(backToResp);
        buttonDiv.appendChild(backToMain);
        rightDiv.appendChild(buttonDiv);
    },
    
    // Fallback methods if config doesn't provide them
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
    },
    
    // ==================== OEE CHARTS ====================
    
    renderOEECharts: function(data, month, config) {
        const container = document.getElementById('factorContent');
        
        let plant05Data = [];
        let plant06Data = [];
        
        if (this.currentPlant === 'All' || this.currentPlant === 'Plant-05') {
            plant05Data = config.getData(data, 'Plant-05', month);
        }
        
        if (this.currentPlant === 'All' || this.currentPlant === 'Plant-06') {
            plant06Data = config.getData(data, 'Plant-06', month);
        }
        
        plant05Data.sort((a, b) => b.value - a.value);
        plant06Data.sort((a, b) => b.value - a.value);
        
        const monthText = month;
        
        if (this.currentPlant === 'All' || this.currentPlant === 'Plant-05') {
            const card = document.createElement('div');
            card.className = 'factor-card';
            card.innerHTML = `<h3>🔵 Plant-05 OEE Loss Factors - ${monthText}</h3><div id="factorChart05" class="factor-chart" style="height: 450px;"></div>`;
            container.appendChild(card);
            
            if (plant05Data.length > 0) {
                const maxValue = Math.max(...plant05Data.map(d => d.value)) * 1.15;
                
                Plotly.newPlot('factorChart05', [{
                    x: plant05Data.map(d => d.value),
                    y: plant05Data.map(d => d.reason),
                    type: 'bar',
                    orientation: 'h',
                    marker: { color: '#2196f3' },
                    text: plant05Data.map(d => d.value.toFixed(1) + '%'),
                    textposition: 'outside',
                    textfont: { size: 12 },
                    hovertemplate: '%{y}<br>%{x}%<extra></extra>'
                }], {
                    margin: { l: 200, r: 80, t: 40, b: 50 },
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0.2)',
                    font: { color: '#fff', size: 14 },
                    xaxis: { 
                        title: 'Loss %', 
                        ticksuffix: '%', 
                        gridcolor: 'rgba(255,255,255,0.1)',
                        titlefont: { size: 14 },
                        tickfont: { size: 12 },
                        range: [0, maxValue]
                    },
                    yaxis: { 
                        tickfont: { size: 12 },
                        gridcolor: 'rgba(255,255,255,0.1)',
                        title: { text: 'Loss Factor', font: { size: 14 } }
                    }
                });
            } else {
                this.showNoDataInChart('factorChart05', 'No OEE data for Plant-05');
            }
        }
        
        if (this.currentPlant === 'All' || this.currentPlant === 'Plant-06') {
            const card = document.createElement('div');
            card.className = 'factor-card';
            card.innerHTML = `<h3>🟠 Plant-06 OEE Loss Factors - ${monthText}</h3><div id="factorChart06" class="factor-chart" style="height: 450px;"></div>`;
            container.appendChild(card);
            
            if (plant06Data.length > 0) {
                const maxValue = Math.max(...plant06Data.map(d => d.value)) * 1.15;
                
                Plotly.newPlot('factorChart06', [{
                    x: plant06Data.map(d => d.value),
                    y: plant06Data.map(d => d.reason),
                    type: 'bar',
                    orientation: 'h',
                    marker: { color: '#ff9800' },
                    text: plant06Data.map(d => d.value.toFixed(1) + '%'),
                    textposition: 'outside',
                    textfont: { size: 12 },
                    hovertemplate: '%{y}<br>%{x}%<extra></extra>'
                }], {
                    margin: { l: 200, r: 80, t: 40, b: 50 },
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0.2)',
                    font: { color: '#fff', size: 14 },
                    xaxis: { 
                        title: 'Loss %', 
                        ticksuffix: '%', 
                        gridcolor: 'rgba(255,255,255,0.1)',
                        titlefont: { size: 14 },
                        tickfont: { size: 12 },
                        range: [0, maxValue]
                    },
                    yaxis: { 
                        tickfont: { size: 12 },
                        gridcolor: 'rgba(255,255,255,0.1)',
                        title: { text: 'Loss Factor', font: { size: 14 } }
                    }
                });
            } else {
                this.showNoDataInChart('factorChart06', 'No OEE data for Plant-06');
            }
        }
    },
    
    // ==================== YMR CHARTS ====================
    
    renderYMRCharts: function(data, month, config) {
        const container = document.getElementById('factorContent');
        
        const monthText = month;
        
        if (this.currentPlant === 'All' || this.currentPlant === 'Plant-05') {
            const plantData = data.plant05.filter(d => d.month === month);
            
            if (plantData.length > 0) {
                // Get donut data from config
                const donutData = config.getDonutData ? 
                    config.getDonutData(data, 'Plant-05', month) : 
                    this.getDonutData(plantData);
                
                const knittingYield = donutData.knittingYield;
                const waste = donutData.waste;
                
                // First card: Donut chart
                const donutCard = document.createElement('div');
                donutCard.className = 'factor-card';
                donutCard.innerHTML = `<h3>🔵 Plant-05 YMR - ${monthText} (Yield Analysis)</h3><div id="factorChart05Donut" class="factor-chart" style="height: 400px;"></div>`;
                container.appendChild(donutCard);
                
                if (knittingYield > 0 || waste > 0) {
                    Plotly.newPlot('factorChart05Donut', [{
                        values: [knittingYield, waste],
                        labels: ['Knitting Yield', 'Total Waste'],
                        type: 'pie',
                        hole: 0.4,
                        marker: { colors: ['#4caf50', '#f44336'] },
                        textinfo: 'label+percent',
                        textposition: 'inside',
                        textfont: { size: 14 },
                        hovertemplate: '%{label}<br>%{percent} (%{value:.1f}%)<extra></extra>'
                    }], {
                        margin: { l: 50, r: 50, t: 50, b: 50 },
                        paper_bgcolor: 'rgba(0,0,0,0)',
                        plot_bgcolor: 'rgba(0,0,0,0.2)',
                        font: { color: '#fff', size: 14 },
                        showlegend: false,
                        annotations: [{
                            font: { size: 14, color: '#fff' },
                            showarrow: false,
                            text: `Yield: ${knittingYield.toFixed(1)}%`,
                            x: 0.5,
                            y: 0.5
                        }]
                    });
                } else {
                    this.showNoDataInChart('factorChart05Donut', 'No yield data available');
                }
                
                // Get component data from config
                const components = config.getComponentData ? 
                    config.getComponentData(data, 'Plant-05', month) :
                    plantData.filter(d => 
                        !d.reason.includes('Knitting Yield') && 
                        !d.reason.includes('% Waste') &&
                        !d.reason.includes('C + Shortfall') &&
                        Math.abs(d.value) > 0.01
                    );
                
                // Second card: Bar chart
                if (components.length > 0) {
                    const barCard = document.createElement('div');
                    barCard.className = 'factor-card';
                    barCard.innerHTML = `<h3>🔵 Plant-05 YMR - ${monthText} (Component Breakdown)</h3><div id="factorChart05Bar" class="factor-chart" style="height: 400px;"></div>`;
                    container.appendChild(barCard);
                    
                    const maxValue = Math.max(...components.map(d => Math.abs(d.value))) * 1.15;
                    const minValue = Math.min(...components.map(d => d.value), 0) * 1.15;
                    
                    Plotly.newPlot('factorChart05Bar', [{
                        x: components.map(d => d.reason),
                        y: components.map(d => d.value),
                        type: 'bar',
                        marker: { 
                            color: components.map(d => d.value >= 0 ? '#2196f3' : '#4caf50'),
                            line: { color: '#fff', width: 1 }
                        },
                        text: components.map(d => d.value.toFixed(1) + '%'),
                        textposition: 'outside',
                        textfont: { size: 12 },
                        hovertemplate: '%{x}<br>%{y:.1f}%<extra></extra>'
                    }], {
                        margin: { l: 80, r: 50, t: 50, b: 120 },
                        paper_bgcolor: 'rgba(0,0,0,0)',
                        plot_bgcolor: 'rgba(0,0,0,0.2)',
                        font: { color: '#fff', size: 14 },
                        xaxis: { 
                            tickangle: -45, 
                            tickfont: { size: 12 },
                            title: { text: 'Component', font: { size: 14 } }
                        },
                        yaxis: { 
                            title: 'Percentage (%)', 
                            ticksuffix: '%',
                            tickfont: { size: 12 },
                            titlefont: { size: 14 },
                            range: [minValue, maxValue]
                        }
                    });
                }
            } else {
                const card = document.createElement('div');
                card.className = 'factor-card';
                card.innerHTML = `<h3>🔵 Plant-05 YMR - ${monthText}</h3><div id="factorChart05Donut" class="factor-chart" style="height: 400px;"></div>`;
                container.appendChild(card);
                this.showNoDataInChart('factorChart05Donut', 'No YMR data for Plant-05');
            }
        }
        
        if (this.currentPlant === 'All' || this.currentPlant === 'Plant-06') {
            const plantData = data.plant06.filter(d => d.month === month);
            
            if (plantData.length > 0) {
                // Get donut data from config
                const donutData = config.getDonutData ? 
                    config.getDonutData(data, 'Plant-06', month) : 
                    this.getDonutData(plantData);
                
                const knittingYield = donutData.knittingYield;
                const waste = donutData.waste;
                
                // First card: Donut chart
                const donutCard = document.createElement('div');
                donutCard.className = 'factor-card';
                donutCard.innerHTML = `<h3>🟠 Plant-06 YMR - ${monthText} (Yield Analysis)</h3><div id="factorChart06Donut" class="factor-chart" style="height: 400px;"></div>`;
                container.appendChild(donutCard);
                
                if (knittingYield > 0 || waste > 0) {
                    Plotly.newPlot('factorChart06Donut', [{
                        values: [knittingYield, waste],
                        labels: ['Knitting Yield', 'Total Waste'],
                        type: 'pie',
                        hole: 0.4,
                        marker: { colors: ['#4caf50', '#f44336'] },
                        textinfo: 'label+percent',
                        textposition: 'inside',
                        textfont: { size: 14 },
                        hovertemplate: '%{label}<br>%{percent} (%{value:.1f}%)<extra></extra>'
                    }], {
                        margin: { l: 50, r: 50, t: 50, b: 50 },
                        paper_bgcolor: 'rgba(0,0,0,0)',
                        plot_bgcolor: 'rgba(0,0,0,0.2)',
                        font: { color: '#fff', size: 14 },
                        showlegend: false,
                        annotations: [{
                            font: { size: 14, color: '#fff' },
                            showarrow: false,
                            text: `Yield: ${knittingYield.toFixed(1)}%`,
                            x: 0.5,
                            y: 0.5
                        }]
                    });
                } else {
                    this.showNoDataInChart('factorChart06Donut', 'No yield data available');
                }
                
                // Get component data from config
                const components = config.getComponentData ? 
                    config.getComponentData(data, 'Plant-06', month) :
                    plantData.filter(d => 
                        !d.reason.includes('Knitting Yield') && 
                        !d.reason.includes('% Waste') &&
                        !d.reason.includes('C + Shortfall') &&
                        Math.abs(d.value) > 0.01
                    );
                
                // Second card: Bar chart
                if (components.length > 0) {
                    const barCard = document.createElement('div');
                    barCard.className = 'factor-card';
                    barCard.innerHTML = `<h3>🟠 Plant-06 YMR - ${monthText} (Component Breakdown)</h3><div id="factorChart06Bar" class="factor-chart" style="height: 400px;"></div>`;
                    container.appendChild(barCard);
                    
                    const maxValue = Math.max(...components.map(d => Math.abs(d.value))) * 1.15;
                    const minValue = Math.min(...components.map(d => d.value), 0) * 1.15;
                    
                    Plotly.newPlot('factorChart06Bar', [{
                        x: components.map(d => d.reason),
                        y: components.map(d => d.value),
                        type: 'bar',
                        marker: { 
                            color: components.map(d => d.value >= 0 ? '#ff9800' : '#4caf50'),
                            line: { color: '#fff', width: 1 }
                        },
                        text: components.map(d => d.value.toFixed(1) + '%'),
                        textposition: 'outside',
                        textfont: { size: 12 },
                        hovertemplate: '%{x}<br>%{y:.1f}%<extra></extra>'
                    }], {
                        margin: { l: 80, r: 50, t: 50, b: 120 },
                        paper_bgcolor: 'rgba(0,0,0,0)',
                        plot_bgcolor: 'rgba(0,0,0,0.2)',
                        font: { color: '#fff', size: 14 },
                        xaxis: { 
                            tickangle: -45, 
                            tickfont: { size: 12 },
                            title: { text: 'Component', font: { size: 14 } }
                        },
                        yaxis: { 
                            title: 'Percentage (%)', 
                            ticksuffix: '%',
                            tickfont: { size: 12 },
                            titlefont: { size: 14 },
                            range: [minValue, maxValue]
                        }
                    });
                }
            } else {
                const card = document.createElement('div');
                card.className = 'factor-card';
                card.innerHTML = `<h3>🟠 Plant-06 YMR - ${monthText}</h3><div id="factorChart06Donut" class="factor-chart" style="height: 400px;"></div>`;
                container.appendChild(card);
                this.showNoDataInChart('factorChart06Donut', 'No YMR data for Plant-06');
            }
        }
    },
    
    // Fallback method for YMR donut data
    getDonutData: function(plantData) {
        const knittingYield = plantData.find(d => d.reason.includes('Knitting Yield'))?.value || 0;
        const waste = plantData.find(d => d.reason.includes('% Waste'))?.value || 0;
        return { knittingYield, waste };
    },
    
    // ==================== UTILITY FUNCTIONS ====================
    
    showSingleChart: function(message) {
        const container = document.getElementById('factorContent');
        const card = document.createElement('div');
        card.className = 'factor-card';
        card.style.gridColumn = 'span 2';
        card.innerHTML = `<div style="height: 400px; display: flex; align-items: center; justify-content: center; color: #aaa; font-size: 18px;">${message}</div>`;
        container.appendChild(card);
    },
    
    showNoData: function(kpi, message) {
        const container = document.getElementById('factorContent');
        container.innerHTML = `<div style="grid-column: span 2; text-align: center; padding: 50px; color: #aaa; font-size: 18px;">${message || `No data for ${kpi}`}</div>`;
    },
    
    showNoDataInChart: function(chartId, message) {
        Plotly.newPlot(chartId, [{
            x: [0], y: [0], type: 'scatter', mode: 'text',
            text: [message],
            textfont: { size: 18, color: '#aaa' }
        }], {
            margin: { l: 50, r: 50, t: 50, b: 50 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0.2)',
            xaxis: { visible: false },
            yaxis: { visible: false }
        });
    }
};