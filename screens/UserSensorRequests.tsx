import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useAuthContext } from '../context/AuthContext'
import { useDialog } from '../context/DialogContext'
import { SensorRequestService } from '../hooks/useSensorRequests'
import { SensorRequest } from '../interfaces/SensorRequest'
import BottomNavigation from '../components/BottomNavigation'
const UserSensorRequests = () => {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const { session } = useAuthContext()
  const { showDialog } = useDialog()
  const [requests, setRequests] = useState<SensorRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'installed' | 'cancelled'>('all')
  const [farmRequestCounts, setFarmRequestCounts] = useState<Record<string, number>>({})
  useEffect(() => {
    fetchRequests()
  }, [])
  const fetchRequests = async () => {
    try {
      setLoading(true)
      const data = await SensorRequestService.getUserRequests(session?.user?.id)
      setRequests(data)
      // Calculate farm request counts
      const counts: Record<string, number> = {}
      data.forEach(request => {
        const farmName = request.farms?.name || 'Unknown Farm'
        counts[farmName] = (counts[farmName] || 0) + 1
      })
      setFarmRequestCounts(counts)
    } catch (error: any) {
      console.error('Error fetching requests:', error)
      showDialog({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch sensor requests',
      })
    } finally {
      setLoading(false)
    }
  }
  const onRefresh = async () => {
    setRefreshing(true)
    await fetchRequests()
    setRefreshing(false)
  }
  const handleCancelRequest = async (requestId: string) => {
    showDialog({
      type: 'confirm',
      title: 'Cancel Request',
      message: 'Are you sure you want to cancel this sensor request?',
      onConfirm: async () => {
        try {
          await SensorRequestService.cancelRequest(requestId, 'Cancelled by user')
          showDialog({
            type: 'success',
            title: 'Success',
            message: 'Sensor request cancelled successfully',
          })
          await fetchRequests()
        } catch (error: any) {
          console.error('Error cancelling request:', error)
          showDialog({
            type: 'error',
            title: 'Error',
            message: 'Failed to cancel request',
          })
        }
      },
    })
  }
  const getFilteredRequests = () => {
    if (filterStatus === 'all') return requests
    return requests.filter(request => request.status === filterStatus)
  }
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9800'
      case 'approved': return '#4CAF50'
      case 'rejected': return '#F44336'
      case 'installed': return '#2196F3'
      case 'cancelled': return '#666'
      default: return '#666'
    }
  }
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#D32F2F'
      case 'high': return '#F44336'
      case 'medium': return '#FF9800'
      case 'low': return '#4CAF50'
      default: return '#666'
    }
  }
  const renderStatusFilter = () => {
    const statuses = [
      { key: 'pending', label: 'Pending', color: '#FF9800' },
      { key: 'approved', label: 'Approved', color: '#4CAF50' },
      { key: 'rejected', label: 'Rejected', color: '#F44336' },
      { key: 'installed', label: 'Installed', color: '#2196F3' },
      { key: 'cancelled', label: 'Cancelled', color: '#666' },
    ]
    const getStatusCount = (status: string) => {
      if (status === 'all') return requests.length
      return requests.filter(req => req.status === status).length
    }
    return (
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterStatus === 'all' && styles.filterButtonActive
            ]}
            onPress={() => setFilterStatus('all')}
          >
            <Text style={[
              styles.filterText,
              filterStatus === 'all' && styles.filterTextActive
            ]}>
              All ({requests.length})
            </Text>
          </TouchableOpacity>
          {statuses.map(status => (
            <TouchableOpacity
              key={status.key}
              style={[
                styles.filterButton,
                filterStatus === status.key && styles.filterButtonActive
              ]}
              onPress={() => setFilterStatus(status.key as any)}
            >
              <View style={[styles.statusDot, { backgroundColor: status.color }]} />
              <Text style={[
                styles.filterText,
                filterStatus === status.key && styles.filterTextActive
              ]}>
                {status.label} ({getStatusCount(status.key)})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    )
  }
  const renderFarmOverview = () => {
    if (Object.keys(farmRequestCounts).length === 0) return null
    return (
      <View style={styles.farmOverviewContainer}>
        <Text style={styles.farmOverviewTitle}>📊 Requests by Farm</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.farmOverviewContent}>
            {Object.entries(farmRequestCounts).map(([farmName, count]) => (
              <View key={farmName} style={styles.farmOverviewCard}>
                <Text style={styles.farmOverviewName}>{farmName}</Text>
                <View style={styles.farmOverviewBadge}>
                  <Text style={styles.farmOverviewCount}>{count}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    )
  }
  const renderRequestItem = ({ item }: { item: SensorRequest }) => (
    <View style={styles.requestCard}>
      <LinearGradient
        colors={['#ffffff', '#f8f9fa']}
        style={styles.requestCardGradient}
      >
        {/* Header */}
        <View style={styles.requestHeader}>
          <View style={styles.sensorTypeHeader}>
            <Ionicons name="hardware-chip" size={24} color="#4A90E2" />
            <View style={styles.sensorTypeInfo}>
              <Text style={styles.sensorTypeName}>
                {item.sensor_type.toUpperCase()} Sensor
              </Text>
              <Text style={styles.farmName}>
                🏡 {item.farms?.name || 'Unknown Farm'}
              </Text>
            </View>
            <View style={styles.quantityBadge}>
              <Text style={styles.quantityText}>{item.quantity}x</Text>
            </View>
          </View>
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) }
            ]}>
              <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
            </View>
            <View style={[
              styles.priorityBadge,
              { backgroundColor: getPriorityColor(item.priority_level) }
            ]}>
              <Text style={styles.priorityText}>{item.priority_level.toUpperCase()}</Text>
            </View>
          </View>
        </View>
        {/* Details */}
        <View style={styles.requestDetails}>
          <Text style={styles.detailLabel}>Installation Location:</Text>
          <Text style={styles.detailText}>{item.installation_location}</Text>
          <Text style={styles.detailLabel}>Justification:</Text>
          <Text style={styles.detailText}>{item.justification}</Text>
          {item.sensor_brand && (
            <>
              <Text style={styles.detailLabel}>Preferred Brand:</Text>
              <Text style={styles.detailText}>{item.sensor_brand}</Text>
            </>
          )}
          <Text style={styles.detailLabel}>Budget Range:</Text>
          <Text style={styles.detailText}>{item.budget_range}</Text>
          <Text style={styles.detailLabel}>Requested:</Text>
          <Text style={styles.detailText}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
          {item.processed_at && (
            <>
              <Text style={styles.detailLabel}>Processed:</Text>
              <Text style={styles.detailText}>
                {new Date(item.processed_at).toLocaleDateString()}
              </Text>
            </>
          )}
        </View>
        {/* User Actions */}
        {item.status === 'pending' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleCancelRequest(item.id)}
            >
              <Ionicons name="close" size={16} color="white" />
              <Text style={styles.actionButtonText}>Cancel Request</Text>
            </TouchableOpacity>
          </View>
        )}
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
        {item.status === 'approved' && (
          <View style={styles.approvedInfoContainer}>
            <Text style={styles.approvedInfoText}>
              🎉 Your sensor request has been approved! Installation will be scheduled soon.
            </Text>
          </View>
        )}
        {item.status === 'installed' && (
          <View style={styles.installedInfoContainer}>
            <Text style={styles.installedInfoText}>
              ✅ Sensor successfully installed and operational!
            </Text>
          </View>
        )}
      </LinearGradient>
    </View>
  )
  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={['#e7fbe8ff', '#cdffcfff']}
          style={styles.background}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.loadingText}>Loading your sensor requests...</Text>
          </View>
        </LinearGradient>
      </View>
    )
  }
  const filteredRequests = getFilteredRequests()
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#e7fbe8ff', '#cdffcfff']}
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
          <Text style={styles.headerTitle}>My Sensor Requests</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={onRefresh}
            disabled={refreshing}
          >
            <Ionicons name="refresh" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        {/* Farm Overview */}
        {renderFarmOverview()}
        {/* Filter Tabs */}
        {renderStatusFilter()}
        {/* Content */}
        <View style={styles.content}>
          {filteredRequests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="hardware-chip-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>
                {filterStatus === 'all'
                  ? 'No sensor requests found. Request sensors from farm details pages!'
                  : `No ${filterStatus} sensor requests found`}
              </Text>
              {filterStatus === 'all' && (
                <TouchableOpacity
                  style={styles.goToHomeButton}
                  onPress={() => navigation.navigate('Home' as never)}
                >
                  <Text style={styles.goToHomeText}>Go to Home</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <FlatList
              data={filteredRequests}
              renderItem={renderRequestItem}
              keyExtractor={(item) => item.id}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </LinearGradient>
      <BottomNavigation />
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    padding: 5,
  },
  farmOverviewContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    paddingVertical: 15,
  },
  farmOverviewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  farmOverviewContent: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  farmOverviewCard: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 100,
  },
  farmOverviewName: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  farmOverviewBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  farmOverviewCount: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  filterContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  filterContent: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.3)',
    minHeight: 32,
  },
  filterButtonActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A90E2',
  },
  filterTextActive: {
    color: 'white',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 10,
  },
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
  listContainer: {
    paddingVertical: 10,
    paddingBottom: 100,
  },
  requestCard: {
    marginHorizontal: 10,
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  requestCardGradient: {
    padding: 20,
  },
  requestHeader: {
    marginBottom: 15,
  },
  sensorTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sensorTypeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  sensorTypeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  farmName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  quantityBadge: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  quantityText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: 'white',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: 'white',
  },
  requestDetails: {
    marginBottom: 15,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
    marginBottom: 2,
  },
  detailText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 5,
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  feedbackContainer: {
    marginTop: 15,
    padding: 12,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4A90E2',
  },
  feedbackLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A90E2',
    marginBottom: 4,
  },
  feedbackText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
  approvedInfoContainer: {
    marginTop: 15,
    padding: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  approvedInfoText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  installedInfoContainer: {
    marginTop: 15,
    padding: 12,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  installedInfoText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  goToHomeButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  goToHomeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
})
export default UserSensorRequests
