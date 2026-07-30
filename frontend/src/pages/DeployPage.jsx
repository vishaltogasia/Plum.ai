import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

const DeployPage = () => {
  const { businessId } = useParams();
  const id = businessId || 1;
  
  const publicLink = `${window.location.origin}/chat/${id}`;
  const iframeCode = `<iframe src="${publicLink}" width="100%" height="600px" style="border: none; border-radius: 16px; box-shadow: 0 4px 30px rgba(0, 0, 0, 0.08);"></iframe>`;
  
  const scriptCode = `<script>
  window.PlumAgentConfig = {
    businessId: "${id}",
    themeColor: "#300033",
    title: "Customer Support AI"
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
    <div className="p-8 max-w-[1440px] mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#300033]">Agent Deployment & Widget Integration</h1>
        <p className="text-sm text-[#4f434c] mt-1">Embed your AI support employee on websites, customer portals, or share direct chat links</p>
      </div>

      <div className="space-y-6 max-w-4xl">
        {/* Direct Link Card */}
        <div className="bg-white p-6 rounded-xl border border-[#d2c2cd] custom-shadow space-y-4">
          <div className="flex items-center gap-2 text-[#300033]">
            <span className="material-symbols-outlined font-bold">link</span>
            <h2 className="text-lg font-bold">Direct Fullscreen Chat Link</h2>
          </div>
          <p className="text-xs text-[#4f434c]">Shareable URL for direct customer access or internal support preview.</p>
          <div className="flex gap-3">
            <input 
              type="text" 
              readOnly 
              value={publicLink} 
              className="flex-1 bg-[#fcf1f6] border border-[#d2c2cd] rounded-xl px-4 py-2.5 text-xs font-mono text-[#300033] outline-none"
            />
            <button 
              onClick={() => handleCopy(publicLink, 'link')}
              className="px-5 py-2.5 bg-[#300033] text-white rounded-xl font-semibold text-xs hover:opacity-90 transition shadow flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">{copiedLink ? 'done' : 'content_copy'}</span>
              {copiedLink ? 'Copied' : 'Copy Link'}
            </button>
            <a 
              href={publicLink} 
              target="_blank" 
              rel="noreferrer"
              className="px-5 py-2.5 border border-[#d2c2cd] text-[#4f434c] rounded-xl font-semibold text-xs hover:bg-[#fcf1f6] transition flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">open_in_new</span>
              Open Preview
            </a>
          </div>
        </div>

        {/* HTML iFrame Embed Card */}
        <div className="bg-white p-6 rounded-xl border border-[#d2c2cd] custom-shadow space-y-4">
          <div className="flex items-center gap-2 text-[#300033]">
            <span className="material-symbols-outlined font-bold">code</span>
            <h2 className="text-lg font-bold">Inline iFrame Embed Code</h2>
          </div>
          <p className="text-xs text-[#4f434c]">Embed a responsive, containerized chat module inside any HTML page.</p>
          <div className="relative">
            <textarea 
              readOnly 
              rows={2}
              value={iframeCode} 
              className="w-full bg-[#fcf1f6] border border-[#d2c2cd] rounded-xl p-4 text-xs font-mono text-[#300033] outline-none leading-relaxed"
            />
            <button 
              onClick={() => handleCopy(iframeCode, 'iframe')}
              className="absolute top-3 right-3 px-3 py-1 bg-white border border-[#d2c2cd] rounded-lg text-xs font-semibold text-[#300033] hover:bg-[#fcf1f6] transition flex items-center gap-1 shadow-sm"
            >
              <span className="material-symbols-outlined text-xs">{copiedIframe ? 'done' : 'content_copy'}</span>
              {copiedIframe ? 'Copied' : 'Copy Snippet'}
            </button>
          </div>
        </div>

        {/* Floating Script Widget Card */}
        <div className="bg-white p-6 rounded-xl border border-[#d2c2cd] custom-shadow space-y-4">
          <div className="flex items-center gap-2 text-[#300033]">
            <span className="material-symbols-outlined font-bold">chat_bubble</span>
            <h2 className="text-lg font-bold">Floating Corner Widget Script</h2>
          </div>
          <p className="text-xs text-[#4f434c]">Paste this JS snippet before the closing &lt;/body&gt; tag to add the Plum support bubble to your site.</p>
          <div className="relative">
            <textarea 
              readOnly 
              rows={6}
              value={scriptCode} 
              className="w-full bg-[#fcf1f6] border border-[#d2c2cd] rounded-xl p-4 text-xs font-mono text-[#300033] outline-none leading-relaxed"
            />
            <button 
              onClick={() => handleCopy(scriptCode, 'script')}
              className="absolute top-3 right-3 px-3 py-1 bg-white border border-[#d2c2cd] rounded-lg text-xs font-semibold text-[#300033] hover:bg-[#fcf1f6] transition flex items-center gap-1 shadow-sm"
            >
              <span className="material-symbols-outlined text-xs">{copiedScript ? 'done' : 'content_copy'}</span>
              {copiedScript ? 'Copied' : 'Copy Script'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeployPage;
