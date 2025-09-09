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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../context/AuthContext';

interface FarmRequest {
  id: string;
  farm_name: string;
  location: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  admin_feedback?: string; // Add admin feedback field
  created_at: string;
  processed_at?: string;
}

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const UserFarmRequests: React.FC<Props> = ({ onClose, onSuccess }) => {
  const { session } = useAuthContext();
  const [requests, setRequests] = useState<FarmRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('all');

  useEffect(() => {
    fetchUserRequests();
  }, []);

  const fetchUserRequests = async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('farm_requests')
        .select('*')
        .eq('requested_by', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user requests:', error);
        Alert.alert('Error', 'Failed to fetch your farm requests');
        return;
      }

      setRequests(data || []);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUserRequests();
  };

  const handleDeleteRequest = async (requestId: string, status: string) => {;
    // Only allow deletion of pending requests
    if (status !== 'pending') {
      Alert.alert(
        'Cannot Delete',
        'You can only delete pending requests. Approved and rejected requests are kept as logs.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Delete Request',
      'Are you sure you want to delete this pending farm request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {;
            try {
              const { error } = await supabase
                .from('farm_requests')
                .delete()
                .eq('id', requestId)
                .eq('requested_by', session?.user?.id)
                .eq('status', 'pending'); // Additional security check - only delete pending

              if (error) {
                throw new Error(error.message);
              }

              Alert.alert('Success', 'Pending farm request deleted successfully');
              fetchUserRequests();
              onSuccess();
            } catch (error: any) {;
              console.error('Error deleting request:', error);
              Alert.alert('Error', error.message || 'Failed to delete request');
            }
          },
        },
      ]
    );
  };

  const handleFilterChange = (filter: 'pending' | 'approved' | 'rejected' | 'all') => {;
    setSelectedFilter(filter);
  };

  const getFilteredRequests = () => {
    if (selectedFilter === 'all') {
      return requests;
    }
    return requests.filter(request => request.status === selectedFilter);
  };

  const getStatusColor = (status: string) => {;
    switch (status) {
      case 'pending': return '#FF9800';
      case 'approved': return '#4CAF50';
      case 'rejected': return '#F44336';
      default: return '#666';
    }
  };

  const getStatusIcon = (status: string) => {;
    switch (status) {
      case 'pending': return 'time-outline';
      case 'approved': return 'checkmark-circle';
      case 'rejected': return 'close-circle';
      default: return 'help-circle';
    }
  };

  const getStatusMessage = (status: string) => {;
    switch (status) {
      case 'pending': return 'Your request is being reviewed by an administrator';
      case 'approved': return 'Your farm has been created and you now have access';
      case 'rejected': return 'Your request was not approved';
      default: return 'Status unknown';
    }
  };

  const renderRequestItem = ({ item }: { item: FarmRequest }) => (
    <View style={styles.requestCard}>
      <LinearGradient
        colors={['#ffffff', '#f8f9fa']}
        style={styles.requestCardGradient}
      >
        {/* Request Header */}
        <View style={styles.requestHeader}>
          <View style={styles.requestInfo}>
            <Text style={styles.farmName}>{item.farm_name}</Text>
            <Text style={styles.location}>📍 {item.location}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Ionicons
              name={getStatusIcon(item.status) as any}
              size={14}
              color="white"
            />
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>

        {/* Status Message */}
        <View style={styles.statusMessageContainer}>
          <Text style={styles.statusMessage}>{getStatusMessage(item.status)}</Text>
        </View>

        {/* Request Details */}
        {item.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Your Notes:</Text>;
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        )}

        {/* Admin Feedback - Show for rejected requests */}
        {item.status === 'rejected' && item.admin_feedback && (
          <View style={styles.adminFeedbackContainer}>
            <Text style={styles.adminFeedbackLabel}>Reason for Rejection:</Text>;
            <Text style={styles.adminFeedbackText}>{item.admin_feedback}</Text>
          </View>
        )}

        {/* Dates */}
        <View style={styles.datesContainer}>
          <Text style={styles.dateText}>
            Requested: {new Date(item.created_at).toLocaleDateString()}
          </Text>
          {item.processed_at && (
            <Text style={styles.dateText}>
              {item.status === 'approved' ? 'Approved' : 'Processed'}: {new Date(item.processed_at).toLocaleDateString()}
            </Text>
          )}
        </View>

        {/* Action Button - Only show delete for pending requests */}
        {item.status === 'pending' && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteRequest(item.id, item.status)}
          >
            <Ionicons name="trash-outline" size={16} color="#F44336" />
            <Text style={styles.deleteButtonText}>Delete Request</Text>
          </TouchableOpacity>
        )}

        {/* Status info for approved/rejected requests */}
        {(item.status === 'approved' || item.status === 'rejected') && (
          <View style={styles.logInfoContainer}>
            <Ionicons name="information-circle-outline" size={16} color="#666" />
            <Text style={styles.logInfoText}>
              This {item.status} request is kept as a permanent log and cannot be deleted.
            </Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-outline" size={64} color="#666" />
      <Text style={styles.emptyTitle}>No Farm Requests</Text>
      <Text style={styles.emptySubtitle}>
        You haven't submitted any farm requests yet. Create your first farm request to get started!
      </Text>
      <TouchableOpacity
        style={styles.createRequestButton}
        onPress={onClose} // Close this modal so user can create a new request
      >
        <LinearGradient
          colors={['#4CAF50', '#45a049', '#388e3c']}
          style={styles.createRequestButtonGradient}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.createRequestButtonText}>Create Request</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  return (
    <LinearGradient
      colors={['#e7fbe8ff', '#cdffcfff']}
      style={styles.container}
    >
      {/* Header */}
      <LinearGradient
        colors={['#4A90E2', '#357ABD', '#2E5B8A']}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Farm Requests</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Ionicons name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Merged Stats and Filter Container - Clickable for Both Display and Filtering */}
      {requests.length > 0 && (
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
      )}

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
  statsContainer: {;
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
  statItem: {;
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    minWidth: 60,
  },
  statItemActive: {;
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  statNumber: {;
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statNumberActive: {;
    color: '#4A90E2',
  },
  statLabel: {;
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  statLabelActive: {;
    color: '#4A90E2',
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
    paddingBottom: 20,
  },
  requestCard: {;
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  requestInfo: {;
    flex: 1,
    marginRight: 10,
  },
  farmName: {;
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  location: {;
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statusBadge: {;
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  statusText: {;
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  statusMessageContainer: {;
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  statusMessage: {;
    fontSize: 14,
    color: '#4A90E2',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  notesContainer: {;
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  notesLabel: {;
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 4,
  },
  notesText: {;
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  adminFeedbackContainer: {;
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  adminFeedbackLabel: {;
    fontSize: 12,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 4,
  },
  adminFeedbackText: {;
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  datesContainer: {;
    marginBottom: 15,
  },
  dateText: {;
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  deleteButton: {;
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F44336',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    gap: 5,
    marginBottom: 10,
  },
  deleteButtonText: {;
    color: '#F44336',
    fontSize: 14,
    fontWeight: '600',
  },
  logInfoContainer: {;
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(158, 158, 158, 0.1)',
    borderRadius: 8,
    gap: 8,
  },
  logInfoText: {;
    fontSize: 12,
    color: '#666',
    flex: 1,
    lineHeight: 16,
  },
  emptyContainer: {;
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {;
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {;
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  createRequestButton: {;
    borderRadius: 10,
    overflow: 'hidden',
  },
  createRequestButtonGradient: {;
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  createRequestButtonText: {;
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default UserFarmRequests;
