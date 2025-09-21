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
  Dimensions,
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

const { width, height } = Dimensions.get('window')

// Responsive calculations for AI Chat
const isSmallDevice = width < 350 || height < 600
const isMediumDevice = width < 400 || height < 700
const responsivePadding = isSmallDevice ? 12 : 16
const responsiveMargin = isSmallDevice ? 8 : 12
const responsiveFontSize = {
  title: isSmallDevice ? 18 : isMediumDevice ? 20 : 22,
  subtitle: isSmallDevice ? 14 : 16,
  body: isSmallDevice ? 12 : 14,
}

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
      console.log('🤖 UI Debug: Starting message send process')

      // Add user message to display immediately
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: messageText,
        timestamp: new Date().toISOString()
      }

      console.log('🤖 UI Debug: Adding user message to display')
      setMessages(prev => {
        const newMessages = [...prev, userMessage]
        console.log('🤖 UI Debug: Total messages after user:', newMessages.length)
        return newMessages
      })

      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true })
      }, 100)

      console.log('🤖 UI Debug: Calling AI generateResponse...')
      // Generate AI response
      const aiResponse = await aiSpecialist.generateResponse(messageText, session.user.id)
      console.log('🤖 UI Debug: AI response received:', aiResponse?.content?.substring(0, 100) + '...')

      if (aiResponse && aiResponse.content) {
        console.log('🤖 UI Debug: Adding AI response to display')
        // Add AI response to display
        setMessages(prev => {
          const newMessages = [...prev, aiResponse]
          console.log('🤖 UI Debug: Total messages after AI:', newMessages.length)
          return newMessages
        })

        // Scroll to bottom again for AI response
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }, 100)
      } else {
        console.error('🤖 UI Debug: AI response was empty or null')
        // Add error message if no response
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: '⚠️ I apologize, but I had trouble generating a response. Please try asking your question again.',
          timestamp: new Date().toISOString()
        }
        setMessages(prev => [...prev, errorMessage])
      }

    } catch (error) {
      console.error('🤖 UI Debug: Error in handleSendMessage:', error)
      showDialog('Failed to get response from AI specialist')

      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '⚠️ I encountered an error while processing your request. Please try again.',
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      console.log('🤖 UI Debug: Setting loading to false')
      setIsLoading(false)
    }
  }

  const handleActionPress = (action: string) => {
    // Convert suggested action to a question for the AI
    const actionQuestions: { [key: string]: string } = {
      // Soil and analysis actions
      'Check soil conditions': 'Please analyze my current soil conditions and sensor readings',
      'Review irrigation schedule': 'Help me optimize my irrigation schedule based on my sensor data',
      'Get fertilizer recommendations': 'What fertilizer recommendations do you have for my farms?',
      'Ask about pest management': 'What should I know about pest management for my crops?',
      'Apply agricultural lime': 'How do I properly apply agricultural lime to my soil?',
      'Add organic matter': 'What organic matter should I add to improve my soil?',
      'Test irrigation water': 'How should I test and manage my irrigation water quality?',
      'Increase irrigation': 'How should I adjust my irrigation schedule?',
      'Improve drainage': 'What are the best ways to improve soil drainage?',

      // Goal and planning actions
      'Ask any farming question': 'I have a general farming question I need help with',
      'Share your farming goals': 'What should I consider when setting up my farming goals and planning for success?',
      'Describe any challenges': 'I am facing some farming challenges and need expert guidance',
      'Request guidance on any agricultural topic': 'I need comprehensive guidance on agricultural practices and farming techniques',

      // Specific farming topics
      'Ask about specific crops or techniques': 'What are the best crops and techniques for my specific farming situation?',
      'Ask about growing requirements': 'What are the essential growing requirements I should know about for successful farming?',
      'Get planting timeline': 'Help me create an optimal planting timeline and schedule for my farms',
      'Learn about soil prep': 'Teach me about proper soil preparation and improvement techniques',
      'Get detailed instructions': 'Provide me with detailed step-by-step farming instructions',
      'Ask about timing': 'What timing considerations are most important for successful farming?',

      // Farm management actions
      'Plan harvest schedule': 'Help me plan an effective harvest schedule for my crops',
      'Set up storage systems': 'What storage systems should I set up for my farm produce?',
      'Learn preservation methods': 'Teach me about food preservation and post-harvest handling methods',
      'Check climate compatibility': 'How can I assess climate compatibility for different crops on my farms?',
      'Consider space requirements': 'Help me understand space planning and requirements for efficient farming',
      'Explore alternative tropical fruits': 'What are some alternative tropical fruits I could consider growing?',

      // Farm assessment and monitoring
      'Assess climate compatibility': 'How do I properly assess climate compatibility for crop selection?',
      'Choose appropriate variety': 'Guide me in choosing the right crop varieties for my specific conditions',
      'Plan planting location': 'Help me plan optimal planting locations and layout for my farms',
      'Check sensor readings': 'Analyze my current sensor readings and what they mean for my farm management',
      'Review recommendations': 'Review and explain the farming recommendations based on my current farm data',
      'Plan improvements': 'Help me plan strategic improvements for my farming operations',

      // Farming goals and strategy
      'tell me about your farming goals': 'I want to understand how to set effective farming goals and create a successful farming strategy. What should I consider for short-term and long-term farming success?',
      'farming goals': 'Help me develop comprehensive farming goals that align with my resources, location, and experience level',
      'set farming goals': 'Guide me through the process of setting realistic and achievable farming goals'
    }

    const question = actionQuestions[action] || `I need specific guidance about ${action}. Please provide detailed farming advice on this topic.`
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
      <View style={styles.container}>
        <LinearGradient
          colors={['#e7fbe8ff', '#cdffcfff']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.gradientContainer}
        >
          <SafeAreaView style={styles.safeArea}>
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
        </LinearGradient>
        <BottomNavigation />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#e7fbe8ff', '#cdffcfff']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradientContainer}
      >
        <SafeAreaView style={styles.safeArea}>
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

          <View style={styles.chatContentContainer}>
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {messages.map((message) => (
                <ChatBubble
                  key={message.id}
                  message={message}
                  onActionPress={handleActionPress}
                />
              ))}
              <View style={styles.bottomSpacer} />
            </ScrollView>

            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.inputContainer}
            >
              <ChatInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                farms={userFarms}
                placeholder="Ask me anything about farming..."
              />
            </KeyboardAvoidingView>
          </View>
        </SafeAreaView>
        <BottomNavigation />
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsivePadding,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(76, 175, 80, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: responsiveFontSize.title,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: responsiveFontSize.body,
    color: '#666',
  },
  clearButton: {
    padding: 8,
    marginLeft: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  chatContentContainer: {
    flex: 1,
    paddingBottom: isSmallDevice ? 60 : isMediumDevice ? 65 : 70, // Reduced from 85-95 to match new nav height
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: responsivePadding,
  },
  messagesContent: {
    paddingTop: responsiveMargin,
    paddingBottom: 20,
  },
  inputContainer: {
    paddingHorizontal: responsivePadding,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(76, 175, 80, 0.1)',
    position: 'absolute',
    bottom: isSmallDevice ? 60 : isMediumDevice ? 65 : 70, // Reduced from 85-95 to match new nav height
    left: 0,
    right: 0,
  },
  bottomSpacer: {
    height: isSmallDevice ? 95 : isMediumDevice ? 100 : 105, // Reduced from 120-140
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
    marginTop: 16,
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
})

export default Suggestion
