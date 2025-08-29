import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import WeatherWidget from '../components/WeatherWidget';
import AccountImage from '../assets/images/account/background_account.png';
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
            <View style={styles.sensorPanel} key={type}>
                <LinearGradient
                    colors={['#ffffff', '#f8f9fa']}
                    style={styles.panelGradient}
                >
                    <View style={styles.panelHeader}>
                        <Text style={styles.panelIcon}>{icon}</Text>
                        <Text style={styles.panelTitle}>{title}</Text>
                    </View>

                    <View style={styles.currentValue}>
                        <Text style={styles.valueText}>
                            {formatValue(value, type)}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                            <Text style={styles.statusBadgeText}>{statusText}</Text>
                        </View>
                    </View>

                    <Text style={styles.lastUpdate}>
                        24h Average Reading
                    </Text>
                </LinearGradient>
            </View>
        );
    };

    const renderFarmItem = ({ item }: { item: Farm }) => (
        <TouchableOpacity
            style={styles.farmCard}
            onPress={() => navigation.navigate('FarmDetails', { farmId: item.id })}
            activeOpacity={0.8}
        >
            <View style={styles.farmHeader}>
                <Text style={styles.farmName}>{item.name}</Text>
                <Text style={styles.farmLocation}>📍 {item.location}</Text>
            </View>

            {/* Weather widget for each farm */}
            <WeatherWidget
                location={item.location}
                compact={true}
                onPress={() => navigation.navigate('FarmDetails', { farmId: item.id })}
            />

            <View style={styles.averagesContainer}>
                <Text style={styles.averagesTitle}>Average Points (24h)</Text>
                <Text style={styles.averagesSubtitle}>Sensor readings averaged over the last 24 hours</Text>

                <View style={styles.sensorGridContainer}>
                    <View style={styles.sensorGridRow}>
                        {renderSensorPanel(item.averages.ec, 'ec', 'EC', '⚡')}
                        {renderSensorPanel(item.averages.soilMoisture, 'soilMoisture', 'Soil Moisture', '💧')}
                    </View>
                    <View style={styles.sensorGridRow}>
                        {renderSensorPanel(item.averages.temperature, 'temperature', 'Temperature', '🌡️')}
                        {renderSensorPanel(item.averages.ph, 'ph', 'pH Level', '⚗️')}
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <LinearGradient
            colors={['#e7fbe8ff', '#cdffcfff']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                <ImageBackground
                    source={AccountImage}
                    style={styles.headerBackground}
                    imageStyle={styles.headerImageStyle}
                >
                    <View style={styles.headerTop}>
                        <Text style={styles.usernameText}>
                            {loading ? "Loading..." : `Hello ${username},`}
                        </Text>
                        <TouchableOpacity
                            style={styles.profileIconContainer}
                            onPress={() => navigation.navigate("Notification")}
                        >
                            <Ionicons name="notifications" size={28} color="white" style={styles.icon} />
                        </TouchableOpacity>
                    </View>
                </ImageBackground>

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
                                You don't have access to any farms yet. Browse available farms or create your first farm to start monitoring.
                            </Text>
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={() => navigation.navigate("Farm", { showAddForm: true })}
                            >
                                <Ionicons name="add-circle" size={20} color="white" style={styles.buttonIcon} />
                                <Text style={styles.primaryButtonText}>Browse & Add Farms</Text>
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
                                        ? "That's your only farm"
                                        : `That's all ${farms.length} of your farms`}
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
}

export default Home;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#cdffcfff',
        paddingBottom: 70,
    },
    scrollViewContent: {
        paddingBottom: 20,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 20,
        paddingTop: 50,
    },
    headerBackground: {
        width: '100%',
        paddingBottom: 30,
        backgroundColor: 'rgba(14, 89, 14, 1)',
        justifyContent: 'center',
        alignItems: 'flex-start',
        borderBottomEndRadius: 20,
    },
    headerImageStyle: {
        resizeMode: 'cover',
    },
    usernameText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
    },
    icon: {
        marginHorizontal: 10,
    },
    profileIconContainer: {
    },
    farmsSection: {
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: 15,
    },
    titleWithCount: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginRight: 8,
    },
    farmCountBadge: {
        backgroundColor: '#4CAF50',
        borderRadius: 15,
        paddingVertical: 4,
        paddingHorizontal: 10,
        minWidth: 30,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    farmCountText: {
        fontSize: 14,
        color: 'white',
        fontWeight: 'bold',
    },
    quickAddButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4CAF50',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    quickAddText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 5,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        paddingVertical: 40,
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
    },
    noFarmsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        paddingVertical: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 12,
        marginTop: 10,
    },
    emptyStateIcon: {
        marginBottom: 15,
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderRadius: 40,
        padding: 20,
    },
    noFarmsTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 10,
        textAlign: 'center',
    },
    noFarmsText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 20,
        lineHeight: 20,
    },
    primaryButton: {
        marginTop: 20,
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: '#4CAF50',
        borderRadius: 25,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    buttonIcon: {
        marginRight: 8,
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    farmCard: {
        width: '100%',
        backgroundColor: 'white',
        borderRadius: 15,
        elevation: 5,
        marginBottom: 15,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
    },
    farmHeader: {
        backgroundColor: 'rgba(14, 89, 14, 1)',
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    farmName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
    },
    farmLocation: {
        fontSize: 14,
        color: '#e0e0e0',
        marginTop: 5,
        textAlign: 'center',
    },
    averagesContainer: {
        padding: 15,
    },
    averagesTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 5,
    },
    averagesSubtitle: {
        fontSize: 12,
        color: '#666',
        marginBottom: 15,
    },
    sensorGridContainer: {
        width: '100%',
        flexDirection: 'column',
        justifyContent: 'center',
    },
    sensorGridRow: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    sensorPanel: {
        width: '48%',
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    panelGradient: {
        flex: 1,
        padding: 10,
    },
    panelHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    panelIcon: {
        fontSize: 18,
        marginRight: 8,
        color: '#4CAF50',
    },
    panelTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    currentValue: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    valueText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    statusBadge: {
        borderRadius: 12,
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    statusBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    lastUpdate: {
        fontSize: 12,
    },
    endOfListContainer: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 10,
        marginTop: 10,
    },
    endOfListDivider: {
        height: 1,
        width: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        marginVertical: 10,
    },
    endOfListText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    headerWeatherContainer: {
        paddingHorizontal: 20,
        paddingTop: 20,
        width: '100%',
    },
});
