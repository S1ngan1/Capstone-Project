import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { useNavigation, useRoute, NavigationProp  } from '@react-navigation/native'
import BottomNavigation from '../components/BottomNavigation'
import { RootStackParamList } from '../App'
import ConfirmLogoutDialog from '../components/Users/ConfirmLogoutDialog'
import { supabase } from '../lib/supabase'
import { useAppRole } from '../hooks/useAppRole'
const Settings = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const { userRole, loading, isAdmin } = useAppRole()
  const handleProfilePress = () => {
    navigation.navigate('Profile')
  }
  // Add navigation handler for CreateFarm screen
  const handleAddFarmPress = () => {
    navigation.navigate('CreateFarm')
  }
  // Add navigation handler for View Requests screen (Admin only)
  const handleViewRequestsPress = () => {
    navigation.navigate('ViewRequests') // You'll need to add this route
  }
  const handleLogout = async () => {
    setShowLogoutConfirm(false)
    await supabase.auth.signOut()
  }
  // Show loading state if still fetching user role
  if (loading) {
    return (
      <View style={[styles.outerContainer, { justifyContent: 'center' }]}>
        <Text>Loading...</Text>
      </View>
    )
  }
  return (
    <View style={styles.outerContainer}>
      <Text style={styles.settingsTitle}>Settings</Text>
      <LinearGradient
        colors={['#e7fbe8ff', '#cdffcfff']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradientBox}
      >
        {/* Add farm - Updated to use navigation */}
        <TouchableOpacity
          style={styles.settingItem}
          onPress={handleAddFarmPress}
        >
          <View style={styles.itemContent}>
            <Ionicons name="add-circle-outline" size={24} color="#333" style={styles.itemIcon} />
            <Text style={styles.itemText}>Add farm</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#333" />
        </TouchableOpacity>
        {/* My Sensor Requests - For all users */}
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => navigation.navigate('UserSensorRequests')}
        >
          <View style={styles.itemContent}>
            <Ionicons name="hardware-chip-outline" size={24} color="#333" style={styles.itemIcon} />
            <Text style={styles.itemText}>My Sensor Requests</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#333" />
        </TouchableOpacity>
        {/* View Requests - Admin Only */}
        {isAdmin && (
          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleViewRequestsPress}
          >
            <View style={styles.itemContent}>
              <Ionicons name="clipboard-outline" size={24} color="#333" style={styles.itemIcon} />
              <Text style={styles.itemText}>View Requests</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#333" />
          </TouchableOpacity>
        )}
        {/* Notification Settings */}
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.itemContent}>
            <Ionicons name="notifications-outline" size={24} color="#333" style={styles.itemIcon} />
            <Text style={styles.itemText}>Notification Settings</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#333" />
        </TouchableOpacity>
        {/* About */}
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.itemContent}>
            <Ionicons name="information-circle-outline" size={24} color="#333" style={styles.itemIcon} />
            <Text style={styles.itemText}>About</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#333" />
        </TouchableOpacity>
        {/* Privacy Policy */}
        <TouchableOpacity style={styles.settingItem} >
          <View style={styles.itemContent}>
            <Ionicons name="lock-closed-outline" size={24} color="#333" style={styles.itemIcon} />
            <Text style={styles.itemText}>Privacy Policy</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#333" />
        </TouchableOpacity>
        {/* Profile */}
        <TouchableOpacity style={styles.settingItem} onPress={handleProfilePress}>
          <View style={styles.itemContent}>
            <Ionicons name="person-outline" size={24} color="#333" style={styles.itemIcon} />
            <Text style={styles.itemText}>Profile</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#333" />
        </TouchableOpacity>
        {/* Log Out */}
        <TouchableOpacity style={styles.settingItem} onPress={() => setShowLogoutConfirm(true)}>
          <View style={styles.itemContent}>
            <Ionicons name="log-out-outline" size={24} color="#333" style={styles.itemIcon} />
            <Text style={styles.itemText}>Log Out</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#333" />
        </TouchableOpacity>
        <ConfirmLogoutDialog
          visible={showLogoutConfirm}
          onCancel={() => setShowLogoutConfirm(false)}
          onConfirm={handleLogout}
        />
      </LinearGradient>
      <BottomNavigation />
    </View>
  )
}
const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#e7fbe8ff',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  gradientBox: {
    width: '90%',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  settingsTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    margin: 20,
    padding: 20,
    textAlign: 'left',
    width: '100%',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    marginRight: 15,
  },
  itemText: {
    fontSize: 18,
    color: '#333',
  },
})
export default Settings
