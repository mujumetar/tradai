import { motion } from "framer-motion";

const partners = [
    "Nasdaq", "BSE", "NSE", "Ai", "App Store", "Google Play",
    "MoneyControl", "ET Now", "Bloomberg", "Forbes India", "CNBC"
];

const Ticker = () => {
    return (
        <div className="py-12 bg-black overflow-hidden border-y border-white/5 whitespace-nowrap relative">
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10" />

            <motion.div
                animate={{ x: ["0%", "-50%"] }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="inline-block flex items-center gap-16 px-8"
            >
                {/* Double the list for seamless loop */}
                {[...partners, ...partners].map((partner, index) => (
                    <span
                        key={index}
                        className="text-2xl font-bold text-gray-700 hover:text-gray-400 transition-colors cursor-default"
                    >
                        {partner}
                    </span>
                ))}
            </motion.div>
        </div>
    );
};

export default Ticker;
