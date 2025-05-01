import React from 'react';
import { Clock, ArrowDown, ArrowUp, RefreshCw, AlertTriangle } from 'lucide-react';
import { ConnectionStatus, ConnectionStats } from '../types';

interface StatusBarProps {
  status: ConnectionStatus;
  stats: ConnectionStats;
}

const StatusBar: React.FC<StatusBarProps> = ({ status, stats }) => {
  const formatDuration = (startTime?: number): string => {
    if (!startTime) return '00:00:00';
    
    const duration = Math.floor((Date.now() - startTime) / 1000);
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    
    return [hours, minutes, seconds]
      .map(val => val.toString().padStart(2, '0'))
      .join(':');
  };

  const formatTime = (timestamp?: number): string => {
    if (!timestamp) return '--:--:--';
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="bg-dark-800 rounded-lg shadow-lg p-4">
      <h3 className="text-lg font-medium text-white mb-3 flex items-center">
        <Clock className="text-primary-400 mr-2" size={20} />
        Connection Status
      </h3>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Status</span>
          <span className={`font-medium ${
            status.state === 'connected' ? 'text-success-400' : 
            status.state === 'connecting' ? 'text-primary-400' : 
            status.state === 'error' ? 'text-error-400' : 'text-gray-400'
          }`}>
            {status.state === 'connected' && (
              <span className="inline-block w-2 h-2 bg-success-500 rounded-full mr-2 animate-pulse"></span>
            )}
            {status.state === 'connecting' && (
              <RefreshCw className="inline mr-1 animate-spin" size={12} />
            )}
            {status.state === 'error' && (
              <AlertTriangle className="inline mr-1 text-error-400" size={12} />
            )}
            {status.state.charAt(0).toUpperCase() + status.state.slice(1)}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Message</span>
          <span className="text-white">{status.message}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Uptime</span>
          <span className="text-white font-mono">
            {stats.connectedSince ? formatDuration(stats.connectedSince) : '00:00:00'}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Last update</span>
          <span className="text-white font-mono">{formatTime(status.timestamp)}</span>
        </div>
        
        <div className="border-t border-dark-700 my-2"></div>
        
        <div className="flex justify-between">
          <div className="flex items-center">
            <ArrowDown className="text-primary-400 mr-1" size={16} />
            <span className="text-gray-400 mr-2">Received</span>
            <span className="text-white font-mono">{stats.messagesReceived}</span>
          </div>
          
          <div className="flex items-center">
            <ArrowUp className="text-secondary-400 mr-1" size={16} />
            <span className="text-gray-400 mr-2">Sent</span>
            <span className="text-white font-mono">{stats.messagesSent}</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Last message</span>
          <span className="text-white font-mono">{formatTime(stats.lastMessageAt)}</span>
        </div>
        
        {stats.reconnectAttempts > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Reconnect attempts</span>
            <span className="text-white font-mono">{stats.reconnectAttempts}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusBar;