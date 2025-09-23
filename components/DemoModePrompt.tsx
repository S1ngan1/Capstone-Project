import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation } from '@react-navigation/native'

const { width, height } = Dimensions.get('window')

interface DemoModeProps {
  visible: boolean
  onClose: () => void
  onStartDemo: () => void
}

export const DemoModePrompt: React.FC<DemoModeProps> = ({
  visible,
  onClose,
  onStartDemo
}) => {
  const navigation = useNavigation()

  if (!visible) return null

  const handleStartDemo = () => {
    onStartDemo()
    // Navigate to Home with demo mode enabled
    navigation.navigate('Home' as never)
  }

  const handleSkipDemo = () => {
    Alert.alert(
      'Skip Demo',
      'You can always access the tutorial later from the Settings menu.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', onPress: onClose }
      ]
    )
  }

  return (
    <View style={styles.overlay}>
      <LinearGradient
        colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.9)']}
        style={styles.backdrop}
      />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Ionicons name="bulb-outline" size={60} color="#4CAF50" />
            <Text style={styles.title}>Welcome to Smart Farm!</Text>
            <Text style={styles.subtitle}>
              Let us show you around with a quick demo
            </Text>
          </View>

          <View style={styles.features}>
            <View style={styles.feature}>
              <Ionicons name="home-outline" size={24} color="#2196F3" />
              <Text style={styles.featureText}>View and manage your farms</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="thermometer-outline" size={24} color="#FF9800" />
              <Text style={styles.featureText}>Monitor sensor data in real-time</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="chatbubble-outline" size={24} color="#9C27B0" />
              <Text style={styles.featureText}>Get AI-powered farming suggestions</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="cloud-outline" size={24} color="#607D8B" />
              <Text style={styles.featureText}>Track weather conditions</Text>
            </View>
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.demoButton} onPress={handleStartDemo}>
              <Text style={styles.demoButtonText}>Start Demo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.laterButton} onPress={handleSkipDemo}>
              <Text style={styles.laterButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 20,
    margin: 20,
    maxWidth: width * 0.9,
    maxHeight: height * 0.8,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  features: {
    width: '100%',
    marginBottom: 32,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 12,
  },
  featureText: {
    marginLeft: 16,
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  buttons: {
    width: '100%',
    alignItems: 'center',
  },
  demoButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  demoButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  laterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  laterButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
})
