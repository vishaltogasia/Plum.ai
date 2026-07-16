import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Copy, Check, ExternalLink, Code2, Link as LinkIcon, MessageSquareCode } from 'lucide-react';

const DeployPage = () => {
  const { businessId } = useParams();
  
  const publicLink = `${window.location.origin}/chat/${businessId}`;
  const iframeCode = `<iframe src="${publicLink}" width="100%" height="600px" style="border: none; border-radius: 12px; box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);"></iframe>`;
  
  const scriptCode = `<script>
  window.PlumAgentConfig = {
    businessId: ${businessId},
    themeColor: '#8b5cf6',
    title: 'Customer Support'
  };
</script>
<script src="${window.location.origin}/static/widget.js" async></script>`;

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedIframe, setCopiedIframe] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else if (type === 'iframe') {
      setCopiedIframe(true);
      setTimeout(() => setCopiedIframe(false), 2000);
    } else if (type === 'script') {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Deploy & Sharing</h1>
        <p className="text-slate-400 text-sm mt-1">Integrate your AI support employee into your company website or share it publicly.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Share Link Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 md:col-span-3 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <LinkIcon size={18} className="text-brand-400" />
              Public Shareable Link
            </h2>
            <p className="text-slate-400 text-sm mb-4 leading-relaxed">Direct your customers to this standalone link for a fullscreen chat interface with the trained AI.</p>
            
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={publicLink}
                className="flex-1 bg-slate-900 border border-slate-800 focus:border-brand-500 text-slate-300 font-mono text-xs px-4 py-3 rounded-xl outline-none"
              />
              <button
                onClick={() => handleCopy(publicLink, 'link')}
                className="px-4 py-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition text-xs flex items-center gap-1.5 shadow-lg shadow-brand-500/10 shrink-0"
              >
                {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                {copiedLink ? 'Copied' : 'Copy'}
              </button>
              <a
                href={publicLink}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl transition text-xs flex items-center gap-1.5 shrink-0"
              >
                <ExternalLink size={14} />
                Open
              </a>
            </div>
          </div>
        </div>

        {/* IFrame Widget Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 md:col-span-3">
          <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <Code2 size={18} className="text-brand-400" />
            HTML iFrame Embed
          </h2>
          <p className="text-slate-400 text-sm mb-4 leading-relaxed">Embed the full chat interface directly inside an existing page on your website by pasting this iframe snippet.</p>
          
          <div className="relative">
            <textarea
              readOnly
              value={iframeCode}
              rows={2}
              className="w-full bg-slate-900 border border-slate-800 text-slate-300 font-mono text-xs p-4 rounded-xl outline-none resize-none"
            />
            <button
              onClick={() => handleCopy(iframeCode, 'iframe')}
              className="absolute top-3 right-3 p-2 bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg transition-all"
            >
              {copiedIframe ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* Embed Script Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 md:col-span-3">
          <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <MessageSquareCode size={18} className="text-brand-400" />
            Website Chat Bubble Widget (Script)
          </h2>
          <p className="text-slate-400 text-sm mb-4 leading-relaxed">Add a premium floating support bubble to the bottom-right corner of your website by injecting this script tag in your HTML file.</p>
          
          <div className="relative">
            <textarea
              readOnly
              value={scriptCode}
              rows={6}
              className="w-full bg-slate-900 border border-slate-800 text-slate-300 font-mono text-xs p-4 rounded-xl outline-none resize-none leading-relaxed"
            />
            <button
              onClick={() => handleCopy(scriptCode, 'script')}
              className="absolute top-3 right-3 p-2 bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg transition-all"
            >
              {copiedScript ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeployPage;
