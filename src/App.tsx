import React, { useState } from 'react';
import ConnectionForm from './components/ConnectionForm';
import Dashboard from './components/Dashboard';
import ApiTester from './components/ApiTester';
import { TestKeysDashboard } from './components/TestKeys';
import { Cpu, Globe, KeyRound } from 'lucide-react';

function App() {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'websocket' | 'http' | 'test-keys'>('websocket');

  const handleConnect = () => {
    setIsConnected(true);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
  };

  return (
    <div className="bg-dark-900 text-white">
      <div className="container mx-auto px-4 py-6 flex flex-col h-screen">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-primary-300">API Testing Suite</h1>
          <p className="text-gray-400">A developer testing tool for WebSocket and HTTP APIs</p>
          
          <div className="flex space-x-4 mt-4">
            <button
              onClick={() => setActiveTab('websocket')}
              className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                activeTab === 'websocket'
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-800 text-gray-400 hover:bg-dark-700'
              }`}
            >
              <Cpu className="mr-2" size={18} />
              WebSocket
            </button>
            <button
              onClick={() => setActiveTab('http')}
              className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                activeTab === 'http'
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-800 text-gray-400 hover:bg-dark-700'
              }`}
            >
              <Globe className="mr-2" size={18} />
              HTTP API
            </button>
            <button
              onClick={() => setActiveTab('test-keys')}
              className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                activeTab === 'test-keys'
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-800 text-gray-400 hover:bg-dark-700'
              }`}
            >
              <KeyRound className="mr-2" size={18} />
              Test Keys
            </button>
          </div>
        </header>
        
        <main className="flex-1 flex flex-col">
          {activeTab === 'websocket' ? (
            isConnected ? (
              <Dashboard onDisconnect={handleDisconnect} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <ConnectionForm onConnect={handleConnect} />
              </div>
            )
          ) : activeTab === 'http' ? (
            <ApiTester />
          ) : (
            <TestKeysDashboard />
          )}
        </main>
        
        <footer className="mt-6 py-4 border-t border-dark-700 text-center text-gray-500 text-sm">
          API Testing Suite &copy; {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}

export default App;