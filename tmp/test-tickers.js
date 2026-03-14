const axios = require('axios');

const symbolMap = {
    NIFTY: '^NSEI', BANKNIFTY: '^NSEBANK', FINNIFTY: '^CNXFIN', SENSEX: '^BSESN',
    NIFTY50: '^NSEI', MIDCAP: '^CNX500',
    GOLD: 'GC=F', SILVER: 'SI=F', CRUDEOIL: 'CL=F', NATURALGAS: 'NG=F',
    EURUSD: 'EURUSD=X', USDINR: 'USDINR=X', GBPUSD: 'GBPUSD=X',
    GBPINR: 'GBPINR=X', USDJPY: 'USDJPY=X', AUDUSD: 'AUDUSD=X'
};

const getTicker = (ticker, market) => {
    return symbolMap[ticker.toUpperCase()] ||
        ((ticker.includes('.') || ticker.includes('^') || ticker.includes('=')) 
            ? ticker.toUpperCase() 
            : (market === 'BSE' ? ticker.toUpperCase() + '.BO' : ticker.toUpperCase() + '.NS'));
};

const test = () => {
    const cases = [
        { t: 'RELIANCE', m: 'NSE', e: 'RELIANCE.NS' },
        { t: 'RELIANCE.NS', m: 'NSE', e: 'RELIANCE.NS' },
        { t: 'TCS', m: 'BSE', e: 'TCS.BO' },
        { t: 'TCS.BO', m: 'BSE', e: 'TCS.BO' },
        { t: 'BTC-USD', m: 'CRYPTO', e: 'BTC-USD' }, // market=CRYPTO skip yahoo in real code but suffix logic check
        { t: 'USDINR=X', m: 'FOREX', e: 'USDINR=X' },
        { t: 'NIFTY', m: 'NSE', e: '^NSEI' },
        { t: 'EURUSD', m: 'FOREX', e: 'EURUSD=X' }
    ];

    cases.forEach(c => {
        const res = getTicker(c.t, c.m);
        console.log(`Input: ${c.t} (${c.m}) -> Output: ${res} | ${res === c.e ? 'PASS' : 'FAIL (Expected ' + c.e + ')'}`);
    });
};

test();
