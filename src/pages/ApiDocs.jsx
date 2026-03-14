import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Copy, Check, Terminal, Globe, Shield, Code, ChevronRight, Zap, Info, Database, Server, Cpu, Layers } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const ApiDocs = () => {
    const [activeTab, setActiveTab] = useState('js');
    const [selectedEndpoint, setSelectedEndpoint] = useState(0);
    const [copied, setCopied] = useState(null);

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const baseUrl = "https://ai-tradeai.vercel.app";

    const endpoints = [
        {
            id: 'list-ideas',
            method: 'GET',
            path: '/api/v1/trade-ideas',
            title: 'List Trade Ideas',
            desc: 'Retrieve a paginated list of market research and high-conviction trade ideas. Filterable by asset type and status.',
            params: [
                { name: 'type', type: 'string', desc: 'Asset class: EQUITY, CRYPTO, COMMODITY, FOREX', required: false },
                { name: 'status', type: 'string', desc: 'Idea status: ACTIVE, TARGET1_HIT, CLOSED', required: false },
                { name: 'limit', type: 'number', desc: 'Maximum results per page (Default 20)', required: false },
                { name: 'page', type: 'number', desc: 'Page number for pagination (Default 1)', required: false }
            ],
            response: `{
  "success": true,
  "page": 1,
  "total": 45,
  "results": [
    {
      "_id": "64f1...",
      "ticker": "RELIANCE",
      "type": "EQUITY",
      "entry": 2450.50,
      "target": 2700,
      "stopLoss": 2350,
      "status": "ACTIVE",
      "createdAt": "2026-03-14T..."
    }
  ]
}`
        },
        {
            id: 'get-idea',
            method: 'GET',
            path: '/api/v1/trade-ideas/:id',
            title: 'Get Single Idea',
            desc: 'Fetch comprehensive details for a specific trade idea, including full technical logic and performance history.',
            params: [
                { name: 'id', type: 'string', desc: 'The unique MongoDB ObjectID of the trade idea', required: true }
            ],
            response: `{
  "success": true,
  "idea": {
    "ticker": "BTC/USDT",
    "type": "CRYPTO",
    "entry": 65400,
    "target": 72000,
    "currentPrice": 67100,
    "pnl": 2.6,
    "logic": "Bullish divergence on 4H RSI..."
  }
}`
        }
    ];

    const codeExamples = {
        js: `// Using Fetch API
const response = await fetch('${baseUrl}${endpoints[selectedEndpoint].path.replace(':id', '64f1...')}', {
  method: 'GET',
  headers: {
    'x-api-key': 'YOUR_TRADAI_API_KEY',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log('Signals received:', data.results);`,
        python: `# Using Requests library
import requests

headers = {
    'x-api-key': 'YOUR_TRADAI_API_KEY',
    'Accept': 'application/json'
}

url = "${baseUrl}${endpoints[selectedEndpoint].path.replace(':id', '64f1...')}"
response = requests.get(url, headers=headers)

if response.status_code == 200:
    ideas = response.json()['results']
    print(f"Found {len(ideas)} active signals")`,
        curl: `# Direct Terminal access
curl -X GET "${baseUrl}${endpoints[selectedEndpoint].path.replace(':id', '64f1...')}" \\
     -H "x-api-key: YOUR_TRADAI_API_KEY" \\
     -H "Content-Type: application/json"`
    };

    return (
        <div className="bg-[#050608] min-h-screen text-white font-sans selection:bg-orange-500/30">
            <Navbar />

            {/* Hero Section */}
            <div className="relative pt-32 pb-20 px-6 border-b border-white/[0.05]">
                <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-orange-500/5 blur-[120px] rounded-full -z-10" />
                <div className="max-w-7xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs font-bold border border-orange-500/20 mb-6 uppercase tracking-widest">
                            <Cpu size={14} /> Developer API v1.0
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter">
                            Build with <span className="text-gradient">TRADAI</span>
                        </h1>
                        <p className="text-gray-400 text-xl max-w-2xl leading-relaxed">
                            Power your trading systems with institutional-grade market research, 
                            real-time status updates, and high-conviction signals through a 
                            modern REST interface.
                        </p>
                    </motion.div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                    
                    {/* ── Sidebar Navigation ── */}
                    <div className="lg:col-span-1 space-y-10">
                        <section>
                            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Info size={14} className="text-orange-500" /> Getting Started
                            </h3>
                            <nav className="space-y-4">
                                <div className="p-5 bg-white/[0.03] border border-white/10 rounded-2xl hover:border-orange-500/30 transition-all group">
                                    <h4 className="flex items-center gap-2 font-bold mb-2 text-sm">
                                        <Shield size={14} className="text-orange-400" /> Authentication
                                    </h4>
                                    <p className="text-[11px] text-gray-400 leading-relaxed">
                                        Pass your API key in the <code className="text-white">x-api-key</code> header. 
                                        Keep it secret and never share it on client-side JS.
                                    </p>
                                </div>
                                <div className="p-5 bg-white/[0.03] border border-white/10 rounded-2xl">
                                    <h4 className="flex items-center gap-2 font-bold mb-2 text-sm text-green-400">
                                        <Globe size={14} /> Base Endpoint
                                    </h4>
                                    <code className="text-[10px] block truncate text-gray-400 font-mono py-1.5 px-2 bg-black/50 rounded-lg">
                                        {baseUrl}
                                    </code>
                                </div>
                                <div className="p-5 bg-white/[0.03] border border-white/10 rounded-2xl">
                                    <h4 className="flex items-center gap-2 font-bold mb-2 text-sm text-indigo-400">
                                        <Layers size={14} /> Rate Limits
                                    </h4>
                                    <p className="text-[11px] text-gray-400">
                                        1 request = 1 credit. Free tier includes 100 dev credits. Premium users get unlimited daily pings.
                                    </p>
                                </div>
                            </nav>
                        </section>
                    </div>

                    {/* ── Main Documentation Area ── */}
                    <div className="lg:col-span-3">
                        {/* Endpoint Selector Tabs */}
                        <div className="flex gap-2 mb-10 overflow-x-auto pb-2 scrollbar-none">
                            {endpoints.map((ep, idx) => (
                                <button
                                    key={ep.id}
                                    onClick={() => setSelectedEndpoint(idx)}
                                    className={`flex items-center gap-3 px-5 py-3 rounded-2xl border font-bold text-sm whitespace-nowrap transition-all ${
                                        selectedEndpoint === idx 
                                        ? 'bg-orange-500/10 border-orange-500/50 text-white shadow-[0_0_20px_rgba(231,137,50,0.1)]' 
                                        : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'
                                    }`}
                                >
                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                        ep.method === 'GET' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                                    }`}>
                                        {ep.method}
                                    </span>
                                    {ep.title}
                                </button>
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={selectedEndpoint}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-12"
                            >
                                <section>
                                    <h2 className="text-3xl font-black mb-4 flex items-center gap-3">
                                        <div className="w-1 h-8 bg-orange-500 rounded-full" />
                                        {endpoints[selectedEndpoint].title}
                                    </h2>
                                    <p className="text-gray-400 text-lg leading-relaxed mb-8">
                                        {endpoints[selectedEndpoint].desc}
                                    </p>

                                    {/* Request Area */}
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                                        <div className="space-y-8">
                                            {/* Parameters Table */}
                                            <div>
                                                <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Request Parameters</h4>
                                                <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.02]">
                                                    <table className="w-full text-sm">
                                                        <thead className="border-b border-white/10">
                                                            <tr className="bg-white/5">
                                                                <th className="text-left p-4 text-[10px] uppercase font-black text-gray-400">Name</th>
                                                                <th className="text-left p-4 text-[10px] uppercase font-black text-gray-400">Type</th>
                                                                <th className="text-left p-4 text-[10px] uppercase font-black text-gray-400">Required</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-white/10">
                                                            {endpoints[selectedEndpoint].params.map((p, idx) => (
                                                                <tr key={idx} className="group">
                                                                    <td className="p-4">
                                                                        <code className="text-orange-400 font-mono text-xs">{p.name}</code>
                                                                        <p className="text-[10px] text-gray-500 mt-1">{p.desc}</p>
                                                                    </td>
                                                                    <td className="p-4 text-xs text-gray-400 font-mono">{p.type}</td>
                                                                    <td className="p-4">
                                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.required ? 'bg-red-500/10 text-red-500' : 'bg-gray-500/10 text-gray-500'}`}>
                                                                            {p.required ? 'YES' : 'OPTIONAL'}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Code Blocks */}
                                        <div className="space-y-6">
                                            <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                                                <div className="flex bg-white/5 border-b border-white/10 p-2 gap-2">
                                                    {['js', 'python', 'curl'].map(t => (
                                                        <button
                                                            key={t}
                                                            onClick={() => setActiveTab(t)}
                                                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeTab === t ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20' : 'text-gray-500 hover:text-white'}`}
                                                        >
                                                            {t === 'js' ? 'Node.js' : t.toUpperCase()}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="p-6 relative group">
                                                    <pre className="font-mono text-[11px] text-orange-200/70 leading-relaxed overflow-x-auto min-h-[140px]">
                                                        {codeExamples[activeTab]}
                                                    </pre>
                                                    <button
                                                        onClick={() => copyToClipboard(codeExamples[activeTab], 'code')}
                                                        className="absolute top-4 right-4 p-2 bg-white/5 border border-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10"
                                                    >
                                                        {copied === 'code' ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-gray-400" />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Response Block */}
                                            <div className="bg-black border border-white/5 rounded-3xl p-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">JSON Response Schema</span>
                                                    <div className="flex gap-1.5">
                                                        <div className="w-2 h-2 rounded-full bg-red-500/40" />
                                                        <div className="w-2 h-2 rounded-full bg-yellow-500/40" />
                                                        <div className="w-2 h-2 rounded-full bg-green-500/40" />
                                                    </div>
                                                </div>
                                                <pre className="text-[10px] font-mono text-blue-300/60 leading-tight">
                                                    {endpoints[selectedEndpoint].response}
                                                </pre>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Use Case Feature */}
                                <section className="p-10 bg-accent-gradient rounded-[40px] text-black">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                        <div>
                                            <h3 className="text-3xl font-black mb-4 flex items-center gap-2">
                                                <Zap fill="black" /> Ready for Automation
                                            </h3>
                                            <p className="font-bold text-black/70 mb-6 italic leading-relaxed">
                                                "Trading bots integrated with TRADAI signals execute 8.4x faster than manual oversight, ensuring you capture entry points at peak convergence."
                                            </p>
                                            <div className="flex gap-4">
                                                <button className="px-6 py-3 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform">
                                                    Generate SDK Key
                                                </button>
                                                <button className="px-6 py-3 bg-black/10 border border-black/20 rounded-2xl font-black text-xs uppercase tracking-widest">
                                                    Join Discord
                                                </button>
                                            </div>
                                        </div>
                                        <div className="bg-black/10 border border-black/20 rounded-[32px] p-6 backdrop-blur-sm">
                                            <div className="flex items-center gap-3 mb-4">
                                                <Terminal size={16} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Real-time Terminal</span>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-xs font-mono text-black/60 font-bold">$ npm install @tradai/sdk</p>
                                                <p className="text-xs font-mono text-black/60 font-bold">$ tradai connect --key ***_v1</p>
                                                <p className="text-xs font-mono text-black"> [SYSTEM] Connected to Live Feed...</p>
                                                <p className="text-xs font-mono text-green-700"> [SIGNAL] RELIANCE BUY @ 2450.50</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ApiDocs;

