import { useState, useEffect } from "react";
import { Download, CheckCircle, Smartphone, X } from "lucide-react";

/**
 * PWAInstallButton
 *
 * Props:
 *  - variant: "button" | "card" | "banner"
 *  - className: extra tailwind classes
 */
const PWAInstallButton = ({ variant = "button", className = "" }) => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [installState, setInstallState] = useState("idle"); // idle | installed | unsupported
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Check if already running as installed PWA
        if (window.matchMedia("(display-mode: standalone)").matches) {
            setInstallState("installed");
            return;
        }

        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setInstallState("idle");
        };

        const handleAppInstalled = () => {
            setInstallState("installed");
            setDeferredPrompt(null);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.addEventListener("appinstalled", handleAppInstalled);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
            window.removeEventListener("appinstalled", handleAppInstalled);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
            setInstallState("installed");
            setDeferredPrompt(null);
        }
    };

    if (dismissed) return null;

    // ── Card variant ──────────────────────────────────────────────────────────
    if (variant === "card") {
        if (installState === "installed") {
            return (
                <div className={`flex items-center gap-3 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 ${className}`}>
                    <CheckCircle size={20} className="text-green-400 flex-shrink-0" />
                    <div>
                        <p className="font-bold text-sm text-green-400">App Installed</p>
                        <p className="text-xs text-gray-400">liquide is running as a native app on your device.</p>
                    </div>
                </div>
            );
        }

        return (
            <div className={`relative p-6 rounded-3xl bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20 ${className}`}>
                <button onClick={() => setDismissed(true)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
                    <X size={16} />
                </button>
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-accent-gradient rounded-2xl flex items-center justify-center text-black font-black text-xl shadow-lg">L</div>
                    <div>
                        <p className="font-black text-lg">liquide</p>
                        <p className="text-xs text-gray-400">Install as a native app</p>
                    </div>
                </div>
                <ul className="space-y-1.5 mb-5 text-xs text-gray-400">
                    <li className="flex items-center gap-2"><CheckCircle size={13} className="text-orange-400 flex-shrink-0" /> Works offline</li>
                    <li className="flex items-center gap-2"><CheckCircle size={13} className="text-orange-400 flex-shrink-0" /> Faster launch from home screen</li>
                    <li className="flex items-center gap-2"><CheckCircle size={13} className="text-orange-400 flex-shrink-0" /> Push notifications for trade alerts</li>
                </ul>
                <button
                    onClick={handleInstall}
                    disabled={!deferredPrompt}
                    className="w-full flex items-center justify-center gap-2 bg-accent-gradient text-black font-black py-3 rounded-xl text-sm disabled:opacity-40 hover:opacity-90 transition-opacity shadow-[0_4px_20px_rgba(249,115,22,0.3)]"
                >
                    <Download size={16} />
                    {deferredPrompt ? "Install App" : "Open in browser to install"}
                </button>
                {!deferredPrompt && (
                    <p className="text-center text-[10px] text-gray-600 mt-2">Use Chrome on Android/Desktop to install</p>
                )}
            </div>
        );
    }

    // ── Banner variant ────────────────────────────────────────────────────────
    if (variant === "banner") {
        if (!deferredPrompt || installState === "installed") return null;

        return (
            <div className={`fixed bottom-0 left-0 right-0 z-50 p-4 bg-[#111] border-t border-white/10 ${className}`}>
                <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent-gradient rounded-xl flex items-center justify-center text-black font-black text-base flex-shrink-0">L</div>
                        <div>
                            <p className="font-bold text-sm">Install liquide</p>
                            <p className="text-xs text-gray-400">Add to home screen for the best experience</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setDismissed(true)} className="px-4 py-2 text-gray-400 text-sm hover:text-white transition-colors">
                            Not now
                        </button>
                        <button
                            onClick={handleInstall}
                            className="flex items-center gap-2 bg-accent-gradient text-black font-bold px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition-opacity shadow-lg"
                        >
                            <Download size={14} />
                            Install
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Default Button variant ────────────────────────────────────────────────
    if (installState === "installed") {
        return (
            <div className={`flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-sm font-bold ${className}`}>
                <CheckCircle size={16} />
                Installed
            </div>
        );
    }

    if (!deferredPrompt) return null;

    return (
        <button
            onClick={handleInstall}
            className={`flex items-center gap-2 bg-accent-gradient text-black font-bold px-5 py-2.5 rounded-full text-sm hover:opacity-90 transition-opacity shadow-[0_4px_20px_rgba(249,115,22,0.25)] ${className}`}
        >
            <Download size={16} />
            Download App
        </button>
    );
};

export default PWAInstallButton;
