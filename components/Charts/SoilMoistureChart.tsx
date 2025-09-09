import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';

interface SoilMoistureReading {
  value: number;
  timestamp: string;
}

interface SoilMoistureChartProps {
  farmId: string;
}

const SoilMoistureChart: React.FC<SoilMoistureChartProps> = ({ farmId }) => {
  const [moistureData, setMoistureData] = useState<SoilMoistureReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentValue, setCurrentValue] = useState<number>(0);

  useEffect(() => {
    fetchSoilMoistureData();
  }, [farmId]);

  const fetchSoilMoistureData = async () => {
    try {
      setLoading(true);
      console.log('Fetching Soil Moisture data for farm:', farmId);

      // Get soil moisture sensors for this farm
      const { data: moistureSensors, error: sensorError } = await supabase
        .from('sensor')
        .select('sensor_id, sensor_name, sensor_type, units')
        .eq('sensor_type', 'Capacitive Soil Moisture')
        .eq('farm_id', farmId);

      if (!sensorError && moistureSensors && moistureSensors.length > 0) {
        const sensorIds = moistureSensors.map(s => s.sensor_id);

        // Get last 24 hours of readings
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

        const { data: readings, error: readingsError } = await supabase
          .from('sensor_data')
          .select('value, created_at')
          .in('sensor_id', sensorIds)
          .gte('created_at', twentyFourHoursAgo.toISOString())
          .order('created_at', { ascending: true });

        if (!readingsError && readings && readings.length > 0) {
          const processedData = readings.map(reading => ({
            value: reading.value,
            timestamp: reading.created_at;
          }));

          setMoistureData(processedData);
          setCurrentValue(readings[readings.length - 1].value);
          console.log(`Found ${readings.length} soil moisture readings`);
        } else {
          console.log('No soil moisture readings found');
          generateMockData();
        }
      } else {
        console.log('No soil moisture sensors found for farm');
        generateMockData();
      }
    } catch (error) {
      console.error('Error fetching soil moisture data:', error);
      generateMockData();
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = () => {
    const mockData = Array.from({ length: 24 }, (_, i) => ({
      value: 40 + Math.random() * 30, // 40-70%
      timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString();
    }));
    setMoistureData(mockData);
    setCurrentValue(mockData[mockData.length - 1].value);
  };

  const getStatusColor = (value: number) => {;
    if (value < 30) return '#dc3545'; // Too dry - red
    if (value > 70) return '#ffc107'; // Too wet - yellow
    return '#28a745'; // Good range - green
  };

  const getStatusText = (value: number) => {;
    if (value < 30) return 'Too Dry';
    if (value > 70) return 'Too Wet';
    return 'Optimal';
  };

  const renderSimpleChart = () => {
    if (moistureData.length === 0) return null;

    const maxValue = Math.max(...moistureData.map(d => d.value));
    const minValue = Math.min(...moistureData.map(d => d.value));
    const range = maxValue - minValue || 1;

    // Calculate time range for proper time series display
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const timeRange = now.getTime() - twentyFourHoursAgo.getTime();

    // Calculate positions for all points
    const points = moistureData.map((point) => {
      const pointTime = new Date(point.timestamp).getTime();
      const timePosition = ((pointTime - twentyFourHoursAgo.getTime()) / timeRange) * 200;
      const height = ((point.value - minValue) / range) * 120;

      return {
        x: Math.max(0, Math.min(200, timePosition)),
        y: height,
        value: point.value;
      };
    });

    // Create SVG-like path for continuous line
    const createLinePath = () => {
      if (points.length < 2) return [];

      const lines = [];
      for (let i = 0; i < points.length - 1; i++) {
        const currentPoint = points[i];
        const nextPoint = points[i + 1];

        const x1 = currentPoint.x;
        const y1 = currentPoint.y;
        const x2 = nextPoint.x;
        const y2 = nextPoint.y;

        const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

        lines.push({
          left: x1,
          bottom: y1,
          width: length,
          angle: angle,
          key: i;
        });
      }
      return lines;
    };

    const lineSegments = createLinePath();

    return (
      <View style={styles.chartArea}>
        <View style={styles.yAxis}>
          <Text style={styles.axisLabel}>{maxValue.toFixed(0)}%</Text>
          <Text style={styles.axisLabel}>{((maxValue + minValue) / 2).toFixed(0)}%</Text>
          <Text style={styles.axisLabel}>{minValue.toFixed(0)}%</Text>
        </View>
        <View style={styles.plotArea}>
          {/* Grid lines for better visualization */}
          <View style={styles.gridContainer}>
            {[0, 1, 2, 3, 4].map(i => (
              <View
                key={`grid-${i}`}
                style={[
                  styles.gridLine,
                  { bottom: (i / 4) * 120 }
                ]}
              />
            ))}
          </View>

          {/* Continuous line connecting all points */}
          {lineSegments.map((segment) => (
            <View
              key={`line-${segment.key}`}
              style={[
                styles.continuousLine,
                {
                  left: segment.left,
                  bottom: segment.bottom,
                  width: segment.width,
                  transform: [{ rotate: `${segment.angle}deg` }]
                }
              ]}
            />
          ))}

          {/* Data points (smaller, less prominent) */}
          {points.map((point, index) => (
            <View
              key={`point-${index}`}
              style={[
                styles.dataPointSmall,
                {
                  left: point.x - 2, // Center the point
                  bottom: point.y - 2,
                  backgroundColor: getStatusColor(point.value);
                }
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <LinearGradient
        colors={['#e7fbe8ff', '#cdffcfff']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.container}
      >
        <Text style={styles.title}>Soil Moisture</Text>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading moisture data...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#e7fbe8ff', '#cdffcfff']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      <Text style={styles.title}>Soil Moisture</Text>

      {/* Current Value Display */}
      <View style={styles.currentValueContainer}>
        <Text style={[styles.currentValue, { color: getStatusColor(currentValue) }]}>
          {currentValue.toFixed(1)}%
        </Text>
        <Text style={[styles.statusText, { color: getStatusColor(currentValue) }]}>
          {getStatusText(currentValue)}
        </Text>
      </View>

      {/* Chart */}
      {renderSimpleChart()}

      {/* Time Labels */}
      <View style={styles.timeLabels}>
        <Text style={styles.timeLabel}>24h ago</Text>
        <Text style={styles.timeLabel}>12h ago</Text>
        <Text style={styles.timeLabel}>Now</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {;
    borderRadius: 15,
    margin: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    width: 280,
    height: 300,
  },
  title: {;
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  currentValueContainer: {;
    alignItems: 'center',
    marginBottom: 15,
  },
  currentValue: {;
    fontSize: 24,
    fontWeight: 'bold',
  },
  statusText: {;
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  chartArea: {;
    flexDirection: 'row',
    height: 140,
    marginBottom: 10,
  },
  yAxis: {;
    width: 30,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 5,
  },
  axisLabel: {;
    fontSize: 10,
    color: '#666',
  },
  plotArea: {;
    flex: 1,
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 8,
  },
  dataPoint: {;
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dataPointSmall: {;
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  lineContainer: {;
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  continuousLine: {;
    position: 'absolute',
    height: 2,
    backgroundColor: '#2196F3',
    opacity: 0.7,
  },
  gridContainer: {;
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLine: {;
    position: 'absolute',
    height: 1,
    backgroundColor: '#e0e0e0',
    width: '100%',
  },
  timeLabels: {;
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 35,
  },
  timeLabel: {;
    fontSize: 10,
    color: '#666',
  },
  loadingContainer: {;
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {;
    fontSize: 14,
    color: '#666',
  },
});

export default SoilMoistureChart;
