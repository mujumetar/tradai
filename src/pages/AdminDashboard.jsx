import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users, CreditCard, Layout, Settings, AlertCircle, Plus, Search,
    Bell, ShieldX, CheckCircle, Download, X as CloseIcon, Trash2,
    BarChart2, Key, Edit2, TrendingUp, FileText, Zap, MessageSquare, Mail,
    StopCircle, Play, Copy, ExternalLink,
    Globe, BellRing, Menu, ChevronRight
} from "lucide-react";
import useSocket from "../hooks/useSocket";
import api from "../utils/api";
import { API_BASE_URL } from "../config";
import { PERMISSIONS, hasPermission } from "../utils/rbac";
import { cn } from "../utils/cn";
import { useSearchParams } from "react-router-dom";

// ─── Modals ─────────────────────────────────────────────────────────────────

const UserDetailsModal = ({ user, onClose, onUpdate }) => {
    const [role, setRole] = useState(user.role);
    const [sub, setSub] = useState(user.subscription);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get(`/admin/invoices/${user._id}`).then(r => setInvoices(r.data)).catch(() => { });
    }, [user._id]);

    const handleSave = async () => {
        setLoading(true);
        try { await api.put(`/admin/users/${user._id}`, { role, subscription: sub }); onUpdate(); onClose(); }
        catch { alert("Update failed"); }
        setLoading(false);
    };

    const toggleStatus = async () => {
        const newStatus = user.status === 'banned' ? 'active' : 'banned';
        try { await api.put(`/admin/users/${user._id}/status`, { status: newStatus }); onUpdate(); onClose(); }
        catch { alert("Status update failed"); }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-[#111] border border-white/10 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-8 relative">
                <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-white"><CloseIcon size={22} /></button>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 rounded-full bg-orange-500/20 flex items-center justify-center text-2xl font-bold text-orange-400">{user.name?.[0]}</div>
                    <div>
                        <h2 className="text-xl font-bold">{user.name}</h2>
                        <p className="text-gray-400 text-sm">{user.email}</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${user.status === 'banned' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>{user.status}</span>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="text-xs text-gray-500 uppercase tracking-widest block mb-2">Role</label>
                        <select value={role} onChange={e => setRole(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none">
                            <option value="user">User</option>
                            <option value="support">Support</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase tracking-widest block mb-2">Subscription</label>
                        <select value={sub} onChange={e => setSub(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none">
                            <option value="free">Free</option>
                            <option value="premium">Premium</option>
                        </select>
                    </div>
                </div>
                <div className="flex gap-3 mb-8">
                    <button onClick={handleSave} disabled={loading} className="flex-1 bg-orange-500 text-black font-bold py-3 rounded-xl hover:opacity-90">{loading ? 'Saving...' : 'Save Changes'}</button>
                    <button onClick={toggleStatus} className={`px-6 py-3 rounded-xl font-bold border ${user.status === 'banned' ? 'border-green-500/50 text-green-400 hover:bg-green-500/10' : 'border-red-500/50 text-red-400 hover:bg-red-500/10'}`}>
                        {user.status === 'banned' ? <><CheckCircle className="inline mr-1" size={16} />Unban</> : <><ShieldX className="inline mr-1" size={16} />Ban</>}
                    </button>
                </div>
                <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4"><Download className="inline mr-2" size={16} />Invoices</h3>
                    {invoices.map(inv => (
                        <div key={inv.invoiceNo} className="flex justify-between items-center p-4 bg-white/5 rounded-xl mb-2 border border-white/5">
                            <div><p className="font-bold text-sm">{inv.invoiceNo}</p><p className="text-xs text-gray-500">{new Date(inv.date).toLocaleDateString()} · {inv.plan}</p></div>
                            <span className="text-green-400 text-sm font-bold">{inv.status}</span>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

const CreateUserModal = ({ onClose, onUpdate }) => {
    const [form, setForm] = useState({ name: "", email: "", password: "", role: "user", subscription: "free" });
    const [loading, setLoading] = useState(false);
    const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
    const handleSubmit = async e => {
        e.preventDefault(); setLoading(true);
        try { await api.post('/admin/users', form); onUpdate(); onClose(); }
        catch (err) { alert(err.response?.data?.message || "Failed"); }
        setLoading(false);
    };
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#111] border border-white/10 w-full max-w-md rounded-3xl p-8 relative">
                <button onClick={onClose} className="absolute top-6 right-6 text-gray-400"><CloseIcon size={22} /></button>
                <h2 className="text-xl font-bold mb-6">Create User</h2>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <input className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500" placeholder="Full Name" required onChange={set('name')} />
                    <input className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500" type="email" placeholder="Email" required onChange={set('email')} />
                    <input className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500" type="password" placeholder="Password" required onChange={set('password')} />
                    <div className="flex gap-3">
                        <select className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 outline-none" onChange={set('role')}>
                            <option value="user">User</option><option value="admin">Admin</option>
                        </select>
                        <select className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 outline-none" onChange={set('subscription')}>
                            <option value="free">Free</option><option value="premium">Premium</option>
                        </select>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-orange-500 text-black font-bold py-3 rounded-xl mt-2 hover:opacity-90">{loading ? 'Creating...' : 'Create User'}</button>
                </form>
            </motion.div>
        </div>
    );
};

const POPULAR_STOCKS = [
    { ticker: 'RELIANCE', name: 'Reliance Industries', market: 'NSE' },
    { ticker: 'TCS', name: 'Tata Consultancy Services', market: 'NSE' },
    { ticker: 'HDFCBANK', name: 'HDFC Bank', market: 'NSE' },
    { ticker: 'INFY', name: 'Infosys', market: 'NSE' },
    { ticker: 'ICICIBANK', name: 'ICICI Bank', market: 'NSE' },
    { ticker: 'SBI', name: 'State Bank of India', market: 'NSE' },
    { ticker: 'ITC', name: 'ITC Limited', market: 'NSE' },
    { ticker: 'LART', name: 'Larsen & Toubro', market: 'NSE' },
    { ticker: 'BAJFINANCE', name: 'Bajaj Finance', market: 'NSE' },
    { ticker: 'BTC', name: 'Bitcoin', market: 'CRYPTO' },
    { ticker: 'ETH', name: 'Ethereum', market: 'CRYPTO' },
    { ticker: 'BANKNIFTY', name: 'Bank Nifty', market: 'NSE' },
    { ticker: 'NIFTY', name: 'Nifty 50', market: 'NSE' }
];

const ContentModal = ({ type, item, onClose, onUpdate }) => {
    const isEdit = !!item;
    const [form, setForm] = useState(
        type === 'blog'
            ? { title: item?.title || '', content: item?.content || '', author: item?.author || '', category: item?.category || 'Finance', isPremium: item?.isPremium || false }
            : {
                title: item?.title || '', ticker: item?.ticker || '', market: item?.market || 'NSE', type: item?.type || 'BUY',
                entry: item?.entry || '', target: item?.target || '', target2: item?.target2 || '', target3: item?.target3 || '',
                stopLoss: item?.stopLoss || '', quantity: item?.quantity || 1,
                isPremium: item?.isPremium ?? true, status: item?.status || 'ACTIVE'
            }
    );
    const [loading, setLoading] = useState(false);
    const [fetchingPrice, setFetchingPrice] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    // eslint-disable-next-line
    const searchTimeout = useRef(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const set = k => e => setForm(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

    const handleSearchInput = (e) => {
        const val = e.target.value;
        setForm(p => ({ ...p, ticker: val }));

        if (!val.trim()) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }

        setIsSearching(true);
        setShowDropdown(true);

        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(async () => {
            try {
                const { data } = await api.get(`/trade-ideas/search-tickers?q=${val}`);
                setSearchResults(data);
            } catch (err) {
                console.error("Search failed");
            }
            setIsSearching(false);
        }, 400); // 400ms debounce
    };

    const handleSelectResult = (s) => {
        // Map common Yahoo exchanges to our accepted markets
        let mappedMarket = 'NSE';
        const ex = s.exchange?.toUpperCase();
        const type = s.type?.toUpperCase();

        if (type === 'CRYPTOCURRENCY') mappedMarket = 'CRYPTO';
        else if (type === 'CURRENCY') mappedMarket = 'FOREX';
        else if (ex === 'BSE') mappedMarket = 'BSE';
        else if (ex === 'NYQ' || ex === 'NMS' || ex === 'NGM') mappedMarket = 'US';
        else if (ex === 'MCX') mappedMarket = 'MCX';
        else if (ex === 'NSE') mappedMarket = 'NSE';
        else mappedMarket = 'NSE'; // Default to NSE if unsure, but user can change it

        setForm(p => ({
            ...p,
            ticker: s.symbol,
            title: s.name,
            market: mappedMarket
        }));
        setShowDropdown(false);
        setSearchResults([]);
    };

    const fetchCurrentPrice = async () => {
        if (!form.ticker) return alert('Please enter a Ticker first');
        setFetchingPrice(true);
        try {
            const { data } = await api.get(`/trade-ideas/live-price?ticker=${form.ticker}&market=${form.market || 'NSE'}`);
            setForm(p => ({ ...p, entry: data.price }));
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to get live price. Valid ticker?';
            alert(msg);
        }
        setFetchingPrice(false);
    };

    const handleSubmit = async e => {
        e.preventDefault(); setLoading(true);
        try {
            const endpoint = type === 'blog' ? '/blogs' : '/trade-ideas';
            let payload = form;

            if (type === 'blog') {
                payload = new FormData();
                Object.keys(form).forEach(k => {
                    if (form[k] !== undefined && form[k] !== null) {
                        payload.append(k, form[k]);
                    }
                });
            }

            if (isEdit) await api.put(`${endpoint}/${item._id}`, payload);
            else await api.post(endpoint, payload);

            onUpdate(); onClose();
        } catch (err) { alert(err.response?.data?.message || "Failed"); }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#111] border border-white/10 w-full max-w-lg rounded-3xl p-8 relative max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-6 right-6 text-gray-400"><CloseIcon size={22} /></button>
                <h2 className="text-xl font-bold mb-6">{isEdit ? 'Edit' : 'Create'} {type === 'blog' ? 'Blog' : 'Trade Idea'}</h2>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <input className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500" placeholder="Title" value={form.title} required onChange={set('title')} />
                    {type === 'blog' ? (
                        <>
                            <textarea className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500 h-32" placeholder="Content..." value={form.content} onChange={set('content')} />
                            <input className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none" placeholder="Author" value={form.author} onChange={set('author')} />
                            <input className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none" placeholder="Category" value={form.category} onChange={set('category')} />
                            <input type="file" accept="image/*" className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 outline-none text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-orange-500/10 file:text-orange-400 hover:file:bg-orange-500/20" onChange={e => setForm(p => ({ ...p, image: e.target.files[0] }))} />
                        </>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div className="col-span-2 md:col-span-1 relative">
                                    <label className="text-[10px] text-gray-500 uppercase block mb-1">Search Global Ticker (Yahoo Fin)</label>
                                    <input
                                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500"
                                        placeholder="Type to search (e.g. RELIANCE, BTC-USD)"
                                        value={form.ticker}
                                        onChange={handleSearchInput}
                                        required
                                        autoComplete="off"
                                    />
                                    {showDropdown && (
                                        <div ref={dropdownRef} className="absolute top-full mt-1 w-full bg-[#1a1a1a] border border-white/10 rounded-xl max-h-48 overflow-y-auto z-[100] shadow-xl custom-scrollbar">
                                            {isSearching ? (
                                                <div className="p-3 text-xs text-center text-gray-400">Searching global markets...</div>
                                            ) : searchResults.length === 0 ? (
                                                <div className="p-3 text-xs text-center text-gray-400">No results found</div>
                                            ) : (
                                                searchResults.map((s, i) => (
                                                    <div
                                                        key={`${s.symbol}-${i}`}
                                                        className="p-3 hover:bg-orange-500/10 cursor-pointer border-b border-white/5 last:border-0 group transition-colors"
                                                        onClick={() => handleSelectResult(s)}
                                                    >
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="font-bold text-sm text-white group-hover:text-orange-400">{s.symbol}</span>
                                                            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-white/5 text-gray-400 rounded group-hover:bg-orange-500/20 group-hover:text-orange-400">{s.type}</span>
                                                        </div>
                                                        <p className="text-[10px] text-gray-500 truncate uppercase tracking-tighter">{s.name} • {s.exchange}</p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="text-[10px] text-gray-500 uppercase block mb-1">Market Mapping (Required for API)</label>
                                    <select className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none" value={form.market} onChange={set('market')}>
                                        <option value="NSE">NSE (Indian Stocks)</option>
                                        <option value="BSE">BSE</option>
                                        <option value="CRYPTO">CRYPTO</option>
                                        <option value="FOREX">FOREX</option>
                                        <option value="MCX">MCX (Commodities)</option>
                                        <option value="US">US / Global Markets</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="text-[10px] text-gray-500 uppercase block mb-1">Trade Title</label>
                                <input className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none" placeholder="Title (e.g. Breakout Play)" value={form.title} onChange={set('title')} required />
                            </div>
                            <div className="grid grid-cols-3 gap-3 mb-3">
                                <div>
                                    <label className="text-[10px] text-gray-500 uppercase flex items-center justify-between mb-1">
                                        <span>Entry Price</span>
                                        <button type="button" onClick={fetchCurrentPrice} disabled={fetchingPrice} className="text-orange-400 hover:text-orange-300 font-bold bg-orange-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                                            {fetchingPrice ? '...' : <><Zap size={10} /> Fetch CMP</>}
                                        </button>
                                    </label>
                                    <input type="number" step="0.01" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500" placeholder="0.00" value={form.entry} onChange={set('entry')} required />
                                </div>
                                <div><label className="text-[10px] text-gray-500 uppercase block mb-1">Target 1</label><input type="number" step="0.01" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500" placeholder="0.00" value={form.target} onChange={set('target')} required /></div>
                                <div><label className="text-[10px] text-gray-500 uppercase block mb-1">Stop Loss</label><input type="number" step="0.01" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500" placeholder="0.00" value={form.stopLoss} onChange={set('stopLoss')} required /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div><label className="text-[10px] text-gray-500 uppercase block mb-1">Target 2 (opt)</label><input type="number" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500" placeholder="0.00" value={form.target2} onChange={set('target2')} /></div>
                                <div><label className="text-[10px] text-gray-500 uppercase block mb-1">Target 3 (opt)</label><input type="number" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500" placeholder="0.00" value={form.target3} onChange={set('target3')} /></div>
                            </div>
                            <div className="w-full mb-3">
                                <label className="text-[10px] text-gray-500 uppercase block mb-1">Quantity (Lots/Coins/Shares)</label>
                                <input type="number" min="0.00001" step="any" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500" placeholder="e.g. 10" value={form.quantity} onChange={set('quantity')} required />
                            </div>
                            <div className="flex gap-3">
                                <select className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 outline-none" value={form.type} onChange={set('type')}>
                                    <option value="BUY">BUY</option><option value="SELL">SELL</option>
                                </select>
                                <select className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 outline-none" value={form.status} onChange={set('status')}>
                                    <option value="ACTIVE">ACTIVE</option><option value="CLOSED">CLOSED</option>
                                </select>
                            </div>
                        </>
                    )}
                    <label className="flex items-center gap-3 cursor-pointer p-3 bg-white/5 rounded-xl">
                        <input type="checkbox" checked={form.isPremium} onChange={set('isPremium')} className="w-4 h-4 accent-orange-500" />
                        <span className="font-medium text-sm">Premium only</span>
                    </label>
                    <button type="submit" disabled={loading} className="w-full bg-orange-500 text-black font-bold py-3 rounded-xl hover:opacity-90">{loading ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create')}</button>
                </form>
            </motion.div>
        </div>
    );
};

const TemplateModal = ({ item, onClose, onUpdate }) => {
    const isEdit = !!item;
    const [form, setForm] = useState({
        name: item?.name || '',
        subject: item?.subject || '',
        description: item?.description || '',
        html: item?.html || '',
        type: item?.type || 'email'
    });
    const [loading, setLoading] = useState(false);
    const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

    const handleSubmit = async e => {
        e.preventDefault(); setLoading(true);
        try {
            if (isEdit) await api.put(`/emails/templates/${item._id}`, form);
            else await api.post('/emails/templates', form);
            onUpdate(); onClose();
        } catch (err) { alert(err.response?.data?.message || "Failed"); }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#111] border border-white/10 w-full max-w-lg rounded-3xl p-8 relative max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-6 right-6 text-gray-400"><CloseIcon size={22} /></button>
                <h2 className="text-xl font-bold mb-6">{isEdit ? 'Edit' : 'Create'} Template</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs text-gray-500 uppercase tracking-widest block mb-2">Template Name</label>
                        <input className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500" placeholder="e.g. Welcome Email" value={form.name} required onChange={set('name')} />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase tracking-widest block mb-2">Subject Line</label>
                        <input className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500" placeholder="Email subject" value={form.subject} required onChange={set('subject')} />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase tracking-widest block mb-2">Short Description</label>
                        <input className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500" placeholder="Internal use" value={form.description} onChange={set('description')} />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase tracking-widest block mb-2">Type</label>
                        <select className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none" value={form.type} onChange={set('type')}>
                            <option value="email">Email</option>
                            <option value="push">Push Notification</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase tracking-widest block mb-2">Content (HTML for Email / Plain Text for Push)</label>
                        <textarea className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500 h-40" placeholder="Write your message here..." value={form.html} required onChange={set('html')} />
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-orange-500 text-black font-bold py-3 rounded-xl hover:opacity-90">{loading ? 'Saving...' : 'Save Template'}</button>
                </form>
            </motion.div>
        </div>
    );
};

// ─── Analytics Cards ─────────────────────────────────────────────────────────

const StatCard = ({ label, value, sub, color = 'orange' }) => {
    const colors = { orange: 'border-orange-500/20 text-orange-400', green: 'border-green-500/20 text-green-400', blue: 'border-blue-500/20 text-blue-400', red: 'border-red-500/20 text-red-400' };
    return (
        <div className={`p-6 bg-white/[0.03] border rounded-2xl ${colors[color]}`}>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">{label}</p>
            <p className={`text-3xl font-black ${colors[color].split(' ')[1]}`}>{value}</p>
            {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
        </div>
    );
};

const AdminDashboard = () => {
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const socket = useSocket(API_BASE_URL || window.location.origin);
    const [notifications, setNotifications] = useState([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'analytics';
    const setActiveTab = (tab) => setSearchParams({ tab });
    const [users, setUsers] = useState([]);
    const [blogs, setBlogs] = useState([]);
    const [tradeIdeas, setTradeIdeas] = useState([]);
    const [closeModal, setCloseModal] = useState(null); // { id, ticker }
    const [closePrice, setClosePrice] = useState('');
    const [logs, setLogs] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [apiKeys, setApiKeys] = useState([]);
    const [devices, setDevices] = useState([]);
    const [userDevices, setUserDevices] = useState([]);
    const [payments, setPayments] = useState([]);
    const [viewers, setViewers] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showCreateUser, setShowCreateUser] = useState(false);
    const [contentModal, setContentModal] = useState(null); // { type, item? }
    const [templateModal, setTemplateModal] = useState(null); // { item? }
    const [ipToBan, setIpToBan] = useState('');
    const [newKeyName, setNewKeyName] = useState('');
    const [newKeyCredits, setNewKeyCredits] = useState(100);
    const [newKeyTier, setNewKeyTier] = useState('free');
    const [topUpKey, setTopUpKey] = useState(null); // { id, name, credits }
    const [deviceToBan, setDeviceToBan] = useState({ fingerprint: '', label: '', reason: '' });
    const [search, setSearch] = useState('');
    const [liveLogsPaused, setLiveLogsPaused] = useState(false);
    const [roleRoutes, setRoleRoutes] = useState([]);

    useEffect(() => {
        fetch("http://localhost:5000/api/public/ui-config")
            .then(res => res.json())
            .then(data => {
                const roleKey = `ROLE_ROUTES_${user.role?.toUpperCase()}`;
                if (data[roleKey]) {
                    setRoleRoutes(data[roleKey]);
                }
            })
            .catch(err => console.error(err));
    }, [user.role]);

    // Emails and Support state
    const [templates, setTemplates] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [openTicket, setOpenTicket] = useState(null); // full ticket view
    const [replyBody, setReplyBody] = useState("");
    const [bulkEmailForm, setBulkEmailForm] = useState({ filter: 'all', templateId: '' });
    const [pushForm, setPushForm] = useState({ filter: 'all', title: '', body: '', url: '/research' });
    const [pushSending, setPushSending] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const addNotification = msg => setNotifications(p => [{ id: Date.now(), msg }, ...p].slice(0, 5));

    const canAccess = (perm) => hasPermission(user, perm);

    const fetchAll = useCallback(async () => {
        try {
            const [u, b, t, l, a, k, d, em, tk, ud, p] = await Promise.all([
                api.get('/admin/users').catch(() => ({ data: [] })),
                canAccess(PERMISSIONS.MANAGE_BLOGS) ? api.get('/blogs') : Promise.resolve({ data: [] }),
                canAccess(PERMISSIONS.MANAGE_TRADE_IDEAS) ? api.get('/trade-ideas') : Promise.resolve({ data: [] }),
                canAccess(PERMISSIONS.VIEW_LOGS) ? api.get('/admin/logs').catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
                canAccess(PERMISSIONS.VIEW_ANALYTICS) ? api.get('/admin/analytics').catch(() => ({ data: null })) : Promise.resolve({ data: null }),
                canAccess(PERMISSIONS.MANAGE_API_KEYS) ? api.get('/admin/api-keys').catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
                canAccess(PERMISSIONS.MANAGE_DEVICES) ? api.get('/admin/devices').catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
                canAccess(PERMISSIONS.MANAGE_EMAILS) ? api.get('/emails/templates').catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
                canAccess(PERMISSIONS.HANDLE_TICKETS) ? api.get('/tickets').catch(() => ({ data: { tickets: [] } })) : Promise.resolve({ data: { tickets: [] } }),
                canAccess(PERMISSIONS.MANAGE_DEVICES) ? api.get('/admin/user-devices').catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
                canAccess(PERMISSIONS.MANAGE_PAYMENTS) ? api.get('/admin/payments').catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
            ]);
            setUsers(u.data);
            setBlogs(b.data);
            setTradeIdeas(t.data);
            setLogs(l.data);
            setAnalytics(a.data);
            setApiKeys(k.data);
            setDevices(d.data);
            setTemplates(em.data);
            setTickets(tk.data?.tickets || []);
            setUserDevices(ud.data);
            setPayments(p.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [user.role]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    useEffect(() => {
        if (!socket) return;
        socket.on('viewer_count', c => setViewers(c));
        socket.on('new_log', log => {
            if (!liveLogsPaused) setLogs(p => [log, ...p].slice(0, 200));
        });
        socket.on('new_user', u => { addNotification(`New user: ${u.name}`); fetchAll(); });
        socket.on('subscription_updated', d => { addNotification(`Upgraded: ${d.name}`); fetchAll(); });
        socket.on('new_payment', d => { addNotification(`Payment: ₹${d.amount} from ${d.user}`); fetchAll(); });
        return () => { socket.off('viewer_count'); socket.off('new_log'); socket.off('new_user'); socket.off('subscription_updated'); socket.off('new_payment'); };
    }, [socket, fetchAll]);

    const handleDeleteUser = async id => {
        if (!confirm('Delete this user permanently?')) return;
        await api.delete(`/admin/users/${id}`); fetchAll();
    };
    const handleDeleteContent = async (type, id) => {
        if (!confirm(`Delete this ${type}?`)) return;
        await api.delete(`/${type === 'blog' ? 'blogs' : 'trade-ideas'}/${id}`); fetchAll();
    };
    const handleDeleteTemplate = async (id) => {
        if (!confirm('Delete this template?')) return;
        await api.delete(`/emails/templates/${id}`); fetchAll();
    };
    const handleBanIp = async e => {
        e.preventDefault();
        try { await api.post('/admin/ban-ip', { ip: ipToBan }); alert(`Banned: ${ipToBan}`); setIpToBan(''); }
        catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };
    const handleCreateKey = async e => {
        e.preventDefault();
        await api.post('/admin/api-keys', { name: newKeyName, credits: newKeyCredits, tier: newKeyTier });
        setNewKeyName(''); setNewKeyCredits(100); setNewKeyTier('free'); fetchAll();
    };
    const handleRevokeKey = async id => {
        if (!confirm('Revoke this key?')) return;
        await api.delete(`/admin/api-keys/${id}`); fetchAll();
    };
    const handleTopUp = async (id, credits) => {
        const amount = prompt("Enter total credits for this key:", credits);
        if (amount === null) return;
        await api.put(`/admin/api-keys/${id}`, { credits: parseInt(amount) });
        fetchAll();
    };
    const handleCopyKey = (key) => {
        navigator.clipboard.writeText(key);
    };
    const clearLogs = () => setLogs([]);
    const handleBanDevice = async e => {
        e.preventDefault();
        try {
            await api.post('/admin/devices/ban', deviceToBan);
            setDeviceToBan({ fingerprint: '', label: '', reason: '' });
            fetchAll();
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };
    const handleUnbanDevice = async id => {
        if (!confirm('Remove this device ban?')) return;
        await api.delete(`/admin/devices/${id}`); fetchAll();
    };
    const handleToggleDevice = async (id, isActive) => {
        await api.put(`/admin/devices/${id}`, { isActive: !isActive }); fetchAll();
    };

    const filteredUsers = users.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

    const allTabs = [
        { id: 'analytics', icon: BarChart2, label: 'Analytics', permission: PERMISSIONS.VIEW_ANALYTICS },
        { id: 'users', icon: Users, label: 'Users', permission: PERMISSIONS.MANAGE_USERS },
        { id: 'blogs', icon: FileText, label: 'Blogs', permission: PERMISSIONS.MANAGE_BLOGS },
        { id: 'trade-ideas', icon: TrendingUp, label: 'Trade Ideas', permission: PERMISSIONS.MANAGE_TRADE_IDEAS },
        { id: 'support', icon: MessageSquare, label: 'Support', permission: PERMISSIONS.HANDLE_TICKETS },
        { id: 'emails', icon: Mail, label: 'Emails', permission: PERMISSIONS.MANAGE_EMAILS },
        { id: 'logs', icon: AlertCircle, label: 'Logs', permission: PERMISSIONS.VIEW_LOGS },
        { id: 'payments', icon: CreditCard, label: 'Payments', permission: PERMISSIONS.MANAGE_PAYMENTS },
        { id: 'api-keys', icon: Key, label: 'API Keys', permission: PERMISSIONS.MANAGE_API_KEYS },
        { id: 'push', icon: BellRing, label: 'Push', permission: PERMISSIONS.SEND_PUSH },
        { id: 'devices', icon: ShieldX, label: 'Devices', permission: PERMISSIONS.MANAGE_DEVICES },
        { id: 'settings', icon: Settings, label: 'Settings', permission: PERMISSIONS.SYSTEM_SETTINGS },
    ];

    const tabs = allTabs.filter(t => {
        const hasPerm = canAccess(t.permission);
        if (!hasPerm) return false;
        if (roleRoutes.length > 0) {
            // Check if the tab label is allowed in the roleRoutes matrix
            return roleRoutes.includes(t.label);
        }
        return true;
    });

    useEffect(() => {
        if (tabs.length > 0 && !tabs.find(t => t.id === activeTab)) {
            setActiveTab(tabs[0].id);
        }
    }, [tabs, activeTab, setSearchParams]);

    // Support actions
    const handleTicketReply = async (e, id) => {
        e.preventDefault();
        await api.post(`/tickets/${id}/reply`, { body: replyBody });
        setReplyBody("");
        const res = await api.get(`/tickets/${id}`);
        setOpenTicket(res.data);
        fetchAll();
    };

    const updateTicketStatus = async (id, status) => {
        await api.put(`/tickets/${id}`, { status });
        const res = await api.get(`/tickets/${id}`);
        setOpenTicket(res.data);
        fetchAll();
    };

    // Email actions
    const handleSendBulk = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/emails/send-bulk', bulkEmailForm);
            alert(`Emails sent: ${res.data.sent}. Failed: ${res.data.failed}`);
        } catch (err) { alert("Failed to send bulk email"); }
    };

    const handleSendPush = async (e) => {
        e.preventDefault();
        setPushSending(true);
        try {
            const res = await api.post('/emails/send-bulk', {
                ...pushForm,
                type: 'push',
                customSubject: pushForm.title,
                customHtml: pushForm.body
            });
            alert(`Push notifications sent: ${res.data.sent}. Failed: ${res.data.failed}`);
            setPushForm({ filter: 'all', title: '', body: '', url: '/research' });
        } catch (err) {
            alert("Failed to send push notifications");
        } finally {
            setPushSending(false);
        }
    };

    return (
        <main className="min-h-screen bg-black text-white flex flex-col lg:flex-row overflow-hidden">
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between px-6 py-4 bg-black border-b border-white/5 sticky top-0 z-[60]">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center font-black text-black">T</div>
                    <span className="font-black text-lg">TRADAI Admin</span>
                </div>
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white/5 rounded-lg">
                    <Menu size={20} />
                </button>
            </div>

            {/* Sidebar Overlay (Mobile) */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.div
                className={cn(
                    "fixed lg:relative inset-y-0 left-0 w-72 bg-[#0c0c0c] border-r border-white/5 p-6 flex flex-col z-[80] transition-transform duration-300 lg:translate-x-0 overflow-y-auto",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex items-center justify-between lg:justify-start gap-3 mb-10 px-2">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center font-black text-black text-lg">T</div>
                        <span className="font-black text-xl tracking-tight">TRADAI <span className="text-gray-600 font-medium text-sm">ADMIN</span></span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-gray-500 hover:text-white">
                        <CloseIcon size={20} />
                    </button>
                </div>

                <nav className="flex flex-col gap-1 flex-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setIsSidebarOpen(false); }}
                            className={cn(
                                "flex items-center justify-between px-4 py-3.5 rounded-2xl font-semibold text-sm transition-all group touch-active",
                                activeTab === tab.id
                                    ? "bg-orange-500 text-black shadow-lg shadow-orange-500/10"
                                    : "text-gray-500 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <tab.icon size={18} className={activeTab === tab.id ? "text-black" : "group-hover:text-orange-500 transition-colors"} />
                                {tab.label}
                            </div>
                            <ChevronRight size={14} className={cn("opacity-0 transition-all", activeTab === tab.id ? "opacity-100 translate-x-0" : "group-hover:opacity-100 -translate-x-2")} />
                        </button>
                    ))}
                </nav>

                <div className="mt-8 p-4 bg-orange-500/5 rounded-3xl border border-orange-500/10">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <p className="text-[10px] text-orange-400 font-black uppercase tracking-[0.2em]">Live Status</p>
                    </div>
                    <p className="text-xl font-black">{viewers}</p>
                    <p className="text-[10px] text-gray-600 font-bold uppercase">Active Viewers</p>
                </div>
            </motion.div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-black capitalize tracking-tight">{activeTab.replace('-', ' ')}</h1>
                        <p className="text-gray-500 text-xs sm:text-sm mt-1 font-medium italic">liquide Admin Panel</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {activeTab === 'users' && (
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-orange-500 w-52" />
                            </div>
                        )}
                        {(activeTab === 'users') && (
                            <button onClick={() => setShowCreateUser(true)} className="flex items-center gap-2 bg-orange-500 text-black font-bold px-4 py-2 rounded-xl text-sm hover:opacity-90">
                                <Plus size={16} />New User
                            </button>
                        )}
                        {(activeTab === 'blogs' || activeTab === 'trade-ideas') && (
                            <button onClick={() => setContentModal({ type: activeTab === 'blogs' ? 'blog' : 'idea' })} className="flex items-center gap-2 bg-orange-500 text-black font-bold px-4 py-2 rounded-xl text-sm hover:opacity-90">
                                <Plus size={16} />New {activeTab === 'blogs' ? 'Blog' : 'Trade Idea'}
                            </button>
                        )}
                        <div className="relative group">
                            <button className="bg-white/5 border border-white/10 p-2.5 rounded-xl relative">
                                <Bell size={20} />
                                {notifications.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full text-[9px] flex items-center justify-center font-bold text-black">{notifications.length}</span>}
                            </button>
                            <div className="absolute right-0 top-12 w-72 bg-[#111] border border-white/10 rounded-2xl shadow-2xl p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Live Updates</p>
                                {notifications.length === 0 && <p className="text-gray-500 text-sm">No new updates</p>}
                                {notifications.map(n => <div key={n.id} className="text-xs p-2 bg-white/5 rounded-lg mb-2">{n.msg}</div>)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Analytics Tab ── */}
                {activeTab === 'analytics' && analytics && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                            <StatCard label="Total Users" value={analytics.users.total} sub={`+${analytics.users.newToday} today`} color="blue" />
                            <StatCard label="Premium" value={analytics.users.premium} sub={`${analytics.users.free} free`} color="orange" />
                            <StatCard label="Revenue" value={`₹${analytics.revenue.total.toLocaleString()}`} color="green" />
                            <StatCard label="Banned" value={analytics.users.banned} color="red" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                            <StatCard label="New (7 days)" value={analytics.users.newThisWeek} color="blue" />
                            <StatCard label="New (30 days)" value={analytics.users.newThisMonth} color="blue" />
                            <StatCard label="Total Blogs" value={analytics.content.totalBlogs} color="orange" />
                            <StatCard label="Trade Ideas" value={analytics.content.totalTradeIdeas} color="orange" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <StatCard label="API Requests Logged" value={analytics.requests.total} color="green" />
                            <StatCard label="Active API Keys" value={analytics.apiKeys.active} color="green" />
                        </div>

                        {/* Signup chart */}
                        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
                            <h3 className="font-bold mb-6 text-gray-300">New Signups — Last 7 Days</h3>
                            {analytics.charts.dailySignups.length === 0
                                ? <p className="text-gray-500 text-sm">No signups in the last 7 days.</p>
                                : (
                                    <div className="flex items-end gap-3 h-32">
                                        {analytics.charts.dailySignups.map(d => {
                                            const max = Math.max(...analytics.charts.dailySignups.map(x => x.count));
                                            const h = max ? (d.count / max) * 100 : 20;
                                            return (
                                                <div key={d._id} className="flex flex-col items-center flex-1 gap-1">
                                                    <span className="text-xs text-gray-500">{d.count}</span>
                                                    <div style={{ height: `${h}%` }} className="w-full bg-orange-500 rounded-t-lg min-h-[4px]" />
                                                    <span className="text-[9px] text-gray-600">{d._id.slice(5)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )
                            }
                        </div>
                    </div>
                )}
                {activeTab === 'analytics' && !analytics && <p className="text-gray-500">Loading analytics...</p>}

                {/* ── Users Tab ── */}
                {activeTab === 'users' && canAccess(PERMISSIONS.MANAGE_USERS) && (
                    <div className="bg-white/[0.03] border border-white/5 rounded-3xl overflow-hidden shadow-2xl overflow-x-auto custom-scrollbar">
                        <table className="w-full text-sm">
                            <thead className="border-b border-white/5 text-gray-500 uppercase text-xs tracking-wider"><tr>
                                <th className="text-left p-4">User</th><th className="text-left p-4">Subscription</th><th className="text-left p-4">Role</th><th className="text-right p-4">Actions</th>
                            </tr></thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredUsers.map(user => (
                                    <tr key={user._id} className="group hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-orange-500/20 flex items-center justify-center font-bold text-orange-400 text-sm">{user.name?.[0]}</div>
                                                <div>
                                                    <p className="font-semibold">{user.name}</p>
                                                    <p className="text-gray-500 text-xs">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${user.subscription === 'premium' ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-500/20 text-gray-400'}`}>{user.subscription}</span>
                                        </td>
                                        <td className="p-4 text-gray-400 capitalize text-xs">
                                            {user.role}{user.status === 'banned' && <span className="ml-2 text-red-400 font-bold">BANNED</span>}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => setSelectedUser(user)} className="text-xs font-bold text-orange-400 hover:underline">Manage</button>
                                                <button onClick={() => handleDeleteUser(user._id)} className="text-red-500 p-1.5 bg-red-500/10 rounded-lg hover:bg-red-500/20"><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── Blogs Tab ── */}
                {activeTab === 'blogs' && canAccess(PERMISSIONS.MANAGE_BLOGS) && (
                    <div className="bg-white/[0.03] border border-white/5 rounded-3xl overflow-hidden shadow-2xl overflow-x-auto custom-scrollbar">
                        <table className="w-full text-sm">
                            <thead className="border-b border-white/5 text-gray-500 uppercase text-xs tracking-wider"><tr>
                                <th className="text-left p-4">Title</th><th className="text-left p-4">Author</th><th className="text-left p-4">Access</th><th className="text-right p-4">Actions</th>
                            </tr></thead>
                            <tbody className="divide-y divide-white/5">
                                {blogs.map(b => (
                                    <tr key={b._id} className="group hover:bg-white/5">
                                        <td className="p-4 font-semibold">{b.title}</td>
                                        <td className="p-4 text-gray-400">{b.author}</td>
                                        <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-bold ${b.isPremium ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'}`}>{b.isPremium ? 'Premium' : 'Free'}</span></td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => setContentModal({ type: 'blog', item: b })} className="text-xs font-bold text-orange-400 hover:underline flex items-center gap-1"><Edit2 size={12} />Edit</button>
                                                <button onClick={() => handleDeleteContent('blog', b._id)} className="text-red-500 p-1.5 bg-red-500/10 rounded-lg hover:bg-red-500/20"><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── Trade Ideas Tab ── */}
                {activeTab === 'trade-ideas' && canAccess(PERMISSIONS.MANAGE_TRADE_IDEAS) && (
                    <div className="space-y-6">
                        <div className="bg-white/[0.03] border border-white/5 rounded-3xl overflow-hidden shadow-2xl overflow-x-auto custom-scrollbar">
                            <table className="w-full text-sm">
                                <thead className="border-b border-white/5 text-gray-500 uppercase text-xs tracking-wider"><tr>
                                    <th className="text-left p-4">Ticker / Title</th><th className="text-left p-4">Type</th><th className="text-left p-4">Entry / SL / T1</th><th className="text-left p-4">CMP</th><th className="p-4">P&L</th><th className="p-4">Status</th><th className="text-right p-4">Actions</th>
                                </tr></thead>
                                <tbody className="divide-y divide-white/5">
                                    {tradeIdeas.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-gray-600">No trade ideas yet.</td></tr>}
                                    {tradeIdeas.map(t => (
                                        <tr key={t._id} className="group hover:bg-white/5">
                                            <td className="p-4">
                                                <div>
                                                    <p className="font-black text-orange-400">{t.ticker}</p>
                                                    <p className="text-xs text-gray-500 truncate max-w-[120px]">{t.title}</p>
                                                </div>
                                            </td>
                                            <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-bold ${t.type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{t.type}</span></td>
                                            <td className="p-4 font-mono text-xs text-gray-400">{t.entry} / {t.stopLoss} / {t.target}</td>
                                            <td className="p-4 font-bold text-amber-400 text-sm">{t.currentPrice ? `₹${t.currentPrice}` : '—'}</td>
                                            <td className="p-4 text-center">
                                                <span className={`text-sm font-black ${t.pnl?.isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {t.pnl?.isProfit ? '+' : ''}{t.pnl?.percent?.toFixed(2)}%
                                                </span>
                                                <p className={`text-[10px] ${t.pnl?.isProfit ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    {t.pnl?.isProfit ? '+' : ''}₹{t.pnl?.rupees?.toFixed(0)}
                                                </p>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${t.status === 'ACTIVE' ? 'bg-blue-500/20 text-blue-400' :
                                                    t.status === 'SL_HIT' ? 'bg-red-500/20 text-red-400' :
                                                        t.status?.includes('TARGET') ? 'bg-emerald-500/20 text-emerald-400' :
                                                            'bg-gray-500/20 text-gray-400'
                                                    }`}>{t.status?.replace('_', ' ')}</span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {t.status === 'ACTIVE' && (
                                                        <button onClick={() => { setCloseModal({ id: t._id, ticker: t.ticker }); setClosePrice(''); }} className="text-xs font-bold text-amber-400 hover:underline px-2 py-1 border border-amber-400/20 rounded">Close</button>
                                                    )}
                                                    <button onClick={() => setContentModal({ type: 'idea', item: t })} className="text-xs font-bold text-orange-400 hover:underline flex items-center gap-1 ml-2"><Edit2 size={12} />Edit</button>
                                                    <button onClick={() => handleDeleteContent('idea', t._id)} className="text-red-500 p-1.5 bg-red-500/10 rounded-lg hover:bg-red-500/20 ml-2"><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Close Call Modal */}
                        <AnimatePresence>
                            {closeModal && (
                                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm">
                                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                        className="bg-[#111] border border-white/10 w-full max-w-sm rounded-3xl p-8 relative">
                                        <button onClick={() => setCloseModal(null)} className="absolute top-6 right-6 text-gray-400"><CloseIcon size={22} /></button>
                                        <h2 className="text-xl font-bold mb-2">Close {closeModal.ticker}</h2>
                                        <p className="text-gray-400 text-sm mb-6">Enter the actual closing/exit price for this trade:</p>
                                        <input type="number" step="0.01" value={closePrice} onChange={e => setClosePrice(e.target.value)} placeholder="Closing price" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500 mb-4" />
                                        <button onClick={async () => {
                                            if (!closePrice) return;
                                            await api.post(`/trade-ideas/${closeModal.id}/close`, { closingPrice: parseFloat(closePrice) });
                                            setCloseModal(null); fetchAll();
                                        }} className="w-full bg-orange-500 text-black font-bold py-3 rounded-xl hover:opacity-90">Confirm Close</button>
                                    </motion.div>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* ── Logs Tab ── */}
                {activeTab === 'logs' && canAccess(PERMISSIONS.VIEW_LOGS) && (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <p className="text-sm text-gray-500 font-medium">{logs.length} entries — real-time monitoring</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setLiveLogsPaused(p => !p)}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${liveLogsPaused
                                        ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20'
                                        : 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border border-yellow-500/20'
                                        }`}
                                >
                                    {liveLogsPaused ? <><Play size={12} /> Resume Live</> : <><StopCircle size={12} /> Pause Live</>}
                                </button>
                                <button
                                    onClick={clearLogs}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors"
                                >
                                    <Trash2 size={12} /> Clear Logs
                                </button>
                            </div>
                        </div>
                        <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
                            <table className="w-full text-xs font-mono">
                                <thead className="border-b border-white/5 text-gray-500 uppercase tracking-wider"><tr>
                                    <th className="text-left p-4">Time</th><th className="p-4">Method</th><th className="text-left p-4">User</th><th className="text-left p-4">Path</th><th className="p-4">Status</th><th className="text-left p-4">IP</th>
                                </tr></thead>
                                <tbody className="divide-y divide-white/5">
                                    {logs.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-600">No logs to display.</td></tr>}
                                    {logs.map((log, i) => (
                                        <tr key={i} className="hover:bg-white/5">
                                            <td className="p-4 text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                                            <td className="p-4 text-center font-bold">
                                                <span className={`${log.method === 'GET' ? 'text-blue-400' : log.method === 'POST' ? 'text-green-400' : 'text-orange-400'}`}>{log.method}</span>
                                            </td>
                                            <td className="p-4">
                                                {log.userId ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-300">{log.userId.name}</span>
                                                        <span className="text-[10px] text-gray-600">{log.userId.email}</span>
                                                    </div>
                                                ) : <span className="text-gray-600">Guest</span>}
                                            </td>
                                            <td className="p-4 text-gray-300 max-w-[200px] truncate" title={log.url}>{log.url}</td>
                                            <td className="p-4 text-center"><span className={`px-2 py-0.5 rounded ${log.status >= 400 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>{log.status}</span></td>
                                            <td className="p-4 text-gray-600 font-sans">{log.ip}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ── Payments Tab ── */}
                {activeTab === 'payments' && canAccess(PERMISSIONS.MANAGE_PAYMENTS) && (
                    <div className="bg-white/[0.03] border border-white/5 rounded-3xl overflow-hidden shadow-2xl overflow-x-auto custom-scrollbar">
                        <table className="w-full text-sm">
                            <thead className="border-b border-white/5 text-gray-500 uppercase text-xs tracking-wider"><tr>
                                <th className="text-left p-4">User</th><th className="text-left p-4">Amount</th><th className="p-4">Plan</th><th className="p-4">Status</th><th className="p-4">Razorpay ID</th><th className="text-right p-4">Date</th>
                            </tr></thead>
                            <tbody className="divide-y divide-white/5">
                                {payments.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-600">No payments found.</td></tr>}
                                {payments.map(p => (
                                    <tr key={p._id} className="hover:bg-white/5">
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold">{p.userId?.name || 'Unknown'}</span>
                                                <span className="text-xs text-gray-500">{p.userId?.email || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 font-black text-orange-400">₹{p.amount}</td>
                                        <td className="p-4 text-center"><span className="px-2 py-1 rounded-full text-[10px] font-black uppercase bg-blue-500/20 text-blue-400">{p.plan}</span></td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${p.status === 'paid' ? 'bg-green-500/20 text-green-400' : p.status === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'}`}>{p.status}</span>
                                        </td>
                                        <td className="p-4 text-center font-mono text-[10px] text-gray-500">{p.razorpayPaymentId || p.razorpayOrderId}</td>
                                        <td className="p-4 text-right text-gray-500 text-xs">{new Date(p.createdAt).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── API Keys Tab ── */}
                {activeTab === 'api-keys' && canAccess(PERMISSIONS.MANAGE_API_KEYS) && (
                    <div className="space-y-6">
                        <form onSubmit={handleCreateKey} className="flex gap-3 flex-wrap">
                            <input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="Key name" required className="flex-1 min-w-40 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500" />
                            <input type="number" value={newKeyCredits} onChange={e => setNewKeyCredits(parseInt(e.target.value))} placeholder="Credits" className="w-24 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500" />
                            <select value={newKeyTier} onChange={e => setNewKeyTier(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none">
                                <option value="free">Free Tier</option>
                                <option value="premium">Premium Tier</option>
                            </select>
                            <button type="submit" className="flex items-center gap-2 bg-orange-500 text-black font-bold px-5 py-3 rounded-xl text-sm hover:opacity-90"><Zap size={16} />Generate Key</button>
                        </form>
                        <div className="bg-white/[0.03] border border-white/5 rounded-3xl overflow-hidden shadow-2xl overflow-x-auto custom-scrollbar">
                            <table className="w-full text-sm">
                                <thead className="border-b border-white/5 text-gray-500 uppercase text-xs tracking-wider"><tr>
                                    <th className="text-left p-4">Name</th><th className="text-left p-4">Key</th><th className="text-left p-4">Tier</th><th className="text-left p-4">Credits</th><th className="text-left p-4">Hits</th><th className="text-right p-4">Actions</th>
                                </tr></thead>
                                <tbody className="divide-y divide-white/5">
                                    {apiKeys.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-600">No API keys yet.</td></tr>}
                                    {apiKeys.map(k => (
                                        <tr key={k._id} className="group hover:bg-white/5">
                                            <td className="p-4 font-semibold">{k.name}</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <code className="font-mono text-[10px] text-gray-400 max-w-[120px] truncate block">{k.key}</code>
                                                    <button onClick={() => handleCopyKey(k.key)} title="Copy key" className="text-gray-600 hover:text-orange-400 transition-colors flex-shrink-0"><Copy size={13} /></button>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${k.tier === 'premium' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>{k.tier}</span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-bold ${k.credits < 20 ? 'text-red-400' : 'text-green-400'}`}>{k.credits}</span>
                                                    <button onClick={() => handleTopUp(k._id, k.credits)} title="Top Up" className="text-gray-600 hover:text-green-400"><Plus size={12} /></button>
                                                </div>
                                            </td>
                                            <td className="p-4 text-orange-400 font-bold">{k.hits}</td>
                                            <td className="p-4 text-right">
                                                <button onClick={() => handleRevokeKey(k._id)} className="text-red-500 p-1.5 bg-red-500/10 rounded-lg hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1 p-4 bg-white/[0.03] border border-white/5 rounded-2xl text-sm">
                                <p className="font-bold text-gray-300 mb-2"><Key className="inline mr-2" size={14} />Quick Usage</p>
                                <code className="text-gray-400 text-xs block bg-black/50 p-3 rounded-xl">
                                    GET /api/v1/trade-ideas<br />
                                    Header: x-api-key: YOUR_KEY
                                </code>
                            </div>
                            <a href="/api-docs" target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center gap-2 px-8 py-4 border border-white/10 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors text-sm text-gray-300 font-bold whitespace-nowrap">
                                <ExternalLink size={18} className="text-orange-400" />
                                View Full Docs
                            </a>
                        </div>
                    </div>
                )}

                {/* ── Devices Tab ── */}
                {activeTab === 'devices' && canAccess(PERMISSIONS.MANAGE_DEVICES) && (
                    <div className="space-y-10">
                        {/* 1. Recent Logins / User Devices */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                                <Globe size={16} className="text-orange-500" /> Recent Logins & Devices
                            </h3>
                            <div className="bg-white/[0.03] border border-white/5 rounded-3xl overflow-hidden shadow-2xl overflow-x-auto custom-scrollbar">
                                <table className="w-full text-sm">
                                    <thead className="border-b border-white/5 text-gray-500 uppercase text-[10px] tracking-widest">
                                        <tr>
                                            <th className="text-left p-4">User</th>
                                            <th className="text-left p-4">IP Address</th>
                                            <th className="text-left p-4">Device / OS</th>
                                            <th className="text-left p-4">Fingerprint</th>
                                            <th className="text-right p-4">Last Login</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {userDevices.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-600">No login records found.</td></tr>}
                                        {userDevices.map(ud => (
                                            <tr key={ud._id} className="hover:bg-white/5 transition-colors">
                                                <td className="p-4">
                                                    <p className="font-bold">{ud.userId?.name || 'Unknown'}</p>
                                                    <p className="text-[10px] text-gray-500">{ud.userId?.email}</p>
                                                </td>
                                                <td className="p-4 font-mono text-xs text-orange-400">{ud.ip}</td>
                                                <td className="p-4 text-xs text-gray-400">
                                                    <span className="block">{ud.browser}</span>
                                                    <span className="block text-[10px] text-gray-600">{ud.os}</span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <code className="text-[10px] bg-black/40 px-2 py-0.5 rounded border border-white/5 font-mono text-gray-500">{ud.fingerprint}</code>
                                                        <button onClick={() => setDeviceToBan({ ...deviceToBan, fingerprint: ud.fingerprint, label: ud.userId?.name })} title="Pre-fill ban form" className="text-gray-600 hover:text-red-500 transition-colors"><ShieldX size={12} /></button>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right text-xs text-gray-500">
                                                    {new Date(ud.lastLogin).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8 border-t border-white/5">
                            {/* 2. Manual Ban Form */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <ShieldX size={16} className="text-red-500" /> Ban a Device
                                </h3>
                                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
                                    <form onSubmit={handleBanDevice} className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-gray-500 uppercase ml-1">Fingerprint ID</label>
                                            <input value={deviceToBan.fingerprint} onChange={e => setDeviceToBan(p => ({ ...p, fingerprint: e.target.value }))} placeholder="Device Fingerprint ID" required className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-500" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-gray-500 uppercase ml-1">Label</label>
                                            <input value={deviceToBan.label} onChange={e => setDeviceToBan(p => ({ ...p, label: e.target.value }))} placeholder="Label (e.g. 'John's laptop')" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-gray-500 uppercase ml-1">Reason</label>
                                            <input value={deviceToBan.reason} onChange={e => setDeviceToBan(p => ({ ...p, reason: e.target.value }))} placeholder="Reason (optional)" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500" />
                                        </div>
                                        <button type="submit" className="w-full flex items-center justify-center gap-2 bg-red-500 text-white font-bold py-3 rounded-xl text-sm hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"><ShieldX size={16} />Confirm Device Ban</button>
                                    </form>
                                </div>
                            </div>

                            {/* 3. Banned Device List */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <StopCircle size={16} className="text-gray-500" /> Blacklisted Devices
                                </h3>
                                <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden max-h-[400px] overflow-y-auto">
                                    <table className="w-full text-xs">
                                        <thead className="border-b border-white/5 text-gray-600 uppercase tracking-tighter">
                                            <tr>
                                                <th className="text-left p-3">Device</th>
                                                <th className="text-left p-3">Status</th>
                                                <th className="text-right p-3">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {devices.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-gray-600 italic">No devices banned.</td></tr>}
                                            {devices.map(d => (
                                                <tr key={d._id} className="group hover:bg-red-500/5">
                                                    <td className="p-3">
                                                        <p className="font-bold text-gray-300">{d.label || 'Unnamed'}</p>
                                                        <p className="text-[9px] text-gray-600 truncate max-w-[150px]">{d.fingerprint}</p>
                                                    </td>
                                                    <td className="p-3">
                                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${d.isActive ? 'bg-red-500/20 text-red-500' : 'bg-gray-500/20 text-gray-500'}`}>
                                                            {d.isActive ? 'Banned' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <button onClick={() => handleUnbanDevice(d._id)} className="text-gray-600 hover:text-white transition-colors"><Trash2 size={12} /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 bg-orange-500/5 border border-orange-500/10 rounded-3xl text-sm text-gray-400 leading-relaxed">
                            <h4 className="font-bold text-orange-400 mb-2 flex items-center gap-2">
                                <Zap size={14} /> Intelligence System
                            </h4>
                            Capturing device fingerprints allows you to block access even if a user changes their IP address, browser profile, or uses a VPN. Use the "Shield" icon next to any fingerprint in the login list to quickly pre-fill the ban form.
                        </div>
                    </div>
                )}

                {/* ── Support Tab ── */}
                {activeTab === 'support' && canAccess(PERMISSIONS.HANDLE_TICKETS) && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 border-r border-white/10 pr-6 overflow-y-auto max-h-[70vh] space-y-3">
                            {tickets.length === 0 && <p className="text-gray-500 text-sm">No tickets found.</p>}
                            {tickets.map(t => (
                                <div key={t._id} onClick={() => { setOpenTicket(t); }} className={`p-4 border rounded-2xl cursor-pointer transition-colors ${openTicket?._id === t._id ? 'border-orange-500 bg-orange-500/10' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${t.status === 'open' ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-500/20 text-gray-400'}`}>{t.status}</span>
                                        <span className="text-xs text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <h4 className="font-bold text-sm truncate">{t.subject}</h4>
                                    <p className="text-xs text-gray-400 mt-1 truncate">{t.userId?.name || 'Unknown User'}</p>
                                </div>
                            ))}
                        </div>
                        <div className="lg:col-span-2 flex flex-col h-full min-h-[500px] border border-white/10 rounded-2xl bg-white/[0.02] overflow-hidden">
                            {openTicket ? (
                                <>
                                    <div className="p-5 border-b border-white/10 bg-black/50 flex justify-between items-center">
                                        <div>
                                            <h3 className="font-bold text-lg">{openTicket.subject}</h3>
                                            <p className="text-xs text-gray-400 mt-1">Requested by: <span className="text-white font-medium">{openTicket.userId?.name}</span> ({openTicket.userId?.email})</p>
                                        </div>
                                        <select value={openTicket.status} onChange={e => updateTicketStatus(openTicket._id, e.target.value)} className="bg-black border border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold outline-none text-orange-400">
                                            <option value="open">Open</option>
                                            <option value="in-progress">In Progress</option>
                                            <option value="resolved">Resolved</option>
                                            <option value="closed">Closed</option>
                                        </select>
                                    </div>
                                    <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[400px]">
                                        {openTicket.messages?.map((m, i) => {
                                            const isStaff = ['admin', 'manager', 'support'].includes(m.senderRole);
                                            return (
                                                <div key={i} className={`flex flex-col ${isStaff ? 'items-end' : 'items-start'}`}>
                                                    <span className="text-xs text-gray-500 mb-1">{isStaff ? m.senderName : 'User'}</span>
                                                    <div className={`p-3 rounded-2xl text-sm max-w-[80%] ${isStaff ? 'bg-orange-500 text-black font-medium rounded-tr-none' : 'bg-white/10 rounded-tl-none'}`}>
                                                        {m.body}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <form onSubmit={e => handleTicketReply(e, openTicket._id)} className="p-4 border-t border-white/10 flex gap-2">
                                        <input value={replyBody} onChange={e => setReplyBody(e.target.value)} placeholder="Type a reply..." className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-2 outline-none text-sm focus:border-orange-500" required />
                                        <button type="submit" className="bg-orange-500 text-black font-bold px-4 py-2 rounded-xl text-sm hover:opacity-90">Reply</button>
                                    </form>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">Select a ticket to view thread</div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Emails Tab ── */}
                {activeTab === 'emails' && canAccess(PERMISSIONS.MANAGE_EMAILS) && (
                    <div className="space-y-6">
                        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
                            <h3 className="font-bold mb-4 flex items-center gap-2"><Mail className="text-orange-400" size={18} /> Send Bulk Email Campaign</h3>
                            <form onSubmit={handleSendBulk} className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-xs text-gray-500 uppercase tracking-widest block mb-2">Target Audience</label>
                                    <select value={bulkEmailForm.filter} onChange={e => setBulkEmailForm(p => ({ ...p, filter: e.target.value }))} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500 text-sm">
                                        <option value="all">All Active Users</option>
                                        <option value="premium">Premium Users Only</option>
                                        <option value="free">Free Users Only</option>
                                        <option value="expiring">Premium Expiring in 7 Days</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs text-gray-500 uppercase tracking-widest block mb-2">Email Template</label>
                                    <select required value={bulkEmailForm.templateId} onChange={e => setBulkEmailForm(p => ({ ...p, templateId: e.target.value }))} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500 text-sm">
                                        <option value="" disabled>Select a template...</option>
                                        {templates.map(t => <option key={t._id} value={t._id}>{t.name} ({t.subject})</option>)}
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <button type="submit" className="bg-orange-500 text-black font-bold px-8 py-3 rounded-xl hover:opacity-90">Send Campaign</button>
                                </div>
                            </form>
                        </div>
                        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold">Message Templates</h3>
                                <button className="text-orange-500 text-sm font-bold bg-orange-500/10 px-4 py-2 rounded-xl hover:bg-orange-500/20" onClick={() => setTemplateModal({})}>+ Template</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {templates.length === 0 && (
                                    <div className="col-span-full py-10 text-center">
                                        <p className="text-gray-500 text-sm mb-4">No templates defined.</p>
                                        <button className="text-orange-400 text-xs font-bold hover:underline" onClick={() => api.post('/emails/templates/seed').then(fetchAll)}>Seed Default Templates</button>
                                    </div>
                                )}
                                {templates.map(t => (
                                    <div key={t._id} className="group border border-white/10 rounded-2xl p-4 bg-black flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-sm">{t.name}</h4>
                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${t.type === 'push' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>{t.type}</span>
                                            </div>
                                            <p className="text-xs text-gray-400 mb-2 truncate">Subject: {t.subject}</p>
                                            <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">{t.description}</p>
                                        </div>
                                        <div className="flex items-center justify-end gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => setTemplateModal(t)} className="text-[10px] font-bold text-orange-400 hover:underline">Edit</button>
                                            <button onClick={() => handleDeleteTemplate(t._id)} className="text-red-500 p-1.5 bg-red-500/10 rounded-lg hover:bg-red-500/20"><Trash2 size={12} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Push Tab ── */}
                {activeTab === 'push' && canAccess(PERMISSIONS.SEND_PUSH) && (
                    <div className="space-y-6">
                        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-8 max-w-2xl">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                                <BellRing className="text-orange-400" /> Instant Push Alert
                            </h3>
                            <form onSubmit={handleSendPush} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs text-gray-500 uppercase tracking-widest ml-1">Target Audience</label>
                                    <select
                                        value={pushForm.filter}
                                        onChange={e => setPushForm(p => ({ ...p, filter: e.target.value }))}
                                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500 text-sm"
                                    >
                                        <option value="all">All Subscribed Devices</option>
                                        <option value="premium">Premium Users Only</option>
                                        <option value="free">Free Users Only</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-gray-500 uppercase tracking-widest ml-1">Notification Title</label>
                                    <input
                                        value={pushForm.title}
                                        onChange={e => setPushForm(p => ({ ...p, title: e.target.value }))}
                                        placeholder="e.g. New Trade Idea Published!"
                                        required
                                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-gray-500 uppercase tracking-widest ml-1">Message Body</label>
                                    <textarea
                                        value={pushForm.body}
                                        onChange={e => setPushForm(p => ({ ...p, body: e.target.value }))}
                                        placeholder="Brief and catchy message..."
                                        required
                                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500 h-24 resize-none"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-gray-500 uppercase tracking-widest ml-1">Click URL (optional)</label>
                                    <input
                                        value={pushForm.url}
                                        onChange={e => setPushForm(p => ({ ...p, url: e.target.value }))}
                                        placeholder="/research"
                                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={pushSending}
                                    className="w-full bg-orange-500 text-black font-black py-4 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all uppercase tracking-widest text-sm shadow-lg shadow-orange-500/20"
                                >
                                    {pushSending ? 'Blasting Notifications...' : 'Send Push Campaign'}
                                </button>

                            </form>
                        </div>
                        <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-3xl text-sm text-gray-400 max-w-2xl">
                            <p className="flex items-start gap-3">
                                <AlertCircle size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
                                <span>
                                    Push notifications are sent via the <strong>Web Push protocol</strong>. Users must have granted permission in their browser and be "Subscribed" via their profile dashboard to receive these alerts.
                                </span>
                            </p>
                        </div>
                    </div>
                )}

                {/* ── Settings Tab ── */}
                {activeTab === 'settings' && canAccess(PERMISSIONS.SYSTEM_SETTINGS) && (
                    <div className="max-w-md space-y-6">
                        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
                            <h3 className="font-bold mb-4 flex items-center gap-2"><ShieldX className="text-red-400" size={18} />IP Access Control</h3>
                            <form onSubmit={handleBanIp} className="space-y-3">
                                <input value={ipToBan} onChange={e => setIpToBan(e.target.value)} placeholder="e.g. 192.168.1.1" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-red-500 text-sm" required />
                                <button type="submit" className="w-full bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600">Ban IP</button>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            <AnimatePresence>
                {selectedUser && <UserDetailsModal user={selectedUser} onClose={() => setSelectedUser(null)} onUpdate={fetchAll} />}
                {showCreateUser && <CreateUserModal onClose={() => setShowCreateUser(false)} onUpdate={fetchAll} />}
                {templateModal && <TemplateModal item={templateModal._id ? templateModal : null} onClose={() => setTemplateModal(null)} onUpdate={fetchAll} />}
                {contentModal && <ContentModal type={contentModal.type} item={contentModal.item} onClose={() => setContentModal(null)} onUpdate={fetchAll} />}
            </AnimatePresence>
        </main>
    );
};

export default AdminDashboard;
