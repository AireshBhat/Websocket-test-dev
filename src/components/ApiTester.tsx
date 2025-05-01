import React, { useState } from 'react';
import { Send, RefreshCw, ChevronDown, ChevronRight, User, Key, LogIn } from 'lucide-react';
import JSONEditor from 'react-json-editor-ajrm';
import locale from 'react-json-editor-ajrm/locale/en';

interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  requestBody?: any;
  category: 'auth' | 'users' | 'keys';
}

const API_ENDPOINTS: ApiEndpoint[] = [
  {
    category: 'auth',
    method: 'POST',
    path: '/api/auth/login',
    description: 'User login',
    requestBody: {
      email: "user@example.com",
      password: "password123"
    }
  },
  {
    category: 'users',
    method: 'POST',
    path: '/api/users',
    description: 'Create user',
    requestBody: {
      email: "user@example.com",
      username: "newuser",
      password: "password123",
      wallet_address: null
    }
  },
  {
    category: 'users',
    method: 'GET',
    path: '/api/users/{id}',
    description: 'Get user by ID'
  },
  {
    category: 'users',
    method: 'PUT',
    path: '/api/users/{id}',
    description: 'Update user',
    requestBody: {
      username: "updateduser",
      email: "updated@example.com",
      wallet_address: null
    }
  },
  {
    category: 'users',
    method: 'DELETE',
    path: '/api/users/{id}',
    description: 'Delete user'
  },
  {
    category: 'keys',
    method: 'POST',
    path: '/api/users/{id}/keys',
    description: 'Add public key',
    requestBody: {
      public_key: "hex-encoded string"
    }
  },
  {
    category: 'keys',
    method: 'GET',
    path: '/api/users/{id}/keys',
    description: 'Get user public keys'
  },
  {
    category: 'keys',
    method: 'DELETE',
    path: '/api/users/{id}/keys/{key}',
    description: 'Revoke public key'
  }
];

