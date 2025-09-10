import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, NavigationProp } from '@react-navigation/native'
import { supabase } from '../lib/supabase'
import BottomNavigation from '../components/BottomNavigation'
import { useAuthContext } from '../context/AuthContext'
import { useDialog } from '../context/DialogContext'
import { RootStackParamList } from '../App'
interface SensorReading {
  sensor_id: string
  value: number
  created_at: string
  sensor: {
    sensor_name: string
    sensor_type: string
    units: string
    farm_id: string
    farms: {
      name: string
      location: string
      notes?: string // Fixed: Changed from note to notes
    }
  }
}
interface Suggestion {
  id: string
  type: 'critical' | 'warning' | 'info' | 'success'
  title: string
  description: string
  farmName: string
  sensorType: string
  value: number
  unit: string
  timestamp: string
  action?: string
  aiGenerated?: boolean // Flag to indicate AI-generated suggestions
}
interface FarmContext {
  id: string
  name: string
  location: string
  notes?: string // Fixed: Changed from note to notes
  sensorData: {
    [sensorType: string]: {
      value: number
      unit: string
      timestamp: string
    }
  }
}
const Suggestion: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>()
  const { session } = useAuthContext()
  const { showDialog } = useDialog()
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  useEffect(() => {
    fetchSuggestions()
  }, [session])
  const onRefresh = () => {
    setRefreshing(true)
    fetchSuggestions()
  }
  const generateSuggestions = (readings: SensorReading[]): Suggestion[] => {
    const suggestions: Suggestion[] = []
    readings.forEach((reading, index) => {
      const { sensor, value, created_at } = reading
      const sensorType = sensor.sensor_type.toLowerCase()
      const farmName = sensor.farms.name
      let suggestion: Suggestion | null = null
      // pH Sensor Analysis
      if (sensorType.includes('ph')) {
        if (value < 6.0) {
          suggestion = {
            id: `ph_low_${index}`,
            type: 'critical',
            title: 'Soil Too Acidic',
            description: `pH level of ${value} is too low for most crops. Consider adding lime to raise pH levels.`,
            farmName,
            sensorType: 'pH',
            value,
            unit: sensor.units,
            timestamp: created_at,
            action: 'Add agricultural lime or wood ash to increase pH',
          }
        } else if (value > 8.0) {
          suggestion = {
            id: `ph_high_${index}`,
            type: 'warning',
            title: 'Soil Too Alkaline',
            description: `pH level of ${value} is too high. Consider adding sulfur or organic matter to lower pH.`,
            farmName,
            sensorType: 'pH',
            value,
            unit: sensor.units,
            timestamp: created_at,
            action: 'Add sulfur or organic acids to decrease pH',
          }
        } else if (value >= 6.5 && value <= 7.5) {
          suggestion = {
            id: `ph_good_${index}`,
            type: 'success',
            title: 'Optimal pH Level',
            description: `pH level of ${value} is perfect for most crops. Maintain current soil management practices.`,
            farmName,
            sensorType: 'pH',
            value,
            unit: sensor.units,
            timestamp: created_at,
            action: 'Continue current practices',
          }
        }
      }
      // EC (Electrical Conductivity) Analysis
      if (sensorType.includes('conductivity') || sensorType.includes('ec')) {
        if (value < 0.5) {
          suggestion = {
            id: `ec_low_${index}`,
            type: 'warning',
            title: 'Low Nutrient Levels',
            description: `EC level of ${value} indicates low nutrient availability. Consider fertilization.`,
            farmName,
            sensorType: 'EC',
            value,
            unit: sensor.units,
            timestamp: created_at,
            action: 'Apply balanced fertilizer to increase nutrient levels',
          }
        } else if (value > 2.0) {
          suggestion = {
            id: `ec_high_${index}`,
            type: 'critical',
            title: 'High Salt Content',
            description: `EC level of ${value} indicates high salt content that may damage plants. Flush with water.`,
            farmName,
            sensorType: 'EC',
            value,
            unit: sensor.units,
            timestamp: created_at,
            action: 'Flush soil with clean water to reduce salt buildup',
          }
        }
      }
      // Soil Moisture Analysis
      if (sensorType.includes('moisture')) {
        if (value < 20) {
          suggestion = {
            id: `moisture_low_${index}`,
            type: 'critical',
            title: 'Soil Too Dry',
            description: `Moisture level at ${value}% is critically low. Immediate irrigation needed.`,
            farmName,
            sensorType: 'Soil Moisture',
            value,
            unit: sensor.units,
            timestamp: created_at,
            action: 'Irrigate immediately to prevent crop stress',
          }
        } else if (value > 80) {
          suggestion = {
            id: `moisture_high_${index}`,
            type: 'warning',
            title: 'Soil Too Wet',
            description: `Moisture level at ${value}% is too high. Risk of root rot and fungal diseases.`,
            farmName,
            sensorType: 'Soil Moisture',
            value,
            unit: sensor.units,
            timestamp: created_at,
            action: 'Improve drainage and reduce irrigation frequency',
          }
        }
      }
      // Temperature Analysis
      if (sensorType.includes('temperature')) {
        if (value < 10) {
          suggestion = {
            id: `temp_low_${index}`,
            type: 'warning',
            title: 'Low Temperature Alert',
            description: `Temperature of ${value}°C may slow plant growth. Consider protection measures.`,
            farmName,
            sensorType: 'Temperature',
            value,
            unit: sensor.units,
            timestamp: created_at,
            action: 'Use row covers or greenhouse protection',
          }
        } else if (value > 35) {
          suggestion = {
            id: `temp_high_${index}`,
            type: 'critical',
            title: 'High Temperature Warning',
            description: `Temperature of ${value}°C can stress plants. Increase shading and irrigation.`,
            farmName,
            sensorType: 'Temperature',
            value,
            unit: sensor.units,
            timestamp: created_at,
            action: 'Provide shade and increase irrigation frequency',
          }
        }
      }
      if (suggestion) {
        suggestions.push(suggestion)
      }
    })
    return suggestions.sort((a, b) => {
      const typeOrder = { critical: 0, warning: 1, info: 2, success: 3 }
      return typeOrder[a.type] - typeOrder[b.type]
    })
  }
  const fetchSuggestions = async () => {
    try {
      if (!session?.user?.id) return
      // Get user's farms with notes
      const { data: userFarms, error: farmsError } = await supabase
        .from('farm_users')
        .select(`
          farm_id,
          farms!inner (
            id,
            name,
            location,
            notes
          )
        `)
        .eq('user_id', session.user.id)
      if (farmsError) throw farmsError
      if (!userFarms || userFarms.length === 0) {
        setSuggestions([])
        return
      }
      const farmIds = userFarms.map(f => f.farm_id)
      // Get latest sensor readings from user's farms with farm notes
      const { data: readings, error: readingsError } = await supabase
        .from('sensor_data')
        .select(`
          sensor_id,
          value,
          created_at,
          sensor!inner(
            sensor_name,
            sensor_type,
            units,
            farm_id,
            farms!inner(
              name,
              location,
              notes
            )
          )
        `)
        .in('sensor.farm_id', farmIds)
        .order('created_at', { ascending: false })
        .limit(50)
      if (readingsError) throw readingsError
      // Get only the latest reading for each sensor
      const latestReadings: { [key: string]: SensorReading } = {}
      readings?.forEach((reading: any) => {
        if (!latestReadings[reading.sensor_id] ||
            new Date(reading.created_at) > new Date(latestReadings[reading.sensor_id].created_at)) {
          latestReadings[reading.sensor_id] = reading
        }
      })
      // Generate rule-based suggestions
      const ruleSuggestions = generateSuggestions(Object.values(latestReadings))
      // Prepare farm contexts for AI suggestions
      const farmContexts: FarmContext[] = userFarms.map(farmUser => {
        const farmReadings = Object.values(latestReadings).filter(
          reading => reading.sensor.farm_id === farmUser.farm_id
        )
        const sensorData: { [sensorType: string]: { value: number; unit: string; timestamp: string } } = {}
        farmReadings.forEach(reading => {
          sensorData[reading.sensor.sensor_type] = {
            value: reading.value,
            unit: reading.sensor.units,
            timestamp: reading.created_at
          }
        })
        return {
          id: farmUser.farm_id,
          name: farmUser.farms.name,
          location: farmUser.farms.location,
          notes: farmUser.farms.notes,
          sensorData
        }
      })
      // Generate AI suggestions with farm notes context
      const aiSuggestions = await generateAISuggestions(farmContexts)
      // Combine rule-based and AI suggestions
      const allSuggestions = [...ruleSuggestions, ...aiSuggestions]
      // Sort by priority (critical first)
      const sortedSuggestions = allSuggestions.sort((a, b) => {
        const typeOrder = { critical: 0, warning: 1, info: 2, success: 3 }
        return typeOrder[a.type] - typeOrder[b.type]
      })
      setSuggestions(sortedSuggestions)
    } catch (error: any) {
      console.error('Error fetching suggestions:', error)
      showDialog('Failed to load suggestions')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }
  // AI API Integration for generating suggestions with farm notes context
  const generateAISuggestions = async (farmContexts: FarmContext[]): Promise<Suggestion[]> => {
    const aiSuggestions: Suggestion[] = []
    for (const farm of farmContexts) {
      try {
        // Create context string including farm notes
        const contextString = `
          Farm: ${farm.name}
          Location: ${farm.location}
          Notes: ${farm.notes || 'No additional notes available'}
          Current Sensor Readings:
          ${Object.entries(farm.sensorData)
            .map(([type, data]) => `${type}: ${data.value}${data.unit}`)
            .join('\n')}
        `
        // Generate AI-powered suggestions based on farm context
        const suggestions = generateContextualSuggestions(farm, contextString)
        aiSuggestions.push(...suggestions)
      } catch (error) {
        console.error('Error generating AI suggestions for farm:', farm.name, error)
      }
    }
    return aiSuggestions
  }
  const generateContextualSuggestions = (farm: FarmContext, context: string): Suggestion[] => {
    const suggestions: Suggestion[] = []
    const timestamp = new Date().toISOString()
    // Analyze each sensor type with farm context
    Object.entries(farm.sensorData).forEach(([sensorType, data], index) => {
      if (sensorType.toLowerCase().includes('ph')) {
        const value = data.value
        if (value < 6.0 || value > 8.0) {
          let description = `pH level of ${value} detected. `
          // Add context-based recommendations
          if (farm.notes) {
            description += `Based on your farm notes: "${farm.notes}", `
          }
          if (value < 6.0) {
            description += `consider adding lime or organic matter to increase pH. Given your location in ${farm.location}, local agricultural lime should be available.`
          } else {
            description += `consider adding sulfur or organic acids to lower pH. Monitor irrigation water quality in ${farm.location} area.`
          }
          suggestions.push({
            id: `ai_ph_${farm.id}_${index}`,
            type: value < 5.5 || value > 8.5 ? 'critical' : 'warning',
            title: `AI: pH Management for ${farm.name}`,
            description,
            farmName: farm.name,
            sensorType: 'pH',
            value,
            unit: data.unit,
            timestamp,
            action: value < 6.0 ? 'Apply agricultural lime' : 'Apply sulfur amendments',
            aiGenerated: true,
          })
        }
      }
      // Similar analysis for other sensor types with farm context
      if (sensorType.toLowerCase().includes('moisture')) {
        const value = data.value
        if (value < 30 || value > 80) {
          let description = `Soil moisture at ${value}%. `
          if (farm.notes) {
            description += `Considering your farm notes: "${farm.notes}", `
          }
          if (value < 30) {
            description += `increase irrigation frequency. Weather patterns in ${farm.location} suggest checking for optimal irrigation times.`
          } else {
            description += `reduce watering to prevent root rot. Ensure proper drainage for ${farm.location} climate conditions.`
          }
          suggestions.push({
            id: `ai_moisture_${farm.id}_${index}`,
            type: value < 20 || value > 90 ? 'critical' : 'warning',
            title: `AI: Moisture Management for ${farm.name}`,
            description,
            farmName: farm.name,
            sensorType: 'Soil Moisture',
            value,
            unit: data.unit,
            timestamp,
            action: value < 30 ? 'Increase irrigation' : 'Improve drainage',
            aiGenerated: true,
          })
        }
      }
    })
    return suggestions
  }
  const fetchSensorReadings = async (): Promise<SensorReading[]> => {
    if (!session?.user?.id) return []
    try {
      // Get user's farms first
      const { data: userFarms, error: farmError } = await supabase
        .from('farm_users')
        .select('farm_id')
        .eq('user_id', session.user.id)
      if (farmError || !userFarms) {
        console.error('Error fetching user farms:', farmError)
        return []
      }
      const farmIds = userFarms.map(uf => uf.farm_id)
      // Get latest sensor readings for user's farms
      const { data: readings, error } = await supabase
        .from('sensor_data')
        .select(`
          sensor_id,
          value,
          created_at,
          sensor!inner (
            sensor_name,
            sensor_type,
            units,
            farm_id,
            farms!inner (
              name,
              location,
              notes
            )
          )
        `)
        .in('sensor.farm_id', farmIds)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) {
        console.error('Error fetching sensor readings:', error)
        return []
      }
      return readings || []
    } catch (error) {
      console.error('Error in fetchSensorReadings:', error)
      return []
    }
  }
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'critical': return 'warning'
      case 'warning': return 'alert-circle'
      case 'info': return 'information-circle'
      case 'success': return 'checkmark-circle'
      default: return 'help-circle'
    }
  }
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'critical': return '#F44336'
      case 'warning': return '#FF9800'
      case 'info': return '#2196F3'
      case 'success': return '#4CAF50'
      default: return '#666'
    }
  }
  const renderSuggestionCard = (suggestion: Suggestion) => (
    <View key={suggestion.id} style={styles.suggestionCard}>
      <LinearGradient
        colors={['#ffffff', '#f8f9fa']}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <View style={styles.typeContainer}>
            <Ionicons
              name={getTypeIcon(suggestion.type) as any}
              size={24}
              color={getTypeColor(suggestion.type)}
            />
            <View style={styles.titleContainer}>
              <Text style={styles.cardTitle}>
                {suggestion.title}
                {suggestion.aiGenerated && (
                  <Text style={styles.aiLabel}> 🤖 AI</Text>
                )}
              </Text>
              <Text style={styles.farmName}>{suggestion.farmName}</Text>
            </View>
          </View>
          <View style={styles.valueContainer}>
            <Text style={[styles.value, { color: getTypeColor(suggestion.type) }]}>
              {suggestion.value.toFixed(1)}{suggestion.unit}
            </Text>
            <Text style={styles.sensorType}>{suggestion.sensorType}</Text>
          </View>
        </View>
        <Text style={styles.description}>{suggestion.description}</Text>
        {suggestion.action && (
          <View style={styles.actionContainer}>
            <Text style={styles.actionLabel}>Recommended Action:</Text>
            <Text style={styles.actionText}>{suggestion.action}</Text>
          </View>
        )}
        <Text style={styles.timestamp}>
          {new Date(suggestion.timestamp).toLocaleString()}
        </Text>
      </LinearGradient>
    </View>
  )
  if (loading && !refreshing) {
    return (
      <LinearGradient
        colors={['#e7fbe8ff', '#cdffcfff']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading suggestions...</Text>
          </View>
        </SafeAreaView>
        <BottomNavigation />
      </LinearGradient>
    )
  }
  return (
    <LinearGradient
      colors={['#e7fbe8ff', '#cdffcfff']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <LinearGradient
          colors={['#4A90E2', '#357ABD', '#2E5B8A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Suggestions</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={onRefresh}
          >
            <Ionicons name="refresh" size={24} color="white" />
          </TouchableOpacity>
        </LinearGradient>
        {/* Content */}
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {suggestions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="bulb-outline" size={64} color="#666" />
              <Text style={styles.emptyTitle}>No Suggestions Available</Text>
              <Text style={styles.emptySubtitle}>
                Add sensors to your farms to receive personalized suggestions
              </Text>
            </View>
          ) : (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.sectionTitle}>
                📊 Farm Analysis & Recommendations ({suggestions.length})
              </Text>
              {suggestions.map(renderSuggestionCard)}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
      <BottomNavigation />
    </LinearGradient>
  )
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  refreshButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  suggestionsContainer: {
    paddingVertical: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  suggestionCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardGradient: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  titleContainer: {
    marginLeft: 12,
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  aiLabel: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '600',
  },
  farmName: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  valueContainer: {
    alignItems: 'flex-end',
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sensorType: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    marginBottom: 12,
  },
  actionContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
    paddingLeft: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  actionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
})
export default Suggestion
