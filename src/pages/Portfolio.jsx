import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    TrendingUp, TrendingDown, Target, ShieldAlert, Zap, RefreshCw,
    DollarSign, BarChart2, Award, AlertTriangle, CheckCircle2,
    XCircle, Clock, ArrowUpRight, ArrowDownRight, ChevronDown, ChevronUp,
    Globe, Lock
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../utils/api";

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

// ── Status badge component ────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const map = {
        ACTIVE: { label: "Active", color: "bg-blue-500/15 text-blue-400 border-blue-500/30", icon: <Clock size={11} /> },
        TARGET1_HIT: { label: "T1 Hit ✓", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", icon: <CheckCircle2 size={11} /> },
        TARGET2_HIT: { label: "T2 Hit ✓✓", color: "bg-green-400/15 text-green-300 border-green-400/30", icon: <CheckCircle2 size={11} /> },
        TARGET3_HIT: { label: "T3 Hit ✓✓✓", color: "bg-lime-400/15 text-lime-300 border-lime-400/30", icon: <Award size={11} /> },
        SL_HIT: { label: "SL Triggered", color: "bg-red-500/15 text-red-400 border-red-500/30", icon: <AlertTriangle size={11} /> },
        CLOSED: { label: "Closed", color: "bg-gray-500/15 text-gray-400 border-gray-500/30", icon: <XCircle size={11} /> },
    };
    const s = map[status] || map.ACTIVE;
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${s.color}`}>
            {s.icon} {s.label}
        </span>
    );
};

// ── Progress bar for price between SL and Target ─────────────────────────────
const PriceProgress = ({ entry, sl, t1, current, type }) => {
    const isBuy = type === "BUY";
    const min = isBuy ? sl : t1;
    const max = isBuy ? t1 : sl;
    const pct = Math.min(100, Math.max(0, ((current - min) / (max - min)) * 100));
    const barPct = isBuy ? pct : 100 - pct;
    return (
        <div className="mt-3">
            <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                <span>SL {sl}</span>
                <span className="text-white font-bold">CMP {current}</span>
                <span>T1 {t1}</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-700 ${barPct > 60 ? "bg-emerald-500" : barPct > 30 ? "bg-amber-500" : "bg-red-500"}`}
                    style={{ width: `${barPct}%` }}
                />
            </div>
        </div>
    );
};