const ApiTester: React.FC = () => {
  const [baseUrl, setBaseUrl] = useState<string>('http://localhost:8080');
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const [requestBody, setRequestBody] = useState<string>('{}');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['auth']));
  const [pathParams, setPathParams] = useState<Record<string, string>>({});
  const [authToken, setAuthToken] = useState<string>('');

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleEndpointSelect = (endpoint: ApiEndpoint) => {
    setSelectedEndpoint(endpoint);
    setRequestBody(JSON.stringify(endpoint.requestBody || {}, null, 2));
    setResponse(null);
    setError(null);
  };

  const handleSend = async () => {
    if (!selectedEndpoint) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      let path = selectedEndpoint.path;
      
      // Replace path parameters
      Object.entries(pathParams).forEach(([key, value]) => {
        path = path.replace(`{${key}}`, value);
      });

      const url = `${baseUrl}${path}`;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers
      };

      if (selectedEndpoint.method !== 'GET' && selectedEndpoint.method !== 'DELETE') {
        options.body = requestBody;
      }
      console.log({ url, options })

      const response = await fetch(url, options);
      const data = await response.json().catch(() => null);

      setResponse({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data
      });

      // If this was a successful login, save the token
      if (selectedEndpoint.path === '/api/auth/login' && data?.token) {
        setAuthToken(data.token);
      }
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'auth':
        return <LogIn size={18} />;
      case 'users':
        return <User size={18} />;
      case 'keys':
        return <Key size={18} />;
      default:
        return null;
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-primary-600';
      case 'POST':
        return 'bg-success-600';
      case 'PUT':
        return 'bg-warning-600';
      case 'DELETE':
        return 'bg-error-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div className="flex h-full space-x-4">
      {/* Sidebar with endpoints */}
      <div className="w-80 bg-dark-800 rounded-lg p-4 overflow-y-auto">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Base URL
          </label>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            className="w-full bg-dark-700 border border-dark-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {authToken && (
          <div className="mb-4 p-2 bg-success-900/30 border border-success-700/50 rounded-md">
            <div className="text-success-400 text-sm font-medium mb-1">Authenticated</div>
            <div className="text-xs font-mono text-gray-400 truncate">
              {authToken.substring(0, 20)}...
            </div>
          </div>
        )}

        <div className="space-y-2">
          {Array.from(new Set(API_ENDPOINTS.map(e => e.category))).map(category => (
            <div key={category} className="rounded-md overflow-hidden">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between p-2 bg-dark-700 hover:bg-dark-600 transition-colors"
              >
                <div className="flex items-center space-x-2 text-gray-300">
                  {getCategoryIcon(category)}
                  <span className="capitalize">{category}</span>
                </div>
                {expandedCategories.has(category) ? (
                  <ChevronDown size={18} className="text-gray-400" />
                ) : (
                  <ChevronRight size={18} className="text-gray-400" />
                )}
              </button>
              
              {expandedCategories.has(category) && (
                <div className="mt-1 space-y-1">
                  {API_ENDPOINTS.filter(e => e.category === category).map((endpoint, index) => (
                    <button
                      key={index}
                      onClick={() => handleEndpointSelect(endpoint)}
                      className={`w-full flex items-center p-2 text-left hover:bg-dark-700 transition-colors rounded ${
                        selectedEndpoint === endpoint ? 'bg-dark-700' : ''
                      }`}
                    >
                      <span className={`${getMethodColor(endpoint.method)} text-white text-xs font-medium px-2 py-1 rounded mr-2 w-16 text-center`}>
                        {endpoint.method}
                      </span>
                      <div className="flex-1">
                        <div className="text-sm text-gray-300">{endpoint.description}</div>
                        <div className="text-xs text-gray-500 font-mono mt-1">{endpoint.path}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Request/Response panel */}
      <div className="flex-1 flex flex-col space-y-4">
        {selectedEndpoint ? (
          <>
            {/* Path parameters */}
            {selectedEndpoint.path.includes('{') && (
              <div className="bg-dark-800 rounded-lg p-4">
                <h3 className="text-lg font-medium text-white mb-3">Path Parameters</h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedEndpoint.path.match(/\{(\w+)\}/g)?.map(param => {
                    const paramName = param.slice(1, -1);
                    return (
                      <div key={paramName}>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          {paramName}
                        </label>
                        <input
                          type="text"
                          value={pathParams[paramName] || ''}
                          onChange={(e) => setPathParams({...pathParams, [paramName]: e.target.value})}
                          className="w-full bg-dark-700 border border-dark-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder={`Enter ${paramName}`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Request body */}
            {selectedEndpoint.method !== 'GET' && selectedEndpoint.method !== 'DELETE' && (
              <div className="bg-dark-800 rounded-lg p-4 flex-1">
                <h3 className="text-lg font-medium text-white mb-3">Request Body</h3>
                <JSONEditor
                  placeholder={JSON.parse(requestBody)}
                  locale={locale}
                  height="200px"
                  width="100%"
                  onChange={(data: any) => setRequestBody(data.json || '{}')}
                  theme={{
                    background: '#1f2937',
                    main: '#d1d5db',
                    highlight: '#4b5563',
                    default: '#e5e7eb',
                    border: '#374151',
                    string: '#10b981',
                    number: '#60a5fa',
                    colon: '#9ca3af',
                    keys: '#f97316',
                    keys_whiteSpace: '#374151',
                    primitive: '#a78bfa'
                  }}
                />
              </div>
            )}

            {/* Send button */}
            <div className="flex justify-end">
              <button
                onClick={handleSend}
                disabled={loading}
                className={`px-4 py-2 rounded-md text-white font-medium flex items-center ${
                  loading
                    ? 'bg-primary-800 cursor-not-allowed'
                    : 'bg-primary-600 hover:bg-primary-500'
                } transition-colors`}
              >
                {loading ? (
                  <RefreshCw className="animate-spin mr-2" size={16} />
                ) : (
                  <Send className="mr-2" size={16} />
                )}
                Send Request
              </button>
            </div>

            {/* Response */}
            {(response || error) && (
              <div className="bg-dark-800 rounded-lg p-4">
                <h3 className="text-lg font-medium text-white mb-3">Response</h3>
                
                {error ? (
                  <div className="p-3 bg-error-900/30 border border-error-700/50 rounded-md text-error-400">
                    {error}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <span className={`text-sm font-medium px-3 py-1 rounded ${
                        response.status < 300 ? 'bg-success-900/30 text-success-400' :
                        response.status < 400 ? 'bg-warning-900/30 text-warning-400' :
                        'bg-error-900/30 text-error-400'
                      }`}>
                        {response.status} {response.statusText}
                      </span>
                    </div>
                    
                    <div className="border-t border-dark-700 pt-4">
                      <JSONEditor
                        placeholder={response.data || {}}
                        locale={locale}
                        viewOnly={true}
                        height="200px"
                        width="100%"
                        theme={{
                          background: '#1f2937',
                          main: '#d1d5db',
                          highlight: '#4b5563',
                          default: '#e5e7eb',
                          border: '#374151',
                          string: '#10b981',
                          number: '#60a5fa',
                          colon: '#9ca3af',
                          keys: '#f97316',
                          keys_whiteSpace: '#374151',
                          primitive: '#a78bfa'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select an endpoint from the sidebar to begin testing
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiTester;