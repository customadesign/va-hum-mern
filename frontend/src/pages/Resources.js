import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
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

const ResourceList = ({ title, resources }) => (
  <section className="mb-10">
    <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
    <ul className="space-y-4">
      {resources.map((resource) => (
        <li key={resource.name} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <a
            href={resource.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 font-semibold underline"
          >
            {resource.name}
          </a>
          <p className="mt-2 text-gray-600">{resource.detail}</p>
        </li>
      ))}
    </ul>
  </section>
);

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
        <meta
          name="description"
          content="Stablecoin purchase resources for US employers and Filipino virtual assistants using Linkage VA Hub."
        />
      </Helmet>

      <div className="bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Resources</h1>
            <p className="text-lg text-gray-600 mb-10">
              Stablecoin purchase resources for US employers and Filipino VAs using Linkage escrow.
              Use these links as starting points, then verify current asset support, fees, limits,
              transfer networks, and regional eligibility directly with each provider.
            </p>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Where to Buy Stablecoins</h2>
              <p className="text-gray-700 mb-4">
                Stablecoins are digital dollars intended to track the US Dollar. {branding.name} uses
                stablecoins such as <strong>USDC</strong>, <strong>USDT</strong>, and <strong>USD1</strong>
                for escrow payment workflows because they can support faster cross-border settlement
                and reduce foreign-exchange friction compared with traditional remittance rails.
              </p>
              <p className="text-gray-700 mb-6">
                Stablecoins are not cryptocurrency speculation in this workflow. They are
                dollar-pegged digital cash used for payments, but availability, networks, fees, and
                regulations change by provider and jurisdiction.
              </p>

              <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-lg">
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
            </section>

            <ResourceList title="For U.S. Employers" resources={usStablecoinResources} />
            <ResourceList title="For Filipino VAs" resources={phStablecoinResources} />

            <section className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Disclaimer:</strong> Stablecoins and cryptocurrency carry regulatory
                considerations that vary by jurisdiction. The platforms listed above are provided
                for informational purposes only and do not constitute financial advice or an
                endorsement. {branding.name} is not affiliated with these providers. Always do your
                own research and consult a qualified advisor before purchasing or transacting in
                stablecoins.
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
