/**
 * Portfolio Auto-Updater Service
 * ─────────────────────────────────────────────────────────────────────────────
 * • Fetches live prices for ACTIVE / T1 / T2 calls every FETCH_INTERVAL ms
 * • Emits a `price_update` socket event PER TICK for every connected client
 * • Freezes P&L when status reaches SL_HIT, TARGET3_HIT, or CLOSED
 * • Does NOT re-process already-terminal calls (SL_HIT / TARGET3_HIT / CLOSED)
 * • Heartbeat uses an in-memory price cache — no per-second DB queries
 */

const TradeIdea = require('../models/TradeIdea');
const axios = require('axios');
const Pusher = require('pusher');

// ── Pusher Setup ─────────────────────────────────────────────────────────────
let pusher = null;
if (process.env.PUSHER_APP_ID && process.env.PUSHER_KEY && process.env.PUSHER_SECRET) {
    pusher = new Pusher({
        appId: process.env.PUSHER_APP_ID,
        key: process.env.PUSHER_KEY,
        secret: process.env.PUSHER_SECRET,
        cluster: process.env.PUSHER_CLUSTER,
        useTLS: true,
    });
} else {
    console.warn('⚠️  Pusher keys not set — real-time updates via Pusher are disabled.');
}

// ── Tuning knobs ─────────────────────────────────────────────────────────────
const FETCH_INTERVAL = 5000;     // ms between full price-fetch cycles
const BATCH_SIZE = 5;        // parallel API calls per batch

// ── Terminal status set ───────────────────────────────────────────────────────
// Once a call reaches one of these statuses, its P&L is frozen and no further
// price updates are emitted for it via the heartbeat.
const TERMINAL_STATUSES = new Set(['SL_HIT', 'TARGET3_HIT', 'CLOSED']);

// ── In-memory price cache ─────────────────────────────────────────────────────
// Populated / updated after every successful fetch cycle.
// Map<string(callId), { ticker, currentPrice, status, lastUpdate, pnl }>
const priceCache = new Map();

// ── Live price fetchers ───────────────────────────────────────────────────────
const fetchCryptoPrice = async (ticker) => {
    try {
        let sym = ticker.toUpperCase().replace(/[-/]/g, '');
        if (sym.endsWith('USD') && !sym.endsWith('USDT')) sym = sym.slice(0, -3) + 'USDT';
        if (!sym.includes('USDT') && !sym.includes('BTC') && !sym.includes('ETH') &&
            !sym.includes('BNB') && !sym.includes('BUSD')) sym += 'USDT';
        const { data } = await axios.get(
            `https://api.binance.com/api/v3/ticker/price?symbol=${sym}`, { timeout: 5000 }
        );
        return parseFloat(data.price);
    } catch {
        console.warn(`[Crypto] Binance ticker ${ticker} not found or failed.`);
        return null;
    }
};

// ── In-memory mappings for resolved tickers (e.g. "NIFTY22900PE" -> "NIFTY2640222900PE.NS") ──
const resolvedTickerCache = new Map();

const getNSEExpiryTickers = (base, strike, type) => {
    const symbols = [];
    const now = new Date();
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    
    let current = new Date(now);
    const istHour = now.getUTCHours() + 5;
    const istMinute = now.getUTCMinutes() + 30;
    const isLateThursday = now.getDay() === 4 && (istHour > 15 || (istHour === 15 && istMinute > 30));
    
    if (isLateThursday) current.setDate(current.getDate() + 1);

    for (let i = 0; i < 4; i++) {
        const nextThursday = new Date(current);
        nextThursday.setDate(current.getDate() + (4 + 7 - current.getDay()) % 7);
        if (i === 0 && nextThursday.getTime() === current.getTime() && isLateThursday) {
            nextThursday.setDate(nextThursday.getDate() + 7);
        }
        
        const yy = String(nextThursday.getFullYear()).slice(-2);
        const m = nextThursday.getMonth() + 1;
        const mmm = months[nextThursday.getMonth()];
        const dd = String(nextThursday.getDate()).padStart(2, '0');
        
        // Format A: NIFTY2640222900PE.NS
        symbols.push(`${base}${yy}${m}${dd}${strike}${type}.NS`);
        // Format B: NIFTY26APR22900PE.NS
        symbols.push(`${base}${yy}${mmm}${strike}${type}.NS`);
        // Format C: NIFTY26APR0222900PE.NS
        symbols.push(`${base}${yy}${mmm}${dd}${strike}${type}.NS`);
        
        current = new Date(nextThursday);
        current.setDate(current.getDate() + 1);
    }
    return symbols;
};

