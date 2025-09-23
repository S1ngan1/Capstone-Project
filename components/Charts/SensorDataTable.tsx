import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, RefreshControl } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { useNavigation } from '@react-navigation/native'
import Svg, { Polyline, Circle, Line, Text as SvgText, G } from 'react-native-svg'

const { width, height } = Dimensions.get('window')
const isSmallDevice = width < 350
const isMediumDevice = width >= 350 && width <= 400

// Responsive calculations
const responsivePadding = isSmallDevice ? 10 : isMediumDevice ? 14 : 18
const responsiveFontSize = isSmallDevice ? 12 : isMediumDevice ? 14 : 16
const responsiveValueSize = isSmallDevice ? 20 : isMediumDevice ? 24 : 28
const responsiveTitleSize = isSmallDevice ? 14 : isMediumDevice ? 16 : 18

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

// Custom Line Chart Component using react-native-svg
const CustomLineChart: React.FC<{
  data: number[]
  timestamps: string[]
  color: string
  unit: string
}> = ({ data, timestamps, color, unit }) => {
  if (data.length < 2) return null

  const chartWidth = width - 60
  const chartHeight = 120 // Reduced height for cleaner look
  const padding = 40 // Reduced padding

  // Improved chart scaling - better range calculation for moderate values
  const dataMin = Math.min(...data)
  const dataMax = Math.max(...data)
  const dataRange = dataMax - dataMin
  const avgValue = (dataMin + dataMax) / 2

  let minValue: number
  let maxValue: number

  // Smart scaling based on data characteristics
  if (dataRange < 2) {
    // Very small range - expand significantly to show variation
    const center = avgValue
    const expandedRange = Math.max(10, center * 0.8) // At least 10, or 80% of center value
    minValue = Math.max(0, center - expandedRange / 2)
    maxValue = center + expandedRange / 2
  } else if (avgValue >= 4 && avgValue <= 8 && dataMax < 12) {
    // Moderate values (around 5) - use 0 to 10 or 0 to 15 range
    minValue = 0
    maxValue = dataMax < 8 ? 10 : 15
  } else if (avgValue > 0 && dataMax < avgValue * 2) {
    // General case - ensure good middle positioning
    minValue = Math.max(0, dataMin - dataRange * 0.3)
    maxValue = dataMax + dataRange * 0.5

    // Round to nice numbers for better readability
    if (maxValue < 20) {
      maxValue = Math.ceil(maxValue / 5) * 5 // Round to nearest 5
    } else if (maxValue < 100) {
      maxValue = Math.ceil(maxValue / 10) * 10 // Round to nearest 10
    }
  } else {
    // Default case - simple expansion
    minValue = Math.max(0, dataMin * 0.9)
    maxValue = dataMax * 1.2
  }

  const valueRange = maxValue - minValue || 1

  // Create points for the line
  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (chartWidth - 2 * padding)
    const y = chartHeight - padding - ((value - minValue) / valueRange) * (chartHeight - 2 * padding)
    return `${x},${y}`
  }).join(' ')

  return (
    <View style={styles.chartContainer}>
      <Svg height={chartHeight} width={chartWidth}>
        {/* Simple grid lines */}
        <Line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={chartHeight - padding}
          stroke="#e0e0e0"
          strokeWidth="1"
        />
        <Line
          x1={padding}
          y1={chartHeight - padding}
          x2={chartWidth - padding}
          y2={chartHeight - padding}
          stroke="#e0e0e0"
          strokeWidth="1"
        />

        {/* Data line */}
        <Polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Simple data points */}
        {data.map((value, index) => {
          const x = padding + (index / (data.length - 1)) * (chartWidth - 2 * padding)
          const y = chartHeight - padding - ((value - minValue) / valueRange) * (chartHeight - 2 * padding)

          return (
            <Circle
              key={index}
              cx={x}
              cy={y}
              r="3"
              fill={color}
              stroke="white"
              strokeWidth="1"
            />
          )
        })}

        {/* Simple Y-axis labels */}
        <SvgText
          x={padding - 5}
          y={padding + 5}
          fontSize="10"
          fill="#666"
          textAnchor="end"
        >
          {maxValue.toFixed(1)}
        </SvgText>
        <SvgText
          x={padding - 5}
          y={chartHeight - padding + 5}
          fontSize="10"
          fill="#666"
          textAnchor="end"
        >
          {minValue.toFixed(1)}
        </SvgText>
      </Svg>
    </View>
  )
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
  const [refreshing, setRefreshing] = useState(false)
  const navigation = useNavigation()

  useEffect(() => {
    fetchAllSensorData()
  }, [farmId])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchAllSensorData()
    setRefreshing(false)
  }

  const fetchAllSensorData = async () => {
    try {
      if (!refreshing) setLoading(true)
      console.log(`Fetching all sensor data for farm ${farmId}...`)

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
          const { data: sensors, error: sensorError } = await supabase
            .from('sensor')
            .select('sensor_id, sensor_name, sensor_type, units')
            .eq('sensor_type', dbType)
            .eq('farm_id', farmId)

          if (!sensorError && sensors && sensors.length > 0) {
            const sensorIds = sensors.map(s => s.sensor_id)

            const { data: readings, error: readingError } = await supabase
              .from('sensor_data')
              .select('id, value, created_at, sensor_id')
              .in('sensor_id', sensorIds)
              .order('created_at', { ascending: false })
              .limit(20)

            if (!readingError && readings && readings.length > 0) {
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
              allData[key] = transformedReadings.reverse()
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

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (diffHours < 1) {
      return diffMins <= 1 ? 'Just now' : `${diffMins}m ago`
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getSensorIcon = (type: string) => {
    switch (type) {
      case 'ec': return 'flash'
      case 'ph': return 'beaker'
      case 'soilMoisture': return 'water'
      case 'temperature': return 'thermometer'
      default: return 'analytics'
    }
  }

  // Navigation handler for sensor data
  const navigateToSensorDetail = async (sensorType: string) => {
    try {
      // Get the first sensor of this type for navigation
      const sensorTypeMap: { [key: string]: string } = {
        'ec': 'Electrical Conductivity',
        'ph': 'Analog pH Sensor',
        'soilMoisture': 'Capacitive Soil Moisture',
        'temperature': 'Digital Temperature'
      }

      const dbType = sensorTypeMap[sensorType]
      const { data: sensors, error } = await supabase
        .from('sensor')
        .select('sensor_id')
        .eq('sensor_type', dbType)
        .eq('farm_id', farmId)
        .limit(1)

      if (!error && sensors && sensors.length > 0) {
        const sensorId = sensors[0].sensor_id
        navigation.navigate('SensorDetail' as never, { sensorId } as never)
      } else {
        console.warn(`No sensor found for type: ${sensorType}`)
      }
    } catch (error) {
      console.error('Error navigating to sensor detail:', error)
    }
  }

  const renderSensorPanel = (data: SensorReading[], title: string, type: string) => {
    const latestReading = data.length > 0 ? data[data.length - 1] : null
    const statusColor = latestReading ? getStatusColor(latestReading.value, type) : '#666'
    const statusText = latestReading ? getStatusText(latestReading.value, type) : 'No Data'

    // Prepare chart data - last 10 readings
    const chartData = data.slice(-10).map(reading => reading.value)
    const chartTimestamps = data.slice(-10).map(reading => reading.timestamp)

    return (
      <TouchableOpacity
        style={[
          styles.sensorPanel,
          isSmallDevice && styles.sensorPanelSmall,
        ]}
        key={title}
        onPress={() => navigateToSensorDetail(type)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#ffffff', '#f8f9fa']}
          style={styles.panelGradient}
        >
          <View style={styles.panelHeader}>
            <View style={styles.headerLeft}>
              <Ionicons
                name={getSensorIcon(type) as any}
                size={isSmallDevice ? 20 : 24}
                color={statusColor}
              />
              <Text style={[styles.panelTitle, isSmallDevice && styles.panelTitleSmall]} numberOfLines={2}>
                {title}
              </Text>
            </View>
            <Ionicons
              name="arrow-forward"
              size={16}
              color="#666"
            />
          </View>

          {latestReading ? (
            <>
              {/* Main data display with modern card design */}
              <View style={styles.dataSection}>
                <View style={styles.modernDataContainer}>
                  {/* Current Value Card */}
                  <View style={styles.valueCard}>
                    <View style={styles.valueCardHeader}>
                      <Ionicons name="trending-up" size={16} color={statusColor} />
                      <Text style={styles.valueCardTitle}>Current Value</Text>
                    </View>
                    <View style={styles.valueContent}>
                      <Text style={[styles.primaryValue, { color: statusColor }]}>
                        {latestReading.value.toFixed(2)}
                      </Text>
                      <Text style={styles.unitText}>{latestReading.sensor.unit}</Text>
                    </View>
                  </View>

                  {/* Status Card */}
                  <View style={styles.statusCard}>
                    <View style={styles.statusCardHeader}>
                      <Ionicons name="checkmark-circle" size={16} color={statusColor} />
                      <Text style={styles.statusCardTitle}>Status</Text>
                    </View>
                    <View style={styles.statusContent}>
                      <View style={[styles.modernStatusBadge, { backgroundColor: statusColor }]}>
                        <Text style={styles.modernStatusText}>{statusText}</Text>
                      </View>
                      <Text style={styles.statusSubtext}>Level</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Simple Chart */}
              {data.length > 1 && (
                <View style={styles.chartSection}>
                  <Text style={styles.chartLabel}>📈 Recent Trend</Text>
                  <CustomLineChart
                    data={chartData}
                    timestamps={chartTimestamps}
                    color={statusColor}
                    unit={latestReading.sensor.unit}
                  />
                </View>
              )}

              {/* Last Update Info */}
              <View style={styles.metaSection}>
                <Text style={styles.metaLabel}>Last Update: {formatTimestamp(latestReading.timestamp)}</Text>
              </View>
            </>
          ) : (
            <View style={styles.noDataContainer}>
              <Ionicons name="alert-circle-outline" size={32} color="#ccc" />
              <Text style={styles.noDataText}>No sensor data available</Text>
              <Text style={styles.noDataSubtext}>Check sensor connection</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    )
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#4CAF50', '#45A049']}
          style={styles.loadingGradient}
        >
          <Ionicons name="analytics" size={40} color="#fff" />
          <Text style={styles.loadingText}>Loading sensor data...</Text>
        </LinearGradient>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#4CAF50"
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>📊 Sensor Data & Analytics</Text>
        <Text style={styles.sectionSubtitle}>Real-time monitoring and insights</Text>
      </View>

      {/* Always use single column (1x4) layout for better visibility */}
      <View style={styles.gridContainer}>
        <View style={styles.singleColumn}>
          {renderSensorPanel(sensorData.ec, 'Electrical Conductivity', 'ec')}
          {renderSensorPanel(sensorData.ph, 'pH Level', 'ph')}
          {renderSensorPanel(sensorData.soilMoisture, 'Soil Moisture', 'soilMoisture')}
          {renderSensorPanel(sensorData.temperature, 'Temperature', 'temperature')}
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    padding: responsivePadding,
    backgroundColor: '#ffffff',
    marginHorizontal: responsivePadding,
    marginTop: responsivePadding,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: isSmallDevice ? 18 : 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: responsiveFontSize,
    color: '#666',
  },
  loadingContainer: {
    padding: responsivePadding,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  loadingGradient: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  loadingText: {
    fontSize: responsiveFontSize,
    color: '#fff',
    fontWeight: '600',
    marginTop: 12,
  },
  gridContainer: {
    flex: 1,
    padding: responsivePadding,
  },
  singleColumn: {
    flexDirection: 'column',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sensorPanel: {
    width: '100%', // Full width for single column layout
    marginHorizontal: 0, // Remove horizontal margins
    marginBottom: 20, // Increased vertical spacing between panels
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    backgroundColor: '#ffffff',
    minHeight: 280, // Significantly increased minimum height
  },
  sensorPanelSmall: {
    marginHorizontal: 0,
    minHeight: 260, // Increased height for small devices too
  },
  panelGradient: {
    padding: 24, // Increased padding for more breathing room
    minHeight: 260, // Larger minimum height
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16, // Increased margin
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  panelTitle: {
    fontSize: isSmallDevice ? 16 : 20, // Increased font size
    fontWeight: '700',
    color: '#333',
    marginLeft: 12,
    flex: 1,
    flexWrap: 'wrap',
    lineHeight: isSmallDevice ? 20 : 24, // Better line height
  },
  panelTitleSmall: {
    fontSize: 15, // Larger even for small devices
  },
  currentValue: {
    flexDirection: 'column', // Always stack vertically for better space utilization
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  valueText: {
    fontSize: isSmallDevice ? 24 : 28, // Significantly larger font
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    flexWrap: 'wrap',
    textAlign: 'left',
  },
  valueTextSmall: {
    fontSize: 22, // Larger even for small devices
  },
  statusBadge: {
    paddingVertical: 6, // Increased padding
    paddingHorizontal: 12, // Increased padding
    borderRadius: 12,
    alignItems: 'center',
    alignSelf: 'flex-start',
    minHeight: 32, // Ensure minimum height for touch target
  },
  statusBadgeText: {
    color: 'white',
    fontSize: isSmallDevice ? 12 : 14, // Increased font size
    fontWeight: 'bold',
  },
  metaInfo: {
    flexDirection: 'column', // Stack vertically for better readability
    marginBottom: 8,
  },
  lastUpdate: {
    fontSize: isSmallDevice ? 11 : 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  sensorName: {
    fontSize: isSmallDevice ? 12 : 13,
    color: '#333',
    fontWeight: '600',
    flexWrap: 'wrap', // Allow text wrapping
  },
  trendContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
    marginTop: 8,
    flex: 1, // Allow container to grow
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  trendTitle: {
    fontSize: isSmallDevice ? 12 : 13,
    fontWeight: 'bold',
    color: '#333',
  },
  trendCount: {
    fontSize: isSmallDevice ? 10 : 11,
    color: '#666',
    fontStyle: 'italic',
  },
  trendScrollView: {
    maxHeight: isSmallDevice ? 200 : 250, // Increased scroll area
    flex: 1,
  },
  trendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10, // Increased padding for better touch targets
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: 'rgba(248, 249, 250, 0.8)',
    minHeight: 50, // Minimum height to prevent cramping
  },
  latestTrendItem: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  trendLeft: {
    flexDirection: 'column', // Stack time and badge vertically
    alignItems: 'flex-start',
    flex: 2,
  },
  trendTime: {
    fontSize: isSmallDevice ? 11 : 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  latestBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  latestBadgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
  },
  trendRight: {
    alignItems: 'flex-end',
    flex: 2,
  },
  trendValue: {
    fontSize: isSmallDevice ? 12 : 13,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'right',
  },
  miniStatusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  miniStatusText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
  noDataContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(248, 249, 250, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    minHeight: 120, // Minimum height for no-data state
  },
  noDataText: {
    fontSize: isSmallDevice ? 13 : 14,
    color: '#666',
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  noDataSubtext: {
    fontSize: isSmallDevice ? 11 : 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  chartContainer: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 8,
    marginTop: 8,
  },
  chartBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartBar: {
    position: 'absolute',
    bottom: 0,
    borderRadius: 4,
  },
  chartLabels: {
    position: 'absolute',
    top: 4,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  chartLabelText: {
    fontSize: 10,
    color: '#666',
  },
  dataSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16, // Increased margin
    paddingHorizontal: 4, // Add horizontal padding
  },
  modernDataContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  valueCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 100, // Ensure consistent height
    justifyContent: 'space-between', // Distribute content evenly
  },
  valueCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12, // Increased for better spacing
  },
  valueCardTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginLeft: 8,
  },
  valueContent: {
    alignItems: 'center', // Center align the value and unit
    justifyContent: 'center',
    flex: 1, // Take remaining space
  },
  primaryValue: {
    fontSize: isSmallDevice ? 20 : 24, // Responsive font size
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  unitText: {
    fontSize: isSmallDevice ? 12 : 14, // Responsive font size
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  statusCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 100, // Same height as valueCard
    justifyContent: 'space-between', // Distribute content evenly
  },
  statusCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12, // Increased for better spacing, same as valueCardHeader
  },
  statusCardTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginLeft: 8,
  },
  statusContent: {
    alignItems: 'center', // Center align the status content
    justifyContent: 'center',
    flex: 1, // Take remaining space
  },
  modernStatusBadge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32, // Ensure minimum touch target
    marginBottom: 4, // Add spacing before subtext
  },
  modernStatusText: {
    color: 'white',
    fontSize: isSmallDevice ? 11 : 12, // Responsive font size
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statusSubtext: {
    fontSize: isSmallDevice ? 12 : 14, // Responsive font size
    color: '#666',
    fontWeight: '500',
    textAlign: 'center', // Center align the subtext
  },
  metaSection: {
    marginTop: 8,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metaLabel: {
    fontSize: 12,
    color: '#666',
  },
  metaValue: {
    fontSize: 12,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  detailsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    padding: 4,
  },
  dataTable: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f1f1',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  timeColumn: {
    flex: 2,
  },
  valueColumn: {
    flex: 2,
    alignItems: 'flex-end',
  },
  statusColumn: {
    flex: 1,
    alignItems: 'flex-end',
  },
  tableScrollView: {
    maxHeight: 200,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  latestTableRow: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  tableTimeText: {
    fontSize: 12,
    color: '#333',
  },
  latestIndicator: {
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginTop: 4,
  },
  latestText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tableValueText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tableStatusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  tableStatusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeRangeText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  dataPointsText: {
    fontSize: 12,
    color: '#666',
  },
  horizontalValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  horizontalStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  gridContainer2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  gridItem: {
    width: '48%', // Approximately half width for 2x2 grid
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 60,
    justifyContent: 'center',
  },
  gridLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    flex: 1,
    textAlignVertical: 'center',
  },
  gridValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
    textAlignVertical: 'center',
    flexShrink: 0,
  },
  gridValueSmall: {
    fontSize: 13,
  },
  gridContainerVertical: {
    flexDirection: 'column',
    width: '100%',
  },
  gridItemHorizontal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 52,
  },
  chartSection: {
    marginTop: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusSubtext: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginTop: 4,
  },
})
export default SensorDataTable
