import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { useAuthContext } from '../context/AuthContext'
import { useDialog } from '../context/DialogContext'
import { supabase } from '../lib/supabase'
import BottomNavigation from '../components/BottomNavigation'
import UVSimple from '../components/Charts/UVSimple'
// Types
interface SensorData {
  id: string
  name: string
  type: string
  status: 'active' | 'inactive' | 'maintenance'
  last_reading: number
  unit: string
  updated_at: string
  location?: string
  battery_level?: number
  signal_strength?: number
  calibration_date?: string
  farm_id: string
}
interface SensorReading {
  id: string
  value: number
  timestamp: string
}
type RootStackParamList = {
  SensorDetail: { sensorId: string }
}
type SensorDetailRouteProp = RouteProp<RootStackParamList, 'SensorDetail'>
const SensorDetail = () => {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const route = useRoute<SensorDetailRouteProp>()
  const { session } = useAuthContext()
  const { sensorId } = route.params
  const [sensorData, setSensorData] = useState<SensorData | null>(null)
  const [recentReadings, setRecentReadings] = useState<SensorReading[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetchSensorDetails()
  }, [sensorId])
  const fetchSensorDetails = async () => {
    if (!sensorId) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      // Fetch real sensor details using correct column names
      const { data: sensorInfo, error: sensorError } = await supabase
        .from('sensor')
        .select(`
          sensor_id,
          sensor_name,
          sensor_type,
          status,
          units,
          farm_id,
          model,
          measurement_range,
          accuracy,
          calibration_date,
          notes
        `)
        .eq('sensor_id', sensorId)
        .single()
      if (!sensorError && sensorInfo) {
        // Fetch the most recent reading for this sensor
        const { data: latestReading, error: readingError } = await supabase
          .from('sensor_data')
          .select('value, created_at')
          .eq('sensor_id', sensorId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        const sensorData: SensorData = {
          id: sensorInfo.sensor_id,
          name: sensorInfo.sensor_name || 'Unknown Sensor',
          type: sensorInfo.sensor_type || 'unknown',
          status: sensorInfo.status as 'active' | 'inactive' | 'maintenance' || 'inactive',
          last_reading: latestReading?.value || 0,
          unit: sensorInfo.units || '',
          updated_at: latestReading?.created_at || sensorInfo.calibration_date || new Date().toISOString(),
          location: sensorInfo.notes || 'Unknown Location',
          battery_level: Math.floor(Math.random() * 40) + 60, // Mock for now
          signal_strength: Math.floor(Math.random() * 30) + 70, // Mock for now
          calibration_date: sensorInfo.calibration_date || new Date().toISOString(),
          farm_id: sensorInfo.farm_id
        }
        setSensorData(sensorData)
        // Fetch recent readings for this sensor (last 10 readings)
        const { data: recentReadingsData, error: readingsError } = await supabase
          .from('sensor_data')
          .select('id, value, created_at')
          .eq('sensor_id', sensorId)
          .order('created_at', { ascending: false })
          .limit(10)
        if (!readingsError && recentReadingsData) {
          const formattedReadings: SensorReading[] = recentReadingsData.map((reading) => ({
            id: reading.id,
            value: reading.value,
            timestamp: reading.created_at
          }))
          setRecentReadings(formattedReadings)
        } else {
          setRecentReadings([])
        }
      } else {
        console.error('Error fetching sensor details:', sensorError)
        // Fallback to empty data if sensor not found
        setSensorData({
          id: sensorId,
          name: `Sensor ${sensorId}`,
          type: 'unknown',
          status: 'inactive',
          last_reading: 0,
          unit: '',
          updated_at: new Date().toISOString(),
          location: 'Unknown',
          battery_level: 0,
          signal_strength: 0,
          calibration_date: new Date().toISOString(),
          farm_id: 'unknown'
        })
        setRecentReadings([])
      }
    } catch (error) {
      console.error('Error fetching sensor details:', error)
      setSensorData(null)
      setRecentReadings([])
    } finally {
      setLoading(false)
    }
  }
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#28a745'
      case 'inactive':
        return '#dc3545'
      case 'maintenance':
        return '#ffc107'
      default:
        return '#6c757d'
    }
  }
  const getBatteryColor = (level: number) => {
    if (level > 50) return '#28a745'
    if (level > 20) return '#ffc107'
    return '#dc3545'
  }
  const getSignalColor = (strength: number) => {
    if (strength > 80) return '#28a745'
    if (strength > 50) return '#ffc107'
    return '#dc3545'
  }
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  const renderChart = () => {
    if (sensorData?.type === 'pH') {
      // Simple pH chart fallback to avoid Skia conflicts
      return (
        <View style={{ height: 200, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 8, width: '100%' }}>
          <Text style={{ fontSize: 16, color: '#666', marginBottom: 8 }}>pH Chart</Text>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#4CAF50' }}>
            {sensorData?.last_reading.toFixed(1)} pH
          </Text>
          <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Current Reading</Text>
        </View>
      )
    } else if (sensorData?.type === 'uv') {
      return <UVSimple />
    }
    return (
      <View style={{ height: 200, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 8, width: '100%' }}>
        <Text style={{ fontSize: 16, color: '#666', marginBottom: 8 }}>Sensor Chart</Text>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#4CAF50' }}>
          {sensorData?.last_reading} {sensorData?.unit}
        </Text>
        <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Current Reading</Text>
      </View>
    )
  }
  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={['#e7fbe8ff', '#cdffcfff']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.background}
        >
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading sensor details...</Text>
          </View>
        </LinearGradient>
      </View>
    )
  }
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#e7fbe8ff', '#cdffcfff']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.background}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sensor Details</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Sensor Overview */}
          <View style={styles.section}>
            <View style={styles.sensorHeader}>
              <View style={styles.sensorIcon}>
                <Ionicons name="hardware-chip" size={32} color="#4CAF50" />
              </View>
              <View style={styles.sensorInfo}>
                <Text style={styles.sensorName}>{sensorData?.name}</Text>
                <Text style={styles.sensorType}>{sensorData?.type?.toUpperCase()}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(sensorData?.status || 'inactive') }]}>
                  <Text style={styles.statusText}>{sensorData?.status?.toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.currentReading}>
                <Text style={styles.readingValue}>
                  {sensorData?.last_reading} {sensorData?.unit}
                </Text>
                <Text style={styles.lastUpdated}>
                  {sensorData?.updated_at ? formatDate(sensorData.updated_at) : 'Unknown'}
                </Text>
              </View>
            </View>
          </View>
          {/* Chart Section */}
          {renderChart() && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Data Visualization</Text>
              <View style={styles.chartContainer}>
                {renderChart()}
              </View>
            </View>
          )}
          {/* Sensor Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sensor Status</Text>
            <View style={styles.statusGrid}>
              <View style={styles.statusCard}>
                <Ionicons name="battery-half" size={24} color={getBatteryColor(sensorData?.battery_level || 0)} />
                <Text style={styles.statusLabel}>Battery</Text>
                <Text style={styles.statusValue}>{sensorData?.battery_level}%</Text>
              </View>
              <View style={styles.statusCard}>
                <Ionicons name="wifi" size={24} color={getSignalColor(sensorData?.signal_strength || 0)} />
                <Text style={styles.statusLabel}>Signal</Text>
                <Text style={styles.statusValue}>{sensorData?.signal_strength}%</Text>
              </View>
              <View style={styles.statusCard}>
                <Ionicons name="location" size={24} color="#4CAF50" />
                <Text style={styles.statusLabel}>Location</Text>
                <Text style={styles.statusValue}>{sensorData?.location || 'Unknown'}</Text>
              </View>
              <View style={styles.statusCard}>
                <Ionicons name="calendar" size={24} color="#4CAF50" />
                <Text style={styles.statusLabel}>Calibrated</Text>
                <Text style={styles.statusValue}>
                  {sensorData?.calibration_date ?
                    new Date(sensorData.calibration_date).toLocaleDateString() : 'Unknown'}
                </Text>
              </View>
            </View>
          </View>
          {/* Recent Readings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Readings ({recentReadings.length})</Text>
            <View style={styles.readingsContainer}>
              {recentReadings.map((reading) => (
                <View key={reading.id} style={styles.readingCard}>
                  <Text style={styles.readingValueText}>
                    {reading.value.toFixed(1)} {sensorData?.unit}
                  </Text>
                  <Text style={styles.readingTime}>
                    {formatDate(reading.timestamp)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          {/* Bottom spacer */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
        <BottomNavigation />
      </LinearGradient>
    </View>
  )
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    paddingBottom: 70,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  settingsButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  sensorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sensorIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e7fbe8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  sensorInfo: {
    flex: 1,
  },
  sensorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sensorType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  currentReading: {
    alignItems: 'flex-end',
  },
  readingValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#666',
  },
  chartContainer: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 10,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statusCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  readingsContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  readingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  readingValueText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  readingTime: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  bottomSpacer: {
    height: 70,
  },
})
export default SensorDetail