const fetchYahooPrice = async (ticker, market) => {
    // 1. Normalize: remove all whitespace and convert to uppercase
    const cleanTicker = ticker.replace(/\s+/g, '').toUpperCase();

    // 2. Check cache first
    if (resolvedTickerCache.has(cleanTicker)) {
        return await fetchIndividualYahooPrice(resolvedTickerCache.get(cleanTicker));
    }

    const symbolMap = {
        // Core Indices
        NIFTY: '^NSEI', NIFTY50: '^NSEI', BANKNIFTY: '^NSEBANK', FINNIFTY: '^CNXFIN', SENSEX: '^BSESN',
        MIDCAP: '^CNXMID', SMALLCAP: '^CNXSMALL',
        
        // Sectoral Indices
        NIFTYIT: '^CNXIT', NIFTYPHARMA: '^CNXPHARMA', NIFTYAUTO: '^CNXAUTO',
        NIFTYREALTY: '^CNXREALTY', NIFTYMETAL: '^CNXMETAL', NIFTYFMCG: '^CNXFMCG',
        NIFTYBANK: '^NSEBANK', NIFTYENERGY: '^CNXENERGY', NIFTYINFRA: '^CNXINFRA',
        NIFTYPSE: '^CNXPSE', NIFTYCPSE: '^CNXCPSE', NIFTYMNC: '^CNXMNC',
        
        // Commodities & Forex
        GOLD: 'GC=F', SILVER: 'SI=F', CRUDEOIL: 'CL=F', NATURALGAS: 'NG=F',
        EURUSD: 'EURUSD=X', USDINR: 'USDINR=X', GBPUSD: 'GBPUSD=X',
        GBPINR: 'GBPINR=X', USDJPY: 'USDJPY=X', AUDUSD: 'AUDUSD=X'
    };

    let yTicker = symbolMap[cleanTicker];

    if (!yTicker) {
        // ── Automated Expiry Resolver for NSE Options ──
        // Regex matches: (NIFTY|BANKNIFTY|FINNIFTY) + (Strike) + (CE|PE)
        const optionMatch = cleanTicker.match(/^(NIFTY|BANKNIFTY|FINNIFTY)(\d+)(CE|PE)$/);
        if (optionMatch && market === 'NSE') {
            const [_, base, strike, type] = optionMatch;
            const candidates = getNSEExpiryTickers(base, strike, type);
            
            for (const cand of candidates) {
                const price = await fetchIndividualYahooPrice(cand);
                if (price) {
                    resolvedTickerCache.set(cleanTicker, cand);
                    return price;
                }
            }
        }

        // Standard logic
        if (cleanTicker.includes('.') || cleanTicker.includes('^') || cleanTicker.includes('=')) {
            yTicker = cleanTicker;
        } else if (market === 'NSE') {
            yTicker = cleanTicker + '.NS';
        } else if (market === 'BSE') {
            yTicker = cleanTicker + '.BO';
        } else {
            yTicker = cleanTicker;
        }
    }

    return await fetchIndividualYahooPrice(yTicker);
};

// Helper for the actual HTTP call
const fetchIndividualYahooPrice = async (yTicker) => {
    try {
        const { data } = await axios.get(
            `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yTicker)}?interval=1m&range=1d`,
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                    'Accept': '*/*'
                },
                timeout: 8000
            }
        );
        const meta = data?.chart?.result?.[0]?.meta;
        if (!meta || meta.regularMarketPrice == null) return null;
        return meta.regularMarketPrice;
    } catch (err) {
        return null;
    }
};

const fetchLivePrice = async (ticker, market) => {
    try {
        if (market === 'CRYPTO') {
            const p = await fetchCryptoPrice(ticker);
            if (p) return p;
        }
        return await fetchYahooPrice(ticker, market);
    } catch (err) {
        console.error(`[PriceFetch] Final error for ${ticker}:`, err.message);
        return null;
    }
};

