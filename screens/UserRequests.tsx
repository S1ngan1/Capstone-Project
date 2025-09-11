import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useAuthContext } from '../context/AuthContext'
import { SensorRequest } from '../interfaces/SensorRequest'
import { FarmRequest } from '../interfaces/FarmRequest'
import { supabase } from '../lib/supabase'
import BottomNavigation from '../components/BottomNavigation'
type TabType = 'sensor' | 'farm'
type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected'
const UserRequests = () => {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const { user, session } = useAuthContext()
  const [activeTab, setActiveTab] = useState<TabType>('sensor')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [sensorRequests, setSensorRequests] = useState<SensorRequest[]>([])
  const [farmRequests, setFarmRequests] = useState<FarmRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  useEffect(() => {
    console.log('UserRequests: useEffect triggered with user:', user?.id || 'null')
    if (user) {
      fetchData()
    } else if (session === null) {
      setLoading(false)
    }
  }, [user, session])
  const fetchData = async () => {
    if (!user) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      await Promise.allSettled([
        fetchSensorRequests(),
        fetchFarmRequests()
      ])
    } catch (error) {
      console.error('UserRequests: Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }
  const fetchSensorRequests = async () => {
    if (!user?.id) return
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      const userId = authUser?.id || user.id
      if (!userId) {
        setSensorRequests([])
        return
      }
      const { data, error } = await supabase
        .from('sensor_requests')
        .select(`
          *,
          farms(id, name, location)
        `)
        .eq('requested_by', userId)
        .order('created_at', { ascending: false })
      if (error) {
        console.error('Error fetching sensor requests:', error)
        setSensorRequests([])
        return
      }
      setSensorRequests(data || [])
    } catch (error) {
      console.error('Error fetching sensor requests:', error)
      setSensorRequests([])
    }
  }
  const fetchFarmRequests = async () => {
    if (!user?.id) return
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      const userId = authUser?.id || user.id
      if (!userId) {
        setFarmRequests([])
        return
      }
      const { data, error } = await supabase
        .from('farm_requests')
        .select('*')
        .eq('requested_by', userId)
        .order('created_at', { ascending: false })
      if (error) {
        console.error('Error fetching farm requests:', error)
        setFarmRequests([])
        return
      }
      setFarmRequests(data || [])
    } catch (error) {
      console.error('Error fetching farm requests:', error)
      setFarmRequests([])
    }
  }
  const onRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9500'
      case 'approved': return '#34C759'
      case 'rejected': return '#FF3B30'
      case 'installed': return '#007AFF'
      default: return '#8E8E93'
    }
  }
  const getFilteredSensorRequests = () => {
    if (filterStatus === 'all') return sensorRequests
    return sensorRequests.filter(request => request.status === filterStatus)
  }
  const getFilteredFarmRequests = () => {
    if (filterStatus === 'all') return farmRequests
    return farmRequests.filter(request => request.status === filterStatus)
  }
  const getStatusCounts = () => {
    const currentRequests = activeTab === 'sensor' ? sensorRequests : farmRequests
    return {
      all: currentRequests.length,
      pending: currentRequests.filter(req => req.status === 'pending').length,
      approved: currentRequests.filter(req => req.status === 'approved').length,
      rejected: currentRequests.filter(req => req.status === 'rejected').length,
    }
  }
  const statusCounts = getStatusCounts()
  const renderTabSelector = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'sensor' && styles.activeTab]}
        onPress={() => setActiveTab('sensor')}
      >
        <Ionicons
          name="hardware-chip"
          size={20}
          color={activeTab === 'sensor' ? 'white' : '#4A90E2'}
        />
        <Text style={[
          styles.tabText,
          activeTab === 'sensor' && styles.activeTabText
        ]}>
          Sensor Requests
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'farm' && styles.activeTab]}
        onPress={() => setActiveTab('farm')}
      >
        <Ionicons
          name="business"
          size={20}
          color={activeTab === 'farm' ? 'white' : '#4A90E2'}
        />
        <Text style={[
          styles.tabText,
          activeTab === 'farm' && styles.activeTabText
        ]}>
          Farm Requests
        </Text>
      </TouchableOpacity>
    </View>
  )
  const renderStatusFilter = () => (
    <View style={styles.filterContainer}>
      {(['all', 'pending', 'approved', 'rejected'] as FilterStatus[]).map((status) => {
        const count = statusCounts[status]
        const isActive = filterStatus === status
        return (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              isActive && styles.activeFilterButton
            ]}
            onPress={() => setFilterStatus(status)}
          >
            <View style={styles.filterContent}>
              <Text style={[
                styles.filterButtonText,
                isActive && styles.activeFilterButtonText
              ]}>
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
              <View style={[
                styles.countBadge,
                isActive ? styles.activeCountBadge : styles.inactiveCountBadge
              ]}>
                <Text style={[
                  styles.countText,
                  isActive ? styles.activeCountText : styles.inactiveCountText
                ]}>
                  {count}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )
      })}
    </View>
  )
  const renderSensorRequestItem = ({ item }: { item: SensorRequest }) => (
    <View style={styles.requestCard}>
      <LinearGradient
        colors={['#ffffff', '#f8f9fa']}
        style={styles.requestCardGradient}
      >
        <View style={styles.requestHeader}>
          <View style={styles.typeHeader}>
            <Ionicons name="hardware-chip" size={24} color="#4A90E2" />
            <View style={styles.typeInfo}>
              <Text style={styles.typeName}>
                {item.sensor_type?.toUpperCase() || 'UNKNOWN'} Sensor
              </Text>
              <Text style={styles.farmName}>
                🏡 {item.farms?.name || 'Unknown Farm'}
              </Text>
            </View>
            <View style={styles.quantityBadge}>
              <Text style={styles.quantityText}>{item.quantity || 1}x</Text>
            </View>
          </View>
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) }
            ]}>
              <Text style={styles.statusText}>{item.status?.toUpperCase() || 'UNKNOWN'}</Text>
            </View>
          </View>
        </View>
        <View style={styles.requestDetails}>
          <Text style={styles.detailLabel}>Installation Location:</Text>
          <Text style={styles.detailText}>{item.installation_location || 'Not specified'}</Text>
          <Text style={styles.detailLabel}>Justification:</Text>
          <Text style={styles.detailText}>{item.justification || 'Not provided'}</Text>
          <Text style={styles.detailLabel}>Requested:</Text>
          <Text style={styles.detailText}>
            {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Unknown date'}
          </Text>
        </View>
        {item.admin_feedback && (
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackLabel}>
              {item.status === 'approved' ? '✅ Admin Approval:' :
               item.status === 'rejected' ? '❌ Rejection Reason:' :
               '💬 Admin Feedback:'}
            </Text>
            <Text style={styles.feedbackText}>{item.admin_feedback}</Text>
          </View>
        )}
      </LinearGradient>
    </View>
  )
  const renderFarmRequestItem = ({ item }: { item: FarmRequest }) => (
    <View style={styles.requestCard}>
      <LinearGradient
        colors={['#ffffff', '#f8f9fa']}
        style={styles.requestCardGradient}
      >
        <View style={styles.requestHeader}>
          <View style={styles.typeHeader}>
            <Ionicons name="business" size={24} color="#4A90E2" />
            <View style={styles.typeInfo}>
              <Text style={styles.typeName}>{item.farm_name || 'Unknown Farm'}</Text>
              <Text style={styles.farmName}>📍 {item.location || 'Unknown Location'}</Text>
            </View>
          </View>
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) }
            ]}>
              <Text style={styles.statusText}>{item.status?.toUpperCase() || 'UNKNOWN'}</Text>
            </View>
          </View>
        </View>
        <View style={styles.requestDetails}>
          <Text style={styles.detailLabel}>Farm Size:</Text>
          <Text style={styles.detailText}>{item.farm_size || 'Not specified'} hectares</Text>
          <Text style={styles.detailLabel}>Crop Type:</Text>
          <Text style={styles.detailText}>{item.crop_type || 'Not specified'}</Text>
          {item.note && (
            <>
              <Text style={styles.detailLabel}>Note:</Text>
              <Text style={styles.detailText}>{item.note}</Text>
            </>
          )}
          <Text style={styles.detailLabel}>Requested:</Text>
          <Text style={styles.detailText}>
            {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Unknown date'}
          </Text>
        </View>
        {item.admin_feedback && (
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackLabel}>
              {item.status === 'approved' ? '✅ Admin Approval:' :
               item.status === 'rejected' ? '❌ Rejection Reason:' :
               '💬 Admin Feedback:'}
            </Text>
            <Text style={styles.feedbackText}>{item.admin_feedback}</Text>
          </View>
        )}
      </LinearGradient>
    </View>
  )
  const renderContent = () => {
    const filteredRequests = activeTab === 'sensor'
      ? getFilteredSensorRequests()
      : getFilteredFarmRequests()
    if (filteredRequests.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons
            name={activeTab === 'sensor' ? 'hardware-chip-outline' : 'business-outline'}
            size={64}
            color="#ccc"
          />
          <Text style={styles.emptyText}>
            {filterStatus === 'all'
              ? `No ${activeTab} requests found`
              : `No ${filterStatus} ${activeTab} requests found`}
          </Text>
          <Text style={styles.emptySubtext}>
            {activeTab === 'sensor'
              ? 'Request sensors from farm details pages!'
              : 'Submit farm requests from the home screen!'}
          </Text>
          <TouchableOpacity
            style={styles.goToHomeButton}
            onPress={() => navigation.navigate('Home' as never)}
          >
            <Text style={styles.goToHomeText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      )
    }
    return (
      <FlatList
        data={filteredRequests}
        renderItem={activeTab === 'sensor' ? renderSensorRequestItem : renderFarmRequestItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    )
  }
  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={['#e7fbe8ff', '#cdffcfff']}
          style={styles.background}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.loadingText}>Loading requests...</Text>
          </View>
        </LinearGradient>
      </View>
    )
  }
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#e7fbe8ff', '#cdffcfff']}
        style={styles.background}
      >
        {/* Header */}
        <View style={styles.topNavigation}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#2E8B57" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Requests</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={onRefresh}
            disabled={refreshing}
          >
            <Ionicons
              name="refresh"
              size={24}
              color={refreshing ? "#999" : "#2E8B57"}
            />
          </TouchableOpacity>
        </View>
        {/* Content */}
        <View style={styles.content}>
          {renderTabSelector()}
          {renderStatusFilter()}
          <View style={styles.listContent}>
            {renderContent()}
          </View>
        </View>
        <BottomNavigation />
      </LinearGradient>
    </View>
  )
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  topNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46, 139, 87, 0.2)',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(46, 139, 87, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E8B57',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(46, 139, 87, 0.1)',
  },
  content: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    padding: 5,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#4A90E2',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90E2',
  },
  activeTabText: {
    color: 'white',
  },
  filterContainer: {
    flexDirection: 'row',
    marginHorizontal: 15,
    marginBottom: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 18,
    padding: 3,
    justifyContent: 'space-between',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 1,
  },
  activeFilterButton: {
    backgroundColor: '#4A90E2',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A90E2',
  },
  activeFilterButtonText: {
    color: 'white',
  },
  filterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  activeCountBadge: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  inactiveCountBadge: {
    backgroundColor: '#e0e0e0',
  },
  countText: {
    fontSize: 10,
    fontWeight: '500',
  },
  activeCountText: {
    color: '#4A90E2',
  },
  inactiveCountText: {
    color: '#333',
  },
  listContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listContainer: {
    paddingBottom: 150,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 16,
  },
  goToHomeButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#4A90E2',
    borderRadius: 25,
  },
  goToHomeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4A90E2',
  },
  requestCard: {
    marginBottom: 15,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  requestCardGradient: {
    padding: 15,
    borderRadius: 10,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  typeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeInfo: {
    marginLeft: 10,
    flex: 1,
  },
  typeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  farmName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  quantityBadge: {
    backgroundColor: '#e1f5fe',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#01579b',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
  requestDetails: {
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
    marginTop: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  feedbackContainer: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  feedbackLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  feedbackText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
})
export default UserRequests
