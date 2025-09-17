import React, { useEffect, useState, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, NavigationProp } from '@react-navigation/native'
import BottomNavigation from '../components/BottomNavigation'
import { ChatBubble } from '../components/ChatBubble'
import { ChatInput } from '../components/ChatInput'
import { useAuthContext } from '../context/AuthContext'
import { useDialog } from '../context/DialogContext'
import { RootStackParamList } from '../App'
import { AIFarmingSpecialist, ChatMessage } from '../services/aiChatService'

const Suggestion: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>()
  const { session } = useAuthContext()
  const { showDialog } = useDialog()
  const scrollViewRef = useRef<ScrollView>(null)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [aiSpecialist] = useState(() => new AIFarmingSpecialist())
  const [isInitializing, setIsInitializing] = useState(true)
  const [userFarms, setUserFarms] = useState<Array<{
    id: string
    name: string
    location: string
  }>>([])

  useEffect(() => {
    initializeChat()
  }, [session])

  const initializeChat = async () => {
    try {
      setIsInitializing(true)

      if (!session?.user?.id) {
        showDialog('Please log in to access the AI farming specialist')
        return
      }

      // Load user farm data
      await aiSpecialist.loadUserFarmData(session.user.id)

      // Get farm list for the input component
      const farmData = aiSpecialist.getUserFarmData()
      if (farmData && farmData.farms) {
        setUserFarms(farmData.farms.map(farm => ({
          id: farm.id,
          name: farm.name,
          location: farm.location
        })))
      }

      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `👋 Hello! I'm **Dr. AgriBot**, your personal agricultural specialist and environmental expert. I'm here to help you optimize your farming operations with science-based recommendations!

🌾 **What makes me special:**
- 30+ years of farming expertise in my knowledge base
- Real-time access to your farm and sensor data
- Personalized advice for your specific conditions
- 24/7 availability to answer your questions

💡 **I can help you with:**
- Soil analysis and pH management
- Crop selection and rotation planning
- Pest and disease identification
- Irrigation and water management
- Fertilizer recommendations
- Weather-based farming decisions
- Sustainable farming practices

🚀 **Getting started:**
Try asking me questions like:
- "How are my soil conditions looking?"
- "When should I water my crops?"
- "What's the best fertilizer for my farm?"
- "Help me identify this plant problem"

${userFarms.length > 1 ? `🏡 **Your farms:** I can see you have ${userFarms.length} farms (${userFarms.map(f => f.name).join(', ')}). You can select a specific farm in the input area below to get targeted advice!` : ''}

What farming challenge would you like to tackle first?`,
        timestamp: new Date().toISOString(),
        metadata: {
          suggestedActions: [
            'Check soil conditions',
            'Review irrigation schedule',
            'Get fertilizer recommendations',
            'Ask about pest management'
          ]
        }
      }

      setMessages([welcomeMessage])
    } catch (error) {
      console.error('Error initializing chat:', error)
      showDialog('Failed to initialize AI specialist')
    } finally {
      setIsInitializing(false)
    }
  }

  const handleSendMessage = async (messageText: string) => {
    if (!session?.user?.id || isLoading) return

    try {
      setIsLoading(true)

      // Add user message to display immediately
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: messageText,
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, userMessage])

      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true })
      }, 100)

      // Generate AI response
      const aiResponse = await aiSpecialist.generateResponse(messageText, session.user.id)

      // Add AI response to display
      setMessages(prev => [...prev, aiResponse])

      // Scroll to bottom again for AI response
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true })
      }, 100)

    } catch (error) {
      console.error('Error sending message:', error)
      showDialog('Failed to get response from AI specialist')
    } finally {
      setIsLoading(false)
    }
  }

  const handleActionPress = (action: string) => {
    // Convert suggested action to a question for the AI
    const actionQuestions: { [key: string]: string } = {
      'Check soil conditions': 'Please analyze my current soil conditions and sensor readings',
      'Review irrigation schedule': 'Help me optimize my irrigation schedule based on my sensor data',
      'Get fertilizer recommendations': 'What fertilizer recommendations do you have for my farms?',
      'Ask about pest management': 'What should I know about pest management for my crops?',
      'Apply agricultural lime': 'How do I properly apply agricultural lime to my soil?',
      'Add organic matter': 'What organic matter should I add to improve my soil?',
      'Test irrigation water': 'How should I test and manage my irrigation water quality?',
      'Increase irrigation': 'How should I adjust my irrigation schedule?',
      'Improve drainage': 'What are the best ways to improve soil drainage?'
    }

    const question = actionQuestions[action] || `Please help me with: ${action}`
    handleSendMessage(question)
  }

  const clearConversation = () => {
    Alert.alert(
      'Clear Conversation',
      'Are you sure you want to clear the entire conversation history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            aiSpecialist.clearConversation()
            initializeChat()
          }
        }
      ]
    )
  }

  if (isInitializing) {
    return (
      <LinearGradient
        colors={['#e7fbe8ff', '#cdffcfff']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Fixed Header with proper padding */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>AI Farming Assistant</Text>
              <Text style={styles.headerSubtitle}>Dr. AgriBot</Text>
            </View>
            <TouchableOpacity onPress={clearConversation} style={styles.clearButton}>
              <Ionicons name="refresh" size={24} color="#4CAF50" />
            </TouchableOpacity>
          </View>

          <View style={styles.loadingContainer}>
            <View style={styles.loadingContent}>
              <Ionicons name="leaf" size={48} color="#4CAF50" />
              <Text style={styles.loadingText}>Initializing AI Specialist...</Text>
              <Text style={styles.loadingSubtext}>Loading your farm data</Text>
            </View>
          </View>
        </SafeAreaView>
        <BottomNavigation />
      </LinearGradient>
    )
  }

  return (
    <LinearGradient
      colors={['#e7fbe8ff', '#cdffcfff']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Fixed Header with proper status bar padding */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>AI Farming Assistant</Text>
            <Text style={styles.headerSubtitle}>Dr. AgriBot • {userFarms.length > 0 ? `${userFarms.length} farms` : 'Environment Specialist'}</Text>
          </View>
          <TouchableOpacity onPress={clearConversation} style={styles.clearButton}>
            <Ionicons name="refresh" size={24} color="#4CAF50" />
          </TouchableOpacity>
        </View>

        {/* Chat Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              message={message}
              onActionPress={handleActionPress}
            />
          ))}

          {isLoading && (
            <View style={styles.typingIndicator}>
              <Text style={styles.typingText}>Dr. AgriBot is thinking...</Text>
              <View style={styles.typingDots}>
                <View style={[styles.dot, styles.dot1]} />
                <View style={[styles.dot, styles.dot2]} />
                <View style={[styles.dot, styles.dot3]} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Chat Input */}
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          userFarms={userFarms}
          placeholder="Ask about farming, weather, soil conditions, or crop management..."
        />
      </SafeAreaView>
      <BottomNavigation />
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(76, 175, 80, 0.2)',
    // Add proper padding for status bar
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  clearButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    marginVertical: 8,
    alignSelf: 'flex-start',
  },
  typingText: {
    fontSize: 14,
    color: '#4CAF50',
    marginRight: 8,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    marginHorizontal: 2,
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.7,
  },
  dot3: {
    opacity: 1,
  },
})

export default Suggestion
