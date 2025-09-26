import React from 'react';
import { 
  ShieldCheckIcon, 
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ScaleIcon
} from '@heroicons/react/24/outline';

const TermsOfService = ({ isOpen, onClose, onAccept, accepted, setAccepted }) => {
  if (!isOpen) return null;

  const handleAcceptChange = (e) => {
    setAccepted(e.target.checked);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:p-6">
          {/* Header */}
          <div className="border-b border-gray-200 pb-4 mb-4">
            <div className="flex items-center">
              <ScaleIcon className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Terms of Service & No Refund Policy
                </h3>
                <p className="mt-1 text-sm text-gray-700">
                  Please read carefully before proceeding with your purchase
                </p>
              </div>
            </div>
          </div>

          {/* Terms Content */}
          <div className="max-h-96 overflow-y-auto space-y-6 mb-6">
            {/* Critical Notice */}
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mt-1" />
                <div className="ml-3">
                  <h4 className="text-lg font-bold text-red-900">
                    IMPORTANT: NO REFUNDS POLICY
                  </h4>
                  <div className="mt-2 text-sm text-red-800 space-y-2">
                    <p className="font-semibold">
                      ALL SALES ARE FINAL. ABSOLUTELY NO REFUNDS WILL BE PROVIDED UNDER ANY CIRCUMSTANCES.
                    </p>
                    <p>
                      By purchasing this trial, you acknowledge and agree that:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>This is a non-refundable purchase</li>
                      <li>You will not request a refund for any reason</li>
                      <li>You will not initiate a chargeback or dispute</li>
                      <li>You have evaluated the service and accept it as-is</li>
                      <li>No exceptions will be made to this policy</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Terms */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <DocumentTextIcon className="h-6 w-6 text-blue-600 mt-1" />
                <div className="ml-3">
                  <h4 className="text-lg font-semibold text-blue-900">
                    Trial Service Terms
                  </h4>
                  <div className="mt-2 text-sm text-gray-700 space-y-2">
                    <p><strong>1. Service Description:</strong></p>
                    <p className="ml-4">
                      You are purchasing a 10-hour trial of virtual assistant services. Hours must be used within 30 days of purchase.
                    </p>
                    
                    <p><strong>2. Service Availability:</strong></p>
                    <p className="ml-4">
                      Services are provided on an as-available basis during business hours. We do not guarantee immediate availability.
                    </p>
                    
                    <p><strong>3. Scope of Work:</strong></p>
                    <p className="ml-4">
                      Virtual assistant will perform tasks within their skill set. Client is responsible for providing clear instructions.
                    </p>
                    
                    <p><strong>4. Time Tracking:</strong></p>
                    <p className="ml-4">
                      Time is tracked in minimum increments of 15 minutes. Unused hours expire after 30 days with no refund.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Legal Disclaimer */}
            <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
              <div className="flex">
                <ShieldCheckIcon className="h-6 w-6 text-gray-700 mt-1" />
                <div className="ml-3">
                  <h4 className="text-lg font-semibold text-gray-900">
                    Legal Disclaimer & Liability
                  </h4>
                  <div className="mt-2 text-sm text-gray-700 space-y-2">
                    <p><strong>Chargeback Protection:</strong></p>
                    <p className="ml-4">
                      By accepting these terms, you agree not to initiate any chargeback, dispute, claim, or reversal of payment. 
                      Any attempt to do so will be considered a breach of contract and may result in:
                    </p>
                    <ul className="list-disc list-inside ml-6 space-y-1">
                      <li>Legal action to recover the full amount plus fees</li>
                      <li>Collection agency involvement</li>
                      <li>Reporting to credit bureaus</li>
                      <li>Recovery of all legal costs and attorney fees</li>
                      <li>Additional damages as permitted by law</li>
                    </ul>
                    
                    <p className="mt-3"><strong>Limitation of Liability:</strong></p>
                    <p className="ml-4">
                      Our total liability shall not exceed the amount paid for the trial. We are not liable for any indirect, 
                      incidental, special, or consequential damages.
                    </p>
                    
                    <p className="mt-3"><strong>Indemnification:</strong></p>
                    <p className="ml-4">
                      You agree to indemnify and hold us harmless from any claims, damages, or expenses arising from your use 
                      of the services or violation of these terms.
                    </p>
                    
                    <p className="mt-3"><strong>Governing Law:</strong></p>
                    <p className="ml-4">
                      These terms are governed by the laws of the jurisdiction in which we operate. Any disputes shall be 
                      resolved through binding arbitration.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Acknowledgment */}
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
              <p className="text-sm font-semibold text-yellow-900">
                By checking the box below and proceeding with payment, you:
              </p>
              <ul className="mt-2 text-sm text-yellow-800 list-disc list-inside space-y-1">
                <li>Confirm you have read and understood all terms</li>
                <li>Agree to the no-refund policy without exception</li>
                <li>Waive any right to dispute or chargeback</li>
                <li>Accept full responsibility for this purchase decision</li>
                <li>Acknowledge this is a binding legal agreement</li>
              </ul>
            </div>
          </div>

          {/* Acceptance Checkbox */}
          <div className="border-t border-gray-200 pt-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={handleAcceptChange}
                  className="mt-1 h-5 w-5 text-blue-600 border-2 border-gray-400 rounded focus:ring-blue-500"
                />
                <span className="ml-3 text-sm">
                  <span className="font-bold text-gray-900">
                    I have read, understood, and agree to all terms and conditions, especially the NO REFUND policy.
                  </span>
                  <span className="block mt-1 text-gray-700">
                    I understand this is a final sale and I will not request a refund or initiate a chargeback under any circumstances.
                  </span>
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onAccept}
                disabled={!accepted}
                className={`px-6 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  accepted 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                I Agree - Proceed to Payment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
