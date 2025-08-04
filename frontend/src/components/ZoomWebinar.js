import React, { useState, useEffect, useRef } from 'react';
import ZoomMtgEmbedded from '@zoom/meetingsdk/embedded';

const ZoomWebinar = ({ webinarConfig, onLeave, className = '' }) => {
  const [client, setClient] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const meetingRef = useRef(null);

  useEffect(() => {
    // Initialize Zoom SDK client
    const zmClient = ZoomMtgEmbedded.createClient();
    setClient(zmClient);

    return () => {
      // Cleanup on unmount
      if (zmClient && isJoined) {
        zmClient.leave();
      }
    };
  }, [isJoined]);

  const joinWebinar = async () => {
    if (!client || !webinarConfig) return;

    setIsLoading(true);
    setError(null);

    try {
      // Initialize the SDK
      await client.init({
        zoomAppRoot: meetingRef.current,
        language: 'en-US',
        customize: {
          meetingInfo: [
            'topic',
            'host',
            'mn',
            'pwd',
            'telPwd',
            'invite',
            'participant',
            'dc',
            'enctype'
          ],
          toolbar: {
            buttons: [
              {
                text: 'Custom Button',
                className: 'CustomButton',
                onClick: () => {
                  console.log('Custom button clicked');
                }
              }
            ]
          }
        }
      });

      // Join the webinar
      await client.join({
        sdkKey: webinarConfig.sdkKey,
        signature: webinarConfig.signature,
        meetingNumber: webinarConfig.meetingNumber,
        password: webinarConfig.password,
        userName: webinarConfig.userName || 'Participant',
        userEmail: webinarConfig.userEmail || '',
        tk: webinarConfig.registrantToken || ''
      });

      setIsJoined(true);
      console.log('Successfully joined webinar');

    } catch (err) {
      console.error('Error joining webinar:', err);
      setError(`Failed to join webinar: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const leaveWebinar = async () => {
    if (client && isJoined) {
      try {
        await client.leave();
        setIsJoined(false);
        console.log('Left webinar successfully');
        if (onLeave) {
          onLeave();
        }
      } catch (err) {
        console.error('Error leaving webinar:', err);
      }
    }
  };

  if (!webinarConfig) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <p className="text-gray-500">No webinar configuration provided</p>
      </div>
    );
  }

  return (
    <div className={`zoom-webinar-container ${className}`}>
      {!isJoined ? (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Ready to Join Training?
            </h3>
            <p className="text-gray-600 mb-4">
              Click below to join the live webinar session
            </p>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
          </div>
          
          <button
            onClick={joinWebinar}
            disabled={isLoading}
            className={`px-6 py-3 bg-blue-600 text-white rounded-lg font-medium transition-colors ${
              isLoading 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Joining...
              </div>
            ) : (
              'Join Webinar'
            )}
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute top-2 right-2 z-10">
            <button
              onClick={leaveWebinar}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Leave
            </button>
          </div>
          <div
            ref={meetingRef}
            className="zoom-meeting-container"
            style={{ 
              width: '100%', 
              height: '600px',
              borderRadius: '8px',
              overflow: 'hidden'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ZoomWebinar;