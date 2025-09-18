import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { weatherService, WeatherData } from '../lib/weatherService'
interface WeatherWidgetProps {
  location: string
  compact?: boolean
  onPress?: () => void
}
const WeatherWidget: React.FC<WeatherWidgetProps> = ({ location, compact = false, onPress }) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 2

  useEffect(() => {
    fetchWeatherData()
  }, [location])

  const fetchWeatherData = async (isRetry: boolean = false) => {
    try {
      if (!isRetry) {
        setLoading(true)
        setError(null)
      }

      // Validate location before making API call
      if (!location || typeof location !== 'string' || location.trim() === '') {
        console.warn('Invalid location provided, using demo data')
        setWeatherData(weatherService.getDemoWeatherData('Unknown Location'))
        return
      }

      // Check if weatherService is properly imported
      if (!weatherService || typeof weatherService.getWeatherByLocation !== 'function') {
        console.error('Weather service not properly imported, using demo data')
        setWeatherData({
          current: {
            temperature: 28,
            weatherCode: 2,
            windSpeed: 12,
            humidity: 65,
            feelsLike: 31,
            condition: 'Partly cloudy'
          },
          daily: [
            {
              date: new Date().toISOString().split('T')[0],
              temperature: { max: 32, min: 24 },
              weatherCode: 2,
              precipitation: 0,
              condition: 'Partly cloudy'
            }
          ],
          location: location || 'Demo Location'
        })
        return
      }

      console.log(`Fetching weather data for: "${location}" (attempt ${retryCount + 1})`)

      // Add slight delay to prevent overwhelming the API
      if (isRetry && retryCount > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000)) // 2 second delay on retry
      }

      const data = await weatherService.getWeatherByLocation(location.trim())
      setWeatherData(data)
      setRetryCount(0) // Reset retry count on success
      console.log(`Successfully loaded weather for: "${location}"`)

    } catch (err: any) {
      console.error('Weather fetch error:', err)

      // Try to retry once on HTTP 400 or timeout before falling back to demo data
      if ((err.message?.includes('HTTP error: 400') || err.message?.includes('timeout')) && retryCount < maxRetries && !isRetry) {
        console.log(`Retrying weather request for: "${location}" (${retryCount + 1}/${maxRetries})`)
        setRetryCount(prev => prev + 1)
        setTimeout(() => fetchWeatherData(true), 1000) // Retry after 1 second
        return
      }

      // Fall back to demo data after retries exhausted or on any error
      console.log(`Falling back to demo weather data for: "${location}"`)
      const demoData = weatherService?.getDemoWeatherData ?
        weatherService.getDemoWeatherData(location) :
        {
          current: {
            temperature: 28,
            weatherCode: 2,
            windSpeed: 12,
            humidity: 65,
            feelsLike: 31,
            condition: 'Partly cloudy'
          },
          daily: [
            {
              date: new Date().toISOString().split('T')[0],
              temperature: { max: 32, min: 24 },
              weatherCode: 2,
              precipitation: 0,
              condition: 'Partly cloudy'
            },
            {
              date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
              temperature: { max: 30, min: 23 },
              weatherCode: 61,
              precipitation: 2.5,
              condition: 'Slight rain'
            }
          ],
          location: location || 'Demo Location'
        }

      setWeatherData(demoData)
      setRetryCount(0) // Reset retry count

      // Set a user-friendly message but don't prevent the widget from working
      if (err.message?.includes('HTTP error: 400')) {
        setError('API issue - using sample data')
      } else if (err.message?.includes('timeout')) {
        setError('Slow connection - using sample data')
      } else if (err.message?.includes('Network connection failed')) {
        setError('No internet - using offline data')
      } else if (err.message?.includes('not found')) {
        setError('Location not found - showing sample data')
      } else {
        setError('Using sample weather data')
      }
    } finally {
      setLoading(false)
    }
  }
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }
  const getTemperatureColor = (temp: number) => {
    if (temp >= 35) return '#FF6B6B' // Hot - Red
    if (temp >= 25) return '#FFA726' // Warm - Orange
    if (temp >= 15) return '#4CAF50' // Mild - Green
    if (temp >= 5) return '#42A5F5' // Cool - Blue
    return '#9C27B0' // Cold - Purple
  }
  const isDay = () => {
    const hour = new Date().getHours()
    return hour >= 6 && hour < 18
  }
  if (loading) {
    return (
      <View style={[styles.container, compact && styles.compactContainer]}>
        <LinearGradient colors={['#E3F2FD', '#BBDEFB']} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#1976D2" />
            <Text style={styles.loadingText}>Loading weather...</Text>
          </View>
        </LinearGradient>
      </View>
    )
  }
  if (error || !weatherData) {
    return (
      <TouchableOpacity
        style={[styles.container, compact && styles.compactContainer]}
        onPress={fetchWeatherData}
      >
        <LinearGradient colors={['#FFEBEE', '#FFCDD2']} style={styles.gradient}>
          <View style={styles.errorContainer}>
            <Ionicons name="refresh-circle" size={24} color="#D32F2F" />
            <Text style={styles.errorText}>Tap to retry</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    )
  }
  const { current, daily } = weatherData
  const weatherIcon = weatherService.getWeatherIcon(current.weatherCode, isDay())
  const weatherDescription = weatherService.getWeatherDescription(current.weatherCode)
  if (compact) {
    return (
      <TouchableOpacity style={styles.compactContainer} onPress={onPress}>
        <LinearGradient
          colors={['#E3F2FD', '#BBDEFB']}
          style={styles.compactGradient}
        >
          <View style={styles.compactContent}>
            {/* Single row layout for better space efficiency */}
            <View style={styles.compactRow}>
              <View style={styles.compactIconTemp}>
                <Ionicons name={weatherIcon as any} size={28} color="#1976D2" />
                <Text style={[styles.compactTemperature, { color: getTemperatureColor(current.temperature) }]}>
                  {current.temperature}°C
                </Text>
              </View>
              <View style={styles.compactDetails}>
                <Text style={styles.compactDescription} numberOfLines={1}>{weatherDescription}</Text>
                <View style={styles.compactDetailsRow}>
                  <Text style={styles.compactDetailText}>💧{current.humidity}%</Text>
                  <Text style={styles.compactDetailText}>💨{current.windSpeed}km/h</Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    )
  }
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <LinearGradient
        colors={['#E3F2FD', '#BBDEFB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={16} color="#1976D2" />
            <Text style={styles.location}>{location}</Text>
          </View>
          <TouchableOpacity onPress={fetchWeatherData}>
            <Ionicons name="refresh" size={20} color="#1976D2" />
          </TouchableOpacity>
        </View>
        <View style={styles.currentWeather}>
          <View style={styles.currentLeft}>
            <Ionicons name={weatherIcon as any} size={60} color="#1976D2" />
            <Text style={styles.description}>{weatherDescription}</Text>
          </View>
          <View style={styles.currentRight}>
            <Text style={[styles.temperature, { color: getTemperatureColor(current.temperature) }]}>
              {current.temperature}°
            </Text>
            <Text style={styles.feelsLike}>
              Feels like {current.feelsLike}°
            </Text>
          </View>
        </View>
        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Ionicons name="water" size={16} color="#1976D2" />
            <Text style={styles.detailText}>Humidity</Text>
            <Text style={styles.detailValue}>{current.humidity}%</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="speedometer" size={16} color="#1976D2" />
            <Text style={styles.detailText}>Wind</Text>
            <Text style={styles.detailValue}>{current.windSpeed} km/h</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.forecast}>
          {daily.slice(0, 6).map((day, index) => (
            <View key={index} style={styles.forecastDay}>
              <Text style={styles.forecastDate}>
                {index === 0 ? 'Today' : formatDate(day.date)}
              </Text>
              <Ionicons
                name={weatherService.getWeatherIcon(day.weatherCode, true) as any}
                size={24}
                color="#1976D2"
              />
              <Text style={styles.forecastHigh}>{day.temperature.max}°</Text>
              <Text style={styles.forecastLow}>{day.temperature.min}°</Text>
              {day.precipitation && day.precipitation > 0 ? (
                <Text style={styles.precipitation}>💧 {day.precipitation}mm</Text>
              ) : null}
            </View>
          ))}
        </ScrollView>
      </LinearGradient>
    </TouchableOpacity>
  )
}
const styles = StyleSheet.create({
  container: {
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginVertical: 8,
  },
  compactContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    marginVertical: 0,
    minHeight: 140, // Calculated to match 2x2 sensor grid + gaps
    maxHeight: 140, // Fixed height for consistent alignment
    flex: 1, // Takes same flex space as sensor side
  },
  gradient: {
    padding: 16,
  },
  compactGradient: {
    padding: 12,
    height: '100%',
    justifyContent: 'space-between',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    color: '#1976D2',
    fontSize: 14,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  errorText: {
    marginLeft: 8,
    color: '#D32F2F',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    marginLeft: 4,
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
  },
  currentWeather: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  currentLeft: {
    alignItems: 'center',
  },
  currentRight: {
    alignItems: 'flex-end',
  },
  temperature: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  feelsLike: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  description: {
    fontSize: 14,
    color: '#1976D2',
    marginTop: 8,
    textAlign: 'center',
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    marginTop: 2,
  },
  forecast: {
    marginTop: 8,
  },
  forecastDay: {
    alignItems: 'center',
    marginRight: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    minWidth: 70,
  },
  forecastDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  forecastHigh: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976D2',
    marginTop: 4,
  },
  forecastLow: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  precipitation: {
    fontSize: 10,
    color: '#2196F3',
    marginTop: 2,
  },
  compactContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  compactRow: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%',
  },
  compactIconTemp: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  compactDetails: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactTemperature: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#1976D2',
  },
  compactFeelsLike: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  compactDescription: {
    fontSize: 13,
    color: '#1976D2',
    fontWeight: '500',
    marginBottom: 6,
    textAlign: 'center',
  },
  compactDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  compactDetailText: {
    fontSize: 11,
    color: '#555',
    fontWeight: '500',
  },
})
export default WeatherWidget
