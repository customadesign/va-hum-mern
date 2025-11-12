import { useState, useEffect } from 'react';
import ScrollExpandMedia from './scroll-expansion-hero';

const sampleMediaContent = {
  video: {
    // Using a sample video URL - you can replace with your own
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    poster: 'https://images.unsplash.com/photo-1536240478700-b869070f9279',
    background: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1920&auto=format&fit=crop',
    title: 'Immersive Video Experience',
    date: 'Cosmic Journey',
    scrollToExpand: 'Scroll to Expand Demo',
    about: {
      overview:
        'This is a demonstration of the ScrollExpandMedia component with a video. As you scroll, the video expands to fill more of the screen, creating an immersive experience. This component is perfect for showcasing video content in a modern, interactive way.',
      conclusion:
        'The ScrollExpandMedia component provides a unique way to engage users with your content through interactive scrolling. Try switching between video and image modes to see different implementations.',
    },
  },
  image: {
    src: 'https://images.unsplash.com/photo-1682687982501-1e58ab814714?q=80&w=1280&auto=format&fit=crop',
    background: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1920&auto=format&fit=crop',
    title: 'Dynamic Image Showcase',
    date: 'Nature Adventure',
    scrollToExpand: 'Scroll to Expand Demo',
    about: {
      overview:
        'This is a demonstration of the ScrollExpandMedia component with an image. The same smooth expansion effect works beautifully with static images, allowing you to create engaging visual experiences without video content.',
      conclusion:
        'The ScrollExpandMedia component works equally well with images and videos. This flexibility allows you to choose the media type that best suits your content while maintaining the same engaging user experience.',
    },
  },
  // Additional YouTube example
  youtube: {
    src: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    background: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=1920&auto=format&fit=crop',
    title: 'YouTube Integration',
    date: 'Video Streaming',
    scrollToExpand: 'Scroll to Expand YouTube',
    about: {
      overview:
        'This demonstrates the YouTube integration capability. The component automatically handles YouTube URLs and embeds them with proper autoplay and loop settings.',
      conclusion:
        'YouTube videos can be easily integrated by simply providing the YouTube URL. The component handles the rest automatically.',
    },
  },
};

const MediaContent = ({ mediaType }) => {
  const currentMedia = sampleMediaContent[mediaType];

  return (
    <div className='max-w-4xl mx-auto'>
      <h2 className='text-3xl font-bold mb-6 text-gray-900 dark:text-white'>
        About This Component
      </h2>
      <p className='text-lg mb-8 text-gray-700 dark:text-gray-300'>
        {currentMedia.about.overview}
      </p>

      <div className='grid md:grid-cols-2 gap-8 mb-8'>
        <div className='bg-gray-100 dark:bg-gray-800 p-6 rounded-lg'>
          <h3 className='text-xl font-semibold mb-3 text-gray-900 dark:text-white'>
            Key Features
          </h3>
          <ul className='space-y-2 text-gray-700 dark:text-gray-300'>
            <li>• Smooth scroll-based expansion</li>
            <li>• Touch-enabled for mobile devices</li>
            <li>• YouTube video support</li>
            <li>• Lazy loading for performance</li>
            <li>• Responsive design</li>
          </ul>
        </div>
        <div className='bg-gray-100 dark:bg-gray-800 p-6 rounded-lg'>
          <h3 className='text-xl font-semibold mb-3 text-gray-900 dark:text-white'>
            Technical Stack
          </h3>
          <ul className='space-y-2 text-gray-700 dark:text-gray-300'>
            <li>• React 18</li>
            <li>• Framer Motion</li>
            <li>• Tailwind CSS</li>
            <li>• Lazy Load Images</li>
            <li>• Responsive utilities</li>
          </ul>
        </div>
      </div>

      <p className='text-lg text-gray-700 dark:text-gray-300'>
        {currentMedia.about.conclusion}
      </p>
    </div>
  );
};

export const VideoExpansionTextBlend = () => {
  const mediaType = 'video';
  const currentMedia = sampleMediaContent[mediaType];

  useEffect(() => {
    window.scrollTo(0, 0);
    const resetEvent = new Event('resetSection');
    window.dispatchEvent(resetEvent);
  }, []);

  return (
    <div className='min-h-screen bg-white dark:bg-gray-900'>
      <ScrollExpandMedia
        mediaType={mediaType}
        mediaSrc={currentMedia.src}
        posterSrc={currentMedia.poster}
        bgImageSrc={currentMedia.background}
        title={currentMedia.title}
        date={currentMedia.date}
        scrollToExpand={currentMedia.scrollToExpand}
        textBlend
      >
        <MediaContent mediaType={mediaType} />
      </ScrollExpandMedia>
    </div>
  );
};

