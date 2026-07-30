import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="bg-[#fff7fa] text-[#1f1a1e] font-sans antialiased overflow-x-hidden min-h-screen flex flex-col">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#fff7fa]/80 glass-nav shadow-sm h-20">
        <nav className="flex justify-between items-center w-full px-8 h-full max-w-[1440px] mx-auto">
          <div className="flex items-center gap-8">
            <Link to="/" className="font-bold text-xl text-[#300033] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#300033]" style={{ fontVariationSettings: "'FILL' 1" }}>cloud_done</span>
              Plum.ai
            </Link>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link to="/dashboard" className="text-[#300033] border-b-2 border-[#300033] pb-1 transition-colors">Dashboard</Link>
              <Link to="/workspace/1/analytics" className="text-[#4f434c] hover:text-[#300033] transition-colors">Analytics</Link>
              <Link to="/workspace/1/inbox" className="text-[#4f434c] hover:text-[#300033] transition-colors">Inbox</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <button 
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2.5 bg-[#300033] text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-all shadow"
              >
                Go to Workspace
              </button>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold text-[#4f434c] hover:text-[#300033]">
                  Sign In
                </Link>
                <Link to="/register" className="px-5 py-2.5 bg-[#300033] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all shadow">
                  Start Building
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="pt-20 flex-1">
        {/* Hero Section */}
        <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden px-8 py-10 hero-glow">
          <div className="relative z-10 max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#4a154b] text-[#ffd6f8] text-xs font-semibold mb-8 border border-[#300033]/20">
              <span className="flex h-2 w-2 rounded-full bg-[#f6afef] animate-pulse"></span>
              Now in Beta: Enterprise Multi-Agent Workflows
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-[#300033] mb-6 leading-tight">
              Your Enterprise AI Agent, <br />
              <span className="text-[#be7db9]">Ready in Minutes.</span>
            </h1>
            <p className="text-lg text-[#4f434c] mb-10 max-w-2xl mx-auto leading-relaxed">
              Build, train, and deploy custom AI support without code. Seamlessly integrate your corporate knowledge base and scale intelligent customer interactions instantly.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => navigate(user ? '/dashboard' : '/register')}
                className="px-8 py-4 bg-[#300033] text-white rounded-xl font-semibold text-lg hover:scale-105 transition-all shadow-lg"
              >
                Start Building for Free
              </button>
              <button 
                onClick={() => navigate('/workspace/1/kb')}
                className="px-8 py-4 bg-[#fff7fa] border border-[#d2c2cd] text-[#300033] rounded-xl font-semibold text-lg hover:bg-[#f6ebf0] transition-colors"
              >
                Explore Agent Builder
              </button>
            </div>
          </div>
        </section>

        {/* Trusted By Section */}
        <section className="py-10 bg-[#fcf1f6]">
          <div className="max-w-[1440px] mx-auto px-8">
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-[#80737d] mb-8">Trusted by Global Enterprise Leaders</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8 opacity-60 grayscale hover:grayscale-0 transition-all text-[#300033]">
              <div className="flex justify-center items-center font-bold text-2xl tracking-wider">SYNERGY</div>
              <div className="flex justify-center items-center font-bold text-2xl tracking-wider">NEXUS</div>
              <div className="flex justify-center items-center font-bold text-2xl tracking-wider">STRATA</div>
              <div className="flex justify-center items-center font-bold text-2xl tracking-wider">VERTEX</div>
              <div className="flex justify-center items-center font-bold text-2xl tracking-wider">ORBIT</div>
            </div>
          </div>
        </section>

        {/* Feature Bento Grid */}
        <section className="py-16 max-w-[1440px] mx-auto px-8">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-[#300033] mb-3">Powerful from day one.</h2>
            <p className="text-lg text-[#4f434c] max-w-xl">Everything you need to automate complex support workflows with enterprise-grade security.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Large Feature Card */}
            <div className="md:col-span-8 bg-white rounded-xl p-8 border border-[#d2c2cd] bento-card relative overflow-hidden group">
              <div className="relative z-10">
                <div className="w-12 h-12 bg-[#4a154b] rounded-lg flex items-center justify-center text-white mb-6">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                </div>
                <h3 className="text-2xl font-bold text-[#300033] mb-4">No-code Agent Builder</h3>
                <p className="text-[#4f434c] max-w-md mb-8 leading-relaxed">Visual drag-and-drop interface to design complex logic, multi-step reasoning, and dynamic API integrations without writing a single line of code.</p>
              </div>
              <div className="absolute right-0 bottom-0 w-1/2 h-full opacity-10 group-hover:opacity-20 transition-opacity translate-x-12 translate-y-12">
                <span className="material-symbols-outlined text-[280px]">architecture</span>
              </div>
            </div>

            {/* Small Feature Card */}
            <div className="md:col-span-4 bg-[#f6ebf0] rounded-xl p-8 border border-[#d2c2cd] bento-card">
              <div className="w-12 h-12 bg-[#d6e0f6] rounded-lg flex items-center justify-center text-[#555f71] mb-6">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>monitoring</span>
              </div>
              <h3 className="text-2xl font-bold text-[#300033] mb-4">Real-time Analytics</h3>
              <p className="text-[#4f434c] leading-relaxed">Deep insights into agent performance, sentiment trends, and customer satisfaction scores in one unified dashboard.</p>
            </div>

            {/* Small Feature Card */}
            <div className="md:col-span-4 bg-[#f6ebf0] rounded-xl p-8 border border-[#d2c2cd] bento-card">
              <div className="w-12 h-12 bg-[#dbe9a5] rounded-lg flex items-center justify-center text-[#141a00] mb-6">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>database</span>
              </div>
              <h3 className="text-2xl font-bold text-[#300033] mb-4">Knowledge Base Sync</h3>
              <p className="text-[#4f434c] leading-relaxed">Connect your Notion, Google Drive, or Confluence. Plum.ai ingests and indexes documentation in seconds.</p>
            </div>

            {/* Wide Feature Card */}
            <div className="md:col-span-8 bg-[#eae0e5] rounded-xl p-8 border border-[#d2c2cd] bento-card flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1">
                <div className="w-12 h-12 bg-[#4a154b] rounded-lg flex items-center justify-center text-white mb-6">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
                </div>
                <h3 className="text-2xl font-bold text-[#300033] mb-4">Enterprise Security</h3>
                <p className="text-[#4f434c] leading-relaxed">SOC2 Type II compliant with dedicated VPC hosting options and PII redaction built-in as standard.</p>
              </div>
              <div className="flex-1 w-full h-48 bg-[#fcf1f6] rounded-lg border border-[#d2c2cd] overflow-hidden">
                <img 
                  className="w-full h-full object-cover" 
                  alt="Enterprise Cloud Security" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAK-XamLSUdezxR8Q54iDLK4y_INi0T2aP1ObptRAGlhjiP9LsquVK1yKqp2bldvQJTPJ0wXMMoioRKKAFmEl7kaLJL9Lmnlqiv5xIuGz0Oi0TeBOw4o-rBPjDYlK8VRBvNvL_eeyVku8-RP3FWuZEf2fPQ3jjDHKl0RJDz-6Un91vvd_29py7x9SB2zpYGRunCb2TnuEv-KESYwsptxPK_NeXa6L9WDFt3VHa7aHqIMsHUk6xaEkR5" 
                />
              </div>
            </div>
          </div>
        </section>

        {/* Visual Chat Widget Representation */}
        <section className="py-16 bg-[#fff7fa]">
          <div className="max-w-[1440px] mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-[#300033] mb-6">The human touch, <br />powered by AI.</h2>
              <p className="text-[#4f434c] text-lg mb-8 leading-relaxed">Deploy agents that actually sound like your brand. Customize voice, tone, and behavior to match your unique enterprise identity while providing instant resolution.</p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#be7db9]">check_circle</span>
                  <span className="text-base text-[#1f1a1e] font-medium">Sub-second response latency</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#be7db9]">check_circle</span>
                  <span className="text-base text-[#1f1a1e] font-medium">Multi-lingual support (50+ languages)</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#be7db9]">check_circle</span>
                  <span className="text-base text-[#1f1a1e] font-medium">Seamless human-in-the-loop handoff</span>
                </li>
              </ul>
            </div>

            <div className="relative">
              {/* Chat Widget UI Simulation */}
              <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-2xl border border-[#d2c2cd] overflow-hidden">
                <div className="bg-[#300033] p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#f6afef] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#300033] text-sm">smart_toy</span>
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">Plum Assistant</p>
                      <p className="text-[#ffd6f8] text-[10px] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span> Online
                      </p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-white text-sm cursor-pointer">close</span>
                </div>

                <div className="p-6 space-y-6 h-96 overflow-y-auto bg-[#fff7fa]">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#4a154b] text-white flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-xs">smart_toy</span>
                    </div>
                    <div className="bg-[#f0e5eb] p-3 rounded-2xl rounded-tl-none text-[#4f434c] text-sm leading-relaxed">
                      Hello! I'm your enterprise support agent. How can I assist you with your dashboard analytics today?
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end">
                    <div className="bg-[#300033] p-3 rounded-2xl rounded-tr-none text-white text-sm max-w-[80%] leading-relaxed">
                      Can you show me a summary of last month's ROI?
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#4a154b] text-white flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-xs">smart_toy</span>
                    </div>
                    <div className="bg-[#f0e5eb] p-3 rounded-2xl rounded-tl-none text-[#4f434c] text-sm leading-relaxed">
                      Certainly! Based on your 40% reduction in support tickets, your projected ROI for Q3 was $24,500. Would you like a detailed breakdown?
                      <div className="mt-3 p-2 bg-white rounded-lg border border-[#d2c2cd] flex items-center gap-2 cursor-pointer hover:bg-[#fcf1f6] transition">
                        <span className="material-symbols-outlined text-[#300033]">bar_chart</span>
                        <span className="text-xs font-bold text-[#300033]">Download Q3_Report.pdf</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-[#d2c2cd] bg-white flex gap-2">
                  <input 
                    type="text" 
                    className="flex-1 bg-[#fcf1f6] border-none rounded-lg text-sm px-3 py-2 outline-none focus:ring-1 focus:ring-[#300033]"
                    placeholder="Type a message..."
                  />
                  <button className="bg-[#300033] text-white p-2 rounded-lg hover:opacity-90 transition">
                    <span className="material-symbols-outlined text-sm">send</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 bg-[#300033] text-white relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-8 text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-8 leading-tight">
              Ready to transform your <br />enterprise support?
            </h2>
            <p className="text-[#ffd6f8] text-lg mb-10 max-w-xl mx-auto">
              Join hundreds of forward-thinking companies building the next generation of AI-driven customer experiences.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button 
                onClick={() => navigate('/register')}
                className="px-10 py-4 bg-white text-[#300033] rounded-full font-bold text-lg hover:scale-105 transition-all shadow-xl"
              >
                Start Building for Free
              </button>
              <button 
                onClick={() => navigate('/workspace/1/kb')}
                className="px-10 py-4 border-2 border-[#ffd6f8] text-[#ffd6f8] rounded-full font-bold text-lg hover:bg-[#4a154b] transition-colors"
              >
                Book a Demo
              </button>
            </div>
            <p className="mt-8 text-[#be7db9] text-xs font-medium">No credit card required. SOC2 Compliant.</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#d2c2cd]">
        <div className="flex flex-col md:flex-row justify-between items-center px-8 py-10 w-full max-w-[1440px] mx-auto text-sm">
          <div className="mb-6 md:mb-0">
            <Link to="/" className="font-bold text-lg text-[#300033] block mb-2">Plum.ai</Link>
            <p className="text-[#4f434c] text-xs max-w-xs">Building the future of enterprise intelligence, one agent at a time.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-8 mb-6 md:mb-0 text-[#4f434c]">
            <a href="#privacy" className="hover:text-[#300033] transition-colors">Privacy Policy</a>
            <a href="#terms" className="hover:text-[#300033] transition-colors">Terms of Service</a>
            <a href="#api" className="hover:text-[#300033] transition-colors">API Docs</a>
            <a href="#careers" className="hover:text-[#300033] transition-colors">Careers</a>
          </div>
          <div className="text-center md:text-right text-[#4f434c] text-xs">
            <p>© 2026 Plum.ai. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
