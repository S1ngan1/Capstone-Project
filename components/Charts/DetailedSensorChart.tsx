import React, { useState } from 'react'
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native'
import Svg, { Polyline, Circle, Line, Text as SvgText, G, Rect, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

const { width, height } = Dimensions.get('window')
const isSmallDevice = width < 350

interface SensorReading {
  id: string
  value: number
  timestamp: string
}

interface DetailedSensorChartProps {
  data: SensorReading[]
  color: string
  unit: string
  sensorType: string
  sensorName: string
}

const DetailedSensorChart: React.FC<DetailedSensorChartProps> = ({
  data,
  color,
  unit,
  sensorType,
  sensorName
}) => {
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null)

  if (data.length < 2) {
    return (
      <View style={styles.noDataContainer}>
        <LinearGradient
          colors={['#f8f9fa', '#e9ecef']}
          style={styles.noDataGradient}
        >
          <Ionicons name="analytics-outline" size={64} color="#6c757d" />
          <Text style={styles.noDataText}>Insufficient Data</Text>
          <Text style={styles.noDataSubtext}>Need at least 2 readings to display chart</Text>
        </LinearGradient>
      </View>
    )
  }

  // Clean chart dimensions - wider and taller
  const chartWidth = width - 60
  const chartHeight = 280
  const padding = 50
  const bottomPadding = 60

  // Smart scaling with better range calculation
  const values = data.map(d => d.value).reverse() // Reverse for chronological order
  const timestamps = data.map(d => d.timestamp).reverse()

  const dataMin = Math.min(...values)
  const dataMax = Math.max(...values)
  const dataRange = dataMax - dataMin
  const avgValue = (dataMin + dataMax) / 2

  let minValue: number
  let maxValue: number

  // Enhanced smart scaling
  if (dataRange < 0.5) {
    const center = avgValue
    const expandedRange = Math.max(5, center * 0.6)
    minValue = Math.max(0, center - expandedRange / 2)
    maxValue = center + expandedRange / 2
  } else if (avgValue >= 4 && avgValue <= 8 && dataMax < 12) {
    minValue = 0
    maxValue = dataMax < 8 ? 10 : 15
  } else {
    minValue = Math.max(0, dataMin - dataRange * 0.2)
    maxValue = dataMax + dataRange * 0.2

    if (maxValue < 20) {
      maxValue = Math.ceil(maxValue / 2) * 2
    } else if (maxValue < 100) {
      maxValue = Math.ceil(maxValue / 5) * 5
    }
  }

  const valueRange = maxValue - minValue || 1

  // Create clean points without overlap
  const points = values.map((value, index) => {
    const x = padding + (index / (values.length - 1)) * (chartWidth - 2 * padding)
    const y = chartHeight - bottomPadding - ((value - minValue) / valueRange) * (chartHeight - padding - bottomPadding)
    return { x, y, value, timestamp: timestamps[index], index }
  })

  const pathPoints = points.map(p => `${p.x},${p.y}`).join(' ')

  const getStatusColor = (value: number): string => {
    switch (sensorType.toLowerCase()) {
      case 'electrical conductivity':
      case 'ec':
        if (value < 1.0) return '#2196F3'
        if (value > 1.8) return '#FF9800'
        return '#4CAF50'
      case 'analog ph sensor':
      case 'ph':
        if (value < 6.5) return '#2196F3'
        if (value > 7.5) return '#FF9800'
        return '#4CAF50'
      case 'capacitive soil moisture':
      case 'soil moisture':
        if (value < 40) return '#2196F3'
        if (value > 70) return '#FF9800'
        return '#4CAF50'
      case 'digital temperature':
      case 'temperature':
        if (value < 20) return '#2196F3'
        if (value > 28) return '#FF9800'
        return '#4CAF50'
      default:
        return color
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const latest = values[values.length - 1]
  const previous = values[0]
  const trend = latest - previous
  const trendPercent = previous !== 0 ? ((trend / previous) * 100) : 0

  return (
    <View style={styles.container}>
      {/* Beautiful Header */}
      <LinearGradient
        colors={['#ffffff', '#f8f9fa']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <Text style={styles.chartTitle}>📊 Data Analytics</Text>
            <Text style={styles.chartSubtitle}>{sensorName}</Text>
          </View>
          <View style={styles.trendBadge}>
            <Ionicons
              name={trend >= 0 ? "trending-up" : "trending-down"}
              size={16}
              color={trend >= 0 ? "#4CAF50" : "#FF5722"}
            />
            <Text style={[styles.trendText, { color: trend >= 0 ? "#4CAF50" : "#FF5722" }]}>
              {trend >= 0 ? '+' : ''}{trendPercent.toFixed(1)}%
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Clean Chart Area */}
      <View style={styles.chartWrapper}>
        <Svg height={chartHeight} width={chartWidth}>
          {/* Gradient definitions */}
          <Defs>
            <SvgLinearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <Stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </SvgLinearGradient>
          </Defs>

          {/* Clean horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = chartHeight - bottomPadding - ratio * (chartHeight - padding - bottomPadding)
            const gridValue = minValue + ratio * valueRange
            return (
              <G key={i}>
                <Line
                  x1={padding}
                  y1={y}
                  x2={chartWidth - padding}
                  y2={y}
                  stroke={i === 2 ? "#e0e0e0" : "#f5f5f5"}
                  strokeWidth={i === 2 ? "1.5" : "1"}
                />
                <SvgText
                  x={padding - 8}
                  y={y + 4}
                  fontSize="10"
                  fill="#888"
                  textAnchor="end"
                  fontWeight="500"
                >
                  {gridValue.toFixed(1)}
                </SvgText>
              </G>
            )
          })}

          {/* Area fill under the line */}
          <Polyline
            points={`${padding},${chartHeight - bottomPadding} ${pathPoints} ${chartWidth - padding},${chartHeight - bottomPadding}`}
            fill="url(#areaGradient)"
            stroke="none"
          />

          {/* Main smooth line */}
          <Polyline
            points={pathPoints}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Clean data points */}
          {points.map((point, index) => {
            const pointColor = getStatusColor(point.value)
            const isFirst = index === 0
            const isLast = index === points.length - 1
            const isSelected = selectedPoint === index

            return (
              <G key={`point-${index}`}>
                {/* Outer circle for emphasis */}
                <Circle
                  cx={point.x}
                  cy={point.y}
                  r="8"
                  fill="white"
                  stroke={pointColor}
                  strokeWidth="2"
                  opacity={isSelected ? 1 : 0.3}
                />
                {/* Main point */}
                <Circle
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill={pointColor}
                />

                {/* Show values only on first and last points to avoid overlap */}
                {(isFirst || isLast || isSelected) && (
                  <G>
                    <Rect
                      x={point.x - 20}
                      y={point.y - 30}
                      width={40}
                      height={16}
                      rx={8}
                      fill={pointColor}
                      fillOpacity="0.95"
                    />
                    <SvgText
                      x={point.x}
                      y={point.y - 20}
                      fontSize="10"
                      fill="white"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      {point.value.toFixed(1)}
                    </SvgText>
                  </G>
                )}
              </G>
            )
          })}

          {/* Clean time labels - only first, middle, and last */}
          {points.map((point, index) => {
            const showLabel = index === 0 || index === Math.floor(points.length / 2) || index === points.length - 1
            if (!showLabel) return null

            return (
              <G key={`time-${index}`}>
                <SvgText
                  x={point.x}
                  y={chartHeight - bottomPadding + 20}
                  fontSize="10"
                  fill="#666"
                  textAnchor="middle"
                  fontWeight="500"
                >
                  {formatTime(point.timestamp)}
                </SvgText>
                <SvgText
                  x={point.x}
                  y={chartHeight - bottomPadding + 35}
                  fontSize="8"
                  fill="#999"
                  textAnchor="middle"
                >
                  {formatDate(point.timestamp)}
                </SvgText>
              </G>
            )
          })}

          {/* Clean axes */}
          <Line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={chartHeight - bottomPadding}
            stroke="#ddd"
            strokeWidth="2"
          />
          <Line
            x1={padding}
            y1={chartHeight - bottomPadding}
            x2={chartWidth - padding}
            y2={chartHeight - bottomPadding}
            stroke="#ddd"
            strokeWidth="2"
          />

          {/* Unit label - positioned much further left, away from value numbers */}
          <SvgText
            x={8}
            y={(chartHeight - bottomPadding + padding) / 2}
            fontSize="10"
            fill="#666"
            textAnchor="middle"
            transform={`rotate(-90, 8, ${(chartHeight - bottomPadding + padding) / 2})`}
            fontWeight="600"
          >
            {unit}
          </SvgText>
        </Svg>
      </View>

      {/* Beautiful Statistics Cards */}
      <View style={styles.statsWrapper}>
        <LinearGradient
          colors={['#f8f9fa', '#ffffff']}
          style={styles.statsContainer}
        >
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: getStatusColor(latest) + '20' }]}>
              <Ionicons name="pulse" size={20} color={getStatusColor(latest)} />
            </View>
            <Text style={styles.statLabel}>Current</Text>
            <Text style={[styles.statValue, { color: getStatusColor(latest) }]}>
              {latest.toFixed(1)}
            </Text>
            <Text style={styles.statUnit}>{unit}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
              <Ionicons name="stats-chart" size={20} color={color} />
            </View>
            <Text style={styles.statLabel}>Average</Text>
            <Text style={styles.statValue}>
              {(values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)}
            </Text>
            <Text style={styles.statUnit}>{unit}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#6c757d20' }]}>
              <Ionicons name="swap-vertical" size={20} color="#6c757d" />
            </View>
            <Text style={styles.statLabel}>Range</Text>
            <Text style={styles.statValue}>
              {dataRange.toFixed(1)}
            </Text>
            <Text style={styles.statUnit}>{unit}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#17a2b820' }]}>
              <Ionicons name="time" size={20} color="#17a2b8" />
            </View>
            <Text style={styles.statLabel}>Readings</Text>
            <Text style={styles.statValue}>
              {values.length}
            </Text>
            <Text style={styles.statUnit}>points</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Data Points List */}
      <View style={styles.dataListWrapper}>
        <Text style={styles.dataListTitle}>📋 Recent Readings</Text>
        <ScrollView style={styles.dataList} showsVerticalScrollIndicator={false}>
          {values.slice().reverse().map((value, index) => {
            const originalIndex = values.length - 1 - index
            const timestamp = timestamps[originalIndex]
            const isLatest = index === 0

            return (
              <TouchableOpacity
                key={`data-${originalIndex}`}
                style={[styles.dataItem, isLatest && styles.latestDataItem]}
                onPress={() => setSelectedPoint(originalIndex)}
              >
                <View style={styles.dataLeft}>
                  <View style={[styles.dataIndicator, { backgroundColor: getStatusColor(value) }]}>
                    {isLatest && <Ionicons name="pulse" size={12} color="white" />}
                  </View>
                  <View>
                    <Text style={[styles.dataValue, isLatest && styles.latestDataValue]}>
                      {value.toFixed(2)} {unit}
                    </Text>
                    <Text style={styles.dataTime}>
                      {new Date(timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                </View>
                {isLatest && (
                  <View style={styles.latestBadge}>
                    <Text style={styles.latestBadgeText}>LATEST</Text>
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  header: {
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  titleSection: {
    flex: 1,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  trendText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  chartWrapper: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statsWrapper: {
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statUnit: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  dataListWrapper: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dataListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  dataList: {
    maxHeight: 200,
  },
  dataItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  latestDataItem: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  dataLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dataIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dataValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  latestDataValue: {
    color: '#16a34a',
    fontWeight: 'bold',
  },
  dataTime: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  latestBadge: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  latestBadgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
  },
  noDataContainer: {
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  noDataGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noDataText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6c757d',
    marginTop: 16,
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#adb5bd',
    textAlign: 'center',
    lineHeight: 20,
  },
})

export default DetailedSensorChart
