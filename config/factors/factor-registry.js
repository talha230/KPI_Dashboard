// config/factors/factor-registry.js
const factorRegistry = {};

function registerFactor(kpi, config) {
    factorRegistry[kpi] = config;
    console.log(`✅ Factor registered: ${kpi}`);
}

function getFactorConfig(kpi) {
    return factorRegistry[kpi] || null;
}

function getAllFactors() {
    return Object.keys(factorRegistry);
}

function loadAllFactorConfigs() {
    // This function will be called after all configs are loaded
    console.log('📦 Registered factors:', getAllFactors());
}

// Make registry functions globally available
window.registerFactor = registerFactor;
window.getFactorConfig = getFactorConfig;
window.getAllFactors = getAllFactors;
window.loadAllFactorConfigs = loadAllFactorConfigs;