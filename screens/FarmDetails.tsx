import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, FlatList } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { useAuthContext } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import SensorDataTable from '../components/Charts/SensorDataTable'
import WeatherWidget from '../components/WeatherWidget'
import { AISuggestionBox } from '../components/AISuggestionBox'
import BottomNavigation from '../components/BottomNavigation'
import FarmSettingsModal from '../components/FarmSettingsModal'
import CreateSensorRequest from '../components/CreateSensorRequest'
// Types
interface Farm {
  id: string
  name: string
  location: string
  address?: string // Add address field for detailed location
  notes?: string // Add notes field for farm description
}
interface FarmUser {
  id: string
  user_id: string
  farm_role: string // Changed from 'role' to 'farm_role'
  profiles: {
    username: string
    email: string
    role: string // Add application-level role
  }
}
interface Sensor {
  id: string
  name: string
  type: string
  status: 'active' | 'inactive' | 'maintenance'
  last_reading: number
  unit: string
  updated_at: string
  farm_id: string
  location?: string
}
interface SensorData {
  id: string
  sensor_id: string
  value: number
  timestamp: string
  sensors: {
    id: string
    name: string
    type: string
    status: string
    unit: string
    farm_id: string
    location?: string
  }
}
type RootStackParamList = {
  FarmDetails: { farmId: string }
}
type FarmDetailsRouteProp = RouteProp<RootStackParamList, 'FarmDetails'>
const FarmDetails = () => {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const route = useRoute<FarmDetailsRouteProp>()
  const { session } = useAuthContext()
  const { farmId } = route.params
  const [farm, setFarm] = useState<Farm | null>(null)
  const [farmUsers, setFarmUsers] = useState<FarmUser[]>([])
  const [sensors, setSensors] = useState<Sensor[]>([])
  const [userRole, setUserRole] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showCreateSensorModal, setShowCreateSensorModal] = useState(false)
  useEffect(() => {
    fetchFarmDetails()
  }, [farmId, session])
  const fetchFarmDetails = async () => {
    if (!session?.user?.id || !farmId) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      // Fetch farm details including notes and address
      const { data: farmData, error: farmError } = await supabase
        .from('farms')
        .select('id, name, location, address, notes')
        .eq('id', farmId)
        .single()
      if (!farmError && farmData) {
        setFarm(farmData)
      }
      // Fetch current user's farm role for this farm
      const { data: userRoleData, error: roleError } = await supabase
        .from('farm_users')
        .select('farm_role')
        .eq('farm_id', farmId)
        .eq('user_id', session.user.id)
        .single()
      if (!roleError && userRoleData) {
        setUserRole(userRoleData.farm_role)
      }
      // Fetch all users for this farm with updated schema
      const { data: usersData, error: usersError } = await supabase
        .from('farm_users')
        .select(`
          id,
          user_id,
          farm_role,
          profiles!inner (
            username,
            email,
            role
          )
        `)
        .eq('farm_id', farmId)
      if (!usersError && usersData) {
        setFarmUsers(usersData)
      }
      // Fetch real sensors from sensor table with correct column names
      console.log('Fetching sensors for farm:', farmId)
      const { data: sensorTableData, error: sensorTableError } = await supabase
        .from('sensor')
        .select(`
          sensor_id,
          sensor_name,
          sensor_type,
          status,
          units,
          farm_id,
          model,
          calibration_date,
          notes
        `)
        .eq('farm_id', farmId)
      if (!sensorTableError && sensorTableData && sensorTableData.length > 0) {
        console.log('Found real sensors:', sensorTableData)
        // Get latest readings for each sensor from sensor_data table
        const sensorsWithReadings: Sensor[] = []
        for (const sensor of sensorTableData) {
          // Skip sensors that don't have a valid sensor_id
          if (!sensor.sensor_id) {
            console.warn('Skipping sensor with missing sensor_id:', sensor)
            continue
          }

          // Fetch latest reading for this sensor
          const { data: latestReading, error: readingError } = await supabase
            .from('sensor_data')
            .select('value, created_at')
            .eq('sensor_id', sensor.sensor_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          sensorsWithReadings.push({
            id: sensor.sensor_id, // This is now guaranteed to exist
            name: sensor.sensor_name || 'Unknown Sensor',
            type: sensor.sensor_type || 'unknown',
            status: (sensor.status as 'active' | 'inactive' | 'maintenance') || 'active',
            last_reading: latestReading?.value || 0,
            unit: sensor.units || '',
            updated_at: latestReading?.created_at || sensor.calibration_date || new Date().toISOString(),
            farm_id: sensor.farm_id,
            location: sensor.notes || 'Farm Location',
          })
        }
        setSensors(sensorsWithReadings)
        console.log('Processed sensors with readings:', sensorsWithReadings)
      } else {
        console.error('Error fetching sensors or no sensors found:', sensorTableError)
        setSensors([])
      }
    } catch (error) {
      console.error('Error fetching farm details:', error)
      setSensors([])
    } finally {
      setLoading(false)
    }
  }
  const renderUserItem = ({ item }: { item: FarmUser }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => navigation.navigate('UserDetail', { userId: item.user_id })}
      activeOpacity={0.8}
    >
      <View style={styles.userInfo}>
        <View style={styles.userAvatar}>
          <Ionicons name="person" size={24} color="#4CAF50" />
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.profiles.username}</Text>
          <Text style={styles.userEmail}>{item.profiles.email}</Text>
          <Text style={styles.appRoleText}>
            App Role: {item.profiles.role?.replace('_', ' ').toUpperCase() || 'NORMAL USER'}
          </Text>
        </View>
      </View>
      <View style={styles.roleContainer}>
        <Text style={[styles.roleText, getFarmRoleStyle(item.farm_role)]}>
          {item.farm_role.charAt(0).toUpperCase() + item.farm_role.slice(1)}
        </Text>
      </View>
    </TouchableOpacity>
  )
  const renderSensorItem = ({ item }: { item: Sensor }) => (
    <TouchableOpacity
      style={styles.sensorCard}
      onPress={() => {
        // Add validation to ensure sensorId exists before navigation
        if (item.id) {
          navigation.navigate('SensorDetail', { sensorId: item.id })
        } else {
          console.warn('Cannot navigate to sensor detail: sensor ID is missing')
        }
      }}
      activeOpacity={0.8}
    >
      <View style={styles.sensorHeader}>
        <View style={styles.sensorInfo}>
          <Text style={styles.sensorName}>{item.name}</Text>
          <Text style={styles.sensorType}>{item.type.toUpperCase()}</Text>
        </View>
        <View style={[styles.statusIndicator, item.status === 'active' ? styles.activeStatus : styles.inactiveStatus]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.sensorReading}>
        <Text style={styles.readingValue}>
          {item.last_reading} {item.unit}
        </Text>
        <Text style={styles.lastUpdated}>
          Updated: {new Date(item.updated_at).toLocaleTimeString()}
        </Text>
      </View>
    </TouchableOpacity>
  )
  const getFarmRoleStyle = (farmRole: string) => {
    switch (farmRole) {
      case 'owner':
        return styles.ownerRole
      case 'manager':
        return styles.managerRole
      default:
        return styles.viewerRole
    }
  }
  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={['#e7fbe8ff', '#cdffcfff']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.background}
        >
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading farm details...</Text>
          </View>
        </LinearGradient>
      </View>
    )
  }
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#e7fbe8ff', '#cdffcfff']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.background}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.farmName}>{farm?.name || 'Loading...'}</Text>
            <Text style={styles.farmLocation}>📍 {farm?.location || ''}</Text>
            {farm?.address && (
              <Text style={styles.farmAddress}>🏠 {farm.address}</Text>
            )}
            <Text style={styles.userRole}>Your role: {userRole}</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setShowSettingsModal(true)}
          >
            <Ionicons name="settings" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Farm Notes Section - New addition for farm description */}
          {farm?.notes && (
            <View style={styles.farmNotesSection}>
              <View style={styles.farmNotesHeader}>
                <Ionicons name="document-text" size={20} color="#4CAF50" />
                <Text style={styles.farmNotesTitle}>🌱 About This Farm</Text>
              </View>
              <View style={styles.farmNotesCard}>
                <Text style={styles.farmNotesText}>{farm.notes}</Text>
                <View style={styles.aiIndicator}>
                  <Ionicons name="bulb" size={16} color="#FF6B6B" />
                  <Text style={styles.aiIndicatorText}>
                    This information helps AI provide better suggestions for your farm
                  </Text>
                </View>
              </View>
            </View>
          )}
          {/* Weather Section */}
          {farm?.location && (
            <View style={styles.weatherSection}>
              <Text style={styles.sectionTitle}>🌤️ Weather Overview</Text>
              <WeatherWidget
                location={farm.location}
                compact={false}
              />
            </View>
          )}
          {/* Sensor Data Section */}
          <View style={styles.sensorSection}>
            <Text style={styles.sectionTitle}>📊 Sensor Data & Analytics</Text>
            <SensorDataTable farmId={farmId} />
          </View>

          {/* AI Suggestions Section */}
          {farm && (
            <AISuggestionBox
              farmId={farmId}
              farmName={farm.name}
              farmLocation={farm.location}
              farmNotes={farm.notes}
              sensorData={sensors.map(sensor => ({
                id: sensor.id,
                name: sensor.name,
                type: sensor.type,
                value: sensor.last_reading,
                unit: sensor.unit,
                timestamp: sensor.updated_at
              }))}
              onChatWithAI={() => navigation.navigate('Suggestion')}
            />
          )}

          {/* Sensors List */}
          <View style={styles.sensorsSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.titleWithCount}>
                <Text style={styles.sectionTitle}>🔧 Farm Sensors</Text>
                <View style={styles.sensorCount}>
                  <Text style={styles.sensorCountText}>{sensors.length}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.addSensorButton}
                onPress={() => setShowCreateSensorModal(true)}
              >
                <Ionicons name="hardware-chip" size={20} color="#4CAF50" />
              </TouchableOpacity>
            </View>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading sensors...</Text>
              </View>
            ) : sensors.length > 0 ? (
              <FlatList
                data={sensors}
                renderItem={renderSensorItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="hardware-chip-outline" size={48} color="#666" />
                <Text style={styles.emptyText}>No sensors configured for this farm</Text>
              </View>
            )}
          </View>
          {/* Farm Members Section */}
          <View style={styles.membersSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.titleWithCount}>
                <Text style={styles.sectionTitle}>👥 Farm Members</Text>
                <View style={styles.memberCount}>
                  <Text style={styles.memberCountText}>{farmUsers.length}</Text>
                </View>
              </View>
            </View>
            {farmUsers.length > 0 ? (
              <FlatList
                data={farmUsers}
                renderItem={renderUserItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color="#666" />
                <Text style={styles.emptyText}>No members found</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </LinearGradient>
      <BottomNavigation />
      {showSettingsModal && farm && (
        <FarmSettingsModal
          visible={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          farm={farm}
          userRole={userRole}
          farmUsers={farmUsers}
          onRefresh={fetchFarmDetails}
          navigation={navigation}
        />
      )}
      {showCreateSensorModal && (
        <CreateSensorRequest
          visible={showCreateSensorModal}
          onClose={() => setShowCreateSensorModal(false)}
          farmId={farmId}
          onRefresh={fetchFarmDetails}
        />
      )}
    </View>
  )
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    paddingBottom: 70,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    padding: 5,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  farmName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  farmLocation: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  farmAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  userRole: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 2,
  },
  settingsButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  weatherSection: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sensorSection: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sensorsSection: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  membersSection: {
    marginBottom: 100,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  titleWithCount: {
  flexDirection: 'row',
  alignItems: 'center',
  },
  sensorCount: {
  backgroundColor: '#4CAF50',
  borderRadius: 12,
  paddingVertical: 4,
  paddingHorizontal: 10,
  minWidth: 24,
  alignItems: 'center',
  marginLeft: 8,
  },
  sensorCountText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  memberCount: {
  backgroundColor: '#2196F3',
  borderRadius: 12,
  paddingVertical: 4,
  paddingHorizontal: 10,
  minWidth: 24,
  alignItems: 'center',
  marginLeft: 8,
  },
  memberCountText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sensorCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sensorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sensorInfo: {
    flex: 1,
  },
  sensorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  sensorType: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeStatus: {
    backgroundColor: '#d4edda',
  },
  inactiveStatus: {
    backgroundColor: '#f8d7da',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  sensorReading: {
    alignItems: 'flex-start',
  },
  readingValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e7fbe8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  appRoleText: {
    fontSize: 12,
    color: '#007bff',
    marginTop: 2,
  },
  roleContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  roleText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  ownerRole: {
    backgroundColor: '#ffd700',
    color: '#333',
  },
  managerRole: {
    backgroundColor: '#4CAF50',
    color: 'white',
  },
  viewerRole: {
    backgroundColor: '#ddd',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  lastSection: {
    marginBottom: 80, // Add margin to ensure visibility above bottom navigation
  },
  bottomSpacer: {
    height: 70, // Height of the bottom navigation
  },
  noDataCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 15,
  },
  // Farm Notes Section Styles - New addition
  farmNotesSection: {
    marginBottom: 20,
  },
  farmNotesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  farmNotesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  farmNotesCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  farmNotesText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  aiIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },
  aiIndicatorText: {
    fontSize: 12,
    color: '#D32F2F',
    marginLeft: 6,
    flex: 1,
    fontWeight: '500',
  },
  // Add Sensor Button Styles
  addSensorButton: {
    width: 40,
    height: 40,
    borderRadius: 50,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Empty State Styles
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
})
export default FarmDetails
