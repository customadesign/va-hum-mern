import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

export default function ConversationDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const [message, setMessage] = useState('');

  const { data: conversationData, isLoading } = useQuery(
    ['conversation', id],
    async () => {
      const response = await api.get(`/conversations/${id}`);
      return response.data.data;
    }
  );

  const sendMessageMutation = useMutation(
    async (messageData) => {
      const response = await api.post('/messages', messageData);
      return response.data;
    },
    {
      onSuccess: () => {
        setMessage('');
        queryClient.invalidateQueries(['conversation', id]);
      },
      onError: () => {
        toast.error('Failed to send message');
      }
    }
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationData?.messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    sendMessageMutation.mutate({
      conversationId: id,
      body: message
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const { conversation, messages } = conversationData || {};
  const otherParty = user.va ? conversation?.business : conversation?.va;

  return (
    <>
      <Helmet>
        <title>Conversation with {otherParty?.name || otherParty?.company} - Linkage VA Hub</title>
      </Helmet>

      <div className="flex h-screen bg-white">
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white shadow-sm px-6 py-4 flex items-center">
            <div className="flex items-center">
              {otherParty?.avatar ? (
                <img
                  className="h-10 w-10 rounded-full"
                  src={otherParty.avatar}
                  alt=""
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700">
                    {(otherParty?.name || otherParty?.company)?.[0]?.toUpperCase()}
                  </span>
                </div>
              )}
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {otherParty?.name || otherParty?.company}
                </p>
                <p className="text-xs text-gray-500">
                  {otherParty?.hero || otherParty?.bio?.substring(0, 50)}
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {messages?.map((msg) => {
                const isOwnMessage = 
                  (user.va && msg.senderModel === 'VA') ||
                  (user.business && msg.senderModel === 'Business');

                return (
                  <div
                    key={msg._id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        isOwnMessage
                          ? 'bg-gray-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{msg.body}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isOwnMessage ? 'text-gray-300' : 'text-gray-500'
                        }`}
                      >
                        {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Input */}
          <div className="bg-white border-t px-6 py-4">
            <form onSubmit={handleSendMessage} className="flex space-x-4">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                disabled={sendMessageMutation.isLoading}
              />
              <button
                type="submit"
                disabled={!message.trim() || sendMessageMutation.isLoading}
                className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PaperAirplaneIcon className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">Send message</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}