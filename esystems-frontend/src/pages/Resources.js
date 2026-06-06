import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useBranding } from '../contexts/BrandingContext';

const usStablecoinResources = [
  {
    name: 'Coinbase',
    href: 'https://www.coinbase.com/how-to-buy/usdc',
    detail: 'USDC with USD funding options; review fees and limits in the trade preview before purchase.',
  },
  {
    name: 'Kraken',
    href: 'https://support.kraken.com/articles/stablecoins-supported-on-kraken',
    detail: 'Publishes supported stablecoins and networks for USDC, USDT, and other digital dollars.',
  },
  {
    name: 'Crypto.com US',
    href: 'https://crypto.com/us/crypto/buy',
    detail: 'US app option for buying USDC and other supported assets with USD funding methods.',
  },
  {
    name: 'Gemini',
    href: 'https://support.gemini.com/hc/en-us/articles/115005868106-What-cryptos-are-supported-on-the-Gemini-Exchange',
    detail: 'Lists current stablecoin availability, including location-specific restrictions.',
  },
];

const phStablecoinResources = [
  {
    name: 'Coins.ph',
    href: 'https://support.coins.ph/hc/en-us/articles/900006877303-What-cryptocurrencies-are-available-on-Coins-ph',
    detail: 'Philippines wallet and exchange with USDC and USDT support plus local PHP funding paths.',
  },
  {
    name: 'PDAX',
    href: 'https://support.pdax.ph/support/solutions/articles/1060000097297-what-cryptocurrencies-are-listed-on-pdax-',
    detail: 'Local exchange option with USDC and USDT listed among supported assets.',
  },
  {
    name: 'GCrypto via GCash',
    href: 'https://help.gcash.com/hc/en-us/articles/9781218166041-What-coins-can-I-trade-in-GCrypto',
    detail: 'GCash in-app crypto route with USDC and USDT listed on supported networks.',
  },
  {
    name: 'Maya Crypto',
    href: 'https://www.maya.ph/crypto',
    detail: 'Maya in-app crypto route; verify the current stablecoin list and availability before use.',
  },
];

const stablecoinChecks = [
  'Confirm the ticker before buying: USDC, USDT, or USD1.',
  'Confirm the transfer network before sending. Wrong-network transfers may be unrecoverable.',
  'Send a small test transfer before moving a large balance.',
  'Keep receipts, transaction hashes, and platform confirmations.',
];

export default function Resources() {
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
        <title>Resources - {branding.name}</title>
        <meta name="description" content="Resources for Filipino VAs and US employers: business registration guides, contract templates, and where to buy stablecoins for payments." />
      </Helmet>

      <div className="bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Resources</h1>
            <p className="text-lg text-gray-600 mb-10">
              Everything you need to get started — from registering your business in the Philippines to setting up stablecoin payments.
            </p>

            {/* Filipino DTI Route */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Filipino DTI Route</h2>
              <p className="text-gray-700 mb-4">
                If you are a Filipino freelancer or sole proprietor, you can register your business with the Department of Trade and Industry (DTI). This is the simplest route for individual VAs and small businesses.
              </p>
              <ul className="space-y-2">
                <li>
                  <a href="https://bnrs.dti.gov.ph/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                    DTI Business Name Registration System (BNRS)
                  </a>
                  <span className="text-gray-500 ml-2">— Register your business name online</span>
                </li>
                <li>
                  <a href="https://www.dti.gov.ph/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                    DTI Official Website
                  </a>
                  <span className="text-gray-500 ml-2">— Requirements, fees, and step-by-step guides</span>
                </li>
                <li>
                  <a href="https://www.bir.gov.ph/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                    Bureau of Internal Revenue (BIR)
                  </a>
                  <span className="text-gray-500 ml-2">— TIN registration and tax filing</span>
                </li>
              </ul>
            </section>

            {/* Contracts & Templates */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contracts &amp; Templates</h2>
              <p className="text-gray-700 mb-4">
                Use these resources to draft professional agreements between employers and virtual assistants. Always review with a qualified attorney for your specific jurisdiction.
              </p>
              <ul className="space-y-2">
                <li>
                  <a href="https://www.dole.gov.ph/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                    Department of Labor and Employment (DOLE)
                  </a>
                  <span className="text-gray-500 ml-2">— Philippine labor laws and contractor guidelines</span>
                </li>
                <li>
                  <a href="https://www.lawphil.net/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                    LawPhil Project
                  </a>
                  <span className="text-gray-500 ml-2">— Full text of Philippine laws and statutes</span>
                </li>
              </ul>
            </section>

            {/* Where to Buy Stablecoins */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Where to Buy Stablecoins</h2>
              <p className="text-gray-700 mb-4">
                Stablecoins are digital dollars intended to track the US Dollar. {branding.name} uses stablecoins (USDC, USDT, and USD1) for escrow payments because they can support faster cross-border settlement and reduce foreign-exchange friction compared with traditional remittance rails. Stablecoins are <strong>not</strong> cryptocurrency speculation — they are dollar-pegged digital cash designed for payments.
              </p>
              <p className="text-gray-700 mb-6">
                {branding.name} supports <strong>USDC</strong>, <strong>USD1</strong>, and <strong>USDT</strong> (ERC-20 and TRC-20 networks). For the full escrow payment explanation, see our{' '}
                <Link to="/payments" className="text-blue-600 hover:text-blue-800 underline">Payments page</Link>.
              </p>

              <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Before you transfer</h3>
                <ul className="space-y-2">
                  {stablecoinChecks.map((check) => (
                    <li key={check} className="flex items-start">
                      <span className="text-blue-500 mr-2 mt-1">&#9679;</span>
                      <span className="text-gray-700">{check}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">For U.S. Employers</h3>
                <ul className="space-y-3">
                  {usStablecoinResources.map((resource) => (
                    <li key={resource.name} className="flex items-start">
                      <span className="text-blue-500 mr-2 mt-1">&#9679;</span>
                      <div>
                        <a href={resource.href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-medium underline">
                          {resource.name}
                        </a>
                        <span className="text-gray-500 ml-2">— {resource.detail}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">For Filipino VAs</h3>
                <ul className="space-y-3">
                  {phStablecoinResources.map((resource) => (
                    <li key={resource.name} className="flex items-start">
                      <span className="text-blue-500 mr-2 mt-1">&#9679;</span>
                      <div>
                        <a href={resource.href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-medium underline">
                          {resource.name}
                        </a>
                        <span className="text-gray-500 ml-2">— {resource.detail}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Disclaimer */}
            <section className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Disclaimer:</strong> Stablecoins and cryptocurrency carry regulatory considerations that vary by jurisdiction. The platforms listed above are provided for informational purposes only and do not constitute financial advice or an endorsement. {branding.name} is not affiliated with any of these platforms. Always do your own research and consult with a qualified financial advisor before purchasing or transacting in stablecoins.
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
