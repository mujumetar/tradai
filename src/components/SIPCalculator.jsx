import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const SIPCalculator = () => {
    const [amount, setAmount] = useState(5000);
    const [rate, setRate] = useState(12);
    const [years, setYears] = useState(10);
    const [result, setResult] = useState({ invested: 0, gains: 0, total: 0 });

    useEffect(() => {
        const monthlyRate = rate / 12 / 100;
        const months = years * 12;
        const totalValue = amount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
        const investedAmount = amount * months;

        setResult({
            invested: investedAmount,
            gains: totalValue - investedAmount,
            total: totalValue
        });
    }, [amount, rate, years]);

    return (
        <div className="bg-secondary p-8 rounded-[32px] border border-white/10">
            <h3 className="text-2xl font-bold mb-8">SIP Calculator</h3>

            <div className="space-y-8">
                <div>
                    <div className="flex justify-between mb-2">
                        <label className="text-gray-400">Monthly Investment</label>
                        <span className="text-white font-bold">₹{amount.toLocaleString()}</span>
                    </div>
                    <input
                        type="range" min="500" max="100000" step="500"
                        className="w-full accent-accent-orange bg-white/10 h-1.5 rounded-full appearance-none"
                        value={amount} onChange={(e) => setAmount(Number(e.target.value))}
                    />
                </div>

                <div>
                    <div className="flex justify-between mb-2">
                        <label className="text-gray-400">Expected Return Rate (p.a)</label>
                        <span className="text-white font-bold">{rate}%</span>
                    </div>
                    <input
                        type="range" min="1" max="30" step="0.5"
                        className="w-full accent-accent-orange bg-white/10 h-1.5 rounded-full appearance-none"
                        value={rate} onChange={(e) => setRate(Number(e.target.value))}
                    />
                </div>

                <div>
                    <div className="flex justify-between mb-2">
                        <label className="text-gray-400">Time Period</label>
                        <span className="text-white font-bold">{years} Years</span>
                    </div>
                    <input
                        type="range" min="1" max="40" step="1"
                        className="w-full accent-accent-orange bg-white/10 h-1.5 rounded-full appearance-none"
                        value={years} onChange={(e) => setYears(Number(e.target.value))}
                    />
                </div>
            </div>

            <div className="mt-12 pt-8 border-t border-white/5 space-y-4">
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">Invested Amount</span>
                    <span className="text-xl font-bold">₹{Math.round(result.invested).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">Estimated Returns</span>
                    <span className="text-xl font-bold text-green-500">₹{Math.round(result.gains).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                    <span className="text-white font-bold">Total Value</span>
                    <span className="text-3xl font-extrabold text-gradient">₹{Math.round(result.total).toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
};

export default SIPCalculator;
