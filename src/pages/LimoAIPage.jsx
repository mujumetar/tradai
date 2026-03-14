import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Crown, X, Send, Lock, Trash2 } from "lucide-react";
import Navbar from "../components/Navbar";
import api from "../utils/api";
import { Link, useNavigate } from "react-router-dom";

const FREE_LIMIT = 3;
const STORAGE_KEY = "limoai_usage";

function getDailyUsage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { count: 0, date: new Date().toDateString() };
        const parsed = JSON.parse(raw);
        // Reset if new day
        if (parsed.date !== new Date().toDateString()) {
            return { count: 0, date: new Date().toDateString() };
        }
        return parsed;
    } catch {
        return { count: 0, date: new Date().toDateString() };
    }
}

function setDailyUsage(count) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ count, date: new Date().toDateString() }));
}

const PremiumModal = ({ onClose }) => {
    const navigate = useNavigate();
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
            >
                <motion.div
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.85, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="relative bg-[#0f0f18] border border-purple-500/30 rounded-[32px] p-8 max-w-md w-full shadow-2xl overflow-hidden"
                >
                    {/* Glow */}
                    <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-60 h-60 bg-purple-600/20 blur-[80px] rounded-full pointer-events-none" />

                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                        <X size={16} />
                    </button>

                    <div className="flex flex-col items-center text-center relative z-10">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mb-5 shadow-lg">
                            <Crown size={30} className="text-black" />
                        </div>
                        <h2 className="text-2xl font-black mb-2">You've hit your free limit</h2>
                        <p className="text-gray-400 text-sm mb-2">
                            You've used all <span className="text-white font-bold">3 free chats</span> for today.
                        </p>
                        <p className="text-gray-500 text-xs mb-8">Upgrade to Premium for unlimited LiMo AI access, real-time insights & Ai-backed trade ideas.</p>

                        <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 text-left space-y-2">
                            {["Unlimited LiMo AI chats daily", "Real-time market insights", "Portfolio audit & trade ideas", "Ai-registered analyst backing"].map((f) => (
                                <div key={f} className="flex items-center gap-2 text-sm">
                                    <Sparkles size={14} className="text-purple-400 flex-shrink-0" />
                                    <span className="text-gray-300">{f}</span>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => navigate("/pricing")}
                            className="w-full py-4 rounded-2xl font-bold text-base bg-gradient-to-r from-purple-600 to-purple-400 text-white hover:opacity-90 transition-opacity mb-3 shadow-lg shadow-purple-500/20"
                        >
                            Upgrade to Premium ✨
                        </button>
                        <button onClick={onClose} className="text-gray-500 text-sm hover:text-white transition-colors">
                            Maybe later
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

const LimoAIPage = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const isPremium = user?.subscription === "premium" || user?.role === "admin";

    const [messages, setMessages] = useState([
        { sender: "limo", text: "Hi! I'm LiMo, your AI market research assistant. Ask me anything about stocks, crypto, or market trends." }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [usage, setUsage] = useState(getDailyUsage);
    const containerRef = useRef(null);
    const isFirstMount = useRef(true);

    const chatsLeft = isPremium ? Infinity : Math.max(0, FREE_LIMIT - usage.count);
    const isLimitReached = !isPremium && usage.count >= FREE_LIMIT;

    const INITIAL_MESSAGE = { sender: "limo", text: "Hi! I'm LiMo, your AI market research assistant. Ask me anything about stocks, crypto, or market trends." };

    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false;
            return;
        }
        if (containerRef.current) {
            containerRef.current.scrollTo({
                top: containerRef.current.scrollHeight,
                behavior: "smooth"
            });
        }
    }, [messages, isLoading]);

    const clearChat = () => {
        setMessages([INITIAL_MESSAGE]);
        setInputValue("");
    };

    const handleSend = async (e) => {
        if (e && e.key && e.key !== "Enter") return;
        if (!inputValue.trim() || isLoading) return;

        if (isLimitReached) {
            setShowPremiumModal(true);
            return;
        }

        const userMessage = inputValue.trim();
        setInputValue("");
        setMessages(prev => [...prev, { sender: "user", text: userMessage }]);
        setIsLoading(true);

        // Increment usage for free users
        if (!isPremium) {
            const newCount = usage.count + 1;
            setDailyUsage(newCount);
            setUsage({ count: newCount, date: new Date().toDateString() });
        }

        try {
            const response = await fetch("https://n8n-32uz.onrender.com/webhook/market-research", {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({ topic: userMessage })
            });

            let responseText = "";
            try {
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    let data = await response.json();
                    if (Array.isArray(data)) data = data[0];
                    if (data?.insights) responseText = data.insights;
                    else if (data?.output) responseText = data.output;
                    else if (data?.response) responseText = data.response;
                    else if (data?.text) responseText = data.text;
                    else if (data?.message) responseText = data.message;
                    else if (data?.result) responseText = data.result;
                    else if (typeof data === "string") responseText = data;
                    else responseText = JSON.stringify(data, null, 2);
                } else {
                    responseText = await response.text();
                }
            } catch {
                responseText = "Received an unexpected response.";
            }

            setMessages(prev => [...prev, { sender: "limo", text: responseText }]);

            // Show modal after 3rd message consumed
            if (!isPremium && usage.count + 1 >= FREE_LIMIT) {
                setTimeout(() => setShowPremiumModal(true), 1500);
            }
        } catch {
            setMessages(prev => [...prev, { sender: "limo", text: "Sorry, I couldn't reach the server right now. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen bg-[#0B0D11] text-white flex flex-col overflow-hidden">
            <Navbar />

            {showPremiumModal && <PremiumModal onClose={() => setShowPremiumModal(false)} />}

            {/* Header bar */}
            <div className="flex-shrink-0 border-b border-white/5 bg-black/30 backdrop-blur-xl px-6 py-3 flex items-center justify-between mt-[64px]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center font-black italic text-black text-sm shadow-lg shadow-purple-500/30">
                        Li
                    </div>
                    <div>
                        <h1 className="font-bold text-sm">LiMo AI Assistant</h1>
                        <p className="text-xs text-green-500">● Online and analyzing</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {isPremium ? (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-xs font-bold">
                            <Crown size={12} /> Premium — Unlimited
                        </span>
                    ) : (
                        <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${chatsLeft === 0 ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-purple-500/10 border-purple-500/20 text-purple-400'}`}>
                            {chatsLeft === 0 ? <Lock size={12} /> : <Sparkles size={12} />}
                            {chatsLeft} free {chatsLeft === 1 ? "chat" : "chats"} left today
                        </span>
                    )}
                    {!isPremium && (
                        <Link to="/pricing" className="px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-purple-400 text-white text-xs font-bold hover:opacity-90 transition-opacity hidden sm:block">
                            Upgrade ✨
                        </Link>
                    )}
                    <button
                        onClick={clearChat}
                        title="Clear chat"
                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center text-gray-500 transition-colors"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Messages area */}
            <div 
                ref={containerRef}
                className="flex-1 overflow-y-auto px-4 py-6 space-y-5 scroll-smooth"
            >
                <div className="max-w-3xl mx-auto space-y-5">
                    {messages.map((msg, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25 }}
                            className={`flex gap-3 ${msg.sender === "limo" ? "flex-row-reverse" : ""}`}
                        >
                            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black italic ${msg.sender === "limo" ? "bg-purple-500 text-black shadow-md shadow-purple-500/30" : "bg-gray-800 text-gray-400"}`}>
                                {msg.sender === "limo" ? "Li" : (user?.name?.[0]?.toUpperCase() || "U")}
                            </div>
                            <div className={`max-w-[75%] md:max-w-[65%] p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.sender === "limo" ? "bg-purple-500/10 border border-purple-500/20 rounded-tr-none" : "bg-white/5 border border-white/5 rounded-tl-none"}`}>
                                {msg.text}
                            </div>
                        </motion.div>
                    ))}

                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-3 flex-row-reverse"
                        >
                            <div className="w-8 h-8 rounded-full bg-purple-500 flex-shrink-0 flex items-center justify-center text-[10px] font-black italic text-black shadow-md shadow-purple-500/30">Li</div>
                            <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-2xl rounded-tr-none">
                                <p className="text-sm italic text-gray-400 mb-2">Analyzing markets...</p>
                                <div className="flex gap-1.5">
                                    <div className="w-2 h-2 bg-purple-500/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <div className="w-2 h-2 bg-purple-500/60 rounded-full animate-bounce" style={{ animationDelay: "120ms" }} />
                                    <div className="w-2 h-2 bg-purple-500/60 rounded-full animate-bounce" style={{ animationDelay: "240ms" }} />
                                </div>
                            </div>
                        </motion.div>
                    )}
                    {/* invisible anchor removed in favor of scrollTo */}
                </div>
            </div>

            {/* Input area */}
            <div className="flex-shrink-0 border-t border-white/5 bg-black/30 backdrop-blur-xl px-4 py-4">
                <div className="max-w-3xl mx-auto">
                    {isLimitReached ? (
                        <div className="flex flex-col sm:flex-row items-center gap-3 bg-purple-500/5 border border-purple-500/20 rounded-2xl p-4">
                            <Lock size={18} className="text-purple-400 flex-shrink-0" />
                            <p className="text-sm text-gray-400 flex-1 text-center sm:text-left">You've used all 3 free chats for today.</p>
                            <button
                                onClick={() => setShowPremiumModal(true)}
                                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-400 text-white text-sm font-bold hover:opacity-90 transition-opacity whitespace-nowrap"
                            >
                                Upgrade to Premium ✨
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-3 items-end">
                            <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-purple-500/50 transition-colors">
                                <textarea
                                    rows={1}
                                    value={inputValue}
                                    onChange={(e) => {
                                        setInputValue(e.target.value);
                                        e.target.style.height = "auto";
                                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    placeholder="Ask about stocks, crypto, market trends..."
                                    className="bg-transparent outline-none text-sm w-full resize-none placeholder:text-gray-600 text-white leading-relaxed max-h-[120px]"
                                    disabled={isLoading}
                                    style={{ height: "24px" }}
                                />
                            </div>
                            <button
                                onClick={handleSend}
                                disabled={!inputValue.trim() || isLoading}
                                className="w-12 h-12 rounded-2xl bg-purple-500 hover:bg-purple-400 flex items-center justify-center text-black transition-all disabled:opacity-40 disabled:hover:bg-purple-500 shadow-lg shadow-purple-500/20 flex-shrink-0"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    )}
                    <p className="text-center text-gray-700 text-xs mt-3">LiMo AI may make mistakes. Verify important market information independently.</p>
                </div>
            </div>
        </div>
    );
};

export default LimoAIPage;
