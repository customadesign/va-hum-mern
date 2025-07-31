import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import { useBranding } from '../../contexts/BrandingContext';

export default function Conversations() {
  const { branding } = useBranding();
  const { data: conversations, isLoading } = useQuery('conversations', async () => {
    const response = await api.get('/conversations');
    return response.data.data;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Conversations - {branding.name}</title>
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Conversations
            </h2>
          </div>
        </div>

        <div className="mt-8">
          {conversations?.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No conversations</h3>
              <p className="mt-1 text-sm text-gray-500">
                {branding.isESystemsMode ? 'Start a conversation with a professional to get started.' : 'Start a conversation with a VA or business to get started.'}
              </p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {conversations?.map((conversation) => (
                  <li key={conversation._id}>
                    <Link
                      to={`/conversations/${conversation._id}`}
                      className="block hover:bg-gray-50"
                    >
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              {conversation.va?.avatar || conversation.business?.avatar ? (
                                <img
                                  className="h-10 w-10 rounded-full"
                                  src={conversation.va?.avatar || conversation.business?.avatar}
                                  alt=""
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                  <span className="text-sm font-medium text-gray-700">
                                    {(conversation.va?.name || conversation.business?.company)?.[0]?.toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {conversation.va?.name || conversation.business?.company}
                              </div>
                              {conversation.lastMessage && (
                                <div className="text-sm text-gray-500">
                                  {conversation.lastMessage.body.substring(0, 50)}
                                  {conversation.lastMessage.body.length > 50 && '...'}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div className="text-sm text-gray-500">
                              {conversation.lastMessageAt &&
                                formatDistanceToNow(new Date(conversation.lastMessageAt), {
                                  addSuffix: true
                                })}
                            </div>
                            {conversation.hasUnread && (
                              <div className="ml-2 flex-shrink-0 flex">
                                <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  New
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  );
}