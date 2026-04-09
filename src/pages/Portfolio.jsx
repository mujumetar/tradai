import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    TrendingUp, TrendingDown, Target, ShieldAlert, Zap, RefreshCw,
    DollarSign, BarChart2, Award, AlertTriangle, CheckCircle2,
    XCircle, Clock, ArrowUpRight, ArrowDownRight, ChevronDown, ChevronUp,
    Globe, Lock, Activity, Wifi, WifiOff, Eye, EyeOff
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import { API_BASE_URL } from "../config";
import useSocket from "../hooks/useSocket";

// ── Currency formatters ──────────────────────────────────────────────────────
const CURRENCIES = [
    { code: "INR", symbol: "₹", label: "Indian Rupee" },
    { code: "USD", symbol: "$", label: "US Dollar" },
    { code: "EUR", symbol: "€", label: "Euro" },
    { code: "GBP", symbol: "£", label: "British Pound" },
    { code: "AED", symbol: "د.إ", label: "UAE Dirham" },
    { code: "SGD", symbol: "S$", label: "Singapore Dollar" },
];

const fmtCurrency = (val, sym) =>
    `${sym}${Math.abs(val).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

// ── Client-side P&L calculator (mirrors server Mongoose virtual) ─────────────
// This runs 100% in memory when a price_update socket event arrives,
// so the page never needs to hit the API just to see updated numbers.
const computePnl = (call, overridePrice = null) => {
    const livePrice = overridePrice ?? call.currentPrice;
    if (!livePrice) return call.pnl || null;

    let cmp = livePrice;
    const status = overridePrice ? resolveStatusClient(call, livePrice) : call.status;

    // Mirror the Mongoose virtual's target-floor logic
    if (!call.closedAt) {
        if (call.type === "BUY") {
            if (status === "TARGET3_HIT" && call.target3) cmp = Math.max(cmp, call.target3);
            else if (status === "TARGET2_HIT" && call.target2) cmp = Math.max(cmp, call.target2);
            else if (status === "TARGET1_HIT" && call.target) cmp = Math.max(cmp, call.target);
        } else {
            if (status === "TARGET3_HIT" && call.target3) cmp = Math.min(cmp, call.target3);
            else if (status === "TARGET2_HIT" && call.target2) cmp = Math.min(cmp, call.target2);
            else if (status === "TARGET1_HIT" && call.target) cmp = Math.min(cmp, call.target);
        }
    }

    const qty = call.quantity || (call.portfolioAmount ? call.portfolioAmount / call.entry : 1);
    const investedAmount = parseFloat((qty * call.entry).toFixed(2));
    const diff = call.type === "BUY" ? (cmp - call.entry) : (call.entry - cmp);
    const rupees = parseFloat((diff * qty).toFixed(2));
    const percent = parseFloat(((diff / call.entry) * 100).toFixed(2));

    return {
        qty: parseFloat(qty.toFixed(2)),
        investedAmount,
        rupees,
        percent,
        isProfit: rupees >= 0,
        currentValue: parseFloat((investedAmount + rupees).toFixed(2)),
        currencies: {
            USD: parseFloat((rupees * 0.012).toFixed(2)),
            EUR: parseFloat((rupees * 0.011).toFixed(2)),
            GBP: parseFloat((rupees * 0.0095).toFixed(2)),
            AED: parseFloat((rupees * 0.044).toFixed(2)),
            SGD: parseFloat((rupees * 0.016).toFixed(2)),
        }
    };
};

// ── Client-side status resolver (mirrors server resolveStatus) ───────────────
const STATUS_RANK = { ACTIVE: 0, TARGET1_HIT: 1, TARGET2_HIT: 2, TARGET3_HIT: 3, SL_HIT: 100, CLOSED: 100 };

const resolveStatusClient = (call, livePrice) => {
    if (!livePrice) return call.status;
    const currentStatus = call.status || "ACTIVE";
    const TERMINAL = ["SL_HIT", "TARGET3_HIT", "CLOSED"];
    if (TERMINAL.includes(currentStatus)) return currentStatus;

    let resolved = "ACTIVE";
    const isBuy = call.type === "BUY";

    if (isBuy) {
        if (livePrice <= call.stopLoss) resolved = "SL_HIT";
        else if (call.target3 && livePrice >= call.target3) resolved = "TARGET3_HIT";
        else if (call.target2 && livePrice >= call.target2) resolved = "TARGET2_HIT";
        else if (livePrice >= call.target) resolved = "TARGET1_HIT";
    } else {
        if (livePrice >= call.stopLoss) resolved = "SL_HIT";
        else if (call.target3 && livePrice <= call.target3) resolved = "TARGET3_HIT";
        else if (call.target2 && livePrice <= call.target2) resolved = "TARGET2_HIT";
        else if (livePrice <= call.target) resolved = "TARGET1_HIT";
    }

    if (resolved === "SL_HIT") return "SL_HIT";
    
    const currentRank = STATUS_RANK[currentStatus] || 0;
    const resolvedRank = STATUS_RANK[resolved] || 0;

    return resolvedRank > currentRank ? resolved : currentStatus;
};

// ── Status badge component ────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const map = {
        ACTIVE: { label: "Active", color: "bg-sky-500/10 text-sky-400 border-sky-500/20 shadow-[0_0_15px_rgba(14,165,233,0.1)]", icon: <Clock size={11} /> },
        TARGET1_HIT: { label: "Target 1 Hit", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]", icon: <CheckCircle2 size={11} /> },
        TARGET2_HIT: { label: "Target 2 Hit", color: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20 shadow-[0_0_15px_rgba(52,211,153,0.1)]", icon: <CheckCircle2 size={11} /> },
        TARGET3_HIT: { label: "Goal Reached", color: "bg-amber-400/10 text-amber-300 border-amber-400/20 shadow-[0_0_15px_rgba(251,191,36,0.1)]", icon: <Award size={11} /> },
        SL_HIT: { label: "Stopped Out", color: "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]", icon: <AlertTriangle size={11} /> },
        CLOSED: { label: "Finalized", color: "bg-gray-500/10 text-gray-400 border-gray-500/20", icon: <XCircle size={11} /> },
    };
    const s = map[status] || map.ACTIVE;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] border backdrop-blur-sm ${s.color}`}>
            {s.icon} {s.label}
        </span>
    );
};

