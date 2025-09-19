import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuthContext } from '../context/AuthContext'
import { activityLogService } from '../utils/activityLogService'

interface NotificationCounterProps {
  navigation?: any
  onPress?: () => void
  showIcon?: boolean
  iconSize?: number
  iconColor?: string
  showText?: boolean
}

const NotificationCounter: React.FC<NotificationCounterProps> = ({
  navigation,
  onPress,
  showIcon = true,
  iconSize = 24,
  iconColor = '#333',
  showText = true
}) => {
  const { user } = useAuthContext()
  const [unreadCount, setUnreadCount] = useState(0)
  const subscriptionRef = useRef<any>(null)

  // Fetch unread notification count
  const fetchUnreadCount = async () => {
    try {
      const count = await activityLogService.getUnreadNotificationCount()
      setUnreadCount(count)
      console.log(`Unread notifications count: ${count}`)
    } catch (error) {
      console.error('Error fetching unread notification count:', error)
    }
  }

  // Subscribe to new notifications
  useEffect(() => {
    if (!user?.id) {
      setUnreadCount(0)
      return
    }

    // Initial fetch
    fetchUnreadCount()

    // Clean up any existing subscription before creating a new one
    if (subscriptionRef.current) {
      console.log('Cleaning up existing notification subscription')
      subscriptionRef.current.unsubscribe()
      subscriptionRef.current = null
    }

    // Set up real-time subscription for notifications
    try {
      subscriptionRef.current = activityLogService.subscribeToNotifications((count) => {
        setUnreadCount(count)
        console.log(`Real-time notification count update: ${count}`)
      })
    } catch (error) {
      console.error('Error setting up notification subscription:', error)
    }

    // Cleanup subscription on unmount
    return () => {
      if (subscriptionRef.current) {
        console.log('Cleaning up notification subscription on unmount')
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }
    }
  }, [user?.id])

  const handlePress = async () => {
    try {
      // Mark all notifications as read when pressed
      await activityLogService.markNotificationsAsRead()
      setUnreadCount(0)

      if (onPress) {
        onPress()
      } else if (navigation) {
        navigation.navigate('Notification')
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error)
    }
  }

  return (
    <View style={styles.container}>
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
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
})

export default NotificationCounter