// ── Single Call Card ──────────────────────────────────────────────────────────
const CallCard = ({ call, currency, isLocked }) => {
    const [expanded, setExpanded] = useState(false);
    const pnl = call.pnl || {};
    const isProfit = pnl.isProfit;
    const amountInSelected = currency.code === "INR"
        ? pnl.rupees
        : (pnl.currencies?.[currency.code] ?? pnl.rupees * 0.012);

    const slTriggered = call.status === "SL_HIT";
    const targetHit = call.status?.includes("TARGET");

    const entryVsReal = call.currentPrice
        ? (((call.currentPrice - call.entryPrice) / call.entryPrice) * 100 * (call.type === "BUY" ? 1 : -1)).toFixed(2)
        : null;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative rounded-3xl border overflow-hidden transition-all duration-300 ${slTriggered ? "border-red-500/30 bg-red-500/5" : targetHit ? "border-emerald-500/30 bg-emerald-500/5" : "border-white/8 bg-[#0d0d0d]"}`}
        >
            {isLocked && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-md z-20 flex flex-col items-center justify-center text-center p-6 rounded-3xl">
                    <div className="w-14 h-14 bg-orange-500/20 rounded-full flex items-center justify-center mb-3">
                        <Lock className="text-orange-400" size={28} />
                    </div>
                    <h3 className="text-lg font-bold mb-1">Premium Members Only</h3>
                    <p className="text-gray-400 text-sm mb-5">Unlock all portfolio calls with Liquide One</p>
                    <Link to="/pricing" className="bg-gradient-to-r from-orange-500 to-amber-400 text-black px-7 py-2.5 rounded-full font-bold text-sm hover:opacity-90 transition-opacity">
                        Upgrade Now
                    </Link>
                </div>
            )}

            <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg font-black text-white">{call.ticker}</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${call.type === "BUY" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                                {call.type}
                            </span>
                            <span className="text-xs text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">{call.market}</span>
                        </div>
                        <p className="text-gray-400 text-sm line-clamp-1">{call.title}</p>
                    </div>
                    <StatusBadge status={call.status} />
                </div>

                {/* P&L Banner */}
                <div className={`rounded-2xl p-4 mb-4 flex items-center justify-between ${isProfit ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
                    <div>
                        <p className="text-xs text-gray-400 mb-0.5">Portfolio P&L</p>
                        <div className="flex items-center gap-2">
                            {isProfit ? <ArrowUpRight className="text-emerald-400" size={20} /> : <ArrowDownRight className="text-red-400" size={20} />}
                            <span className={`text-2xl font-black ${isProfit ? "text-emerald-400" : "text-red-400"}`}>
                                {isProfit ? "+" : "-"}{fmtCurrency(Math.abs(amountInSelected), currency.symbol)}
                            </span>
                        </div>
                        <p className={`text-sm font-bold ${isProfit ? "text-emerald-400" : "text-red-400"}`}>
                            {isProfit ? "+" : ""}{pnl.percent?.toFixed(2)}%
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500">Current Value</p>
                        <p className={`text-sm font-bold ${isProfit ? "text-emerald-400" : "text-red-400"}`}>
                            ₹{((call.portfolioAmount || 100000) + (pnl.rupees || 0)).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Invested: ₹{(call.portfolioAmount || 100000).toLocaleString("en-IN")}</p>
                    </div>
                </div>

                {/* SL Triggered Warning */}
                {slTriggered && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-3 flex items-center gap-2">
                        <AlertTriangle className="text-red-400 shrink-0" size={16} />
                        <p className="text-red-300 text-xs font-semibold">Stop Loss Triggered at ₹{call.stopLoss} — Trade Closed</p>
                    </div>
                )}

                {/* Key Levels Grid */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                    {[
                        { label: "Entry", val: call.entryPrice, color: "text-white" },
                        { label: "SL", val: call.stopLoss, color: "text-red-400" },
                        { label: "T1", val: call.target1, color: "text-emerald-400" },
                        { label: "CMP", val: call.currentPrice || pnl.exitPrice, color: "text-amber-400" },
                    ].map(({ label, val, color }) => (
                        <div key={label} className="bg-white/4 rounded-xl p-2.5 text-center">
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{label}</p>
                            <p className={`text-xs font-bold ${color}`}>₹{val?.toLocaleString("en-IN")}</p>
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

                {/* Price Progress */}
                {call.currentPrice && (
                    <PriceProgress
                        entry={call.entryPrice}
                        sl={call.stopLoss}
                        t1={call.target1}
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

                            {/* Meta info */}
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>⏱ {call.timeHorizon}</span>
                                {call.riskReward && <span>R:R {call.riskReward}</span>}
                                <span>{new Date(call.createdAt).toLocaleDateString("en-IN")}</span>
                            </div>

                            {/* Reasoning */}
                            {call.reasoning && (
                                <div className="bg-white/3 rounded-xl p-3">
                                    <p className="text-xs text-gray-400 leading-relaxed">{call.reasoning}</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// ── Summary Stat Box ──────────────────────────────────────────────────────────
const StatBox = ({ label, value, sub, color = "text-white", icon }) => (
    <div className="bg-[#0d0d0d] border border-white/8 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
            <span className="text-gray-500">{icon}</span>
            <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
        </div>
        <p className={`text-xl font-black ${color}`}>{value}</p>
        {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
    </div>
);

// ── Main View Component ─────────────────────────────────────────────────────────
const PortfolioView = () => {
    const [calls, setCalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currency, setCurrency] = useState(CURRENCIES[0]);
    const [filter, setFilter] = useState("ALL");
    const [marketFilter, setMarketFilter] = useState("ALL"); // New multiple selector for Market
    const [refreshing, setRefreshing] = useState(false);

    const user = JSON.parse(localStorage.getItem("user") || "null");
    const isPremium = user?.subscriptionPlan && user.subscriptionPlan !== "free";

    const load = useCallback(async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        else setLoading(true);
        try {
            const { data: res } = await api.get("/trade-ideas");
            setCalls(res);
        } catch {
            setError("Failed to load portfolio. Please log in.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // Auto-refresh every 90 seconds for live prices
    useEffect(() => {
        const t = setInterval(() => load(true), 90000);
        return () => clearInterval(t);
    }, [load]);

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
        <div className="py-24 flex items-center justify-center">
            <Zap className="text-orange-400 animate-pulse" size={48} />
        </div>
    );

    if (error) return (
        <div className="py-24 flex flex-col items-center justify-center gap-4">
            <p className="text-red-400">{error}</p>
            <Link to="/auth" className="text-orange-400 underline">Login to view portfolio</Link>
        </div>
    );

    const s = {
        totalPnlRupees: calls.reduce((acc, c) => acc + (c.pnl?.rupees || 0), 0),
        totalInvested: calls.reduce((acc, c) => acc + (c.portfolioAmount || 100000), 0),
        wins: calls.filter(c => c.pnl?.isProfit).length,
        losses: calls.filter(c => !c.pnl?.isProfit && (c.pnl?.rupees || 0) < 0).length,
        activeCalls: calls.filter(c => c.status === "ACTIVE").length,
        totalCalls: calls.length,
    };
    s.totalPnlPct = s.totalInvested ? ((s.totalPnlRupees / s.totalInvested) * 100).toFixed(2) : 0;
    s.winRate = (s.wins + s.losses) > 0 ? Math.round((s.wins / (s.wins + s.losses)) * 100) : 0;

    const totalPnlInCur = currency.code === "INR"
        ? s.totalPnlRupees
        : calls.reduce((acc, c) => acc + (c.pnl?.currencies?.[currency.code] ?? 0), 0);

    return (
        <section className="pb-24 px-6 max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl md:text-4xl font-black mb-2">Live <span style={{ background: "linear-gradient(135deg,#f97316,#eab308)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Portfolio</span></h2>
                    <p className="text-gray-500 text-sm">Real-time tracked trade calls with live P&L • Auto-refreshes every 90s</p>
                </div>

                    <div className="flex items-center gap-3">
                        {/* Currency selector */}
                        <div className="relative">
                            <select
                                value={currency.code}
                                onChange={e => setCurrency(CURRENCIES.find(c => c.code === e.target.value))}
                                className="appearance-none bg-white/6 border border-white/10 text-white text-sm px-4 py-2 pr-8 rounded-xl cursor-pointer focus:outline-none"
                            >
                                {CURRENCIES.map(c => (
                                    <option key={c.code} value={c.code} className="bg-black">{c.symbol} {c.code}</option>
                                ))}
                            </select>
                            <Globe className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                        </div>
                        {/* Refresh */}
                        <button
                            onClick={() => load(true)}
                            className="bg-white/6 border border-white/10 px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:bg-white/10 transition-colors"
                        >
                            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                    <StatBox
                        label="Total P&L"
                        value={`${totalPnlInCur >= 0 ? "+" : ""}${fmtCurrency(totalPnlInCur, currency.symbol)}`}
                        sub={`${s.totalPnlPct >= 0 ? "+" : ""}${s.totalPnlPct}% overall`}
                        color={s.totalPnlRupees >= 0 ? "text-emerald-400" : "text-red-400"}
                        icon={<DollarSign size={14} />}
                    />
                    <StatBox
                        label="Win Rate"
                        value={`${s.winRate}%`}
                        sub={`${s.wins}W / ${s.losses}L`}
                        color={s.winRate >= 50 ? "text-emerald-400" : "text-red-400"}
                        icon={<Award size={14} />}
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
                        value={`₹${((s.totalInvested || 0) + (s.totalPnlRupees || 0)).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
                        sub={`₹${(s.totalInvested || 0).toLocaleString("en-IN")} deployed`}
                        icon={<BarChart2 size={14} />}
                    />
                </div>

                {/* Filter Tabs & Market Selectors */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
                        {[
                            { key: "ALL", label: "All Calls" },
                            { key: "ACTIVE", label: "🔵 Active" },
                            { key: "PROFIT", label: "🟢 Profit" },
                            { key: "LOSS", label: "🔴 Loss" },
                            { key: "CLOSED", label: "⬛ Closed" },
                        ].map(f => (
                            <button
                                key={f.key}
                                onClick={() => setFilter(f.key)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${filter === f.key ? "bg-orange-500 text-black font-bold" : "bg-white/6 text-gray-400 hover:text-white border border-white/10"}`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2 items-center">
                        <span className="text-xs text-gray-400 uppercase tracking-widest px-2">Market</span>
                        {['ALL', 'NSE', 'BSE'].map(m => (
                            <button
                                key={m}
                                onClick={() => setMarketFilter(m)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                    marketFilter === m
                                        ? "bg-amber-500/20 text-amber-400 border-amber-500/50"
                                        : "bg-transparent text-gray-500 border-white/10 hover:text-white"
                                }`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>

                {/* No calls */}
                {filtered.length === 0 && (
                    <div className="text-center py-24">
                        <BarChart2 className="mx-auto text-gray-700 mb-4" size={48} />
                        <p className="text-gray-500 text-lg">No calls in this category yet.</p>
                        <p className="text-gray-600 text-sm">Check back soon for expert trade ideas!</p>
                    </div>
                )}

                {/* Calls Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filtered.map((call, idx) => (
                        <CallCard
                            key={call._id}
                            call={call}
                            currency={currency}
                            isLocked={call.isPremium && !isPremium}
                        />
                    ))}
                </div>

                {/* Disclaimer */}
                <p className="text-center text-gray-700 text-xs mt-12">
                    ⚠️ Portfolio uses real live prices from Binance & Yahoo Finance. Virtual ₹ amounts for educational tracking only.
                </p>
            </section>
    );
};

export default PortfolioView;
