import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, ActivityIndicator, TextInput, Alert, Modal } from 'react-native'
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
interface Farm {
    id: string
    name: string
    location?: string
    address?: string // Add address field
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
    hasSensor: boolean // New field to track if sensor exists
    hasData: boolean   // New field to track if data exists
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
                    <Ionicons name={sensor.icon as any} size={14} color={!sensor.hasSensor ? '#999' : !sensor.hasData ? '#FF9800' : getStatusColor(sensor.status)} />
                    <Text style={[styles.sensorValue, { color: !sensor.hasSensor ? '#999' : !sensor.hasData ? '#FF9800' : getStatusColor(sensor.status) }]}>
                        {!sensor.hasSensor ? 'No sensor' : !sensor.hasData ? 'No data' : sensor.value.toFixed(1)}
                    </Text>
                </View>
                <Text style={styles.sensorName} numberOfLines={1}>{sensor.name}</Text>
                <Text style={styles.sensorUnit}>{sensor.unit}</Text>
            </View>
            {sensor.hasSensor && sensor.hasData && (
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(sensor.status) }]} />
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
                        <Text style={styles.farmName}>{item.farms.name}</Text>
                        <Text style={styles.farmLocation}>📍 {item.farms.location || 'No location set'}</Text>
                        {item.farms.address && (
                            <Text style={styles.farmAddress}>🏠 {item.farms.address}</Text>
                        )}
                        <Text style={styles.farmRole}>Your role: {item.farm_role}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#666" />
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
    // Only keep Farm Request Modal (remove redundant user requests modal)
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
            if (!error && data) {
                // Type assertion to fix the farms property structure
                setFarmsWithRoles(data as unknown as FarmWithRole[])
            }
        } catch (error) {
            console.error('Error fetching farms:', error)
        } finally {
            setLoading(false)
        }
    }
    const fetchSensorDataForFarm = async (farmId: string): Promise<SensorData[]> => {
        try {
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
                                hasData: true,
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
                                hasData: false,
                            })
                        }
                    } else {
                        // No sensor of this type found
                        sensorData.push({
                            type: dbType,
                            value: 0,
                            unit: config.unit,
                            status: 'normal',
                            icon: config.icon,
                            name: config.name,
                            hasSensor: false,
                            hasData: false,
                        })
                    }
                } catch (error) {
                    console.error(`Error fetching ${dbType} data:`, error)
                }
            }
            return sensorData
        } catch (error) {
            console.error('Error fetching sensor data:', error)
            return []
        }
    }
    const renderFarmCard = ({ item }: { item: FarmWithRole }) => (
        <FarmCard
            item={item}
            navigation={navigation}
            onFetchSensorData={fetchSensorDataForFarm}
        />
    )
    // Render end of list indicator
    const renderListFooter = () => {
        if (farmsWithRoles.length === 0) return null
        return (
            <View style={styles.listEndContainer}>
                <View style={styles.listEndIndicator}>
                    <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                    <Text style={styles.listEndText}>
                        End of farms ({farmsWithRoles.length} total)
                    </Text>
                </View>
            </View>
        )
    }
    // Render list header with count and request farm button
    const renderListHeader = () => {
        if (farmsWithRoles.length === 0) return null
        return (
            <View style={styles.listHeaderContainer}>
                <View style={styles.listHeaderRow}>
                    <Text style={styles.listHeaderText}>
                        Your Farms ({farmsWithRoles.length})
                    </Text>
                    <TouchableOpacity
                        style={styles.requestFarmButton}
                        onPress={() => setShowFarmRequestModal(true)}
                    >
                        <Ionicons name="add" size={18} color="#4CAF50" />
                        <Text style={styles.requestFarmButtonText}>Request Farm</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }
    const handleFarmRequestSuccess = () => {
        // Refresh farms list in case a pending request was approved
        fetchFarms()
    }
    // Add activity logging for farm operations
    const logFarmAction = async (action: string, farmData: any) => {
        try {
            switch (action) {
                case 'view':
                    await activityLogService.logActivity({
                        actionType: 'UPDATE',
                        tableName: 'farms',
                        recordId: farmData.id,
                        description: `Viewed farm "${farmData.name}"`
                    })
                    break
                case 'request':
                    // TODO: Implement logFarmRequest method
                    // await activityLogService.logFarmRequest(farmData)
                    break
            }
        } catch (error) {
            console.error('Error logging farm action:', error)
        }
    }
    // Simple greeting function
    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Good morning'
        if (hour < 18) return 'Good afternoon'
        return 'Good evening'
    }
    return (
        <LinearGradient
            colors={['#e7fbe8ff', '#cdffcfff']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.container}
        >
            {/* Header with shortened welcome message */}
            <LinearGradient
                colors={['#4A90E2', '#357ABD', '#2E5B8A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <Text style={styles.welcomeText}>Hi, {username || "Loading..."}!</Text>
                </View>
            </LinearGradient>
            {/* Farm Cards List - Remove redundant action buttons */}
            <View style={styles.content}>
                {farmsWithRoles.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="leaf-outline" size={64} color="#666" />
                        <Text style={styles.emptyTitle}>No farms found</Text>
                        <Text style={styles.emptySubtitle}>Request your first farm to get started</Text>
                        <TouchableOpacity
                            style={styles.addFarmButton}
                            onPress={() => setShowFarmRequestModal(true)}
                        >
                            <LinearGradient
                                colors={['#4CAF50', '#45a049', '#388e3c']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.addFarmButtonGradient}
                            >
                                <Ionicons name="add" size={24} color="white" />
                                <Text style={styles.addFarmButtonText}>Request Farm</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                        {/* Quick tip for navigation */}
                        <View style={styles.navigationTip}>
                            <Text style={styles.tipText}>
                                💡 Use the bottom navigation to access your requests and admin features
                            </Text>
                        </View>
                    </View>
                ) : (
                    <>
                        {/* Farms List - Remove action buttons container */}
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#4CAF50" />
                                <Text style={styles.loadingText}>Loading your farms...</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={farmsWithRoles}
                                renderItem={renderFarmCard}
                                keyExtractor={(item) => item.id}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.farmsList}
                                ListHeaderComponent={renderListHeader}
                                ListFooterComponent={renderListFooter}
                                refreshing={loading}
                                onRefresh={fetchFarms}
                            />
                        )}
                    </>
                )}
            </View>
            {/* Only keep Farm Request Modal - Remove redundant UserFarmRequests modal */}
            <Modal
                visible={showFarmRequestModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowFarmRequestModal(false)}
            >
                <CreateFarmRequest
                    onClose={() => setShowFarmRequestModal(false)}
                    onSuccess={handleFarmRequestSuccess}
                />
            </Modal>
            <BottomNavigation />
        </LinearGradient>
    )
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    headerContent: {
        flex: 1,
    },
    welcomeText: {
        fontSize: 20,
        color: 'white',
        fontWeight: 'bold',
    },
    usernameText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerActionButton: {
        padding: 10,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    // Empty state styles
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 20,
        marginBottom: 10,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 24,
    },
    addFarmButton: {
        borderRadius: 25,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    addFarmButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 25,
    },
    addFarmButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    // Action buttons styles
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        flexWrap: 'wrap',
        gap: 10,
    },
    actionButton: {
        flex: 1,
        minWidth: 100,
        borderRadius: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    actionButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 15,
    },
    actionButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    // Loading styles
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    // List styles
    farmsList: {
        paddingBottom: 20,
    },
    listHeaderContainer: {
        marginBottom: 15,
    },
    listHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    listHeaderText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    requestFarmButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
    },
    requestFarmButtonText: {
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: '600',
        marginLeft: 4,
    },
    listEndContainer: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    listEndIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderRadius: 20,
    },
    listEndText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: '500',
    },
    // Farm card styles
    farmCard: {
        marginBottom: 16,
        borderRadius: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    farmCardGradient: {
        borderRadius: 16,
        padding: 16,
    },
    farmHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    farmInfo: {
        flex: 1,
    },
    farmName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    farmLocation: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    farmAddress: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    farmRole: {
        fontSize: 12,
        color: '#4CAF50',
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    // Data container styles
    dataContainer: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
    },
    weatherSide: {
        flex: 1,
    },
    sensorSide: {
        flex: 1,
    },
    weatherSectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    sensorSectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    // Sensor grid styles
    sensorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        justifyContent: 'space-between',
    },
    sensorPanel: {
        width: '48%',
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 8,
        position: 'relative',
        borderWidth: 1,
        borderColor: '#e9ecef',
        minHeight: 60,
    },
    sensorContent: {
        flex: 1,
    },
    sensorIconValue: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    sensorValue: {
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    sensorName: {
        fontSize: 10,
        fontWeight: '600',
        color: '#333',
        marginBottom: 1,
    },
    sensorUnit: {
        fontSize: 9,
        color: '#666',
    },
    statusDot: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    sensorLoadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    sensorLoadingText: {
        marginLeft: 8,
        fontSize: 12,
        color: '#666',
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '90%',
        maxHeight: '80%',
        borderRadius: 16,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    closeButton: {
        padding: 4,
    },
    modalContent: {
        padding: 20,
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    required: {
        color: '#FF0000',
        fontSize: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    notesInput: {
        height: 80,
        textAlignVertical: 'top',
    },
    provinceSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
    },
    provinceSelectorText: {
        fontSize: 16,
        color: '#333',
    },
    placeholderText: {
        color: '#999',
    },
    createFarmButton: {
        marginTop: 20,
        borderRadius: 12,
        overflow: 'hidden',
    },
    createFarmButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 32,
    },
    createFarmButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    provinceList: {
        flex: 1,
    },
    provinceItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    provinceInfo: {
        flex: 1,
    },
    provinceName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    provinceNameEn: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    regionBadge: {
        backgroundColor: '#e3f2fd',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    regionText: {
        fontSize: 12,
        color: '#1976d2',
        fontWeight: '500',
    },
    navigationTip: {
        marginTop: 30,
        padding: 15,
        backgroundColor: 'rgba(74, 144, 226, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(74, 144, 226, 0.2)',
    },
    tipText: {
        fontSize: 14,
        color: '#4A90E2',
        textAlign: 'center',
        lineHeight: 20,
    },
})
export default Home
