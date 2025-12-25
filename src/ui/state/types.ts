export interface Screen {
  id: string;
  name: string;
}

export interface MenuItem {
  label: string;
  action: () => void;
  icon?: string;
}

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}
