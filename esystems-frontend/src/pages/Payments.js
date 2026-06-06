import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useBranding } from '../contexts/BrandingContext';

const paymentRegions = [
  {
    id: 'north-america',
    label: 'North America',
    detail: 'USDC, USDT, USD1 escrow funding',
    x: 226,
    y: 168,
    labelX: 86,
    labelY: 124,
  },
  {
    id: 'south-america',
    label: 'South America',
    detail: 'Regional employers and contractors',
    x: 332,
    y: 352,
    labelX: 246,
    labelY: 400,
  },
  {
    id: 'europe',
    label: 'Europe',
    detail: 'Cross-border client payments',
    x: 500,
    y: 158,
    labelX: 458,
    labelY: 112,
  },
  {
    id: 'dubai',
    label: 'UAE / Dubai',
    detail: 'Gulf business payment corridor',
    x: 602,
    y: 226,
    labelX: 552,
    labelY: 266,
  },
  {
    id: 'australia',
    label: 'Australia',
    detail: 'APAC client funding',
    x: 812,
    y: 398,
    labelX: 770,
    labelY: 440,
  },
];

const payoutHub = {
  label: 'Philippines VA payouts',
  x: 774,
  y: 292,
  labelX: 722,
  labelY: 238,
};

const paymentRoutes = [
  {
    id: 'north-america',
    d: `M ${paymentRegions[0].x} ${paymentRegions[0].y} C 354 70, 610 92, ${payoutHub.x} ${payoutHub.y}`,
    delay: '-0.2s',
  },
  {
    id: 'south-america',
    d: `M ${paymentRegions[1].x} ${paymentRegions[1].y} C 432 454, 638 426, ${payoutHub.x} ${payoutHub.y}`,
    delay: '-1.1s',
  },
  {
    id: 'europe',
    d: `M ${paymentRegions[2].x} ${paymentRegions[2].y} C 570 100, 704 138, ${payoutHub.x} ${payoutHub.y}`,
    delay: '-0.8s',
  },
  {
    id: 'dubai',
    d: `M ${paymentRegions[3].x} ${paymentRegions[3].y} C 648 205, 718 226, ${payoutHub.x} ${payoutHub.y}`,
    delay: '-1.6s',
  },
  {
    id: 'australia',
    d: `M ${paymentRegions[4].x} ${paymentRegions[4].y} C 844 360, 838 310, ${payoutHub.x} ${payoutHub.y}`,
    delay: '-2.4s',
  },
];

