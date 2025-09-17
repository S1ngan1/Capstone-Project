// Demo data for tutorial purposes when users have no real farms/sensors
export const demoData = {
  sampleFarm: {
    id: 'demo-farm-1',
    name: 'Green Valley Demo Farm',
    location: 'Ho Chi Minh City',
    address: '123 Demo Street, District 1',
    notes: 'This is a demonstration farm to show you how the app works. In reality, you would add your own farm details here.'
  },

  sampleSensors: [
    {
      id: 'demo-sensor-1',
      name: 'Soil pH Monitor',
      type: 'pH Sensor',
      status: 'active' as const,
      last_reading: 6.8,
      unit: 'pH',
      updated_at: new Date().toISOString(),
      farm_id: 'demo-farm-1',
      location: 'North Field'
    },
    {
      id: 'demo-sensor-2',
      name: 'Moisture Detector',
      type: 'Soil Moisture',
      status: 'active' as const,
      last_reading: 45,
      unit: '%',
      updated_at: new Date().toISOString(),
      farm_id: 'demo-farm-1',
      location: 'Central Field'
    },
    {
      id: 'demo-sensor-3',
      name: 'Temperature Monitor',
      type: 'Temperature',
      status: 'active' as const,
      last_reading: 28,
      unit: '°C',
      updated_at: new Date().toISOString(),
      farm_id: 'demo-farm-1',
      location: 'Greenhouse'
    }
  ],

  sampleTeamMembers: [
    {
      id: 'demo-user-1',
      user_id: 'demo-user-1',
      farm_role: 'owner',
      profiles: {
        username: 'Farm Owner (You)',
        email: 'demo@farmassistant.com',
        role: 'user'
      }
    },
    {
      id: 'demo-user-2',
      user_id: 'demo-user-2',
      farm_role: 'manager',
      profiles: {
        username: 'John Manager',
        email: 'john@farmassistant.com',
        role: 'user'
      }
    }
  ],

  sampleNotifications: [
    {
      id: 'demo-notif-1',
      title: 'Soil pH Alert',
      content: 'Soil pH levels are optimal at 6.8 for your Green Valley Farm',
      level: 'normal' as const,
      timestamp: new Date().toISOString(),
      read: false
    },
    {
      id: 'demo-notif-2',
      title: 'Weather Update',
      content: 'Rain expected tomorrow - consider adjusting irrigation schedule',
      level: 'warning' as const,
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      read: false
    }
  ],

  sampleRequests: [
    {
      id: 'demo-req-1',
      farm_name: 'Demo Farm Request',
      location: 'Can Tho',
      notes: 'This is what a farm request looks like when you apply to add a new farm',
      status: 'pending' as const,
      created_at: new Date().toISOString()
    }
  ],

  sampleSensorRequests: [
    {
      id: 'demo-sensor-req-1',
      sensor_type: 'pH Sensor',
      quantity: 2,
      farm_name: 'Green Valley Demo Farm',
      justification: 'Need pH sensors to monitor soil acidity for optimal crop growth',
      status: 'pending' as const,
      created_at: new Date().toISOString()
    }
  ],

  sampleActivities: [
    {
      id: 'demo-activity-1',
      action: 'Sensor Reading Updated',
      description: 'Soil moisture sensor reported 45% moisture level',
      timestamp: new Date().toISOString(),
      farm_name: 'Green Valley Demo Farm'
    },
    {
      id: 'demo-activity-2',
      action: 'Farm Added',
      description: 'Successfully added Green Valley Demo Farm to your account',
      timestamp: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      farm_name: 'Green Valley Demo Farm'
    }
  ]
}

export const isDemoMode = () => {
  // Check if user has any real farms/sensors, if not, we can suggest demo mode
  return false // This will be dynamically determined
}
