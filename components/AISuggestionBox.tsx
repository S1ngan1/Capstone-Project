import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { AIFarmingSpecialist } from '../services/aiChatService'
import { useAuthContext } from '../context/AuthContext'

interface AISuggestionBoxProps {
  farmId: string
  farmName: string
  farmLocation: string
  farmNotes?: string
  sensorData: Array<{
    id: string
    name: string
    type: string
    value: number
    unit: string
    timestamp: string
  }>
  weatherData?: {
    current?: any
    forecast?: any[]
  }
  onChatWithAI?: () => void
}

interface Suggestion {
  id: string
  type: 'critical' | 'warning' | 'info' | 'success'
  title: string
  message: string
  actions?: string[]
  confidence?: number
}

const getSuggestionColor = (type: string) => {
  switch (type) {
    case 'critical': return '#F44336'
    case 'warning': return '#FF9800'
    case 'info': return '#2196F3'
    case 'success': return '#4CAF50'
    default: return '#666'
  }
}

export const AISuggestionBox: React.FC<AISuggestionBoxProps> = ({
  farmId,
  farmName,
  farmLocation,
  farmNotes,
  sensorData,
  weatherData,
  onChatWithAI
}) => {
  const { session } = useAuthContext()
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [aiSpecialist] = useState(() => new AIFarmingSpecialist())

  useEffect(() => {
    generateSuggestions()
  }, [sensorData, weatherData])

  const generateSuggestions = async () => {
    if (!session?.user?.id) return

    try {
      setIsLoading(true)
      const newSuggestions: Suggestion[] = []

      // Check if we have sensor data
      if (sensorData.length === 0) {
        newSuggestions.push({
          id: 'no-sensors',
          type: 'info',
          title: '📡 No Sensor Data Available',
          message: `I don't have any sensor data for ${farmName} yet. Install sensors to get personalized AI recommendations based on real-time conditions.`,
          actions: ['Install pH sensor', 'Install moisture sensor', 'Install temperature sensor'],
          confidence: 1.0
        })
      } else {
        // Analyze each sensor
        for (const sensor of sensorData) {
          const timeSinceReading = new Date().getTime() - new Date(sensor.timestamp).getTime()
          const hoursOld = timeSinceReading / (1000 * 60 * 60)

          // Check if data is too old
          if (hoursOld > 48) {
            newSuggestions.push({
              id: `stale-${sensor.id}`,
              type: 'warning',
              title: '⏰ Outdated Sensor Data',
              message: `${sensor.name} hasn't reported data in ${Math.floor(hoursOld)} hours. Check sensor connectivity or battery.`,
              actions: ['Check sensor battery', 'Verify connectivity'],
              confidence: 0.9
            })
            continue
          }

          // Analyze sensor readings based on type
          const sensorType = sensor.type.toLowerCase()
          const value = sensor.value

          if (sensorType.includes('ph')) {
            if (value < 6.0) {
              newSuggestions.push({
                id: `ph-low-${sensor.id}`,
                type: 'warning',
                title: '🧪 Soil pH Too Acidic',
                message: `pH level of ${value.toFixed(1)} is too low. Most crops prefer pH 6.0-7.5. Consider adding lime to raise pH.`,
                actions: ['Apply agricultural lime', 'Test soil nutrients'],
                confidence: 0.85
              })
            } else if (value > 8.0) {
              newSuggestions.push({
                id: `ph-high-${sensor.id}`,
                type: 'warning',
                title: '🧪 Soil pH Too Alkaline',
                message: `pH level of ${value.toFixed(1)} is too high. Add organic matter or sulfur to lower pH.`,
                actions: ['Add organic matter', 'Apply sulfur'],
                confidence: 0.85
              })
            } else {
              newSuggestions.push({
                id: `ph-good-${sensor.id}`,
                type: 'success',
                title: '✅ Optimal Soil pH',
                message: `pH level of ${value.toFixed(1)} is ideal for most crops. Great job!`,
                confidence: 0.9
              })
            }
          }

          if (sensorType.includes('moisture') || sensorType.includes('humidity')) {
            if (value < 30) {
              newSuggestions.push({
                id: `moisture-low-${sensor.id}`,
                type: 'critical',
                title: '💧 Low Soil Moisture',
                message: `Soil moisture at ${value}% is critically low. Immediate irrigation needed.`,
                actions: ['Increase irrigation', 'Check irrigation system'],
                confidence: 0.95
              })
            } else if (value > 80) {
              newSuggestions.push({
                id: `moisture-high-${sensor.id}`,
                type: 'warning',
                title: '🌊 High Soil Moisture',
                message: `Soil moisture at ${value}% is too high. Risk of root rot. Improve drainage.`,
                actions: ['Improve drainage', 'Reduce irrigation'],
                confidence: 0.85
              })
            }
          }

          if (sensorType.includes('temperature')) {
            if (value < 10) {
              newSuggestions.push({
                id: `temp-low-${sensor.id}`,
                type: 'warning',
                title: '🥶 Low Temperature Alert',
                message: `Temperature of ${value}°C may stress crops. Consider frost protection measures.`,
                actions: ['Install frost protection', 'Monitor closely'],
                confidence: 0.8
              })
            } else if (value > 35) {
              newSuggestions.push({
                id: `temp-high-${sensor.id}`,
                type: 'warning',
                title: '🔥 High Temperature Alert',
                message: `Temperature of ${value}°C is stressing crops. Increase irrigation and provide shade.`,
                actions: ['Increase irrigation', 'Provide shade'],
                confidence: 0.8
              })
            }
          }
        }
      }

      // Weather-based suggestions
      if (weatherData?.current) {
        const temp = weatherData.current.temperature || weatherData.current.temp
        const humidity = weatherData.current.humidity
        const windSpeed = weatherData.current.wind_speed || weatherData.current.windSpeed

        if (temp > 30 && humidity < 50) {
          newSuggestions.push({
            id: 'weather-hot-dry',
            type: 'warning',
            title: '☀️ Hot & Dry Conditions',
            message: `Hot weather (${temp}°C) with low humidity (${humidity}%) detected. Increase irrigation frequency.`,
            actions: ['Increase watering', 'Apply mulch'],
            confidence: 0.8
          })
        }

        if (windSpeed > 15) {
          newSuggestions.push({
            id: 'weather-windy',
            type: 'info',
            title: '💨 Windy Conditions',
            message: `High winds (${windSpeed} km/h) may increase water evaporation. Monitor soil moisture closely.`,
            actions: ['Monitor soil moisture', 'Protect young plants'],
            confidence: 0.7
          })
        }
      }

      // Forecast-based suggestions
      if (weatherData?.forecast && weatherData.forecast.length > 0) {
        const tomorrow = weatherData.forecast[0]
        const rainChance = tomorrow.pop || tomorrow.rain_chance || 0

        if (rainChance > 70) {
          newSuggestions.push({
            id: 'forecast-rain',
            type: 'info',
            title: '🌧️ Rain Expected Tomorrow',
            message: `${rainChance}% chance of rain tomorrow. Consider reducing irrigation schedule.`,
            actions: ['Adjust irrigation', 'Prepare drainage'],
            confidence: 0.75
          })
        }
      }

      // General farming tips if no specific issues
      if (newSuggestions.length === 0) {
        newSuggestions.push({
          id: 'general-tip',
          type: 'info',
          title: '🌱 Farm Looking Good!',
          message: 'All sensor readings appear normal. Keep up the great work! Consider asking me about crop rotation or seasonal planning.',
          actions: ['Plan crop rotation', 'Schedule maintenance'],
          confidence: 0.6
        })
      }

      setSuggestions(newSuggestions)
    } catch (error) {
      console.error('Error generating suggestions:', error)
      setSuggestions([{
        id: 'error',
        type: 'warning',
        title: '⚠️ Analysis Unavailable',
        message: 'Unable to analyze farm data at the moment. Chat with AI for personalized advice.',
        actions: ['Chat with AI'],
        confidence: 0.5
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleActionPress = (action: string) => {
    // For now, all actions lead to chat with AI
    if (onChatWithAI) {
      onChatWithAI()
    }
  }

  const prioritySuggestions = suggestions.filter(s => s.type === 'critical' || s.type === 'warning')
  const displaySuggestions = isExpanded ? suggestions : prioritySuggestions.slice(0, 2)

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#f8f9fa', '#ffffff']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons name="brain" size={24} color="#4CAF50" />
            <Text style={styles.title}>AI Farm Analysis</Text>
            {isLoading && <ActivityIndicator size="small" color="#4CAF50" style={{ marginLeft: 8 }} />}
          </View>
          <TouchableOpacity
            onPress={() => setIsExpanded(!isExpanded)}
            style={styles.expandButton}
          >
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} nestedScrollViewEnabled>
          {displaySuggestions.map((suggestion) => (
            <View key={suggestion.id} style={styles.suggestionCard}>
              <View style={styles.suggestionHeader}>
                <View style={[styles.typeIndicator, { backgroundColor: getSuggestionColor(suggestion.type) }]} />
                <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
              </View>
              <Text style={styles.suggestionMessage}>{suggestion.message}</Text>

              {suggestion.actions && suggestion.actions.length > 0 && (
                <View style={styles.actionsContainer}>
                  {suggestion.actions.map((action, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.actionButton}
                      onPress={() => handleActionPress(action)}
                    >
                      <Text style={styles.actionText}>{action}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}

          {!isExpanded && suggestions.length > 2 && (
            <TouchableOpacity
              style={styles.showMoreButton}
              onPress={() => setIsExpanded(true)}
            >
              <Text style={styles.showMoreText}>
                Show {suggestions.length - 2} more suggestions
              </Text>
              <Ionicons name="chevron-down" size={16} color="#4CAF50" />
            </TouchableOpacity>
          )}
        </ScrollView>

        <TouchableOpacity style={styles.chatButton} onPress={onChatWithAI}>
          <Ionicons name="chatbubbles" size={20} color="#fff" />
          <Text style={styles.chatButtonText}>Chat with AI Specialist</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  gradient: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  expandButton: {
    padding: 4,
  },
  content: {
    maxHeight: 400,
  },
  suggestionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeIndicator: {
    width: 4,
    height: 16,
    borderRadius: 2,
    marginRight: 8,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  suggestionMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  actionText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  showMoreText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    marginRight: 4,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    marginTop: 12,
  },
  chatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
})
