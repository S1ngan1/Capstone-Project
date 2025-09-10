// Sensor Request System Interfaces
// Enhanced version with better typing and structure
export interface SensorRequest {
  id: string
  farm_id: string
  sensor_type: 'ph' | 'ec' | 'moisture' | 'temperature' | 'light' | 'humidity'
  sensor_brand?: string
  sensor_model?: string
  quantity: number
  installation_location: string
  justification: string
  technical_requirements?: string
  budget_range: 'under_100' | '100_500' | '500_1000' | '1000_plus'
  priority_level: 'low' | 'medium' | 'high' | 'urgent'
  requested_by: string
  status: 'pending' | 'approved' | 'rejected' | 'installed' | 'cancelled'
  processed_by?: string
  admin_feedback?: string
  estimated_cost?: number
  installation_date?: string
  created_at: string
  processed_at?: string
  updated_at: string
  approval_notes?: string
  rejection_reason?: string
  installation_notes?: string
  // Related data
  farm?: {
    id: string
    name: string
    location: string
  }
  requester?: {
    id: string
    username: string
    email: string
    role: string
  }
  processor?: {
    id: string
    username: string
    email: string
    role: string
  }
  attachments?: SensorRequestAttachment[]
  status_history?: SensorRequestStatusHistory[]
}
export interface SensorRequestAttachment {
  id: string
  sensor_request_id: string
  file_name: string
  file_path: string
  file_type: string
  file_size: number
  uploaded_by: string
  created_at: string
}
export interface SensorRequestStatusHistory {
  id: string
  sensor_request_id: string
  old_status?: string
  new_status: string
  changed_by: string
  notes?: string
  created_at: string
  changer?: {
    username: string
    role: string
  }
}
export interface CreateSensorRequestData {
  farm_id: string
  sensor_type: SensorRequest['sensor_type']
  sensor_brand?: string
  sensor_model?: string
  quantity: number
  installation_location: string
  justification: string
  technical_requirements?: string
  budget_range: SensorRequest['budget_range']
  priority_level: SensorRequest['priority_level']
}
export interface UpdateSensorRequestData {
  sensor_brand?: string
  sensor_model?: string
  quantity?: number
  installation_location?: string
  justification?: string
  technical_requirements?: string
  budget_range?: SensorRequest['budget_range']
  priority_level?: SensorRequest['priority_level']
}
export interface AdminUpdateSensorRequestData {
  status?: SensorRequest['status']
  admin_feedback?: string
  estimated_cost?: number
  installation_date?: string
  approval_notes?: string
  rejection_reason?: string
  installation_notes?: string
}
export interface SensorRequestStats {
  total: number
  pending: number
  approved: number
  rejected: number
  installed: number
  cancelled: number
  by_type: Record<string, number>
  by_priority: Record<string, number>
}
export interface SensorRequestFilters {
  status?: SensorRequest['status'] | 'all'
  sensor_type?: SensorRequest['sensor_type'] | 'all'
  priority_level?: SensorRequest['priority_level'] | 'all'
  farm_id?: string
  date_range?: {
    start: string
    end: string
  }
}
// Sensor Type Definitions with enhanced metadata
export interface SensorTypeInfo {
  id: SensorRequest['sensor_type']
  name: string
  description: string
  icon: string
  typical_cost_range: string
  installation_complexity: 'easy' | 'medium' | 'complex'
  maintenance_frequency: string
  data_frequency: string
  benefits: string[]
  technical_specs: {
    measurement_range?: string
    accuracy?: string
    resolution?: string
    operating_temp?: string
    power_requirements?: string
  }
}
export const SENSOR_TYPES: Record<SensorRequest['sensor_type'], SensorTypeInfo> = {
  ph: {
    id: 'ph',
    name: 'pH Sensor',
    description: 'Measures soil acidity/alkalinity levels',
    icon: 'flask-outline',
    typical_cost_range: '$50 - $200',
    installation_complexity: 'medium',
    maintenance_frequency: 'Monthly calibration',
    data_frequency: 'Every 15 minutes',
    benefits: ['Optimize nutrient uptake', 'Prevent soil acidification', 'Improve crop yields'],
    technical_specs: {
      measurement_range: 'pH 0-14',
      accuracy: '±0.1 pH',
      resolution: '0.01 pH',
      operating_temp: '-10°C to 60°C',
      power_requirements: '3.3V - 5V DC'
    }
  },
  ec: {
    id: 'ec',
    name: 'EC Sensor',
    description: 'Measures electrical conductivity and nutrient levels',
    icon: 'flash-outline',
    typical_cost_range: '$40 - $150',
    installation_complexity: 'medium',
    maintenance_frequency: 'Bi-weekly cleaning',
    data_frequency: 'Every 15 minutes',
    benefits: ['Monitor nutrient levels', 'Prevent salt buildup', 'Optimize fertilization'],
    technical_specs: {
      measurement_range: '0-20 mS/cm',
      accuracy: '±2%',
      resolution: '0.01 mS/cm',
      operating_temp: '0°C to 50°C',
      power_requirements: '3.3V - 5V DC'
    }
  },
  moisture: {
    id: 'moisture',
    name: 'Soil Moisture Sensor',
    description: 'Measures soil water content',
    icon: 'water-outline',
    typical_cost_range: '$30 - $100',
    installation_complexity: 'easy',
    maintenance_frequency: 'Monthly cleaning',
    data_frequency: 'Every 10 minutes',
    benefits: ['Optimize irrigation', 'Prevent overwatering', 'Conserve water'],
    technical_specs: {
      measurement_range: '0-100% VWC',
      accuracy: '±3%',
      resolution: '0.1%',
      operating_temp: '-40°C to 60°C',
      power_requirements: '3.3V - 5V DC'
    }
  },
  temperature: {
    id: 'temperature',
    name: 'Temperature Sensor',
    description: 'Measures soil and ambient temperature',
    icon: 'thermometer-outline',
    typical_cost_range: '$20 - $80',
    installation_complexity: 'easy',
    maintenance_frequency: 'Quarterly check',
    data_frequency: 'Every 5 minutes',
    benefits: ['Monitor growing conditions', 'Predict plant stress', 'Optimize planting times'],
    technical_specs: {
      measurement_range: '-55°C to 125°C',
      accuracy: '±0.5°C',
      resolution: '0.1°C',
      operating_temp: '-55°C to 125°C',
      power_requirements: '2.7V - 5.5V DC'
    }
  },
  light: {
    id: 'light',
    name: 'Light Sensor',
    description: 'Measures light intensity and photoperiod',
    icon: 'sunny-outline',
    typical_cost_range: '$25 - $120',
    installation_complexity: 'easy',
    maintenance_frequency: 'Monthly cleaning',
    data_frequency: 'Every 15 minutes',
    benefits: ['Monitor light exposure', 'Optimize greenhouse lighting', 'Track photoperiod'],
    technical_specs: {
      measurement_range: '0-200,000 lux',
      accuracy: '±5%',
      resolution: '1 lux',
      operating_temp: '-40°C to 85°C',
      power_requirements: '2.4V - 3.6V DC'
    }
  },
  humidity: {
    id: 'humidity',
    name: 'Humidity Sensor',
    description: 'Measures relative humidity levels',
    icon: 'cloud-outline',
    typical_cost_range: '$35 - $90',
    installation_complexity: 'easy',
    maintenance_frequency: 'Monthly check',
    data_frequency: 'Every 10 minutes',
    benefits: ['Prevent fungal diseases', 'Optimize ventilation', 'Monitor plant stress'],
    technical_specs: {
      measurement_range: '0-100% RH',
      accuracy: '±2%',
      resolution: '0.1%',
      operating_temp: '-40°C to 80°C',
      power_requirements: '1.8V - 3.6V DC'
    }
  }
}
export const BUDGET_RANGES = {
  under_100: 'Under $100',
  '100_500': '$100 - $500',
  '500_1000': '$500 - $1,000',
  '1000_plus': 'Over $1,000'
}
export const PRIORITY_LEVELS = {
  low: { label: 'Low', color: '#4CAF50', description: 'Can wait 2-4 weeks' },
  medium: { label: 'Medium', color: '#FF9800', description: 'Needed within 1-2 weeks' },
  high: { label: 'High', color: '#F44336', description: 'Needed within a few days' },
  urgent: { label: 'Urgent', color: '#D32F2F', description: 'Immediate installation required' }
}
export const STATUS_INFO = {
  pending: { label: 'Pending Review', color: '#FF9800', icon: 'time-outline' },
  approved: { label: 'Approved', color: '#4CAF50', icon: 'checkmark-circle-outline' },
  rejected: { label: 'Rejected', color: '#F44336', icon: 'close-circle-outline' },
  installed: { label: 'Installed', color: '#2196F3', icon: 'hardware-chip-outline' },
  cancelled: { label: 'Cancelled', color: '#666', icon: 'ban-outline' }
}
