import { useState, useEffect } from "react";
import { MessageSquare, Send, PhoneCall, AlertCircle } from "lucide-react";
import Navbar from "../components/Navbar";
import api from "../utils/api";

const Support = () => {
    const [tickets, setTickets] = useState([]);
    const [openTicket, setOpenTicket] = useState(null); // ticket ID if viewing thread
    const [ticketDetails, setTicketDetails] = useState(null); // full thread data

    // Form state
    const [subject, setSubject] = useState("");
    const [category, setCategory] = useState("general");
    const [description, setDescription] = useState("");
    const [callback, setCallback] = useState(false);
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);

    // Reply form
    const [replyBody, setReplyBody] = useState("");

    const user = JSON.parse(localStorage.getItem("user"));

    const fetchMyTickets = async () => {
        if (!user) return;
        try {
            const { data } = await api.get('/tickets/my');
            setTickets(data);
        } catch (err) { console.error(err); }
    };

    const fetchTicketDetails = async (id) => {
        try {
            const { data } = await api.get(`/tickets/${id}`);
            setTicketDetails(data);
            setOpenTicket(id);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { fetchMyTickets(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/tickets', {
                subject, category, description,
                callbackRequested: callback, callbackPhone: phone
            });
            setSubject(""); setDescription(""); setCallback(false); setPhone("");
            fetchMyTickets();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to submit ticket");
        } finally {
            setLoading(false);
        }
    };

    const handleReply = async (e) => {
        e.preventDefault();
        if (!replyBody.trim()) return;
        try {
            await api.post(`/tickets/${openTicket}/reply`, { body: replyBody });
            setReplyBody("");
            fetchTicketDetails(openTicket); // refresh thread
        } catch (err) { alert("Failed to send reply"); }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-black text-white pt-24 px-6 flex flex-col items-center">
                <Navbar />
                <h1 className="text-3xl font-bold mt-20 mb-4">Support Center</h1>
                <p className="text-gray-400">Please login to submit a support ticket.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white pt-24 px-4 sm:px-6">
            <Navbar />
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">

                {/* Left Column: Create Ticket Form */}
                <div className="lg:col-span-1 border border-white/10 rounded-2xl p-6 bg-white/[0.02]">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <MessageSquare className="text-accent-orange" /> Open a Ticket
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-accent-orange">
                                <option value="general">General Inquiry</option>
                                <option value="billing">Billing & Payments</option>
                                <option value="technical">Technical Support</option>
                                <option value="subscription">Subscription Issues</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Subject</label>
                            <input required value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-accent-orange" placeholder="Brief summary of the issue" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                            <textarea required value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-accent-orange h-32 resize-none" placeholder="Provide as much detail as possible..." />
                        </div>

                        <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl mt-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={callback} onChange={e => setCallback(e.target.checked)} className="w-4 h-4 accent-accent-orange" />
                                <span className="text-sm font-medium flex items-center gap-2"><PhoneCall size={16} /> Request a callback</span>
                            </label>
                            {callback && (
                                <input required value={phone} onChange={e => setPhone(e.target.value)} type="tel" placeholder="Your phone number" className="w-full mt-3 bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-accent-orange" />
                            )}
                        </div>

                        <button disabled={loading} type="submit" className="w-full bg-accent-gradient text-black font-bold py-3 rounded-xl mt-4 hover:opacity-90">
                            {loading ? 'Submitting...' : 'Submit Ticket'}
                        </button>
                    </form>
                </div>

                {/* Right Column: Ticket List / Thread View */}
                <div className="lg:col-span-2">
                    {!openTicket ? (
                        <div>
                            <h2 className="text-xl font-bold mb-6">My Tickets</h2>
                            {tickets.length === 0 ? (
                                <div className="text-center p-12 border border-white/5 rounded-2xl bg-white/[0.01]">
                                    <AlertCircle className="mx-auto text-gray-600 mb-3" size={32} />
                                    <p className="text-gray-400">You don't have any support tickets yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {tickets.map(t => (
                                        <div key={t._id} onClick={() => fetchTicketDetails(t._id)} className="p-5 border border-white/10 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase
                                                        ${t.status === 'open' ? 'bg-orange-500/20 text-orange-400' :
                                                            t.status === 'in-progress' ? 'bg-blue-500/20 text-blue-400' :
                                                                t.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                                                                    'bg-gray-500/20 text-gray-400'}
                                                    `}>{t.status}</span>
                                                    <span className="text-xs text-gray-500 border border-white/10 px-2 py-0.5 rounded capitalize">{t.category}</span>
                                                    <span className="text-xs text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <h3 className="font-bold">{t.subject}</h3>
                                            </div>
                                            <div className="text-sm text-accent-orange font-semibold whitespace-nowrap">View Thread &rarr;</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : ticketDetails ? (
                        <div className="flex flex-col h-full border border-white/10 rounded-2xl bg-white/[0.02] overflow-hidden">
                            {/* Thread Header */}
                            <div className="p-5 border-b border-white/10 bg-black/50 flex items-center justify-between">
                                <div>
                                    <button onClick={() => setOpenTicket(null)} className="text-sm text-gray-400 hover:text-white mb-2">&larr; Back to tickets</button>
                                    <h2 className="text-xl font-bold">{ticketDetails.subject}</h2>
                                    <div className="flex gap-2 mt-2">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${ticketDetails.status === 'resolved' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>{ticketDetails.status}</span>
                                        <span className="text-xs text-gray-400">ID: {ticketDetails._id}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Messages List */}
                            <div className="flex-1 p-5 overflow-y-auto space-y-6 max-h-[500px]">
                                {ticketDetails.messages.map((m, i) => {
                                    const isStaff = ['admin', 'manager', 'support'].includes(m.senderRole);
                                    return (
                                        <div key={i} className={`flex flex-col ${isStaff ? 'items-start' : 'items-end'}`}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-gray-400">{isStaff ? 'liquide Support' : m.senderName}</span>
                                                <span className="text-xs text-gray-600">{new Date(m.createdAt).toLocaleTimeString()}</span>
                                            </div>
                                            <div className={`p-4 rounded-2xl max-w-[85%] text-sm
                                                ${isStaff ? 'bg-white/10 rounded-tl-none' : 'bg-accent-orange/20 text-orange-50 rounded-tr-none border border-accent-orange/30'}
                                            `}>
                                                {m.body.split('\n').map((line, j) => <p key={j} className="mb-1 last:mb-0">{line}</p>)}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Reply Input */}
                            {ticketDetails.status !== 'closed' && (
                                <form onSubmit={handleReply} className="p-4 border-t border-white/10 bg-black/50">
                                    <div className="flex gap-3">
                                        <textarea value={replyBody} onChange={e => setReplyBody(e.target.value)} placeholder="Type your reply..." className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-accent-orange h-12 min-h-12 max-h-32 resize-y" />
                                        <button type="submit" className="bg-accent-orange text-white w-12 h-12 rounded-xl flex items-center justify-center hover:bg-orange-600 transition-colors">
                                            <Send size={20} />
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default Support;
