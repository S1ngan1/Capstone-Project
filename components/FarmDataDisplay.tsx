import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

interface FarmDataDisplayProps {
  farmData: any
  visible: boolean
  onClose: () => void
}

export const FarmDataDisplay: React.FC<FarmDataDisplayProps> = ({
  farmData,
  visible,
  onClose
}) => {
  const [selectedFarmIndex, setSelectedFarmIndex] = useState(0)

  if (!farmData || !farmData.farms) {
    return null
  }

  const farms = farmData.farms
  const selectedFarm = farms[selectedFarmIndex]

  const getSensorStatusColor = (sensor: any) => {
    if (!sensor.latestReading) return '#999'

    const now = new Date()
    const readingTime = new Date(sensor.latestReading.timestamp)
    const hoursDiff = (now.getTime() - readingTime.getTime()) / (1000 * 60 * 60)

    if (hoursDiff < 24) return '#4CAF50' // Green - Recent
    if (hoursDiff < 72) return '#FF9800' // Orange - Somewhat old
    return '#F44336' // Red - Very old
  }

  const getSensorIcon = (sensorType: string) => {
    const type = sensorType.toLowerCase()
    if (type.includes('ph')) return 'beaker'
    if (type.includes('moisture')) return 'water'
    if (type.includes('temperature')) return 'thermometer'
    if (type.includes('conductivity') || type.includes('ec')) return 'flash'
    if (type.includes('light')) return 'sunny'
    return 'hardware-chip'
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={['#4A90E2', '#357ABD']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Farm Data Overview</Text>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>

        <ScrollView style={styles.content}>
          {/* Farm Selector */}
          {farms.length > 1 && (
            <View style={styles.farmSelector}>
              <Text style={styles.sectionTitle}>Select Farm:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {farms.map((farm: any, index: number) => (
                  <TouchableOpacity
                    key={farm.id}
                    style={[
                      styles.farmTab,
                      selectedFarmIndex === index && styles.farmTabSelected
                    ]}
                    onPress={() => setSelectedFarmIndex(index)}
                  >
                    <Text style={[
                      styles.farmTabText,
                      selectedFarmIndex === index && styles.farmTabTextSelected
                    ]}>
                      {farm.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Selected Farm Details */}
          {selectedFarm && (
            <>
              <View style={styles.farmCard}>
                <View style={styles.farmHeader}>
                  <Ionicons name="business" size={24} color="#4A90E2" />
                  <Text style={styles.farmName}>{selectedFarm.name}</Text>
                </View>
                <View style={styles.farmDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="location" size={16} color="#666" />
                    <Text style={styles.detailText}>{selectedFarm.location}</Text>
                  </View>
                  {selectedFarm.notes && (
                    <View style={styles.detailRow}>
                      <Ionicons name="document-text" size={16} color="#666" />
                      <Text style={styles.detailText}>{selectedFarm.notes}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Sensors */}
              <View style={styles.sensorsSection}>
                <Text style={styles.sectionTitle}>
                  Sensors ({selectedFarm.sensors.length})
                </Text>

                {selectedFarm.sensors.length === 0 ? (
                  <View style={styles.noSensorsCard}>
                    <Ionicons name="hardware-chip-outline" size={48} color="#999" />
                    <Text style={styles.noSensorsText}>No sensors installed</Text>
                    <Text style={styles.noSensorsSubtext}>
                      Add sensors to get AI-powered recommendations
                    </Text>
                  </View>
                ) : (
                  <View style={styles.sensorsList}>
                    {selectedFarm.sensors.map((sensor: any) => (
                      <View key={sensor.id} style={styles.sensorCard}>
                        <View style={styles.sensorHeader}>
                          <View style={styles.sensorIcon}>
                            <Ionicons
                              name={getSensorIcon(sensor.type) as any}
                              size={20}
                              color="#4A90E2"
                            />
                          </View>
                          <View style={styles.sensorInfo}>
                            <Text style={styles.sensorName}>{sensor.name}</Text>
                            <Text style={styles.sensorType}>{sensor.type}</Text>
                          </View>
                          <View
                            style={[
                              styles.statusDot,
                              { backgroundColor: getSensorStatusColor(sensor) }
                            ]}
                          />
                        </View>

                        {sensor.latestReading ? (
                          <View style={styles.readingContainer}>
                            <Text style={styles.readingValue}>
                              {sensor.latestReading.value.toFixed(2)}{sensor.latestReading.unit}
                            </Text>
                            <Text style={styles.readingTime}>
                              {new Date(sensor.latestReading.timestamp).toLocaleString()}
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.noReadingContainer}>
                            <Text style={styles.noReadingText}>No recent data</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  farmSelector: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  farmTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  farmTabSelected: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  farmTabText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '500',
  },
  farmTabTextSelected: {
    color: 'white',
  },
  farmCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  farmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  farmName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
  farmDetails: {
    paddingLeft: 36,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  sensorsSection: {
    marginBottom: 16,
  },
  noSensorsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    elevation: 2,
  },
  noSensorsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#999',
    marginTop: 12,
  },
  noSensorsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
  sensorsList: {
    gap: 12,
  },
  sensorCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sensorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sensorIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sensorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  sensorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sensorType: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  readingContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  readingValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  readingTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  noReadingContainer: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 12,
  },
  noReadingText: {
    fontSize: 14,
    color: '#F57C00',
    fontStyle: 'italic',
  },
})
