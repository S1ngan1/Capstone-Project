import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import WeatherWidget from '../components/WeatherWidget';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from "@react-navigation/native";
import BottomNavigation from '../components/BottomNavigation';
import { useAuthContext } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export type RootStackParamList = {
    Auth: undefined;
    Onboarding: undefined;
    Home: undefined;
    Farm: undefined;
    Suggestion: undefined;
    Profile: undefined;
    Settings: undefined;
    Notification: undefined;
    FarmDetails: { farmId: string };
};

interface Farm {
    id: string;
    name: string;
    location: string;
    averages: {
        ec: number;
        soilMoisture: number;
        temperature: number;
        ph: number;
    };
}

const Home = () => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const { session } = useAuthContext();
    const [username, setUsername] = useState<string>("");
    const [farms, setFarms] = useState<Farm[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchUserDataAndFarms = async () => {
            if (!session?.user?.id) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                // Fetch username from profiles table
                const { data: profileData, error: profileError } = await supabase
                    .from("profiles")
                    .select("username")
                    .eq("id", session.user.id)
                    .single();

                if (!profileError && profileData?.username) {
                    setUsername(profileData.username);
                } else {
                    setUsername(session.user.email?.split('@')[0] || "User");
                }

                // Fetch user's farms
                const { data: userFarms, error: farmsError } = await supabase
                    .from('farm_users')
                    .select(`
                        farm_id,
                        farms!inner (
                            id,
                            name,
                            location
                        )
                    `)
                    .eq('user_id', session.user.id);

                if (!farmsError && userFarms) {
                    const farmsWithAverages = await Promise.all(
                        userFarms.map(async (userFarm) => {
                            const farm = userFarm.farms;
                            const averages = await calculateFarmAverages(farm.id);

                            return {
                                id: farm.id,
                                name: farm.name,
                                location: farm.location,
                                averages
                            };
                        })
                    );

                    setFarms(farmsWithAverages);
                }
            } catch (error) {
                console.error('Error fetching user data and farms:', error);
                setUsername(session.user.email?.split('@')[0] || "User");
            } finally {
                setLoading(false);
            }
        };

        fetchUserDataAndFarms();
    }, [session]);

    const calculateFarmAverages = async (farmId: string) => {
        try {
            // Get all sensors for this farm
            const { data: sensors } = await supabase
                .from('sensor')
                .select('sensor_id, sensor_type')
                .eq('farm_id', farmId);

            if (!sensors || sensors.length === 0) {
                return { ec: 0, soilMoisture: 0, temperature: 0, ph: 0 };
            }

            // Get recent readings for each sensor type
            const sensorTypeMap = {
                'Electrical Conductivity': 'ec',
                'Capacitive Soil Moisture': 'soilMoisture',
                'Digital Temperature': 'temperature',
                'Analog pH Sensor': 'ph'
            };

            const averages = { ec: 0, soilMoisture: 0, temperature: 0, ph: 0 };

            for (const [dbType, key] of Object.entries(sensorTypeMap)) {
                const typeSensors = sensors.filter(s => s.sensor_type === dbType);
                if (typeSensors.length > 0) {
                    const sensorIds = typeSensors.map(s => s.sensor_id);

                    const { data: readings } = await supabase
                        .from('sensor_data')
                        .select('value')
                        .in('sensor_id', sensorIds)
                        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                        .order('created_at', { ascending: false })
                        .limit(10);

                    if (readings && readings.length > 0) {
                        const average = readings.reduce((sum, r) => sum + r.value, 0) / readings.length;
                        averages[key as keyof typeof averages] = average;
                    }
                }
            }

            return averages;
        } catch (error) {
            console.error('Error calculating farm averages:', error);
            return { ec: 0, soilMoisture: 0, temperature: 0, ph: 0 };
        }
    };

    const getStatusColor = (value: number, type: string): string => {
        switch (type) {
            case 'ec':
                if (value < 1.0) return '#2196F3'; // Blue for low
                if (value > 1.8) return '#FF9800'; // Orange for high
                return '#4CAF50'; // Green for normal
            case 'soilMoisture':
                if (value < 40) return '#2196F3';
                if (value > 70) return '#FF9800';
                return '#4CAF50';
            case 'temperature':
                if (value < 20) return '#2196F3';
                if (value > 28) return '#FF9800';
                return '#4CAF50';
            case 'ph':
                if (value < 6.5) return '#2196F3';
                if (value > 7.5) return '#FF9800';
                return '#4CAF50';
            default:
                return '#666';
        }
    };

    const getStatusText = (value: number, type: string): string => {
        const color = getStatusColor(value, type);
        if (color === '#4CAF50') return 'Normal';
        if (color === '#FF9800') return 'High';
        return 'Low';
    };

    const formatValue = (value: number, type: string): string => {
        switch (type) {
            case 'ec':
                return `${value.toFixed(2)} mS/cm`;
            case 'soilMoisture':
                return `${value.toFixed(1)}%`;
            case 'temperature':
                return `${value.toFixed(1)}°C`;
            case 'ph':
                return `${value.toFixed(2)} pH`;
            default:
                return value.toFixed(1);
        }
    };

    const renderSensorPanel = (value: number, type: string, title: string, icon: string) => {
        const statusColor = getStatusColor(value, type);
        const statusText = getStatusText(value, type);

        return (
            <View style={[styles.sensorPanel, { backgroundColor: statusColor }]} key={type}>
                <View style={styles.panelHeader}>
                    <Text style={styles.panelIcon}>{icon}</Text>
                    <Text style={styles.panelTitle}>{title}</Text>
                </View>

                <View style={styles.currentValue}>
                    <Text style={styles.valueText}>
                        {formatValue(value, type)}
                    </Text>
                    <Text style={styles.statusText}>{statusText}</Text>
                </View>

                <Text style={styles.lastUpdate}>
                    24h Average
                </Text>
            </View>
        );
    };

    const renderFarmItem = ({ item }: { item: Farm }) => (
        <TouchableOpacity
            style={styles.farmCard}
            onPress={() => navigation.navigate('FarmDetails', { farmId: item.id })}
            activeOpacity={0.8}
        >
            <LinearGradient
                colors={['#ffffff', '#f8f9fa']}
                style={styles.farmCardGradient}
            >
                {/* Farm Header - Name and Location */}
                <View style={styles.farmHeader}>
                    <Text style={styles.farmName}>{item.name}</Text>
                    <Text style={styles.farmLocation}>📍 {item.location}</Text>
                </View>

                {/* Main Content Section - Weather and Sensors Side by Side */}
                <View style={styles.farmMainContent}>
                    {/* Weather Section - Left Side */}
                    <View style={styles.weatherContainer}>
                        <WeatherWidget
                            location={item.location}
                            compact={true}
                            onPress={() => navigation.navigate('FarmDetails', { farmId: item.id })}
                        />
                    </View>

                    {/* Sensor Grid - Right Side */}
                    <View style={styles.sensorContainer}>
                        <View style={styles.sensorGrid2x2}>
                            <View style={styles.sensorRow}>
                                {renderSensorPanel(item.averages.ec, 'ec', 'EC', '⚡')}
                                {renderSensorPanel(item.averages.soilMoisture, 'soilMoisture', 'Moisture', '💧')}
                            </View>
                            <View style={styles.sensorRow}>
                                {renderSensorPanel(item.averages.temperature, 'temperature', 'Temp', '🌡️')}
                                {renderSensorPanel(item.averages.ph, 'ph', 'pH', '⚗️')}
                            </View>
                        </View>
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );

    return (
        <LinearGradient
            colors={['#e7fbe8ff', '#cdffcfff']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.container}
        >
            {/* Top Header with Notification Bell */}
            <View style={styles.topHeader}>
                <View style={styles.headerLeft}>
                    <Text style={styles.welcomeText}>
                        {loading ? "Loading..." : `Hello ${username}!`}
                    </Text>
                    <Text style={styles.subtitleText}>Welcome to Smart Farming</Text>
                </View>

                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={styles.notificationButton}
                        onPress={() => navigation.navigate("Notification")}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="notifications" size={24} color="#2e7d32" />
                        <View style={styles.notificationBadge}>
                            <Text style={styles.notificationBadgeText}>3</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.profileButton}
                        onPress={() => navigation.navigate("Settings")}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="person-circle" size={32} color="#2e7d32" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                {/* Enhanced Farms List Section */}
                <View style={styles.farmsSection}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.titleWithCount}>
                            <Text style={styles.sectionTitle}>Your Farms</Text>
                            <View style={styles.farmCountBadge}>
                                <Text style={styles.farmCountText}>
                                    {farms.length}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.quickAddButton}
                            onPress={() => navigation.navigate("Farm", { showAddForm: true })}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="add" size={20} color="white" />
                            <Text style={styles.quickAddText}>Add Farm</Text>
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <Text style={styles.loadingText}>Loading farms...</Text>
                        </View>
                    ) : farms.length === 0 ? (
                        <View style={styles.noFarmsContainer}>
                            <View style={styles.emptyStateIcon}>
                                <Ionicons name="leaf-outline" size={64} color="#4CAF50" />
                            </View>
                            <Text style={styles.noFarmsTitle}>Start Your Smart Farming Journey</Text>
                            <Text style={styles.noFarmsText}>
                                You don't have access to any farms yet. Create your first farm to start monitoring.
                            </Text>
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={() => navigation.navigate("Farm", { showAddForm: true })}
                            >
                                <Ionicons name="add-circle" size={20} color="white" style={styles.buttonIcon} />
                                <Text style={styles.primaryButtonText}>Create Your First Farm</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            <FlatList
                                data={farms}
                                renderItem={renderFarmItem}
                                keyExtractor={(item) => item.id}
                                scrollEnabled={false}
                                showsVerticalScrollIndicator={false}
                            />

                            {/* End of List Indicator */}
                            <View style={styles.endOfListContainer}>
                                <View style={styles.endOfListDivider} />
                                <Text style={styles.endOfListText}>
                                    {farms.length === 1
                                        ? "You have 1 farm"
                                        : `All ${farms.length} farms displayed`}
                                </Text>
                                <View style={styles.endOfListDivider} />
                            </View>
                        </>
                    )}
                </View>
            </ScrollView>

            <BottomNavigation />
        </LinearGradient>
    );
};

