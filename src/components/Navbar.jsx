import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronRight, User, LogOut, LayoutDashboard, Shield, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../utils/cn";
import PWAInstallButton from "./PWAInstallButton";
import NotificationAccessModal from "./NotificationAccessModal";
import { subscribeToPush, getPushSubscription } from "../utils/pushNotifications";
import { requestFcmToken } from "../utils/firebase";

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [dynamicLinks, setDynamicLinks] = useState([]);
    const location = useLocation();
    const userMenuRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Close mobile nav on route change
    useEffect(() => { setIsOpen(false); setUserMenuOpen(false); }, [location]);

    useEffect(() => {
        fetch("http://localhost:5000/api/public/ui-config")
            .then(res => res.json())
            .then(data => {
                if (data.SIDEBAR_LINKS && Array.isArray(data.SIDEBAR_LINKS) && data.SIDEBAR_LINKS.length > 0) {
                    setDynamicLinks(data.SIDEBAR_LINKS);
                }
            })
            .catch(err => console.error("Failed to fetch dynamic links", err));
    }, []);

    // Close user dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // ── Push Notification Logic ──
    const [showPushModal, setShowPushModal] = useState(false);
    const [pushLoading, setPushLoading] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (!userStr) return;

        const checkSubscription = async () => {
            const currentPermission = typeof Notification !== "undefined" ? Notification.permission : "default";
            if (currentPermission === "denied") return;

            try {
                const sub = await getPushSubscription();
                const subscribed = !!sub;
                setIsSubscribed(subscribed);

                if (!subscribed && currentPermission !== "denied" && !sessionStorage.getItem('push_modal_dismissed')) {
                    setTimeout(() => setShowPushModal(true), 3000);
                }
            } catch (err) {
                console.warn("Push check failed:", err);
            }
        };

        checkSubscription();
    }, [location.pathname]);

    const handlePushToggle = async () => {
        setPushLoading(true);
        try {
            let webPushOk = false;
            try {
                const sub = await subscribeToPush();
                if (sub) webPushOk = true;
            } catch (wpErr) {
                console.warn("Web Push subscribe failed:", wpErr);
            }

            await requestFcmToken();

            const newPerm = typeof Notification !== "undefined" ? Notification.permission : "default";
            if (newPerm === "granted" && webPushOk) {
                setIsSubscribed(true);
                setShowPushModal(false);
                sessionStorage.setItem('push_modal_dismissed', 'true');
            } else if (newPerm === "denied") {
                alert("Notifications were blocked. Please enable them in settings.");
            }
        } catch (err) {
            console.error("Push toggle failed:", err);
        } finally {
            setPushLoading(false);
        }
    };

    const handleModalDecline = () => {
        setShowPushModal(false);
        sessionStorage.setItem('push_modal_dismissed', 'true');
    };

    const navLinks = dynamicLinks.length > 0 ? dynamicLinks : [
        { name: "Home", href: "/" },
        { name: "Blogs", href: "/blogs" },
        { name: "TRADAI One", href: "/liquide-one" },
        { name: "Research", href: "/research" },
        { name: "Pricing", href: "/pricing" },
        { name: "About", href: "/about" },
    ];

    let user = null;
    try {
        const userStr = localStorage.getItem("user");
        if (userStr) user = JSON.parse(userStr);
    } catch { /* ignore */ }

    const isLoggedIn = !!user;
    const isStaff = user && ["admin", "manager", "support"].includes(user.role);

    const handleLogout = () => {
        localStorage.removeItem('user');
        window.location.reload();
    };

    const isActive = (href) => location.pathname === href;

    return (
        <>
            <nav className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
                scrolled
                    ? "bg-black/80 backdrop-blur-xl  shadow-[0_0_40px_rgba(0,0,0,0.5)]"
                    : "bg-transparent"
            )}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 md:h-18 flex items-center justify-between gap-4">

                    {/* ── Logo ── */}
                    <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
                        <div className="w-8 h-8 bg-accent-gradient rounded-xl flex items-center justify-center font-black text-black text-lg shadow-[0_0_20px_rgba(231,137,50,0.4)] group-hover:shadow-[0_0_30px_rgba(231,137,50,0.6)] transition-shadow">
                            T
                        </div>
                        <span className="text-xl font-black tracking-tight text-white">
                            TRADAI
                        </span>
                    </Link>

                    {/* ── Desktop Links ── */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.href}
                                className={cn(
                                    "relative px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200",
                                    isActive(link.href)
                                        ? "text-white bg-white/10"
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                {link.name}
                                {isActive(link.href) && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent-orange rounded-full"
                                    />
                                )}
                            </Link>
                        ))}
                    </div>

                    {/* ── Desktop Right ── */}
                    <div className="hidden md:flex items-center gap-3">
                        <PWAInstallButton variant="button" />

                        {isLoggedIn ? (
                            <div className="relative" ref={userMenuRef}>
                                <button
                                    onClick={() => setUserMenuOpen(v => !v)}
                                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
                                >
                                    <div className="w-7 h-7 rounded-full bg-accent-gradient flex items-center justify-center text-black font-black text-sm">
                                        {user.name?.[0]?.toUpperCase()}
                                    </div>
                                    <span className="text-sm font-semibold text-gray-200 max-w-[80px] truncate">{user.name?.split(' ')[0]}</span>
                                </button>

                                <AnimatePresence>
                                    {userMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute right-0 top-[calc(100%+8px)] w-52 bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-1.5"
                                        >
                                            <div className="px-3 py-2 border-b border-white/5 mb-1">
                                                <p className="text-xs font-bold text-white truncate">{user.name}</p>
                                                <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                                            </div>
                                            <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                                                <LayoutDashboard size={14} /> Dashboard
                                            </Link>
                                            {isStaff && (
                                                <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                                                    <Shield size={14} /> Admin Panel
                                                </Link>
                                            )}
                                            <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors mt-1 border-t border-white/5">
                                                <LogOut size={14} /> Logout
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link to="/auth" className="px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors">
                                    Login
                                </Link>
                                <Link to="/auth" className="px-4 py-2 bg-accent-gradient text-black font-bold text-sm rounded-xl hover:opacity-90 transition-opacity shadow-[0_4px_15px_rgba(231,137,50,0.3)]">
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* ── Mobile Right ── */}
                    <div className="flex md:hidden items-center gap-2">
                        {isLoggedIn && (
                            <div className="w-8 h-8 rounded-full bg-accent-gradient flex items-center justify-center text-black font-black text-sm">
                                {user.name?.[0]?.toUpperCase()}
                            </div>
                        )}
                        <button
                            onClick={() => setIsOpen(v => !v)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
                            aria-label="Toggle menu"
                        >
                            <AnimatePresence mode="wait">
                                {isOpen
                                    ? <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X size={20} /></motion.div>
                                    : <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><Menu size={20} /></motion.div>
                                }
                            </AnimatePresence>
                        </button>
                    </div>
                </div>
            </nav>

            {/* ── Mobile Drawer Overlay ── */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            key="backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Drawer */}
                        <motion.div
                            key="drawer"
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 28, stiffness: 300 }}
                            className="fixed top-0 right-0 bottom-0 z-50 w-[280px] bg-[#0c0c0c] border-l border-white/10 md:hidden flex flex-col shadow-2xl"
                        >
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
                                <Link to="/" onClick={() => setIsOpen(false)} className="flex items-center gap-2">
                                    <div className="w-7 h-7 bg-accent-gradient rounded-lg flex items-center justify-center font-black text-black text-base">T</div>
                                    <span className="font-black text-lg tracking-tight">TRADAI</span>
                                </Link>
                                <button onClick={() => setIsOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-gray-400 hover:text-white transition-colors touch-active">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* User Info (if logged in) */}
                            {isLoggedIn && (
                                <div className="px-5 py-4 border-b border-white/[0.07] bg-white/[0.02]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-accent-gradient flex items-center justify-center text-black font-black text-base flex-shrink-0">
                                            {user.name?.[0]?.toUpperCase()}
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="font-bold text-sm text-white truncate">{user.name}</p>
                                            <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Nav Links */}
                            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                                {navLinks.map((link, i) => (
                                    <motion.div
                                        key={link.name}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.05 * i }}
                                    >
                                        <Link
                                            to={link.href}
                                            onClick={() => setIsOpen(false)}
                                            className={cn(
                                                "flex items-center justify-between px-4 py-3.5 rounded-2xl font-semibold text-sm transition-all touch-active",
                                                isActive(link.href)
                                                    ? "bg-white/10 text-white"
                                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                                            )}
                                        >
                                            {link.name}
                                            <ChevronRight size={14} className="text-gray-600" />
                                        </Link>
                                    </motion.div>
                                ))}

                                {/* User Actions */}
                                {isLoggedIn ? (
                                    <div className="pt-3 mt-3 border-t border-white/[0.07] space-y-1">
                                        <Link to="/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl font-semibold text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all touch-active">
                                            <LayoutDashboard size={16} /> Dashboard
                                        </Link>
                                        {isStaff && (
                                            <Link to="/admin" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl font-semibold text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all touch-active">
                                                <Shield size={16} /> Admin Panel
                                            </Link>
                                        )}
                                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-semibold text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all touch-active">
                                            <LogOut size={16} /> Logout
                                        </button>
                                    </div>
                                ) : (
                                    <div className="pt-3 mt-3 border-t border-white/[0.07] space-y-2">
                                        <Link to="/auth" onClick={() => setIsOpen(false)} className="flex items-center justify-center px-4 py-3.5 rounded-2xl font-bold text-sm text-gray-300 border border-white/10 hover:bg-white/5 transition-all touch-active">
                                            Login
                                        </Link>
                                        <Link to="/auth" onClick={() => setIsOpen(false)} className="flex items-center justify-center px-4 py-3.5 rounded-2xl font-bold text-sm bg-accent-gradient text-black shadow-[0_4px_15px_rgba(231,137,50,0.3)] hover:opacity-90 transition-opacity touch-active">
                                            Get Started
                                        </Link>
                                    </div>
                                )}
                            </nav>

                            {/* PWA Install Card — bottom of drawer */}
                            <div className="px-3 pb-5 pt-2 border-t border-white/[0.07]">
                                <PWAInstallButton variant="card" className="!rounded-2xl" />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
            <NotificationAccessModal
                show={showPushModal}
                loading={pushLoading}
                onAccept={handlePushToggle}
                onDecline={handleModalDecline}
            />
        </>
    );
};

export default Navbar;