export const ImageExpansionTextBlend = () => {
  const mediaType = 'image';
  const currentMedia = sampleMediaContent[mediaType];

  useEffect(() => {
    window.scrollTo(0, 0);
    const resetEvent = new Event('resetSection');
    window.dispatchEvent(resetEvent);
  }, []);

  return (
    <div className='min-h-screen bg-white dark:bg-gray-900'>
      <ScrollExpandMedia
        mediaType={mediaType}
        mediaSrc={currentMedia.src}
        bgImageSrc={currentMedia.background}
        title={currentMedia.title}
        date={currentMedia.date}
        scrollToExpand={currentMedia.scrollToExpand}
        textBlend
      >
        <MediaContent mediaType={mediaType} />
      </ScrollExpandMedia>
    </div>
  );
};

export const VideoExpansion = () => {
  const mediaType = 'video';
  const currentMedia = sampleMediaContent[mediaType];

  useEffect(() => {
    window.scrollTo(0, 0);
    const resetEvent = new Event('resetSection');
    window.dispatchEvent(resetEvent);
  }, []);

  return (
    <div className='min-h-screen bg-white dark:bg-gray-900'>
      <ScrollExpandMedia
        mediaType={mediaType}
        mediaSrc={currentMedia.src}
        posterSrc={currentMedia.poster}
        bgImageSrc={currentMedia.background}
        title={currentMedia.title}
        date={currentMedia.date}
        scrollToExpand={currentMedia.scrollToExpand}
      >
        <MediaContent mediaType={mediaType} />
      </ScrollExpandMedia>
    </div>
  );
};

export const ImageExpansion = () => {
  const mediaType = 'image';
  const currentMedia = sampleMediaContent[mediaType];

  useEffect(() => {
    window.scrollTo(0, 0);
    const resetEvent = new Event('resetSection');
    window.dispatchEvent(resetEvent);
  }, []);

  return (
    <div className='min-h-screen bg-white dark:bg-gray-900'>
      <ScrollExpandMedia
        mediaType={mediaType}
        mediaSrc={currentMedia.src}
        bgImageSrc={currentMedia.background}
        title={currentMedia.title}
        date={currentMedia.date}
        scrollToExpand={currentMedia.scrollToExpand}
      >
        <MediaContent mediaType={mediaType} />
      </ScrollExpandMedia>
    </div>
  );
};

export const YouTubeExpansion = () => {
  const mediaType = 'youtube';
  const currentMedia = sampleMediaContent[mediaType];

  useEffect(() => {
    window.scrollTo(0, 0);
    const resetEvent = new Event('resetSection');
    window.dispatchEvent(resetEvent);
  }, []);

  return (
    <div className='min-h-screen bg-white dark:bg-gray-900'>
      <ScrollExpandMedia
        mediaType='video'
        mediaSrc={currentMedia.src}
        bgImageSrc={currentMedia.background}
        title={currentMedia.title}
        date={currentMedia.date}
        scrollToExpand={currentMedia.scrollToExpand}
      >
        <MediaContent mediaType={mediaType} />
      </ScrollExpandMedia>
    </div>
  );
};

const Demo = () => {
  const [mediaType, setMediaType] = useState('video');
  const currentMedia = sampleMediaContent[mediaType];

  useEffect(() => {
    window.scrollTo(0, 0);
    const resetEvent = new Event('resetSection');
    window.dispatchEvent(resetEvent);
  }, [mediaType]);

  return (
    <div className='min-h-screen bg-white dark:bg-gray-900'>
      <div className='fixed top-4 right-4 z-50 flex gap-2'>
        <button
          onClick={() => setMediaType('video')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            mediaType === 'video'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700/50 text-white border border-gray-600 hover:bg-gray-700'
          }`}
        >
          Video
        </button>

        <button
          onClick={() => setMediaType('image')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            mediaType === 'image'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700/50 text-white border border-gray-600 hover:bg-gray-700'
          }`}
        >
          Image
        </button>

        <button
          onClick={() => setMediaType('youtube')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            mediaType === 'youtube'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700/50 text-white border border-gray-600 hover:bg-gray-700'
          }`}
        >
          YouTube
        </button>
      </div>

      <ScrollExpandMedia
        mediaType={mediaType === 'youtube' ? 'video' : mediaType}
        mediaSrc={currentMedia.src}
        posterSrc={mediaType === 'video' ? currentMedia.poster : undefined}
        bgImageSrc={currentMedia.background}
        title={currentMedia.title}
        date={currentMedia.date}
        scrollToExpand={currentMedia.scrollToExpand}
      >
        <MediaContent mediaType={mediaType} />
      </ScrollExpandMedia>
    </div>
  );
};

export default Demo;