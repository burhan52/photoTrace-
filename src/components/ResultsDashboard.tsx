import React, { useState, useMemo } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  Search,
  Globe,
  Share2,
  Cpu,
  FileCode,
  Download,
  Camera,
  Sparkles,
  RefreshCw,
  Newspaper,
  Filter,
  Eye,
  SlidersHorizontal
} from 'lucide-react';
import { ScanResultData, ImageClientMetadata, ResultCategoryFilter } from '../types';

interface ResultsDashboardProps {
  data: ScanResultData;
  metadata: ImageClientMetadata;
  imageSrc: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNewScan: () => void;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  data,
  metadata,
  imageSrc,
  activeTab,
  setActiveTab,
  onNewScan,
}) => {
  const [copiedQuery, setCopiedQuery] = useState<string | null>(null);
  const [copiedImage, setCopiedImage] = useState(false);
  const [customDorkQuery, setCustomDorkQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ResultCategoryFilter>('all');
  const [searchFilter, setSearchFilter] = useState('');

  const { analysis, groundedResults, searchSummary, reverseEngineLinks, socialScanTargets } = data;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQuery(id);
    setTimeout(() => setCopiedQuery(null), 2000);
  };

  const copyImageBlob = async () => {
    try {
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      const canvas = document.createElement('canvas');
      const img = new Image();
      img.onload = async () => {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(async (pngBlob) => {
            if (pngBlob) {
              await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': pngBlob }),
              ]);
              setCopiedImage(true);
              setTimeout(() => setCopiedImage(false), 2000);
            }
          }, 'image/png');
        }
      };
      img.src = imageSrc;
    } catch (err) {
      console.warn('Copy image failed:', err);
    }
  };

  const downloadImage = () => {
    const a = document.createElement('a');
    a.href = imageSrc;
    a.download = `visualtrace_${metadata.fileName || 'target'}.jpg`;
    a.click();
  };

  // Categorize grounded results dynamically if not already categorized
  const categorizedGroundedResults = useMemo(() => {
    return groundedResults.map((item) => {
      let cat = item.category;
      if (!cat) {
        const d = (item.domain || '').toLowerCase();
        const t = (item.title || '').toLowerCase();
        if (
          d.includes('twitter.com') || d.includes('x.com') || d.includes('instagram.com') ||
          d.includes('reddit.com') || d.includes('facebook.com') || d.includes('linkedin.com') ||
          d.includes('pinterest.com') || d.includes('tiktok.com') || d.includes('youtube.com')
        ) {
          cat = 'social';
        } else if (
          d.includes('news') || d.includes('reuters') || d.includes('bbc') ||
          d.includes('nytimes') || d.includes('theguardian') || d.includes('cnn') ||
          d.includes('apnews') || d.includes('techcrunch') || d.includes('forbes') ||
          t.includes('news') || t.includes('press') || t.includes('report')
        ) {
          cat = 'news';
        } else {
          cat = 'web';
        }
      }
      return { ...item, category: cat };
    });
  }, [groundedResults]);

  // Counts for each category filter
  const socialCount = useMemo(() => {
    const groundedSocial = categorizedGroundedResults.filter(r => r.category === 'social').length;
    return socialScanTargets.length + groundedSocial;
  }, [categorizedGroundedResults, socialScanTargets]);

  const newsCount = useMemo(() => {
    return categorizedGroundedResults.filter(r => r.category === 'news').length;
  }, [categorizedGroundedResults]);

  const webCount = useMemo(() => {
    const groundedWeb = categorizedGroundedResults.filter(r => r.category === 'web').length;
    return reverseEngineLinks.length + groundedWeb;
  }, [categorizedGroundedResults, reverseEngineLinks]);

  // Filtered grounded web results based on active category filter and search query
  const filteredGroundedResults = useMemo(() => {
    return categorizedGroundedResults.filter((item) => {
      const matchesCategory =
        categoryFilter === 'all' || item.category === categoryFilter;
      const matchesSearch =
        !searchFilter.trim() ||
        item.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (item.domain || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
        item.url.toLowerCase().includes(searchFilter.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [categorizedGroundedResults, categoryFilter, searchFilter]);

  // Filtered social platforms
  const filteredSocialTargets = useMemo(() => {
    if (categoryFilter === 'news' || categoryFilter === 'web') return [];
    if (!searchFilter.trim()) return socialScanTargets;
    return socialScanTargets.filter(
      (s) =>
        s.platform.toLowerCase().includes(searchFilter.toLowerCase()) ||
        s.purpose.toLowerCase().includes(searchFilter.toLowerCase()) ||
        s.query.toLowerCase().includes(searchFilter.toLowerCase())
    );
  }, [socialScanTargets, categoryFilter, searchFilter]);

  // Filtered reverse search engines
  const filteredReverseEngines = useMemo(() => {
    if (categoryFilter === 'social' || categoryFilter === 'news') return [];
    if (!searchFilter.trim()) return reverseEngineLinks;
    return reverseEngineLinks.filter(
      (e) =>
        e.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        e.category.toLowerCase().includes(searchFilter.toLowerCase()) ||
        e.description.toLowerCase().includes(searchFilter.toLowerCase())
    );
  }, [reverseEngineLinks, categoryFilter, searchFilter]);

  // Construct news search queries for the subject
  const newsQueryUrl = `https://news.google.com/search?q=${encodeURIComponent(analysis.subject)}`;
  const newsBingUrl = `https://www.bing.com/news/search?q=${encodeURIComponent(analysis.subject)}`;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Top Banner / Match Identification */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Target Thumbnail with Actions */}
          <div className="relative group w-full lg:w-56 shrink-0 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex flex-col items-center">
            <img
              src={imageSrc}
              alt={analysis.subject}
              className="w-full h-44 object-cover object-center"
            />
            <div className="w-full p-2 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs">
              <button
                onClick={copyImageBlob}
                className="flex items-center gap-1 text-slate-400 hover:text-cyan-400 transition-colors font-medium text-[11px]"
                title="Copy image to paste into Google Lens or Yandex"
              >
                {copiedImage ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedImage ? 'Copied' : 'Copy Pic'}</span>
              </button>
              <button
                onClick={downloadImage}
                className="flex items-center gap-1 text-slate-400 hover:text-cyan-400 transition-colors font-medium text-[11px]"
                title="Download image file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
              <button
                onClick={onNewScan}
                className="flex items-center gap-1 text-slate-400 hover:text-cyan-400 transition-colors font-medium text-[11px]"
                title="Upload another image"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            </div>
          </div>

          {/* Identification Details */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2.5 py-0.5 rounded-full">
                {analysis.category || 'Visual Match'}
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-mono text-slate-400">
                {metadata.width}×{metadata.height} px
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-400 font-mono">{metadata.fileSizeFormatted}</span>
            </div>

            <h2 className="text-2xl font-bold text-white tracking-tight mb-2">
              {analysis.subject}
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              {analysis.summary}
            </p>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800 text-left">
              <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block">Web Appearances</span>
                <span className="text-lg font-bold text-white font-mono tabular-nums">
                  {groundedResults.length}
                </span>
              </div>
              <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block">Entities Identified</span>
                <span className="text-lg font-bold text-white font-mono tabular-nums">
                  {analysis.entities?.length || 0}
                </span>
              </div>
              <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block">OCR Text Matches</span>
                <span className="text-lg font-bold text-white font-mono tabular-nums">
                  {analysis.ocrText?.length || 0}
                </span>
              </div>
              <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block">Target Search Vectors</span>
                <span className="text-lg font-bold text-white font-mono tabular-nums">
                  {reverseEngineLinks.length + socialScanTargets.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FILTERING UI: Category & Content Switcher Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Segmented Filter Controls */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-medium text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              Filter Results:
            </span>

            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                categoryFilter === 'all'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <span>All Results</span>
              <span className="font-mono text-[11px] tabular-nums opacity-80">
                ({groundedResults.length + socialScanTargets.length + reverseEngineLinks.length})
              </span>
            </button>

            <button
              onClick={() => setCategoryFilter('social')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                categoryFilter === 'social'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Social Media</span>
              <span className="font-mono text-[11px] tabular-nums opacity-80">
                ({socialCount})
              </span>
            </button>

            <button
              onClick={() => setCategoryFilter('news')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                categoryFilter === 'news'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Newspaper className="w-3.5 h-3.5" />
              <span>News Outlets</span>
              <span className="font-mono text-[11px] tabular-nums opacity-80">
                ({newsCount > 0 ? newsCount : 'Search'})
              </span>
            </button>

            <button
              onClick={() => setCategoryFilter('web')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                categoryFilter === 'web'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>General Web</span>
              <span className="font-mono text-[11px] tabular-nums opacity-80">
                ({webCount})
              </span>
            </button>
          </div>

          {/* In-page keyword / domain search */}
          <div className="w-full sm:w-64 relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search in results..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Filter Context Notice */}
        {categoryFilter !== 'all' && (
          <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/60">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              Currently showing only{' '}
              <strong className="text-white capitalize">
                {categoryFilter === 'social' ? 'Social Media accounts and posts' : categoryFilter === 'news' ? 'News Outlets & Media articles' : 'General Web & Search Engines'}
              </strong>
              . Other categories are hidden.
            </span>
            <button
              onClick={() => setCategoryFilter('all')}
              className="text-cyan-400 hover:text-cyan-300 text-[11px] underline font-medium"
            >
              Show All
            </button>
          </div>
        )}
      </div>

      {/* Navigation View Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('scanner')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'scanner'
              ? 'bg-cyan-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Web Appearances ({filteredGroundedResults.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('engines')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'engines'
              ? 'bg-cyan-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Reverse Image Engines (6)</span>
        </button>

        <button
          onClick={() => setActiveTab('social')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'social'
              ? 'bg-cyan-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Social Media Footprint ({socialScanTargets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('forensics')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'forensics'
              ? 'bg-cyan-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Forensics & EXIF</span>
        </button>

        <button
          onClick={() => setActiveTab('dorks')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'dorks'
              ? 'bg-cyan-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>OSINT Dorks</span>
        </button>
      </div>

      {/* DYNAMIC SECTION 1: News Outlets Targeted Search (Shown when News or All is active) */}
      {(categoryFilter === 'news' || categoryFilter === 'all') && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-cyan-400" />
                News Media & Press Coverage Scanner
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Investigate news coverage, breaking reports, and journalism outlets citing this photo or subject.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={newsQueryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span>Google News</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href={newsBingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span>Bing News</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Quick News Dorks */}
          <div className="flex flex-wrap gap-2 text-xs font-mono pt-2 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-400 self-center font-sans font-medium">News Dorks:</span>
            {[
              `intitle:"${analysis.subject}" news`,
              `site:reuters.com "${analysis.subject}"`,
              `site:bbc.com "${analysis.subject}"`,
              `site:apnews.com "${analysis.subject}"`,
            ].map((dork, idx) => (
              <a
                key={idx}
                href={`https://www.google.com/search?q=${encodeURIComponent(dork)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-cyan-300 rounded text-[11px] flex items-center gap-1 transition-colors"
              >
                <span>{dork}</span>
                <ExternalLink className="w-2.5 h-2.5 text-slate-500" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* DYNAMIC SECTION 2: Social Media Targets (Shown when Social or All is active) */}
      {(categoryFilter === 'social' || categoryFilter === 'all') && (activeTab === 'social' || categoryFilter === 'social') && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 text-cyan-400" />
                Social Media Footprint & Cross-Reference Vectors
              </h3>
              <span className="text-xs text-cyan-400 font-mono">
                {filteredSocialTargets.length} platforms armed
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Direct search queries targeted across major social platforms for photos, usernames, threads, and viral publications.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSocialTargets.map((social, idx) => (
              <div
                key={idx}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white flex items-center gap-2">
                      <Share2 className="w-4 h-4 text-cyan-400" />
                      {social.platform}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      Query Vector
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">{social.purpose}</p>

                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 mb-4 font-mono text-xs text-slate-300 flex items-center justify-between gap-2">
                    <span className="truncate">"{social.query}"</span>
                    <button
                      onClick={() => copyToClipboard(social.query, `soc-${idx}`)}
                      className="text-slate-500 hover:text-cyan-400 transition-colors shrink-0"
                      title="Copy query"
                    >
                      {copiedQuery === `soc-${idx}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                  <a
                    href={social.deepUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 text-xs font-semibold text-center text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Search {social.platform}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DYNAMIC SECTION 3: Reverse Image Engines (Shown when General Web or All is active) */}
      {(categoryFilter === 'web' || categoryFilter === 'all') && (activeTab === 'engines' || categoryFilter === 'web') && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex items-start gap-3">
            <Camera className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300">
              <span className="font-semibold text-white block mb-0.5">
                Multi-Engine Reverse Image Launchpad:
              </span>
              Click <strong>"Launch Visual Search"</strong> to open with pre-filled keywords, or click <strong>"Copy Pic"</strong> above to paste directly into Google Lens or Yandex!
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReverseEngines.map((engine, idx) => (
              <div
                key={idx}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">{engine.name}</span>
                    {engine.badge && (
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/70 border border-cyan-800/60 px-2 py-0.5 rounded">
                        {engine.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium text-slate-400 block mb-1">
                    {engine.category}
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    {engine.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                  <a
                    href={engine.queryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 text-xs font-semibold text-center text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Launch Visual Search</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={engine.searchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                    title="Open Engine Uploader directly"
                  >
                    Upload Tool
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MAIN TAB CONTENT: Web Appearances (when activeTab is scanner) */}
      {activeTab === 'scanner' && (
        <div className="space-y-4">
          {/* Grounding Summary */}
          {searchSummary && (
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Live Grounded Search Summary
              </div>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                {searchSummary}
              </p>
            </div>
          )}

          {/* Grounded Web Results Grid with Dynamic Filter Applied */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                Filtered Online Publications & Mentions ({filteredGroundedResults.length})
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Filter:</span>
                <span className="font-semibold text-white uppercase text-[11px] bg-slate-800 px-2 py-0.5 rounded">
                  {categoryFilter}
                </span>
              </div>
            </div>

            {filteredGroundedResults.length === 0 ? (
              <div className="text-center py-8 bg-slate-950/60 rounded-xl border border-slate-800/60">
                <Globe className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-300">
                  {categoryFilter === 'all'
                    ? 'No direct public URL returned from live web grounding'
                    : `No results matching "${categoryFilter}" filter`}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-md mx-auto">
                  {categoryFilter !== 'all' ? (
                    <button
                      onClick={() => setCategoryFilter('all')}
                      className="text-cyan-400 hover:underline"
                    >
                      Click here to reset filter to All Results
                    </button>
                  ) : (
                    'Launch the dedicated visual search engines (Google Lens & Yandex) in the Reverse Image Engines tab.'
                  )}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {filteredGroundedResults.map((item, idx) => (
                  <div key={idx} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-4 group">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40 truncate max-w-[200px]">
                          {item.domain || 'web'}
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${
                          item.category === 'social'
                            ? 'text-purple-300 bg-purple-950/50 border border-purple-800/50'
                            : item.category === 'news'
                            ? 'text-amber-300 bg-amber-950/50 border border-amber-800/50'
                            : 'text-slate-400 bg-slate-800 border border-slate-700'
                        }`}>
                          {item.category || 'web'}
                        </span>
                      </div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors line-clamp-1 flex items-center gap-1.5"
                      >
                        <span>{item.title}</span>
                        <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 shrink-0" />
                      </a>
                      <p className="text-xs font-mono text-slate-500 truncate mt-0.5">
                        {item.url}
                      </p>
                    </div>

                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg transition-colors shrink-0 flex items-center gap-1"
                    >
                      <span>Visit</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Identified Entities Card */}
          {analysis.entities && analysis.entities.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">
                Detected Entities & Key Subjects
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {analysis.entities.map((entity, i) => (
                  <div key={i} className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-white truncate">{entity.name}</span>
                      <span className="text-[10px] font-mono uppercase text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                        {entity.type}
                      </span>
                    </div>
                    {entity.notes && (
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">{entity.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* OCR Extracted Text Card */}
          {analysis.ocrText && analysis.ocrText.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">
                Extracted Text & In-Image Signage (OCR)
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysis.ocrText.map((text, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300"
                  >
                    <span>"{text}"</span>
                    <button
                      onClick={() => copyToClipboard(`"${text}"`, `ocr-${i}`)}
                      className="text-slate-500 hover:text-cyan-400 transition-colors"
                      title="Copy phrase"
                    >
                      {copiedQuery === `ocr-${i}` ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Forensics & Technical EXIF */}
      {activeTab === 'forensics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* AI Forensics Assessment */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                AI Generation & Authenticity
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[11px]">Generation Assessment</span>
                  <span className="text-sm font-semibold text-white mt-0.5 block">
                    {analysis.forensics?.aiGeneratedAssessment || 'Likely Real Photograph'}
                  </span>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[11px]">Visual Artifacts & Optical Clues</span>
                  <p className="text-slate-300 mt-1 leading-relaxed">
                    {analysis.forensics?.aiIndicators || 'Natural optical depth-of-field and realistic grain observed.'}
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[11px]">Estimated Era / Period</span>
                  <span className="text-slate-300 mt-0.5 block font-mono">
                    {analysis.forensics?.estimatedEra || 'Modern'}
                  </span>
                </div>

                {analysis.forensics?.tamperingClues && (
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[11px]">Tampering & Edit Clues</span>
                    <p className="text-slate-300 mt-1 leading-relaxed">
                      {analysis.forensics.tamperingClues}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Technical Metadata & EXIF */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-400" />
                Camera Metadata & Cryptographic Hashes
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[11px]">SHA-256 Digest (Exact Match Fingerprint)</span>
                  <div className="flex items-center justify-between gap-2 mt-1 font-mono text-[11px] text-cyan-400 bg-slate-900 p-1.5 rounded truncate">
                    <span className="truncate">{metadata.sha256}</span>
                    <button
                      onClick={() => copyToClipboard(metadata.sha256, 'sha256')}
                      className="text-slate-400 hover:text-white"
                      title="Copy SHA-256"
                    >
                      {copiedQuery === 'sha256' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[11px]">Dimensions</span>
                    <span className="text-slate-200 font-mono">{metadata.width} × {metadata.height} px</span>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[11px]">Aspect Ratio</span>
                    <span className="text-slate-200 font-mono">{metadata.aspectRatio}</span>
                  </div>
                </div>

                {metadata.exif ? (
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
                    <span className="text-slate-500 block text-[11px]">Embedded EXIF Header Tags</span>
                    {metadata.exif.cameraMake && (
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-500">Camera Make:</span>
                        <span className="font-mono">{metadata.exif.cameraMake}</span>
                      </div>
                    )}
                    {metadata.exif.cameraModel && (
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-500">Camera Model:</span>
                        <span className="font-mono">{metadata.exif.cameraModel}</span>
                      </div>
                    )}
                    {metadata.exif.dateTimeOriginal && (
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-500">Timestamp:</span>
                        <span className="font-mono">{metadata.exif.dateTimeOriginal}</span>
                      </div>
                    )}
                    {metadata.exif.software && (
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-500">Software:</span>
                        <span className="font-mono">{metadata.exif.software}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-slate-400 text-[11px]">
                    No embedded EXIF metadata found (standard for web-compressed or screenshot images).
                  </div>
                )}

                {metadata.dominantColors && metadata.dominantColors.length > 0 && (
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[11px] mb-1.5">Dominant Color Swatches</span>
                    <div className="flex items-center gap-2">
                      {metadata.dominantColors.map((color, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-1">
                          <div
                            className="w-8 h-8 rounded-md border border-slate-700 shadow-inner"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-[9px] font-mono text-slate-400">{color}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: OSINT Dorks & Query Builder */}
      {activeTab === 'dorks' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
            <h3 className="text-sm font-semibold text-white mb-1">
              Advanced Search Engine Dorks (Google & Bing)
            </h3>
            <p className="text-xs text-slate-400">
              Copy and execute these specialized queries directly in Google or Bing to isolate exact photo publications, social accounts, and high-precision mentions.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h4 className="text-xs font-semibold text-slate-300 mb-3">
              Automated Dork Queries for this Photo:
            </h4>
            <div className="space-y-2.5">
              {(analysis.osintDorks || []).map((dork, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono"
                >
                  <span className="text-cyan-400 truncate flex-1">{dork}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => copyToClipboard(dork, `dork-${i}`)}
                      className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors flex items-center gap-1"
                    >
                      {copiedQuery === `dork-${i}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedQuery === `dork-${i}` ? 'Copied' : 'Copy'}</span>
                    </button>
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(dork)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 text-[11px] bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold rounded transition-colors flex items-center gap-1"
                    >
                      <span>Run</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h4 className="text-xs font-semibold text-slate-300 mb-2">
              Interactive Custom OSINT Query Builder:
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              Construct tailored site dorks using detected keywords, person name, or phrases:
            </p>

            <div className="flex flex-wrap gap-2 mb-3">
              {[
                `site:instagram.com "${analysis.subject}"`,
                `site:twitter.com "${analysis.subject}"`,
                `site:linkedin.com/in "${analysis.subject}"`,
                `site:reddit.com "${analysis.subject}"`,
                `filetype:jpg "${analysis.subject}"`,
                `intitle:"${analysis.subject}" news`,
              ].map((template, idx) => (
                <button
                  key={idx}
                  onClick={() => setCustomDorkQuery(template)}
                  className="px-2.5 py-1 text-[11px] font-mono bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded transition-colors"
                >
                  {template}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="site:instagram.com 'name'"
                value={customDorkQuery}
                onChange={(e) => setCustomDorkQuery(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(customDorkQuery || analysis.subject)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors flex items-center justify-center gap-1.5 shrink-0"
              >
                <span>Launch in Google</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href={`https://www.bing.com/search?q=${encodeURIComponent(customDorkQuery || analysis.subject)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 shrink-0"
              >
                <span>Bing</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
