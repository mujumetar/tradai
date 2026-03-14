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
    const userLocal = (() => {
        try { return JSON.parse(localStorage.getItem("user")); }
        catch { return null; }
    })();

    const [user, setUser] = useState(userLocal || null);
    const [apiKeys, setApiKeys] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newKeyName, setNewKeyName] = useState("");
    const [copied, setCopied] = useState(null);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [pushLoading, setPushLoading] = useState(false);
    const [showPushModal, setShowPushModal] = useState(false);
    const [notifPermission, setNotifPermission] = useState(
        typeof Notification !== "undefined" ? Notification.permission : "default"
    );

    const fetchData = useCallback(async () => {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) { navigate("/auth"); return; }
        const userLocalData = JSON.parse(storedUser);

        try {
            const profileRes = await api.get('/users/profile');
            const updatedUser = { ...userLocalData, ...profileRes.data };
            setUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));

            const keysRes = await api.get('/users/keys');
            setApiKeys(keysRes.data);

            const ticketsRes = await api.get('/tickets/my');
            setTickets(ticketsRes.data.slice(0, 5));
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

        // Determine current notification subscription state
        const checkSubscription = async () => {
            const currentPermission = typeof Notification !== "undefined" ? Notification.permission : "default";
            setNotifPermission(currentPermission);

            // If already denied — don't show modal, don't check push
            if (currentPermission === "denied") {
                setIsSubscribed(false);
                return;
            }

            try {
                const sub = await getPushSubscription();
                const subscribed = !!sub;
                setIsSubscribed(subscribed);

                // Only show modal if:
                // 1. Not yet subscribed
                // 2. Permission not already denied
                // 3. User hasn't dismissed this session
                if (!subscribed && currentPermission !== "denied" && !sessionStorage.getItem('push_modal_dismissed')) {
                    setTimeout(() => setShowPushModal(true), 2000);
                }
            } catch (err) {
                console.warn("Could not check push subscription:", err);
            }
        };

        checkSubscription();
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
                // ── Unsubscribe ──
                await unsubscribeFromPush();
                setIsSubscribed(false);
                setNotifPermission(typeof Notification !== "undefined" ? Notification.permission : "default");
            } else {
                // ── Subscribe ──
                // Step 1: Try Web Push (primary, always attempted)
                let webPushOk = false;
                try {
                    const sub = await subscribeToPush();
                    if (sub) webPushOk = true;
                } catch (wpErr) {
                    console.warn("Web Push subscribe failed:", wpErr);
                }

                // Step 2: Try FCM (optional enhancement — failure doesn't block)
                // requestFcmToken is already non-throwing
                await requestFcmToken();

                // Update permission state
                const newPerm = typeof Notification !== "undefined" ? Notification.permission : "default";
                setNotifPermission(newPerm);

                if (newPerm === "granted" && webPushOk) {
                    setIsSubscribed(true);
                    setShowPushModal(false);
                    sessionStorage.setItem('push_modal_dismissed', 'true');
                } else if (newPerm === "denied") {
                    // Browser denied — surface a clear message
                    alert("Notifications were blocked. Please enable them in your browser settings and try again.");
                } else if (!webPushOk) {
                    alert("Could not subscribe to notifications. Please try again or check your browser settings.");
                }
            }
        } catch (err) {
            console.error("Push toggle failed:", err);
            alert("Something went wrong. Please allow notification permission in your browser settings.");
        } finally {
            setPushLoading(false);
        }
    };

    const handleModalDecline = () => {
        setShowPushModal(false);
        sessionStorage.setItem('push_modal_dismissed', 'true');
    };

    if (loading || !user) {
        return (
            <div className="min-h-screen bg-black text-white pt-24 px-4 flex items-center justify-center">
                <div className="font-bold text-xl text-gray-500 animate-pulse">Loading Profile...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white pt-20 sm:pt-24 px-4 sm:px-6">
            <Navbar />
            <NotificationAccessModal
                show={showPushModal}
                loading={pushLoading}
                onAccept={handlePushToggle}
                onDecline={handleModalDecline}
            />

            <div className="max-w-5xl mx-auto pb-20 space-y-6 sm:space-y-8">

                {/* ── Profile Header ── */}
                <div className="p-5 sm:p-8 border border-white/10 rounded-3xl bg-white/[0.02] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-accent-orange/10 blur-[100px] pointer-events-none" />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
                        <div className="flex items-center gap-4 sm:gap-6">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-accent-gradient flex items-center justify-center text-2xl sm:text-3xl font-bold text-black border-4 border-black/50 shadow-xl flex-shrink-0">
                                {user.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold mb-1">{user.name}</h1>
                                <p className="text-gray-400 text-sm sm:text-base truncate max-w-[200px] sm:max-w-none">{user.email}</p>
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 sm:mt-3">
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
                            <Link to="/pricing" className="bg-accent-gradient text-black font-bold px-5 sm:px-6 py-3 rounded-xl hover:opacity-90 inline-block shadow-lg text-sm sm:text-base text-center w-full sm:w-auto">
                                Upgrade to Premium
                            </Link>
                        )}
                    </div>
                </div>

                {/* ── Two-column grid: API Keys + Notifications ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">

                    {/* ── API Keys Section ── */}
                    <div className="border border-white/10 rounded-3xl bg-white/[0.01] p-5 sm:p-8">
                        <div className="flex items-center justify-between mb-5 sm:mb-6">
                            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                                <Key className="text-accent-orange" size={18} /> API Keys
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
                            <div className="space-y-5 sm:space-y-6">
                                <div className="p-4 sm:p-5 bg-orange-500/5 border border-orange-500/20 rounded-2xl">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400">
                                                <Zap size={18} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm">Developer Access</h4>
                                                <p className="text-[11px] text-gray-500">Integrate signals into your apps</p>
                                            </div>
                                        </div>
                                        <Link to="/api-docs" target="_blank" className="flex items-center gap-1 text-xs font-black text-orange-400 hover:text-orange-300 uppercase tracking-wider">
                                            Docs <ExternalLink size={12} />
                                        </Link>
                                    </div>
                                    <form onSubmit={handleCreateKey} className="flex gap-2 sm:gap-3">
                                        <input
                                            value={newKeyName} onChange={e => setNewKeyName(e.target.value)}
                                            placeholder="Key Name (e.g., Bot v1)"
                                            className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 outline-none text-sm focus:border-accent-orange"
                                        />
                                        <button disabled={apiKeys.length >= 5} type="submit" className="bg-orange-500 text-black px-3 sm:px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-1.5 disabled:opacity-50 flex-shrink-0">
                                            <Plus size={15} /> <span className="hidden sm:inline">Generate</span><span className="sm:hidden">Add</span>
                                        </button>
                                    </form>
                                </div>
                                <div className="space-y-3">
                                    {apiKeys.length === 0 ? (
                                        <p className="text-center text-xs text-gray-600 py-4">No API keys yet.</p>
                                    ) : (
                                        apiKeys.map(k => (
                                            <div key={k._id} className="p-3 sm:p-4 rounded-2xl bg-black border border-white/10 flex items-center justify-between gap-3 group hover:border-white/20 transition-colors">
                                                <div className="overflow-hidden min-w-0">
                                                    <p className="font-bold text-xs mb-1 text-gray-300 truncate">{k.name}</p>
                                                    <div className="flex items-center gap-2">
                                                        <code className="text-[11px] text-gray-600 font-mono truncate max-w-[130px] sm:max-w-[160px]">{k.key}</code>
                                                        <button onClick={() => copyToClipboard(k.key, k._id)} className="text-gray-600 hover:text-white transition-colors flex-shrink-0">
                                                            {copied === k._id ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={13} />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <button onClick={() => handleRevokeKey(k._id)} className="text-gray-600 hover:text-red-500 p-2 bg-white/5 rounded-lg hover:bg-red-500/10 transition-colors flex-shrink-0">
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Push Notifications Section ── */}
                    <div className="border border-white/10 rounded-3xl bg-white/[0.01] p-5 sm:p-8 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-5 sm:mb-6">
                                <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                                    <Bell className="text-accent-orange" size={18} /> Real-time Alerts
                                </h2>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${isSubscribed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-500'}`}>
                                    {isSubscribed ? 'Enabled' : 'Disabled'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-400 mb-5 sm:mb-6 leading-relaxed">
                                Get instant browser notifications for new high-conviction trade ideas and market breaking news. Recommended for active traders.
                            </p>
                            {notifPermission === "denied" && (
                                <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 leading-relaxed">
                                    ⚠️ Notifications are blocked in your browser. To enable them, click the lock/info icon in your address bar and allow notifications, then reload.
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handlePushToggle}
                            disabled={pushLoading || notifPermission === "denied"}
                            className={`w-full flex items-center justify-center gap-2 py-3.5 sm:py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${isSubscribed
                                ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20'
                                : 'bg-orange-500 text-black shadow-[0_4px_20px_rgba(249,115,22,0.3)] hover:opacity-90'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {pushLoading
                                ? <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Processing...</>
                                : isSubscribed
                                    ? <><BellOff size={18} /> Disable Alerts</>
                                    : <><Bell size={18} /> Enable Notifications</>
                            }
                        </button>
                    </div>
                </div>

                {/* ── Support Tickets Section ── */}
                <div className="border border-white/10 rounded-3xl bg-white/[0.01] p-5 sm:p-8">
                    <div className="flex items-center justify-between mb-5 sm:mb-6">
                        <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                            <Ticket className="text-accent-orange" size={18} /> Recent Support Tickets
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
                                <Link to="/support" key={t._id} className="block p-4 rounded-xl border border-white/5 bg-black hover:bg-white/[0.02] transition-colors">
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
