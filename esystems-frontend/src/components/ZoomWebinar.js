import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MeetingProvider, useMeeting, useParticipant } from '@videosdk.live/react-sdk';
import ReactPlayer from 'react-player';

// Individual participant component
const ParticipantView = ({ participantId }) => {
  const micRef = useRef(null);
  const { webcamStream, micStream, webcamOn, micOn, isLocal, displayName } = useParticipant(participantId);

  const videoStream = useMemo(() => {
    if (webcamOn && webcamStream) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(webcamStream.track);
      return mediaStream;
    }
  }, [webcamStream, webcamOn]);

  useEffect(() => {
    if (micRef.current) {
      if (micOn && micStream) {
        const mediaStream = new MediaStream();
        mediaStream.addTrack(micStream.track);
        micRef.current.srcObject = mediaStream;
        micRef.current
          .play()
          .catch((error) => console.error('Audio play failed', error));
      } else {
        micRef.current.srcObject = null;
      }
    }
  }, [micStream, micOn]);

  return (
    <div className="participant-container relative bg-gray-900 rounded-lg overflow-hidden" style={{ minHeight: '200px' }}>
      <audio ref={micRef} autoPlay playsInline muted={isLocal} />
      
      {webcamOn && videoStream ? (
        <ReactPlayer
          playsinline
          pip={false}
          light={false}
          controls={false}
          muted={true}
          playing={true}
          url={videoStream}
          width="100%"
          height="100%"
          style={{ borderRadius: '8px' }}
          onError={(err) => console.log(err, 'participant video error')}
        />
      ) : (
        <div className="flex items-center justify-center h-full bg-gray-800 text-white">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-xl font-semibold">
                {displayName?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <p className="text-sm text-gray-300">{displayName || 'Participant'}</p>
          </div>
        </div>
      )}
      
      {/* Participant info overlay */}
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
        {displayName || 'Participant'} {isLocal && '(You)'}
      </div>
      
      {/* Mic status indicator */}
      <div className="absolute top-2 right-2">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${micOn ? 'bg-green-500' : 'bg-red-500'}`}>
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            {micOn ? (
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            ) : (
              <path fillRule="evenodd" d="M13.1 2.7a3 3 0 011.9 2.8v2.5c0 .4.3.7.7.7s.7-.3.7-.7V5.5c0-2.2-1.8-4-4-4-.4 0-.7.3-.7.7s.3.5.4.5zm3.6 13l-2.8-2.8c-.8.5-1.7.8-2.7.8-2.8 0-5-2.2-5-5v-.5l-1.4-1.4c-.3.6-.4 1.2-.4 1.9 0 3.3 2.7 6 6 6 1.1 0 2.1-.3 3-.8l1.5 1.5c.1.1.2.2.4.2s.3-.1.4-.2c.2-.2.2-.5 0-.7zM8.4 4.2l6.4 6.4V5.5c0-1.7-1.3-3-3-3-1 0-1.9.5-2.4 1.2-.2.3-.1.7.2.9s.7.1.9-.2c.2-.3.6-.5 1-.5.8 0 1.5.7 1.5 1.5v4.5l-4.6-4.7z" clipRule="evenodd" />
            )}
          </svg>
        </div>
      </div>
    </div>
  );
};

// Meeting controls component
const MeetingControls = ({ onLeave }) => {
  const { leave, toggleMic, toggleWebcam, micOn, webcamOn } = useMeeting();

  const handleLeave = () => {
    leave();
    if (onLeave) onLeave();
  };

  return (
    <div className="flex justify-center space-x-4 p-4 bg-gray-800 rounded-lg">
      <button
        onClick={toggleMic}
        className={`p-3 rounded-full transition-colors ${
          micOn ? 'bg-gray-600 hover:bg-gray-700' : 'bg-red-600 hover:bg-red-700'
        } text-white`}
        title={micOn ? 'Mute' : 'Unmute'}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          {micOn ? (
            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
          ) : (
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0L18.485 7.757a1 1 0 010 1.414L17.071 10.585a1 1 0 11-1.414-1.414L16.243 8.757 15.657 8.171a1 1 0 010-1.414z" clipRule="evenodd" />
          )}
        </svg>
      </button>

      <button
        onClick={toggleWebcam}
        className={`p-3 rounded-full transition-colors ${
          webcamOn ? 'bg-gray-600 hover:bg-gray-700' : 'bg-red-600 hover:bg-red-700'
        } text-white`}
        title={webcamOn ? 'Turn off camera' : 'Turn on camera'}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          {webcamOn ? (
            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
          ) : (
            <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06L3.28 2.22zM4 6.5V4a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V6.5z" clipRule="evenodd" />
          )}
        </svg>
      </button>

      <button
        onClick={handleLeave}
        className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
        title="Leave meeting"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 6.707 6.293a1 1 0 00-1.414 1.414L8.586 11l-3.293 3.293a1 1 0 001.414 1.414L10 12.414l3.293 3.293a1 1 0 001.414-1.414L11.414 11l3.293-3.293z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

// Main meeting view component
const MeetingView = ({ onLeave }) => {
  const [joined, setJoined] = useState(false);
  const { join, participants, meetingId } = useMeeting({
    onMeetingJoined: () => {
      setJoined(true);
      console.log('Meeting joined successfully');
    },
    onMeetingLeft: () => {
      setJoined(false);
      console.log('Meeting left successfully');
      if (onLeave) onLeave();
    }
  });

  const participantIds = [...participants.keys()];

  const joinMeeting = () => {
    join();
  };

  if (!joined) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Ready to Join Training?
          </h3>
          <p className="text-gray-600 mb-4">
            Click below to join the live video session
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Meeting ID: {meetingId}
          </p>
        </div>
        
        <button
          onClick={joinMeeting}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Join Meeting
        </button>
      </div>
    );
  }

  return (
    <div className="videosdk-meeting-container">
      {/* Participants Grid */}
      <div className={`grid gap-4 mb-4 ${
        participantIds.length === 1 ? 'grid-cols-1' :
        participantIds.length === 2 ? 'grid-cols-2' :
        participantIds.length <= 4 ? 'grid-cols-2' :
        'grid-cols-3'
      }`} style={{ minHeight: '400px' }}>
        {participantIds.map((participantId) => (
          <ParticipantView
            key={participantId}
            participantId={participantId}
          />
        ))}
      </div>

      {/* Meeting Controls */}
      <MeetingControls onLeave={onLeave} />
    </div>
  );
};

// Main VideoSDK component
const VideoSDKMeeting = ({ meetingConfig, onLeave, className = '' }) => {
  const [error, setError] = useState(null);

  if (!meetingConfig) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <p className="text-gray-500">No meeting configuration provided</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-red-50 rounded-lg border border-red-200">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Connection Error
          </h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => setError(null)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`videosdk-container ${className}`}>
      <MeetingProvider
        config={{
          meetingId: meetingConfig.roomId,
          micEnabled: true,
          webcamEnabled: true,
          name: meetingConfig.participantName || 'Participant'
        }}
        token={meetingConfig.token}
        joinWithoutUserInteraction={false}
      >
        <MeetingView onLeave={onLeave} />
      </MeetingProvider>
    </div>
  );
};

export default VideoSDKMeeting;