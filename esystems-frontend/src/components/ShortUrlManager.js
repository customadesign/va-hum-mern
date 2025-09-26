import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { shortUrlService } from '../services/shortUrlService';
import { 
  ShareIcon, 
  ClipboardDocumentIcon, 
  EyeIcon,
  XMarkIcon,
  CheckIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export default function ShortUrlManager() {
  const queryClient = useQueryClient();
  const [selectedUrl, setSelectedUrl] = useState(null);

  const { data: shortUrls, isLoading } = useQuery(
    'userShortUrls',
    shortUrlService.getUserShortUrls
  );

  const deactivateMutation = useMutation(
    shortUrlService.deactivateShortUrl,
    {
      onSuccess: () => {
        queryClient.invalidateQueries('userShortUrls');
        toast.success('Short URL deactivated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to deactivate short URL');
      }
    }
  );

  const reactivateMutation = useMutation(
    shortUrlService.reactivateShortUrl,
    {
      onSuccess: () => {
        queryClient.invalidateQueries('userShortUrls');
        toast.success('Short URL reactivated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to reactivate short URL');
      }
    }
  );

  const handleCopyUrl = async (url) => {
    try {
      await shortUrlService.copyToClipboard(url);
      toast.success('URL copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy URL');
    }
  };

  const handleShareUrl = async (url, vaName) => {
    try {
      await shortUrlService.shareUrl(
        url,
        `${vaName} - Profile`,
        `Check out ${vaName}'s profile`
      );
      if (!navigator.share) {
        toast.success('URL copied to clipboard!');
      }
    } catch (error) {
      toast.error('Failed to share URL');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!shortUrls?.data?.length) {
    return (
      <div className="text-center py-12">
        <ShareIcon className="mx-auto h-12 w-12 text-gray-700" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No shared profiles</h3>
        <p className="mt-1 text-sm text-gray-700">
          Create shareable links for your profiles to make them easier to share.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Your Shared Profiles</h2>
        <p className="text-sm text-gray-700 mb-6">
          Manage your shareable profile links and track their performance.
        </p>
      </div>

      <div className="grid gap-4">
        {shortUrls.data.map((shortUrl) => (
          <div
            key={shortUrl._id}
            className={`bg-white border rounded-lg p-4 shadow-sm ${
              !shortUrl.isActive ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {shortUrl.vaId?.name || 'Profile'}
                  </h3>
                  {!shortUrl.isActive && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      Inactive
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-700">
                  <div className="flex items-center">
                    <ChartBarIcon className="h-4 w-4 mr-1" />
                    {shortUrl.clicks} clicks
                  </div>
                  <div>
                    Created {format(new Date(shortUrl.createdAt), 'MMM d, yyyy')}
                  </div>
                </div>

                <div className="mt-3 flex items-center space-x-2">
                  <div className="flex-1 bg-gray-50 rounded px-3 py-2">
                    <code className="text-sm text-gray-700 break-all">
                      {`${window.location.origin}/s/${shortUrl.shortCode}`}
                    </code>
                  </div>
                  
                  <button
                    onClick={() => handleCopyUrl(`${window.location.origin}/s/${shortUrl.shortCode}`)}
                    className="p-2 text-gray-700 hover:text-gray-700"
                    title="Copy URL"
                  >
                    <ClipboardDocumentIcon className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => handleShareUrl(
                      `${window.location.origin}/s/${shortUrl.shortCode}`,
                      shortUrl.vaId?.name
                    )}
                    className="p-2 text-gray-700 hover:text-gray-700"
                    title="Share URL"
                  >
                    <ShareIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="ml-4 flex items-center space-x-2">
                {shortUrl.isActive ? (
                  <button
                    onClick={() => deactivateMutation.mutate(shortUrl.shortCode)}
                    disabled={deactivateMutation.isLoading}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    <XMarkIcon className="h-3 w-3 mr-1" />
                    Deactivate
                  </button>
                ) : (
                  <button
                    onClick={() => reactivateMutation.mutate(shortUrl.shortCode)}
                    disabled={reactivateMutation.isLoading}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <CheckIcon className="h-3 w-3 mr-1" />
                    Activate
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 