function PaymentFlowMap({ brandName }) {
  return (
    <section className="mb-12 rounded-lg border border-gray-200 bg-slate-950 overflow-hidden shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="relative min-h-[320px] p-4 sm:p-6">
          <svg
            role="img"
            aria-labelledby="payment-flow-title payment-flow-desc"
            className="h-full min-h-[300px] w-full"
            viewBox="0 0 1000 520"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <title id="payment-flow-title">Animated stablecoin payment map</title>
            <desc id="payment-flow-desc">
              Stablecoin payment routes connect North America, South America, Europe, UAE and Dubai, and Australia to Philippines virtual assistant payouts.
            </desc>
            <style>
              {`
                .payment-flow-route {
                  animation: paymentRouteGlow 4.8s ease-in-out infinite;
                }

                .payment-flow-pulse {
                  animation: paymentPulse 2.8s ease-in-out infinite;
                  transform-origin: center;
                }

                .payment-flow-hub {
                  animation: paymentHubPulse 2.4s ease-in-out infinite;
                  transform-origin: center;
                }

                @keyframes paymentRouteGlow {
                  0%, 100% { stroke-opacity: 0.38; }
                  50% { stroke-opacity: 0.92; }
                }

                @keyframes paymentPulse {
                  0%, 100% { opacity: 0.72; r: 5; }
                  50% { opacity: 1; r: 8; }
                }

                @keyframes paymentHubPulse {
                  0%, 100% { opacity: 0.9; r: 9; }
                  50% { opacity: 1; r: 13; }
                }

                @media (prefers-reduced-motion: reduce) {
                  .payment-flow-route,
                  .payment-flow-pulse,
                  .payment-flow-hub {
                    animation: none;
                  }
                }
              `}
            </style>
            <defs>
              <radialGradient id="oceanGlow" cx="50%" cy="45%" r="65%">
                <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.28" />
                <stop offset="70%" stopColor="#0f172a" stopOpacity="0.42" />
                <stop offset="100%" stopColor="#020617" stopOpacity="0.88" />
              </radialGradient>
              <linearGradient id="routeGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="48%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#facc15" />
              </linearGradient>
              <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <rect width="1000" height="520" rx="24" fill="url(#oceanGlow)" />
            <g opacity="0.18" stroke="#93c5fd" strokeWidth="1">
              {[160, 260, 360, 460, 560, 660, 760, 860].map((x) => (
                <path key={`meridian-${x}`} d={`M ${x} 42 C ${x - 42} 168, ${x - 42} 352, ${x} 478`} />
              ))}
              {[94, 178, 262, 346, 430].map((y) => (
                <path key={`parallel-${y}`} d={`M 54 ${y} C 302 ${y - 28}, 698 ${y - 28}, 946 ${y}`} />
              ))}
            </g>

            <g fill="#334155" opacity="0.7">
              <path d="M136 138L204 82L304 110L354 170L324 230L246 228L212 282L148 244L104 178L136 138Z" />
              <path d="M306 270L376 300L392 396L340 464L292 392L264 326L306 270Z" />
              <path d="M462 128L530 104L594 134L570 188L494 196L448 166L462 128Z" />
              <path d="M548 216L624 200L696 250L672 336L596 318L536 270L548 216Z" />
              <path d="M708 138L846 156L898 228L862 300L748 284L688 212L708 138Z" />
              <path d="M762 378L844 352L904 392L870 454L788 438L762 378Z" />
              <path d="M752 274L790 258L812 296L782 318L752 274Z" />
            </g>

            <g>
              {paymentRoutes.map((route) => (
                <g key={route.id}>
                  <path
                    id={`payment-route-${route.id}`}
                    d={route.d}
                    stroke="#7dd3fc"
                    strokeWidth="10"
                    strokeLinecap="round"
                    opacity="0.12"
                  />
                  <path
                    className="payment-flow-route"
                    d={route.d}
                    stroke="url(#routeGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="10 12"
                    filter="url(#softGlow)"
                  />
                  <circle r="6" fill="#facc15" filter="url(#softGlow)">
                    <animateMotion dur="4.8s" begin={route.delay} repeatCount="indefinite">
                      <mpath href={`#payment-route-${route.id}`} />
                    </animateMotion>
                  </circle>
                </g>
              ))}
            </g>

            <g>
              {paymentRegions.map((region) => (
                <g key={region.id}>
                  <circle cx={region.x} cy={region.y} r="14" fill="#38bdf8" opacity="0.18" />
                  <circle className="payment-flow-pulse" cx={region.x} cy={region.y} r="6" fill="#38bdf8" />
                  <text x={region.labelX} y={region.labelY} fill="#f8fafc" fontSize="20" fontWeight="700">
                    {region.label}
                  </text>
                </g>
              ))}
              <circle cx={payoutHub.x} cy={payoutHub.y} r="28" fill="#facc15" opacity="0.18" />
              <circle className="payment-flow-hub" cx={payoutHub.x} cy={payoutHub.y} r="10" fill="#facc15" filter="url(#softGlow)" />
              <text x={payoutHub.labelX} y={payoutHub.labelY} fill="#f8fafc" fontSize="20" fontWeight="700">
                Philippines
              </text>
              <text x={payoutHub.labelX - 16} y={payoutHub.labelY + 26} fill="#cbd5e1" fontSize="15">
                VA payouts
              </text>
            </g>
          </svg>
        </div>

        <div className="border-t border-slate-800 bg-slate-900/88 p-5 sm:p-6 lg:border-l lg:border-t-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-300">Global stablecoin coverage</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Escrow routes for remote teams</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            {brandName} supports dollar-pegged escrow funding from established client regions and instant wallet payouts for Philippines-based VAs.
          </p>
          <div className="mt-6 space-y-3">
            {paymentRegions.map((region) => (
              <div key={region.id} className="rounded-lg border border-slate-700 bg-slate-800/70 p-3">
                <p className="text-sm font-semibold text-white">{region.label}</p>
                <p className="mt-1 text-xs text-slate-300">{region.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Payments() {
  const { branding, loading: brandingLoading } = useBranding();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (brandingLoading || !branding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Payments - {branding.name}</title>
        <meta name="description" content="How Linkage escrow payments work with stablecoins — instant payouts, zero FX spread, and lower fees." />
      </Helmet>

      <div className="bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">How Payments Work</h1>
            <p className="max-w-3xl text-lg text-gray-600 mb-10">
              {branding.name} uses stablecoin escrow payments so VAs get paid instantly — no waiting for wire transfers, no PayPal holds, and no hidden FX spreads.
            </p>

            <PaymentFlowMap brandName={branding.name} />

            <div className="max-w-3xl mx-auto">
            {/* What Are Stablecoins */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">What Are Stablecoins?</h2>
              <p className="text-gray-700 mb-4">
                Stablecoins are digital tokens pegged 1:1 to the US Dollar. One USDC always equals one USD. They live on blockchain networks (Ethereum for ERC-20, Tron for TRC-20) and can be sent anywhere in the world in seconds.
              </p>
              <p className="text-gray-700">
                {branding.name} supports <strong>USDC</strong>, <strong>USD1</strong>, and <strong>USDT</strong>. These are not speculative investments — they are dollar-pegged digital cash purpose-built for payments.
              </p>
            </section>

            {/* How Escrow Works */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">How Escrow Works</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm mr-4">1</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">Employer Funds Escrow</h3>
                    <p className="text-gray-700">The employer deposits USDC, USDT, or USD1 into {branding.name}'s escrow smart contract before work begins. Funds are locked and cannot be withdrawn by either party.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm mr-4">2</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">VA Completes Work</h3>
                    <p className="text-gray-700">The VA performs the agreed-upon tasks. Both parties communicate and track deliverables on the platform.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm mr-4">3</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">Employer Approves &amp; Releases</h3>
                    <p className="text-gray-700">Once satisfied, the employer approves the deliverables. The escrow contract instantly releases stablecoins to the VA's wallet.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm mr-4">4</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">VA Cashes Out</h3>
                    <p className="text-gray-700">The VA converts stablecoins to PHP (or their local currency) through a local exchange like Coins.ph, PDAX, or via P2P platforms. See our <Link to="/resources" className="text-blue-600 hover:text-blue-800 underline">Resources page</Link> for where to buy and sell.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Benefits */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Why Stablecoins?</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">Instant Payout</h3>
                  <p className="text-gray-600 text-sm">No 3-5 day wire transfer delay. Funds arrive in seconds once approved.</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">Zero FX Spread</h3>
                  <p className="text-gray-600 text-sm">1 USDC = 1 USD always. No hidden currency conversion fees.</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">Lower Fees</h3>
                  <p className="text-gray-600 text-sm">Typical crypto transfer fees are a fraction of PayPal or wire fees (often under $1).</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">Secure Escrow</h3>
                  <p className="text-gray-600 text-sm">Smart-contract escrow protects both parties — no money moves until deliverables are approved.</p>
                </div>
              </div>
            </section>

            {/* Supported Networks */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Supported Networks</h2>
              <ul className="space-y-2 text-gray-700">
                <li><strong>ERC-20</strong> (Ethereum) — USDC, USDT, USD1</li>
                <li><strong>TRC-20</strong> (Tron) — USDT, USDC</li>
              </ul>
              <p className="text-gray-600 mt-4 text-sm">
                TRC-20 transfers typically have lower fees (~$1) compared to ERC-20 (~$2-$5). For small payments, we recommend TRC-20.
              </p>
            </section>

            {/* Getting Started */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Getting Started</h2>
              <p className="text-gray-700 mb-4">
                To receive stablecoin payments, you need a crypto wallet that supports ERC-20 and TRC-20 tokens. Popular options include:
              </p>
              <ul className="space-y-2">
                <li>
                  <a href="https://metamask.io/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">MetaMask</a>
                  <span className="text-gray-500 ml-2">— ERC-20 wallet (browser extension &amp; mobile)</span>
                </li>
                <li>
                  <a href="https://www.trustwallet.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">Trust Wallet</a>
                  <span className="text-gray-500 ml-2">— ERC-20 and TRC-20 (mobile)</span>
                </li>
                <li>
                  <a href="https://www.exodus.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">Exodus</a>
                  <span className="text-gray-500 ml-2">— Multi-chain desktop &amp; mobile wallet</span>
                </li>
              </ul>
              <p className="text-gray-700 mt-4">
                Need to buy stablecoins? See our <Link to="/resources" className="text-blue-600 hover:text-blue-800 underline">Resources page</Link> for exchange recommendations in the US and Philippines.
              </p>
            </section>

            {/* Disclaimer */}
            <section className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Disclaimer:</strong> Stablecoin payments carry regulatory considerations that vary by jurisdiction. {branding.name} facilitates escrow but does not provide financial advice. Always consult a qualified advisor regarding tax obligations and regulatory compliance in your country.
              </p>
            </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
