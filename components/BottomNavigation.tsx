import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useAuthContext } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

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

  const navigateToNotifications = () => {
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
    try {
      // Mark all activities as viewed
      const { activityLogService } = require('../utils/activityLogService')
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
            </View>
            <Text style={styles.navText}>Noti</Text>
          </TouchableOpacity>

          {/* Activity Button with counter */}
          <TouchableOpacity style={styles.navItem} onPress={handleActivityPress}>
            <View style={styles.iconContainer}>
              <Ionicons name="pulse-outline" size={responsiveIconSize} color="#fff" />
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
