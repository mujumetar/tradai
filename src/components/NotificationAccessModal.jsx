import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ShieldCheck, X } from 'lucide-react';

const NotificationAccessModal = ({ show, loading = false, onAccept, onDecline }) => {
    return (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center px-4 sm:px-6 bg-black/80 backdrop-blur-md">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 40 }}
                        transition={{ type: "spring", damping: 26, stiffness: 300 }}
                        className="w-full max-w-md bg-[#111] border border-white/10 rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 relative overflow-hidden shadow-2xl mb-4 sm:mb-0"
                    >
                        {/* Background Glow */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 blur-[80px] -z-10" />

                        {/* Close button */}
                        <button
                            onClick={onDecline}
                            disabled={loading}
                            className="absolute top-5 right-5 text-gray-500 hover:text-white transition-colors disabled:opacity-40"
                            aria-label="Close"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-orange-500/10 rounded-full flex items-center justify-center mb-5 sm:mb-6 border border-orange-500/20">
                                <Bell className="text-orange-500" size={28} />
                            </div>

                            <h2 className="text-xl sm:text-2xl font-black mb-3">Don't Miss a Move</h2>
                            <p className="text-gray-400 text-sm leading-relaxed mb-6 sm:mb-8">
                                Get instant alerts for <span className="text-white font-bold">New Trade Ideas</span>,&nbsp;
                                price targets reached, and critical market updates delivered directly to your device.
                            </p>

                            <div className="w-full space-y-3">
                                <button
                                    onClick={onAccept}
                                    disabled={loading}
                                    className="w-full bg-orange-500 text-black py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:opacity-90 transition-all shadow-[0_4px_20px_rgba(249,115,22,0.3)] disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                            Enabling...
                                        </>
                                    ) : (
                                        'Enable Notifications'
                                    )}
                                </button>
                                <button
                                    onClick={onDecline}
                                    disabled={loading}
                                    className="w-full py-3.5 text-gray-500 font-bold text-sm hover:text-white transition-colors disabled:opacity-40"
                                >
                                    Maybe Later
                                </button>
                            </div>

                            <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-white/5 flex items-center gap-3 text-left w-full">
                                <div className="p-2 bg-green-500/20 rounded-lg text-green-500 flex-shrink-0">
                                    <ShieldCheck size={16} />
                                </div>
                                <p className="text-[10px] text-gray-500 leading-tight">
                                    Secure &amp; Spam-free. You can disable these at any time from your profile settings.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default NotificationAccessModal;
