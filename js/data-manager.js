// =============================================
// DATA MANAGER - Handles all data loading & storage
// =============================================

const DataManager = {
    monthlyData: [],
    ytdData: [],
    factorData: {
        OTD: { plant05: [], plant06: [], months: [] },
        OEE: { plant05: [], plant06: [], months: [] },
        YMR: { plant05: [], plant06: [], months: [] }
    },
    
    // Initialize - load all data from files
    init: async function() {
        try {
            await this.loadMainData();
            await this.loadAllFactorData();
            UI.showDashboard();
            ChartRenderer.updateAll();
            document.getElementById('lastUpdated').innerText = 'Data loaded from files: ' + new Date().toLocaleString();
        } catch (error) {
            console.error('Error loading data:', error);
            // Fall back to paste mode if files not found
            document.getElementById('pasteBar').classList.remove('hidden');
        }
    },
    
    // Load main data from file
    loadMainData: async function() {
        try {
            const response = await fetch(CONFIG.dataFiles.main);
            const rawData = await response.text();
            this.parseMainData(rawData);
        } catch (error) {
            console.log('Main data file not found, using paste mode');
            throw error;
        }
    },
    
    // Load all factor data
    loadAllFactorData: async function() {
        for (const [kpi, path] of Object.entries(CONFIG.dataFiles.factors)) {
            try {
                const response = await fetch(path);
                const rawData = await response.text();
                this.parseFactorData(kpi, rawData);
            } catch (error) {
                console.log(`${kpi} factor file not found`);
            }
        }
    },
    
    // Parse main KPI data
    parseMainData: function(rawData) {
        const rows = rawData.split('\n').filter(row => row.trim());
        const headers = rows[0].split('\t').map(h => h.trim().toLowerCase());
        
        const monthIdx = headers.findIndex(h => h.includes('month'));
        const kpiIdx = headers.findIndex(h => h.includes('kpi'));
        const dirIdx = headers.findIndex(h => h.includes('direction'));
        const plantIdx = headers.findIndex(h => h.includes('plant'));
        const achievedIdx = headers.findIndex(h => h.includes('achieved'));
        const targetIdx = headers.findIndex(h => h.includes('target'));
        
        this.monthlyData = [];
        this.ytdData = [];
        
        for(let i = 1; i < rows.length; i++) {
            const cols = rows[i].split('\t');
            if(cols.length < 6) continue;
            
            const record = this.parseRow(cols, monthIdx, kpiIdx, dirIdx, plantIdx, achievedIdx, targetIdx);
            if (record) {
                if (record.Month.toUpperCase() === 'YTD') {
                    this.ytdData.push(record);
                } else {
                    this.monthlyData.push(record);
                }
            }
        }
    },
    
    // Parse factor data
    parseFactorData: function(kpi, rawData) {
        const rows = rawData.split('\n').filter(row => row.trim());
        const headers = rows[0].split('\t').map(h => h.trim());
        
        // Check if data has month column
        const hasMonth = headers[0].toLowerCase().includes('month');
        let monthIdx = -1;
        let reasonIdx = 0;
        let plant05Idx = 1;
        let plant06Idx = 2;
        
        if (hasMonth) {
            monthIdx = 0;
            reasonIdx = 1;
            plant05Idx = 2;
            plant06Idx = 3;
        }
        
        // Store months for filter
        const months = new Set();
        const plant05Data = [];
        const plant06Data = [];
        
        for(let i = 1; i < rows.length; i++) {
            const cols = rows[i].split('\t');
            if (cols.length < 3) continue;
            
            const month = hasMonth ? cols[monthIdx]?.trim() : 'All';
            if (hasMonth) months.add(month);
            
            const reason = cols[reasonIdx]?.trim();
            const plant05 = parseFloat(cols[plant05Idx]?.trim()) || 0;
            const plant06 = parseFloat(cols[plant06Idx]?.trim()) || 0;
            
            plant05Data.push({ month, reason, value: plant05 });
            plant06Data.push({ month, reason, value: plant06 });
        }
        
        this.factorData[kpi] = {
            plant05: plant05Data,
            plant06: plant06Data,
            months: hasMonth ? Array.from(months).sort((a,b) => (CONFIG.monthOrder[a] || 999) - (CONFIG.monthOrder[b] || 999)) : ['All']
        };
    },
    
    // Parse a single row (helper)
    parseRow: function(cols, monthIdx, kpiIdx, dirIdx, plantIdx, achievedIdx, targetIdx) {
        let month = cols[monthIdx]?.trim();
        let kpi = cols[kpiIdx]?.trim();
        let direction = dirIdx !== -1 ? cols[dirIdx]?.trim() : CONFIG.defaultDirection;
        let plant = cols[plantIdx]?.trim();
        let achievedStr = cols[achievedIdx]?.trim();
        let targetStr = cols[targetIdx]?.trim();
        
        if (!month || !kpi || !plant || !achievedStr || !targetStr) return null;
        
        const isPercent = achievedStr.includes('%');
        let achieved = parseFloat(achievedStr.replace('%', ''));
        let target = parseFloat(targetStr.replace('%', ''));
        
        if (isNaN(achieved) || isNaN(target)) return null;
        
        return {
            Month: month,
            KPI: kpi,
            Direction: direction,
            Plant: plant,
            Achieved: achieved / (isPercent ? 100 : 1),
            Target: target / (isPercent ? 100 : 1),
            IsPercent: isPercent
        };
    },
    
    // Get filtered factor data by month
    getFactorDataByMonth: function(kpi, plant, month) {
        const data = this.factorData[kpi];
        if (!data) return [];
        
        const plantData = plant === 'Plant-05' ? data.plant05 : data.plant06;
        
        if (month === 'All') {
            // Aggregate all months (average)
            const reasons = [...new Set(plantData.map(d => d.reason))];
            return reasons.map(reason => {
                const values = plantData.filter(d => d.reason === reason).map(d => d.value);
                const avg = values.reduce((a,b) => a + b, 0) / values.length;
                return { reason, value: avg };
            });
        } else {
            // Filter by specific month
            return plantData.filter(d => d.month === month).map(d => ({ reason: d.reason, value: d.value }));
        }
    },
    
    // Get available months for factor filter
    getFactorMonths: function(kpi) {
        return this.factorData[kpi]?.months || ['All'];
    },
    
    // Getter methods
    getMonthlyData: function() { return this.monthlyData; },
    getYTDData: function() { return this.ytdData; }
};