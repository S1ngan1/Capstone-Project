import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuthContext } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { activityLogService } from '../utils/activityLogService';
import BottomNavigation from '../components/BottomNavigation';

interface SensorRequest {
  id: string;
  requested_by: string;
  farm_id: string;
  sensor_type: string;
  quantity: number;
  installation_location: string;
  justification: string;
  technical_requirements?: string;
  budget_range: string;
  priority_level: string;
  status: 'pending' | 'approved' | 'rejected' | 'installed';
  admin_feedback?: string;
  created_at: string;
  processed_at?: string;
  farms?: {
    id: string;
    name: string;
    location: string;
  };
  profiles?: {
    username: string;
    email: string;
    role?: string;
  };
}

const AdminSensorRequests = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { session } = useAuthContext();

  const [requests, setRequests] = useState<SensorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [currentRequest, setCurrentRequest] = useState<SensorRequest | null>(null);
  const [adminFeedback, setAdminFeedback] = useState<string>('');
  const [feedbackModalVisible, setFeedbackModalVisible] = useState<boolean>(false);

  useEffect(() => {
    checkAdminAccess();
    fetchRequests();
  }, []);

  const checkAdminAccess = async () => {
    if (!session?.user?.id) {
      Alert.alert('Access Denied', 'You must be logged in to access this page');
      navigation.goBack();
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error || !profile || profile.role !== 'admin') {
        Alert.alert('Access Denied', 'You do not have permission to access this page');
        navigation.goBack();
        return;
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      Alert.alert('Error', 'Failed to verify permissions');
      navigation.goBack();
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      console.log('AdminSensorRequests: Fetching sensor requests...');

      // First, let's check if the table exists and get all requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('sensor_requests')
        .select(`
          id,
          requested_by,
          farm_id,
          sensor_type,
          quantity,
          installation_location,
          justification,
          technical_requirements,
          budget_range,
          priority_level,
          status,
          admin_feedback,
          created_at,
          processed_at
        `)
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.error('AdminSensorRequests: Error fetching requests:', requestsError);
        console.error('AdminSensorRequests: Error code:', requestsError.code);
        console.error('AdminSensorRequests: Error message:', requestsError.message);

        // Check if table doesn't exist
        if (requestsError.code === '42P01') {
          Alert.alert('Database Error', 'Sensor requests table does not exist. Please check database setup.');
        } else {
          Alert.alert('Error', `Failed to fetch sensor requests: ${requestsError.message}`);
        }
        return;
      }

      console.log(`AdminSensorRequests: Raw data from database:`, requestsData);
      console.log(`AdminSensorRequests: Found ${requestsData?.length || 0} sensor requests`);

      if (!requestsData || requestsData.length === 0) {
        console.log('AdminSensorRequests: No sensor requests found in database');
        setRequests([]);
        return;
      }

      // Let's also check the current user's role to make sure they can see all requests
      const { data: { user } } = await supabase.auth.getUser();
      console.log('AdminSensorRequests: Current user ID:', user?.id);

      const requestsWithDetails = [];
      for (const request of requestsData) {
        console.log(`AdminSensorRequests: Processing request ${request.id} for user ${request.requested_by} on farm ${request.farm_id}`);

        // Fetch profile data with error handling
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('username, email, role')
          .eq('id', request.requested_by)
          .single();

        if (profileError) {
          console.error(`AdminSensorRequests: Error fetching profile for user ${request.requested_by}:`, profileError);
        } else {
          console.log(`AdminSensorRequests: Found profile for user ${request.requested_by}:`, profileData);
        }

        // Fetch farm data with error handling
        const { data: farmData, error: farmError } = await supabase
          .from('farms')
          .select('id, name, location')
          .eq('id', request.farm_id)
          .single();

        if (farmError) {
          console.error(`AdminSensorRequests: Error fetching farm ${request.farm_id}:`, farmError);
        } else {
          console.log(`AdminSensorRequests: Found farm ${request.farm_id}:`, farmData);
        }

        requestsWithDetails.push({
          ...request,
          profiles: profileData || { username: 'Unknown User', email: '', role: 'user' },
          farms: farmData || { id: request.farm_id, name: 'Unknown Farm', location: 'Unknown Location' }
        });
      }

      console.log(`AdminSensorRequests: Successfully processed ${requestsWithDetails.length} sensor requests`);
      console.log('AdminSensorRequests: Final processed data:', requestsWithDetails);
      setRequests(requestsWithDetails);
    } catch (error) {
      console.error('AdminSensorRequests: Unexpected error in fetchRequests:', error);
      Alert.alert('Error', 'An unexpected error occurred while fetching requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRequests();
  };

  const handleApproveRequest = async (request: SensorRequest) => {;
    Alert.alert(
      'Approve Request',
      `Are you sure you want to approve the ${request.sensor_type} sensor request for "${request.farms?.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {;
            try {
              setProcessingRequest(request.id);

              const { error } = await supabase
                .from('sensor_requests')
                .update({
                  status: 'approved',
                  processed_at: new Date().toISOString(),
                  processed_by: session?.user?.id,
                })
                .eq('id', request.id);

              if (error) {
                throw error;
              }

              // Log the approval action for admin
              await activityLogService.logActivity({
                actionType: 'APPROVE',
                tableName: 'sensor_requests',
                recordId: request.id,
                description: `Approved ${request.sensor_type} sensor request for farm "${request.farms?.name}" by ${request.profiles?.username}`,
              });

              // Create notification for the user whose request was approved
              await activityLogService.createSensorRequestNotification({
                userId: request.requested_by,
                sensorRequestId: request.id,
                status: 'approved',
                sensorType: request.sensor_type,
                farmName: request.farms?.name || 'Unknown Farm';
              });

              Alert.alert('Success', `Sensor request approved successfully`);
              fetchRequests();
            } catch (error: any) {;
              console.error('Error approving request:', error);
              Alert.alert('Error', error.message || 'Failed to approve request');
            } finally {
              setProcessingRequest(null);
            }
          }
        }
      ]
    );
  };

  const handleRejectRequest = (request: SensorRequest) => {;
    setCurrentRequest(request);
    setAdminFeedback('');
    setFeedbackModalVisible(true);
  };

  const confirmRejectRequest = async () => {
    if (!currentRequest) return;

    try {
      setProcessingRequest(currentRequest.id);

      const { error } = await supabase
        .from('sensor_requests')
        .update({
          status: 'rejected',
          processed_at: new Date().toISOString(),
          processed_by: session?.user?.id,
          admin_feedback: adminFeedback.trim() || 'No feedback provided';
        })
        .eq('id', currentRequest.id);

      if (error) {
        throw error;
      }

      // Log the rejection action for admin
      await activityLogService.logActivity({
        actionType: 'REJECT',
        tableName: 'sensor_requests',
        recordId: currentRequest.id,
        description: `Rejected ${currentRequest.sensor_type} sensor request for farm "${currentRequest.farms?.name}" by ${currentRequest.profiles?.username}. Reason: ${adminFeedback || 'No reason provided'}`
      });

      // Create notification for the user whose request was rejected
      await activityLogService.createSensorRequestNotification({
        userId: currentRequest.requested_by,
        sensorRequestId: currentRequest.id,
        status: 'rejected',
        sensorType: currentRequest.sensor_type,
        farmName: currentRequest.farms?.name || 'Unknown Farm',
        adminFeedback: adminFeedback;
      });

      setFeedbackModalVisible(false);
      setCurrentRequest(null);
      setAdminFeedback('');
      Alert.alert('Success', `Sensor request has been rejected`);
      fetchRequests();
    } catch (error: any) {;
      console.error('Error rejecting request:', error);
      Alert.alert('Error', error.message || 'Failed to reject request');
    } finally {
      setProcessingRequest(null);
    }
  };

  const getFilteredRequests = () => {
    if (filterStatus === 'all') return requests;
    return requests.filter(request => request.status === filterStatus);
  };

  const getStatusColor = (status: string) => {;
    switch (status) {
      case 'pending': return '#FF9800';
      case 'approved': return '#4CAF50';
      case 'rejected': return '#F44336';
      case 'installed': return '#2196F3';
      default: return '#666';
    }
  };

  const getPriorityColor = (priority: string) => {;
    switch (priority) {
      case 'urgent': return '#D32F2F';
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#666';
    }
  };

  const renderStatusFilter = () => {
    const statuses = [
      { key: 'pending', label: 'Pending', color: '#FF9800' },
      { key: 'approved', label: 'Approved', color: '#4CAF50' },
      { key: 'rejected', label: 'Rejected', color: '#F44336' },
    ];

    const getStatusCount = (status: string) => {;
      if (status === 'all') return requests.length;
      return requests.filter(req => req.status === status).length;
    };

    return (
      <View style={styles.filterContainer}>
        <View style={styles.filterContent}>
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
        </View>
      </View>
    );
  };

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
                {item.farms?.name || 'Unknown Farm'}
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

        {/* User Info */}
        <View style={styles.userInfoContainer}>
          <Text style={styles.userInfoLabel}>Requested by:</Text>;
          <Text style={styles.userInfoText}>{item.profiles?.username || 'Unknown User'}</Text>
        </View>

        {/* Details */}
        <View style={styles.requestDetails}>
          <Text style={styles.detailLabel}>Installation Location:</Text>;
          <Text style={styles.detailText}>{item.installation_location}</Text>

          <Text style={styles.detailLabel}>Justification:</Text>;
          <Text style={styles.detailText}>{item.justification}</Text>

          <Text style={styles.detailLabel}>Budget Range:</Text>;
          <Text style={styles.detailText}>{item.budget_range}</Text>

          <Text style={styles.detailLabel}>Requested:</Text>;
          <Text style={styles.detailText}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>

        {/* Actions */}
        {item.status === 'pending' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleApproveRequest(item)}
              disabled={processingRequest === item.id}
            >
              <LinearGradient
                colors={['#4CAF50', '#45a049']}
                style={styles.actionButtonGradient}
              >
                {processingRequest === item.id ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={16} color="white" />
                    <Text style={styles.actionButtonText}>Approve</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleRejectRequest(item)}
              disabled={processingRequest === item.id}
            >
              <LinearGradient
                colors={['#F44336', '#D32F2F']}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="close" size={16} color="white" />
                <Text style={styles.actionButtonText}>Reject</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {item.admin_feedback && (
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackLabel}>Admin Feedback:</Text>;
            <Text style={styles.feedbackText}>{item.admin_feedback}</Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );

  if (loading) {
    return (
      <LinearGradient colors={['#e7fbe8ff', '#cdffcfff']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading sensor requests...</Text>
        </View>
      </LinearGradient>
    );
  }

  const filteredRequests = getFilteredRequests();

  return (
    <LinearGradient colors={['#e7fbe8ff', '#cdffcfff']} style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#4A90E2', '#357ABD', '#2E5B8A']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin: Sensor Requests</Text>;
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={refreshing}
        >
          <Ionicons name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Filter Tabs */}
      {renderStatusFilter()}

      {/* Content */}
      <View style={styles.content}>
        {filteredRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="hardware-chip-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              No {filterStatus === 'all' ? '' : filterStatus} sensor requests found
            </Text>
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

      {/* Feedback Modal */}
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
              <Text style={styles.modalTitle}>Reject Request with Feedback</Text>
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
                  <Text style={styles.summaryTitle}>Request Summary:</Text>;
                  <Text style={styles.summaryText}>Sensor: {currentRequest.sensor_type}</Text>
                  <Text style={styles.summaryText}>Farm: {currentRequest.farms?.name}</Text>
                  <Text style={styles.summaryText}>User: {currentRequest.profiles?.username}</Text>
                  <Text style={styles.summaryText}>Quantity: {currentRequest.quantity}</Text>
                </View>
              )}

              <View style={styles.feedbackInputContainer}>
                <Text style={styles.feedbackInputLabel}>Rejection Reason (Required):</Text>
                <TextInput
                  style={styles.feedbackInput}
                  value={adminFeedback}
                  onChangeText={setAdminFeedback}
                  placeholder="Please provide a reason for rejection..."
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
                style={styles.modalRejectButton}
                onPress={confirmRejectRequest}
                disabled={!adminFeedback.trim() || processingRequest !== null}
              >
                <LinearGradient
                  colors={['#F44336', '#D32F2F']}
                  style={styles.modalRejectButtonGradient}
                >
                  {processingRequest !== null ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.modalRejectText}>Reject Request</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <BottomNavigation />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {;
    flex: 1,
  },
  header: {;
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {;
    padding: 8,
  },
  headerTitle: {;
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  refreshButton: {;
    padding: 8,
  },
  filterContainer: {;
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  filterContent: {;
    paddingHorizontal: 15,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterButton: {;
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 2,
    borderRadius: 16,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.3)',
    flex: 1,
    justifyContent: 'center',
    minHeight: 36,
  },
  filterButtonActive: {;
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  filterText: {;
    fontSize: 12,
    fontWeight: '600',
    color: '#4A90E2',
    textAlign: 'center',
  },
  filterTextActive: {;
    color: 'white',
  },
  statusDot: {;
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  content: {;
    flex: 1,
    paddingHorizontal: 10,
  },
  loadingContainer: {;
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {;
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {;
    paddingVertical: 10,
    paddingBottom: 100,
  },
  requestCard: {;
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
  requestCardGradient: {;
    padding: 20,
  },
  requestHeader: {;
    marginBottom: 15,
  },
  sensorTypeHeader: {;
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sensorTypeInfo: {;
    flex: 1,
    marginLeft: 12,
  },
  sensorTypeName: {;
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  farmName: {;
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  quantityBadge: {;
    backgroundColor: '#4A90E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  quantityText: {;
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  statusContainer: {;
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {;
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {;
    fontSize: 11,
    fontWeight: 'bold',
    color: 'white',
  },
  priorityBadge: {;
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {;
    fontSize: 11,
    fontWeight: 'bold',
    color: 'white',
  },
  userInfoContainer: {;
    marginBottom: 15,
    padding: 10,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: 8,
  },
  userInfoLabel: {;
    fontSize: 12,
    fontWeight: '600',
    color: '#4A90E2',
    marginBottom: 2,
  },
  userInfoText: {;
    fontSize: 14,
    color: '#333',
  },
  requestDetails: {;
    marginBottom: 15,
  },
  detailLabel: {;
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
    marginBottom: 2,
  },
  detailText: {;
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  actionButtons: {;
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },
  actionButton: {;
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  approveButton: {},
  rejectButton: {},
  actionButtonGradient: {;
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 5,
  },
  actionButtonText: {;
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  feedbackContainer: {;
    marginTop: 15,
    padding: 12,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F44336',
  },
  feedbackLabel: {;
    fontSize: 12,
    fontWeight: '600',
    color: '#F44336',
    marginBottom: 4,
  },
  feedbackText: {;
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
  emptyContainer: {;
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {;
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
  },
  modalContainer: {;
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {;
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {;
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  modalTitle: {;
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  modalCloseButton: {;
    padding: 4,
  },
  modalScrollView: {;
    maxHeight: 400,
  },
  requestSummary: {;
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  summaryTitle: {;
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  summaryText: {;
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  feedbackInputContainer: {;
    padding: 20,
  },
  feedbackInputLabel: {;
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  feedbackInput: {;
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 100,
  },
  modalActions: {;
    flexDirection: 'row',
    padding: 20,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  modalCancelButton: {;
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#666',
    alignItems: 'center',
  },
  modalCancelText: {;
    color: '#666',
    fontWeight: 'bold',
  },
  modalRejectButton: {;
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  modalRejectButtonGradient: {;
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalRejectText: {;
    color: 'white',
    fontWeight: 'bold',
  },
});

export default AdminSensorRequests;