const STATUS_RANK = {
    'ACTIVE': 0,
    'TARGET1_HIT': 1,
    'TARGET2_HIT': 2,
    'TARGET3_HIT': 3,
    'SL_HIT': 100,      // Terminal
    'CLOSED': 100      // Terminal
};

// ── Status resolver ───────────────────────────────────────────────────────────
// Only called for calls that are NOT yet terminal.
const resolveStatus = (call, livePrice) => {
    if (!livePrice) return call.status;
    const currentStatus = call.status || 'ACTIVE';
    if (TERMINAL_STATUSES.has(currentStatus)) return currentStatus;

    let resolved = 'ACTIVE';
    const isBuy = call.type === 'BUY';

    if (isBuy) {
        if (livePrice <= call.stopLoss) resolved = 'SL_HIT';
        else if (call.target3 && livePrice >= call.target3) resolved = 'TARGET3_HIT';
        else if (call.target2 && livePrice >= call.target2) resolved = 'TARGET2_HIT';
        else if (livePrice >= (call.target || call.target1)) resolved = 'TARGET1_HIT';
    } else {
        if (livePrice >= call.stopLoss) resolved = 'SL_HIT';
        else if (call.target3 && livePrice <= call.target3) resolved = 'TARGET3_HIT';
        else if (call.target2 && livePrice <= call.target2) resolved = 'TARGET2_HIT';
        else if (livePrice <= (call.target || call.target1)) resolved = 'TARGET1_HIT';
    }

    // PROTECTION: Status can only "move forward" (up the rank) OR hit SL.
    // It should NEVER downgrade (e.g. from T2 Hit back to T1 Hit).
    if (resolved === 'SL_HIT') return 'SL_HIT'; // SL overrides everything except terminal

    const currentRank = STATUS_RANK[currentStatus] || 0;
    const resolvedRank = STATUS_RANK[resolved] || 0;

    return resolvedRank > currentRank ? resolved : currentStatus;
};

// ── P&L calculator ──────────────────────────────────────────────────────────
// ⚠ FREEZE when SL_HIT, TARGET3_HIT, or CLOSED — P&L is locked at the exit price.
// The frontend checks `frozen` to stop the live-dot animation and price updates.
const computePnlPayload = (call, newStatus, livePrice) => {
    let cmp = livePrice;

    // --- FREEZE LOGIC ---
    const isTerminal = TERMINAL_STATUSES.has(newStatus);

    if (isTerminal) {
        if (newStatus === 'SL_HIT') {
            cmp = call.stopLoss;                        // Lock at SL price
        } else if (newStatus === 'TARGET3_HIT') {
            cmp = call.target3 ?? livePrice;            // Lock at T3 price
        } else if (newStatus === 'CLOSED') {
            cmp = call.closingPrice ?? livePrice;       // Lock at admin-set closing price
        }
    } else if (!call.closedAt) {
        // For non-terminal hits (T1, T2), floor/cap at the hit level
        if (call.type === 'BUY') {
            if (newStatus === 'TARGET2_HIT' && call.target2) cmp = Math.max(cmp, call.target2);
            else if (newStatus === 'TARGET1_HIT' && (call.target || call.target1)) cmp = Math.max(cmp, call.target || call.target1);
        } else {
            if (newStatus === 'TARGET2_HIT' && call.target2) cmp = Math.min(cmp, call.target2);
            else if (newStatus === 'TARGET1_HIT' && (call.target || call.target1)) cmp = Math.min(cmp, call.target || call.target1);
        }
    }

    const qty = call.quantity || (call.portfolioAmount ? call.portfolioAmount / call.entry : 1);
    const investedAmount = parseFloat((qty * call.entry).toFixed(2));
    const diff = call.type === 'BUY' ? (cmp - call.entry) : (call.entry - cmp);
    const rupees = parseFloat((diff * qty).toFixed(2));
    const percent = parseFloat(((diff / call.entry) * 100).toFixed(2));
    const currentValue = parseFloat((investedAmount + rupees).toFixed(2));

    return {
        qty: parseFloat(qty.toFixed(2)),
        investedAmount,
        rupees,
        percent,
        isProfit: rupees >= 0,
        currentValue,
        frozen: isTerminal,   // tell the frontend: P&L is settled, stop pinging
        currencies: {
            USD: parseFloat((rupees * 0.012).toFixed(2)),
            EUR: parseFloat((rupees * 0.011).toFixed(2)),
            GBP: parseFloat((rupees * 0.0095).toFixed(2)),
            AED: parseFloat((rupees * 0.044).toFixed(2)),
            SGD: parseFloat((rupees * 0.016).toFixed(2))
        }
    };
};

