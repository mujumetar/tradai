const axios = require('axios');

const fetchYahooPrice = async (yTicker) => {
    console.log(`[Test] Trying Yahoo with: ${yTicker}`);
    try {
        const { data } = await axios.get(
            `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${yTicker}`,
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                timeout: 8000
            }
        );
        console.log('Data:', JSON.stringify(data, null, 2));
        const result = data?.quoteResponse?.result?.[0];
        if (!result) {
            console.error(`[Yahoo] No data for ${yTicker}`);
            return null;
        }
        return result.regularMarketPrice;
    } catch (err) {
        if (err.response) {
            console.error(`[Yahoo] Fetch failed for ${yTicker}: ${err.response.status} ${JSON.stringify(err.response.data)}`);
        } else {
            console.error(`[Yahoo] Fetch failed for ${yTicker}:`, err.message);
        }
        return null;
    }
};

fetchYahooPrice('RELIANCE.NS');
