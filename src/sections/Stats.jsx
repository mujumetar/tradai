import { motion, useSpring, useTransform, useInView } from "framer-motion";
import { useEffect, useRef } from "react";

const stats = [
    { label: "App Downloads", value: 3.5, suffix: "Mn+" },
    { label: "Portfolio Tracked", value: 2500, prefix: "₹", suffix: "Cr+" },
    { label: "Expert Researchers", value: 50, suffix: "+" },
    { label: "Trade Ideas", value: 10000, suffix: "+" },
];

const StatItem = ({ stat, index }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    const spring = useSpring(0, { stiffness: 40, damping: 20 });
    const displayValue = useTransform(spring, (current) => {
        if (stat.value >= 1000) {
            return Math.floor(current).toLocaleString();
        }
        return current.toFixed(stat.value % 1 === 0 ? 0 : 1);
    });

    useEffect(() => {
        if (isInView) {
            spring.set(stat.value);
        }
    }, [isInView, spring, stat.value]);

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="text-center group"
        >
            <h3 className="text-4xl md:text-5xl font-extrabold text-gradient mb-2 group-hover:scale-110 transition-transform duration-500">
                {stat.prefix}<motion.span>{displayValue}</motion.span>{stat.suffix}
            </h3>
            <p className="text-gray-400 font-medium tracking-wide uppercase text-xs opacity-70 group-hover:opacity-100 transition-opacity">{stat.label}</p>
        </motion.div>
    );
};

const Stats = () => {
    return (
        <section className="py-24 px-6 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">
                {stats.map((stat, index) => (
                    <StatItem key={stat.label} stat={stat} index={index} />
                ))}
            </div>
        </section>
    );
};

export default Stats;
