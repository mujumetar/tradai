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

// ── Tuning knobs ─────────────────────────────────────────────────────────────
const FETCH_INTERVAL = 5000;     // ms between full price-fetch cycles
const BATCH_SIZE     = 5;        // parallel API calls per batch

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

const fetchYahooPrice = async (ticker, market) => {
    const symbolMap = {
        NIFTY: '^NSEI', BANKNIFTY: '^NSEBANK', FINNIFTY: '^CNXFIN', SENSEX: '^BSESN',
        NIFTY50: '^NSEI', MIDCAP: '^CNXMID', SMALLCAP: '^CNXSMALL',
        NIFTY_IT: '^CNXIT', NIFTY_PHARMA: '^CNXPHARMA', NIFTY_AUTO: '^CNXAUTO',
        NIFTY_REALTY: '^CNXREALTY', NIFTY_METAL: '^CNXMETAL', NIFTY_FMCG: '^CNXFMCG',
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
            priceCache.set(String(call._id), {
                ticker: call.ticker,
                currentPrice: livePrice,
                status: newStatus,
                lastUpdate: new Date(),
                pnl
            });

            // ── Live Price Monitoring (Watched Trades) 🌐 ────────────────────
            // Notify specific users who are "watching" this particular trade.
            // Frequency: Every update tick where the price actually moved.
            if (livePrice !== call.currentPrice && !isTerminal) {
                const { notifyLivePrice } = require('./notificationService');
                notifyLivePrice({
                    tradeIdea: call,
                    price: livePrice,
                    pnlPercent: pnl.percent
                }).catch(() => {});
            }

            // ── Emit real-time tick via Socket.io ────────────────────────────
            if (io) {
                io.emit('price_update', {
                    id: call._id,
                    ticker: call.ticker,
                    currentPrice: livePrice,
                    status: newStatus,
                    lastUpdate: new Date(),
                    frozen: pnl.frozen,
                    pnl
                });
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
            io.emit('price_update', {
                id,
                ticker: entry.ticker,
                currentPrice: entry.currentPrice,
                status: entry.status,
                lastUpdate: entry.lastUpdate,
                frozen: false,
                pnl: entry.pnl,
            });
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
