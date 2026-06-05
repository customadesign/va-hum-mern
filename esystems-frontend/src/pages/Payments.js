import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useBranding } from '../contexts/BrandingContext';

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
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">How Payments Work</h1>
            <p className="text-lg text-gray-600 mb-10">
              {branding.name} uses stablecoin escrow payments so VAs get paid instantly — no waiting for wire transfers, no PayPal holds, and no hidden FX spreads.
            </p>

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
    </>
  );
}