import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ShieldCheck, X } from 'lucide-react';

const NotificationAccessModal = ({ show, onAccept, onDecline }) => {
    return (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center px-6 bg-black/80 backdrop-blur-md">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="w-full max-w-md bg-[#111] border border-white/10 rounded-[32px] p-8 relative overflow-hidden shadow-2xl"
                    >
                        {/* Background Glow */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 blur-[80px] -z-10" />
                        
                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mb-6 border border-orange-500/20">
                                <Bell className="text-orange-500" size={32} />
                            </div>
                            
                            <h2 className="text-2xl font-black mb-3">Don't Miss a Move</h2>
                            <p className="text-gray-400 text-sm leading-relaxed mb-8">
                                Get instant alerts for <span className="text-white font-bold">New Trade Ideas</span>, 
                                price targets reached, and critical market updates delivered directly to your device.
                            </p>
                            
                            <div className="w-full space-y-3">
                                <button
                                    onClick={onAccept}
                                    className="w-full bg-orange-500 text-black py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:opacity-90 transition-all shadow-[0_4px_20px_rgba(249,115,22,0.3)]"
                                >
                                    Enable Notifications
                                </button>
                                <button
                                    onClick={onDecline}
                                    className="w-full py-4 text-gray-500 font-bold text-sm hover:text-white transition-colors"
                                >
                                    Maybe Later
                                </button>
                            </div>
                            
                            <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-3 text-left">
                                <div className="p-2 bg-green-500/20 rounded-lg text-green-500">
                                    <ShieldCheck size={16} />
                                </div>
                                <p className="text-[10px] text-gray-500 leading-tight">
                                    Secure & Spam-free. You can disable these at any time from your profile settings.
                                </p>
                            </div>
                        </div>

                        <button 
                            onClick={onDecline}
                            className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default NotificationAccessModal;
