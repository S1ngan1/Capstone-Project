import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { weatherService, WeatherData } from '../lib/weatherService';

interface WeatherWidgetProps {
  location: string;
  compact?: boolean;
  onPress?: () => void;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ location, compact = false, onPress }) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWeatherData();
  }, [location]);

  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate location before making API call
      if (!location || typeof location !== 'string' || location.trim() === '') {
        throw new Error('Invalid location provided');
      }

      const data = await weatherService.getWeatherForFarm(location.trim());
      setWeatherData(data);
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError('Unable to load weather data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getTemperatureColor = (temp: number) => {
    if (temp >= 35) return '#FF6B6B'; // Hot - Red
    if (temp >= 25) return '#FFA726'; // Warm - Orange
    if (temp >= 15) return '#4CAF50'; // Mild - Green
    if (temp >= 5) return '#42A5F5'; // Cool - Blue
    return '#9C27B0'; // Cold - Purple
  };

  const isDay = () => {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18;
  };

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
    );
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
    );
  }

  const { current, daily } = weatherData;
  const weatherIcon = weatherService.getWeatherIcon(current.weatherCode, isDay());
  const weatherDescription = weatherService.getWeatherDescription(current.weatherCode);

  if (compact) {
    return (
      <TouchableOpacity style={styles.compactContainer} onPress={onPress}>
        <LinearGradient
          colors={['#E3F2FD', '#BBDEFB']}
          style={styles.compactGradient}
        >
          <View style={styles.compactContent}>
            {/* Weather Icon and Temperature Section */}
            <View style={styles.compactMainSection}>
              <View style={styles.compactIconContainer}>
                <Ionicons name={weatherIcon as any} size={48} color="#1976D2" />
              </View>
              <View style={styles.compactTempSection}>
                <Text style={[styles.compactTemperature, { color: getTemperatureColor(current.temperature) }]}>
                  {current.temperature}°C
                </Text>
                <Text style={styles.compactFeelsLike}>
                  Feels {current.feelsLike}°C
                </Text>
              </View>
            </View>

            {/* Weather Description and Details */}
            <View style={styles.compactInfoSection}>
              <Text style={styles.compactDescription}>{weatherDescription}</Text>
              <View style={styles.compactDetailsRow}>
                <View style={styles.compactDetailItem}>
                  <Text style={styles.compactDetailIcon}>💧</Text>
                  <Text style={styles.compactDetailText}>{current.humidity}%</Text>
                </View>
                <View style={styles.compactDetailItem}>
                  <Text style={styles.compactDetailIcon}>💨</Text>
                  <Text style={styles.compactDetailText}>{current.windSpeed}km/h</Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
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
          {daily.slice(0, 5).map((day, index) => (
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
  );
};

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
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    marginVertical: 0,
    height: 138, // Match exact height of 2x2 sensor grid (65+8+65)
    width: '100%',
  },
  gradient: {
    padding: 16,
  },
  compactGradient: {
    padding: 16,
    height: '100%',
    justifyContent: 'center',
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
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%',
    padding: 8,
  },
  compactMainSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  compactIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  compactTempSection: {
    flex: 1,
    justifyContent: 'center',
  },
  compactTemperature: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#1976D2',
  },
  compactFeelsLike: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  compactInfoSection: {
    paddingTop: 8,
  },
  compactDescription: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  compactDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  compactDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactDetailIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  compactDetailText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
});

export default WeatherWidget;
