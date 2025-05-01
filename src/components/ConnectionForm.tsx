import React, { useState, useEffect } from 'react';
import { KeyRound, Key, Cpu, RefreshCw, Save, FolderOpen, UserRound } from 'lucide-react';
import websocketService from '../services/websocketService';
import { testKeysService } from '../services/testKeysService';
import { ConnectionProfile, TestKey } from '../types';

interface ConnectionFormProps {
  onConnect: () => void;
}

const ConnectionForm: React.FC<ConnectionFormProps> = ({ onConnect }) => {
  const [url, setUrl] = useState<string>('ws://localhost:8080/ws/dashboard');
  const [privateKey, setPrivateKey] = useState<string>('');
  const [publicKey, setPublicKey] = useState<string>('');
  const [connecting, setConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<ConnectionProfile[]>([]);
  const [profileName, setProfileName] = useState<string>('');
  const [autoReconnect, setAutoReconnect] = useState<boolean>(false);
  const [reconnectInterval, setReconnectInterval] = useState<number>(5);
  const [showTestKeys, setShowTestKeys] = useState<boolean>(false);
  const [testKeys, setTestKeys] = useState<TestKey[]>([]);
  const [loadingTestKeys, setLoadingTestKeys] = useState<boolean>(false);
  const [testKeysError, setTestKeysError] = useState<string | null>(null);

  // Load saved profiles from localStorage
  useEffect(() => {
    try {
      const savedProfiles = localStorage.getItem('wsConnectionProfiles');
      if (savedProfiles) {
        setProfiles(JSON.parse(savedProfiles));
      }
    } catch (error) {
      console.error('Failed to load profiles from localStorage:', error);
    }
  }, []);

  // When privateKey changes, try to calculate the public key
  useEffect(() => {
    if (!privateKey) {
      setPublicKey('');
      return;
    }

    try {
      // If it's a test key, find the corresponding public key
      const matchingTestKey = testKeys.find(key => key.private_key === privateKey);
      if (matchingTestKey) {
        setPublicKey(matchingTestKey.public_key);
        return;
      }
    } catch (error) {
      console.error('Failed to derive public key:', error);
    }
  }, [privateKey, testKeys]);

  const saveProfiles = (updatedProfiles: ConnectionProfile[]) => {
    try {
      localStorage.setItem('wsConnectionProfiles', JSON.stringify(updatedProfiles));
      setProfiles(updatedProfiles);
    } catch (error) {
      console.error('Failed to save profiles to localStorage:', error);
    }
  };

  const handleConnect = async () => {
    if (!url) {
      setError('WebSocket URL is required');
      return;
    }

    if (!privateKey) {
      setError('Private key is required for authentication');
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      // Set auto-reconnect option
      websocketService.setAutoReconnect(
        autoReconnect, 
        reconnectInterval * 1000
      );
      
      // Connect to WebSocket server
      await websocketService.connect(url, privateKey);
      onConnect();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setConnecting(false);
    }
  };

  const generateKeyPair = async () => {
    try {
      const keyPair = await websocketService.generateNewKeyPair();
      setPrivateKey(keyPair.privateKey);
      setPublicKey(keyPair.publicKey);
    } catch (error) {
      setError(`Failed to generate key pair: ${error as Error}`);
    }
  };

  const saveProfile = () => {
    if (!profileName.trim()) {
      setError('Profile name is required');
      return;
    }

    if (!url || !privateKey) {
      setError('URL and private key are required');
      return;
    }

    const newProfile: ConnectionProfile = {
      id: Date.now().toString(),
      name: profileName,
      url,
      privateKey,
    };

    const updatedProfiles = [...profiles, newProfile];
    saveProfiles(updatedProfiles);
    setProfileName('');
    setError(null);
  };

  const loadProfile = (profile: ConnectionProfile) => {
    setUrl(profile.url);
    setPrivateKey(profile.privateKey);
  };

  const deleteProfile = (id: string) => {
    const updatedProfiles = profiles.filter(profile => profile.id !== id);
    saveProfiles(updatedProfiles);
  };
  
  const toggleTestKeys = async () => {
    setShowTestKeys(!showTestKeys);
    
    if (!showTestKeys && testKeys.length === 0) {
      try {
        setLoadingTestKeys(true);
        setTestKeysError(null);
        const keys = await testKeysService.fetchTestKeys();
        setTestKeys(keys);
      } catch (error) {
        setTestKeysError((error as Error).message);
      } finally {
        setLoadingTestKeys(false);
      }
    }
  };
  
  const testKeyHelper = (testKey: TestKey) => {
    setPrivateKey(testKey.private_key);
    setPublicKey(testKey.public_key);
    setShowTestKeys(false);
    setProfileName(testKey.username); // Suggest username as profile name
  };

  return (
    <div className="bg-dark-800 rounded-lg shadow-lg p-6 w-full max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
        <Cpu className="mr-2 text-primary-400" size={20} />
        WebSocket Connection
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-error-900 border border-error-700 text-error-200 rounded-md animate-fade-in">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            WebSocket URL
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full bg-dark-700 border border-dark-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="ws://localhost:8080/ws"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center">
            <KeyRound className="mr-1 text-primary-400" size={16} />
            Private Key (Hex)
          </label>
          <div className="flex">
            <input
              type="password"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              className="flex-1 bg-dark-700 border border-dark-600 rounded-l-md px-3 py-2 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="ed25519 private key (hex)"
            />
            <button
              onClick={generateKeyPair}
              className="bg-secondary-700 hover:bg-secondary-600 text-white px-3 py-2 rounded-r-md transition-colors flex items-center"
              title="Generate new key pair"
            >
              <RefreshCw size={16} />
            </button>
          </div>
          {publicKey && (
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center">
                <Key className="mr-1 text-secondary-400" size={16} />
                Public Key
              </label>
              <div className="bg-dark-700 border border-dark-600 rounded-md px-3 py-2 text-gray-300 font-mono text-xs overflow-x-auto">
                {publicKey}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex space-x-4">
          <div className="flex-1">
            <label className="flex items-center mb-1 cursor-pointer">
              <input
                type="checkbox"
                checked={autoReconnect}
                onChange={(e) => setAutoReconnect(e.target.checked)}
                className="mr-2 rounded bg-dark-700 border-dark-600 text-primary-500 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-300">Auto-reconnect</span>
            </label>
          </div>
          
          {autoReconnect && (
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Interval (seconds)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={reconnectInterval}
                onChange={(e) => setReconnectInterval(Number(e.target.value))}
                className="w-full bg-dark-700 border border-dark-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          )}
        </div>
        
        <div className="pt-2">
          <button
            onClick={handleConnect}
            disabled={connecting}
            className={`w-full py-2 px-4 rounded-md text-white font-medium flex items-center justify-center ${
              connecting
                ? 'bg-primary-800 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-500'
            } transition-colors`}
          >
            {connecting ? (
              <>
                <RefreshCw className="animate-spin mr-2" size={16} />
                Connecting...
              </>
            ) : (
              'Connect'
            )}
          </button>
        </div>
        
        <div className="pt-2">
          <button
            onClick={toggleTestKeys}
            className={`w-full py-2 px-4 rounded-md text-white font-medium flex items-center justify-center ${
              showTestKeys
                ? 'bg-accent-600 hover:bg-accent-500'
                : 'bg-dark-700 hover:bg-dark-600'
            } transition-colors`}
          >
            <UserRound className="mr-2" size={16} />
            {showTestKeys ? 'Hide Test Keys' : 'Show Test Keys'}
          </button>
        </div>
        
        {/* Test Keys Section */}
        {showTestKeys && (
          <div className="mt-2 p-3 bg-dark-700 rounded-md">
            <h3 className="text-md font-medium text-white mb-2">Available Test Keys</h3>
            
            {loadingTestKeys && (
              <div className="flex items-center justify-center py-4">
                <RefreshCw className="animate-spin text-primary-400 mr-2" size={16} />
                <span className="text-gray-400">Loading test keys...</span>
              </div>
            )}
            
            {testKeysError && (
              <div className="p-2 bg-error-900/30 border border-error-700/50 rounded-md text-error-400 text-sm mb-3">
                {testKeysError}
              </div>
            )}
            
            {!loadingTestKeys && !testKeysError && testKeys.length === 0 && (
              <div className="text-gray-400 text-center py-2">No test keys available</div>
            )}
            
            {!loadingTestKeys && testKeys.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {testKeys.map((testKey) => (
                  <div 
                    key={testKey.index}
                    className="flex items-center justify-between bg-dark-800 p-2 rounded-md hover:bg-dark-700 transition-colors"
                  >
                    <div className="flex items-center">
                      <UserRound className="mr-2 text-gray-400" size={16} />
                      <div>
                        <div className="font-medium text-white">{testKey.username}</div>
                        <div className="text-xs text-gray-400">ID: {testKey.user_id}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => testKeyHelper(testKey)}
                      className="px-2 py-1 bg-primary-600 hover:bg-primary-500 text-white text-xs rounded-md"
                    >
                      Use Key
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Profile Management */}
      <div className="mt-6 pt-4 border-t border-dark-600">
        <h3 className="text-md font-medium text-white mb-3">Connection Profiles</h3>
        
        <div className="flex space-x-2 mb-4">
          <input
            type="text"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            placeholder="Profile name"
            className="flex-1 bg-dark-700 border border-dark-600 rounded-l-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            onClick={saveProfile}
            className="bg-accent-600 hover:bg-accent-500 text-white px-3 py-2 rounded-r-md transition-colors flex items-center"
          >
            <Save size={16} className="mr-1" />
            Save
          </button>
        </div>
        
        {profiles.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="flex items-center justify-between bg-dark-700 rounded-md p-2 hover:bg-dark-600 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium text-white">{profile.name}</div>
                  <div className="text-xs text-gray-400 truncate">{profile.url}</div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => loadProfile(profile)}
                    className="text-primary-400 hover:text-primary-300 p-1"
                    title="Load profile"
                  >
                    <FolderOpen size={16} />
                  </button>
                  <button
                    onClick={() => deleteProfile(profile.id)}
                    className="text-error-400 hover:text-error-300 p-1"
                    title="Delete profile"
                  >
                    <span aria-hidden="true">&times;</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-400 text-sm italic">No saved profiles</div>
        )}
      </div>
    </div>
  );
};

export default ConnectionForm;