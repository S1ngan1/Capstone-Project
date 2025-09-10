import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import BottomNavigation from '../components/BottomNavigation';
import { useAuthContext } from '../context/AuthContext';
import { RootStackParamList } from '../App';

interface SensorReading {
  sensor_id: string;
  value: number;
  created_at: string;
  sensor: {
    sensor_name: string;
    sensor_type: string;
    units: string;
    farm_id: string;
    farms: {
      name: string;
      location: string;
    };
  };
}

interface Suggestion {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  farmName: string;
  sensorType: string;
  value: number;
  unit: string;
  timestamp: string;
  action?: string;
}

const Suggestion: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { session, unreadCount } = useAuthContext();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const generateSuggestions = (readings: SensorReading[]): Suggestion[] => {
    const suggestions: Suggestion[] = [];

    readings.forEach((reading, index) => {
      const { sensor, value, created_at } = reading;
      const sensorType = sensor.sensor_type.toLowerCase();
      const farmName = sensor.farms.name;

      let suggestion: Suggestion | null = null;

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
          };
        } else if (value > 8.0) {
          suggestion = {
            id: `ph_high_${index}`,
            type: 'warning',
            title: 'Soil Too Alkaline',
            description: `pH level of ${value} is too high. Most plants prefer slightly acidic to neutral soil.`,
            farmName,
            sensorType: 'pH',
            value,
            unit: sensor.units,
            timestamp: created_at,
            action: 'Add sulfur or organic matter to lower pH',
          };
        } else if (value >= 6.5 && value <= 7.0) {
          suggestion = {
            id: `ph_optimal_${index}`,
            type: 'success',
            title: 'Optimal pH Level',
            description: `pH level of ${value} is ideal for most crops. Maintain current soil management practices.`,
            farmName,
            sensorType: 'pH',
            value,
            unit: sensor.units,
            timestamp: created_at,
          };
        }
      }

      // Temperature Sensor Analysis
      else if (sensorType.includes('temperature')) {
        if (value < 15) {
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
          };
        } else if (value > 35) {
          suggestion = {
            id: `temp_high_${index}`,
            type: 'critical',
            title: 'High Temperature Warning',
            description: `Temperature of ${value}°C can stress plants and reduce yields.`,
            farmName,
            sensorType: 'Temperature',
            value,
            unit: sensor.units,
            timestamp: created_at,
            action: 'Increase irrigation and provide shade',
          };
        } else if (value >= 20 && value <= 28) {
          suggestion = {
            id: `temp_optimal_${index}`,
            type: 'success',
            title: 'Ideal Growing Temperature',
            description: `Temperature of ${value}°C is perfect for most crops. Great growing conditions!`,
            farmName,
            sensorType: 'Temperature',
            value,
            unit: sensor.units,
            timestamp: created_at,
          };
        }
      }

      // Soil Moisture Analysis
      else if (sensorType.includes('moisture')) {
        if (value < 30) {
          suggestion = {
            id: `moisture_low_${index}`,
            type: 'critical',
            title: 'Soil Too Dry',
            description: `Soil moisture at ${value}% is too low. Plants may be stressed and need immediate watering.`,
            farmName,
            sensorType: 'Soil Moisture',
            value,
            unit: sensor.units,
            timestamp: created_at,
            action: 'Increase irrigation frequency and check drip system',
          };
        } else if (value > 80) {
          suggestion = {
            id: `moisture_high_${index}`,
            type: 'warning',
            title: 'Soil Too Wet',
            description: `Soil moisture at ${value}% is very high. Risk of root rot and fungal diseases.`,
            farmName,
            sensorType: 'Soil Moisture',
            value,
            unit: sensor.units,
            timestamp: created_at,
            action: 'Improve drainage and reduce watering',
          };
        } else if (value >= 50 && value <= 70) {
          suggestion = {
            id: `moisture_optimal_${index}`,
            type: 'success',
            title: 'Perfect Soil Moisture',
            description: `Soil moisture at ${value}% is ideal for healthy plant growth.`,
            farmName,
            sensorType: 'Soil Moisture',
            value,
            unit: sensor.units,
            timestamp: created_at,
          };
        }
      }

      // Electrical Conductivity Analysis
      else if (sensorType.includes('conductivity') || sensorType.includes('ec')) {
        if (value < 0.8) {
          suggestion = {
            id: `ec_low_${index}`,
            type: 'info',
            title: 'Low Nutrient Levels',
            description: `EC level of ${value} mS/cm indicates low nutrient concentration. Consider fertilization.`,
            farmName,
            sensorType: 'EC',
            value,
            unit: sensor.units,
            timestamp: created_at,
            action: 'Add balanced fertilizer or compost',
          };
        } else if (value > 3.0) {
          suggestion = {
            id: `ec_high_${index}`,
            type: 'warning',
            title: 'High Salt Content',
            description: `EC level of ${value} mS/cm is too high. Plants may suffer from salt stress.`,
            farmName,
            sensorType: 'EC',
            value,
            unit: sensor.units,
            timestamp: created_at,
            action: 'Flush soil with clean water and reduce fertilizer',
          };
        } else if (value >= 1.2 && value <= 2.0) {
          suggestion = {
            id: `ec_optimal_${index}`,
            type: 'success',
            title: 'Optimal Nutrient Levels',
            description: `EC level of ${value} mS/cm shows good nutrient balance for healthy plant growth.`,
            farmName,
            sensorType: 'EC',
            value,
            unit: sensor.units,
            timestamp: created_at,
          };
        }
      }

      if (suggestion) {
        suggestions.push(suggestion);
      }
    });

    return suggestions.sort((a, b) => {
      const typeOrder = { critical: 0, warning: 1, info: 2, success: 3 };
      return typeOrder[a.type] - typeOrder[b.type];
    });
  };

  const fetchSuggestions = async () => {
    try {
      if (!session?.user?.id) return;

      // Get user's farms
      const { data: userFarms, error: farmsError } = await supabase
        .from('farm_users')
        .select('farm_id')
        .eq('user_id', session.user.id);

      if (farmsError) throw farmsError;

      if (!userFarms || userFarms.length === 0) {
        setSuggestions([]);
        return;
      }

      const farmIds = userFarms.map(f => f.farm_id);

      // Get latest sensor readings from user's farms
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
              location
            )
          )
        `)
        .in('sensor.farm_id', farmIds)
        .order('created_at', { ascending: false })
        .limit(50);

      if (readingsError) throw readingsError;

      // Get only the latest reading for each sensor
      const latestReadings: { [key: string]: SensorReading } = {};
      readings?.forEach((reading: any) => {
        if (!latestReadings[reading.sensor_id] ||
            new Date(reading.created_at) > new Date(latestReadings[reading.sensor_id].created_at)) {
          latestReadings[reading.sensor_id] = reading;
        }
      });

      const suggestions = generateSuggestions(Object.values(latestReadings));
      setSuggestions(suggestions);

    } catch (error: any) {
      console.error('Error fetching suggestions:', error);
      Alert.alert('Error', 'Failed to load suggestions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [session]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSuggestions();
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'critical': return 'alert-circle';
      case 'warning': return 'warning';
      case 'info': return 'information-circle';
      case 'success': return 'checkmark-circle';
      default: return 'bulb';
    }
  };

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'critical': return '#f44336';
      case 'warning': return '#ff9800';
      case 'info': return '#2196f3';
      case 'success': return '#4caf50';
      default: return '#666';
    }
  };

  const renderSuggestion = (suggestion: Suggestion) => (
    <View key={suggestion.id} style={styles.suggestionCard}>
      <View style={styles.suggestionHeader}>
        <View style={styles.suggestionTitleRow}>
          <Ionicons
            name={getSuggestionIcon(suggestion.type) as any}
            size={24}
            color={getSuggestionColor(suggestion.type)}
          />
          <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
        </View>
        <View style={[styles.priorityBadge, { backgroundColor: getSuggestionColor(suggestion.type) }]}>
          <Text style={styles.priorityText}>{suggestion.type?.toUpperCase() || 'UNKNOWN'}</Text>
        </View>
      </View>

      <View style={styles.suggestionMeta}>
        <Text style={styles.farmName}>{suggestion.farmName}</Text>
        <Text style={styles.timestamp}>
          {new Date(suggestion.timestamp).toLocaleDateString()} at{' '}
          {new Date(suggestion.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>

      <Text style={styles.suggestionDescription}>{suggestion.description}</Text>

      <View style={styles.sensorInfo}>
        <Text style={styles.sensorType}>{suggestion.sensorType}</Text>
        <Text style={styles.sensorValue}>
          {suggestion.value} {suggestion.unit}
        </Text>
      </View>

      {suggestion.action && (
        <View style={styles.actionContainer}>
          <Ionicons name="bulb-outline" size={16} color="#ff9800" />
          <Text style={styles.actionText}>{suggestion.action}</Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading suggestions...</Text>
        </View>
        <BottomNavigation />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#e7fbe8ff', '#ffffff']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Smart Farming Suggestions</Text>
            <Text style={styles.subtitle}>AI-powered recommendations for your farm</Text>
          </View>

          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => navigation.navigate("Notification")}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications" size={24} color="#2e7d32" />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount.toString()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {suggestions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="leaf-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No Suggestions Available</Text>
            <Text style={styles.emptyText}>
              We need sensor data from your farms to provide personalized suggestions.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Summary</Text>
              <View style={styles.summaryStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {suggestions.filter(s => s.type === 'critical').length}
                  </Text>
                  <Text style={styles.statLabel}>Critical</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {suggestions.filter(s => s.type === 'warning').length}
                  </Text>
                  <Text style={styles.statLabel}>Warning</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {suggestions.filter(s => s.type === 'success').length}
                  </Text>
                  <Text style={styles.statLabel}>Optimal</Text>
                </View>
              </View>
            </View>

            {suggestions.map(renderSuggestion)}
          </>
        )}
      </ScrollView>

      <BottomNavigation />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    paddingTop: 60,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  notificationButton: {
    position: 'relative',
    padding: 10,
  },
  notificationBadge: {
    position: 'absolute',
    right: -6,
    top: -6,
    backgroundColor: '#f44336',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
    fontSize: 18,
    color: '#666',
  },
  summaryContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  suggestionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  suggestionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  suggestionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  farmName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e7d32',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  suggestionDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 15,
  },
  sensorInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  sensorType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  sensorValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  actionText: {
    fontSize: 14,
    color: '#ef6c00',
    marginLeft: 8,
    fontWeight: '500',
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default Suggestion;
