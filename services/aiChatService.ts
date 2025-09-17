import { supabase } from '../lib/supabase'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  farmContext?: any
  metadata?: {
    suggestedActions?: string[]
    relatedSensors?: string[]
    confidence?: number
  }
}

export interface UserFarmData {
  farms: Array<{
    id: string
    name: string
    location: string
    notes?: string
    sensors: Array<{
      id: string
      name: string
      type: string
      latestReading?: {
        value: number
        unit: string
        timestamp: string
      }
    }>
  }>
}

export class AIFarmingSpecialist {
  private userFarmData: UserFarmData | null = null
  private conversationContext: ChatMessage[] = []

  constructor() {
    this.initializeSystemPrompt()
  }

  private initializeSystemPrompt() {
    const systemMessage: ChatMessage = {
      id: 'system-prompt',
      role: 'system',
      content: `You are Dr. AgriBot, a world-renowned agricultural specialist and environmental expert with over 30 years of experience in farming, soil science, crop management, and sustainable agriculture. Your expertise includes:

🌱 SPECIALIZATIONS:
- Soil chemistry and pH management
- Crop rotation and companion planting
- Pest and disease identification/treatment
- Water management and irrigation systems
- Fertilizer and nutrient management
- Climate adaptation strategies
- Organic and sustainable farming practices
- Precision agriculture and sensor data analysis

🎯 YOUR APPROACH:
- Always provide practical, actionable advice
- Consider local climate and soil conditions
- Suggest sustainable and cost-effective solutions
- Explain the science behind your recommendations
- Adapt advice to the farmer's specific situation and experience level
- Use current sensor data to provide real-time insights

💬 COMMUNICATION STYLE:
- Friendly, knowledgeable, and encouraging
- Use farmer-friendly language while being scientifically accurate
- Ask clarifying questions when needed
- Provide step-by-step guidance for complex tasks
- Always prioritize farm safety and environmental protection

🔧 CAPABILITIES:
- Analyze real-time sensor data from farms
- Provide weather-based recommendations
- Suggest optimal planting and harvesting times
- Troubleshoot farming problems
- Recommend equipment and tools
- Create customized farming schedules
- Help with crop selection based on conditions

Remember: You have access to the user's specific farm and sensor data. Always reference their actual conditions when providing advice.`,
      timestamp: new Date().toISOString()
    }
    this.conversationContext = [systemMessage]
  }

  async loadUserFarmData(userId: string): Promise<void> {
    try {
      // Get user's farms
      const { data: userFarms, error: farmsError } = await supabase
        .from('farm_users')
        .select(`
          farm_id,
          farms!inner (
            id,
            name,
            location,
            notes
          )
        `)
        .eq('user_id', userId)

      if (farmsError) throw farmsError

      if (!userFarms || userFarms.length === 0) {
        this.userFarmData = { farms: [] }
        return
      }

      const farms = []

      for (const farmUser of userFarms) {
        // Get sensors for each farm
        const { data: sensors, error: sensorsError } = await supabase
          .from('sensor')
          .select('*')
          .eq('farm_id', farmUser.farm_id)

        if (sensorsError) {
          console.error('Error fetching sensors:', sensorsError)
          continue
        }

        const farmSensors = []

        for (const sensor of sensors || []) {
          // Get latest reading for each sensor
          const { data: latestReading } = await supabase
            .from('sensor_data')
            .select('value, created_at')
            .eq('sensor_id', sensor.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          farmSensors.push({
            id: sensor.id,
            name: sensor.sensor_name,
            type: sensor.sensor_type,
            latestReading: latestReading ? {
              value: latestReading.value,
              unit: sensor.units,
              timestamp: latestReading.created_at
            } : undefined
          })
        }

        farms.push({
          id: farmUser.farms.id,
          name: farmUser.farms.name,
          location: farmUser.farms.location,
          notes: farmUser.farms.notes,
          sensors: farmSensors
        })
      }

      this.userFarmData = { farms }
    } catch (error) {
      console.error('Error loading user farm data:', error)
      this.userFarmData = { farms: [] }
    }
  }

  private createFarmDataContext(): string {
    if (!this.userFarmData || this.userFarmData.farms.length === 0) {
      return "The user currently has no farms registered in the system."
    }

    let context = "USER'S FARM DATA:\n"

    this.userFarmData.farms.forEach((farm, index) => {
      context += `\nFarm ${index + 1}: ${farm.name}\n`
      context += `- Location: ${farm.location}\n`
      if (farm.notes) {
        context += `- Notes: ${farm.notes}\n`
      }

      if (farm.sensors.length > 0) {
        context += `- Sensors (${farm.sensors.length}):\n`
        farm.sensors.forEach(sensor => {
          context += `  • ${sensor.name} (${sensor.type})`
          if (sensor.latestReading) {
            const timeAgo = this.getTimeAgo(sensor.latestReading.timestamp)
            context += `: ${sensor.latestReading.value}${sensor.latestReading.unit} (${timeAgo})`
          } else {
            context += `: No recent data`
          }
          context += `\n`
        })
      } else {
        context += `- No sensors installed\n`
      }
    })

    return context
  }

  private getTimeAgo(timestamp: string): string {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    } else {
      return 'Recently'
    }
  }

