import { useEffect, useState } from "react";

const LinkPreview = ({ url }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/messages/link-preview/preview?url=${encodeURIComponent(url)}`);
        const json = await res.json();
        if (json.error || !json.title) {
          setFailed(true);
        } else {
          setData(json);
        }
      } catch (e) {
        setFailed(true);
      } finally {
        setLoading(false);
      }
    };
    fetchPreview();
  }, [url]);

  if (failed) return null;

  if (loading) {
    return (
      <div className="mt-2 w-full max-w-[340px] rounded-xl bg-gray-900/30 border border-gray-700/40 p-3 flex flex-col gap-2 animate-pulse">
        <div className="flex items-center gap-2">
          <div className="w-4.5 h-4.5 rounded bg-gray-700"></div>
          <div className="h-3 w-20 bg-gray-700 rounded"></div>
        </div>
        <div className="h-4 w-3/4 bg-gray-700 rounded"></div>
        <div className="h-3 w-full bg-gray-700 rounded"></div>
        <div className="w-full h-[120px] bg-gray-700 rounded-lg mt-1"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 w-full max-w-[340px] rounded-xl bg-gray-900/45 border border-gray-700/50 hover:bg-gray-800/45 hover:border-gray-600/70 p-3 flex flex-col gap-2.5 transition-all text-left block overflow-hidden shadow-lg select-none group"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2 min-w-0">
        {data.favicon && (
          <img
            src={data.favicon}
            alt="icon"
            className="w-4.5 h-4.5 rounded object-cover flex-shrink-0"
            onError={(e) => (e.target.style.display = "none")}
          />
        )}
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider truncate">
          {data.domain}
        </span>
      </div>

      <div className="flex flex-col gap-1 min-w-0">
        <h4 className="text-xs font-bold text-white leading-snug group-hover:text-sky-400 transition-colors line-clamp-2">
          {data.title}
        </h4>
        {data.description && (
          <p className="text-[11px] text-gray-300 leading-normal line-clamp-2">
            {data.description}
          </p>
        )}
      </div>

      {data.image && (
        <div className="w-full h-[140px] rounded-lg overflow-hidden bg-slate-950 flex items-center justify-center flex-shrink-0 relative">
          <img
            src={data.image}
            alt="Preview"
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            onError={(e) => (e.target.parentNode.style.display = "none")}
          />
        </div>
      )}
    </a>
  );
};

export default LinkPreview;