// ── Main runner ───────────────────────────────────────────────────────────────
let isRunning = false;   // guard against overlapping runs

const runAutoUpdate = async (io = null) => {
    if (isRunning) {
        console.log('[AutoUpdater] Previous run still in progress — skipping.');
        return;
    }
    isRunning = true;
    try {
        // Only process calls that can still change:
        // ACTIVE, TARGET1_HIT, TARGET2_HIT — NOT SL_HIT / TARGET3_HIT / CLOSED
        const activeCalls = await TradeIdea.find({
            status: { $in: ['ACTIVE', 'TARGET1_HIT', 'TARGET2_HIT'] }
        });

        if (!activeCalls.length) {
            console.log('[AutoUpdater] No active calls to update.');
            return;
        }

        console.log(`[AutoUpdater] Fetching prices for ${activeCalls.length} call(s)…`);

        // Throttle: fetch in batches of BATCH_SIZE
        const results = [];
        for (let i = 0; i < activeCalls.length; i += BATCH_SIZE) {
            const batch = activeCalls.slice(i, i + BATCH_SIZE);
            const batchResults = await Promise.allSettled(
                batch.map(c => fetchLivePrice(c.ticker, c.market))
            );
            results.push(...batchResults);
        }

        const bulkOps = [];

        activeCalls.forEach((call, idx) => {
            const result = results[idx];
            if (result.status !== 'fulfilled' || !result.value) return;

            const livePrice = result.value;
            const newStatus = resolveStatus(call, livePrice);
            const isTerminal = TERMINAL_STATUSES.has(newStatus);

            // Build the DB update
            const $set = {
                currentPrice: livePrice,
                lastPriceUpdate: new Date(),
                status: newStatus,
            };

            // Auto-record closure time & price when terminal events fire
            if (isTerminal && !call.closedAt) {
                $set.closedAt = new Date();
                $set.closingPrice = newStatus === 'SL_HIT'
                    ? call.stopLoss
                    : (call.target3 ?? livePrice);
            }

            bulkOps.push({
                updateOne: { filter: { _id: call._id }, update: { $set } }
            });

            if (newStatus !== call.status) {
                console.log(`[AutoUpdater] ${call.ticker}: ${call.status} → ${newStatus} @ ₹${livePrice}`);

                // ── Automated Notifications 🚀 ──────────────────────────────
                // Notify users only when a significant milestone is reached (T1, T2, T3 or SL)
                if (['TARGET1_HIT', 'TARGET2_HIT', 'TARGET3_HIT', 'SL_HIT'].includes(newStatus)) {
                    const { notifyUsers } = require('./notificationService');
                    const isProfit = newStatus.includes('TARGET');
                    const emoji = isProfit ? '🎯' : '🛑';
                    const hitLabel = newStatus.replace('_', ' ');

                    notifyUsers({
                        title: `${emoji} Trade Alert: ${call.ticker}`,
                        body: `Trade update for ${call.ticker}:\nStatus: ${hitLabel}\nPrice: ₹${livePrice}\n\nCheck your portfolio for more details.`,
                        url: '/research',
                        type: call.isPremium ? 'premium' : 'all',
                        sendEmail: true
                    }).catch(err => console.error(`[AutoUpdater] Notification failed for ${call.ticker}:`, err.message));
                }
            }

            // ── Update in-memory cache for heartbeat ─────────────────────────
            const pnl = computePnlPayload(call, newStatus, livePrice);
            const cacheKey = String(call._id);
            const cachedEntry = priceCache.get(cacheKey);

            priceCache.set(cacheKey, {
                ticker: call.ticker,
                currentPrice: livePrice,
                status: newStatus,
                lastUpdate: new Date(),
                pnl,
                lastNotifiedPrice: cachedEntry?.lastNotifiedPrice || call.currentPrice,
                lastNotifiedTime: cachedEntry?.lastNotifiedTime || 0
            });

            // ── Live Price Monitoring (Watched Trades) 🌐 ────────────────────
            // Notify specific users who are "watching" this particular trade.
            // Frequency: Only if price has moved significantly (>1%) OR 15 mins passed.
            const updatedCacheEntry = priceCache.get(cacheKey);
            const lastPrice = updatedCacheEntry.lastNotifiedPrice;
            const lastTime = updatedCacheEntry.lastNotifiedTime;
            const now = Date.now();

            const priceDiffPct = lastPrice ? Math.abs((livePrice - lastPrice) / lastPrice) * 100 : 100;
            const timeDiffMin = (now - lastTime) / (1000 * 60);

            if (!isTerminal && (priceDiffPct >= 1.0 || timeDiffMin >= 15)) {
                const { notifyLivePrice } = require('./notificationService');
                notifyLivePrice({
                    tradeIdea: call,
                    price: livePrice,
                    pnlPercent: pnl.percent
                }).catch(() => { });

                // Update notification markers in cache
                updatedCacheEntry.lastNotifiedPrice = livePrice;
                updatedCacheEntry.lastNotifiedTime = now;
            }

            // ── Emit real-time tick via Socket.io / Pusher ────────────────────────────
            const payload = {
                id: call._id,
                ticker: call.ticker,
                currentPrice: livePrice,
                status: newStatus,
                lastUpdate: new Date(),
                frozen: pnl.frozen,
                pnl
            };

            if (io) {
                io.emit('price_update', payload);
            }

            // Also trigger Pusher for serverless production
            if (pusher) {
                pusher.trigger('price-updates', 'price_update', payload)
                    .catch(err => console.error('[Pusher] Trigger failed:', err.message));
            }
        });

        if (bulkOps.length) {
            await TradeIdea.bulkWrite(bulkOps);
            console.log(`[AutoUpdater] Updated ${bulkOps.length} call(s) in DB.`);
        }
    } catch (err) {
        console.error('[AutoUpdater] Error:', err.message);
    } finally {
        isRunning = false;
    }
};

