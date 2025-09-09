import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { weatherService, WeatherData, LocationCoordinates } from '../../lib/weatherService';
import { useAuthContext } from '../../context/AuthContext';

interface TemperatureProps {
  farmLocation?: string; // Optional prop to specify location
}

export function Temperature({ farmLocation }: TemperatureProps) {
    const { session } = useAuthContext();
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentLocation, setCurrentLocation] = useState<string>('');

    useEffect(() => {
        fetchWeatherData();
    }, [farmLocation, session]);

    const fetchWeatherData = async () => {
        try {
            setLoading(true);
            setError(null);

            let locationToUse = farmLocation;

            // If no specific location provided, try to get from user's farms
            if (!locationToUse && session?.user?.id) {
                const { data: userFarms } = await supabase
                    .from('farm_users')
                    .select(`
                        farms!inner (
                            location
                        )
                    `)
                    .eq('user_id', session.user.id)
                    .limit(1);

                if (userFarms && userFarms.length > 0) {
                    locationToUse = userFarms[0].farms.location;
                }
            }

            // Default location if none found
            if (!locationToUse) {
                locationToUse = 'Ho Chi Minh City, Vietnam'; // Default location
            }

            setCurrentLocation(locationToUse);

            // Get coordinates for the location
            const coordinates = await weatherService.getLocationCoordinates(locationToUse);

            // Fetch weather data
            const weather = await weatherService.getCurrentWeather(coordinates);
            setWeatherData(weather);

        } catch (error) {
            console.error('Error fetching weather data:', error);
            setError('Unable to fetch weather data');

            // Fallback to sensor data if available
            await fetchSensorTemperature();
        } finally {
            setLoading(false);
        }
    };

    const fetchSensorTemperature = async () => {
        try {
            const { data: tempSensors } = await supabase
                .from('sensor')
                .select('sensor_id')
                .eq('sensor_type', 'Digital Temperature');

            if (tempSensors && tempSensors.length > 0) {
                const { data: latestReadings } = await supabase
                    .from('sensor_data')
                    .select('value')
                    .in('sensor_id', tempSensors.map(s => s.sensor_id))
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (latestReadings && latestReadings.length > 0) {
                    const sensorTemp = Math.round(latestReadings[0].value);
                    // Create mock weather data using sensor temperature
                    setWeatherData({
                        current: {;
                            temperature: sensorTemp,
                            weatherCode: 1, // Mainly clear
                            windSpeed: 5,
                            humidity: 65,
                        },
                        daily: Array.from({ length: 3 }, (_, i) => ({
                            date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                            temperature: {;
                                max: sensorTemp + Math.round(Math.random() * 4),
                                min: sensorTemp - Math.round(Math.random() * 4),
                            },
                            weatherCode: 1,
                        })),
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching sensor temperature:', error);
        }
    };

    const getDayName = (index: number): string => {;
        const days = ['Today', 'Tomorrow'];
        if (index < 2) return days[index];

        const date = new Date();
        date.setDate(date.getDate() + index);
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    };

    const getTemperatureForDay = (index: number): number => {;
        if (!weatherData) return 20;

        if (index === 0) {
            return weatherData.current.temperature;
        } else {
            return weatherData.daily[index]?.temperature.max || 20;
        }
    };

    const getWeatherIconForDay = (index: number): string => {;
        if (!weatherData) return 'partly-sunny-outline';

        const weatherCode = index === 0
            ? weatherData.current.weatherCode
            : weatherData.daily[index]?.weatherCode || 1;

        return weatherService.getWeatherIcon(weatherCode, true);
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.loadingText}>Loading weather...</Text>
            </View>
        );
    }

    if (error && !weatherData) {
        return (
            <View style={styles.container}>
                <Ionicons name="cloud-offline-outline" size={24} color="#fff" />
                <Text style={styles.errorText}>Weather unavailable</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.locationContainer}>
                <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.locationText}>{currentLocation}</Text>
            </View>

            <View style={styles.weatherContainer}>
                {Array.from({ length: 3 }, (_, index) => (
                    <View key={index} style={styles.dayContainer}>
                        <Ionicons
                            name={getWeatherIconForDay(index) as any}
                            size={24}
                            color="#FFD700"
                            style={styles.weatherIcon}
                        />
                        <Text style={styles.dayText}>{getDayName(index)}</Text>
                        <Text style={styles.tempText}>{getTemperatureForDay(index)}°C</Text>
                        {index === 0 && weatherData && (
                            <View style={styles.detailsContainer}>
                                <Text style={styles.detailText}>
                                    💨 {Math.round(weatherData.current.windSpeed)} km/h
                                </Text>
                                <Text style={styles.detailText}>
                                    💧 {Math.round(weatherData.current.humidity)}%
                                </Text>
                            </View>
                        )}
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {;
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 15,
        paddingVertical: 20,
        paddingHorizontal: 15,
        marginHorizontal: 20,
        marginTop: 20,
        width: '90%',
        minHeight: 120,
    },
    locationContainer: {;
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        justifyContent: 'center',
    },
    locationText: {;
        color: 'rgba(255,255,255,0.9)',
        fontSize: 13,
        marginLeft: 4,
        fontWeight: '500',
    },
    weatherContainer: {;
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-start',
    },
    dayContainer: {;
        alignItems: 'center',
        flex: 1,
    },
    weatherIcon: {;
        marginBottom: 5,
    },
    dayText: {;
        fontSize: 14,
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: 2,
    },
    tempText: {;
        fontSize: 18,
        color: '#fff',
        fontWeight: '600',
        marginBottom: 5,
    },
    detailsContainer: {;
        alignItems: 'center',
    },
    detailText: {;
        color: 'rgba(255,255,255,0.7)',
        fontSize: 10,
        marginVertical: 1,
    },
    loadingText: {;
        color: '#fff',
        fontSize: 16,
        marginLeft: 10,
    },
    errorText: {;
        color: 'rgba(255,100,100,0.9)',
        fontSize: 14,
        marginLeft: 10,
    },
});
