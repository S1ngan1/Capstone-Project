// Common interfaces for the application

// User and Authentication
export interface User {
  id: string;
  email: string;
  username: string;
  role: 'owner' | 'manager' | 'viewer';
  created_at: string;
  updated_at?: string;
}

// Farm related interfaces
export interface Farm {
  id: string;
  name: string;
  location: string;
  created_at?: string;
  updated_at?: string;
}

export interface FarmUser {
  id: string;
  user_id: string;
  farm_role: string;
  profiles: {
    username: string;
    email: string;
    role: string;
  };
}

export interface FarmWithRole {
  id: string;
  farm_id: string;
  user_id: string;
  farm_role: string;
  farms: Farm;
}

export interface UserFarmRole {
  id: string;
  farm_id: string;
  farm_role: string;
  farms: {
    name: string;
    location: string;
  };
}

// Sensor related interfaces
export interface Sensor {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'maintenance';
  last_reading: number;
  unit: string;
  updated_at: string;
  farm_id: string;
  location?: string;
}

export interface SensorData {
  id: string;
  sensor_id: string;
  value: number;
  timestamp: string;
  sensors: {
    id: string;
    name: string;
    type: string;
    status: string;
    unit: string;
    farm_id: string;
    location?: string;
  };
}

// Notification interfaces
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  content: string; // This matches 'message' field in database
  message?: string; // Database field mapping - optional for backward compatibility
  type: 'sensor_alert' | 'farm_invite' | 'system' | 'weather' | 'general' | 'farm_request' | 'sensor_request';
  level: 'urgent' | 'warning' | 'normal';
  is_read: boolean;
  farm_id?: string;
  sensor_id?: string;
  created_at: string;
  read_at?: string;
}

export interface NotificationData {
  id: string;
  fullContent: string;
  displayTime: string;
  section: 'Temperature' | 'Earlier' | 'Other';
  level: 'urgent' | 'warning' | 'normal';
  actionButtons?: { label: string; onClick: () => void }[];
}

// UI Component interfaces
export interface SectionItem {
  id: string;
  title: string;
  type: 'weather' | 'sensorData' | 'sensors' | 'members';
  enabled: boolean;
  icon: string;
}

export interface NotiPieceProps {
  content: string;
  time: string;
  level: 'urgent' | 'warning' | 'normal';
  isRead: boolean;
  onPress?: () => void;
  onMorePress?: () => void;
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Home: undefined;
  Farm: undefined;
  FarmDetails: { farmId: string };
  CreateFarm: undefined;
  Settings: undefined;
  Suggestion: undefined;
  Notification: undefined;
  SensorDetail: { sensorId: string };
  UserDetail: { userId: string };
  UserManagement: undefined;
};

// Context interfaces
export interface AuthContextType {
  session: any | null;
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  refreshNotifications: () => void;
}

// OnBoarding interfaces
export interface OnBoardingData {
  id: number;
  animation: any;
  text: string;
  textColor: string;
  backgroundColor: string;
}
