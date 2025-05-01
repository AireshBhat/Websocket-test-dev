export interface Message {
  id: string;
  timestamp: number;
  direction: 'in' | 'out';
  content: any;
  type: string;
}

export interface ConnectionProfile {
  id: string;
  name: string;
  url: string;
  privateKey: string;
}

export interface ConnectionStatus {
  state: 'disconnected' | 'connecting' | 'connected' | 'error';
  message: string;
  timestamp: number;
}

export interface ConnectionStats {
  connectedSince?: number;
  messagesSent: number;
  messagesReceived: number;
  lastMessageAt?: number;
  reconnectAttempts: number;
}

export interface TestKey {
  user_id: number;
  username: string;
  private_key: string;
  public_key: string;
  index: number;
}