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
interface ActivityCounterProps {
  navigation?: any
  onPress?: () => void
  showIcon?: boolean
  iconSize?: number
  iconColor?: string
}
const ActivityCounter: React.FC<ActivityCounterProps> = ({
  navigation,
  onPress,
  showIcon = true,
  iconSize = 24,
  iconColor = '#333'
}) => {
  const { user } = useAuthContext()
  const [newActivityCount, setNewActivityCount] = useState(0)
  const subscriptionRef = useRef<any>(null)
  // Fetch new activity count
  const fetchNewActivityCount = async () => {
    try {
      const count = await activityLogService.getNewActivityLogCount()
      setNewActivityCount(count)
      console.log(`New activity count: ${count}`)
    } catch (error) {
      console.error('Error fetching new activity count:', error)
    }
  }
  // Subscribe to new activities
  useEffect(() => {
    if (!user?.id) {
      setNewActivityCount(0)
      return
    }
    // Initial fetch
    fetchNewActivityCount()
    // Clean up any existing subscription before creating a new one
    if (subscriptionRef.current) {
      console.log('Cleaning up existing subscription')
      subscriptionRef.current.unsubscribe()
      subscriptionRef.current = null
    }
    // Small delay to ensure cleanup is complete
    const timeoutId = setTimeout(() => {
      try {
        // Create new subscription
        subscriptionRef.current = activityLogService.subscribeToActivityLogs(
          user.id,
          (newActivity) => {
            console.log('New activity logged:', newActivity)
            setNewActivityCount(prev => prev + 1)
          }
        )
      } catch (error) {
        console.error('Error creating activity subscription:', error)
      }
    }, 100)
    return () => {
      clearTimeout(timeoutId)
      if (subscriptionRef.current) {
        console.log('Cleaning up subscription on unmount')
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }
    }
  }, [user?.id])
  const handlePress = async () => {
    if (onPress) {
      onPress()
    } else if (navigation) {
      navigation.navigate('ActivityLogs')
    }
    // Mark activities as viewed when user accesses them
    if (newActivityCount > 0) {
      try {
        console.log('Marking activity logs as viewed...')
        const success = await activityLogService.markActivityLogsAsViewed()
        if (success) {
          setNewActivityCount(0)
          console.log('Activity logs marked as viewed successfully')
        } else {
          console.error('Failed to mark activity logs as viewed')
        }
      } catch (error) {
        console.error('Error marking activity logs as viewed:', error)
        // Still reset the local counter for better UX
        setNewActivityCount(0)
      }
    }
  }
  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      {showIcon && (
        <Ionicons name="list" size={iconSize} color={iconColor} />
      )}
      {newActivityCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {newActivityCount > 99 ? '99+' : newActivityCount.toString()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  )
}
const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF0000',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: 'white',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
})
export default ActivityCounter
