import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useAuthContext } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { activityLogService } from '../utils/activityLogService'

const { width, height } = Dimensions.get('window')

// Improved responsive calculations for better medium device support
const isSmallDevice = width < 350
const isMediumDevice = width >= 350 && width <= 400
const isLargeDevice = width > 400

// Better responsive values for medium devices - OPTIMIZED FOR SMALLER HEIGHT
const responsiveIconSize = isSmallDevice ? 16 : isMediumDevice ? 20 : 22
const responsiveFontSize = isSmallDevice ? 8 : isMediumDevice ? 10 : 11
const responsivePadding = isSmallDevice ? 4 : isMediumDevice ? 6 : 8
const responsiveNavItemPadding = isSmallDevice ? 2 : isMediumDevice ? 4 : 5
const responsiveHeight = isSmallDevice ? 50 : isMediumDevice ? 55 : 60 // Reduced from 65-80 to 50-60

const BottomNavigation: React.FC = () => {
  const navigation = useNavigation()
  const { session } = useAuthContext()
  const [userRole, setUserRole] = useState<string | null>(null)

  // Counter states with better initialization
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
  const [newActivityCount, setNewActivityCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch notification and activity counts with improved real-time updates
  useEffect(() => {
    if (!session?.user?.id) {
      setUnreadNotificationCount(0)
      setNewActivityCount(0)
      setIsLoading(false)
      return
    }

    const userId = session.user.id
    let notificationSubscription: any = null
    let activitySubscription: any = null

    const initializeCounts = async () => {
      try {
        console.log('🚀 Initializing counter subscriptions for user:', userId)

        // Get initial counts
        const [unreadCount, newActivities] = await Promise.all([
          activityLogService.getUnreadNotificationCount(),
          activityLogService.getNewActivityLogCount()
        ])

        setUnreadNotificationCount(unreadCount)
        setNewActivityCount(newActivities)

        console.log(`📊 Initial counts - Notifications: ${unreadCount}, Activities: ${newActivities}`)

        // Set up real-time subscriptions with proper callback handling
        notificationSubscription = activityLogService.subscribeToNotifications(
          userId,
          async (notification) => {
            console.log('🔔 New notification received:', notification)
            // Refresh the notification count when a new notification arrives
            const newCount = await activityLogService.getUnreadNotificationCount()
            setUnreadNotificationCount(newCount)
          }
        )

        activitySubscription = activityLogService.subscribeToActivityLogs(
          userId,
          async (activity) => {
            console.log('📈 New activity logged:', activity)
            // Refresh the activity count when a new activity is logged
            const newCount = await activityLogService.getNewActivityLogCount()
            setNewActivityCount(newCount)
          }
        )

        setIsLoading(false)
      } catch (error) {
        console.error('❌ Error initializing counters:', error)
        setIsLoading(false)
      }
    }

    initializeCounts()

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up bottom navigation subscriptions')
      if (notificationSubscription) {
        notificationSubscription.unsubscribe()
      }
      if (activitySubscription) {
        activitySubscription.unsubscribe()
      }
    }
  }, [session?.user?.id])

  useEffect(() => {
    const fetchUserRole = async () => {
      if (session?.user?.id) {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()

          if (!error && profile) {
            setUserRole(profile.role)
            console.log('User role set to:', profile.role)
          }
        } catch (error) {
          console.error('Error fetching user role:', error)
        }
      }
    }

    fetchUserRole()
  }, [session?.user?.id])

  const navigateToHome = () => {
    navigation.navigate('Home' as never)
  }

  const navigateToRequests = () => {
    navigation.navigate('UserRequests' as never)
  }

  const navigateToNotifications = async () => {
    // Reset notification counter when user views notifications
    setUnreadNotificationCount(0)
    try {
      await activityLogService.markAllNotificationsAsRead()
    } catch (error) {
      console.error('Error marking notifications as read:', error)
    }
    navigation.navigate('Notification' as never)
  }

  const navigateToSuggestions = () => {
    navigation.navigate('Suggestion' as never)
  }

  const navigateToSettings = () => {
    navigation.navigate('Settings' as never)
  }

  const navigateToAdminFarmRequests = () => {
    navigation.navigate('AdminFarmRequests' as never)
  }

  const navigateToAdminSensorRequests = () => {
    navigation.navigate('AdminSensorRequests' as never)
  }

  // Custom handler for Activity button: mark as viewed and navigate
  const handleActivityPress = async () => {
    // Reset activity counter when user views activities
    setNewActivityCount(0)
    try {
      // Mark all activities as viewed
      await activityLogService.markActivityLogsAsViewed()
    } catch (error) {
      console.error('Error marking activities as viewed:', error)
    }
    navigation.navigate('ActivityLogs' as never)
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4CAF50', '#66BB6A']}
        style={styles.gradient}
      >
        {/* Single Row Navigation - All essential features */}
        <View style={styles.mainNavigation}>
          {/* Home Button */}
          <TouchableOpacity style={styles.navItem} onPress={navigateToHome}>
            <View style={styles.iconContainer}>
              <Ionicons name="home-outline" size={responsiveIconSize} color="#fff" />
            </View>
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>

          {/* User Requests Button */}
          <TouchableOpacity style={styles.navItem} onPress={navigateToRequests}>
            <View style={styles.iconContainer}>
              <Ionicons name="document-text-outline" size={responsiveIconSize} color="#fff" />
            </View>
            <Text style={styles.navText}>Requests</Text>
          </TouchableOpacity>

          {/* AI Chat Button (was Tips) */}
          <TouchableOpacity style={styles.navItem} onPress={navigateToSuggestions}>
            <View style={styles.iconContainer}>
              <Ionicons name="chatbubble-ellipses-outline" size={responsiveIconSize} color="#fff" />
            </View>
            <Text style={styles.navText}>AI Chat</Text>
          </TouchableOpacity>

          {/* Notifications Button with counter */}
          <TouchableOpacity style={styles.navItem} onPress={navigateToNotifications}>
            <View style={styles.iconContainer}>
              <Ionicons name="notifications-outline" size={responsiveIconSize} color="#fff" />
              {!isLoading && unreadNotificationCount > 0 && (
                <View style={styles.counterBadge}>
                  <Text style={styles.counterText}>
                    {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.navText}>Noti</Text>
          </TouchableOpacity>

          {/* Activity Button with counter */}
          <TouchableOpacity style={styles.navItem} onPress={handleActivityPress}>
            <View style={styles.iconContainer}>
              <Ionicons name="pulse-outline" size={responsiveIconSize} color="#fff" />
              {!isLoading && newActivityCount > 0 && (
                <View style={styles.counterBadge}>
                  <Text style={styles.counterText}>
                    {newActivityCount > 99 ? '99+' : newActivityCount}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.navText}>Activity</Text>
          </TouchableOpacity>

          {/* Settings Button */}
          <TouchableOpacity style={styles.navItem} onPress={navigateToSettings}>
            <View style={styles.iconContainer}>
              <Ionicons name="settings-outline" size={responsiveIconSize} color="#fff" />
            </View>
            <Text style={styles.navText}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Admin Section - Separate row for admin controls */}
        {userRole === 'admin' && (
          <View style={styles.adminNavigation}>
            <TouchableOpacity style={styles.adminNavItem} onPress={navigateToAdminFarmRequests}>
              <View style={styles.adminIconContainer}>
                <Ionicons name="business-outline" size={isSmallDevice ? 16 : 18} color="#fff" />
              </View>
              <Text style={styles.adminNavText}>Farm Requests</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.adminNavItem} onPress={navigateToAdminSensorRequests}>
              <View style={styles.adminIconContainer}>
                <Ionicons name="radio-outline" size={isSmallDevice ? 16 : 18} color="#fff" />
              </View>
              <Text style={styles.adminNavText}>Sensor Requests</Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  gradient: {
    paddingTop: 6, // Reduced from 10
    paddingBottom: Platform.OS === 'ios' ? 16 : 8, // Reduced from 20/10
    paddingHorizontal: isSmallDevice ? 4 : 6, // Reduced from 5/8
  },
  mainNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    minHeight: responsiveHeight,
    paddingHorizontal: 2,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsiveNavItemPadding,
    paddingHorizontal: 1,
    minWidth: isSmallDevice ? 45 : 55,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  navText: {
    fontSize: responsiveFontSize,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: responsiveFontSize + 2,
    numberOfLines: 1,
  },
  counterBadge: {
    position: 'absolute',
    right: -10,
    top: -2,
    backgroundColor: '#FF3B30', // ADG compliant red color
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff', // White border for better visibility
  },
  counterText: {
    color: '#fff',
    fontSize: 10, // Slightly smaller for better fit
    fontWeight: 'bold',
    textAlign: 'center',
  },
  adminNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  adminNavItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  adminIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  adminNavText: {
    fontSize: isSmallDevice ? 9 : 10,
    color: '#fff',
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.9,
  },
})

export default BottomNavigation