// ── Price Progress bar ─────────────────────────────────────────────────────────
const PriceProgress = ({ entry, sl, t1, current, type }) => {
    const isBuy = type === "BUY";
    const min = isBuy ? sl : t1;
    const max = isBuy ? t1 : sl;
    const range = Math.abs(max - min);
    const progress = range > 0 ? ((current - min) / (max - min)) * 100 : 0;
    const clampedProgress = Math.min(100, Math.max(0, progress));
    const barPct = isBuy ? clampedProgress : 100 - clampedProgress;

    return (
        <div className="mt-4 px-1">
            <div className="flex justify-between text-[9px] text-gray-500 uppercase tracking-widest font-black mb-1.5 px-0.5">
                <span className="flex items-center gap-1"><ShieldAlert size={10} className="text-red-500/50" /> SL {sl}</span>
                <span className="text-white bg-white/5 px-2 py-0.5 rounded-md">CMP {current}</span>
                <span className="flex items-center gap-1">T1 {t1} <Target size={10} className="text-emerald-500/50" /></span>
            </div>
            <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden border border-white/5 relative shadow-inner">
                {/* Entry marker */}
                <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-white/20 z-10" 
                    style={{ left: `${isBuy ? (Math.abs(entry - sl) / range) * 100 : (Math.abs(entry - t1) / range) * 100}%` }}
                />
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${barPct}%` }}
                    className={`h-full transition-all duration-1000 ease-out relative ${
                        barPct > 75 ? "bg-gradient-to-r from-emerald-600 to-emerald-400" : 
                        barPct > 40 ? "bg-gradient-to-r from-orange-600 to-amber-400" : 
                        "bg-gradient-to-r from-red-700 to-red-500"
                    }`}
                >
                    <div className="absolute inset-0 bg-white/10 animate-pulse" />
                </motion.div>
            </div>
        </div>
    );
};

// ── Live price flash animation ─────────────────────────────────────────────────
const LivePrice = ({ price, prevPrice, symbol = "₹" }) => {
    const [flash, setFlash] = useState(null); // 'up' | 'down' | null
    const prevRef = useRef(prevPrice);

    useEffect(() => {
        const prev = prevRef.current;
        if (prev !== undefined && prev !== null && price !== prev) {
            setFlash(price > prev ? "up" : "down");
            const timer = setTimeout(() => setFlash(null), 1200);
            prevRef.current = price;
            return () => clearTimeout(timer);
        }
        prevRef.current = price;
    }, [price]);

    return (
        <motion.span
            key={price}
            animate={flash ? {
                color: flash === "up" ? ["#34d399", "#fbbf24"] : ["#f87171", "#fbbf24"],
                scale: [1.05, 1]
            } : {}}
            transition={{ duration: 0.6 }}
            className="text-xs font-bold text-amber-400"
        >
            {symbol}{price?.toLocaleString("en-IN")}
        </motion.span>
    );
};

// ── Single Call Card ──────────────────────────────────────────────────────────
const CallCard = ({ call, currency, isLocked, user }) => {
    const [expanded, setExpanded] = useState(false);
    const [isWatching, setIsWatching] = useState(user?.watchedTradeIdeas?.includes(call._id));
    const [watchLoading, setWatchLoading] = useState(false);

    const toggleWatch = async (e) => {
        e.stopPropagation();
        if (isLocked) return;
        setWatchLoading(true);
        try {
            const { data } = await api.post("/users/watch-trade", { tradeId: call._id });
            setIsWatching(data.isWatching);
            // Update local user object to keep it in sync for other cards if needed
            const updatedUser = { ...user, watchedTradeIdeas: data.isWatching 
                ? [...(user.watchedTradeIdeas || []), call._id]
                : (user.watchedTradeIdeas || []).filter(id => id !== call._id)
            };
            localStorage.setItem("user", JSON.stringify(updatedUser));
        } catch (err) {
            console.error("Failed to toggle watch:", err);
        } finally {
            setWatchLoading(false);
        }
    };

    const pnl = call.pnl || {};
    const isProfit = pnl.isProfit;
    const amountInSelected = currency.code === "INR"
        ? pnl.rupees
        : (pnl.currencies?.[currency.code] ?? pnl.rupees * 0.012);

    const slTriggered = call.status === "SL_HIT";
    const t3Hit = call.status === "TARGET3_HIT";
    const isClosed = call.status === "CLOSED";
    const targetHit = call.status?.includes("TARGET");
    // A call is frozen when the server has locked the P&L (SL / T3 / Closed)
    const isFrozen = call.frozen || slTriggered || t3Hit || isClosed;

    const entryVsReal = call.currentPrice && !isFrozen
        ? (((call.currentPrice - call.entry) / call.entry) * 100 * (call.type === "BUY" ? 1 : -1)).toFixed(2)
        : null;

    const actualInvested = pnl.investedAmount || (call.quantity ? call.quantity * call.entry : (call.portfolioAmount || 0));

    // Border / bg color based on status
    const cardClass = slTriggered
        ? "border-red-500/30 bg-red-500/5"
        : t3Hit
            ? "border-lime-400/30 bg-lime-400/5"
            : isClosed
                ? "border-gray-500/30 bg-gray-500/5"
                : targetHit
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-white/8 bg-[#0d0d0d]";

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative rounded-3xl border overflow-hidden transition-all duration-300 ${cardClass}`}
        >
            {isLocked && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[12px] z-20 flex flex-col items-center justify-center text-center p-8 rounded-[2.5rem] border border-white/10 ring-1 ring-white/5 shadow-2xl">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(249,115,22,0.3)] rotate-3">
                        <Lock className="text-black" size={32} />
                    </div>
                    <h3 className="text-xl font-black mb-2 text-white tracking-tight uppercase">Premium Access</h3>
                    <p className="text-gray-400 text-xs font-medium mb-6 leading-relaxed max-w-[200px]">Unlock high-conviction institutional trade ideas with TRADAI PRO.</p>
                    <Link to="/pricing" className="w-full bg-white text-black py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-400 transition-all hover:scale-[1.02] active:scale-95 shadow-xl">
                        Upgrade Now
                    </Link>
                </div>
            )}

            <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                    <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="text-xl font-black text-white tracking-tight uppercase">{call.ticker}</span>
                            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-lg border ${call.type === "BUY" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"}`}>
                                {call.type}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">{call.market}</span>
                            
                            {/* Live Watch Toggle */}
                            <button 
                                onClick={toggleWatch}
                                disabled={watchLoading}
                                className={`ml-1 flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all ${
                                    isWatching 
                                    ? "bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]" 
                                    : "bg-white/5 border-white/5 text-gray-500 hover:text-white"
                                }`}
                            >
                                {isWatching ? <Eye size={12} className="animate-pulse" /> : <EyeOff size={12} />}
                                <span className="text-[8px] font-black uppercase tracking-tighter">
                                    {isWatching ? "Live Notifications On" : "Track Live"}
                                </span>
                            </button>
                        </div>
                        <p className="text-gray-500 text-xs font-medium line-clamp-1">{call.title}</p>
                    </div>
                    <StatusBadge status={call.status} />
                </div>

                {/* P&L Interactive Banner */}
                <motion.div 
                    whileHover={{ scale: 1.01 }}
                    className={`rounded-[2rem] p-5 mb-5 shadow-2xl relative overflow-hidden group ${
                        isProfit 
                        ? "bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20" 
                        : "bg-gradient-to-br from-rose-500/10 to-red-500/5 border border-rose-500/20"
                    }`}
                >
                    {/* Background Glow */}
                    <div className={`absolute -right-10 -top-10 w-32 h-32 blur-[60px] opacity-20 pointer-events-none rounded-full ${isProfit ? "bg-emerald-500" : "bg-rose-500"}`} />
                    
                    <div className="flex items-end justify-between relative z-10">
                        <div>
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-1">Returns</p>
                            <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-xl ${isProfit ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                                    {isProfit ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                                </div>
                                <motion.span
                                    key={pnl.rupees}
                                    className={`text-3xl font-black tracking-tighter ${isProfit ? "text-emerald-400" : "text-rose-400"}`}
                                >
                                    {isProfit ? "+" : "-"}{fmtCurrency(Math.abs(amountInSelected ?? 0), currency.symbol)}
                                </motion.span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${isProfit ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"}`}>
                                    {isProfit ? "+" : ""}{pnl.percent?.toFixed(2)}%
                                </span>
                                {(!isFrozen && entryVsReal) && (
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">vs Entry</span>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-1">Net Value</p>
                            <motion.p
                                key={pnl.currentValue}
                                className="text-xl font-black text-white"
                            >
                                ₹{(pnl.currentValue ?? actualInvested + (pnl.rupees || 0)).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                            </motion.p>
                            <p className="text-[10px] text-gray-600 font-bold uppercase mt-1">Cap: ₹{actualInvested.toLocaleString("en-IN")}</p>
                        </div>
                    </div>
                </motion.div>

                {/* SL Triggered Warning */}
                {slTriggered && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-3 flex items-center gap-2">
                        <AlertTriangle className="text-red-400 shrink-0" size={16} />
                        <p className="text-red-300 text-xs font-semibold">Stop Loss Triggered at ₹{call.stopLoss} — Trade Closed</p>
                    </div>
                )}

                {/* Key Levels Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-2">
                    {[
                        { label: "Entry", val: call.entry, color: "text-white", icon: <ArrowUpRight size={10} /> },
                        { label: "Stop Loss", val: call.stopLoss, color: "text-rose-400", icon: <ShieldAlert size={10} /> },
                        { label: "Target 1", val: call.target, color: "text-emerald-400", icon: <Target size={10} /> },
                        { label: "CMP", val: call.currentPrice || pnl.closingPrice, color: "text-amber-400", live: true, icon: <Activity size={10} /> },
                    ].map(({ label, val, color, live, icon }) => (
                        <div key={label} className="bg-white/5 border border-white/5 rounded-2xl p-3 text-center relative overflow-hidden transition-colors hover:bg-white/8">
                            <div className="flex items-center justify-center gap-1.5 mb-1.5">
                                <span className={color}>{icon}</span>
                                <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest leading-none">{label}</p>
                            </div>
                            {live
                                ? <LivePrice price={val} symbol="₹" />
                                : <p className={`text-xs font-black ${color}`}>₹{val?.toLocaleString("en-IN")}</p>
                            }
                            {/* Live Ping */}
                            {live && !isFrozen && (
                                <div className="absolute top-2 right-2 flex items-center">
                                    <span className="w-1 h-1 bg-emerald-400 rounded-full animate-ping shadow-[0_0_4px_rgba(52,211,153,1)]" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Live vs Entry difference */}
                {entryVsReal !== null && (
                    <div className="flex items-center justify-between text-xs mb-2 px-1">
                        <span className="text-gray-500">Entry vs Live ({call.market})</span>
                        <span className={`font-bold ${parseFloat(entryVsReal) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {parseFloat(entryVsReal) >= 0 ? "+" : ""}{entryVsReal}%
                        </span>
                    </div>
                )}

                {/* T3-Hit Banner */}
                {t3Hit && (
                    <div className="bg-lime-400/10 border border-lime-400/30 rounded-xl p-3 mb-3 flex items-center gap-2">
                        <Award className="text-lime-400 shrink-0" size={16} />
                        <p className="text-lime-300 text-xs font-semibold">🏆 Target 3 Hit at ₹{call.target3} — P&amp;L Locked In</p>
                    </div>
                )}

                {/* Closed Banner */}
                {isClosed && (
                    <div className="bg-gray-500/10 border border-gray-500/30 rounded-xl p-3 mb-3 flex items-center gap-2">
                        <XCircle className="text-gray-400 shrink-0" size={16} />
                        <p className="text-gray-300 text-xs font-semibold">Trade Closed{call.closingPrice ? ` at ₹${call.closingPrice}` : ""} — P&amp;L Settled</p>
                    </div>
                )}

                {/* Price Progress — only show for non-frozen, non-closed calls */}
                {call.currentPrice && !isFrozen && (
                    <PriceProgress
                        entry={call.entry}
                        sl={call.stopLoss}
                        t1={call.target}
                        current={call.currentPrice}
                        type={call.type}
                    />
                )}

                {/* Expand toggle */}
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="w-full flex items-center justify-center gap-1 mt-3 text-xs text-gray-500 hover:text-white transition-colors py-1"
                >
                    {expanded ? "Hide Details" : "More Details"}
                    {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/5 overflow-hidden"
                    >
                        <div className="p-5 space-y-4">
                            {/* Targets T2/T3 */}
                            {(call.target2 || call.target3) && (
                                <div className="grid grid-cols-2 gap-2">
                                    {call.target2 && (
                                        <div className="bg-emerald-500/8 border border-emerald-500/15 rounded-xl p-3">
                                            <p className="text-[10px] text-emerald-600 uppercase tracking-wider mb-1">Target 2</p>
                                            <p className="text-sm font-bold text-emerald-400">₹{call.target2}</p>
                                        </div>
                                    )}
                                    {call.target3 && (
                                        <div className="bg-emerald-500/8 border border-emerald-500/15 rounded-xl p-3">
                                            <p className="text-[10px] text-emerald-600 uppercase tracking-wider mb-1">Target 3</p>
                                            <p className="text-sm font-bold text-emerald-300">₹{call.target3}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* P&L in all currencies */}
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">P&L in All Currencies</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {CURRENCIES.map(cur => {
                                        const amt = cur.code === "INR" ? pnl.rupees : (pnl.currencies?.[cur.code] ?? 0);
                                        return (
                                            <div key={cur.code} className="bg-white/4 rounded-xl p-2.5 text-center">
                                                <p className="text-[10px] text-gray-500 mb-1">{cur.code}</p>
                                                <p className={`text-xs font-bold ${amt >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                                    {amt >= 0 ? "+" : ""}{fmtCurrency(amt, cur.symbol)}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Closing price if closed */}
                            {call.closingPrice && (
                                <div className="bg-white/5 rounded-xl p-3 flex justify-between">
                                    <span className="text-xs text-gray-400">Real Exit Price</span>
                                    <span className="text-xs font-bold text-white">₹{call.closingPrice}</span>
                                </div>
                            )}

                            {/* Admin Notes */}
                            {call.notes && (
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                                    <p className="text-[10px] text-amber-500 uppercase tracking-widest font-black mb-1">Update From Admin</p>
                                    <p className="text-xs text-amber-200/90 leading-relaxed font-medium">{call.notes}</p>
                                </div>
                            )}

                            {/* Meta info */}
                            <div className="flex justify-between text-xs text-gray-500">
                                <span className="flex items-center gap-1"><Clock size={12} /> {call.timeHorizon || 'Swing'}</span>
                                {call.riskReward && <span>R:R {call.riskReward}</span>}
                                <span>{new Date(call.createdAt).toLocaleDateString("en-IN")}</span>
                            </div>

                            {/* Reasoning */}
                            {call.reasoning && (
                                <div className="bg-white/3 rounded-xl p-3 border border-white/5">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Trade Rationale</p>
                                    <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-line">{call.reasoning}</p>
                                </div>
                            )}

                            {/* Admin Updates / Notes */}
                            {call.notes && (
                                <div className="bg-amber-500/5 rounded-xl p-3 border border-amber-500/10">
                                    <p className="text-[10px] text-amber-500 uppercase tracking-widest mb-1 font-black">Live Update</p>
                                    <p className="text-xs text-amber-400/80 leading-relaxed font-medium italic">"{call.notes}"</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// ── Summary Stat Box with live animation ──────────────────────────────────────
const StatBox = ({ label, value, sub, color = "text-white", icon, live = false, trend = null }) => (
    <motion.div 
        whileHover={{ y: -4, backgroundColor: "rgba(255,255,255,0.05)" }}
        className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-5 relative overflow-hidden group shadow-2xl"
    >
        {/* Animated Light Edge */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
        
        {live && (
            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-tighter">Live</span>
            </div>
        )}
        
        <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-gray-400 group-hover:text-amber-400 transition-colors">
                {icon}
            </div>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">{label}</p>
        </div>

        <div className="flex items-baseline gap-2">
            <motion.p
                key={value}
                className={`text-2xl font-black tracking-tight ${color}`}
            >
                {value}
            </motion.p>
            {trend !== null && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400`}>
                    {trend}
                </span>
            )}
        </div>
        {sub && <p className="text-[10px] text-gray-600 font-bold uppercase mt-1 tracking-wide">{sub}</p>}
        
        {/* Subtle Decorative Gradient */}
        <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-white/5 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity rounded-full pointer-events-none" />
    </motion.div>
);

// ── Socket connection status chip ─────────────────────────────────────────────
const ConnectionChip = ({ connected, updateCount }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight border ${connected
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            : "bg-amber-500/10 border-amber-500/20 text-amber-400"
            }`}
    >
        {connected
            ? <><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Live {updateCount > 0 && `· ${updateCount} updates`}</>
            : <><span className="w-1.5 h-1.5 bg-amber-400 rounded-full" /> Polling</>
        }
    </motion.div>
);

// ── Main Portfolio View ─────────────────────────────────────────────────────────
const PortfolioView = () => {
    const [calls, setCalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currency, setCurrency] = useState(CURRENCIES[0]);
    const [filter, setFilter] = useState("ALL");
    const [marketFilter, setMarketFilter] = useState("ALL");
    const [refreshing, setRefreshing] = useState(false);
    const [isSocketConnected, setIsSocketConnected] = useState(false);
    const [liveUpdateCount, setLiveUpdateCount] = useState(0);
    const [lastTickTime, setLastTickTime] = useState(null);

    const user = JSON.parse(localStorage.getItem("user") || "null");
    const isPremium = user?.subscriptionPlan && user.subscriptionPlan !== "free";

    // ── Initial load ────────────────────────────────────────────────────────────
    const load = useCallback(async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        else setLoading(true);
        try {
            const { data: res } = await api.get("/trade-ideas");
            // Ensure every call has a fresh pnl computed from its currentPrice
            const enriched = res.map(call => ({
                ...call,
                pnl: call.pnl || computePnl(call)
            }));
            setCalls(enriched);
        } catch {
            setError("Failed to load portfolio. Please log in.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // ── Unified Communication Engine (Socket.io + Pusher) ──────────────────────────
    const socketUrl = API_BASE_URL
        ? API_BASE_URL
        : (import.meta.env.DEV
            ? "http://localhost:5000"
            : window.location.origin);

    const { on, off, isConnected } = useSocket(socketUrl, {
        path: "/socket.io",
        reconnectionAttempts: 15,
        reconnectionDelay: 2000,
    });

    useEffect(() => {
        setIsSocketConnected(isConnected);
    }, [isConnected]);

    const handlePriceUpdate = useCallback((data) => {
        setCalls(prev =>
            prev.map(call => {
                if (String(call._id) !== String(data.id)) return call;

                const TERMINAL = ["SL_HIT", "TARGET3_HIT", "CLOSED"];
                const isAlreadyTerminal = TERMINAL.includes(call.status);
                const isNowTerminal = TERMINAL.includes(data.status);

                if (isAlreadyTerminal && !isNowTerminal) return call;

                const freshPnl = data.pnl ||
                    computePnl({ ...call, currentPrice: data.currentPrice }, data.currentPrice);

                return {
                    ...call,
                    currentPrice: isNowTerminal
                        ? (data.pnl?.frozen ? call.currentPrice : data.currentPrice)
                        : data.currentPrice,
                    status: data.status || call.status,
                    lastPriceUpdate: data.lastUpdate,
                    frozen: data.frozen || isNowTerminal,
                    pnl: freshPnl,
                };
            })
        );
        setLiveUpdateCount(n => n + 1);
        setLastTickTime(new Date());
    }, []);

    useEffect(() => {
        on("price_update", handlePriceUpdate);
        return () => off("price_update", handlePriceUpdate);
    }, [on, off, handlePriceUpdate]);

    // ── 3-second Live Price Polling (works on Vercel without Pusher) ────────────
    // Calls the lightweight /api/live-prices endpoint every 3s.
    // Only updates price-critical fields: currentPrice, status, pnl, frozen.
    // Falls back to this whenever socket/Pusher is not connected.
    useEffect(() => {
        let isMounted = true;

        const pollPrices = async () => {
            try {
                const { data: prices } = await api.get('/live-prices');
                if (!isMounted) return;

                setCalls(prev => prev.map(call => {
                    const fresh = prices.find(p => String(p._id) === String(call._id));
                    if (!fresh) return call;

                    // Don't overwrite a terminal (frozen) call that we already know about
                    const TERMINAL = ['SL_HIT', 'TARGET3_HIT', 'CLOSED'];
                    if (call.frozen && !TERMINAL.includes(fresh.status)) return call;

                    return {
                        ...call,
                        currentPrice:     fresh.currentPrice    ?? call.currentPrice,
                        status:           fresh.status          ?? call.status,
                        lastPriceUpdate:  fresh.lastPriceUpdate ?? call.lastPriceUpdate,
                        frozen:           fresh.frozen          ?? call.frozen,
                        pnl:              fresh.pnl             ?? call.pnl,
                    };
                }));

                setLiveUpdateCount(n => n + 1);
                setLastTickTime(new Date());
                // Mark as "connected" so the Live chip shows green
                setIsSocketConnected(true);
            } catch {
                // Silently ignore — will retry next tick
                setIsSocketConnected(false);
            }
        };

        // Start immediately, then every 3 seconds
        pollPrices();
        const t = setInterval(pollPrices, 3000);
        return () => { isMounted = false; clearInterval(t); };
    }, []);

    // ── 30-second Full Data Refresh ──────────────────────────────────────────────
    // Refetches the entire trade list every 30 seconds to catch new trades or
    // major metadata updates that the lightweight 3s poll doesn't cover.
    useEffect(() => {
        const t = setInterval(() => {
            load(false); // pass false to avoid showing a global loading screen every 30s
        }, 30000);
        return () => clearInterval(t);
    }, [load]);

    // ── Filtered view ────────────────────────────────────────────────────────────
    const filtered = calls.filter(c => {
        if (marketFilter !== "ALL" && c.market?.toUpperCase() !== marketFilter) return false;
        if (filter === "ALL") return true;
        if (filter === "ACTIVE") return c.status === "ACTIVE";
        if (filter === "PROFIT") return c.pnl?.isProfit;
        if (filter === "LOSS") return !c.pnl?.isProfit;
        if (filter === "CLOSED") return c.status === "CLOSED" || c.status === "SL_HIT";
        return true;
    });

    if (loading) return (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Zap className="text-orange-400 animate-pulse" size={48} />
            <p className="text-gray-600 text-sm animate-pulse">Connecting to live data…</p>
        </div>
    );

    if (error) return (
        <div className="py-24 flex flex-col items-center justify-center gap-4">
            <p className="text-red-400">{error}</p>
            <Link to="/auth" className="text-orange-400 underline">Login to view portfolio</Link>
        </div>
    );

    // ── Aggregate stats — recalculated every render from live in-memory state ────
    // No API call needed: these recompute the moment ANY call's pnl changes via socket
    const s = {
        totalPnlRupees: calls.reduce((acc, c) => acc + (c.pnl?.rupees || 0), 0),
        totalInvested: calls.reduce((acc, c) => acc + (c.pnl?.investedAmount || (c.quantity ? c.quantity * c.entry : (c.portfolioAmount || 0))), 0),
        wins: calls.filter(c => c.pnl?.isProfit).length,
        losses: calls.filter(c => !c.pnl?.isProfit && (c.pnl?.rupees || 0) < 0).length,
        activeCalls: calls.filter(c => c.status === "ACTIVE").length,
        totalCalls: calls.length,
    };
    s.totalPnlPct = s.totalInvested ? ((s.totalPnlRupees / s.totalInvested) * 100).toFixed(2) : 0;
    s.winRate = (s.wins + s.losses) > 0 ? Math.round((s.wins / (s.wins + s.losses)) * 100) : 0;
    s.portfolioValue = s.totalInvested + s.totalPnlRupees;

    const totalPnlInCur = currency.code === "INR"
        ? s.totalPnlRupees
        : calls.reduce((acc, c) => acc + (c.pnl?.currencies?.[currency.code] ?? 0), 0);

    return (
        <section className="pb-32 px-6 max-w-7xl mx-auto mt-12">
            {/* Page Header */}
            <div className="mb-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div>
                    <div className="flex items-center gap-4 mb-3 flex-wrap">
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
                            Live <span className="bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent italic">Markets</span>
                        </h2>
                        <ConnectionChip connected={isSocketConnected} updateCount={liveUpdateCount} />
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 text-sm font-medium tracking-wide">
                        <Activity size={14} className={isSocketConnected ? "text-emerald-500 animate-pulse" : "text-gray-600"} />
                        <p>
                            {isSocketConnected
                                ? `Streaming real-time execution ${lastTickTime ? `• Last tick: ${lastTickTime.toLocaleTimeString("en-IN")}` : ""}`
                                : "Connecting to market liquidity center…"
                            }
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {/* Currency selector */}
                    <div className="relative group">
                        <select
                            value={currency.code}
                            onChange={e => setCurrency(CURRENCIES.find(c => c.code === e.target.value))}
                            className="appearance-none bg-[#0a0a0a] border border-white/10 text-white text-xs font-black uppercase tracking-widest pl-10 pr-10 py-3 rounded-2xl cursor-pointer focus:outline-none focus:border-amber-500/50 transition-all shadow-xl group-hover:border-white/20"
                        >
                            {CURRENCIES.map(c => (
                                <option key={c.code} value={c.code} className="bg-black text-xs font-sans uppercase">{c.symbol} {c.code}</option>
                            ))}
                        </select>
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" size={16} />
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                    </div>
                    {/* Manual Refresh */}
                    <button
                        onClick={() => load(true)}
                        className="bg-white text-black px-6 py-3 rounded-[1.2rem] text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-amber-400 transition-all shadow-xl hover:scale-105 active:scale-95"
                    >
                        <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                        Synchronize
                    </button>
                </div>
            </div>

            {/* Summary Stats — update live via socket without any API call */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                <StatBox
                    label="Total P&L"
                    value={`${totalPnlInCur >= 0 ? "+" : ""}${fmtCurrency(totalPnlInCur, currency.symbol)}`}
                    sub={`${s.totalPnlPct >= 0 ? "+" : ""}${s.totalPnlPct}% overall`}
                    color={s.totalPnlRupees >= 0 ? "text-emerald-400" : "text-red-400"}
                    icon={<DollarSign size={14} />}
                    live={isSocketConnected}
                />
                <StatBox
                    label="Win Rate"
                    value={`${s.winRate}%`}
                    sub={`${s.wins}W / ${s.losses}L`}
                    color={s.winRate >= 50 ? "text-emerald-400" : "text-red-400"}
                    icon={<Award size={14} />}
                    live={isSocketConnected}
                />
                <StatBox
                    label="Active Calls"
                    value={s.activeCalls}
                    sub={`${s.totalCalls} total calls`}
                    color="text-blue-400"
                    icon={<Zap size={14} />}
                />
                <StatBox
                    label="Portfolio Value"
                    value={`₹${s.portfolioValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
                    sub={`₹${s.totalInvested.toLocaleString("en-IN")} deployed`}
                    icon={<BarChart2 size={14} />}
                    live={isSocketConnected}
                />
            </div>

            {/* Filter Hub */}
            <div className="flex flex-col xl:flex-row gap-6 mb-12">
                <div className="bg-[#0a0a0a] border border-white/5 p-1.5 rounded-[1.5rem] flex items-center gap-1 overflow-x-auto no-scrollbar shadow-2xl">
                    {[
                        { key: "ALL", label: "Overview" },
                        { key: "ACTIVE", label: "Active Nodes" },
                        { key: "PROFIT", label: "Profits" },
                        { key: "LOSS", label: "Drawdowns" },
                        { key: "CLOSED", label: "Settled" },
                    ].map(f => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={`px-6 py-2.5 rounded-[1.2rem] text-xs font-black uppercase tracking-widest transition-all ${filter === f.key ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]" : "text-gray-500 hover:text-white hover:bg-white/5"}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 bg-[#0a0a0a] border border-white/5 p-1.5 rounded-[1.5rem] shadow-2xl overflow-x-auto no-scrollbar">
                    <div className="px-4 text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] border-r border-white/5 mr-1">Markets</div>
                    {['ALL', 'NSE', 'BSE', 'CRYPTO', 'FOREX', 'MCX'].map(m => (
                        <button
                            key={m}
                            onClick={() => setMarketFilter(m)}
                            className={`px-4 py-2 rounded-[1rem] text-[10px] font-black uppercase transition-all border ${marketFilter === m
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                : "bg-transparent text-gray-500 border-transparent hover:text-white"
                                }`}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>

            {/* No calls */}
            {filtered.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32 bg-[#0a0a0a] rounded-[3rem] border border-white/5 shadow-2xl">
                    <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <BarChart2 className="text-gray-700" size={40} />
                    </div>
                    <p className="text-white text-xl font-black tracking-tight mb-2">No data active in this sector</p>
                    <p className="text-gray-600 text-sm font-medium">Please select another market or status filter.</p>
                </motion.div>
            )}

            {/* Calls Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filtered.map((call) => (
                    <CallCard
                        key={call._id}
                        call={call}
                        currency={currency}
                        isLocked={call.isPremium && !isPremium}
                        user={user}
                    />
                ))}
            </div>

            {/* Live Edge Footer */}
            {isSocketConnected && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center gap-4 mt-24 py-12 border-t border-white/5"
                >
                    <div className="flex items-center gap-2 bg-emerald-500/5 px-4 py-2 rounded-2xl border border-emerald-500/10">
                        <div className="flex gap-1">
                            {[1, 2, 3].map(i => (
                                <motion.span
                                    key={i}
                                    animate={{ height: [4, 12, 4] }}
                                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                    className="w-1 bg-emerald-500 rounded-full"
                                />
                            ))}
                        </div>
                        <p className="text-[10px] text-emerald-500/80 font-black uppercase tracking-[0.2em]">
                            Synchronized with Liquidity Hub · {liveUpdateCount} ticks received
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Disclaimer */}
            <p className="text-center text-gray-500/50 text-[10px] mt-12 uppercase tracking-widest font-bold">
                ⚠️ Portfolio leverages real-time data from global liquidity nodes. Virtual amounts are for educational tracking.
            </p>
        </section>
    );
};

export default PortfolioView;
