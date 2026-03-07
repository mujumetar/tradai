import { useState } from "react";
import axios from "axios";
import { Loader2, CheckCircle } from "lucide-react";

const LeadForm = ({ source = "direct" }) => {
    const [formData, setFormData] = useState({ name: "", email: "", mobile: "" });
    const [status, setStatus] = useState("idle"); // idle, loading, success, error
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("loading");
        setError("");

        try {
            await axios.post("/api/leads", { ...formData, source });
            setStatus("success");
            setFormData({ name: "", email: "", mobile: "" });
        } catch (err) {
            setStatus("error");
            setError(err.response?.data?.error || "Failed to submit. Please try again.");
        }
    };

    if (status === "success") {
        return (
            <div className="bg-white/5 border border-green-500/20 p-8 rounded-3xl text-center">
                <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
                <h3 className="text-2xl font-bold mb-2">Thank You!</h3>
                <p className="text-gray-400">Our experts will get in touch with you shortly.</p>
                <button
                    onClick={() => setStatus("idle")}
                    className="mt-6 text-accent-orange font-bold underline"
                >
                    Submit another request
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <input
                    type="text"
                    placeholder="Your Name"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-accent-orange transition-colors"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
            </div>
            <div>
                <input
                    type="email"
                    placeholder="Email Address (Optional)"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-accent-orange transition-colors"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
            </div>
            <div>
                <input
                    type="tel"
                    placeholder="Mobile Number"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-accent-orange transition-colors"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                />
            </div>
            {error && <p className="text-red-500 text-sm px-2">{error}</p>}
            <button
                type="submit"
                disabled={status === "loading"}
                className="w-full bg-accent-gradient text-black font-bold py-4 rounded-2xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
                {status === "loading" ? <Loader2 className="animate-spin" /> : "Request a Callback"}
            </button>
        </form>
    );
};

export default LeadForm;
