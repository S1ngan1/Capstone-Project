import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '../../lib/supabase'
interface SensorReading {
  id: string
  value: number
  timestamp: string
  sensor: {
    name: string
    type: string
    unit: string
  }
}
interface SensorDataTableProps {
  farmId: string
}
const SensorDataTable: React.FC<SensorDataTableProps> = ({ farmId }) => {
  const [sensorData, setSensorData] = useState<{
    ec: SensorReading[]
    ph: SensorReading[]
    soilMoisture: SensorReading[]
    temperature: SensorReading[]
  }>({
    ec: [],
    ph: [],
    soilMoisture: [],
    temperature: []
  })
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetchAllSensorData()
  }, [farmId])
  const fetchAllSensorData = async () => {
    try {
      setLoading(true)
      console.log(`Fetching all sensor data for farm ${farmId}...`)
      // Map sensor type names to match database values
      const sensorTypeMap: { [key: string]: string } = {
        'ec': 'Electrical Conductivity',
        'ph': 'Analog pH Sensor',
        'soilMoisture': 'Capacitive Soil Moisture',
        'temperature': 'Digital Temperature'
      }
      const allData: any = {
        ec: [],
        ph: [],
        soilMoisture: [],
        temperature: []
      }
      // Fetch data for each sensor type
      for (const [key, dbType] of Object.entries(sensorTypeMap)) {
        try {
          // Get sensors of this type for this farm
          const { data: sensors, error: sensorError } = await supabase
            .from('sensor')
            .select('sensor_id, sensor_name, sensor_type, units')
            .eq('sensor_type', dbType)
            .eq('farm_id', farmId)
          if (!sensorError && sensors && sensors.length > 0) {
            const sensorIds = sensors.map(s => s.sensor_id)
            // Get recent readings for these sensors
            const { data: readings, error: readingError } = await supabase
              .from('sensor_data')
              .select('id, value, created_at, sensor_id')
              .in('sensor_id', sensorIds)
              .order('created_at', { ascending: false })
              .limit(10)
            if (!readingError && readings && readings.length > 0) {
              // Transform readings to match expected format
              const transformedReadings = readings.map(reading => {
                const sensor = sensors.find(s => s.sensor_id === reading.sensor_id)
                return {
                  id: reading.id,
                  value: reading.value,
                  timestamp: reading.created_at,
                  sensor: {
                    name: sensor?.sensor_name || 'Unknown Sensor',
                    type: sensor?.sensor_type || 'Unknown Type',
                    unit: sensor?.units || ''
                  }
                }
              })
              allData[key] = transformedReadings
            }
          }
        } catch (error) {
          console.error(`Error fetching ${key} data:`, error)
        }
      }
      setSensorData(allData)
    } catch (error) {
      console.error('Error fetching sensor data:', error)
    } finally {
      setLoading(false)
    }
  }
  const getStatusColor = (value: number, type: string): string => {
    switch (type) {
      case 'ec':
        if (value < 1.0) return '#2196F3'
        if (value > 1.8) return '#FF9800'
        return '#4CAF50'
      case 'ph':
        if (value < 6.5) return '#2196F3'
        if (value > 7.5) return '#FF9800'
        return '#4CAF50'
      case 'soilMoisture':
        if (value < 40) return '#2196F3'
        if (value > 70) return '#FF9800'
        return '#4CAF50'
      case 'temperature':
        if (value < 20) return '#2196F3'
        if (value > 28) return '#FF9800'
        return '#4CAF50'
      default:
        return '#666'
    }
  }
  const formatValue = (value: number, unit: string): string => {
    return `${value.toFixed(2)} ${unit}`
  }
  const getStatusText = (value: number, type: string): string => {
    const color = getStatusColor(value, type)
    if (color === '#4CAF50') return 'Normal'
    if (color === '#FF9800') return 'High'
    return 'Low'
  }
  const renderSensorPanel = (data: SensorReading[], title: string, type: string, icon: string) => {
    const latestReading = data.length > 0 ? data[0] : null
    const statusColor = latestReading ? getStatusColor(latestReading.value, type) : '#666'
    const statusText = latestReading ? getStatusText(latestReading.value, type) : 'No Data'
    return (
      <View style={styles.sensorPanel} key={title}>
        <LinearGradient
          colors={['#ffffff', '#f8f9fa']}
          style={styles.panelGradient}
        >
          <View style={styles.panelHeader}>
            <Text style={styles.panelIcon}>{icon}</Text>
            <Text style={styles.panelTitle}>{title}</Text>
          </View>
          {latestReading ? (
            <>
              <View style={styles.currentValue}>
                <Text style={styles.valueText}>
                  {formatValue(latestReading.value, latestReading.sensor.unit)}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                  <Text style={styles.statusBadgeText}>{statusText}</Text>
                </View>
              </View>
              <Text style={styles.lastUpdate}>
                Updated: {new Date(latestReading.timestamp).toLocaleTimeString()}
              </Text>
              {data.length > 1 && (
                <View style={styles.trendContainer}>
                  <Text style={styles.trendTitle}>Recent Readings:</Text>
                  {data.slice(1, 4).map((reading, index) => (
                    <View key={reading.id} style={styles.trendItem}>
                      <Text style={styles.trendTime}>
                        {new Date(reading.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                      <Text style={styles.trendValue}>
                        {formatValue(reading.value, reading.sensor.unit)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No sensor data</Text>
            </View>
          )}
        </LinearGradient>
      </View>
    )
  }
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading sensor data...</Text>
      </View>
    )
  }
  return (
    <View style={styles.container}>
      <View style={styles.gridContainer}>
        <View style={styles.gridRow}>
          {renderSensorPanel(sensorData.ec, 'EC', 'ec', '⚡')}
          {renderSensorPanel(sensorData.soilMoisture, 'Soil Moisture', 'soilMoisture', '💧')}
        </View>
        <View style={styles.gridRow}>
          {renderSensorPanel(sensorData.temperature, 'Temperature', 'temperature', '🌡️')}
          {renderSensorPanel(sensorData.ph, 'pH Level', 'ph', '⚗️')}
        </View>
      </View>
    </View>
  )
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  gridContainer: {
    flex: 1,
    padding: 10,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sensorPanel: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  panelGradient: {
    padding: 15,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  panelIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  currentValue: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  valueText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  lastUpdate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  trendContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 10,
  },
  trendTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  trendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  trendTime: {
    fontSize: 12,
    color: '#666',
  },
  trendValue: {
    fontSize: 12,
    color: '#333',
  },
  noDataContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(240, 240, 240, 0.5)',
    borderRadius: 8,
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
})
export default SensorDataTable
