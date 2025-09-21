import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { supabase } from '../lib/supabase'
import { useAuthContext } from '../context/AuthContext'
import { activityLogService } from '../utils/activityLogService'
import BottomNavigation from '../components/BottomNavigation'

// Temporary fallback for farm request notifications until service cache refreshes
const createFarmRequestNotificationFallback = async (params: {
  userId: string
  farmRequestId: string
  status: 'approved' | 'rejected'
  farmName: string
  adminFeedback?: string
}) => {
  try {
    const { userId, farmRequestId, status, farmName, adminFeedback } = params

    const title = status === 'approved'
      ? '✅ Farm Request Approved'
      : '❌ Farm Request Rejected'

    const message = status === 'approved'
      ? `Your farm request for "${farmName}" has been approved! Your farm has been created and is now available.`
      : `Your farm request for "${farmName}" has been rejected. ${adminFeedback ? `Reason: ${adminFeedback}` : ''}`

    const metadata = {
      farmRequestId,
      farmName,
      status,
      adminFeedback,
      navigation: {
        screen: 'UserRequests',
        params: { tab: 'farms' }
      }
    }

    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type: status === 'approved' ? 'success' : 'error',
        metadata
      })

    console.log(`Farm request notification created for user ${userId}: ${status}`)
  } catch (error) {
    console.error('Error creating farm request notification:', error)
  }
}

// Temporary fallback for farm management notifications
const createFarmManagementNotificationFallback = async (params: {
  userId: string
  farmId: string
  farmName: string
  actionType: 'created' | 'updated' | 'deleted'
  details: string
}) => {
  try {
    const { userId, farmId, farmName, actionType, details } = params

    const title = (() => {
      switch (actionType) {
        case 'created': return '🌱 Farm Created'
        case 'updated': return '📝 Farm Updated'
        case 'deleted': return '🗑️ Farm Deleted'
        default: return '🚜 Farm Management'
      }
    })()

    const message = `Farm "${farmName}" has been ${actionType}. ${details}`

    const metadata = {
      farmId,
      farmName,
      actionType,
      navigation: {
        screen: 'FarmDetails',
        params: { farmId }
      }
    }

    const type = (() => {
      switch (actionType) {
        case 'created': return 'success'
        case 'updated': return 'info'
        case 'deleted': return 'warning'
        default: return 'info'
      }
    })() as 'info' | 'success' | 'warning' | 'error'

    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        metadata
      })

    console.log(`Farm management notification created for user ${userId}: ${actionType} - ${farmName}`)
  } catch (error) {
    console.error('Error creating farm management notification:', error)
  }
}

