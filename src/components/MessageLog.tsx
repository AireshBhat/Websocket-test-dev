import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, ArrowDown, Search, Trash2, X } from 'lucide-react';
import { Message } from '../types';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

interface MessageLogProps {
  messages: Message[];
  onClear: () => void;
}

const MessageLog: React.FC<MessageLogProps> = ({ messages, onClear }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>('');
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>(messages);

  const scrollToBottom = () => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [filteredMessages]);

  useEffect(() => {
    if (filter) {
      const lowercaseFilter = filter.toLowerCase();
      const filtered = messages.filter(message => 
        JSON.stringify(message.content).toLowerCase().includes(lowercaseFilter) || 
        message.type.toLowerCase().includes(lowercaseFilter)
      );
      setFilteredMessages(filtered);
    } else {
      setFilteredMessages(messages);
    }
  }, [messages, filter]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isScrolledToBottom = scrollHeight - scrollTop - clientHeight < 10;
    setAutoScroll(isScrolledToBottom);
  };

  const toggleFilter = () => {
    setShowFilter(!showFilter);
    if (!showFilter) {
      setFilter('');
    }
  };

  const clearFilter = () => {
    setFilter('');
  };

  const getMessageColor = (message: Message) => {
    if (message.direction === 'in') {
      switch (message.type) {
        case 'error':
          return 'border-error-600 bg-error-900/30';
        case 'auth_success':
          return 'border-success-600 bg-success-900/30';
        case 'system':
          return 'border-dark-500 bg-dark-800/50';
        default:
          return 'border-primary-600 bg-primary-900/30';
      }
    } else {
      return 'border-secondary-600 bg-secondary-900/30';
    }
  };

  const getTypeLabel = (message: Message) => {
    return message.type.charAt(0).toUpperCase() + message.type.slice(1);
  };

  const getTypeColor = (message: Message) => {
    switch (message.type) {
      case 'error':
        return 'bg-error-600 text-white';
      case 'auth':
      case 'auth_success':
        return 'bg-success-600 text-white';
      case 'heartbeat':
        return 'bg-warning-600 text-white';
      case 'system':
        return 'bg-dark-500 text-white';
      default:
        return message.direction === 'in' 
          ? 'bg-primary-600 text-white'
          : 'bg-secondary-600 text-white';
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="flex flex-col h-full bg-dark-800 rounded-lg shadow-lg">
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700">
        <div className="flex items-center">
          <MessageSquare className="text-primary-400 mr-2" size={20} />
          <h3 className="text-lg font-medium text-white">Messages</h3>
          {messages.length > 0 && (
            <span className="ml-2 text-xs bg-primary-700 text-white px-2 py-0.5 rounded-full">
              {messages.length}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {showFilter && (
            <div className="relative flex items-center">
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter messages..."
                className="pl-8 pr-8 py-1 text-sm bg-dark-700 border border-dark-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-transparent"
              />
              <Search className="absolute left-2 text-gray-400" size={14} />
              {filter && (
                <button 
                  onClick={clearFilter}
                  className="absolute right-2 text-gray-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}
          
          <button
            onClick={toggleFilter}
            className={`p-1.5 rounded-md ${showFilter ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white'}`}
            title="Filter messages"
          >
            <Search size={16} />
          </button>
          
          <button
            onClick={onClear}
            className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-error-800"
            title="Clear messages"
          >
            <Trash2 size={16} />
          </button>
          
          <button
            onClick={scrollToBottom}
            className={`p-1.5 rounded-md ${!autoScroll ? 'text-gray-400 hover:text-white animate-pulse' : 'text-gray-600'}`}
            title="Scroll to bottom"
            disabled={autoScroll}
          >
            <ArrowDown size={16} />
          </button>
        </div>
      </div>
      
      <div 
        className="flex-1 overflow-y-auto px-4 py-2 space-y-2"
        onScroll={handleScroll}
      >
        {filteredMessages.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            {filter ? 'No messages match your filter' : 'No messages yet'}
          </div>
        )}
        
        {filteredMessages.map((message) => (
          <div 
            key={message.id}
            className={`border-l-4 rounded-md overflow-hidden transition-all ${getMessageColor(message)} animate-slide-up`}
          >
            <div className="px-3 py-2">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${getTypeColor(message)}`}>
                    {getTypeLabel(message)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {message.direction === 'in' ? 'Received' : 'Sent'}
                  </span>
                </div>
                <span className="text-xs text-gray-400 font-mono">
                  {formatTime(message.timestamp)}
                </span>
              </div>
              
              <div className="font-mono text-sm">
                <SyntaxHighlighter
                  language="json"
                  style={atomOneDark}
                  customStyle={{
                    background: 'transparent', 
                    padding: '0.5rem', 
                    margin: 0,
                    borderRadius: '0.25rem',
                  }}
                >
                  {JSON.stringify(message.content, null, 2)}
                </SyntaxHighlighter>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageLog;