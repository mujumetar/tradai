/**
 * Portfolio Auto-Updater Service
 * Runs every 60 seconds — fetches live prices for all ACTIVE portfolio calls
 * and auto-updates status (SL_HIT / TARGET1_HIT / TARGET2_HIT / TARGET3_HIT)
 */

const TradeIdea = require('../models/TradeIdea');
const axios = require('axios');

// ── Live price fetchers ──────────────────────────────────────────────────────
const fetchCryptoPrice = async (ticker) => {
    try {
        // Clean ticker: remove dashes and slashes commonly found in search results
        let sym = ticker.toUpperCase().replace(/[-/]/g, '');
        
        // Convert USD to USDT for Binance (e.g., BTC-USD -> BTCUSDT)
        if (sym.endsWith('USD') && !sym.endsWith('USDT')) {
            sym = sym.slice(0, -3) + 'USDT';
        }
        
        // If no pair is obvious, assume USDT
        if (!sym.includes('USDT') && !sym.includes('BTC') && !sym.includes('ETH') && !sym.includes('BNB') && !sym.includes('BUSD')) {
            sym += 'USDT';
        }

        const { data } = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${sym}`, { timeout: 5000 });
        return parseFloat(data.price);
    } catch (err) {
        console.warn(`[Crypto] Binance ticker ${ticker} not found or failed.`);
        return null;
    }
};

const fetchYahooPrice = async (ticker, market) => {
    const symbolMap = {
        NIFTY: '^NSEI', BANKNIFTY: '^NSEBANK', FINNIFTY: '^CNXFIN', SENSEX: '^BSESN',
        NIFTY50: '^NSEI', MIDCAP: '^CNX500',
        GOLD: 'GC=F', SILVER: 'SI=F', CRUDEOIL: 'CL=F', NATURALGAS: 'NG=F',
        EURUSD: 'EURUSD=X', USDINR: 'USDINR=X', GBPUSD: 'GBPUSD=X',
        GBPINR: 'GBPINR=X', USDJPY: 'USDJPY=X', AUDUSD: 'AUDUSD=X'
    };
    let yTicker = symbolMap[ticker.toUpperCase()];
    if (!yTicker) {
        if (ticker.includes('.') || ticker.includes('^') || ticker.includes('=')) {
            yTicker = ticker.toUpperCase();
        } else if (market === 'NSE') {
            yTicker = ticker.toUpperCase() + '.NS';
        } else if (market === 'BSE') {
            yTicker = ticker.toUpperCase() + '.BO';
        } else {
            yTicker = ticker.toUpperCase();
        }
    }

    try {
        // Use v8/finance/chart — works for NSE/BSE/Forex/Commodities without auth
        const { data } = await axios.get(
            `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yTicker)}?interval=1d&range=1d`,
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': '*/*'
                },
                timeout: 8000
            }
        );
        const meta = data?.chart?.result?.[0]?.meta;
        if (!meta || meta.regularMarketPrice == null) {
            console.error(`[Yahoo] No price data for ${yTicker}`);
            return null;
        }
        return meta.regularMarketPrice;
    } catch (err) {
        console.error(`[Yahoo] Fetch failed for ${yTicker}:`, err.response?.status ?? err.message);
        return null;
    }
};

const fetchLivePrice = async (ticker, market) => {
    try {
        if (market === 'CRYPTO') {
            const cryptoPrice = await fetchCryptoPrice(ticker);
            if (cryptoPrice) return cryptoPrice;
            // Fallback to Yahoo if Binance fails for crypto
            return await fetchYahooPrice(ticker, market);
        }
        return await fetchYahooPrice(ticker, market);
    } catch (err) {
        console.error(`[PriceFetch] Final error for ${ticker}:`, err.message);
        return null;
    }
};

// ── Status resolver ──────────────────────────────────────────────────────────
const resolveStatus = (call, livePrice) => {
    if (!livePrice) return call.status;
    // Don't downgrade already-hit statuses
    if (call.status === 'SL_HIT' || call.status === 'CLOSED') return call.status;

    const isBuy = call.type === 'BUY';

    if (isBuy) {
        if (livePrice <= call.stopLoss)                             return 'SL_HIT';
        if (call.target3 && livePrice >= call.target3)             return 'TARGET3_HIT';
        if (call.target2 && livePrice >= call.target2)             return 'TARGET2_HIT';
        if (livePrice >= call.target1)                             return 'TARGET1_HIT';
    } else { // SELL
        if (livePrice >= call.stopLoss)                             return 'SL_HIT';
        if (call.target3 && livePrice <= call.target3)             return 'TARGET3_HIT';
        if (call.target2 && livePrice <= call.target2)             return 'TARGET2_HIT';
        if (livePrice <= call.target1)                             return 'TARGET1_HIT';
    }
    return 'ACTIVE';
};

// ── Main runner ──────────────────────────────────────────────────────────────
const runAutoUpdate = async () => {
    try {
        // Only process calls that are still live (not closed / SL hit)
        const activeCalls = await TradeIdea.find({
            status: { $in: ['ACTIVE', 'TARGET1_HIT', 'TARGET2_HIT'] }
        });

        if (!activeCalls.length) return;

        console.log(`[Portfolio AutoUpdater] Checking ${activeCalls.length} active call(s)...`);

        // Fetch all prices in parallel (throttled batches of 5)
        const results = [];
        for (let i = 0; i < activeCalls.length; i += 5) {
            const batch = activeCalls.slice(i, i + 5);
            const batchResults = await Promise.allSettled(
                batch.map(call => fetchLivePrice(call.ticker, call.market))
            );
            results.push(...batchResults);
        }

        // Build bulk update operations
        const bulkOps = [];
        activeCalls.forEach((call, idx) => {
            const result = results[idx];
            if (result.status === 'fulfilled' && result.value) {
                const livePrice = result.value;
                const newStatus = resolveStatus(call, livePrice);

                bulkOps.push({
                    updateOne: {
                        filter: { _id: call._id },
                        update: {
                            $set: {
                                currentPrice: livePrice,
                                lastPriceUpdate: new Date(),
                                status: newStatus,
                                // Auto-set closedAt if SL triggered
                                ...(newStatus === 'SL_HIT' && !call.closedAt
                                    ? { closedAt: new Date(), closingPrice: livePrice }
                                    : {})
                            }
                        }
                    }
                });

                if (newStatus !== call.status) {
                    console.log(`[Portfolio AutoUpdater] ${call.ticker}: ${call.status} → ${newStatus} (CMP: ${livePrice})`);
                }
            }
        });

        if (bulkOps.length) {
            await TradeIdea.bulkWrite(bulkOps);
            console.log(`[TradeIdea AutoUpdater] Updated ${bulkOps.length} call(s).`);
        }
    } catch (err) {
        console.error('[TradeIdea AutoUpdater] Error:', err.message);
    }
};

// ── Start scheduled updates ──────────────────────────────────────────────────
const startAutoUpdater = () => {
    console.log('[TradeIdea AutoUpdater] Started — checking every 60 seconds.');
    // Run once immediately after start
    setTimeout(runAutoUpdate, 5000);
    // Then every 60 seconds
    setInterval(runAutoUpdate, 60 * 1000);
};

module.exports = { startAutoUpdater, runAutoUpdate, fetchLivePrice };
