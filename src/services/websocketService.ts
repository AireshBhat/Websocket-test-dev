import { createAuthenticatedClient, generateKeyPair } from '../utils/websocketClient';
import { Message, ConnectionStatus, ConnectionStats } from '../types';
import { nanoid } from 'nanoid';

class WebSocketService {
  private client: any = null;
  private url: string = '';
  private privateKey: string = '';
  private status: ConnectionStatus = {
    state: 'disconnected',
    message: 'Not connected',
    timestamp: Date.now(),
  };
  private stats: ConnectionStats = {
    messagesSent: 0,
    messagesReceived: 0,
    reconnectAttempts: 0,
  };
  private messageHistory: Message[] = [];
  private statusListeners: ((status: ConnectionStatus) => void)[] = [];
  private messageListeners: ((message: Message) => void)[] = [];
  private statsListeners: ((stats: ConnectionStats) => void)[] = [];
  private autoReconnect: boolean = false;
  private reconnectTimer: number | null = null;
  private reconnectInterval: number = 5000; // ms

  constructor() {
    // Initialize with stored values if available
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage() {
    try {
      const savedMessages = localStorage.getItem('wsMessageHistory');
      if (savedMessages) {
        this.messageHistory = JSON.parse(savedMessages);
      }
    } catch (error) {
      console.error('Failed to load message history from localStorage:', error);
    }
  }

  private saveToLocalStorage() {
    try {
      // Keep only the last 100 messages to prevent localStorage from getting too large
      const historyToSave = this.messageHistory.slice(-100);
      localStorage.setItem('wsMessageHistory', JSON.stringify(historyToSave));
    } catch (error) {
      console.error('Failed to save message history to localStorage:', error);
    }
  }

  public async connect(url: string, privateKey: string): Promise<void> {
    // Clean up any existing connection
    if (this.client) {
      this.disconnect();
    }

    this.url = url;
    this.privateKey = privateKey;

    this.updateStatus({
      state: 'connecting',
      message: `Connecting to ${url}...`,
      timestamp: Date.now(),
    });

    try {
      this.client = await createAuthenticatedClient(url, privateKey);
      
      this.updateStatus({
        state: 'connected',
        message: `Connected to ${url}`,
        timestamp: Date.now(),
      });

      this.stats = {
        ...this.stats,
        connectedSince: Date.now(),
        reconnectAttempts: 0,
      };
      this.notifyStatsListeners();

      // Set up message handler
      this.client.onMessage((msg: any) => {
        const message: Message = {
          id: nanoid(),
          timestamp: Date.now(),
          direction: 'in',
          content: msg,
          type: msg.type || 'unknown',
        };

        this.messageHistory.push(message);
        this.saveToLocalStorage();
        
        this.stats.messagesReceived += 1;
        this.stats.lastMessageAt = Date.now();
        this.notifyStatsListeners();
        
        this.notifyMessageListeners(message);
      });
    } catch (error) {
      this.updateStatus({
        state: 'error',
        message: `Connection failed: ${(error as Error).message}`,
        timestamp: Date.now(),
      });

      if (this.autoReconnect) {
        this.scheduleReconnect();
      }
    }
  }

  public disconnect(): void {
    if (this.client) {
      try {
        this.client.close();
      } catch (error) {
        console.error('Error closing WebSocket connection:', error);
      }
      this.client = null;

      this.updateStatus({
        state: 'disconnected',
        message: 'Disconnected',
        timestamp: Date.now(),
      });

      this.stats = {
        ...this.stats,
        connectedSince: undefined,
      };
      this.notifyStatsListeners();
    }

    // Cancel any pending reconnect
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  public send(message: any): void {
    if (!this.client) {
      throw new Error('Not connected');
    }

    try {
      this.client.send(message);
      
      const messageObj: Message = {
        id: nanoid(),
        timestamp: Date.now(),
        direction: 'out',
        content: message,
        type: message.type || 'unknown',
      };

      this.messageHistory.push(messageObj);
      this.saveToLocalStorage();
      
      this.stats.messagesSent += 1;
      this.stats.lastMessageAt = Date.now();
      this.notifyStatsListeners();
      
      this.notifyMessageListeners(messageObj);
    } catch (error) {
      this.updateStatus({
        state: 'error',
        message: `Failed to send message: ${(error as Error).message}`,
        timestamp: Date.now(),
      });

      // If the send failed due to connection issues, try to reconnect
      if (this.autoReconnect && this.status.state !== 'connecting') {
        this.scheduleReconnect();
      }
    }
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public getStats(): ConnectionStats {
    return this.stats;
  }

  public getMessages(): Message[] {
    return [...this.messageHistory];
  }

  public clearMessages(): void {
    this.messageHistory = [];
    this.saveToLocalStorage();
    // Notify listeners that messages have been cleared
    this.notifyMessageListeners({
      id: nanoid(),
      timestamp: Date.now(),
      direction: 'in',
      content: { type: 'system', message: 'Messages cleared' },
      type: 'system',
    });
  }

  public onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.push(callback);
    // Immediately notify with current status
    callback(this.status);
    
    // Return unsubscribe function
    return () => {
      this.statusListeners = this.statusListeners.filter(cb => cb !== callback);
    };
  }

  public onMessage(callback: (message: Message) => void): () => void {
    this.messageListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.messageListeners = this.messageListeners.filter(cb => cb !== callback);
    };
  }

  public onStatsChange(callback: (stats: ConnectionStats) => void): () => void {
    this.statsListeners.push(callback);
    // Immediately notify with current stats
    callback(this.stats);
    
    // Return unsubscribe function
    return () => {
      this.statsListeners = this.statsListeners.filter(cb => cb !== callback);
    };
  }

  public setAutoReconnect(enabled: boolean, interval?: number): void {
    this.autoReconnect = enabled;
    if (interval) {
      this.reconnectInterval = interval;
    }
  }

  private updateStatus(status: ConnectionStatus): void {
    this.status = status;
    this.notifyStatusListeners();
  }

  private notifyStatusListeners(): void {
    this.statusListeners.forEach(listener => listener(this.status));
  }

  private notifyMessageListeners(message: Message): void {
    this.messageListeners.forEach(listener => listener(message));
  }

  private notifyStatsListeners(): void {
    this.statsListeners.forEach(listener => listener(this.stats));
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
    }

    this.stats.reconnectAttempts += 1;
    this.notifyStatsListeners();

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.updateStatus({
        state: 'connecting',
        message: `Reconnecting (attempt ${this.stats.reconnectAttempts})...`,
        timestamp: Date.now(),
      });
      this.connect(this.url, this.privateKey).catch(() => {
        // If reconnect fails, schedule another attempt
        if (this.autoReconnect) {
          this.scheduleReconnect();
        }
      });
    }, this.reconnectInterval);
  }

  public async generateNewKeyPair(): Promise<{ privateKey: string, publicKey: string }> {
    return await generateKeyPair();
  }
}

// Create singleton instance
const websocketService = new WebSocketService();
export default websocketService;