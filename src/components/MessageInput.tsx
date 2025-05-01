import React, { useState } from 'react';
import { Send, Code, Copy, CheckCircle2 } from 'lucide-react';
import JSONEditor from 'react-json-editor-ajrm';
import locale from 'react-json-editor-ajrm/locale/en';

interface MessageInputProps {
  onSend: (message: any) => void;
  disabled: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSend, disabled }) => {
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [message, setMessage] = useState<string>(JSON.stringify({ type: 'heartbeat' }, null, 2));
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const handleSend = () => {
    if (disabled) return;
    
    try {
      const parsedMessage = JSON.parse(message);
      setJsonError(null);
      onSend(parsedMessage);
    } catch (error) {
      setJsonError('Invalid JSON: ' + (error as Error).message);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSend();
    }
  };

  const handleEditorChange = (data: any) => {
    setMessage(data.json || '{}');
    setJsonError(data.error ? data.error.reason : null);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const predefinedMessages = [
    { type: 'heartbeat' },
    { type: 'get_status' },
    { type: 'subscribe', data: { topic: 'metrics' } }
  ];

  const selectPredefinedMessage = (template: any) => {
    setMessage(JSON.stringify(template, null, 2));
    setJsonError(null);
  };

  return (
    <div className="bg-dark-800 rounded-lg shadow-lg p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center">
          <Code className="text-primary-400 mr-2" size={20} />
          <h3 className="text-lg font-medium text-white">Message Composer</h3>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={handleCopy}
            className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-dark-700 transition-colors"
            title="Copy to clipboard"
          >
            {isCopied ? (
              <CheckCircle2 size={16} className="text-success-400" />
            ) : (
              <Copy size={16} />
            )}
          </button>
        </div>
      </div>
      
      {jsonError && (
        <div className="mb-3 p-2 bg-error-900 border border-error-700 text-error-300 rounded-md text-sm">
          {jsonError}
        </div>
      )}
      
      <div className="mb-3">
        <JSONEditor
          placeholder={message || {}}
          locale={locale}
          height="200px"
          width="100%"
          onChange={handleEditorChange}
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
            primitive: '#a78bfa',
            error: '#ef4444',
            background_warning: '#450a0a',
            editVHDL_background: '#374151',
            editVHDL_color: '#e5e7eb',
            body_background: '#1f2937'
          }}
          colors={{
            string: '#10b981',
            number: '#60a5fa',
            colon: '#9ca3af',
            keys: '#f97316',
            primitive: '#a78bfa',
            error: '#ef4444',
            background: '#1f2937',
          }}
          style={{
            body: {
              fontSize: '14px',
              fontFamily: 'Fira Code, monospace',
            }
          }}
        />
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex space-x-2 overflow-x-auto py-1">
          {predefinedMessages.map((template, index) => (
            <button
              key={index}
              onClick={() => selectPredefinedMessage(template)}
              className="px-3 py-1 bg-dark-700 text-xs text-gray-300 hover:bg-dark-600 rounded-md whitespace-nowrap"
            >
              {template.type}
            </button>
          ))}
        </div>
        
        <button
          onClick={handleSend}
          disabled={disabled || !!jsonError}
          className={`px-4 py-2 rounded-md text-white font-medium flex items-center ${
            disabled || jsonError
              ? 'bg-gray-700 cursor-not-allowed'
              : 'bg-primary-600 hover:bg-primary-500'
          } transition-colors`}
        >
          <Send className="mr-2" size={16} />
          Send
        </button>
      </div>
    </div>
  );
};

export default MessageInput;