export default Home;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(46, 125, 50, 0.1)',
    },
    headerLeft: {
        flex: 1,
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2e7d32',
        marginBottom: 4,
    },
    subtitleText: {
        fontSize: 14,
        color: '#666',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    notificationButton: {
        position: 'relative',
        padding: 8,
        marginRight: 12,
        backgroundColor: 'rgba(46, 125, 50, 0.1)',
        borderRadius: 20,
    },
    notificationBadge: {
        position: 'absolute',
        top: 2,
        right: 2,
        backgroundColor: '#f44336',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    profileButton: {
        padding: 4,
    },
    scrollViewContent: {
        paddingBottom: 100,
    },
    farmsSection: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    titleWithCount: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2e7d32',
        marginRight: 10,
    },
    farmCountBadge: {
        backgroundColor: '#4CAF50',
        borderRadius: 12,
        paddingVertical: 4,
        paddingHorizontal: 10,
        minWidth: 24,
        alignItems: 'center',
    },
    farmCountText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    quickAddButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4CAF50',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    quickAddText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
    },
    noFarmsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    emptyStateIcon: {
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderRadius: 50,
        padding: 20,
        marginBottom: 20,
    },
    noFarmsTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        textAlign: 'center',
    },
    noFarmsText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 30,
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4CAF50',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonIcon: {
        marginRight: 8,
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    farmCard: {
        marginBottom: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        overflow: 'hidden',
    },
    farmCardGradient: {
        padding: 20,
    },
    farmHeader: {
        marginBottom: 12,
        alignItems: 'center',
    },
    farmName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2e7d32',
        marginBottom: 4,
        textAlign: 'center',
    },
    farmLocation: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    farmMainContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    weatherContainer: {
        flex: 1,
        height: 138, // Exact height match with sensor grid
    },
    sensorContainer: {
        flex: 1,
        height: 138, // Exact height match with weather widget
    },
    weatherTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        textAlign: 'left',
    },
    sensorTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        textAlign: 'left',
    },
    sensorGrid2x2: {
        flexDirection: 'column',
        gap: 8,
        height: 138, // Total height: 65px + 8px + 65px = 138px
        justifyContent: 'space-between',
    },
    sensorRow: {
        flexDirection: 'row',
        gap: 8,
        height: 65, // Fixed height for each row
    },
    averagesContainer: {
        marginTop: 15,
    },
    averagesTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 15,
        textAlign: 'center',
    },
    sensorGridContainer: {
        gap: 12,
    },
    sensorGridRow: {
        flexDirection: 'row',
        gap: 12,
    },
    sensorPanel: {
        flex: 1,
         padding: 8,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3,
        height: 65,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden', // Ensure content doesn't spill out
    },
    panelHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        justifyContent: 'center',
    },
    panelIcon: {
        fontSize: 14,
        marginRight: 3,
    },
    panelTitle: {
        fontSize: 10,
        fontWeight: '600',
        color: 'white',
        textAlign: 'center',
    },
    currentValue: {
        alignItems: 'center',
        marginBottom: 3,
    },
    valueText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 1,
        textAlign: 'center',
        lineHeight: 14,
    },
    statusText: {
        fontSize: 8,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '500',
        textAlign: 'center',
        lineHeight: 10,
    },
    lastUpdate: {
        fontSize: 7,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        lineHeight: 8,
    },
    endOfListContainer: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    endOfListDivider: {
        width: 60,
        height: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        marginVertical: 10,
    },
    endOfListText: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
    },
});
