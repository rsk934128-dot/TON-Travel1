import React, { useState, useEffect } from 'react';
import {
  Code,
  Layers,
  Sparkles,
  Wallet,
  X,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Database,
  Image as ImageIcon,
  Tag,
  CheckCircle2,
  AlertCircle,
  Terminal,
  Activity,
  Zap,
  ArrowRight
} from 'lucide-react';
import {
  getTonAccount,
  getTonAccountRaw,
  getTonAccountNFTs,
  TonAccountResponse,
  TonAccountRawResponse,
  TonNftsResponse,
  POPULAR_TON_ADDRESSES
} from '../services/tonApiService';

interface TonApiInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAddress?: string;
}

type TabType = 'account' | 'raw' | 'nfts' | 'docs';

export const TonApiInspectorModal: React.FC<TonApiInspectorModalProps> = ({
  isOpen,
  onClose,
  defaultAddress = 'EQBvW839_TonSpace_cX92vK4499_TravelReward_Vault'
}) => {
  const [address, setAddress] = useState<string>(defaultAddress);
  const [activeTab, setActiveTab] = useState<TabType>('account');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'visual' | 'json'>('visual');

  // Response States
  const [accountData, setAccountData] = useState<TonAccountResponse | null>(null);
  const [rawData, setRawData] = useState<TonAccountRawResponse | null>(null);
  const [nftsData, setNftsData] = useState<TonNftsResponse | null>(null);

  useEffect(() => {
    if (defaultAddress) {
      setAddress(defaultAddress);
    }
  }, [defaultAddress]);

  const fetchData = async (targetAddr: string) => {
    const addr = targetAddr.trim();
    if (!addr) return;
    setLoading(true);
    setError(null);

    try {
      const [acc, raw, nfts] = await Promise.all([
        getTonAccount(addr),
        getTonAccountRaw(addr),
        getTonAccountNFTs(addr)
      ]);
      setAccountData(acc);
      setRawData(raw);
      setNftsData(nfts);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch TON API data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData(address);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getActiveEndpointDoc = () => {
    switch (activeTab) {
      case 'account':
        return {
          method: 'GET',
          path: `/v2/accounts/${address}`,
          title: 'Account Information',
          desc: 'Returns human-readable account details, formatted balance in nanoTON, account interfaces, and wallet state.'
        };
      case 'raw':
        return {
          method: 'GET',
          path: `/v2/blockchain/accounts/${address}`,
          title: 'Account Raw Blockchain State',
          desc: 'Returns low-level blockchain storage statistics, contract code hash, data cells, last LT, and transaction hash.'
        };
      case 'nfts':
        return {
          method: 'GET',
          path: `/v2/accounts/${address}/nfts`,
          title: 'Account NFTs & Collectibles',
          desc: 'Returns all TEP-64 / TEP-62 Non-Fungible Tokens owned by the given address, including metadata, attributes, and collection info.'
        };
      default:
        return {
          method: 'GET',
          path: '/v2/*',
          title: 'TON API v2 Overview',
          desc: 'High-performance REST API for TON blockchain indexing and smart contract interactions.'
        };
    }
  };

  const endpoint = getActiveEndpointDoc();

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in text-slate-100">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-950/80 via-slate-900 to-blue-950/80 border-b border-cyan-500/30 p-4 sm:p-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/20">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                  TON API v2 Live Inspector
                </h2>
                <span className="bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  REST API Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official OpenAPI Endpoints for Accounts, Raw Blockchain State, and NFTs
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Address Search & Quick Selectors */}
        <div className="bg-slate-950/80 border-b border-slate-800 p-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative flex-1">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter TON address (e.g., EQBvW839...)"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-cyan-300 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <button
              onClick={() => fetchData(address)}
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Calling API...' : 'Fetch Live Data'}</span>
            </button>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
            <span className="text-slate-400">Quick Addresses:</span>
            {POPULAR_TON_ADDRESSES.map((preset) => (
              <button
                key={preset.name}
                onClick={() => {
                  setAddress(preset.address);
                  fetchData(preset.address);
                }}
                className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all font-mono"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Endpoint Tabs */}
        <div className="bg-slate-950/60 border-b border-slate-800 px-4 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('account')}
              className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'account'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>GET /v2/accounts/{'{address}'}</span>
            </button>

            <button
              onClick={() => setActiveTab('raw')}
              className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'raw'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>GET /v2/blockchain/accounts/{'{address}'}</span>
            </button>

            <button
              onClick={() => setActiveTab('nfts')}
              className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'nfts'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>GET /v2/accounts/{'{address}'}/nfts</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 py-2">
            <button
              onClick={() => setViewMode('visual')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                viewMode === 'visual'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Visual View
            </button>
            <button
              onClick={() => setViewMode('json')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                viewMode === 'json'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              JSON Payload
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* Active Endpoint Info Badge */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 flex-wrap text-xs">
            <div className="flex items-center gap-2 font-mono">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-extrabold border border-emerald-500/40">
                {endpoint.method}
              </span>
              <span className="text-white font-bold">{endpoint.path}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(`curl -X GET "https://tonapi.io${endpoint.path}" -H "Accept: application/json"`, 'curl')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] flex items-center gap-1 border border-slate-700"
              >
                {copiedId === 'curl' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedId === 'curl' ? 'cURL Copied!' : 'Copy cURL'}</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: ACCOUNT (GET /v2/accounts/{address}) */}
          {activeTab === 'account' && (
            <div>
              {viewMode === 'visual' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                      <div className="text-slate-400 text-xs">Formatted Balance</div>
                      <div className="text-xl font-black text-cyan-300 font-mono">
                        {accountData?.balanceTon.toFixed(4) || '0.0000'} TON
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {accountData?.balance.toLocaleString()} nanoTON
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                      <div className="text-slate-400 text-xs">Account Status</div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span className="text-base font-bold text-white uppercase font-mono">
                          {accountData?.status || 'active'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {accountData?.is_wallet ? 'Wallet Smart Contract' : 'Generic Smart Contract'}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                      <div className="text-slate-400 text-xs">Contract Interfaces</div>
                      <div className="flex flex-wrap gap-1">
                        {accountData?.interfaces?.map((iface) => (
                          <span
                            key={iface}
                            className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30"
                          >
                            {iface}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2 text-xs">
                    <h3 className="font-bold text-white flex items-center justify-between">
                      <span>Smart Contract Get Methods:</span>
                      <span className="text-[11px] text-cyan-400 font-mono">
                        {accountData?.get_methods?.length || 0} methods exposed
                      </span>
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {accountData?.get_methods?.map((m) => (
                        <span
                          key={m}
                          className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 font-mono text-[11px]"
                        >
                          {m}()
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <pre className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-mono text-cyan-300 overflow-x-auto">
                  {JSON.stringify(accountData, null, 2)}
                </pre>
              )}
            </div>
          )}

          {/* TAB 2: RAW BLOCKCHAIN (GET /v2/blockchain/accounts/{address}) */}
          {activeTab === 'raw' && (
            <div>
              {viewMode === 'visual' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                      <div className="text-slate-400 text-xs">Storage Footprint (TEP-74)</div>
                      <div className="text-xs text-slate-300 space-y-1">
                        <div className="flex justify-between">
                          <span>Used Cells:</span>
                          <strong className="font-mono text-cyan-300">{rawData?.storage.used_cells}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Used Bits:</span>
                          <strong className="font-mono text-cyan-300">{rawData?.storage.used_bits} bits</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Due Storage Payment:</span>
                          <strong className="font-mono text-emerald-400">{rawData?.storage.due_payment} TON</strong>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                      <div className="text-slate-400 text-xs">Last Transaction LT & Hash</div>
                      <div className="text-[11px] font-mono text-slate-300 break-all space-y-1">
                        <div>LT: <span className="text-cyan-400">{rawData?.last_transaction_lt}</span></div>
                        <div className="line-clamp-2">Hash: <span className="text-slate-400">{rawData?.last_transaction_hash}</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2 text-xs">
                    <div className="text-slate-400 font-bold">Contract Code Cell (BOC):</div>
                    <div className="p-2.5 bg-slate-900 rounded-xl font-mono text-[11px] text-slate-300 break-all border border-slate-800">
                      {rawData?.code}
                    </div>
                  </div>
                </div>
              ) : (
                <pre className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-mono text-cyan-300 overflow-x-auto">
                  {JSON.stringify(rawData, null, 2)}
                </pre>
              )}
            </div>
          )}

          {/* TAB 3: NFTS (GET /v2/accounts/{address}/nfts) */}
          {activeTab === 'nfts' && (
            <div>
              {viewMode === 'visual' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Owned Collectibles & Passes ({nftsData?.nft_items?.length || 0})</span>
                    <span className="text-cyan-400 font-mono">Standards: TEP-62, TEP-64</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {nftsData?.nft_items?.map((nft) => (
                      <div
                        key={nft.address}
                        className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl flex gap-3"
                      >
                        {nft.metadata.image && (
                          <img
                            src={nft.metadata.image}
                            alt={nft.metadata.name || 'NFT'}
                            className="w-20 h-20 rounded-xl object-cover border border-slate-700 shrink-0"
                          />
                        )}

                        <div className="flex-1 space-y-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-xs truncate">
                              {nft.metadata.name || 'TON NFT Item'}
                            </span>
                            {nft.verified && (
                              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            )}
                          </div>

                          <div className="text-[11px] text-amber-300 font-semibold truncate">
                            {nft.collection?.name}
                          </div>

                          <p className="text-[10px] text-slate-400 line-clamp-2">
                            {nft.metadata.description}
                          </p>

                          <div className="pt-1 flex flex-wrap gap-1">
                            {nft.metadata.attributes?.map((attr) => (
                              <span
                                key={attr.trait_type}
                                className="text-[9px] bg-slate-900 border border-slate-700 text-slate-300 px-1.5 py-0.5 rounded"
                              >
                                {attr.trait_type}: <strong className="text-cyan-300">{attr.value}</strong>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <pre className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-mono text-cyan-300 overflow-x-auto">
                  {JSON.stringify(nftsData, null, 2)}
                </pre>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-950 border-t border-slate-800 p-3 sm:p-4 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>TON API v2 Live Spec • tonapi.io</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all text-xs"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
};
