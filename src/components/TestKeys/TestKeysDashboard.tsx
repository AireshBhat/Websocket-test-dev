import React, { useState, useEffect } from 'react';
import { Key, RefreshCw, AlertTriangle } from 'lucide-react';
import { testKeysService } from '../../services/testKeysService';
import UserKeyBox from './UserKeyBox';
import { TestKey } from '../../types';

const TestKeysDashboard: React.FC = () => {
  const [testKeys, setTestKeys] = useState<TestKey[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchKeys = async () => {
      try {
        setLoading(true);
        const keys = await testKeysService.fetchTestKeys();
        setTestKeys(keys);
        setError(null);
      } catch (error) {
        setError((error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchKeys();
  }, []);

  // Let's assume the first 5 keys are recorded users and the rest are unrecorded
  // This matches our backend implementation where user_id 1-5 are from genesis data
  const recordedUsers = testKeys.filter(key => key.user_id <= 5);
  const unrecordedUsers = testKeys.filter(key => key.user_id > 5);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <RefreshCw className="animate-spin text-primary-400 mb-4" size={36} />
        <div className="text-gray-400">Loading test keys...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <AlertTriangle className="text-error-400 mb-4" size={36} />
        <div className="text-error-400 mb-2">Failed to load test keys</div>
        <div className="p-4 bg-error-900/30 border border-error-700/50 rounded-md text-error-400 max-w-md">
          {error}
        </div>
      </div>
    );
  }

  if (testKeys.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-gray-400">No test keys available</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex items-center mb-6">
        <Key className="text-primary-400 mr-2" size={24} />
        <h2 className="text-xl font-semibold text-white">Test Keys Dashboard</h2>
      </div>
      
      <div className="mb-8">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center">
          <span className="inline-block w-3 h-3 bg-success-500 rounded-full mr-2"></span>
          Recorded Users ({recordedUsers.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recordedUsers.map((key) => (
            <UserKeyBox key={key.index} testKey={key} isRecorded={true} />
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium text-white mb-4 flex items-center">
          <span className="inline-block w-3 h-3 bg-warning-500 rounded-full mr-2"></span>
          Unrecorded Users ({unrecordedUsers.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {unrecordedUsers.map((key) => (
            <UserKeyBox key={key.index} testKey={key} isRecorded={false} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestKeysDashboard;