import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

function ReloadPrompt() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r);
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    if (!offlineReady && !needRefresh) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex items-center justify-center p-4">
            <div className="bg-[#111] border border-white/10 p-6 rounded-3xl shadow-2xl max-w-sm w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-accent-orange/10 rounded-2xl flex items-center justify-center text-accent-orange flex-shrink-0">
                        <RefreshCw size={24} className={needRefresh ? "animate-spin-slow" : ""} />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-lg mb-1">
                            {offlineReady ? "App Offline Ready" : "New Update Available"}
                        </h4>
                        <p className="text-gray-400 text-sm leading-relaxed mb-4">
                            {offlineReady
                                ? "The app has been cached and is ready to work offline."
                                : "A new version of liquide is available. Refresh to get the latest features and fixes."}
                        </p>
                        <div className="flex items-center gap-3">
                            {needRefresh && (
                                <button
                                    onClick={() => updateServiceWorker(true)}
                                    className="flex-1 bg-accent-orange text-black font-bold py-2.5 rounded-xl hover:opacity-90 transition-opacity text-sm"
                                >
                                    Update Now
                                </button>
                            )}
                            <button
                                onClick={() => close()}
                                className="px-4 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all text-sm"
                            >
                                {needRefresh ? "Later" : "Close"}
                            </button>
                        </div>
                    </div>
                    <button onClick={() => close()} className="text-gray-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ReloadPrompt;
