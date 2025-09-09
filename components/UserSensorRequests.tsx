import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthContext } from '../context/AuthContext';
import {
  SensorRequest,
  SENSOR_TYPES,
  BUDGET_RANGES,
  PRIORITY_LEVELS,
  STATUS_INFO
} from '../interfaces/SensorRequest';
import { SensorRequestService } from '../hooks/useSensorRequests';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  farmId?: string;
}

const UserSensorRequests: React.FC<Props> = ({ onClose, onSuccess, farmId }) => {
  const { session } = useAuthContext();
  const [requests, setRequests] = useState<SensorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'pending' | 'approved' | 'rejected' | 'installed' | 'cancelled' | 'all'>('all');
  const [selectedRequest, setSelectedRequest] = useState<SensorRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchUserRequests();
  }, [farmId]);

  const fetchUserRequests = async () => {
    try {
      setLoading(true);
      const data = await SensorRequestService.getUserRequests(session?.user?.id, farmId);
      setRequests(data);
    } catch (error: any) {;
      console.error('Error fetching sensor requests:', error);
      Alert.alert('Error', 'Failed to fetch your sensor requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUserRequests();
  };

  const handleCancelRequest = async (request: SensorRequest) => {;
    if (!SensorRequestService.canUserCancelRequest(request, session?.user?.id || '')) {
      Alert.alert('Cannot Cancel', 'This request cannot be cancelled at this time.');
      return;
    }

    Alert.alert(
      'Cancel Request',
      `Are you sure you want to cancel the ${SENSOR_TYPES[request.sensor_type].name} request?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {;
            try {
              await SensorRequestService.cancelRequest(request.id, 'Cancelled by user');
              Alert.alert('Success', 'Request cancelled successfully');
              fetchUserRequests();
              onSuccess();
            } catch (error: any) {;
              console.error('Error cancelling request:', error);
              Alert.alert('Error', error.message || 'Failed to cancel request');
            }
          },
        },
      ]
    );
  };

  const handleFilterChange = (filter: typeof selectedFilter) => {;
    setSelectedFilter(filter);
  };

  const getFilteredRequests = () => {
    if (selectedFilter === 'all') {
      return requests;
    }
    return requests.filter(request => request.status === selectedFilter);
  };

  const showRequestDetails = (request: SensorRequest) => {;
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const getStatusMessage = (status: SensorRequest['status']): string => {;
    switch (status) {
      case 'pending': return 'Your request is being reviewed by administrators';
      case 'approved': return 'Your request has been approved and is being processed';
      case 'rejected': return 'Your request was not approved';
      case 'installed': return 'Your sensor has been successfully installed';
      case 'cancelled': return 'This request was cancelled';
      default: return 'Status unknown';
    }
  };

  const renderRequestItem = ({ item }: { item: SensorRequest }) => {
    const sensorType = SENSOR_TYPES[item.sensor_type];
    const statusInfo = STATUS_INFO[item.status];
    const canCancel = SensorRequestService.canUserCancelRequest(item, session?.user?.id || '');

    return (
      <TouchableOpacity
        style={styles.requestCard}
        onPress={() => showRequestDetails(item)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={['#ffffff', '#f8f9fa']}
          style={styles.requestCardGradient}
        >
          {/* Header */}
          <View style={styles.requestHeader}>
            <View style={styles.requestInfo}>
              <View style={styles.sensorTypeHeader}>
                <Ionicons name={sensorType.icon as any} size={20} color="#4A90E2" />
                <Text style={styles.sensorTypeName}>{sensorType.name}</Text>
                {item.quantity > 1 && (
                  <View style={styles.quantityBadge}>
                    <Text style={styles.quantityText}>{item.quantity}x</Text>
                  </View>
                )}
              </View>
              <Text style={styles.farmName}>📍 {item.farm?.name}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
              <Ionicons name={statusInfo.icon as any} size={14} color="white" />
              <Text style={styles.statusText}>{statusInfo.label}</Text>
            </View>
          </View>

          {/* Status Message */}
          <View style={styles.statusMessageContainer}>
            <Text style={styles.statusMessage}>{getStatusMessage(item.status)}</Text>
          </View>

          {/* Priority and Budget */}
          <View style={styles.detailsRow}>
            <View style={styles.priorityContainer}>
              <View style={[
                styles.priorityDot,
                { backgroundColor: PRIORITY_LEVELS[item.priority_level].color }
              ]} />
              <Text style={styles.priorityText}>
                {PRIORITY_LEVELS[item.priority_level].label} Priority
              </Text>
            </View>
            <Text style={styles.budgetText}>
              💰 {BUDGET_RANGES[item.budget_range]}
            </Text>
          </View>

          {/* Installation Location */}
          <View style={styles.locationContainer}>
            <Text style={styles.locationLabel}>Installation Location:</Text>;
            <Text style={styles.locationText} numberOfLines={2}>
              {item.installation_location}
            </Text>
          </View>

          {/* Admin Feedback for rejected requests */}
          {item.status === 'rejected' && item.admin_feedback && (
            <View style={styles.feedbackContainer}>
              <Text style={styles.feedbackLabel}>Reason for Rejection:</Text>;
              <Text style={styles.feedbackText}>{item.admin_feedback}</Text>
            </View>
          )}

          {/* Installation info for approved/installed requests */}
          {(item.status === 'approved' || item.status === 'installed') && (
            <View style={styles.approvalContainer}>
              {item.estimated_cost && (
                <Text style={styles.approvalText}>
                  💵 Estimated Cost: ${item.estimated_cost.toFixed(2)}
                </Text>
              )}
              {item.installation_date && (
                <Text style={styles.approvalText}>
                  📅 {item.status === 'installed' ? 'Installed' : 'Scheduled'}: {
                    new Date(item.installation_date).toLocaleDateString()
                  }
                </Text>
              )}
            </View>
          )}

          {/* Dates */}
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

          {/* Action Button */}
          {canCancel && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancelRequest(item)}
            >
              <Ionicons name="close-circle-outline" size={16} color="#F44336" />
              <Text style={styles.cancelButtonText}>Cancel Request</Text>
            </TouchableOpacity>
          )}

          {/* Info for non-cancellable requests */}
          {(item.status === 'approved' || item.status === 'rejected' || item.status === 'installed') && (
            <View style={styles.logInfoContainer}>
              <Ionicons name="information-circle-outline" size={16} color="#666" />
              <Text style={styles.logInfoText}>
                This {item.status} request is kept as a permanent log.
              </Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="hardware-chip-outline" size={64} color="#666" />
      <Text style={styles.emptyTitle}>No Sensor Requests</Text>
      <Text style={styles.emptySubtitle}>
        You haven't submitted any sensor requests yet. Create your first sensor request to get started!
      </Text>
      <TouchableOpacity
        style={styles.createRequestButton}
        onPress={onClose}
      >
        <LinearGradient
          colors={['#4CAF50', '#45a049', '#388e3c']}
          style={styles.createRequestButtonGradient}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.createRequestButtonText}>Request Sensor</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderStatsContainer = () => {
    const pendingCount = requests.filter(r => r.status === 'pending').length;
    const approvedCount = requests.filter(r => r.status === 'approved').length;
    const rejectedCount = requests.filter(r => r.status === 'rejected').length;
    const installedCount = requests.filter(r => r.status === 'installed').length;
    const cancelledCount = requests.filter(r => r.status === 'cancelled').length;

    return (
      <View style={styles.statsContainer}>
        <TouchableOpacity
          style={[styles.statItem, selectedFilter === 'pending' && styles.statItemActive]}
          onPress={() => handleFilterChange('pending')}
        >
          <Text style={[styles.statNumber, selectedFilter === 'pending' && styles.statNumberActive]}>
            {pendingCount}
          </Text>
          <Text style={[styles.statLabel, { color: '#FF9800' }, selectedFilter === 'pending' && styles.statLabelActive]}>
            Pending
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statItem, selectedFilter === 'approved' && styles.statItemActive]}
          onPress={() => handleFilterChange('approved')}
        >
          <Text style={[styles.statNumber, selectedFilter === 'approved' && styles.statNumberActive]}>
            {approvedCount}
          </Text>
          <Text style={[styles.statLabel, { color: '#4CAF50' }, selectedFilter === 'approved' && styles.statLabelActive]}>
            Approved
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statItem, selectedFilter === 'installed' && styles.statItemActive]}
          onPress={() => handleFilterChange('installed')}
        >
          <Text style={[styles.statNumber, selectedFilter === 'installed' && styles.statNumberActive]}>
            {installedCount}
          </Text>
          <Text style={[styles.statLabel, { color: '#2196F3' }, selectedFilter === 'installed' && styles.statLabelActive]}>
            Installed
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statItem, selectedFilter === 'all' && styles.statItemActive]}
          onPress={() => handleFilterChange('all')}
        >
          <Text style={[styles.statNumber, selectedFilter === 'all' && styles.statNumberActive]}>
            {requests.length}
          </Text>
          <Text style={[styles.statLabel, { color: '#666' }, selectedFilter === 'all' && styles.statLabelActive]}>
            All
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#e7fbe8ff', '#cdffcfff']} style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#4A90E2', '#357ABD', '#2E5B8A']}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Sensor Requests</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Ionicons name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Stats Container - Clickable for Both Display and Filtering */}
      {requests.length > 0 && renderStatsContainer()}

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Loading your requests...</Text>
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

      {/* Request Details Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailsModal(false)}
      >
        {selectedRequest && (
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <LinearGradient
                colors={['#4A90E2', '#357ABD']}
                style={styles.modalHeader}
              >
                <Text style={styles.modalTitle}>Request Details</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowDetailsModal(false)}
                >
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </LinearGradient>

              <ScrollView style={styles.modalScrollView}>
                {/* Sensor Information */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Sensor Information</Text>
                  <View style={styles.detailRow}>
                    <Ionicons name={SENSOR_TYPES[selectedRequest.sensor_type].icon as any} size={20} color="#4A90E2" />
                    <Text style={styles.detailText}>
                      {selectedRequest.quantity}x {SENSOR_TYPES[selectedRequest.sensor_type].name}
                    </Text>
                  </View>
                  {selectedRequest.sensor_brand && (
                    <Text style={styles.detailText}>Brand: {selectedRequest.sensor_brand}</Text>
                  )}
                  {selectedRequest.sensor_model && (
                    <Text style={styles.detailText}>Model: {selectedRequest.sensor_model}</Text>
                  )}
                </View>

                {/* Installation Details */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Installation Details</Text>
                  <Text style={styles.detailLabel}>Location:</Text>;
                  <Text style={styles.detailText}>{selectedRequest.installation_location}</Text>

                  <Text style={styles.detailLabel}>Justification:</Text>;
                  <Text style={styles.detailText}>{selectedRequest.justification}</Text>

                  {selectedRequest.technical_requirements && (
                    <>
                      <Text style={styles.detailLabel}>Technical Requirements:</Text>;
                      <Text style={styles.detailText}>{selectedRequest.technical_requirements}</Text>
                    </>
                  )}
                </View>

                {/* Budget & Priority */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Budget & Priority</Text>
                  <Text style={styles.detailText}>
                    Budget: {BUDGET_RANGES[selectedRequest.budget_range]}
                  </Text>
                  <View style={styles.priorityDetail}>
                    <View style={[
                      styles.priorityDot,
                      { backgroundColor: PRIORITY_LEVELS[selectedRequest.priority_level].color }
                    ]} />
                    <Text style={styles.detailText}>
                      {PRIORITY_LEVELS[selectedRequest.priority_level].label} Priority
                    </Text>
                  </View>
                </View>

                {/* Status Information */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Status Information</Text>
                  <View style={styles.statusDetail}>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: STATUS_INFO[selectedRequest.status].color }
                    ]}>
                      <Ionicons name={STATUS_INFO[selectedRequest.status].icon as any} size={16} color="white" />
                      <Text style={styles.statusText}>{STATUS_INFO[selectedRequest.status].label}</Text>
                    </View>
                  </View>
                  <Text style={styles.detailText}>{getStatusMessage(selectedRequest.status)}</Text>

                  {selectedRequest.admin_feedback && (
                    <>
                      <Text style={styles.detailLabel}>Admin Feedback:</Text>;
                      <Text style={styles.detailText}>{selectedRequest.admin_feedback}</Text>
                    </>
                  )}

                  {selectedRequest.estimated_cost && (
                    <Text style={styles.detailText}>
                      Estimated Cost: ${selectedRequest.estimated_cost.toFixed(2)}
                    </Text>
                  )}

                  {selectedRequest.installation_date && (
                    <Text style={styles.detailText}>
                      Installation Date: {new Date(selectedRequest.installation_date).toLocaleDateString()}
                    </Text>
                  )}
                </View>

                {/* Dates */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Timeline</Text>
                  <Text style={styles.detailText}>
                    Requested: {new Date(selectedRequest.created_at).toLocaleString()}
                  </Text>
                  {selectedRequest.processed_at && (
                    <Text style={styles.detailText}>
                      Processed: {new Date(selectedRequest.processed_at).toLocaleString()}
                    </Text>
                  )}
                  <Text style={styles.detailText}>
                    Last Updated: {new Date(selectedRequest.updated_at).toLocaleString()}
                  </Text>
                </View>
              </ScrollView>

              {/* Modal Actions */}
              {SensorRequestService.canUserCancelRequest(selectedRequest, session?.user?.id || '') && (
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => {
                      setShowDetailsModal(false);
                      setTimeout(() => handleCancelRequest(selectedRequest), 300);
                    }}
                  >
                    <Text style={styles.modalCancelText}>Cancel Request</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {;
    flex: 1,
  },
  header: {;
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
  },
  backButton: {;
    position: 'absolute',
    left: 16,
    top: 16,
  },
  refreshButton: {;
    position: 'absolute',
    right: 16,
    top: 16,
  },
  headerTitle: {;
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  content: {;
    flex: 1,
    padding: 16,
  },
  requestCard: {;
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  requestCardGradient: {;
    padding: 16,
  },
  requestHeader: {;
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestInfo: {;
    flexDirection: 'column',
  },
  sensorTypeHeader: {;
    flexDirection: 'row',
    alignItems: 'center',
  },
  sensorTypeName: {;
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
    color: '#333',
  },
  quantityBadge: {;
    backgroundColor: '#e1f5fe',
    borderRadius: 12,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginLeft: 8,
  },
  quantityText: {;
    fontSize: 14,
    fontWeight: '500',
    color: '#01579b',
  },
  farmName: {;
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statusBadge: {;
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  statusText: {;
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
    marginLeft: 4,
  },
  statusMessageContainer: {;
    marginTop: 8,
  },
  statusMessage: {;
    fontSize: 14,
    color: '#666',
  },
  detailsRow: {;
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  priorityContainer: {;
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityDot: {;
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  priorityText: {;
    fontSize: 14,
    color: '#333',
  },
  budgetText: {;
    fontSize: 14,
    fontWeight: '500',
    color: '#4CAF50',
  },
  locationContainer: {;
    marginTop: 8,
  },
  locationLabel: {;
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  locationText: {;
    fontSize: 14,
    color: '#666',
  },
  feedbackContainer: {;
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f8d7da',
  },
  feedbackLabel: {;
    fontSize: 14,
    fontWeight: '500',
    color: '#721c24',
  },
  feedbackText: {;
    fontSize: 14,
    color: '#721c24',
    marginTop: 4,
  },
  approvalContainer: {;
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#d1e7dd',
  },
  approvalText: {;
    fontSize: 14,
    color: '#0f5132',
  },
  datesContainer: {;
    marginTop: 8,
  },
  dateText: {;
    fontSize: 12,
    color: '#999',
  },
  cancelButton: {;
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f44336',
  },
  cancelButtonText: {;
    fontSize: 14,
    color: 'white',
    marginLeft: 4,
  },
  logInfoContainer: {;
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#e7f3fe',
    flexDirection: 'row',
    alignItems: 'center',
  },
  logInfoText: {;
    fontSize: 14,
    color: '#0c5460',
    marginLeft: 8,
  },
  emptyContainer: {;
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyTitle: {;
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  emptySubtitle: {;
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  createRequestButton: {;
    marginTop: 24,
    borderRadius: 8,
    overflow: 'hidden',
  },
  createRequestButtonGradient: {;
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  createRequestButtonText: {;
    fontSize: 16,
    color: 'white',
    marginLeft: 8,
  },
  statsContainer: {;
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  statItem: {;
    flex: 1,
    alignItems: 'center',
  },
  statItemActive: {;
    backgroundColor: '#e8f5e9',
  },
  statNumber: {;
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statNumberActive: {;
    color: '#4CAF50',
  },
  statLabel: {;
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statLabelActive: {;
    color: '#4CAF50',
  },
  modalContainer: {;
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 0,
  },
  modalContent: {;
    width: '90%',
    maxWidth: 600,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
  },
  modalHeader: {;
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  modalTitle: {;
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  modalCloseButton: {;
    position: 'absolute',
    right: 16,
    top: 16,
  },
  modalScrollView: {;
    padding: 16,
  },
  detailSection: {;
    marginBottom: 16,
  },
  detailSectionTitle: {;
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  detailLabel: {;
    fontSize: 14,
    color: '#333',
    marginTop: 8,
  },
  detailText: {;
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  priorityDetail: {;
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDetail: {;
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusBadge: {;
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  statusText: {;
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
    marginLeft: 4,
  },
  modalActions: {;
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalCancelButton: {;
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#f44336',
  },
  modalCancelText: {;
    fontSize: 16,
    color: 'white',
  },
});

export default UserSensorRequests;
