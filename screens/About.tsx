import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import BottomNavigation from '../components/BottomNavigation'

const { width } = Dimensions.get('window')
const isSmallDevice = width < 350

const About = () => {
  const navigation = useNavigation()

  const features = [
    {
      icon: 'leaf-outline',
      title: 'Smart Farm Management',
      description: 'Manage multiple farms with real-time monitoring and analytics',
    },
    {
      icon: 'analytics-outline',
      title: 'Sensor Integration',
      description: 'Monitor temperature, humidity, soil moisture, and light levels',
    },
    {
      icon: 'chatbubble-ellipses-outline',
      title: 'AI Assistant',
      description: 'Get personalized farming advice from our AI specialist',
    },
    {
      icon: 'cloudy-outline',
      title: 'Weather Integration',
      description: 'Real-time weather data and forecasts for your farms',
    },
    {
      icon: 'notifications-outline',
      title: 'Smart Alerts',
      description: 'Receive notifications for critical farm conditions',
    },
    {
      icon: 'people-outline',
      title: 'Team Collaboration',
      description: 'Share farms and collaborate with team members',
    },
  ]

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <LinearGradient colors={['#4CAF50', '#45A049']} style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>About</Text>
        </LinearGradient>

        <View style={styles.content}>
          {/* App Info Section */}
          <View style={styles.section}>
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Ionicons name="leaf" size={48} color="#4CAF50" />
              </View>
              <Text style={styles.appName}>Smart Farm Assistant</Text>
              <Text style={styles.version}>Version 1.0.0</Text>
            </View>

            <Text style={styles.description}>
              Smart Farm Assistant is your comprehensive farming companion designed to help modern farmers
              manage their agricultural operations efficiently. With AI-powered insights, real-time monitoring,
              and weather integration, we're making farming smarter and more sustainable.
            </Text>
          </View>

          {/* Features Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Features</Text>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Ionicons name={feature.icon as any} size={24} color="#4CAF50" />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Mission Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Our Mission</Text>
            <Text style={styles.missionText}>
              To empower farmers with cutting-edge technology that makes agriculture more efficient,
              sustainable, and profitable. We believe in combining traditional farming wisdom with
              modern AI and IoT solutions to create the future of farming.
            </Text>
          </View>

          {/* Contact Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact & Support</Text>
            <View style={styles.contactItem}>
              <Ionicons name="mail-outline" size={20} color="#4CAF50" />
              <Text style={styles.contactText}>support@smartfarmassistant.com</Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons name="globe-outline" size={20} color="#4CAF50" />
              <Text style={styles.contactText}>www.smartfarmassistant.com</Text>
            </View>
          </View>

          {/* Copyright */}
          <View style={styles.footer}>
            <Text style={styles.copyrightText}>
              © 2024 Smart Farm Assistant. All rights reserved.
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <BottomNavigation />
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
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  version: {
    fontSize: 16,
    color: '#666',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  missionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  copyrightText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 100,
  },
})

export default About
