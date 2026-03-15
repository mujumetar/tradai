import React, { useState, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import NotFound from "./NotFound";

const SuperAdminDashboard = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [inputBuffer, setInputBuffer] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const PASSPHRASE = "godmode";

  // --- MOBILE STEALTH STATES ---
  const [tapCount, setTapCount] = useState(0);
  const [showMobileInput, setShowMobileInput] = useState(false);
  const [mobilePass, setMobilePass] = useState("");
  const [tapTimer, setTapTimer] = useState(null);

  const [uiConfig, setUiConfig] = useState({
    SIDEBAR_LINKS: [],
    FOOTER_LINKS: [],
    ROLE_ROUTES_ADMIN: [],
    ROLE_ROUTES_MANAGER: [],
    ROLE_ROUTES_SUPPORT: [],
    MASTER_PUBLIC_ROUTES: [
      { id: "home", name: "Home", href: "/" },
      { id: "blogs", name: "Blogs", href: "/blogs" },
      { id: "ideas", name: "Trade Ideas", href: "/ideas" },
      { id: "one", name: "TRADAI One", href: "/liquide-one" },
      { id: "pricing", name: "Pricing", href: "/pricing" },
      { id: "research", name: "Research", href: "/research" },
      { id: "about", name: "About", href: "/about" },
    ],
    MASTER_ADMIN_MODULES: [
      { id: "analytics", name: "Analytics" },
      { id: "users", name: "Users" },
      { id: "blogs", name: "Blogs" },
      { id: "trade-ideas", name: "Trade Ideas" },
      { id: "support", name: "Support" },
      { id: "emails", name: "Emails" },
      { id: "logs", name: "Logs" },
      { id: "payments", name: "Payments" },
      { id: "api-keys", name: "API Keys" },
      { id: "push", name: "Push" },
      { id: "devices", name: "Devices" },
      { id: "settings", name: "Settings" }
    ]
  });
  const [stats, setStats] = useState({
    totalUsers: 0,
    bannedUsers: 0,
    activeSessions: 0,
    systemHealth: "CALCULATING...",
    founderEmail: "..."
  });
  const [loadingConfig, setLoadingConfig] = useState(false);

  useEffect(() => {
    if (isUnlocked) {
      fetchUiConfig();
      fetchStats();
    }
  }, [isUnlocked]);

  const fetchStats = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user?.token;
      
      if (!token) {
        console.warn("GOD_MODE: No active session token found. God Panel requires a valid login first.");
        return;
      }

      const res = await fetch("http://localhost:5000/api/_cmd-hq-00x/stats", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) { console.error(e); }
  };

  const fetchUiConfig = async () => {
    setLoadingConfig(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user?.token;

      if (!token) {
        setLoadingConfig(false);
        return;
      }

      const res = await fetch("http://localhost:5000/api/_cmd-hq-00x/ui-config", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUiConfig(prev => ({ ...prev, ...data }));
      }
    } catch (e) {
      console.error("Failed to fetch UI config", e);
    }
    setLoadingConfig(false);
  };

  const saveUiConfig = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('user'))?.token || "";
      const res = await fetch("http://localhost:5000/api/_cmd-hq-00x/ui-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(uiConfig)
      });
      if (res.ok) {
        alert("UI Configuration saved to Identity Matrix.");
      } else {
        alert("Failed to save config.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleKillSwitch = async () => {
    const newState = !stats.maintenanceMode;
    if (!window.confirm(`Are you sure you want to ${newState ? 'ENGAGE' : 'DISENGAGE'} the System Kill Switch? This will block all API traffic for standard users.`)) return;
    
    try {
      const token = JSON.parse(localStorage.getItem('user'))?.token || "";
      const res = await fetch("http://localhost:5000/api/_cmd-hq-00x/kill-switch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ enabled: newState })
      });
      if (res.ok) {
        setStats(prev => ({ ...prev, maintenanceMode: newState, systemHealth: newState ? "LOCKDOWN" : "OPTIMAL" }));
        alert(`System Kill Switch is now ${newState ? 'ACTIVE' : 'OFF'}.`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const [logs, setLogs] = useState([]);
  const fetchLogs = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('user'))?.token || "";
      const res = await fetch("http://localhost:5000/api/admin/logs", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) { console.error(e); }
  };

  const executeGodCommand = async (endpoint, body) => {
    try {
      const token = JSON.parse(localStorage.getItem('user'))?.token || "";
      const res = await fetch(`http://localhost:5000/api/_cmd-hq-00x/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Protocol executed successfully.");
        if (data.token) {
           // If ghost token received, open in new tab and save to a temporary location or similar
           console.log("GHOST TOKEN RECEIVED:", data.token);
           window.open(`/?ghost_token=${data.token}`, '_blank');
        }
      } else {
        alert(data.error || data.message || "Command failed.");
      }
    } catch (e) { console.error(e); alert("Network interference detected."); }
  };

  useEffect(() => {
    if (activeTab === "overseer") {
      fetchLogs();
    }
  }, [activeTab]);

  const updateRoutes = (roleKey, routeName) => {
    setUiConfig(prev => {
      const current = prev[roleKey] || [];
      const updated = current.includes(routeName)
        ? current.filter(r => r !== routeName)
        : [...current, routeName];
      return { ...prev, [roleKey]: updated };
    });
  };

  const updatePublicLinks = (type, route) => {
    setUiConfig(prev => {
      if (type === 'sidebar') {
        const current = prev.SIDEBAR_LINKS || [];
        const exists = current.find(r => r.name === route.name);
        if (exists) {
          return { ...prev, SIDEBAR_LINKS: current.filter(r => r.name !== route.name) };
        } else {
          return { ...prev, SIDEBAR_LINKS: [...current, { name: route.name, href: route.href }] };
        }
      } else {
        const current = prev.FOOTER_LINKS || [];
        const exists = current.find(r => r.name === route.name);
        if (exists) {
          return { ...prev, FOOTER_LINKS: current.filter(r => r.name !== route.name) };
        } else {
          return { ...prev, FOOTER_LINKS: [...current, { name: route.name, href: route.href }] };
        }
      }
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      // ONLY ENABLE ON PC/DESKTOP (Non-touch/Keyboard focus)
      if (window.innerWidth <= 768) return; 
      
      // Ignore keypresses if already unlocked or typing in an input field
      if (isUnlocked || e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      const key = e.key.toLowerCase();
      
      if (key.length === 1) {
        setInputBuffer((prev) => {
          const newBuffer = (prev + key).slice(-PASSPHRASE.length);
          if (newBuffer === PASSPHRASE) {
            const userRaw = localStorage.getItem('user');
            const user = JSON.parse(userRaw || '{}');
            console.log("GOD_MODE_ATEMPT_RAW:", userRaw);
            const userRole = String(user?.role || '').toUpperCase().trim();
            const userEmail = String(user?.email || '').toLowerCase().trim();
            const FOUNDER_EMAIL = "muzammilmetar82@gmail.com";
            
            console.log("GOD_MODE_ATEMPT_PARSED:", { role: userRole, email: userEmail });
            
            // SUPREME ACCESS: If the passphrase is correct AND they are the founder OR super_admin
            if (userRole === 'SUPER_ADMIN' || userEmail === FOUNDER_EMAIL.toLowerCase()) {
              setIsUnlocked(true);
              console.log("GOD_MODE_UNLOCKED");
            } else {
              alert("CRITICAL CLEARANCE REQUIRED");
            }
            return ""; 
          }
          return newBuffer;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isUnlocked]);

  const handleTap = () => {
    // STRICTLY MOBILE GESTURE
    const isMobile = window.innerWidth <= 768 || ('ontouchstart' in window);
    if (!isMobile) return;

    if (tapTimer) clearTimeout(tapTimer);
    
    const newCount = tapCount + 1;
    setTapCount(newCount);

    if (newCount >= 3) {
      setShowMobileInput(true);
      setTapCount(0);
    } else {
      setTapTimer(setTimeout(() => setTapCount(0), 1000));
    }
  };

  const handleMobileUnlock = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const userRole = String(user?.role || '').toUpperCase().trim();
    const userEmail = String(user?.email || '').toLowerCase().trim();
    const FOUNDER_EMAIL = "muzammilmetar82@gmail.com";
    
    console.log("MOBILE_GOD_MODE_ATEMPT:", { pass: mobilePass, role: userRole, email: userEmail });

    if (mobilePass.toLowerCase() === PASSPHRASE && (userRole === 'SUPER_ADMIN' || userEmail === FOUNDER_EMAIL.toLowerCase())) {
      setIsUnlocked(true);
      setShowMobileInput(false);
      console.log("MOBILE_GOD_MODE_UNLOCKED");
    } else {
      setMobilePass("");
      // Add a small shake or alert? Let's just reset for now to stay stealthy.
      setShowMobileInput(false);
    }
  };

  // --- STEALTH MODE ---
  // If not unlocked, render the standard NotFound component.
  // This makes the /father route look like a broken link to any unauthorized visitor.
  // The keyboard trigger 'godmode' remains active on this blank slate.
  if (!isUnlocked) {
    const isMobile = window.innerWidth <= 768 || ('ontouchstart' in window);
    return (
      <div onClick={isMobile ? handleTap : undefined} className="relative">
        <NotFound />
        
        {showMobileInput && (
          <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6" onClick={(e) => e.stopPropagation()}>
            <div className="w-full max-w-sm space-y-6">
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-white/20 font-black tracking-widest text-xs uppercase italic">// SECURE_TERMINAL_ACCESS //</h2>
              </div>
              
              <input 
                type="password" 
                autoFocus
                placeholder="PROCEED_WITH_CAUTION"
                value={mobilePass}
                onChange={(e) => setMobilePass(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleMobileUnlock()}
                className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-5 outline-none focus:border-red-500 transition-all text-white font-mono text-center tracking-widest"
              />
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowMobileInput(false)}
                  className="bg-white/5 text-gray-500 py-4 rounded-3xl font-bold uppercase text-[10px] tracking-widest hover:bg-white/10 transition-colors"
                >
                  Abort
                </button>
                <button 
                  onClick={handleMobileUnlock}
                  className="bg-white text-black py-4 rounded-3xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-colors"
                >
                  Authenticate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-10 border-b border-green-800 pb-4">
          <h1 className="text-4xl font-bold tracking-widest uppercase">
            &gt; SYSTEM_ROOT // God Mode
          </h1>
          <button 
            onClick={() => setIsUnlocked(false)}
            className="px-4 py-2 bg-red-900/30 text-red-500 border border-red-800 hover:bg-red-900/50 transition-colors"
          >
            LOCK TERMINAL
          </button>
        </header>

        <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6">
          <div className={`col-span-1 space-y-4 lg:block ${isSidebarOpen ? 'block' : 'hidden'}`}>
            <div className="border border-green-800 p-4 bg-green-950/20">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">// MODULES</h2>
                <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-red-500 font-bold">X</button>
              </div>
              <ul className="space-y-2">
                <li onClick={() => setActiveTab("dashboard")} className={`cursor-pointer hover:text-green-300 hover:bg-green-900/40 p-2 ${activeTab === 'dashboard' ? 'bg-green-900/40 text-green-300 border-l-2 border-green-500' : ''}`}>System Overview</li>
                <li onClick={() => setActiveTab("ghost")} className={`cursor-pointer hover:text-green-300 hover:bg-green-900/40 p-2 ${activeTab === 'ghost' ? 'bg-green-900/40 text-green-300 border-l-2 border-green-500' : ''}`}>Ghost Mode (Impersonation)</li>
                <li onClick={() => setActiveTab("nuke")} className={`cursor-pointer hover:text-green-300 hover:bg-green-900/40 p-2 ${activeTab === 'nuke' ? 'bg-green-900/40 text-green-300 border-l-2 border-green-500' : ''}`}>Session Nuker</li>
                <li onClick={() => setActiveTab("broadcast")} className={`cursor-pointer hover:text-green-300 hover:bg-green-900/40 p-2 ${activeTab === 'broadcast' ? 'bg-green-900/40 text-green-300 border-l-2 border-green-500' : ''}`}>Global Broadcast</li>
                <li onClick={() => setActiveTab("danger")} className={`cursor-pointer hover:text-green-300 hover:bg-green-900/40 p-2 ${activeTab === 'danger' ? 'bg-green-900/40 text-green-300 border-l-2 border-green-500' : ''}`}>Danger Zone (Wipes)</li>
                <li onClick={() => setActiveTab("overseer")} className={`cursor-pointer hover:text-green-300 hover:bg-green-900/40 p-2 ${activeTab === 'overseer' ? 'bg-green-900/40 text-green-300 border-l-2 border-green-500' : ''}`}>Admin Overseer</li>
                <li onClick={() => setActiveTab("shadowban")} className={`cursor-pointer hover:text-green-300 hover:bg-green-900/40 p-2 ${activeTab === 'shadowban' ? 'bg-green-900/40 text-green-300 border-l-2 border-green-500' : ''}`}>Shadowbanning</li>
                <li onClick={() => setActiveTab("sidebar")} className={`cursor-pointer hover:text-green-300 hover:bg-green-900/40 p-2 ${activeTab === 'sidebar' ? 'bg-green-900/40 text-green-300 border-l-2 border-green-500' : ''}`}>Role & Route Access Control</li>
                <li onClick={() => setActiveTab("links")} className={`cursor-pointer hover:text-green-300 hover:bg-green-900/40 p-2 ${activeTab === 'links' ? 'bg-green-900/40 text-green-300 border-l-2 border-green-500' : ''}`}>Sidebar & Footer Links</li>
              </ul>
            </div>
            
            <div className="border border-red-800 p-4 bg-red-950/20">
              <h2 className="text-xl font-bold mb-4 text-red-500">// CRITICAL</h2>
              <button 
                onClick={toggleKillSwitch}
                className={`w-full py-3 ${stats.maintenanceMode ? 'bg-red-500' : 'bg-red-800/30'} text-white font-bold hover:bg-red-600 uppercase tracking-widest ${stats.maintenanceMode ? 'animate-pulse' : ''}`}
              >
                {stats.maintenanceMode ? 'KILL SWITCH ACTIVE' : 'ENGAGE KILL SWITCH'}
              </button>
            </div>
          </div>

          {!isSidebarOpen && (
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden w-full mb-4 py-3 bg-green-900/20 text-green-400 border border-green-800 font-bold tracking-widest"
            >
              &gt; OPEN MODULE NAV _
            </button>
          )}

          <div className="col-span-3 border border-green-800 p-4 sm:p-6 bg-green-950/10 min-h-[500px] sm:min-h-[600px] flex flex-col">
             {/* Content Area */}
             <div className="flex-1">
                {activeTab === "dashboard" && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold border-b border-green-800 pb-2 mb-6 uppercase tracking-wider">&gt; SYSTEM OVERVIEW _</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                       <div className="border border-green-800 p-4 bg-black">
                         <p className="text-sm text-green-600/70 mb-1">TOTAL USERS</p>
                         <p className="text-3xl font-bold">{stats.totalUsers}</p>
                       </div>
                       <div className="border border-green-800 p-4 bg-black">
                         <p className="text-sm text-green-600/70 mb-1">BANNED ENTITIES</p>
                         <p className="text-3xl font-bold text-red-500">{stats.bannedUsers}</p>
                       </div>
                       <div className="border border-green-800 p-4 bg-black">
                         <p className="text-sm text-green-600/70 mb-1">ACTIVE SESSIONS</p>
                         <p className="text-3xl font-bold">{stats.activeSessions}</p>
                       </div>
                       <div className="border border-green-800 p-4 bg-black">
                         <p className="text-sm text-green-600/70 mb-1">SYSTEM HEALTH</p>
                         <p className={`text-3xl font-bold ${stats.systemHealth === 'OPTIMAL' ? 'text-green-400' : 'text-yellow-400'}`}>{stats.systemHealth}</p>
                       </div>
                    </div>
                    <div className="border border-green-800/50 p-6 bg-green-950/20">
                      <h3 className="text-lg font-bold text-green-400 mb-4">Founder Account Protection</h3>
                      <p className="text-green-500/80 mb-2">Hardcoded Identity Matrix: <span className="text-green-300 bg-black px-2 py-1">{stats.founderEmail}</span></p>
                      <p className="text-green-600/70 text-sm">This account is permanently shielded from deletion, demotion, and shadowbanning. All PUT/DELETE requests targeting this identity will be instantly rejected by the core server with a 403 Forbidden protocol.</p>
                    </div>
                  </div>
                )}
                {activeTab === "ghost" && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold border-b border-green-800 pb-2 mb-6 uppercase tracking-wider">&gt; GHOST MODE _</h2>
                    <p className="text-green-600/80 max-w-2xl mb-8">
                      Instantly hijack any user session. Enter target email below to generate a ghost authorization token. You will assume their identity across the entire platform.
                    </p>
                    
                     <div className="flex space-x-4 max-w-xl">
                      <input 
                        type="email" 
                        id="ghostEmail"
                        placeholder="target_user@email.com" 
                        className="flex-1 bg-black border border-green-800 text-green-500 px-4 py-3 focus:outline-none focus:border-green-400 placeholder-green-800/50"
                      />
                      <button 
                        onClick={() => executeGodCommand('ghost', { email: document.getElementById('ghostEmail').value })}
                        className="px-6 py-3 bg-green-900/40 text-green-400 border border-green-600 hover:bg-green-800 hover:text-white transition-colors font-bold tracking-wider"
                      >
                        IMPERSONATE
                      </button>
                    </div>
                  </div>
                )}
                {activeTab === "danger" && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold border-b border-red-800 pb-2 mb-6 uppercase tracking-wider text-red-500">&gt; THE DANGER ZONE _</h2>
                     <p className="text-red-400/80 max-w-2xl mb-8">
                      WARNING: These actions are irreversible. They bypass soft-deletes and obliterate data directly from the system architecture.
                    </p>

                    <div className="space-y-8">
                       <div className="border border-red-800 p-4 bg-red-950/20">
                          <h3 className="text-xl font-bold text-red-400 mb-2">TARGET OBLITERATION</h3>
                          <p className="text-sm text-red-500/70 mb-4">Hard-delete a user and ALL associated relational data (Trades, Logs, Tickets, Devices).</p>
                           <div className="flex space-x-4 max-w-xl">
                            <input 
                              type="email" 
                              id="purgeEmail"
                              placeholder="target_user@email.com" 
                              className="flex-1 bg-black border border-red-800 text-red-500 px-4 py-2 focus:outline-none focus:border-red-400 placeholder-red-800/50"
                            />
                            <button 
                              onClick={() => {
                                if(window.confirm("ARE YOU SURE? This will permanently delete this user from ALL tables.")) {
                                  executeGodCommand('purge-user', { email: document.getElementById('purgeEmail').value });
                                }
                              }}
                              className="px-6 py-2 bg-red-900/40 text-red-400 border border-red-600 hover:bg-red-800 hover:text-white transition-colors font-bold tracking-wider"
                            >
                              PURGE USER
                            </button>
                          </div>
                       </div>
                       
                       <div className="border border-red-800 p-4 bg-red-950/20 space-y-4">
                          <h3 className="text-xl font-bold text-red-400">TABLE WIPES</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button onClick={() => executeGodCommand('wipe-logs', {})} className="p-4 border border-red-800/50 hover:bg-red-900/40 text-left text-red-500 group transition-colors">
                              <span className="block font-bold">WIPE SYSTEM LOGS</span>
                              <span className="text-xs text-red-700 group-hover:text-red-400">Drops entire log collection</span>
                            </button>
                             <button onClick={() => alert("Deployment of device-reset protocols not yet fully mapped.")} className="p-4 border border-red-800/50 hover:bg-red-900/40 text-left text-red-500 group transition-colors">
                              <span className="block font-bold">PURGE BANNED DEVICES</span>
                              <span className="text-xs text-red-700 group-hover:text-red-400">Resets all device blocks</span>
                            </button>
                             <button onClick={() => alert("Safety protocols preventing global API key revocation via this module.")} className="p-4 border border-red-800/50 hover:bg-red-900/40 text-left text-red-500 group transition-colors">
                              <span className="block font-bold">REVOKE ALL API KEYS</span>
                              <span className="text-xs text-red-700 group-hover:text-red-400">Instantly kills all third-party integrations</span>
                            </button>
                          </div>
                       </div>
                    </div>
                  </div>
                )}
                {activeTab === "nuke" && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold border-b border-green-800 pb-2 mb-6 uppercase tracking-wider text-green-400">&gt; ORBITAL STRIKE (SESSION NUKER) _</h2>
                    <p className="text-green-600/80 max-w-2xl mb-8">
                      Instantly incinerate active JSON Web Tokens. Forces immediate logout.
                    </p>

                    <div className="space-y-8">
                       <div className="border border-green-800 p-4 bg-green-950/20">
                          <h3 className="text-xl font-bold text-green-400 mb-2">TARGETED STRIKE</h3>
                          <div className="flex space-x-4 max-w-xl">
                            <input 
                              type="email" 
                              id="nukeEmail"
                              placeholder="target_user@email.com" 
                              className="flex-1 bg-black border border-green-800 text-green-500 px-4 py-2 focus:outline-none focus:border-green-400 placeholder-green-800/50"
                            />
                            <button 
                              onClick={() => executeGodCommand('nuke-session', { email: document.getElementById('nukeEmail').value })}
                              className="px-6 py-2 bg-green-900/40 text-green-400 border border-green-600 hover:bg-green-800 hover:text-white transition-colors font-bold tracking-wider"
                            >
                              NUKE SESSION
                            </button>
                          </div>
                       </div>

                       <div className="border border-red-800 p-4 bg-red-950/20">
                          <h3 className="text-xl font-bold text-red-500 mb-2 animate-pulse">GLOBAL EXTINCTION EVENT</h3>
                          <p className="text-red-400/80 mb-4">Destroy ALL active sessions across the entire platform.</p>
                          <button 
                            onClick={() => {
                              if(window.confirm("ARE YOU ABSOLUTELY SURE? You will log out EVERYONE including yourself.")) {
                                executeGodCommand('global-nuke', {});
                              }
                            }}
                            className="w-full py-4 bg-red-900/40 text-red-500 border border-red-600 hover:bg-red-800 hover:text-white transition-colors font-bold tracking-widest text-lg"
                          >
                            INITIATE GLOBAL NUKE
                          </button>
                       </div>
                    </div>
                  </div>
                )}
                {activeTab === "broadcast" && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold border-b border-blue-800 pb-2 mb-6 uppercase tracking-wider text-blue-400">&gt; GLOBAL BROADCAST _</h2>
                    <p className="text-blue-400/80 max-w-2xl mb-8">
                      Push an un-dismissible, full-screen takeover alert to all connected active clients instantly.
                    </p>

                     <div className="space-y-4">
                      <div>
                        <label className="block text-blue-500 font-bold mb-2">MESSAGE HEADLINE</label>
                        <input 
                          type="text" 
                          id="b_title"
                          placeholder="SYSTEM MAINTENANCE ALERT" 
                          className="w-full bg-black border border-blue-800 text-blue-400 px-4 py-2 focus:outline-none focus:border-blue-400 placeholder-blue-800/50"
                        />
                      </div>
                      <div>
                        <label className="block text-blue-500 font-bold mb-2">CRITICAL PAYLOAD (BODY)</label>
                        <textarea 
                          id="b_msg"
                          rows="4"
                          placeholder="The system is going down for emergency maintenance in 5 minutes. Save your work." 
                          className="w-full bg-black border border-blue-800 text-blue-400 px-4 py-2 focus:outline-none focus:border-blue-400 placeholder-blue-800/50"
                        />
                      </div>
                      <button 
                        onClick={() => executeGodCommand('broadcast', { title: document.getElementById('b_title').value, message: document.getElementById('b_msg').value })}
                        className="px-8 py-4 bg-blue-900/40 text-blue-400 border border-blue-600 hover:bg-blue-800 hover:text-white transition-colors font-bold tracking-widest w-full mt-4"
                      >
                        TRANSMIT NOW
                      </button>
                    </div>
                  </div>
                )}
                {activeTab === "overseer" && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold border-b border-purple-800 pb-2 mb-6 uppercase tracking-wider text-purple-400">&gt; PANOPTICON (ADMIN OVERSEER) _</h2>
                    <p className="text-purple-400/80 max-w-2xl mb-8">
                      View an unfiltered, undeletable audit log of every action taken by every Admin, Manager, and Support staff member.
                    </p>
                    <div className="border border-purple-800/50 p-4 bg-black/50 overflow-x-auto">
                      <table className="w-full text-left text-sm text-purple-400/80">
                         <thead className="text-purple-500 border-b border-purple-800/50">
                           <tr>
                              <th className="py-2">TIMESTAMP</th>
                              <th className="py-2">ADMIN_USER</th>
                              <th className="py-2">ACTION_TYPE</th>
                              <th className="py-2">TARGET</th>
                              <th className="py-2">PAYLOAD</th>
                           </tr>
                         </thead>
                         <tbody>
                           {logs.map((log, idx) => (
                             <tr key={idx} className="border-b border-purple-900/30">
                               <td className="py-2">{new Date(log.timestamp).toLocaleString()}</td>
                               <td className="py-2 font-bold">{log.userId?.email || 'SYSTEM'}</td>
                               <td className="py-2">
                                 <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                   log.method === 'DELETE' ? 'bg-red-900/40 text-red-400' : 
                                   log.method === 'POST' ? 'bg-blue-900/40 text-blue-400' : 
                                   log.method === 'PUT' ? 'bg-yellow-900/40 text-yellow-400' :
                                   'bg-purple-900/40 text-purple-400'
                                 }`}>
                                   {log.method} {log.url}
                                 </span>
                               </td>
                               <td className="py-2 text-center">{log.statusCode}</td>
                               <td className="py-2 opacity-50 text-[10px] truncate max-w-[200px]">{JSON.stringify(log.payload)}</td>
                             </tr>
                           ))}
                           {logs.length === 0 && (
                             <tr><td colSpan="5" className="py-8 text-center opacity-30 italic font-mono uppercase tracking-widest text-xs">No administrative signals detected...</td></tr>
                           )}
                         </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {activeTab === "shadowban" && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold border-b border-gray-700 pb-2 mb-6 uppercase tracking-wider text-gray-400">&gt; THE VOID (SHADOWBANNING) _</h2>
                    <p className="text-gray-500 max-w-2xl mb-8">
                      Silently drop all write-requests from a user. They will appear successful to the user, but the database will drop them.
                    </p>
                    <div className="border border-gray-800 p-4 bg-gray-900/20">
                        <div className="flex space-x-4 max-w-xl">
                          <input 
                            type="email" 
                            placeholder="target_user@email.com" 
                            className="flex-1 bg-black border border-gray-800 text-gray-400 px-4 py-2 focus:outline-none focus:border-gray-500 placeholder-gray-800/50"
                          />
                          <button className="px-6 py-2 bg-gray-800/40 text-gray-300 border border-gray-600 hover:bg-gray-700 hover:text-white transition-colors font-bold tracking-wider">
                            CAST INTO VOID
                          </button>
                        </div>
                    </div>
                  </div>
                )}
                {activeTab === "sidebar" && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold border-b border-yellow-800 pb-2 mb-6 uppercase tracking-wider text-yellow-500">&gt; ADMINISTRATIVE CLEARANCE (ADMIN MODULES) _</h2>
                    <p className="text-yellow-500/80 max-w-2xl mb-8">
                      Control which internal tabs are visible in the **Admin Dashboard** for each role. This does not affect the public site.
                    </p>
                    
                    {loadingConfig ? <p className="text-yellow-500 animate-pulse">Fetching matrices...</p> : (
                      <div className="space-y-6">
                        {['ADMIN', 'MANAGER', 'SUPPORT'].map(role => (
                          <div key={role} className="border border-yellow-800/50 p-4 sm:p-6 bg-yellow-950/10 mb-4 rounded-xl">
                             <h3 className="text-lg text-yellow-400 font-bold mb-4 flex items-center gap-2">
                               <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                               MODULE ACCESS: <span className="text-white bg-black px-2 py-1 border border-yellow-800/30 font-mono">{role}</span>
                             </h3>
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {uiConfig.MASTER_ADMIN_MODULES.map(module => (
                                  <label key={`${role}_${module.id}`} className="flex items-center space-x-3 cursor-pointer group hover:bg-yellow-900/10 p-2 rounded transition-colors">
                                    <input 
                                      type="checkbox" 
                                      checked={(uiConfig[`ROLE_ROUTES_${role}`] || []).includes(module.name)}
                                      onChange={() => updateRoutes(`ROLE_ROUTES_${role}`, module.name)}
                                      className="form-checkbox h-5 w-5 text-yellow-600 bg-black border-yellow-800 rounded focus:ring-yellow-500" 
                                    />
                                    <span className={`text-sm font-mono ${(uiConfig[`ROLE_ROUTES_${role}`] || []).includes(module.name) ? 'text-yellow-400 font-bold' : 'text-yellow-900 opacity-60'}`}>{module.name}</span>
                                  </label>
                                ))}
                             </div>
                          </div>
                        ))}

                        <div className="mt-8 border border-yellow-900/40 p-6 bg-black/40 rounded-xl">
                          <h3 className="text-xs font-bold text-gray-500 mb-4 font-mono">// ADD NEW ADMIN MODULE</h3>
                          <div className="flex gap-4">
                            <input id="adm_name" className="flex-1 bg-black border border-yellow-900 p-3 text-yellow-400 font-mono text-sm outline-none focus:border-yellow-500" placeholder="Module Label (e.g. Analytics)" />
                            <button 
                              onClick={() => {
                                const name = document.getElementById('adm_name').value;
                                if (name) {
                                  setUiConfig(p => ({
                                    ...p,
                                    MASTER_ADMIN_MODULES: [...p.MASTER_ADMIN_MODULES, { id: name.toLowerCase().replace(/\s+/g, '-'), name }]
                                  }));
                                  document.getElementById('adm_name').value = '';
                                }
                              }}
                              className="bg-yellow-900/40 text-yellow-400 border border-yellow-700 px-8 py-3 font-bold hover:bg-yellow-600 hover:text-black transition-all"
                            >
                              + ADD MODULE
                            </button>
                          </div>
                        </div>

                        <button 
                          onClick={saveUiConfig}
                          className="w-full mt-6 px-6 py-4 bg-yellow-900/60 text-yellow-300 border border-yellow-500 hover:bg-yellow-700 hover:text-white transition-all font-bold tracking-widest text-lg shadow-[0_0_20px_rgba(202,138,4,0.3)]"
                        >
                          PROPAGATE ACCESS MATRICES
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === "links" && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                      <div>
                        <h2 className="text-2xl font-bold border-b border-green-800 pb-2 mb-2 uppercase tracking-wider text-green-400">&gt; PUBLIC LAYOUT CONTROL _</h2>
                        <p className="text-green-600/60 text-xs font-mono">// VISUALLY ASSIGN ROUTES TO SIDEBAR & FOOTER</p>
                      </div>
                      <button 
                        onClick={saveUiConfig}
                        className="bg-green-600 hover:bg-green-500 text-black font-bold py-3 px-8 rounded-lg text-sm shadow-[0_0_20px_rgba(22,163,74,0.4)] transition-all w-full sm:w-auto"
                      >
                        SAVE LAYOUT
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Sidebar */}
                      <div className="border border-green-800/50 bg-green-950/10 p-5 rounded-xl">
                        <h3 className="text-lg font-bold mb-4 text-green-400 border-b border-green-900/50 pb-2">/ NAVBAR (SIDEBAR) LINKS</h3>
                        <div className="space-y-3">
                          {uiConfig.MASTER_PUBLIC_ROUTES.map(route => (
                            <label key={`SB_${route.id}`} className="flex items-center gap-3 cursor-pointer group hover:bg-green-900/20 p-2 rounded transition-colors">
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 accent-green-500"
                                checked={(uiConfig.SIDEBAR_LINKS || []).some(l => l.name === route.name)}
                                onChange={() => updatePublicLinks('sidebar', route)}
                              />
                              <div className="flex flex-col">
                                <span className="text-sm font-bold font-mono text-green-300">{route.name}</span>
                                <span className="text-[10px] text-gray-500 font-mono italic">{route.href}</span>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="border border-green-800/50 bg-green-950/10 p-5 rounded-xl">
                        <h3 className="text-lg font-bold mb-4 text-green-400 border-b border-green-900/50 pb-2">/ FOOTER LINKS</h3>
                        <div className="space-y-3">
                          {uiConfig.MASTER_PUBLIC_ROUTES.map(route => (
                            <label key={`FT_${route.id}`} className="flex items-center gap-3 cursor-pointer group hover:bg-green-900/20 p-2 rounded transition-colors">
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 accent-green-500"
                                checked={(uiConfig.FOOTER_LINKS || []).some(l => l.name === route.name)}
                                onChange={() => updatePublicLinks('footer', route)}
                              />
                              <div className="flex flex-col">
                                <span className="text-sm font-bold font-mono text-green-300">{route.name}</span>
                                <span className="text-[10px] text-gray-500 font-mono italic">{route.href}</span>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 border border-green-800 p-6 bg-black/40 rounded-xl">
                       <h3 className="text-sm font-bold text-gray-500 mb-4 font-mono tracking-tighter uppercase">// ADD TO MASTER PUBLIC ROUTE LIST</h3>
                       <div className="flex flex-col sm:flex-row gap-4">
                          <input id="m_name" className="flex-1 bg-black border border-green-900 p-3 text-green-400 font-mono text-sm outline-none focus:border-green-500" placeholder="LABEL (e.g. Help)" />
                          <input id="m_path" className="flex-1 bg-black border border-green-900 p-3 text-green-400 font-mono text-sm outline-none focus:border-green-500" placeholder="PATH (e.g. /help)" />
                          <button 
                            onClick={() => {
                              const name = document.getElementById('m_name').value;
                              const href = document.getElementById('m_path').value;
                              if (name && href) {
                                setUiConfig(p => ({
                                  ...p,
                                  MASTER_PUBLIC_ROUTES: [...p.MASTER_PUBLIC_ROUTES, { id: Date.now().toString(), name, href }]
                                }));
                                document.getElementById('m_name').value = '';
                                document.getElementById('m_path').value = '';
                              }
                            }}
                            className="bg-green-900/40 text-green-400 border border-green-700 px-8 py-3 font-bold hover:bg-green-600 hover:text-black transition-all"
                          >
                            + ADD PUBLIC ROUTE
                          </button>
                       </div>
                    </div>
                  </div>
                )}
                {activeTab !== "dashboard" && activeTab !== "ghost" && activeTab !== "danger" && activeTab !== "nuke" && activeTab !== "broadcast" && activeTab !== "overseer" && activeTab !== "shadowban" && activeTab !== "sidebar" && activeTab !== "links" && (
                   <div className="text-green-600/50">
                     <p>&gt; Module '{activeTab}' selected.</p>
                     <p>&gt; Awaiting deployment...</p>
                   </div>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
