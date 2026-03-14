import { useState, useEffect, useCallback } from "react";
import { Copy, Trash2, Key, Ticket, Shield, AlertCircle, Plus, CheckCircle, Bell, BellOff, ExternalLink, Zap } from "lucide-react";
import { subscribeToPush, unsubscribeFromPush, getPushSubscription } from "../utils/pushNotifications";
import { requestFcmToken } from "../utils/firebase";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../utils/api";

import NotificationAccessModal from "../components/NotificationAccessModal";

const UserDashboard = () => {
    const navigate = useNavigate();
    const userLocal = JSON.parse(localStorage.getItem("user"));

    const [user, setUser] = useState(userLocal || null);
    const [apiKeys, setApiKeys] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newKeyName, setNewKeyName] = useState("");
    const [copied, setCopied] = useState(null);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [pushLoading, setPushLoading] = useState(false);
    const [showPushModal, setShowPushModal] = useState(false);

    const fetchData = useCallback(async () => {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
            navigate("/auth");
            return;
        }
        const userLocalData = JSON.parse(storedUser);

        try {
            // Fetch fresh user profile
            const profileRes = await api.get('/users/profile');
            const updatedUser = { ...userLocalData, ...profileRes.data };
            setUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser)); // Sync storage

            // Fetch user's API keys
            const keysRes = await api.get('/users/keys');
            setApiKeys(keysRes.data);

            // Fetch user's support tickets
            const ticketsRes = await api.get('/tickets/my');
            setTickets(ticketsRes.data.slice(0, 5)); // Just show recent 5 in dashboard
        } catch (err) {
            console.error("Failed to load dashboard data:", err);
            if (err.response?.status === 401) {
                localStorage.removeItem("user");
                navigate("/auth");
            }
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchData();
        getPushSubscription().then(sub => {
            const subscribed = !!sub;
            setIsSubscribed(subscribed);
            
            // Show modal if not subscribed and hasn't dismissed it this session
            if (!subscribed && !sessionStorage.getItem('push_modal_dismissed')) {
                setTimeout(() => setShowPushModal(true), 2000); // Wait 2s for better UX
            }
        });
    }, [fetchData]);

    const handleCreateKey = async (e) => {
        e.preventDefault();
        try {
            await api.post('/users/keys', { name: newKeyName || 'My Key' });
            setNewKeyName("");
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to create key");
        }
    };

    const handleRevokeKey = async (id) => {
        if (!window.confirm("Are you sure you want to revoke this API key?")) return;
        try {
            await api.delete(`/users/keys/${id}`);
            fetchData();
        } catch (err) {
            alert("Failed to revoke key");
        }
    };

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const handlePushToggle = async () => {
        setPushLoading(true);
        try {
            if (isSubscribed) {
                await unsubscribeFromPush();
                setIsSubscribed(false);
            } else {
                // Try both Web Push and FCM for maximum reliability
                const sub = await subscribeToPush();
                const fcmToken = await requestFcmToken();
                
                if (sub || fcmToken) {
                    setIsSubscribed(true);
                    setShowPushModal(false);
                }
            }
        } catch (err) {
            console.error("Push toggle failed:", err);
            alert("Please allow notification permission in your browser settings.");
        } finally {
            setPushLoading(false);
        }
    };

    if (loading || !user) {
        return (
            <div className="min-h-screen bg-black text-white pt-24 px-6 flex items-center justify-center">
                <div className="font-bold text-xl text-gray-500 animate-pulse">Loading Profile...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white pt-24 px-4 sm:px-6">
            <Navbar />
            <NotificationAccessModal 
                show={showPushModal} 
                onAccept={handlePushToggle} 
                onDecline={() => {
                    setShowPushModal(false);
                    sessionStorage.setItem('push_modal_dismissed', 'true');
                }} 
            />
            <div className="max-w-5xl mx-auto pb-20 space-y-8">

                {/* ── Profile Header ── */}
                <div className="p-8 border border-white/10 rounded-3xl bg-white/[0.02] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-accent-orange/10 blur-[100px] pointer-events-none"></div>

                    <div className="flex items-center gap-6 relative z-10">
                        <div className="w-20 h-20 rounded-full bg-accent-gradient flex items-center justify-center text-3xl font-bold text-black border-4 border-black/50 shadow-xl">
                            {user.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold mb-1">{user.name}</h1>
                            <p className="text-gray-400">{user.email}</p>
                            <div className="flex items-center gap-3 mt-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${user.subscription === 'premium'
                                    ? 'bg-orange-500/20 text-orange-400 border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.2)]'
                                    : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                    }`}>
                                    {user.subscription} Plan
                                </span>
                                {user.subscription === 'premium' && user.validUntil && (
                                    <span className="text-xs text-gray-400 font-medium">Valid until {new Date(user.validUntil).toLocaleDateString()}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {user.subscription === 'free' && (
                        <div className="relative z-10">
                            <Link to="/pricing" className="bg-accent-gradient text-black font-bold px-6 py-3 rounded-xl hover:opacity-90 inline-block shadow-lg">
                                Upgrade to Premium
                            </Link>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* ── API Keys Section ── */}
                    <div className="border border-white/10 rounded-3xl bg-white/[0.01] p-6 sm:p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Key className="text-accent-orange" /> API Keys
                            </h2>
                            {user.subscription === 'free' && (
                                <span className="text-xs px-2 py-1 bg-white/10 rounded text-gray-400">Premium Only</span>
                            )}
                        </div>

                        {user.subscription !== 'premium' ? (
                            <div className="text-center py-10 bg-black/50 rounded-2xl border border-white/5">
                                <Shield className="mx-auto text-gray-600 mb-3" size={32} />
                                <p className="text-gray-400 text-sm mb-4">Custom Trade API access requires a Premium subscription.</p>
                                <Link to="/pricing" className="text-accent-orange text-sm font-bold hover:underline">View Plans &rarr;</Link>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="p-5 bg-orange-500/5 border border-orange-500/20 rounded-2xl">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400">
                                                <Zap size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm">Developer Access</h4>
                                                <p className="text-[11px] text-gray-500">Integrate signals into your own apps</p>
                                            </div>
                                        </div>
                                        <Link to="/api-docs" target="_blank" className="flex items-center gap-1 text-xs font-black text-orange-400 hover:text-orange-300 uppercase tracking-wider">
                                            Read Docs <ExternalLink size={12} />
                                        </Link>
                                    </div>
                                    <form onSubmit={handleCreateKey} className="flex gap-3">
                                        <input
                                            value={newKeyName} onChange={e => setNewKeyName(e.target.value)}
                                            placeholder="Key Name (e.g., Bot v1)"
                                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 outline-none text-sm focus:border-accent-orange"
                                        />
                                        <button disabled={apiKeys.length >= 5} type="submit" className="bg-orange-500 text-black px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 disabled:opacity-50">
                                            <Plus size={16} /> Generate
                                        </button>
                                    </form>
                                </div>
                                <div className="space-y-3">
                                    {apiKeys.length === 0 ? (
                                        <p className="text-center text-xs text-gray-600 py-4">No API keys yet.</p>
                                    ) : (
                                        apiKeys.map(k => (
                                            <div key={k._id} className="p-4 rounded-2xl bg-black border border-white/10 flex items-center justify-between gap-4 group hover:border-white/20 transition-colors">
                                                <div className="overflow-hidden">
                                                    <p className="font-bold text-xs mb-1 text-gray-300">{k.name}</p>
                                                    <div className="flex items-center gap-2">
                                                        <code className="text-[11px] text-gray-600 font-mono truncate max-w-[150px]">{k.key}</code>
                                                        <button onClick={() => copyToClipboard(k.key, k._id)} className="text-gray-600 hover:text-white transition-colors">
                                                            {copied === k._id ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={13} />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <button onClick={() => handleRevokeKey(k._id)} className="text-gray-600 hover:text-red-500 p-2 bg-white/5 rounded-lg hover:bg-red-500/10 transition-colors">
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                </div>

                {/* ── Push Notifications Section ── */}
                <div className="border border-white/10 rounded-3xl bg-white/[0.01] p-6 sm:p-8 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Bell className="text-accent-orange" /> Real-time Alerts
                            </h2>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${isSubscribed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-500'}`}>
                                {isSubscribed ? 'Enabled' : 'Disabled'}
                            </span>
                        </div>
                        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                            Get instant browser notifications for new high-conviction trade ideas and market breaking news. Recommended for active traders.
                        </p>
                    </div>

                    <button
                        onClick={handlePushToggle}
                        disabled={pushLoading}
                        className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${isSubscribed
                            ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20'
                            : 'bg-orange-500 text-black shadow-[0_4px_20px_rgba(249,115,22,0.3)] hover:opacity-90'
                            }`}
                    >
                        {pushLoading ? 'Processing...' : isSubscribed ? <><BellOff size={18} /> Disable Alerts</> : <><Bell size={18} /> Enable OS Notifications</>}
                    </button>
                </div>

                {/* ── Support Tickets Section ── */}
                <div className="border border-white/10 rounded-3xl bg-white/[0.01] p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Ticket className="text-accent-orange" /> Recent Support Tickets
                        </h2>
                        <Link to="/support" className="text-sm font-bold text-gray-400 hover:text-white transition-colors">View All &rarr;</Link>
                    </div>

                    {tickets.length === 0 ? (
                        <div className="text-center py-10 bg-black/50 rounded-2xl border border-white/5">
                            <AlertCircle className="mx-auto text-gray-600 mb-3" size={32} />
                            <p className="text-gray-400 text-sm mb-4">You have no open support tickets.</p>
                            <Link to="/support" className="bg-white/10 text-white font-bold px-5 py-2 rounded-xl text-sm inline-block hover:bg-white/20">Open a Ticket</Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {tickets.map(t => (
                                <Link to={`/support`} key={t._id} className="block p-4 rounded-xl border border-white/5 bg-black hover:bg-white/[0.02] transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                                                ${t.status === 'open' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20' :
                                                t.status === 'in-progress' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' :
                                                    t.status === 'resolved' ? 'bg-green-500/20 text-green-400 border border-green-500/20' :
                                                        'bg-gray-500/20 text-gray-400 border border-gray-500/20'}
                                            `}>{t.status}</span>
                                        <span className="text-xs text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <h3 className="font-bold text-sm truncate">{t.subject}</h3>
                                    <p className="text-xs text-gray-500 mt-1 capitalize">{t.category}</p>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
