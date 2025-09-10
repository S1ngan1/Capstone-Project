import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useAuthContext } from '../context/AuthContext'
import { activityLogService, Notification } from '../utils/activityLogService'
interface NotificationBellProps {
  navigation?: any
}
const NotificationBell: React.FC<NotificationBellProps> = ({ navigation }) => {
  const { user } = useAuthContext()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const count = await activityLogService.getUnreadNotificationCount()
      setUnreadCount(count)
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }
  // Fetch notifications
  const fetchNotifications = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      const { data } = await activityLogService.getNotifications({
        limit: 50
      })
      setNotifications(data)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }
  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await activityLogService.markNotificationAsRead(notificationId)
      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId
            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
            : notif
        )
      )
      // Update unread count
      fetchUnreadCount()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }
  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await activityLogService.markAllNotificationsAsRead()
      // Update local state
      setNotifications(prev =>
        prev.map(notif => ({
          ...notif,
          is_read: true,
          read_at: new Date().toISOString()
        }))
      )
      setUnreadCount(0)
      Alert.alert('Success', 'All notifications marked as read')
    } catch (error) {
      console.error('Error marking all as read:', error)
      Alert.alert('Error', 'Failed to mark notifications as read')
    }
  }
  // Subscribe to new notifications
  useEffect(() => {
    if (!user) return
    fetchUnreadCount()
    const subscription = activityLogService.subscribeToNotifications(
      user.id,
      (newNotification) => {
        setUnreadCount(prev => prev + 1)
        setNotifications(prev => [newNotification, ...prev])
      }
    )
    return () => {
      subscription.unsubscribe()
    }
  }, [user])
  // Handle bell press
  const handleBellPress = () => {
    setShowModal(true)
    if (notifications.length === 0) {
      fetchNotifications()
    }
  }
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return 'checkmark-circle'
      case 'warning': return 'warning'
      case 'error': return 'close-circle'
      default: return 'information-circle'
    }
  }
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return '#4CAF50'
      case 'warning': return '#FF9800'
      case 'error': return '#f44336'
      default: return '#2196F3'
    }
  }
  const renderNotificationItem = ({ item }: { item: Notification }) => {
    const handleNotificationPress = async () => {
      // Mark as read if unread
      if (!item.is_read) {
        await markAsRead(item.id)
      }
      // Handle navigation based on metadata or message content
      if (item.metadata) {
        try {
          const metadata = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata
          if (metadata.action === 'navigate' && metadata.screen) {
            setShowModal(false)
            navigation?.navigate(metadata.screen, metadata.params || {})
            return
          }
        } catch (error) {
          console.error('Error parsing notification metadata:', error)
        }
      }
      // Fallback navigation based on message content
      if (item.message.includes('farm request') || item.message.includes('Requested new farm')) {
        setShowModal(false)
        navigation?.navigate('UserRequests', { activeTab: 'farm' })
      } else if (item.message.includes('sensor request') || item.message.includes('sensor')) {
        setShowModal(false)
        navigation?.navigate('UserRequests', { activeTab: 'sensor' })
      }
    }
    const isClickable = item.metadata ||
                       item.message.includes('farm request') ||
                       item.message.includes('sensor request') ||
                       item.message.includes('Approved') ||
                       item.message.includes('rejected')
    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          !item.is_read && styles.unreadItem,
          isClickable && styles.clickableItem
        ]}
        onPress={handleNotificationPress}
        disabled={!isClickable}
      >
        <View style={styles.notificationHeader}>
          <View style={styles.notificationInfo}>
            <Ionicons
              name={getNotificationIcon(item.type)}
              size={20}
              color={getNotificationColor(item.type)}
            />
            <Text style={[styles.notificationTitle, !item.is_read && styles.unreadText]}>
              {item.title}
            </Text>
            {isClickable && (
              <Ionicons name="open-outline" size={16} color="#007BFF" style={styles.clickIcon} />
            )}
          </View>
          <View style={styles.notificationMeta}>
            <Text style={styles.timeAgo}>{formatTimeAgo(item.created_at)}</Text>
            {!item.is_read && <View style={styles.unreadDot} />}
          </View>
        </View>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        {isClickable && (
          <Text style={styles.tapHint}>Tap to view details</Text>
        )}
      </TouchableOpacity>
    )
  }
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Notifications</Text>
      <Text style={styles.emptyMessage}>You're all caught up!</Text>
    </View>
  )
  return (
    <>
      <TouchableOpacity style={styles.bellContainer} onPress={handleBellPress}>
        <Ionicons name="notifications" size={24} color="#333" />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount.toString()}
            </Text>
          </View>
        )}
      </TouchableOpacity>
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowModal(false)}
      >
        <LinearGradient colors={['#E8F5E8', '#F0F8FF']} style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowModal(false)}
            >
              <Ionicons name="arrow-back" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Notifications</Text>
            {notifications.some(n => !n.is_read) && (
              <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
                <Text style={styles.markAllText}>Mark All Read</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.notificationStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{notifications.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#f44336' }]}>{unreadCount}</Text>
              <Text style={styles.statLabel}>Unread</Text>
            </View>
          </View>
          {loading && notifications.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>Loading notifications...</Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              renderItem={renderNotificationItem}
              keyExtractor={item => item.id}
              style={styles.notificationsList}
              contentContainerStyle={notifications.length === 0 ? styles.emptyList : undefined}
              onRefresh={() => fetchNotifications(true)}
              refreshing={refreshing}
              ListEmptyComponent={renderEmptyState}
              showsVerticalScrollIndicator={false}
            />
          )}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => {
                setShowModal(false)
                navigation?.navigate('ActivityLogs')
              }}
            >
              <LinearGradient colors={['#4CAF50', '#388E3C']} style={styles.viewAllGradient}>
                <Ionicons name="list" size={20} color="white" />
                <Text style={styles.viewAllText}>View All Activities</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Modal>
    </>
  )
}
const styles = StyleSheet.create({
  bellContainer: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#f44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  markAllButton: {
    padding: 8,
  },
  markAllText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  notificationStats: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginVertical: 10,
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
  notificationsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyList: {
    flexGrow: 1,
  },
  notificationItem: {
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
  unreadItem: {
    backgroundColor: '#F0F8FF',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  clickableItem: {
    borderColor: '#007BFF',
    borderWidth: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  unreadText: {
    fontWeight: 'bold',
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeAgo: {
    fontSize: 12,
    color: '#999',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
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
  },
  modalFooter: {
    padding: 20,
    paddingBottom: 40,
  },
  viewAllButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  viewAllGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  viewAllText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  tapHint: {
    marginTop: 8,
    fontSize: 12,
    color: '#007BFF',
    fontStyle: 'italic',
  },
  clickIcon: {
    marginLeft: 8,
  },
})
export default NotificationBell
