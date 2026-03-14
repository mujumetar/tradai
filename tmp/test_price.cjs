const axios = require('axios');

const fetchCryptoPrice = async (ticker) => {
    try {
        let sym = ticker.toUpperCase().replace(/[-/]/g, '');
        if (sym.endsWith('USD') && !sym.endsWith('USDT')) {
            sym = sym.slice(0, -3) + 'USDT';
        }
        if (!sym.includes('USDT') && !sym.includes('BTC') && !sym.includes('ETH') && !sym.includes('BNB') && !sym.includes('BUSD')) {
            sym += 'USDT';
        }
        console.log(`[Test] Trying Binance with: ${sym}`);
        const { data } = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${sym}`, { timeout: 5000 });
        return parseFloat(data.price);
    } catch (err) {
        console.warn(`[Crypto] Binance ticker ${ticker} not found or failed: ${err.message}`);
        return null;
    }
};

const fetchYahooPrice = async (ticker, market) => {
    let yTicker = ticker.toUpperCase();
    console.log(`[Test] Trying Yahoo with: ${yTicker}`);
    try {
        const { data } = await axios.get(
            `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${yTicker}`,
            {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                timeout: 8000
            }
        );
        const result = data?.quoteResponse?.result?.[0];
        if (!result) {
            console.error(`[Yahoo] No data for ${yTicker}`);
            return null;
        }
        return result.regularMarketPrice;
    } catch (err) {
        console.error(`[Yahoo] Fetch failed for ${yTicker}:`, err.message);
        return null;
    }
};

const test = async () => {
    const ticker = 'BTC-USD';
    const market = 'CRYPTO';
    
    console.log(`Testing ${ticker} in ${market}...`);
    let price = await fetchCryptoPrice(ticker);
    if (!price) {
        console.log('Binance failed, trying Yahoo...');
        price = await fetchYahooPrice(ticker, market);
    }
    
    console.log(`Resulting Price: ${price}`);
};

test();
