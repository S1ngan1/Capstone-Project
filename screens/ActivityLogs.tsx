import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useAuthContext } from '../context/AuthContext'
import { activityLogService, ActivityLog } from '../utils/activityLogService'
import BottomNavigation from '../components/BottomNavigation'
interface ActivityLogsScreenProps {
  navigation: any
}
const ActivityLogsScreen: React.FC<ActivityLogsScreenProps> = ({ navigation }) => {
  const { user, userRole } = useAuthContext()
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({
    actionType: '',
    tableName: '',
    userId: '',
  })
  const [showFilters, setShowFilters] = useState(false)
  const isAdmin = userRole === 'admin'
  const fetchLogs = useCallback(async (pageNum = 1, reset = false) => {
    try {
      if (reset) {
        setLoading(true)
        // Mark activity logs as viewed when user opens the screen
        await activityLogService.markActivityLogsAsViewed()
      }
      const { data, count } = await activityLogService.getActivityLogs({
        page: pageNum,
        limit: 20,
        userId: filters.userId || (!isAdmin ? user?.id : undefined),
        actionType: filters.actionType || undefined,
        tableName: filters.tableName || undefined,
      })
      if (reset) {
        setLogs(data)
      } else {
        setLogs(prev => [...prev, ...data])
      }
      setHasMore(data.length === 20)
      setPage(pageNum)
    } catch (error) {
      console.error('Error fetching activity logs:', error)
      Alert.alert('Error', 'Failed to fetch activity logs')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [filters, isAdmin, user?.id])
  useEffect(() => {
    fetchLogs(1, true)
  }, [fetchLogs])
  const handleRefresh = () => {
    setRefreshing(true)
    fetchLogs(1, true)
  }
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchLogs(page + 1, false)
    }
  }
  const applyFilters = () => {
    setShowFilters(false)
    fetchLogs(1, true)
  }
  const clearFilters = () => {
    setFilters({ actionType: '', tableName: '', userId: '' })
    setShowFilters(false)
    fetchLogs(1, true)
  }
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'CREATE': return 'add-circle'
      case 'UPDATE': return 'create'
      case 'DELETE': return 'trash'
      case 'REQUEST': return 'paper-plane'
      case 'APPROVE': return 'checkmark-circle'
      case 'REJECT': return 'close-circle'
      default: return 'information-circle'
    }
  }
  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'CREATE': return '#4CAF50'
      case 'UPDATE': return '#2196F3'
      case 'DELETE': return '#f44336'
      case 'REQUEST': return '#FF9800'
      case 'APPROVE': return '#4CAF50'
      case 'REJECT': return '#f44336'
      default: return '#666'
    }
  }
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  const renderLogItem = ({ item }: { item: ActivityLog }) => (
    <View style={styles.logItem}>
      <View style={styles.logHeader}>
        <View style={styles.actionInfo}>
          <Ionicons
            name={getActionIcon(item.action_type)}
            size={24}
            color={getActionColor(item.action_type)}
          />
          <View style={styles.actionDetails}>
            <Text style={styles.actionType}>{item.action_type}</Text>
            <Text style={styles.tableName}>{item.table_name}</Text>
          </View>
        </View>
        <Text style={styles.timestamp}>{formatDate(item.created_at)}</Text>
      </View>
      <Text style={styles.description}>{item.description}</Text>
      {isAdmin && (
        <View style={styles.userInfo}>
          <Ionicons name="person" size={16} color="#666" />
          <Text style={styles.userText}>
            {item.username} ({item.email})
          </Text>
        </View>
      )}
      {item.record_id && (
        <Text style={styles.recordId}>Record ID: {item.record_id}</Text>
      )}
    </View>
  )
  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <Text style={styles.filtersTitle}>Filter Activity Logs</Text>
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Action Type:</Text>
        <View style={styles.filterOptions}>
          {['', 'CREATE', 'UPDATE', 'DELETE', 'REQUEST', 'APPROVE', 'REJECT'].map(action => (
            <TouchableOpacity
              key={action}
              style={[
                styles.filterOption,
                filters.actionType === action && styles.filterOptionSelected
              ]}
              onPress={() => setFilters(prev => ({ ...prev, actionType: action }))}
            >
              <Text style={[
                styles.filterOptionText,
                filters.actionType === action && styles.filterOptionTextSelected
              ]}>
                {action || 'All'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Table:</Text>
        <View style={styles.filterOptions}>
          {['', 'farms', 'farm_requests', 'sensor_requests', 'profiles'].map(table => (
            <TouchableOpacity
              key={table}
              style={[
                styles.filterOption,
                filters.tableName === table && styles.filterOptionSelected
              ]}
              onPress={() => setFilters(prev => ({ ...prev, tableName: table }))}
            >
              <Text style={[
                styles.filterOptionText,
                filters.tableName === table && styles.filterOptionTextSelected
              ]}>
                {table || 'All'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.filterButtons}>
        <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
          <LinearGradient colors={['#4CAF50', '#388E3C']} style={styles.applyButtonGradient}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  )
  const renderFooter = () => {
    if (!loading || logs.length === 0) return null
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#4CAF50" />
      </View>
    )
  }
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Activity Logs</Text>
      <Text style={styles.emptyMessage}>
        {isAdmin
          ? 'No user activities have been recorded yet.'
          : 'You haven\'t performed any tracked actions yet.'
        }
      </Text>
    </View>
  )
  return (
    <LinearGradient colors={['#E8F5E8', '#F0F8FF']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {isAdmin ? 'All User Activities' : 'My Activities'}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="filter" size={24} color="#4CAF50" />
          </TouchableOpacity>
        </View>
      </View>
      {showFilters && renderFilters()}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{logs.length}</Text>
          <Text style={styles.statLabel}>Activities</Text>
        </View>
        {isAdmin && (
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>All Users</Text>
            <Text style={styles.statLabel}>Scope</Text>
          </View>
        )}
      </View>
      {loading && logs.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading activities...</Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          renderItem={renderLogItem}
          keyExtractor={item => item.id}
          style={styles.list}
          contentContainerStyle={logs.length === 0 ? styles.emptyList : undefined}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#4CAF50']} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  filterButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filtersContainer: {
    backgroundColor: 'white',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  filterRow: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: 'white',
  },
  filterOptionSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  filterOptionText: {
    fontSize: 12,
    color: '#666',
  },
  filterOptionTextSelected: {
    color: 'white',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  applyButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
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
  list: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyList: {
    flexGrow: 1,
  },
  logItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionDetails: {
    gap: 2,
  },
  actionType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  tableName: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  description: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  userText: {
    fontSize: 12,
    color: '#666',
  },
  recordId: {
    fontSize: 10,
    color: '#999',
    fontFamily: 'monospace',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
})
export default ActivityLogsScreen
