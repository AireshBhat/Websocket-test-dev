import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import MessageLog from './MessageLog';
import MessageInput from './MessageInput';
import StatusBar from './StatusBar';
import websocketService from '../services/websocketService';
import { Message, ConnectionStatus, ConnectionStats } from '../types';

interface DashboardProps {
  onDisconnect: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onDisconnect }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>({
    state: 'disconnected',
    message: 'Not connected',
    timestamp: Date.now(),
  });
  const [stats, setStats] = useState<ConnectionStats>({
    messagesSent: 0,
    messagesReceived: 0,
    reconnectAttempts: 0,
  });

  useEffect(() => {
    // Subscribe to messages
    const unsubscribeMessages = websocketService.onMessage((message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    // Subscribe to status changes
    const unsubscribeStatus = websocketService.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    // Subscribe to stats changes
    const unsubscribeStats = websocketService.onStatsChange((newStats) => {
      setStats(newStats);
    });

    // Load initial messages
    setMessages(websocketService.getMessages());

    return () => {
      unsubscribeMessages();
      unsubscribeStatus();
      unsubscribeStats();
    };
  }, []);

  const handleSendMessage = (message: any) => {
    try {
      websocketService.send(message);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleDisconnect = () => {
    websocketService.disconnect();
    onDisconnect();
  };

  const handleClearMessages = () => {
    websocketService.clearMessages();
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-dark-900 p-4 border-b border-dark-700">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={handleDisconnect}
              className="mr-4 text-gray-300 hover:text-white flex items-center"
            >
              <ArrowLeft className="mr-1" size={18} />
              <span>Disconnect</span>
            </button>
            
            <div className="flex items-center">
              {status.state === 'connected' ? (
                <Wifi className="text-success-500 mr-2 animate-pulse" size={18} />
              ) : status.state === 'connecting' ? (
                <RefreshCw className="text-primary-500 mr-2 animate-spin" size={18} />
              ) : (
                <WifiOff className="text-gray-500 mr-2" size={18} />
              )}
              <span className={`font-medium ${
                status.state === 'connected' ? 'text-success-400' : 
                status.state === 'connecting' ? 'text-primary-400' : 
                status.state === 'error' ? 'text-error-400' : 'text-gray-400'
              }`}>
                {status.state.charAt(0).toUpperCase() + status.state.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-4 space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex-1 min-h-0 flex flex-col">
          <MessageLog messages={messages} onClear={handleClearMessages} />
        </div>
        
        <div className="w-full md:w-2/5 flex flex-col space-y-4">
          <StatusBar status={status} stats={stats} />
          <MessageInput 
            onSend={handleSendMessage} 
            disabled={status.state !== 'connected'} 
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;