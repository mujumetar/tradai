import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Key, Copy, Check, Terminal, Globe, Shield, Code, ChevronRight, Zap } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const ApiDocs = () => {
    const [activeTab, setActiveTab] = useState('js');
    const [copied, setCopied] = useState(null);

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const endpoints = [
        {
            method: 'GET',
            path: '/api/v1/trade-ideas',
            desc: 'Retrieve a list of market research and trade ideas.',
            params: [
                { name: 'type', type: 'string', desc: 'Filter by type: Equity, Crypto, F&O' },
                { name: 'status', type: 'string', desc: 'Filter by status: Active, Completed' },
                { name: 'limit', type: 'number', desc: 'Number of results (default 10)' }
            ],
            response: `{
  "success": true,
  "data": [
    {
      "ticker": "BTC/USDT",
      "type": "Crypto",
      "entry": "65000",
      "target": "72000",
      "stopLoss": "62000",
      "status": "Active"
    }
  ]
}`
        }
    ];

    const codeExamples = {
        js: `const response = await fetch('http://localhost:5000/api/v1/trade-ideas', {
  headers: {
    'x-api-key': 'YOUR_API_KEY'
  }
});
const data = await response.json();
console.log(data);`,
        python: `import requests

headers = {'x-api-key': 'YOUR_API_KEY'}
response = requests.get('http://localhost:5000/api/v1/trade-ideas', headers=headers)
print(response.json())`,
        curl: `curl -X GET "http://localhost:5000/api/v1/trade-ideas" \\
     -H "x-api-key: YOUR_API_KEY"`
    };

    const useCases = [
        {
            title: 'Automated Trading Bot',
            icon: <Zap size={18} />,
            desc: 'Fetch active trade ideas every minute and execute them via your broker API.',
            code: `import time
import requests

API_KEY = "YOUR_KEY"
URL = "http://localhost:5000/api/v1/trade-ideas"

def run_bot():
    while True:
        resp = requests.get(URL, headers={"x-api-key": API_KEY})
        if resp.status_code == 200:
            ideas = resp.json().get("data", [])
            for idea in ideas:
                print(f"Executing {idea['ticker']} {idea['type']}...")
        elif resp.status_code == 402:
            print("Credits exhausted!")
            break
        time.sleep(60)`
        },
        {
            title: 'Real-time Alerts (Slack/Discord)',
            icon: <Globe size={18} />,
            desc: 'Bridge liquide signals to your team communication channels.',
            code: `const axios = require('axios');

async function checkSignals() {
  const { data } = await axios.get('.../trade-ideas', {
    headers: { 'x-api-key': 'YOUR_KEY' }
  });
  
  if (data.data.length > 0) {
    await axios.post(WEBHOOK_URL, {
      text: \`New Signal: \${data.data[0].ticker}\`
    });
  }
}`
        }
    ];

    return (
        <div className="bg-[#0B0D11] min-h-screen text-white font-sans selection:bg-orange-500/30">
            <Navbar />

            <main className="max-w-6xl mx-auto px-6 py-20">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs font-bold border border-orange-500/20 mb-6 uppercase tracking-widest">
                        <Zap size={14} /> Developer API
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent italic">
                        BUILD WITH liquide
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl leading-relaxed">
                        Integrate liquide's real-time trade signals directly into your trading bots and platforms with our high-performance REST API.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Sidebar / Overview */}
                    <div className="space-y-8">
                        <div className="p-6 bg-white/[0.03] border border-white/10 rounded-3xl hover:border-orange-500/30 transition-colors">
                            <h3 className="flex items-center gap-2 font-bold mb-4 text-orange-400">
                                <Shield size={18} /> Authentication
                            </h3>
                            <p className="text-sm text-gray-400 mb-4">
                                Use the <code className="text-white bg-white/10 px-1.5 py-0.5 rounded font-mono">x-api-key</code> header for all requests. Generate keys in the Admin Dashboard.
                            </p>
                        </div>

                        <div className="p-6 bg-white/[0.03] border border-white/10 rounded-3xl">
                            <h3 className="flex items-center gap-2 font-bold mb-4 text-orange-400">
                                <Zap size={18} /> Credits & Billing
                            </h3>
                            <p className="text-sm text-gray-400 mb-2 leading-relaxed">
                                Each request deducts <span className="text-white font-bold">1 Credit</span>. If your balance hits zero, the API returns:
                            </p>
                            <code className="text-[10px] bg-black p-3 rounded-xl block border border-red-500/20 font-mono text-red-400">
                                402 Payment Required
                            </code>
                        </div>

                        <div className="p-6 bg-white/[0.03] border border-white/10 rounded-3xl">
                            <h3 className="flex items-center gap-2 font-bold mb-4 text-orange-400">
                                <Globe size={18} /> Base URL
                            </h3>
                            <code className="text-xs bg-black p-3 rounded-xl block border border-white/5 font-mono text-gray-300">
                                http://localhost:5000
                            </code>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-20">
                        {/* Use Cases Section */}
                        <section>
                            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                                <Code className="text-orange-500" /> Use Cases
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {useCases.map((uc, i) => (
                                    <div key={i} className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl group hover:bg-white/[0.04] transition-all">
                                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 mb-4 group-hover:scale-110 transition-transform">
                                            {uc.icon}
                                        </div>
                                        <h4 className="font-bold mb-2">{uc.title}</h4>
                                        <p className="text-sm text-gray-500 mb-6 leading-relaxed">{uc.desc}</p>
                                        <div className="bg-black/50 p-4 rounded-2xl border border-white/5">
                                            <pre className="text-[10px] font-mono text-gray-400 overflow-x-auto whitespace-pre-wrap">
                                                {uc.code}
                                            </pre>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Endpoints */}
                        {endpoints.map((ep, i) => (
                            <section key={i} className="space-y-6 pt-10 border-t border-white/5">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                    <Terminal className="text-orange-500" /> API Reference
                                </h2>
                                <div className="flex items-center gap-4">
                                    <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-black rounded-lg border border-green-500/20 uppercase tracking-tighter">{ep.method}</span>
                                    <code className="text-lg font-bold text-gray-200">{ep.path}</code>
                                </div>
                                <p className="text-gray-400 text-sm">{ep.desc}</p>

                                <div className="bg-[#050505] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                                    <div className="flex bg-white/5 border-b border-white/10 p-2 gap-2">
                                        {['js', 'python', 'curl'].map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setActiveTab(t)}
                                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeTab === t ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20' : 'text-gray-500 hover:text-white'}`}
                                            >
                                                {t === 'js' ? 'JavaScript' : t.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="p-6 relative group">
                                        <pre className="font-mono text-[11px] text-orange-200/80 leading-relaxed overflow-x-auto">
                                            {codeExamples[activeTab]}
                                        </pre>
                                        <button
                                            onClick={() => copyToClipboard(codeExamples[activeTab], 'code')}
                                            className="absolute top-4 right-4 p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/15 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            {copied === 'code' ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <h4 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <ChevronRight size={14} className="text-orange-500" /> Query Parameters
                                    </h4>
                                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="border-b border-white/5 text-gray-600 text-[10px] uppercase tracking-widest font-black">
                                                <tr>
                                                    <th className="text-left p-4">Parameter</th>
                                                    <th className="text-left p-4">Type</th>
                                                    <th className="text-left p-4">Description</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {ep.params.map((p, j) => (
                                                    <tr key={j} className="hover:bg-white/[0.01] transition-colors">
                                                        <td className="p-4 font-mono text-orange-400/80 text-xs">{p.name}</td>
                                                        <td className="p-4 text-gray-600 text-xs">{p.type}</td>
                                                        <td className="p-4 text-gray-400 text-xs">{p.desc}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </section>
                        ))}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ApiDocs;