interface FarmRequest {
  id: string
  farm_name: string
  location: string
  requested_by: string
  status: 'pending' | 'approved' | 'rejected'
  notes?: string
  admin_feedback?: string
  created_at: string
  processed_at?: string
  profiles: {
    username: string
    email: string
    role?: string
  }
}
const AdminFarmRequests: React.FC = () => {
  const navigation = useNavigation()
  const { session } = useAuthContext()
  const [requests, setRequests] = useState<FarmRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [processingRequest, setProcessingRequest] = useState<string | null>(null)
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false)
  const [currentRequest, setCurrentRequest] = useState<FarmRequest | null>(null)
  const [adminFeedback, setAdminFeedback] = useState('')
  const [rejectMode, setRejectMode] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  useEffect(() => {
    checkAdminAccess()
    fetchRequests()
  }, [])
  const checkAdminAccess = async () => {
    if (!session?.user?.id) {
      Alert.alert('Access Denied', 'You must be logged in to access this page')
      navigation.goBack()
      return
    }
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()
      if (error || !profile || profile.role !== 'admin') {
        Alert.alert('Access Denied', 'You do not have permission to access this page')
        navigation.goBack()
        return
      }
    } catch (error) {
      console.error('Error checking admin access:', error)
      Alert.alert('Error', 'Failed to verify permissions')
      navigation.goBack()
    }
  }
  const fetchRequests = async () => {
    try {
      setLoading(true)
      const { data: requestsData, error: requestsError } = await supabase
        .from('farm_requests')
        .select(`
          id,
          farm_name,
          location,
          requested_by,
          status,
          notes,
          admin_feedback,
          created_at,
          processed_at
        `)
        .order('created_at', { ascending: false })
      if (requestsError) {
        console.error('Error fetching requests:', requestsError)
        Alert.alert('Error', 'Failed to fetch farm requests')
        return
      }
      const requestsWithProfiles = []
      for (const request of requestsData || []) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('username, email, role')
          .eq('id', request.requested_by)
          .single()
        requestsWithProfiles.push({
          ...request,
          profiles: profileData || { username: 'Unknown User', email: '', role: 'user' }
        })
      }
      setRequests(requestsWithProfiles)
    } catch (error) {
      console.error('Error:', error)
      Alert.alert('Error', 'An unexpected error occurred')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }
  const handleRefresh = () => {
    setRefreshing(true)
    fetchRequests()
  }
  const handleApproveRequest = async (request: FarmRequest) => {
    Alert.alert(
      'Approve Request',
      `Are you sure you want to approve the farm request for "${request.farm_name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            try {
              setProcessingRequest(request.id)
              const { data: farmData, error: farmError } = await supabase
                .from('farms')
                .insert({
                  name: request.farm_name,
                  location: request.location,
                  notes: request.notes,
                })
                .select()
                .single()
              if (farmError) {
                throw new Error(`Failed to create farm: ${farmError.message}`)
              }
              const { error: farmUserError } = await supabase
                .from('farm_users')
                .insert({
                  farm_id: farmData.id,
                  user_id: request.requested_by,
                  farm_role: 'owner',
                })
              if (farmUserError) {
                console.error('Error adding user to farm:', farmUserError)
              }
              const { error: requestError } = await supabase
                .from('farm_requests')
                .update({
                  status: 'approved',
                  processed_at: new Date().toISOString(),
                  processed_by: session?.user?.id,
                })
                .eq('id', request.id)
              if (requestError) {
                throw new Error(`Failed to update request: ${requestError.message}`)
              }
              // Log the approval action for admin
              await activityLogService.logActivity({
                actionType: 'APPROVE',
                tableName: 'farm_requests',
                recordId: request.id,
                description: `Approved farm request for "${request.farm_name}" by ${request.profiles.username}`
              })
              // Create notification for the user whose request was approved
              await activityLogService.createFarmRequestNotification({
                userId: request.requested_by,
                farmRequestId: request.id,
                status: 'approved',
                farmName: request.farm_name
              })
              // Create farm management notification
              await activityLogService.createFarmManagementNotification({
                userId: request.requested_by,
                farmId: farmData.id,
                farmName: request.farm_name,
                actionType: 'created',
                details: 'Your farm request has been approved and the farm has been created.'
              })
              // Fallback notifications
              await createFarmRequestNotificationFallback({
                userId: request.requested_by,
                farmRequestId: request.id,
                status: 'approved',
                farmName: request.farm_name
              })
              await createFarmManagementNotificationFallback({
                userId: request.requested_by,
                farmId: farmData.id,
                farmName: request.farm_name,
                actionType: 'created',
                details: 'Your farm request has been approved and the farm has been created.'
              })
              Alert.alert('Success', `Farm request approved and farm "${request.farm_name}" created successfully`)
              fetchRequests()
            } catch (error: any) {
              console.error('Error approving request:', error)
              Alert.alert('Error', error.message || 'Failed to approve request')
            } finally {
              setProcessingRequest(null)
            }
          }
        }
      ]
    )
  }
  const handleRejectRequest = (request: FarmRequest) => {
    setCurrentRequest(request)
    setRejectMode(true)
    setAdminFeedback('')
    setFeedbackModalVisible(true)
  }
  const confirmRejectRequest = async () => {
    if (!currentRequest) return
    try {
      setProcessingRequest(currentRequest.id)
      const { error } = await supabase
        .from('farm_requests')
        .update({
          status: 'rejected',
          processed_at: new Date().toISOString(),
          processed_by: session?.user?.id,
          admin_feedback: adminFeedback.trim() || 'No feedback provided'
        })
        .eq('id', currentRequest.id)
      if (error) {
        throw error
      }
      // Log the rejection action for admin
      await activityLogService.logActivity({
        actionType: 'REJECT',
        tableName: 'farm_requests',
        recordId: currentRequest.id,
        description: `Rejected farm request for "${currentRequest.farm_name}" by ${currentRequest.profiles.username}. Reason: ${adminFeedback || 'No reason provided'}`
      })
      // Create notification for the user whose request was rejected
      await activityLogService.createFarmRequestNotification({
        userId: currentRequest.requested_by,
        farmRequestId: currentRequest.id,
        status: 'rejected',
        farmName: currentRequest.farm_name,
        adminFeedback: adminFeedback
      })
      // Fallback notification
      await createFarmRequestNotificationFallback({
        userId: currentRequest.requested_by,
        farmRequestId: currentRequest.id,
        status: 'rejected',
        farmName: currentRequest.farm_name,
        adminFeedback: adminFeedback
      })
      setFeedbackModalVisible(false)
      setCurrentRequest(null)
      setAdminFeedback('')
      Alert.alert('Success', `Farm request for "${currentRequest.farm_name}" has been rejected`)
      fetchRequests()
    } catch (error: any) {
      console.error('Error rejecting request:', error)
      Alert.alert('Error', error.message || 'Failed to reject request')
    } finally {
      setProcessingRequest(null)
    }
  }
  const handleEditFeedback = (request: FarmRequest) => {
    setCurrentRequest(request)
    setAdminFeedback(request.admin_feedback || '')
    setRejectMode(false)
    setFeedbackModalVisible(true)
  }
  const handleSaveFeedback = async () => {
    if (!currentRequest) return
    try {
      setProcessingRequest(currentRequest.id)
      const updateData: any = {
        admin_feedback: adminFeedback.trim() || null,
        processed_at: new Date().toISOString(),
        processed_by: session?.user?.id,
      }
      if (rejectMode) {
        updateData.status = 'rejected'
      }
      const { error } = await supabase
        .from('farm_requests')
        .update(updateData)
        .eq('id', currentRequest.id)
      if (error) {
        throw new Error(`Failed to save feedback: ${error.message}`)
      }
      // Log the rejection action properly
      if (rejectMode) {
        await activityLogService.logFarmRequestRejection(currentRequest, adminFeedback.trim())
        // Create notification for the user whose request was rejected
        await supabase
          .from('notifications')
          .insert({
            user_id: currentRequest.requested_by,
            title: 'Farm Request Update ⚠️',
            message: `Your farm request for "${currentRequest.farm_name}" has been rejected. ${adminFeedback.trim() ? 'Reason: ' + adminFeedback.trim() : ''} Click to view details.`,
            type: 'warning',
            metadata: JSON.stringify({
              action: 'navigate',
              screen: 'UserRequests',
              params: { activeTab: 'farm', requestId: currentRequest.id }
            })
          })
      } else {
        // Just editing feedback, log as update
        await activityLogService.logActivity({
          actionType: 'UPDATE',
          tableName: 'farm_requests',
          recordId: currentRequest.id,
          oldData: { admin_feedback: currentRequest.admin_feedback },
          newData: { admin_feedback: adminFeedback.trim() },
          description: `Updated admin feedback for farm request "${currentRequest.farm_name}"`
        })
      }
      Alert.alert('Success', rejectMode ? 'Request rejected with feedback' : 'Feedback saved successfully')
      setFeedbackModalVisible(false)
      setCurrentRequest(null)
      setAdminFeedback('')
      setRejectMode(false)
      fetchRequests()
    } catch (error: any) {
      console.error('Error saving feedback:', error)
      Alert.alert('Error', error.message || 'Failed to save feedback')
    } finally {
      setProcessingRequest(null)
    }
  }
  const handleFilterChange = (filter: 'pending' | 'approved' | 'rejected' | 'all') => {
    setSelectedFilter(filter)
  }
  const getFilteredRequests = () => {
    if (selectedFilter === 'all') {
      return requests
    }
    return requests.filter(request => request.status === selectedFilter)
  }
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9800'
      case 'approved': return '#4CAF50'
      case 'rejected': return '#F44336'
      default: return '#666'
    }
  }
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'time-outline'
      case 'approved': return 'checkmark-circle'
      case 'rejected': return 'close-circle'
      default: return 'help-circle'
    }
  }
  const getUserRoleBadge = (role?: string) => {
    if (!role) return null
    const roleColors = {
      admin: '#9C27B0',
      user: '#2196F3',
      tester: '#FF5722'
    }
    return (
      <View style={[styles.roleBadge, { backgroundColor: roleColors[role as keyof typeof roleColors] || '#666' }]}>
        <Text style={styles.roleText}>{role.toUpperCase()}</Text>
      </View>
    )
  }
  const renderRequestItem = ({ item }: { item: FarmRequest }) => (
    <View style={styles.requestCard}>
      <LinearGradient
        colors={['#ffffff', '#f8f9fa']}
        style={styles.requestCardGradient}
      >
        <View style={styles.requestHeader}>
          <View style={styles.requestInfo}>
            <Text style={styles.farmName}>{item.farm_name}</Text>
            <Text style={styles.location}>📍 {item.location}</Text>
            <View style={styles.userInfo}>
              <Text style={styles.requester}>
                👤 {item.profiles?.username || 'Unknown User'}
              </Text>
              {getUserRoleBadge(item.profiles?.role)}
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Ionicons
              name={getStatusIcon(item.status) as any}
              size={16}
              color="white"
            />
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
        {item.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>User Notes:</Text>
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        )}
        {item.admin_feedback && (
          <View style={styles.adminFeedbackContainer}>
            <Text style={styles.adminFeedbackLabel}>Admin Feedback:</Text>
            <Text style={styles.adminFeedbackText}>{item.admin_feedback}</Text>
          </View>
        )}
        <View style={styles.datesContainer}>
          <Text style={styles.dateText}>
            Requested: {new Date(item.created_at).toLocaleDateString()}
          </Text>
          {item.processed_at && (
            <Text style={styles.dateText}>
              Processed: {new Date(item.processed_at).toLocaleDateString()}
            </Text>
          )}
        </View>
        <View style={styles.actionButtons}>
          {item.status === 'pending' && (
            <>
              <TouchableOpacity
                style={styles.approveButton}
                onPress={() => handleApproveRequest(item)}
                disabled={processingRequest === item.id}
              >
                <LinearGradient
                  colors={['#4CAF50', '#45a049', '#388e3c']}
                  style={styles.actionButtonGradient}
                >
                  {processingRequest === item.id ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={20} color="white" />
                      <Text style={styles.actionButtonText}>Approve</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rejectButton}
                onPress={() => handleRejectRequest(item)}
                disabled={processingRequest === item.id}
              >
                <LinearGradient
                  colors={['#F44336', '#D32F2F', '#B71C1C']}
                  style={styles.actionButtonGradient}
                >
                  <Ionicons name="close" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Reject</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity
            style={styles.feedbackButton}
            onPress={() => handleEditFeedback(item)}
          >
            <Ionicons name="pencil" size={16} color="#2196F3" />
            <Text style={styles.feedbackButtonText}>
              {item.admin_feedback ? 'Edit Feedback' : 'Add Feedback'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  )
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={64} color="#666" />
      <Text style={styles.emptyTitle}>No Farm Requests</Text>
      <Text style={styles.emptySubtitle}>
        There are currently no farm requests to review
      </Text>
    </View>
  )
  const pendingCount = requests.filter(r => r.status === 'pending').length
  const approvedCount = requests.filter(r => r.status === 'approved').length
  const rejectedCount = requests.filter(r => r.status === 'rejected').length
  return (
    <LinearGradient
      colors={['#e7fbe8ff', '#cdffcfff']}
      style={styles.container}
    >
      <LinearGradient
        colors={['#4A90E2', '#357ABD', '#2E5B8A']}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin: Farm Requests</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Ionicons name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </LinearGradient>
      {/* Merged Stats and Filter Container - Clickable for Both Display and Filtering */}
      <View style={styles.statsContainer}>
        <TouchableOpacity
          style={[styles.statItem, selectedFilter === 'pending' && styles.statItemActive]}
          onPress={() => handleFilterChange('pending')}
        >
          <Text style={[styles.statNumber, selectedFilter === 'pending' && styles.statNumberActive]}>{pendingCount}</Text>
          <Text style={[styles.statLabel, { color: '#FF9800' }, selectedFilter === 'pending' && styles.statLabelActive]}>Pending</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statItem, selectedFilter === 'approved' && styles.statItemActive]}
          onPress={() => handleFilterChange('approved')}
        >
          <Text style={[styles.statNumber, selectedFilter === 'approved' && styles.statNumberActive]}>{approvedCount}</Text>
          <Text style={[styles.statLabel, { color: '#4CAF50' }, selectedFilter === 'approved' && styles.statLabelActive]}>Approved</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statItem, selectedFilter === 'rejected' && styles.statItemActive]}
          onPress={() => handleFilterChange('rejected')}
        >
          <Text style={[styles.statNumber, selectedFilter === 'rejected' && styles.statNumberActive]}>{rejectedCount}</Text>
          <Text style={[styles.statLabel, { color: '#F44336' }, selectedFilter === 'rejected' && styles.statLabelActive]}>Rejected</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statItem, selectedFilter === 'all' && styles.statItemActive]}
          onPress={() => handleFilterChange('all')}
        >
          <Text style={[styles.statNumber, selectedFilter === 'all' && styles.statNumberActive]}>{requests.length}</Text>
          <Text style={[styles.statLabel, { color: '#666' }, selectedFilter === 'all' && styles.statLabelActive]}>All</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Loading requests...</Text>
          </View>
        ) : (
          <FlatList
            data={getFilteredRequests()}
            renderItem={renderRequestItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={renderEmptyState}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#4CAF50']}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
      <Modal
        visible={feedbackModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFeedbackModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#4A90E2', '#357ABD']}
              style={styles.modalHeader}
            >
              <Text style={styles.modalTitle}>
                {rejectMode ? 'Reject Request with Feedback' : 'Edit Admin Feedback'}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setFeedbackModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </LinearGradient>
            <ScrollView style={styles.modalScrollView}>
              {currentRequest && (
                <View style={styles.requestSummary}>
                  <Text style={styles.summaryTitle}>Request Summary:</Text>
                  <Text style={styles.summaryText}>Farm: {currentRequest.farm_name}</Text>
                  <Text style={styles.summaryText}>Location: {currentRequest.location}</Text>
                  <Text style={styles.summaryText}>User: {currentRequest.profiles?.username}</Text>
                </View>
              )}
              <View style={styles.feedbackInputContainer}>
                <Text style={styles.feedbackInputLabel}>
                  {rejectMode ? 'Rejection Reason (Required):' : 'Admin Feedback:'}
                </Text>
                <TextInput
                  style={styles.feedbackInput}
                  value={adminFeedback}
                  onChangeText={setAdminFeedback}
                  placeholder={rejectMode ? 'Please provide a reason for rejection...' : 'Add your feedback here...'}
                  placeholderTextColor="#666"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setFeedbackModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveButton, rejectMode && styles.modalRejectButton]}
                onPress={rejectMode ? confirmRejectRequest : handleSaveFeedback}
                disabled={rejectMode && !adminFeedback.trim()}
              >
                <LinearGradient
                  colors={rejectMode ? ['#F44336', '#D32F2F'] : ['#4CAF50', '#45a049']}
                  style={styles.modalSaveButtonGradient}
                >
                  <Text style={styles.modalSaveText}>
                    {rejectMode ? 'Reject Request' : 'Save Feedback'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  refreshButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginHorizontal: 10,
    marginVertical: 10,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statItem: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    minWidth: 60,
  },
  statItemActive: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statNumberActive: {
    color: '#4A90E2',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  statLabelActive: {
    color: '#4A90E2',
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
    paddingBottom: 100,
  },
  requestCard: {
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  requestInfo: {
    flex: 1,
    marginRight: 10,
  },
  farmName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requester: {
    fontSize: 14,
    color: '#666',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  notesContainer: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  adminFeedbackContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  adminFeedbackLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  adminFeedbackText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  datesContainer: {
    marginBottom: 15,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  approveButton: {
    flex: 1,
    minWidth: 100,
    borderRadius: 8,
    overflow: 'hidden',
  },
  rejectButton: {
    flex: 1,
    minWidth: 100,
    borderRadius: 8,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 5,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2196F3',
    gap: 5,
    marginTop: 8,
  },
  feedbackButtonText: {
    color: '#2196F3',
    fontSize: 12,
    fontWeight: '600',
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
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  requestSummary: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  feedbackInputContainer: {
    padding: 20,
  },
  feedbackInputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 100,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#666',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#666',
    fontWeight: 'bold',
  },
  modalSaveButton: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  modalRejectButton: {
    // Additional styles for reject mode
  },
  modalSaveButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalSaveText: {
    color: 'white',
    fontWeight: 'bold',
  },
})
export default AdminFarmRequests
