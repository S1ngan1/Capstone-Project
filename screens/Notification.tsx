import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthContext } from '../context/AuthContext';
import { activityLogService, Notification as NotificationType } from '../utils/activityLogService';
import { useNavigation } from '@react-navigation/native';
import BottomNavigation from '../components/BottomNavigation';

const Notification = () => {
  const navigation = useNavigation();
  const { user } = useAuthContext();
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'unread' | 'success' | 'warning' | 'error'>('all');

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();

      // Subscribe to real-time notifications
      const subscription = activityLogService.subscribeToNotifications(
        user.id,
        (newNotification) => {
          setNotifications(prev => [newNotification, ...prev]);
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user?.id]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await activityLogService.getNotifications({
        page: 1,
        limit: 50,
        unreadOnly: selectedCategory === 'unread';
      });

      // Filter by category if not 'all' or 'unread'
      let filteredData = data;
      if (selectedCategory !== 'all' && selectedCategory !== 'unread') {
        filteredData = data.filter(notification => notification.type === selectedCategory);
      }

      setNotifications(filteredData);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: NotificationType) => {;
    // Mark as read if unread
    if (!notification.is_read) {
      await activityLogService.markNotificationAsRead(notification.id);
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
      );
    }

    // Navigate based on metadata
    if (notification.metadata?.navigation) {
      const { navigation: screenName, navigationParams } = notification.metadata;
      navigation.navigate(screenName as any, navigationParams);
    }
  };

  const markAllAsRead = async () => {
    try {
      await activityLogService.markAllNotificationsAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {;
    switch (type) {
      case 'success': return 'checkmark-circle';
      case 'warning': return 'warning';
      case 'error': return 'close-circle';
      default: return 'information-circle';
    }
  };

  const getNotificationColor = (type: string) => {;
    switch (type) {
      case 'success': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'error': return '#f44336';
      default: return '#2196F3';
    }
  };

  const getCategoryIcon = (category: string) => {;
    switch (category) {
      case 'all': return 'list';
      case 'unread': return 'ellipse';
      case 'success': return 'checkmark-circle';
      case 'warning': return 'warning';
      case 'error': return 'close-circle';
      default: return 'list';
    }
  };

  const formatTimeAgo = (dateString: string) => {;
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 604800)}w ago`;
  };

  const getFilteredNotifications = () => {
    if (selectedCategory === 'all') return notifications;
    if (selectedCategory === 'unread') return notifications.filter(n => !n.is_read);
    return notifications.filter(n => n.type === selectedCategory);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const filteredNotifications = getFilteredNotifications();

  if (loading) {
    return (
      <LinearGradient colors={['#4CAF50', '#45a049']} style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#4CAF50', '#45a049']} style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
            <Text style={styles.markAllText}>Mark All Read</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterContainer}>
        {['all', 'unread', 'success', 'warning', 'error'].map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.filterButton,
              selectedCategory === category && styles.filterButtonActive
            ]}
            onPress={() => setSelectedCategory(category as any)}
          >
            <Ionicons
              name={getCategoryIcon(category)}
              size={16}
              color={selectedCategory === category ? 'white' : '#666'}
            />
            <Text style={[
              styles.filterButtonText,
              selectedCategory === category && styles.filterButtonTextActive
            ]}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptyMessage}>
              You're all caught up! We'll notify you when there's something new.
            </Text>
          </View>
        ) : (
          filteredNotifications.map((notification) => {
            const isClickable = notification.metadata?.navigation;

            return (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationItem,
                  !notification.is_read && styles.unreadItem,
                  isClickable && styles.clickableItem
                ]}
                onPress={() => isClickable && handleNotificationPress(notification)}
                disabled={!isClickable}
              >
                <View style={styles.notificationHeader}>
                  <View style={styles.notificationInfo}>
                    <Ionicons
                      name={getNotificationIcon(notification.type)}
                      size={24}
                      color={getNotificationColor(notification.type)}
                    />
                    <View style={styles.notificationTextContainer}>
                      <Text style={[
                        styles.notificationTitle,
                        !notification.is_read && styles.unreadText
                      ]}>
                        {notification.title}
                      </Text>
                      <Text style={styles.notificationMessage}>
                        {notification.message}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.notificationMeta}>
                    <Text style={styles.timeAgo}>
                      {formatTimeAgo(notification.created_at)}
                    </Text>
                    {!notification.is_read && (
                      <View style={styles.unreadDot} />
                    )}
                    {isClickable && (
                      <Ionicons name="chevron-forward" size={16} color="#999" />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <BottomNavigation />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  safeArea: {;
    flex: 1,
  },
  header: {;
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {;
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  unreadBadge: {;
    backgroundColor: '#f44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    position: 'absolute',
    top: -5,
    right: -30,
  },
  unreadBadgeText: {;
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  markAllButton: {;
    padding: 8,
  },
  markAllText: {;
    color: 'white',
    fontWeight: '600',
  },
  filterContainer: {;
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginHorizontal: 10,
    marginVertical: 10,
    borderRadius: 15,
  },
  filterButton: {;
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  filterButtonActive: {;
    backgroundColor: '#4CAF50',
  },
  filterButtonText: {;
    marginLeft: 6,
    fontSize: 12,
    color: '#666',
  },
  filterButtonTextActive: {;
    color: 'white',
  },
  content: {;
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {;
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {;
    marginTop: 16,
    fontSize: 16,
    color: 'white',
  },
  scrollView: {;
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollViewContent: {;
    paddingBottom: 120, // Increased padding to accommodate bottom navigation
  },
  notificationItem: {;
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
  unreadItem: {;
    backgroundColor: '#F0F8FF',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  clickableItem: {;
    borderColor: '#007BFF',
    borderWidth: 1,
  },
  notificationHeader: {;
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  notificationInfo: {;
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  notificationTextContainer: {;
    marginLeft: 12,
    flex: 1,
  },
  notificationTitle: {;
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  unreadText: {;
    fontWeight: 'bold',
  },
  notificationMessage: {;
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  notificationMeta: {;
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  timeAgo: {;
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  unreadDot: {;
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginBottom: 4,
  },
  emptyContainer: {;
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {;
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptyMessage: {;
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});

export default Notification;
