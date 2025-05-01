import React, { useState, useRef } from 'react';
import { Cpu, User, RefreshCw, XCircle, CheckCircle, Copy, AlertTriangle } from 'lucide-react';
import { WebSocketService } from '../../services/websocketService';
import { TestKey } from '../../types';

interface UserKeyBoxProps {
  testKey: TestKey;
  isRecorded: boolean;
}

const UserKeyBox: React.FC<UserKeyBoxProps> = ({ testKey, isRecorded }) => {
  const [connecting, setConnecting] = useState<boolean>(false);
  const [connected, setConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Not connected');
  const [connectionStats, setConnectionStats] = useState<{
    messagesReceived: number;
    messagesSent: number;
  }>({ messagesReceived: 0, messagesSent: 0 });
  const [copied, setCopied] = useState<string | null>(null);

  const websocketServiceRef = useRef<WebSocketService>(new WebSocketService());
  const websocketService = websocketServiceRef.current;

  const handleConnect = async () => {
    try {
      setConnecting(true);
      setError(null);
      setStatusMessage('Connecting...');
      
      console.log(1)
      // Set up WebSocket connection with the test key
      const unsubscribeStatus = websocketService.onStatusChange((status) => {
        setStatusMessage(status.message);
        if (status.state === 'connected') {
          setConnected(true);
        } else if (status.state === 'disconnected' || status.state === 'error') {
          setConnected(false);
          if (status.state === 'error') {
            setError(status.message);
          }
        }
      });
      
      console.log(2)
      const unsubscribeStats = websocketService.onStatsChange((stats) => {
        setConnectionStats({
          messagesReceived: stats.messagesReceived,
          messagesSent: stats.messagesSent
        });
      });

      console.log(3)
      const response = await websocketService.connect(
        'ws://localhost:8080/ws/dashboard',
        testKey.private_key
      );

      console.log(4, response)
      // These unsubscribe functions will be called when the component unmounts
      return () => {
        unsubscribeStatus();
        unsubscribeStats();
      };
    } catch (error) {
      setError((error as Error).message);
      setStatusMessage(`Connection failed: ${(error as Error).message}`);
      setConnected(false);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    websocketService.disconnect();
    setConnected(false);
    setStatusMessage('Disconnected');
    setConnectionStats({ messagesReceived: 0, messagesSent: 0 });
  };
  
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <div className={`bg-dark-800 rounded-lg shadow-lg p-4 border-l-4 ${
      isRecorded ? 'border-success-600' : 'border-warning-600'
    }`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center">
          <User className="mr-2 text-gray-400" size={18} />
          <div>
            <h3 className="font-medium text-white">{testKey.username}</h3>
            <p className="text-xs text-gray-400">User ID: {testKey.user_id}</p>
          </div>
        </div>
        
        <span className={`text-xs px-2 py-1 rounded-full ${
          isRecorded ? 'bg-success-900/30 text-success-400' : 'bg-warning-900/30 text-warning-400'
        }`}>
          {isRecorded ? 'Recorded' : 'Unrecorded'}
        </span>
      </div>
      
      <div className="mb-2">
        <div className="text-xs text-gray-300 mb-1">Public Key:</div>
        <div className="flex items-center bg-dark-700 rounded p-1">
          <div className="flex-1 text-xs font-mono truncate text-primary-300">
            {testKey.public_key}
          </div>
          <button 
            onClick={() => copyToClipboard(testKey.public_key, 'publicKey')}
            className="p-1 text-gray-400 hover:text-white"
          >
            {copied === 'publicKey' ? <CheckCircle size={14} className="text-success-400" /> : <Copy size={14} />}
          </button>
        </div>
      </div>
      
      <div className="mb-3">
        <div className="text-xs text-gray-300 mb-1">Private Key:</div>
        <div className="flex items-center bg-dark-700 rounded p-1">
          <div className="flex-1 text-xs font-mono truncate text-secondary-300">
            {testKey.private_key}
          </div>
          <button 
            onClick={() => copyToClipboard(testKey.private_key, 'privateKey')}
            className="p-1 text-gray-400 hover:text-white"
          >
            {copied === 'privateKey' ? <CheckCircle size={14} className="text-success-400" /> : <Copy size={14} />}
          </button>
        </div>
      </div>
      
      <div className="flex justify-between p-2 bg-dark-700 rounded mb-3">
        <div className="flex items-center justify-center space-x-1 text-xs">
          <div className="text-gray-400">Status:</div>
          <div className={`font-medium ${
            connected ? 'text-success-400' : 
            connecting ? 'text-primary-400' : 
            error ? 'text-error-400' : 'text-gray-400'
          }`}>
            {connected && <span className="inline-block w-2 h-2 bg-success-500 rounded-full mr-1 animate-pulse"></span>}
            {connecting && <RefreshCw className="inline-block mr-1 animate-spin" size={10} />}
            {error && <AlertTriangle className="inline-block mr-1" size={10} />}
            {statusMessage}
          </div>
        </div>
      </div>
      
      {connected && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-dark-700 p-2 rounded text-center">
            <div className="text-xs text-gray-400">Received</div>
            <div className="text-primary-300 font-mono">{connectionStats.messagesReceived}</div>
          </div>
          <div className="bg-dark-700 p-2 rounded text-center">
            <div className="text-xs text-gray-400">Sent</div>
            <div className="text-secondary-300 font-mono">{connectionStats.messagesSent}</div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mb-3 p-2 bg-error-900/30 border border-error-700/50 rounded-md text-error-400 text-xs">
          {error}
        </div>
      )}
      
      <div className="flex space-x-2 mt-4">
        {!connected ? (
          <button
            onClick={handleConnect}
            disabled={connecting}
            className={`flex-1 py-2 px-3 rounded-md text-white text-sm font-medium flex items-center justify-center ${
              connecting
                ? 'bg-primary-800 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-500'
            } transition-colors`}
          >
            {connecting ? (
              <>
                <RefreshCw className="animate-spin mr-2" size={14} />
                Connecting...
              </>
            ) : (
              <>
                <Cpu className="mr-2" size={14} />
                Connect WebSocket
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleDisconnect}
            className="flex-1 py-2 px-3 rounded-md text-white text-sm font-medium bg-error-600 hover:bg-error-500 transition-colors flex items-center justify-center"
          >
            <XCircle className="mr-2" size={14} />
            Disconnect
          </button>
        )}
      </div>
    </div>
  );
};

export default UserKeyBox;