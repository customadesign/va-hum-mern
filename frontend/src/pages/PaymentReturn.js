import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

// HMAC verification utilities (client-side verification for UX only)
const createHmac = async (data, salt) => {
  // Note: This is for display purposes only. Real verification happens server-side.
  const sortedPairs = [];
  
  Object.keys(data)
    .filter(key => key !== 'hmac')
    .sort()
    .forEach(key => {
      const value = data[key];
      if (Array.isArray(value)) {
        value.forEach(item => sortedPairs.push(`${key}=${item}`));
      } else if (value !== null && value !== undefined) {
        sortedPairs.push(`${key}=${value}`);
      }
    });

  const canonical = sortedPairs.join('&');
  
  // Use Web Crypto API for HMAC (modern browsers)
  if (window.crypto && window.crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(salt);
      const messageData = encoder.encode(canonical);
      
      const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      
      const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, messageData);
      const hashArray = Array.from(new Uint8Array(signature));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      return { computed: hashHex, canonical };
    } catch (error) {
      console.warn('Web Crypto API failed, using fallback');
    }
  }
  
  // Fallback: return canonical string only (for display)
  return { computed: 'verification-unavailable', canonical };
};

const PaymentReturn = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [verificationResult, setVerificationResult] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyAndLoadPayment = async () => {
      try {
        // Parse query parameters
        const searchParams = new URLSearchParams(location.search);
        const queryData = {};
        
        for (const [key, value] of searchParams.entries()) {
          queryData[key] = value;
        }

        console.log('[PaymentReturn] Query parameters:', queryData);

        // Check if we have the necessary parameters
        if (!queryData.hmac) {
          setError({
            type: 'missing_hmac',
            title: 'Invalid Return URL',
            message: 'This payment return URL is missing security verification',
            actionable: 'Please contact support if you reached this page after making a payment'
          });
          setLoading(false);
          return;
        }

        // Client-side HMAC verification (for display only - server should verify)
        const apiSalt = 'client-display-only'; // This would need to be fetched securely
        const hmacResult = await createHmac(queryData, apiSalt);
        
        setVerificationResult({
          provided: queryData.hmac,
          computed: hmacResult.computed,
          canonical: hmacResult.canonical,
          valid: hmacResult.computed === queryData.hmac, // Only for display
          note: 'Client-side verification for display only. Server performs real verification.'
        });

        // Try to fetch payment details from backend
        const paymentId = queryData.payment_id || queryData.id || queryData.payment_request_id;
        const reference = queryData.reference_number;

        if (paymentId) {
          try {
            const response = await fetch(`/api/hitpay/payments/${paymentId}`, {
              headers: { 'Accept': 'application/json' }
            });

            if (response.ok) {
              const result = await response.json();
              if (result.ok && result.payment) {
                setPaymentData(result.payment);
                console.log('[PaymentReturn] Payment data loaded:', result.payment);
              }
            } else {
              console.log('[PaymentReturn] Payment not found in backend store');
            }
          } catch (fetchError) {
            console.log('[PaymentReturn] Could not fetch payment data:', fetchError.message);
          }
        }

        // Set payment info from query params if no backend data
        if (!paymentData) {
          setPaymentData({
            id: paymentId || 'unknown',
            reference_number: reference || 'unknown',
            status: queryData.status || 'unknown',
            amount: queryData.amount || 'unknown',
            currency: queryData.currency || 'unknown',
            from_query: true
          });
        }

      } catch (error) {
        console.error('[PaymentReturn] Error processing return:', error);
        setError({
          type: 'processing_error',
          title: 'Unable to Process Return',
          message: 'An error occurred while processing your payment return',
          details: error.message,
          actionable: 'Please contact support with your payment details'
        });
      } finally {
        setLoading(false);
      }
    };

    verifyAndLoadPayment();
  }, [location.search]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return '#16a34a';
      case 'failed': return '#dc2626';
      case 'cancelled': return '#ea580c';
      case 'pending': return '#ca8a04';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'cancelled': return '⏹️';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  const getStatusMessage = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': 
        return {
          title: 'Payment Successful!',
          message: 'Your webinar registration is confirmed. Check your email for joining instructions.',
          actionable: 'Add the webinar to your calendar and join 10 minutes early to test your setup.'
        };
      case 'failed':
        return {
          title: 'Payment Failed',
          message: 'Your payment could not be processed.',
          actionable: 'Please try registering again or contact support for assistance.'
        };
      case 'cancelled':
        return {
          title: 'Payment Cancelled',
          message: 'You cancelled the payment process.',
          actionable: 'You can try registering again if you want to join the webinar.'
        };
      case 'pending':
        return {
          title: 'Payment Processing',
          message: 'Your payment is being processed.',
          actionable: 'Please wait a few minutes and refresh this page, or check your email for updates.'
        };
      default:
        return {
          title: 'Payment Status Unknown',
          message: 'We could not determine your payment status.',
          actionable: 'Please contact support with your payment reference number.'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing your payment return...</p>
        </div>
      </div>
    );
  }

  const statusInfo = paymentData ? getStatusMessage(paymentData.status) : null;

  return (
    <>
      <Helmet>
        <title>Payment Return | Linkage VA Hub</title>
        <meta name="description" content="Payment processing result for Linkage VA Hub webinar registration" />
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Payment Return</h1>
            <p className="text-gray-600 mt-2">Processing your webinar registration payment</p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-8 bg-red-50 border-2 border-red-200 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <div className="text-2xl">❌</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-900 mb-2">{error.title}</h3>
                  <p className="text-red-800 mb-2">{error.message}</p>
                  {error.details && (
                    <p className="text-red-700 text-sm mb-3">Details: {error.details}</p>
                  )}
                  {error.actionable && (
                    <div className="bg-red-100 border border-red-300 rounded-md p-3">
                      <p className="text-red-900 text-sm font-medium">
                        💡 {error.actionable}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Payment Status */}
          {paymentData && statusInfo && (
            <div className="mb-8 bg-white rounded-lg shadow-lg border-2 border-gray-200 overflow-hidden">
              <div 
                className="px-6 py-4 text-white"
                style={{ backgroundColor: getStatusColor(paymentData.status) }}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getStatusIcon(paymentData.status)}</span>
                  <div>
                    <h2 className="text-xl font-bold">{statusInfo.title}</h2>
                    <p className="text-sm opacity-90">{statusInfo.message}</p>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Payment ID</label>
                    <p className="text-sm text-gray-900 font-mono">{paymentData.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Reference Number</label>
                    <p className="text-sm text-gray-900 font-mono">{paymentData.reference_number}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Amount</label>
                    <p className="text-sm text-gray-900">
                      {paymentData.currency} {Number(paymentData.amount).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <p className="text-sm font-semibold" style={{ color: getStatusColor(paymentData.status) }}>
                      {paymentData.status?.toUpperCase()}
                    </p>
                  </div>
                </div>

                {statusInfo.actionable && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <p className="text-blue-900 text-sm font-medium">
                      💡 {statusInfo.actionable}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* HMAC Verification Details (for debugging) */}
          {verificationResult && (
            <div className="mb-8 bg-white rounded-lg shadow border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Verification</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">
                    {verificationResult.valid ? '✅' : '❌'}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">
                      HMAC Verified: {verificationResult.valid ? 'YES' : 'NO'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {verificationResult.note}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="font-medium text-gray-700">Provided HMAC</label>
                    <p className="font-mono text-gray-600 break-all">
                      {verificationResult.provided || '—'}
                    </p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-700">Computed HMAC</label>
                    <p className="font-mono text-gray-600 break-all">
                      {verificationResult.computed}
                    </p>
                  </div>
                </div>

                {verificationResult.canonical && (
                  <div>
                    <label className="font-medium text-gray-700">Canonical String</label>
                    <div className="mt-2 bg-gray-100 rounded-md p-3">
                      <code className="text-xs text-gray-800 whitespace-pre-wrap">
                        {verificationResult.canonical}
                      </code>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment History (if available from backend) */}
          {paymentData && paymentData.history && paymentData.history.length > 0 && (
            <div className="mb-8 bg-white rounded-lg shadow border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
              <div className="space-y-3">
                {paymentData.history.map((event, index) => (
                  <div key={index} className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                    <div className="flex-1">
                      <span className="font-medium">{event.status?.toUpperCase()}</span>
                      <span className="text-gray-600 ml-2">— {event.source}</span>
                      {event.note && <span className="text-gray-500 ml-2">({event.note})</span>}
                    </div>
                    <div className="text-gray-500">
                      {new Date(event.at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="text-center space-y-4">
            <div className="space-x-4">
              <button
                onClick={() => navigate('/community')}
                className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                ← Back to Community
              </button>
              
              {paymentData?.status === 'completed' && (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Go to Dashboard →
                </button>
              )}
            </div>

            <div className="text-sm text-gray-600">
              <p>Questions about your payment? Contact support at support@linkagevahub.com</p>
            </div>
          </div>

          {/* Important Notes */}
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">Important Notes:</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• This return page verification is for user experience only</li>
              <li>• Webhooks are the authoritative source of payment status</li>
              <li>• If HMAC verification fails, do not trust the displayed status</li>
              <li>• Payment confirmation emails will be sent separately</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentReturn;