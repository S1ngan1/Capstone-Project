import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, ActivityIndicator, TextInput, Alert, Modal, Dimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, NavigationProp } from "@react-navigation/native"
import BottomNavigation from '../components/BottomNavigation'
import WeatherWidget from '../components/WeatherWidget'
import CreateFarmRequest from '../components/CreateFarmRequest'
import { useAuthContext } from '../context/AuthContext'
import { useFarmRequests } from '../hooks/useFarmRequests'
import { supabase } from '../lib/supabase'
import { RootStackParamList } from '../App'
import { activityLogService } from '../utils/activityLogService'

const { width, height } = Dimensions.get('window')

// Responsive calculations
const isSmallDevice = width < 350 || height < 600
const isMediumDevice = width < 400 || height < 700
const responsivePadding = isSmallDevice ? 12 : 16
const responsiveMargin = isSmallDevice ? 8 : 12
const responsiveFontSize = {
  title: isSmallDevice ? 18 : isMediumDevice ? 20 : 22,
  farmName: isSmallDevice ? 16 : 18,
  location: isSmallDevice ? 12 : 14,
  sensorValue: isSmallDevice ? 12 : 14,
  sensorName: isSmallDevice ? 10 : 12,
}

interface Farm {
    id: string
    name: string
    location?: string
    address?: string
}

interface FarmWithRole {
    id: string
    farm_id: string
    user_id: string
    farm_role: string
    farms: Farm
}

interface SensorData {
    type: string
    value: number
    unit: string
    status: 'normal' | 'warning' | 'critical'
    icon: string
    name: string
    hasSensor: boolean
    hasData: boolean
}

// Separate component for farm cards to properly handle hooks
const FarmCard: React.FC<{
    item: FarmWithRole
    navigation: any
    onFetchSensorData: (farmId: string) => Promise<SensorData[]>
}> = ({ item, navigation, onFetchSensorData }) => {
    const [farmSensorData, setFarmSensorData] = useState<SensorData[]>([])
    const [sensorLoading, setSensorLoading] = useState(true)

    useEffect(() => {
        const loadSensorData = async () => {
            setSensorLoading(true)
            try {
                const data = await onFetchSensorData(item.farm_id)
                setFarmSensorData(data)
            } catch (error) {
                console.error('Error loading sensor data:', error)
                setFarmSensorData([])
            } finally {
                setSensorLoading(false)
            }
        }
        loadSensorData()
    }, [item.farm_id, onFetchSensorData])

    const getStatusColor = (status: string): string => {
        switch (status) {
            case 'normal': return '#4CAF50'
            case 'warning': return '#FF9800'
            case 'critical': return '#F44336'
            default: return '#666'
        }
    }

    const renderSensorPanel = (sensor: SensorData) => (
        <View key={sensor.type} style={styles.sensorPanel}>
            <View style={styles.sensorContent}>
                <View style={styles.sensorIconValue}>
                    <Ionicons
                        name={sensor.icon as any}
                        size={isSmallDevice ? 12 : 14}
                        color={!sensor.hasSensor ? '#999' : !sensor.hasData ? '#FF9800' : getStatusColor(sensor.status)}
                    />
                    <Text style={[
                        styles.sensorValue,
                        {
                            color: !sensor.hasSensor ? '#999' : !sensor.hasData ? '#FF9800' : getStatusColor(sensor.status),
                            fontSize: responsiveFontSize.sensorValue
                        }
                    ]}>
                        {!sensor.hasSensor ? 'No sensor' : !sensor.hasData ? 'No data' : sensor.value.toFixed(1)}
                    </Text>
                </View>
                <Text style={[styles.sensorName, { fontSize: responsiveFontSize.sensorName }]} numberOfLines={1}>
                    {sensor.name}
                </Text>
                <Text style={[styles.sensorUnit, { fontSize: responsiveFontSize.sensorName }]}>
                    {sensor.unit}
                </Text>
            </View>
            {sensor.hasSensor && sensor.hasData && (
                <View style={[styles.statusDot, {
                    backgroundColor: getStatusColor(sensor.status),
                    width: isSmallDevice ? 6 : 8,
                    height: isSmallDevice ? 6 : 8,
                    borderRadius: isSmallDevice ? 3 : 4,
                }]} />
            )}
        </View>
    )

    return (
        <TouchableOpacity
            style={styles.farmCard}
            onPress={() => navigation.navigate('FarmDetails', { farmId: item.farm_id })}
            activeOpacity={0.8}
        >
            <LinearGradient
                colors={['#ffffff', '#f8f9fa']}
                style={styles.farmCardGradient}
            >
                {/* Farm Header */}
                <View style={styles.farmHeader}>
                    <View style={styles.farmInfo}>
                        <Text style={[styles.farmName, { fontSize: responsiveFontSize.farmName }]}>
                            {item.farms.name}
                        </Text>
                        <Text style={[styles.farmLocation, { fontSize: responsiveFontSize.location }]}>
                            📍 {item.farms.location || 'No location set'}
                        </Text>
                        {item.farms.address && (
                            <Text style={[styles.farmAddress, { fontSize: responsiveFontSize.location }]}>
                                🏠 {item.farms.address}
                            </Text>
                        )}
                    </View>
                    <View style={styles.farmRole}>
                        <Text style={[styles.roleText, { fontSize: responsiveFontSize.location }]}>
                            {item.farm_role}
                        </Text>
                    </View>
                </View>
                {/* Weather Widget and Sensor Data - Side by Side Layout */}
                <View style={styles.dataContainer}>
                    {/* Weather Widget - Left Side */}
                    {item.farms.location && (
                        <View style={styles.weatherSide}>
                            <Text style={styles.weatherSectionTitle}>🌤️ Weather</Text>
                            <WeatherWidget
                                location={item.farms.location}
                                compact={true}
                            />
                        </View>
                    )}
                    {/* Sensor Data Grid - Right Side */}
                    <View style={styles.sensorSide}>
                        <Text style={styles.sensorSectionTitle}>📊 Sensors</Text>
                        {sensorLoading ? (
                            <View style={styles.sensorLoadingContainer}>
                                <ActivityIndicator size="small" color="#4CAF50" />
                                <Text style={styles.sensorLoadingText}>Loading...</Text>
                            </View>
                        ) : (
                            <View style={styles.sensorGrid}>
                                {farmSensorData.map(sensor => renderSensorPanel(sensor))}
                            </View>
                        )}
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    )
}

const Home = () => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>()
    const { user } = useAuthContext()
    const { session } = useAuthContext()
    const { userRole: farmUserRole, fetchUserRole } = useFarmRequests()
    const [username, setUsername] = useState<string>("")
    const [farmsWithRoles, setFarmsWithRoles] = useState<FarmWithRole[]>([])
    const [loading, setLoading] = useState(true)
    const [showFarmRequestModal, setShowFarmRequestModal] = useState(false)

    useEffect(() => {
        const fetchUserData = async () => {
            if (session?.user?.id) {
                // Fetch username and user role
                const { data: profileData, error: profileError } = await supabase
                    .from("profiles")
                    .select("username, role")
                    .eq("id", session.user.id)
                    .single()
                if (!profileError && profileData) {
                    setUsername(profileData.username)
                }
                // Fetch user role using the hook
                await fetchUserRole()
                // Fetch farms
                await fetchFarms()
            }
        }
        fetchUserData()
    }, [session])

    const fetchFarms = async () => {
        if (!session?.user?.id) {
            setLoading(false)
            return
        }
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('farm_users')
                .select(`
                    id,
                    farm_id,
                    user_id,
                    farm_role,
                    farms!inner (
                        id,
                        name,
                        location,
                        address
                    )
                `)
                .eq('user_id', session.user.id)
                .order('id', { ascending: false })

            if (error) throw error

            // Sort by farm name on the client side
            const sortedData = (data || []).sort((a, b) => {
                const nameA = a.farms?.name?.toLowerCase() || ''
                const nameB = b.farms?.name?.toLowerCase() || ''
                return nameA.localeCompare(nameB)
            })

            setFarmsWithRoles(sortedData)
        } catch (error) {
            console.error('Error fetching farms:', error)
            setFarmsWithRoles([])
        } finally {
            setLoading(false)
        }
    }

    const fetchSensorDataForFarm = async (farmId: string): Promise<SensorData[]> => {
        try {
            // Define sensor configuration locally
            const sensorTypeMap: { [key: string]: { name: string, icon: string, unit: string } } = {
                'Electrical Conductivity': { name: 'EC Level', icon: 'flash', unit: 'mS/cm' },
                'Analog pH Sensor': { name: 'pH Level', icon: 'water', unit: 'pH' },
                'Capacitive Soil Moisture': { name: 'Soil Moisture', icon: 'leaf', unit: '%' },
                'Digital Temperature': { name: 'Temperature', icon: 'thermometer', unit: '°C' }
            }

            const sensorData: SensorData[] = []

            for (const [dbType, config] of Object.entries(sensorTypeMap)) {
                try {
                    // Get sensors of this type for this farm
                    const { data: sensors, error: sensorError } = await supabase
                        .from('sensor')
                        .select('sensor_id')
                        .eq('sensor_type', dbType)
                        .eq('farm_id', farmId)

                    if (!sensorError && sensors && sensors.length > 0) {
                        const sensorIds = sensors.map(s => s.sensor_id)

                        // Get latest reading
                        const { data: readings, error: readingError } = await supabase
                            .from('sensor_data')
                            .select('value')
                            .in('sensor_id', sensorIds)
                            .order('created_at', { ascending: false })
                            .limit(1)

                        if (!readingError && readings && readings.length > 0) {
                            const value = readings[0].value
                            let status: 'normal' | 'warning' | 'critical' = 'normal'

                            // Determine status based on sensor type and value
                            if (dbType === 'Electrical Conductivity') {
                                if (value < 1.0 || value > 1.8) status = value < 0.5 ? 'critical' : 'warning'
                            } else if (dbType === 'Analog pH Sensor') {
                                if (value < 6.0 || value > 8.0) status = value < 5.5 || value > 8.5 ? 'critical' : 'warning'
                            } else if (dbType === 'Capacitive Soil Moisture') {
                                if (value < 30 || value > 80) status = value < 20 ? 'critical' : 'warning'
                            } else if (dbType === 'Digital Temperature') {
                                if (value < 15 || value > 35) status = value < 10 || value > 40 ? 'critical' : 'warning'
                            }

                            sensorData.push({
                                type: dbType,
                                value: value,
                                unit: config.unit,
                                status: status,
                                icon: config.icon,
                                name: config.name,
                                hasSensor: true,
                                hasData: true
                            })
                        } else {
                            // Sensor exists but no data
                            sensorData.push({
                                type: dbType,
                                value: 0,
                                unit: config.unit,
                                status: 'normal',
                                icon: config.icon,
                                name: config.name,
                                hasSensor: true,
                                hasData: false
                            })
                        }
                    } else {
                        // No sensor of this type
                        sensorData.push({
                            type: dbType,
                            value: 0,
                            unit: config.unit,
                            status: 'normal',
                            icon: config.icon,
                            name: config.name,
                            hasSensor: false,
                            hasData: false
                        })
                    }
                } catch (error) {
                    console.error(`Error checking sensors for ${dbType}:`, error)
                    // Add default sensor data on error
                    sensorData.push({
                        type: dbType,
                        value: 0,
                        unit: config.unit,
                        status: 'normal',
                        icon: config.icon,
                        name: config.name,
                        hasSensor: false,
                        hasData: false
                    })
                }
            }

            return sensorData
        } catch (error) {
            console.error('Error fetching sensor data:', error)
            // Return default sensor data on error
            return [
                { type: 'Electrical Conductivity', value: 0, unit: 'mS/cm', status: 'normal', icon: 'flash', name: 'EC Level', hasSensor: false, hasData: false },
                { type: 'Analog pH Sensor', value: 0, unit: 'pH', status: 'normal', icon: 'water', name: 'pH Level', hasSensor: false, hasData: false },
                { type: 'Capacitive Soil Moisture', value: 0, unit: '%', status: 'normal', icon: 'leaf', name: 'Soil Moisture', hasSensor: false, hasData: false },
                { type: 'Digital Temperature', value: 0, unit: '°C', status: 'normal', icon: 'thermometer', name: 'Temperature', hasSensor: false, hasData: false }
            ]
        }
    }

    const handleCreateFarmRequest = () => {
        setShowFarmRequestModal(true)
    }

    const handleFarmRequestSubmit = async () => {
        setShowFarmRequestModal(false)
        // Refresh farms after request is submitted
        await fetchFarms()
    }

    if (loading) {
        return (
            <View style={styles.container}>
                <LinearGradient
                    colors={['#4CAF50', '#45A049']}
                    style={styles.headerGradient}
                >
                    <View style={styles.header}>
                        <Text style={[styles.greeting, { fontSize: responsiveFontSize.title }]}>
                            Welcome back!
                        </Text>
                        <Text style={styles.subGreeting}>Loading your farms...</Text>
                    </View>
                </LinearGradient>

                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                    <Text style={styles.loadingText}>Loading farms...</Text>
                </View>

                <BottomNavigation />
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <LinearGradient
                    colors={['#4CAF50', '#45A049']}
                    style={styles.headerGradient}
                >
                    <View style={styles.header}>
                        <Text style={[styles.greeting, { fontSize: responsiveFontSize.title }]}>
                            Hello, {username || 'Farmer'}! 👋
                        </Text>
                        <Text style={styles.subGreeting}>
                            {farmsWithRoles.length === 0
                                ? "Ready to add your first farm?"
                                : `Managing ${farmsWithRoles.length} farm${farmsWithRoles.length !== 1 ? 's' : ''}`
                            }
                        </Text>
                    </View>
                </LinearGradient>

                <View style={styles.content}>
                    {farmsWithRoles.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="leaf-outline" size={80} color="#4CAF50" />
                            <Text style={styles.emptyTitle}>No Farms Yet</Text>
                            <Text style={styles.emptyDescription}>
                                Start your smart farming journey by adding your first farm!
                            </Text>
                            <TouchableOpacity
                                style={styles.addFirstFarmButton}
                                onPress={handleCreateFarmRequest}
                            >
                                <LinearGradient
                                    colors={['#4CAF50', '#45A049']}
                                    style={styles.addButtonGradient}
                                >
                                    <Ionicons name="add-circle-outline" size={24} color="#fff" />
                                    <Text style={styles.addButtonText}>Add Your First Farm</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            <View style={styles.sectionHeader}>
                                <Text style={[styles.sectionTitle, { fontSize: responsiveFontSize.title }]}>
                                    Your Farms
                                </Text>
                                <TouchableOpacity
                                    style={styles.addFarmButton}
                                    onPress={handleCreateFarmRequest}
                                >
                                    <Ionicons name="add-circle-outline" size={24} color="#4CAF50" />
                                </TouchableOpacity>
                            </View>

                            <FlatList
                                data={farmsWithRoles}
                                renderItem={({ item }) => (
                                    <FarmCard
                                        item={item}
                                        navigation={navigation}
                                        onFetchSensorData={fetchSensorDataForFarm}
                                    />
                                )}
                                keyExtractor={(item) => item.id}
                                scrollEnabled={false}
                                showsVerticalScrollIndicator={false}
                            />
                        </>
                    )}
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>

            <BottomNavigation />

            {/* Farm Request Modal */}
            <Modal
                visible={showFarmRequestModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowFarmRequestModal(false)}
            >
                <CreateFarmRequest
                    onClose={() => setShowFarmRequestModal(false)}
                    onSubmit={handleFarmRequestSubmit}
                />
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    headerGradient: {
        paddingTop: 35, // Reduced from 50
        paddingBottom: 12, // Reduced from 20
        paddingHorizontal: responsivePadding,
    },
    header: {
        alignItems: 'center',
    },
    greeting: {
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
    },
    subGreeting: {
        fontSize: responsiveFontSize.location,
        color: '#fff',
        opacity: 0.9,
        textAlign: 'center',
    },
    content: {
        paddingHorizontal: responsivePadding,
        paddingTop: responsiveMargin,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: responsiveMargin,
    },
    sectionTitle: {
        fontWeight: 'bold',
        color: '#333',
    },
    addFarmButton: {
        padding: 8,
        backgroundColor: '#fff',
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    farmCard: {
        marginBottom: responsiveMargin,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    farmCardGradient: {
        borderRadius: 12,
        padding: responsivePadding,
    },
    farmHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: responsiveMargin,
    },
    farmInfo: {
        flex: 1,
    },
    farmName: {
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    farmLocation: {
        color: '#666',
        marginBottom: 2,
    },
    farmAddress: {
        color: '#666',
    },
    farmRole: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    roleText: {
        color: '#fff',
        fontWeight: '600',
    },
    dataContainer: {
        flexDirection: 'row',
        gap: responsiveMargin,
        minHeight: 140, // Base height for calculation
        alignItems: 'stretch', // FIXED: Ensure both sides stretch to full height
    },
    weatherSide: {
        flex: 1,
        minHeight: 140, // FIXED: Calculate based on sensor panel total area
        maxHeight: 140, // FIXED: Prevent expansion
    },
    sensorSide: {
        flex: 1,
        minHeight: 140, // FIXED: Match weather side exactly
        maxHeight: 140, // FIXED: Prevent expansion
    },
    weatherSectionTitle: {
        fontSize: responsiveFontSize.sensorName,
        fontWeight: '600',
        color: '#333',
        marginBottom: 6, // FIXED: Reduced margin to save space
    },
    sensorSectionTitle: {
        fontSize: responsiveFontSize.sensorName,
        fontWeight: '600',
        color: '#333',
        marginBottom: 6, // FIXED: Match weather section
    },
    sensorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: isSmallDevice ? 4 : 6,
        flex: 1, // FIXED: Fill available space
        justifyContent: 'space-between', // FIXED: Even distribution
        alignContent: 'flex-start', // FIXED: Align to top
        height: isSmallDevice ? 110 : 120, // FIXED: Specific height for 2x2 grid
    },
    sensorPanel: {
        width: isSmallDevice ? '47%' : '47%', // FIXED: Exact width for 2x2 grid with gap
        height: isSmallDevice ? 50 : 55, // FIXED: Specific height for consistent sizing
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: isSmallDevice ? 4 : 6, // FIXED: Reduced padding for better fit
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        borderWidth: 1,
        borderColor: '#e9ecef',
        marginBottom: isSmallDevice ? 4 : 6, // FIXED: Spacing between rows
    },
    sensorContent: {
        alignItems: 'center',
        width: '100%',
    },
    sensorIconValue: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        gap: 4,
    },
    sensorValue: {
        fontWeight: 'bold',
    },
    sensorName: {
        color: '#666',
        textAlign: 'center',
        fontWeight: '500',
    },
    sensorUnit: {
        color: '#999',
        textAlign: 'center',
    },
    statusDot: {
        position: 'absolute',
        top: 4,
        right: 4,
    },
    sensorLoadingContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    sensorLoadingText: {
        fontSize: responsiveFontSize.sensorName,
        color: '#666',
        marginTop: 8,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 20,
        marginBottom: 12,
    },
    emptyDescription: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 30,
    },
    addFirstFarmButton: {
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    addButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        gap: 8,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    bottomSpacer: {
        height: 100,
    },
})

export default Home
