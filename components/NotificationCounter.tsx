import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthContext } from '../context/AuthContext';
import { activityLogService } from '../utils/activityLogService';

interface NotificationCounterProps {
  navigation?: any;
  onPress?: () => void;
  showIcon?: boolean;
  iconSize?: number;
  iconColor?: string;
}

const NotificationCounter: React.FC<NotificationCounterProps> = ({;
  navigation,
  onPress,
  showIcon = true,
  iconSize = 24,
  iconColor = '#333'
}) => {
  const { user } = useAuthContext();
  const [unreadCount, setUnreadCount] = useState(0);
  const subscriptionRef = useRef<any>(null);

  // Fetch unread notification count
  const fetchUnreadCount = async () => {
    try {
      const count = await activityLogService.getUnreadNotificationCount();
      setUnreadCount(count);
      console.log(`Unread notifications count: ${count}`);
    } catch (error) {
      console.error('Error fetching unread notification count:', error);
    }
  };

  // Subscribe to new notifications
  useEffect(() => {
    if (!user?.id) {
      setUnreadCount(0);
      return;
    }

    // Initial fetch
    fetchUnreadCount();

    // Clean up any existing subscription before creating a new one
    if (subscriptionRef.current) {
      console.log('Cleaning up existing notification subscription');
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }

    // Small delay to ensure cleanup is complete
    const timeoutId = setTimeout(() => {
      try {
        // Create new subscription
        subscriptionRef.current = activityLogService.subscribeToNotifications(
          user.id,
          (newNotification) => {
            console.log('New notification received:', newNotification);
            setUnreadCount(prev => prev + 1);
          }
        );
      } catch (error) {
        console.error('Error creating notification subscription:', error);
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (subscriptionRef.current) {
        console.log('Cleaning up notification subscription on unmount');
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [user?.id]);

  const handlePress = async () => {
    if (onPress) {
      onPress();
    } else if (navigation) {
      navigation.navigate('Notification');
    }

    // Mark all notifications as read in database and reset counter
    if (unreadCount > 0) {
      try {
        console.log('Marking all notifications as read...');
        const success = await activityLogService.markAllNotificationsAsRead();
        if (success) {
          setUnreadCount(0);
          console.log('All notifications marked as read successfully');
        } else {
          console.error('Failed to mark notifications as read');
        }
      } catch (error) {
        console.error('Error marking notifications as read:', error);
        // Still reset the local counter for better UX
        setUnreadCount(0);
      }
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={styles.iconContainer}>
        {showIcon && (
          <Ionicons
            name="notifications"
            size={iconSize}
            color={iconColor}
          />
        )}
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount.toString()}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {;
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {;
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {;
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {;
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default NotificationCounter;
