// =============================================
// DATA MANAGER - Handles all data loading & storage
// =============================================

const DataManager = {
    monthlyData: [],
    ytdData: [],
    factorData: {},
    
    // Load main data from file
    loadMainData: async function() {
        try {
            const response = await fetch(CONFIG.dataFiles.main);
            if (!response.ok) throw new Error('File not found');
            const rawData = await response.text();
            this.parseMainData(rawData);
            console.log('✅ Main data loaded from file');
        } catch (error) {
            console.log('Main data file not found');
            throw error;
        }
    },
    
    // Load all factor data using config files
    loadAllFactorData: async function() {
        const factors = getAllFactors();
        if (!factors || factors.length === 0) return;
        
        for (const kpi of factors) {
            try {
                const config = getFactorConfig(kpi);
                if (!config) continue;
                
                const response = await fetch(config.dataFile);
                if (!response.ok) continue;
                
                const rawData = await response.text();
                this.factorData[kpi] = config.parseData(rawData);
                console.log(`✅ Loaded ${kpi} factor data from file`);
            } catch (error) {
                console.log(`${kpi} factor file not found`);
            }
        }
    },
    
    // Parse main KPI data
    parseMainData: function(rawData) {
        const rows = rawData.split('\n').filter(row => row.trim());
        if (rows.length === 0) return;
        
        const headers = rows[0].split('\t').map(h => h.trim().toLowerCase());
        
        const monthIdx = headers.findIndex(h => h.includes('month'));
        const kpiIdx = headers.findIndex(h => h.includes('kpi'));
        const dirIdx = headers.findIndex(h => h.includes('direction'));
        const plantIdx = headers.findIndex(h => h.includes('plant'));
        const achievedIdx = headers.findIndex(h => h.includes('achieved'));
        const targetIdx = headers.findIndex(h => h.includes('target'));
        
        if (monthIdx === -1 || kpiIdx === -1 || plantIdx === -1 || achievedIdx === -1 || targetIdx === -1) {
            console.error('Required columns not found');
            return;
        }
        
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
        
        console.log(`✅ Parsed ${this.monthlyData.length} monthly rows and ${this.ytdData.length} YTD rows`);
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
    
    // Get filtered factor data by month using factor config
    getFactorDataByMonth: function(kpi, plant, month) {
        const config = getFactorConfig(kpi);
        if (!config || !this.factorData[kpi]) return [];
        
        return config.getData(this.factorData[kpi], plant, month);
    },
    
    // Get available months for factor filter
    getFactorMonths: function(kpi) {
        const data = this.factorData[kpi];
        if (!data || !data.months) return ['All'];
        return ['All', ...data.months];
    },
    
    // Getter methods
    getMonthlyData: function() { return this.monthlyData; },
    getYTDData: function() { return this.ytdData; }
};