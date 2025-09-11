import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useAuthContext } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import ActivityCounter from './ActivityCounter'
import NotificationCounter from './NotificationCounter'
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
        {/* Main Navigation Items */}
        <View style={styles.mainNavigation}>
          {/* Home Button */}
          <TouchableOpacity style={styles.navItem} onPress={navigateToHome}>
            <Ionicons name="home" size={24} color="#FFFFFF" />
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>
          {/* User Requests Button */}
          <TouchableOpacity style={styles.navItem} onPress={navigateToRequests}>
            <Ionicons name="document-text" size={24} color="#FFFFFF" />
            <Text style={styles.navText}>Requests</Text>
          </TouchableOpacity>
          {/* Activity Log Button with Counter */}
          <View style={styles.navItem}>
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <ActivityCounter
                showIcon={true}
                iconSize={24}
                iconColor="#FFFFFF"
                onPress={handleActivityPress}
              />
              <Text style={styles.navText}>Activity</Text>
            </View>
          </View>
          {/* Notifications Button with Counter */}
          <View style={styles.navItem}>
            <NotificationCounter
              navigation={navigation}
              showIcon={true}
              iconSize={24}
              iconColor="#FFFFFF"
            />
            <Text style={styles.navText}>Alerts</Text>
          </View>
          {/* Suggestions Button */}
          <TouchableOpacity style={styles.navItem} onPress={navigateToSuggestions}>
            <Ionicons name="bulb" size={24} color="#FFFFFF" />
            <Text style={styles.navText}>Tips</Text>
          </TouchableOpacity>
          {/* Settings Button */}
          <TouchableOpacity style={styles.navItem} onPress={navigateToSettings}>
            <Ionicons name="settings" size={24} color="#FFFFFF" />
            <Text style={styles.navText}>Settings</Text>
          </TouchableOpacity>
        </View>
        {/* Admin Only Section */}
        {userRole === 'admin' && (
          <View style={styles.adminSection}>
            <View style={styles.adminDivider} />
            <Text style={styles.adminLabel}>Admin Panel</Text>
            <View style={styles.adminButtons}>
              <TouchableOpacity style={styles.adminNavItem} onPress={navigateToAdminFarmRequests}>
                <Ionicons name="business" size={20} color="#4A90E2" />
                <Text style={styles.adminNavText}>Farm Requests</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.adminNavItem} onPress={navigateToAdminSensorRequests}>
                <Ionicons name="hardware-chip" size={20} color="#4A90E2" />
                <Text style={styles.adminNavText}>Sensor Requests</Text>
              </TouchableOpacity>
            </View>
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
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 16,
  },
  gradient: {
    paddingTop: 10,
    paddingBottom: 30,
    paddingHorizontal: 10,
  },
  mainNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    minWidth: 60,
  },
  navText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  adminSection: {
    marginTop: 15,
    paddingTop: 15,
  },
  adminDivider: {
    height: 1,
    backgroundColor: 'rgba(46, 139, 87, 0.2)',
    marginBottom: 10,
    marginHorizontal: 20,
  },
  adminLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4A90E2',
    textAlign: 'center',
    marginBottom: 10,
  },
  adminButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  adminNavItem: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: 10,
    minWidth: 80,
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  adminNavText: {
    fontSize: 11,
    color: '#4A90E2',
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
})
export default BottomNavigation
