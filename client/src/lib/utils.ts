import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: string | number, currency: string = "EGP"): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  
  if (isNaN(num)) return "0";
  
  if (currency === "USDT") {
    return num.toFixed(2);
  } else if (currency === "EGP") {
    return num.toLocaleString("ar-EG", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  } else if (currency === "ASSER") {
    return num.toLocaleString("ar-EG", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
  
  return num.toString();
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTimeRemaining(targetDate: Date): string {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();
  
  if (diff <= 0) return "00:00:00";
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function generateReferralLink(userId: string): string {
  return `https://assercoin.com/ref/${userId}`;
}

export function validateGmailEmail(email: string): boolean {
  return email.toLowerCase().endsWith("@gmail.com");
}

export function generateRandomId(length: number = 5): string {
  return Math.floor(Math.pow(10, length - 1) + Math.random() * 9 * Math.pow(10, length - 1)).toString();
}

export function simulateCountryFromIP(ip: string): string {
  // Simulate geolocation based on IP patterns
  const countries = [
    "مصر", "السعودية", "الإمارات العربية المتحدة", 
    "الكويت", "قطر", "الأردن", "لبنان", "العراق", 
    "المغرب", "الجزائر", "تونس", "السودان"
  ];
  
  // Use a simple hash of the IP to get consistent results
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return countries[Math.abs(hash) % countries.length];
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  
  constructor(
    private url: string,
    private onMessage?: (data: any) => void,
    private onOpen?: () => void,
    private onClose?: () => void,
    private onError?: (error: Event) => void
  ) {}
  
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    
    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.onOpen?.();
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.onMessage?.(data);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };
      
      this.ws.onclose = () => {
        this.onClose?.();
        this.attemptReconnect();
      };
      
      this.ws.onerror = (error) => {
        this.onError?.(error);
      };
    } catch (error) {
      console.error("Error creating WebSocket connection:", error);
      this.attemptReconnect();
    }
  }
  
  send(data: any): boolean {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    }
    return false;
  }
  
  disconnect(): void {
    this.ws?.close();
    this.ws = null;
  }
  
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        this.connect();
      }, delay);
    }
  }
  
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
  } else {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      return Promise.resolve(successful);
    } catch (error) {
      document.body.removeChild(textArea);
      return Promise.resolve(false);
    }
  }
}
