import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { useNavigation, NavigationProp } from '@react-navigation/native'
import BottomNavigation from '../components/BottomNavigation'
import { useTutorial } from '../context/TutorialContext'
import { RootStackParamList } from '../App'
import ConfirmLogoutDialog from '../components/Users/ConfirmLogoutDialog'
import { supabase } from '../lib/supabase'
import { useAppRole } from '../hooks/useAppRole'
import AsyncStorage from '@react-native-async-storage/async-storage'

const Settings = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const { userRole, loading, isAdmin } = useAppRole()
  const { startTutorial } = useTutorial()

  const handleProfilePress = () => {
    navigation.navigate('Profile')
  }

  const handleAboutPress = () => {
    navigation.navigate('About')
  }

  const handlePrivacyPolicyPress = () => {
    navigation.navigate('PrivacyPolicy')
  }

  const handleShowTutorial = () => {
    startTutorial()
  }

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Logout error:', error)
      }
      // Clear any cached data
      await AsyncStorage.clear()
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }

  const settingsItems = [
    {
      id: 'profile',
      icon: 'person-outline',
      title: 'Profile',
      description: 'Manage your personal information',
      onPress: handleProfilePress,
    },
    {
      id: 'tutorial',
      icon: 'help-circle-outline',
      title: 'App Tutorial',
      description: 'Learn how to use the app',
      onPress: handleShowTutorial,
    },
    {
      id: 'about',
      icon: 'information-circle-outline',
      title: 'About',
      description: 'About Smart Farm Assistant',
      onPress: handleAboutPress,
    },
    {
      id: 'privacy',
      icon: 'shield-checkmark-outline',
      title: 'Privacy Policy',
      description: 'Your privacy and data protection',
      onPress: handlePrivacyPolicyPress,
    },
  ]

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <LinearGradient colors={['#4CAF50', '#45A049']} style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Manage your account and preferences</Text>
        </LinearGradient>

        <View style={styles.settingsContainer}>
          {settingsItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.settingItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.settingContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name={item.icon as any} size={24} color="#4CAF50" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.settingTitle}>{item.title}</Text>
                  <Text style={styles.settingDescription}>{item.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </View>
            </TouchableOpacity>
          ))}

          {/* Admin Section */}
          {isAdmin && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Admin Settings</Text>
              </View>
              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => navigation.navigate('UserManagement')}
                activeOpacity={0.7}
              >
                <View style={styles.settingContent}>
                  <View style={styles.iconContainer}>
                    <MaterialIcons name="admin-panel-settings" size={24} color="#FF9800" />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.settingTitle}>User Management</Text>
                    <Text style={styles.settingDescription}>Manage users and permissions</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </View>
              </TouchableOpacity>
            </>
          )}

          {/* Logout Section */}
          <View style={styles.dangerSection}>
            <TouchableOpacity
              style={[styles.settingItem, styles.dangerItem]}
              onPress={() => setShowLogoutConfirm(true)}
              activeOpacity={0.7}
            >
              <View style={styles.settingContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="log-out-outline" size={24} color="#F44336" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.settingTitle, styles.dangerText]}>Logout</Text>
                  <Text style={styles.settingDescription}>Sign out of your account</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#F44336" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <BottomNavigation />

      {/* Logout Confirmation */}
      <ConfirmLogoutDialog
        visible={showLogoutConfirm}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  settingsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionHeader: {
    marginTop: 30,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  settingItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  dangerSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  dangerItem: {
    borderWidth: 1,
    borderColor: '#ffebee',
    backgroundColor: '#fafafa',
  },
  dangerText: {
    color: '#F44336',
  },
  bottomSpacer: {
    height: 100,
  },
})

export default Settings