// ── Heartbeat: re-emit cached prices every second ─────────────────────────────
// Runs purely in-memory — NO DB query every second.
// Only emits for NON-terminal calls; terminal calls are frozen and need no update.
let cachedEmitter = null;

const startPriceHeartbeat = (io) => {
    if (cachedEmitter) clearInterval(cachedEmitter);
    cachedEmitter = setInterval(() => {
        if (!io || priceCache.size === 0) return;
        for (const [id, entry] of priceCache) {
            // Skip terminal/frozen calls — their P&L is settled, no more updates needed
            if (TERMINAL_STATUSES.has(entry.status)) continue;

            const payload = {
                id,
                ticker: entry.ticker,
                currentPrice: entry.currentPrice,
                status: entry.status,
                lastUpdate: entry.lastUpdate,
                frozen: false,
                pnl: entry.pnl,
            };

            if (io) {
                io.emit('price_update', payload);
            }

            // Only heartbeat Pusher if we are not in a strict serverless context 
            // where cost/limits per trigger might be an issue. 
            // For now, let's keep heartbeat to Socket.io local and let runAutoUpdate handle Pusher.
        }
    }, 1000);  // every 1 second — purely in-memory, zero DB/HTTP traffic
};

// ── Start scheduled updates ───────────────────────────────────────────────────
const startAutoUpdater = (io) => {
    console.log(`[AutoUpdater] Started — live price fetch every ${FETCH_INTERVAL / 1000}s, heartbeat every 1s.`);

    // Fetch immediately on boot then on interval
    setTimeout(() => runAutoUpdate(io), 3000);
    setInterval(() => runAutoUpdate(io), FETCH_INTERVAL);

    // 1-second heartbeat — re-emits cached prices, zero extra DB/HTTP load
    startPriceHeartbeat(io);
};

module.exports = { startAutoUpdater, runAutoUpdate, fetchLivePrice, priceCache };