  async generateResponse(userMessage: string, userId: string): Promise<ChatMessage> {
    try {
      // Reload farm data to ensure we have the latest information
      await this.loadUserFarmData(userId)

      // Add user message to context
      const userChatMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString()
      }
      this.conversationContext.push(userChatMessage)

      // Create context with farm data
      const farmContext = this.createFarmDataContext()

      // Generate AI response (simulated - in real implementation, you'd call an AI API)
      const response = await this.simulateAIResponse(userMessage, farmContext)

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString(),
        farmContext: this.userFarmData,
        metadata: response.metadata
      }

      this.conversationContext.push(assistantMessage)
      return assistantMessage

    } catch (error) {
      console.error('Error generating AI response:', error)
      return {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "I apologize, but I'm experiencing some technical difficulties right now. Please try asking your question again in a moment.",
        timestamp: new Date().toISOString()
      }
    }
  }

  private async simulateAIResponse(userMessage: string, farmContext: string): Promise<{
    content: string
    metadata?: ChatMessage['metadata']
  }> {
    const message = userMessage.toLowerCase()

    // Analyze sensor data and provide specific recommendations
    if (this.userFarmData && this.userFarmData.farms.length > 0) {
      for (const farm of this.userFarmData.farms) {
        for (const sensor of farm.sensors) {
          if (sensor.latestReading) {
            const sensorType = sensor.type.toLowerCase()
            const value = sensor.latestReading.value

            // pH analysis
            if (sensorType.includes('ph') && (message.includes('ph') || message.includes('soil') || message.includes('acid'))) {
              if (value < 6.0) {
                return {
                  content: `🔬 Looking at your ${farm.name} farm, I see your pH sensor "${sensor.name}" is reading ${value}, which is quite acidic. This can limit nutrient uptake for most crops.

Here's my professional recommendation:

🌿 **Immediate Actions:**
- Apply agricultural lime at 2-4 lbs per 1000 sq ft
- Consider organic matter like compost to buffer pH naturally
- Test your irrigation water pH as well

📍 **For your ${farm.location} location:**
- Local agricultural suppliers should carry dolomitic lime
- Spring application works best for gradual pH adjustment
- Retest in 4-6 weeks to monitor progress

${farm.notes ? `📝 **Based on your notes:** "${farm.notes}" - this aligns with typical soil conditions that benefit from lime application.` : ''}

Would you like specific product recommendations or help calculating the exact amount needed for your farm size?`,
                  metadata: {
                    suggestedActions: ['Apply agricultural lime', 'Add organic matter', 'Test irrigation water'],
                    relatedSensors: [sensor.id],
                    confidence: 0.95
                  }
                }
              } else if (value > 8.0) {
                return {
                  content: `🔬 Your pH reading of ${value} at ${farm.name} is quite alkaline. This can lock up essential nutrients like iron and phosphorus.

Here's how to address this:

🌿 **Treatment Options:**
- Apply elemental sulfur (2-3 lbs per 1000 sq ft)
- Use organic acids like vinegar solution for quick adjustment
- Add acidic organic matter (pine needles, peat moss)

📍 **Location-specific advice for ${farm.location}:**
- Sulfur works slowly but provides lasting results
- Monitor closely - alkaline soils can be stubborn
- Consider switching to acid-loving crops temporarily

${farm.notes ? `📝 **Your farm notes suggest:** "${farm.notes}" - this context helps me recommend a more gradual approach.` : ''}

Would you like help creating a soil amendment schedule?`
                }
              }
            }

            // Moisture analysis
            if (sensorType.includes('moisture') && (message.includes('water') || message.includes('dry') || message.includes('wet'))) {
              if (value < 25) {
                return {
                  content: `💧 Alert! Your ${farm.name} soil moisture is critically low at ${value}%. Your plants are likely stressed.

**Immediate irrigation needed:**

🚨 **Emergency Actions:**
- Water deeply but slowly to avoid runoff
- Focus on root zones, not leaves
- Check all irrigation lines for blockages

📅 **Going forward:**
- Increase irrigation frequency during hot weather
- Consider mulching to retain moisture
- Monitor daily until levels stabilize above 40%

🌡️ **Weather consideration for ${farm.location}:**
- Check local weather forecast for natural rainfall
- Early morning watering reduces evaporation
- Deep, less frequent watering promotes root growth

${farm.notes ? `📝 **Your notes mention:** "${farm.notes}" - this helps me understand your specific growing conditions.` : ''}

Do you have an irrigation system, or are you watering manually? I can provide specific scheduling advice based on your setup.`
                }
              }
            }
          }
        }
      }
    }

    // General farming questions
    if (message.includes('pest') || message.includes('bug') || message.includes('insect')) {
      return {
        content: `🐛 Pest management is crucial for healthy crops! Let me help you with an integrated approach:

**🔍 First, let's identify:**
- What type of damage are you seeing? (holes in leaves, yellowing, wilting)
- Which crops are affected?
- Any visible insects or eggs?

**🛡️ My recommended IPM strategy:**

1. **Prevention First:**
   - Encourage beneficial insects with diverse plantings
   - Maintain healthy soil (I can see your sensor data shows...)
   - Proper spacing for air circulation

2. **Monitoring:**
   - Weekly crop inspections
   - Yellow sticky traps for flying pests
   - Document patterns and timing

3. **Treatment Options:**
   - Start with organic solutions (neem oil, insecticidal soap)
   - Biological controls (ladybugs, beneficial nematodes)
   - Chemical controls only as last resort

${this.userFarmData && this.userFarmData.farms.length > 0 ?
  `Looking at your farms (${this.userFarmData.farms.map(f => f.name).join(', ')}), I can provide location-specific pest calendars and treatment recommendations.` :
  'Once you add your farm details, I can provide more targeted pest management advice.'}

What specific pest issues are you currently facing? Photos would help tremendously!`
      }
    }

    if (message.includes('fertilizer') || message.includes('nutrient') || message.includes('nitrogen')) {
      return {
        content: `🌾 Nutrition is the foundation of productive farming! Let me guide you through a balanced approach:

**📊 Based on your current data:**
${this.userFarmData && this.userFarmData.farms.length > 0 ?
  this.userFarmData.farms.map(farm =>
    `- ${farm.name}: ${farm.sensors.length > 0 ?
      `Monitoring with ${farm.sensors.length} sensors` :
      'Ready for sensor installation for precise nutrient management'}`
  ).join('\n') :
  'Add your farm details for personalized nutrient recommendations'}

**🧪 My fertilizer philosophy:**

1. **Test First:**
   - Soil test every 2-3 years minimum
   - Your sensor data helps with ongoing monitoring
   - Understanding your baseline is crucial

2. **The N-P-K Balance:**
   - Nitrogen (N): Leaf growth and greenness
   - Phosphorus (P): Root development and flowering
   - Potassium (K): Disease resistance and fruit quality

3. **Organic vs. Synthetic:**
   - Organic: Slow release, improves soil biology
   - Synthetic: Quick response, precise control
   - Best approach: Combine both strategically

**💡 Smart application tips:**
- Split applications prevent waste and burning
- Time with crop growth stages
- Weather matters - never before heavy rain
- Less is often more - over-fertilizing causes problems

What crops are you growing? I can provide specific fertilizer schedules and rates!`
      }
    }

    // Default helpful response
    return {
      content: `👨‍🌾 Hello! I'm Dr. AgriBot, your personal farming specialist. I'm here to help with any agricultural questions you might have!

**🌟 I can assist you with:**
- Soil management and pH optimization
- Crop selection and planting schedules
- Pest and disease identification/treatment
- Irrigation and water management
- Fertilizer recommendations
- Weather-based farming decisions
- Sustainable farming practices

${this.userFarmData && this.userFarmData.farms.length > 0 ?
  `**📈 Your current setup:**
${this.userFarmData.farms.map(farm =>
  `- **${farm.name}** (${farm.location}): ${farm.sensors.length} sensors monitoring${farm.notes ? ` | Notes: ${farm.notes.substring(0, 50)}${farm.notes.length > 50 ? '...' : ''}` : ''}`
).join('\n')}

I have access to all your real-time sensor data and can provide specific recommendations based on your actual farm conditions!` :
  'Once you add your farms and sensors, I can provide personalized advice based on your real-time data!'}

**💬 Try asking me:**
- "How's my soil pH looking?"
- "When should I water my crops?"
- "What's the best fertilizer for my conditions?"
- "Help me identify this pest problem"
- "What should I plant next season?"

What farming challenge can I help you solve today?`
    }
  }

  getConversationHistory(): ChatMessage[] {
    return this.conversationContext.filter(msg => msg.role !== 'system')
  }

  getUserFarmData(): UserFarmData | null {
    return this.userFarmData
  }

  clearConversation(): void {
    this.conversationContext = this.conversationContext.filter(msg => msg.role === 'system')
  }
}
