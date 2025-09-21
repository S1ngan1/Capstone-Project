import { supabase } from '../lib/supabase'
import { RealAIService, createRealAI } from './realAIService'

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

// AI Configuration - Add your API keys here
const AI_CONFIG = {
  // Choose your preferred AI provider: 'openai', 'claude', or 'copilot'
  PROVIDER: 'openai' as const, // Change this to your preferred provider

  // Add your API keys here (use environment variables in production)
  OPENAI_API_KEY: process.env.EXPO_PUBLIC_OPENAI_API_KEY || 'your-openai-api-key-here',
  CLAUDE_API_KEY: process.env.EXPO_PUBLIC_CLAUDE_API_KEY || 'your-claude-api-key-here',
  COPILOT_API_KEY: process.env.EXPO_PUBLIC_COPILOT_API_KEY || 'your-copilot-api-key-here',
}

export class AIFarmingSpecialist {
  private userFarmData: UserFarmData | null = null
  private conversationContext: ChatMessage[] = []
  private realAI: RealAIService | null = null
  private useRealAI: boolean = false

  constructor() {
    this.initializeSystemPrompt()
    this.initializeRealAI()
  }

  private initializeRealAI() {
    try {
      // Get the API key based on selected provider
      let apiKey = ''
      switch (AI_CONFIG.PROVIDER) {
        case 'openai':
          apiKey = AI_CONFIG.OPENAI_API_KEY
          break
        case 'claude':
          apiKey = AI_CONFIG.CLAUDE_API_KEY
          break
        case 'copilot':
          apiKey = AI_CONFIG.COPILOT_API_KEY
          break
      }

      // Check if API key is provided and not a placeholder
      if (apiKey && !apiKey.includes('your-') && !apiKey.includes('api-key-here')) {
        this.realAI = createRealAI(AI_CONFIG.PROVIDER, apiKey)
        this.useRealAI = true
        console.log(`🤖 Real AI Service initialized with ${AI_CONFIG.PROVIDER.toUpperCase()}`)
      } else {
        console.log('🤖 No valid API key found, using simulated responses')
        console.log('💡 To enable real AI: Add your API key to AI_CONFIG in aiChatService.ts')
      }
    } catch (error) {
      console.error('Failed to initialize real AI service:', error)
      console.log('🤖 Falling back to simulated responses')
    }
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
      console.log('🤖 AI Chat Debug: Starting response generation for user:', userId)
      console.log('🤖 AI Chat Debug: User message:', userMessage)

      // Reload farm data to ensure we have the latest information
      await this.loadUserFarmData(userId)
      console.log('🤖 AI Chat Debug: Farm data loaded:', this.userFarmData)

      // Add user message to context
      const userChatMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString()
      }
      this.conversationContext.push(userChatMessage)

      let response: { content: string; metadata?: ChatMessage['metadata'] }

      // USE REAL AI SERVICE IF AVAILABLE
      if (this.useRealAI && this.realAI) {
        console.log('🤖 AI Chat Debug: Using real AI service')
        try {
          const aiResponse = await this.realAI.generateResponse(
            userMessage,
            this.userFarmData,
            this.conversationContext
          )
          response = aiResponse
          console.log('🤖 AI Chat Debug: Real AI response generated successfully')
        } catch (error) {
          console.error('🤖 Real AI Service Error:', error)
          console.log('🤖 Falling back to simulated responses')
          // Fall back to simulated response if real AI fails
          const farmContext = this.createFarmDataContext()
          response = await this.simulateAIResponse(userMessage, farmContext)
        }
      } else {
        console.log('🤖 AI Chat Debug: Using simulated responses')
        // Use simulated response system
        const farmContext = this.createFarmDataContext()
        response = await this.simulateAIResponse(userMessage, farmContext)
      }

      console.log('🤖 AI Chat Debug: Final response generated:', response.content.substring(0, 100) + '...')

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString(),
        farmContext: this.userFarmData,
        metadata: response.metadata
      }

      this.conversationContext.push(assistantMessage)
      console.log('🤖 AI Chat Debug: Response ready to return')
      return assistantMessage

    } catch (error) {
      console.error('🤖 AI Chat Error: Error generating AI response:', error)
      return {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "I apologize, but I'm experiencing some technical difficulties right now. Please try asking your question again in a moment. Error: " + (error as Error).message,
        timestamp: new Date().toISOString()
      }
    }
  }

  private async simulateAIResponse(userMessage: string, farmContext: string): Promise<{
    content: string
    metadata?: ChatMessage['metadata']
  }> {
    const message = userMessage.toLowerCase()
    console.log('🤖 AI Debug: Processing message:', message)

    // Enhanced farm personality analysis from notes
    const farmPersonality = this.analyzeFarmPersonality()

    // Get conversation context for follow-up questions
    const recentMessages = this.conversationContext
      .filter(msg => msg.role !== 'system')
      .slice(-4) // Last 4 messages for context

    const hasRecentContext = recentMessages.length > 0
    const lastAssistantMessage = recentMessages.find(msg => msg.role === 'assistant')?.content?.toLowerCase() || ''

    // PRIORITY 0: Handle farming goals and planning questions
    if (message.includes('farming goals') || message.includes('set effective farming goals') ||
        message.includes('farming strategy') || message.includes('short-term and long-term farming') ||
        (message.includes('goals') && (message.includes('farming') || message.includes('agricultural')))) {

      return {
        content: `🎯 **Setting Effective Farming Goals - Your Path to Success!**

Great question! Setting clear farming goals is absolutely crucial for long-term success. ${farmPersonality.greeting} Let me guide you through a comprehensive goal-setting framework:

## 🕐 **Time-Based Goal Categories:**

### **Short-Term Goals (1 Season - 1 Year):**
- **Immediate productivity:** Optimize current crop yields
- **Skill development:** Master 2-3 new farming techniques
- **Infrastructure:** Complete essential farm improvements
- **Financial:** Track and reduce input costs by 10-15%

### **Medium-Term Goals (1-3 Years):**
- **Diversification:** Expand to 3-5 different crop types
- **Technology adoption:** Implement precision farming tools
- **Market development:** Establish direct sales channels
- **Sustainability:** Achieve soil health benchmarks

### **Long-Term Goals (3-10 Years):**
- **Business expansion:** Scale operations or add value-added products
- **Environmental impact:** Carbon-neutral or regenerative practices
- **Financial independence:** Consistent profitability and savings
- **Legacy planning:** Sustainable farm transition

## 📊 **Your Current Farm Context:**
${this.generateFarmOverview()}

## 🎯 **SMART Goals Framework for Farming:**

**Specific:** "Increase tomato yield" → "Increase tomato yield from 20 to 30 tons per hectare"
**Measurable:** Track with actual data - yields, costs, profits, soil metrics
**Achievable:** Based on your land, climate, and resources
**Relevant:** Aligned with your farming situation and market demand
**Time-bound:** Set clear deadlines for each milestone

## 💡 **Goal Categories to Consider:**

### **1. Production Goals:**
- Target yields for each crop
- Quality improvements (organic certification, premium grades)
- Efficiency metrics (input costs per unit output)

### **2. Financial Goals:**
- Gross income targets
- Profit margin improvements
- Cost reduction objectives
- Investment planning

### **3. Sustainability Goals:**
- Soil health improvements (organic matter, pH balance)
- Water conservation targets
- Biodiversity enhancement
- Carbon sequestration

### **4. Personal Development Goals:**
- New skills acquisition (precision ag, marketing, processing)
- Networking and community involvement
- Work-life balance improvements

## 🚀 **Action Steps to Get Started:**

1. **Assessment:** Evaluate your current situation honestly
2. **Vision:** Define what success looks like in 5-10 years
3. **Prioritize:** Choose 3-5 most important goals
4. **Plan:** Break down into quarterly milestones
5. **Track:** Monitor progress monthly
6. **Adjust:** Revise goals based on results and changes

## 🌱 **Questions for Goal Setting:**
- What motivated you to start farming?
- What does farming success mean to you personally?
- What resources (land, capital, time) do you have available?
- What are your biggest current challenges?
- Where do you want to be in 5 years?

${farmPersonality.notes}

**Ready to dive deeper?** Tell me about your current farming situation, experience level, and what aspects of goal-setting you'd like to focus on first! I can help you develop specific, actionable goals tailored to your unique circumstances.`,

        metadata: {
          suggestedActions: [
            'Define your farming vision',
            'Set specific production targets',
            'Plan financial goals',
            'Develop sustainability objectives'
          ],
          confidence: 0.95
        }
      }
    }

    // PRIORITY 0: Handle short follow-up questions and specific crops/items
    if (message.length < 30 && hasRecentContext) {
      // Handle specific crop mentions
      if (message.includes('banana') || message.includes('bananas')) {
        return {
          content: `🍌 **Banana Growing Guide:**

Bananas are fantastic tropical/subtropical crops! Here's what you need to know:

**🌡️ Climate Requirements:**
- **Temperature:** 75-85°F (24-29°C) optimal, minimum 60°F (15°C)
- **Humidity:** High humidity preferred (50-70%)
- **Season:** Year-round in tropical areas, spring planting in subtropics
- **Frost tolerance:** None - must protect from cold

**🌱 Growing Conditions:**
- **Soil:** Well-draining, rich organic matter, pH 5.5-7.0
- **Water:** Consistent moisture, 1-2 inches weekly
- **Space:** 6-8 feet between plants (they get big!)
- **Sunlight:** Full sun to partial shade

**📍 Location Considerations:**
${this.userFarmData?.farms.length ?
  `For your farms in ${this.userFarmData.farms.map(f => f.location).join(', ')}: ` +
  'Bananas grow well in tropical/subtropical regions. Check if your climate zone supports them!' :
  'Your location will determine if outdoor growing is possible or if you need greenhouse protection.'}

**🏠 Growing Options:**
1. **Outdoor (zones 9-11):** Direct ground planting
2. **Container:** Dwarf varieties in large pots (can move indoors)
3. **Greenhouse:** Year-round production in colder climates

**🌿 Popular Varieties:**
- **Dwarf Cavendish:** Container-friendly, 4-6 feet
- **Super Dwarf Cavendish:** Even smaller, 2-4 feet
- **Dwarf Red:** Ornamental with sweet fruit
- **Ice Cream/Blue Java:** Cold-hardy, vanilla flavor

**⏰ Timeline:**
- Planting to harvest: 9-15 months
- Continuous production once established
- Each plant produces one bunch, then dies (replaced by offshoots)

${this.generateFarmNotesInsight(this.userFarmData?.farms?.[0])}

**Would you like specific advice on banana varieties for your climate, or help with setting up the growing conditions?**`,
          metadata: {
            suggestedActions: ['Check climate compatibility', 'Choose appropriate variety', 'Plan planting location'],
            confidence: 0.92
          }
        }
      }

      // Add durian detection
      if (message.includes('durian') || message.includes('duriant')) {
        return {
          content: `🌿 **Durian Growing Guide:**

Durian is the "King of Fruits" - a challenging but rewarding tropical crop! Here's what you need to know:

**🌡️ Climate Requirements:**
- **Temperature:** 75-85°F (24-29°C) year-round, minimum 70°F (21°C)
- **Humidity:** Very high humidity required (80-90%)
- **Season:** Year-round growing in equatorial regions only
- **Frost tolerance:** None - extremely cold sensitive

**🌱 Growing Conditions:**
- **Soil:** Deep, well-draining loam, rich organic matter, pH 6.0-7.0
- **Water:** Consistent high moisture, 60-80 inches rainfall annually
- **Space:** 25-30 feet between trees (they get HUGE - 130+ feet!)
- **Sunlight:** Full sun when mature, partial shade when young

**📍 Location Analysis:**
${this.userFarmData?.farms.length ?
  `For your farms in ${this.userFarmData.farms.map(f => f.location).join(', ')}: ` +
  `${this.userFarmData.farms.map(f => f.location).includes('Thành phố Hồ Chí Minh') ||
    this.userFarmData.farms.some(f => f.location.includes('Việt Nam') || f.location.includes('Vietnam')) ?
    '🇻🇳 **Excellent news!** Vietnam has ideal durian growing conditions in the Mekong Delta and southern regions!' :
    '⚠️ Durian requires very specific tropical conditions - check if your climate zone supports them.'}` :
  'Your location will determine if durian growing is possible - they need true tropical conditions.'}

**🏠 Growing Reality Check:**
- ❌ **Container growing:** Not practical (trees reach 100+ feet)
- ❌ **Greenhouse growing:** Not feasible due to size
- ✅ **Commercial orchard:** Requires large tropical land area
- ✅ **Grafted varieties:** Can reduce size but still need 20+ feet spacing

**🌿 Popular Varieties:**
- **Monthong:** Sweet, mild flavor, commercial favorite
- **Chanee:** Strong aroma, creamy texture
- **Kan Yao:** Long-stemmed, excellent taste
- **D24 Sultan:** Malaysian premium variety

**⏰ Timeline & Expectations:**
- **Planting to harvest:** 7-10 years from seed, 3-5 years grafted
- **Investment required:** Very high - specialized tropical setup
- **Harvest season:** Typically 2-3 times per year
- **Tree lifespan:** 100+ years with proper care

**🚨 Important Considerations:**
- Durian requires **PERFECT** tropical conditions
- Trees are massive and need extensive space
- Strong smell may cause neighbor complaints
- Requires specialized knowledge and patience

${this.generateFarmNotesInsight(this.userFarmData?.farms?.[0])}

**Would you like advice on assessing if your location can support durian, or are you interested in alternative tropical fruits that might be more suitable?**`,
          metadata: {
            suggestedActions: ['Assess climate compatibility', 'Consider space requirements', 'Explore alternative tropical fruits'],
            confidence: 0.95
          }
        }
      }

      // Handle other specific crops
      if (message.includes('tomato') || message.includes('tomatoes')) {
        return this.generateCropAdvice('tomatoes', farmPersonality)
      }

      if (message.includes('lettuce')) {
        return this.generateCropAdvice('lettuce', farmPersonality)
      }

      if (message.includes('carrot') || message.includes('carrots')) {
        return this.generateCropAdvice('carrots', farmPersonality)
      }

      if (message.includes('pepper') || message.includes('peppers')) {
        return this.generateCropAdvice('peppers', farmPersonality)
      }

      if (message.includes('herb') || message.includes('herbs') || message.includes('basil') || message.includes('cilantro') || message.includes('parsley')) {
        return this.generateCropAdvice('herbs', farmPersonality)
      }

      // Handle questions about previous recommendations
      if ((message.includes('how about') || message.includes('what about') || message.includes('can i')) &&
          lastAssistantMessage.includes('plant')) {
        return {
          content: `🤔 I'd love to help you with that specific choice!

Based on our previous conversation about planting, you're asking about something specific. Could you tell me:

**What crop or plant are you considering?** For example:
- Vegetables (tomatoes, lettuce, carrots, peppers)
- Fruits (strawberries, citrus, berries)
- Herbs (basil, cilantro, parsley)
- Grains (corn, wheat, rice)
- Tree crops (apples, avocados, nuts)

**🌱 Once you tell me what you're thinking of growing, I can provide:**
- Climate and season suitability
- Soil and space requirements
- Planting timeline and care instructions
- Variety recommendations for your area
- Expected harvest times and yields

${this.generateFarmOverview()}

**What specific plant were you asking about?** I'm ready to give you detailed growing advice! 🌾`,
          metadata: {
            suggestedActions: ['Specify the crop you want to grow', 'Ask about growing requirements', 'Get planting timeline'],
            confidence: 0.85
          }
        }
      }

      // Handle yes/no or simple responses to suggestions
      if (message.includes('yes') || message.includes('yeah') || message.includes('sure') || message.includes('okay')) {
        if (lastAssistantMessage.includes('would you like') || lastAssistantMessage.includes('want')) {
          return {
            content: `Great! I'm excited to help you move forward with this!

Based on our conversation, let me provide more detailed guidance. **What specific aspect would you like me to focus on?**

📋 **I can help you with:**
- Detailed step-by-step planting instructions
- Soil preparation and amendments needed
- Timing and seasonal considerations
- Tool and supply requirements
- Troubleshooting potential problems
- Harvest timing and techniques

${this.generateFarmOverview()}

**Let me know what you'd like to dive deeper into, and I'll give you comprehensive guidance!** 🌱`,
            metadata: {
              suggestedActions: ['Get detailed instructions', 'Ask about timing', 'Learn about soil prep'],
              confidence: 0.88
            }
          }
        }
      }
    }

    // PRIORITY 1: Direct farm analysis requests
    if (message.includes('my farm') || message.includes('my soil') || message.includes('my crop') ||
        (message.includes('how') && (message.includes('doing') || message.includes('looking') || message.includes('is')))) {
      return this.generatePersonalizedFarmAnalysis(farmPersonality)
    }

    // PRIORITY 2: Sensor-specific questions with current data
    if (this.userFarmData && this.userFarmData.farms.length > 0) {
      for (const farm of this.userFarmData.farms) {
        for (const sensor of farm.sensors) {
          if (sensor.latestReading) {
            const sensorType = sensor.type.toLowerCase()
            const value = sensor.latestReading.value

            // pH-related questions
            if (sensorType.includes('ph') && (message.includes('ph') || message.includes('soil') || message.includes('acid') || message.includes('alkaline'))) {
              if (value < 6.0) {
                return {
                  content: `🔬 Looking at your **${farm.name}** farm, I see your pH sensor "${sensor.name}" is reading ${value}, which is quite acidic. This can limit nutrient uptake for most crops.

Here's my professional recommendation:

🌿 **Immediate Actions:**
- Apply agricultural lime at 2-4 lbs per 1000 sq ft
- Consider organic matter like compost to buffer pH naturally
- Test your irrigation water pH as well

📍 **For your ${farm.location} location:**
- Local agricultural suppliers should carry dolomitic lime
- Spring application works best for gradual pH adjustment
- Retest in 4-6 weeks to monitor progress

${this.generateFarmNotesInsight(farm)}

Would you like specific product recommendations or help calculating the exact amount needed for your farm size?`,
                  metadata: {
                    suggestedActions: ['Apply agricultural lime', 'Add organic matter', 'Test irrigation water'],
                    relatedSensors: [sensor.id],
                    confidence: 0.95
                  }
                }
              } else if (value > 8.0) {
                return {
                  content: `🔬 Your pH reading of ${value} at **${farm.name}** is quite alkaline. This can lock up essential nutrients like iron and phosphorus.

Here's how to address this:

🌿 **Treatment Options:**
- Apply elemental sulfur (2-3 lbs per 1000 sq ft)
- Use organic acids like vinegar solution for quick adjustment
- Add acidic organic matter (pine needles, peat moss)

📍 **Location-specific advice for ${farm.location}:**
- Sulfur works slowly but provides lasting results
- Monitor closely - alkaline soils can be stubborn
- Consider switching to acid-loving crops temporarily

${this.generateFarmNotesInsight(farm)}

Would you like help creating a soil amendment schedule?`,
                  metadata: {
                    suggestedActions: ['Apply sulfur', 'Add acidic organic matter', 'Consider acid-loving crops'],
                    relatedSensors: [sensor.id],
                    confidence: 0.90
                  }
                }
              } else {
                return {
                  content: `🔬 Great news! Your pH reading of ${value} at **${farm.name}** is in the optimal range (6.0-7.5) for most crops.

**Current status:**
✅ Excellent nutrient availability
✅ Good microbial activity
✅ Optimal root development conditions

**Maintenance recommendations:**
- Continue current soil management practices
- Test again in 6 months to monitor stability
- Add organic matter regularly to maintain buffering capacity

${this.generateFarmNotesInsight(farm)}

Would you like advice on maintaining this excellent pH balance?`,
                  metadata: {
                    suggestedActions: ['Maintain current practices', 'Add organic matter', 'Regular monitoring'],
                    relatedSensors: [sensor.id],
                    confidence: 0.95
                  }
                }
              }
            }

            // Moisture-related questions
            if (sensorType.includes('moisture') && (message.includes('water') || message.includes('dry') || message.includes('wet') || message.includes('irrigation') || message.includes('moisture'))) {
              if (value < 25) {
                return {
                  content: `💧 **Alert!** Your **${farm.name}** soil moisture is critically low at ${value}%. Your plants are likely stressed.

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

${this.generateFarmNotesInsight(farm)}

Do you have an irrigation system, or are you watering manually? I can provide specific scheduling advice based on your setup.`,
                  metadata: {
                    suggestedActions: ['Water immediately', 'Check irrigation system', 'Add mulch'],
                    relatedSensors: [sensor.id],
                    confidence: 0.98
                  }
                }
              } else if (value > 80) {
                return {
                  content: `💧 Your **${farm.name}** soil moisture is quite high at ${value}%. This could lead to root rot or fungal issues.

**Recommendations:**

🌱 **Immediate Steps:**
- Reduce watering frequency temporarily
- Ensure proper drainage around plants
- Check for standing water areas

📊 **Monitoring:**
- Watch for signs of overwatering (yellowing leaves, musty smell)
- Test soil drainage by digging a small hole
- Consider raised beds if drainage is poor

${this.generateFarmNotesInsight(farm)}

Would you like help improving your drainage system?`,
                  metadata: {
                    suggestedActions: ['Reduce watering', 'Improve drainage', 'Monitor plant health'],
                    relatedSensors: [sensor.id],
                    confidence: 0.92
                  }
                }
              } else {
                return {
                  content: `💧 Perfect! Your **${farm.name}** soil moisture at ${value}% is in the ideal range for healthy plant growth.

**Current status:**
✅ Optimal water availability for roots
✅ Good soil aeration
✅ Reduced risk of fungal issues

**Maintenance tips:**
- Continue current watering schedule
- Monitor during weather changes
- Mulch around plants to maintain consistency

${this.generateFarmNotesInsight(farm)}

Your irrigation management is working well! Any specific watering questions I can help with?`,
                  metadata: {
                    suggestedActions: ['Maintain schedule', 'Monitor weather', 'Add mulch'],
                    relatedSensors: [sensor.id],
                    confidence: 0.95
                  }
                }
              }
            }

            // Temperature-related questions
            if (sensorType.includes('temp') && (message.includes('temperature') || message.includes('hot') || message.includes('cold') || message.includes('heat'))) {
              if (value > 35) {
                return {
                  content: `🌡️ High temperature alert! Your **${farm.name}** is recording ${value}°C, which is stressful for most crops.

**Heat stress management:**

❄️ **Immediate Actions:**
- Increase watering frequency (early morning/late evening)
- Provide shade cloth or temporary covering
- Mulch heavily to insulate soil

🌿 **Crop protection:**
- Monitor for wilting and heat stress signs
- Consider misting for humidity-loving plants
- Harvest mature crops before peak heat

${this.generateFarmNotesInsight(farm)}

What crops are you currently growing? I can provide heat-specific protection strategies.`,
                  metadata: {
                    suggestedActions: ['Increase watering', 'Add shade protection', 'Monitor crops closely'],
                    relatedSensors: [sensor.id],
                    confidence: 0.94
                  }
                }
              } else if (value < 10) {
                return {
                  content: `🥶 Cold temperature alert! Your **${farm.name}** is at ${value}°C, which could stress or damage sensitive crops.

**Cold protection strategies:**

🔥 **Immediate Actions:**
- Cover sensitive plants with frost cloth
- Water soil before expected frost (thermal mass)
- Consider temporary heating for greenhouses

🌱 **Crop considerations:**
- Harvest tender vegetables immediately
- Protect root systems with mulch
- Move containers to sheltered areas

${this.generateFarmNotesInsight(farm)}

What crops do you have that might need protection from this cold snap?`,
                  metadata: {
                    suggestedActions: ['Cover plants', 'Harvest tender crops', 'Add protection'],
                    relatedSensors: [sensor.id],
                    confidence: 0.92
                  }
                }
              } else {
                return {
                  content: `🌡️ Great temperature! Your **${farm.name}** at ${value}°C is in the ideal range for most crops.

**Current conditions:**
✅ Optimal for plant metabolism
✅ Good for root development
✅ Suitable for most farming activities

**Seasonal advice:**
- Perfect conditions for transplanting
- Good time for outdoor activities
- Monitor for any upcoming weather changes

${this.generateFarmNotesInsight(farm)}

This is excellent farming weather! What projects are you planning to tackle?`,
                  metadata: {
                    suggestedActions: ['Plan outdoor work', 'Consider transplanting', 'Monitor weather'],
                    relatedSensors: [sensor.id],
                    confidence: 0.90
                  }
                }
              }
            }
          }
        }
      }
    }

    // PRIORITY 3: General farming topic responses - MUCH MORE EXPANSIVE

    // Pest and disease questions
    if (message.includes('pest') || message.includes('bug') || message.includes('insect') ||
        message.includes('disease') || message.includes('fungus') || message.includes('weed') ||
        message.includes('aphid') || message.includes('caterpillar') || message.includes('spider')) {
      return {
        content: `🐛 Pest and disease management is crucial for healthy crops! ${farmPersonality.experience} Let me help you with an integrated approach:

**🔍 First, let's identify the issue:**
- What symptoms are you seeing? (holes, yellowing, spots, wilting)
- Which plants are affected?
- Any visible insects, eggs, or unusual growths?
- When did you first notice the problem?

**🛡️ My recommended Integrated Pest Management (IPM) strategy:**

1. **Prevention First:**
   - Encourage beneficial insects with diverse plantings
   - Maintain healthy soil ${this.userFarmData?.farms.length ? '(your sensor data helps monitor this!)' : ''}
   - Proper plant spacing for good air circulation
   - Crop rotation to break pest cycles

2. **Monitoring & Identification:**
   - Weekly crop inspections during growing season
   - Yellow sticky traps for flying pests
   - Document patterns, timing, and weather conditions
   - Photos help with accurate identification

3. **Treatment Options (escalating approach):**
   - **Organic:** Neem oil, insecticidal soap, beneficial insects
   - **Biological:** Bacillus thuringiensis, beneficial nematodes
   - **Mechanical:** Hand-picking, row covers, barriers
   - **Chemical:** Only as last resort, targeted applications

${this.generateFarmOverview()}

**Can you describe what you're seeing?** Photos would help tremendously with identification and treatment recommendations!`,
        metadata: {
          suggestedActions: ['Inspect crops weekly', 'Take photos for ID', 'Try organic treatments first'],
          confidence: 0.88
        }
      }
    }

    // Fertilizer and nutrition questions
    if (message.includes('fertilizer') || message.includes('nutrient') || message.includes('nitrogen') ||
        message.includes('feeding') || message.includes('compost') || message.includes('manure') ||
        message.includes('npk') || message.includes('phosphorus') || message.includes('potassium')) {
      return {
        content: `🌾 Plant nutrition is absolutely fundamental to successful farming! ${farmPersonality.approach} Let me guide you through a science-based approach:

**📊 Your current setup:**
${this.generateFarmOverview()}

**🧪 My fertilizer philosophy:**

1. **Test First - Never Guess:**
   - Soil test every 2-3 years minimum
   - Your sensor data helps with ongoing monitoring
   - Understanding your baseline prevents waste and damage

2. **The N-P-K Triangle:**
   - **Nitrogen (N):** Leaf growth, chlorophyll, protein synthesis
   - **Phosphorus (P):** Root development, flowering, energy transfer
   - **Potassium (K):** Disease resistance, water regulation, fruit quality

3. **Organic vs. Synthetic - Why Not Both?**
   - **Organic:** Slow release, improves soil biology, long-term health
   - **Synthetic:** Quick response, precise control, immediate results
   - **Best approach:** Strategic combination based on timing and needs

**💡 Smart application strategies:**
- Split applications prevent nutrient loss and plant burn
- Time applications with crop growth stages
- Weather matters - never apply before heavy rain
- Less is often more - over-fertilizing causes more problems than under-fertilizing

**🌱 Secondary nutrients matter too:**
- Calcium, Magnesium, Sulfur are often overlooked
- Micronutrients: Iron, Zinc, Boron, Manganese

${farmPersonality.notes}

**What specific crops are you growing?** I can provide detailed fertilizer schedules and application rates tailored to your plants and soil conditions!`,
        metadata: {
          suggestedActions: ['Test soil first', 'Plan fertilizer schedule', 'Choose appropriate N-P-K ratio'],
          confidence: 0.90
        }
      }
    }

    // Planting and crop selection
    if (message.includes('plant') || message.includes('crop') || message.includes('seed') ||
        message.includes('grow') || message.includes('variety') || message.includes('cultivar') ||
        message.includes('when') || message.includes('what') && (message.includes('grow') || message.includes('plant'))) {
      return {
        content: `🌱 Excellent question about planting and crop selection! ${farmPersonality.greeting} Let me help you make the best choices:

**🗓️ Timing is everything in farming:**
- **Current season:** September is typically harvest time for summer crops and planting time for cool-season vegetables
- **Your location:** ${this.userFarmData?.farms.length ? `Based on your farms in ${this.userFarmData.farms.map(f => f.location).join(', ')}` : 'Location-specific timing is crucial'}
- **Frost dates:** Know your first and last frost dates for proper planning

**🌿 Crop selection considerations:**

1. **Climate compatibility:**
   - Temperature requirements (cool vs. warm season)
   - Day length sensitivity (long vs. short day plants)
   - Chill hour requirements for fruit trees

2. **Soil requirements:**
   - pH preferences (your sensor data helps here!)
   - Drainage needs (well-drained vs. moisture-loving)
   - Nutrient requirements

3. **Space and time management:**
   - Mature plant size and spacing
   - Days to maturity
   - Succession planting opportunities

**📋 Popular fall/winter planting options:**
- **Cool season vegetables:** Lettuce, spinach, kale, carrots, radishes
- **Cover crops:** Crimson clover, winter rye, hairy vetch
- **Herbs:** Cilantro, parsley, chives
- **Root vegetables:** Turnips, beets, winter radishes

${this.generateFarmOverview()}

**What specifically are you thinking of growing?** Tell me about your space, goals, and preferences - I can provide detailed planting guides!`,
        metadata: {
          suggestedActions: ['Check frost dates', 'Plan garden layout', 'Choose appropriate varieties'],
          confidence: 0.92
        }
      }
    }

    // Weather and climate questions
    if (message.includes('weather') || message.includes('rain') || message.includes('drought') ||
        message.includes('climate') || message.includes('season') || message.includes('frost')) {
      return {
        content: `🌦️ Weather and climate planning is absolutely critical for successful farming! Let me help you work with Mother Nature:

**☔ Current weather considerations:**
- **Season:** Late September - transition period requiring careful attention
- **Typical challenges:** Changing temperatures, variable rainfall, early frost risk
- **Opportunities:** Excellent time for fall planting and winter prep

**🌡️ Weather-based farming strategies:**

1. **Temperature management:**
   - Monitor nighttime lows for frost protection
   - Use season extenders (row covers, cold frames)
   - Take advantage of warm days for outdoor work

2. **Precipitation planning:**
   - Adjust irrigation based on rainfall forecasts
   - Prepare for both drought and excess water scenarios
   - Install proper drainage for heavy rain events

3. **Microclimate awareness:**
   - South-facing slopes warm faster in spring
   - Low areas collect cold air and frost
   - Wind protection reduces plant stress

**📊 Your farm data advantage:**
${this.userFarmData?.farms.length ?
  `With sensors on your ${this.userFarmData.farms.length} farm(s), you can make data-driven decisions about weather responses!` :
  'Adding weather sensors would give you real-time data for better decision making!'}

**🎯 Seasonal action items:**
- Protect tender plants from early frost
- Harvest heat-sensitive crops before temperature drops
- Plant cool-season crops for winter harvest
- Prepare irrigation systems for temperature changes

${this.generateFarmOverview()}

**What weather challenges are you currently facing?** I can provide specific strategies for your situation!`,
        metadata: {
          suggestedActions: ['Monitor weather forecasts', 'Protect from frost', 'Adjust irrigation'],
          confidence: 0.89
        }
      }
    }

    // Soil and composting questions
    if (message.includes('soil') || message.includes('compost') || message.includes('organic matter') ||
        message.includes('earthworm') || message.includes('mulch') || message.includes('amendment')) {
      return {
        content: `🪱 Soil health is the foundation of everything we do in farming! ${farmPersonality.experience} Let's dive into building amazing soil:

**🌱 Healthy soil characteristics:**
- Rich, dark color with earthy smell
- Crumbles easily but holds together when moist
- Full of beneficial microorganisms and earthworms
- Good water infiltration and retention

**📊 Your soil monitoring:**
${this.userFarmData?.farms.length ?
  `Your sensor data shows: ${this.userFarmData.farms.map(farm =>
    `${farm.name} - ${farm.sensors.filter(s => s.type.toLowerCase().includes('ph')).length > 0 ? 'pH monitored' : 'no pH sensor'}, ${farm.sensors.filter(s => s.type.toLowerCase().includes('moisture')).length > 0 ? 'moisture tracked' : 'no moisture sensor'}`
  ).join('; ')}` :
  'Soil sensors would give you invaluable data for management decisions!'}

**🔄 Soil improvement strategies:**

1. **Organic matter addition:**
   - Compost: The gold standard for soil improvement
   - Well-aged manure: Excellent nutrient source
   - Leaf mold: Great for soil structure
   - Cover crops: Living soil improvement

2. **Composting basics:**
   - Browns (carbon): Dry leaves, straw, paper
   - Greens (nitrogen): Kitchen scraps, fresh grass clippings
   - 3:1 carbon to nitrogen ratio
   - Turn regularly, keep moist but not soggy

3. **Natural soil amendments:**
   - Bone meal for phosphorus
   - Kelp meal for trace minerals
   - Rock dust for slow-release minerals
   - Mycorrhizal fungi for root health

**🪱 Biological soil health:**
- Encourage earthworms - they're nature's tillers
- Minimize soil disturbance when possible
- Avoid chemical inputs that harm soil biology
- Use diverse plantings to feed soil microbes

${this.generateFarmOverview()}

**What's your current soil situation?** Tell me about texture, drainage, or any specific challenges you're facing!`,
        metadata: {
          suggestedActions: ['Add organic matter', 'Start composting', 'Test soil health'],
          confidence: 0.94
        }
      }
    }

    // Irrigation and water management
    if (message.includes('irrigation') || message.includes('water') || message.includes('drip') ||
        message.includes('sprinkler') || message.includes('drought') || message.includes('drainage')) {
      return {
        content: `💧 Water management is absolutely critical - it's often the difference between success and failure! Let me help you optimize your irrigation:

**🌊 Water management principles:**
- Deep, less frequent watering promotes strong root systems
- Water early morning to reduce evaporation and disease
- Soil type determines watering frequency and duration
- Plant growth stage affects water needs

**📊 Your current moisture monitoring:**
${this.userFarmData?.farms.length ?
  this.userFarmData.farms.map(farm => {
    const moistureSensors = farm.sensors.filter(s => s.type.toLowerCase().includes('moisture'))
    return `**${farm.name}:** ${moistureSensors.length > 0 ?
      moistureSensors.map(s => s.latestReading ?
        `${s.name} at ${s.latestReading.value}${s.latestReading.unit}` :
        `${s.name} (no recent data)`).join(', ') :
      'No moisture sensors - consider adding for precision irrigation'}`
  }).join('\n') :
  'Soil moisture sensors would transform your irrigation efficiency!'}

**🚿 Irrigation system options:**

1. **Drip irrigation (most efficient):**
   - 90-95% water efficiency
   - Delivers water directly to root zones
   - Reduces weeds and disease pressure
   - Perfect for vegetables, fruits, and row crops

2. **Sprinkler systems:**
   - Good for large areas and lawns
   - Can create humidity for certain crops
   - Less efficient than drip (70-85%)
   - Watch for leaf diseases in humid conditions

3. **Hand watering:**
   - Most control but labor-intensive
   - Perfect for containers and small gardens
   - Easy to adjust for individual plant needs

**💡 Water conservation strategies:**
- Mulching reduces evaporation by 50-70%
- Windbreaks reduce water loss from wind
- Proper soil preparation improves water retention
- Choose drought-tolerant varieties when possible

**🌱 Signs your plants need water:**
- Soil feels dry 1-2 inches below surface
- Leaves begin to wilt during hottest part of day
- Color becomes dull or grayish
- Growth slows noticeably

${this.generateFarmOverview()}

**What's your current irrigation setup?** I can help optimize your system for better efficiency and plant health!`,
        metadata: {
          suggestedActions: ['Check soil moisture', 'Consider drip irrigation', 'Add mulch for conservation'],
          confidence: 0.91
        }
      }
    }

    // PRIORITY 4: Enhanced topic detection - catch more question types

    // Equipment and tools questions
    if (message.includes('tool') || message.includes('equipment') || message.includes('machine') ||
        message.includes('tractor') || message.includes('hoe') || message.includes('rake') ||
        message.includes('shovel') || message.includes('pruner') || message.includes('greenhouse')) {
      return {
        content: `🛠️ Farm tools and equipment are essential for efficient farming! ${farmPersonality.experience} Let me help you choose the right tools:

**🔧 Essential hand tools:**
- **Digging:** Spade, shovel, garden fork
- **Cultivation:** Hoe, rake, cultivator
- **Pruning:** Pruning shears, loppers, hand saw
- **Maintenance:** Watering can, wheelbarrow, gloves

**🚜 Power equipment considerations:**
- **Small farms:** Rototiller, pressure washer, leaf blower
- **Medium farms:** Walk-behind tractor, brush cutter, chipper
- **Large operations:** Compact tractor, implements, irrigation systems

**🏠 Infrastructure:**
- **Protection:** Greenhouse, cold frames, row covers
- **Storage:** Tool shed, compost bins, seed storage
- **Processing:** Wash station, drying racks, packaging area

${this.generateFarmOverview()}

**What specific tools or equipment are you considering?** I can provide detailed recommendations based on your farm size and crops!`,
        metadata: {
          suggestedActions: ['Assess current tools', 'Plan equipment purchases', 'Consider farm size needs'],
          confidence: 0.87
        }
      }
    }

    // Harvesting and storage questions
    if (message.includes('harvest') || message.includes('picking') || message.includes('storage') ||
        message.includes('preserve') || message.includes('canning') || message.includes('freeze') ||
        message.includes('dry') || message.includes('cure') || message.includes('ripen')) {
      return {
        content: `🗂️ Harvesting and post-harvest handling are crucial for quality and shelf life! ${farmPersonality.approach}

**⏰ Harvest timing indicators:**
- **Visual cues:** Color changes, size, appearance
- **Physical tests:** Firmness, ease of removal from plant
- **Taste tests:** Sugar content, flavor development
- **Time tracking:** Days to maturity from planting

**📦 Storage methods:**
- **Short-term:** Refrigeration, cool storage, controlled atmosphere
- **Long-term:** Root cellars, freezing, dehydration, canning
- **Specialty:** Curing (onions, garlic), ripening rooms (tomatoes)

**🥫 Preservation techniques:**
- **Freezing:** Blanch most vegetables first
- **Dehydrating:** Low heat, good air circulation
- **Canning:** Follow tested recipes for safety
- **Fermentation:** Natural preservation with probiotics

${this.generateFarmOverview()}

**What crops are you looking to harvest or preserve?** I can provide specific timing and storage recommendations!`,
        metadata: {
          suggestedActions: ['Plan harvest schedule', 'Set up storage systems', 'Learn preservation methods'],
          confidence: 0.90
        }
      }
    }

    // Business and economics questions
    if (message.includes('profit') || message.includes('money') || message.includes('sell') ||
        message.includes('market') || message.includes('business') || message.includes('cost') ||
        message.includes('price') || message.includes('income') || message.includes('budget')) {
      return {
        content: `💰 Farm economics and profitability are essential for sustainable operations! ${farmPersonality.approach}

**📊 Key financial considerations:**
- **Revenue streams:** Direct sales, farmers markets, CSA, wholesale
- **Cost management:** Input costs, labor, equipment, land
- **Profit margins:** Understanding true costs vs. selling prices
- **Cash flow:** Seasonal income patterns, expense timing

**🏪 Marketing channels:**
- **Direct to consumer:** Farmers markets, roadside stands, online sales
- **Restaurants:** Local farm-to-table establishments
- **Institutions:** Schools, hospitals, corporate cafeterias
- **Value-added:** Processing, prepared foods, agritourism

**📈 Business planning:**
- **Record keeping:** Track all expenses and income
- **Crop planning:** High-value crops, market demand analysis
- **Efficiency:** Maximize yield per square foot/hour of labor
- **Diversification:** Multiple income streams reduce risk

${this.generateFarmOverview()}

**What aspect of farm business are you most interested in?** I can help with market analysis, pricing strategies, or business planning!`,
        metadata: {
          suggestedActions: ['Analyze market opportunities', 'Track farm finances', 'Plan profitable crops'],
          confidence: 0.85
        }
      }
    }

    // Organic and sustainable farming questions
    if (message.includes('organic') || message.includes('sustainable') || message.includes('natural') ||
        message.includes('chemical-free') || message.includes('eco') || message.includes('green') ||
        message.includes('permaculture') || message.includes('biodiversity') || message.includes('ecosystem')) {
      return {
        content: `🌱 Sustainable and organic farming practices create healthy ecosystems! ${farmPersonality.greeting}

**🔄 Sustainable farming principles:**
- **Soil health:** Build organic matter, minimize tillage
- **Biodiversity:** Diverse plantings, habitat creation
- **Water conservation:** Efficient irrigation, rainwater harvesting
- **Energy efficiency:** Renewable energy, reduced inputs

**🚫 Organic pest management:**
- **Prevention:** Healthy soil, crop rotation, companion planting
- **Biological controls:** Beneficial insects, microbial pesticides
- **Physical barriers:** Row covers, traps, hand removal
- **Natural sprays:** Neem oil, soap solutions, botanical extracts

**🌿 Natural fertility management:**
- **Composting:** On-farm organic matter recycling
- **Cover crops:** Nitrogen fixation, soil protection
- **Animal integration:** Rotational grazing, manure management
- **Minimal inputs:** Reduce dependency on external fertilizers

**🦋 Ecosystem benefits:**
- **Pollinator support:** Native plants, pesticide reduction
- **Wildlife habitat:** Hedgerows, water features, nesting sites
- **Carbon sequestration:** Soil organic matter, perennial crops
- **Water quality:** Reduced runoff, buffer strips

${this.generateFarmOverview()}

**What sustainable practices are you most interested in implementing?** I can provide specific guidance for organic certification or eco-friendly methods!`,
        metadata: {
          suggestedActions: ['Implement sustainable practices', 'Explore organic certification', 'Create wildlife habitat'],
          confidence: 0.93
        }
      }
    }

    // Livestock and animal husbandry questions
    if (message.includes('livestock') || message.includes('chicken') || message.includes('goat') ||
        message.includes('cow') || message.includes('pig') || message.includes('sheep') ||
        message.includes('animal') || message.includes('pasture') || message.includes('grazing') ||
        message.includes('feed') || message.includes('barn') || message.includes('fence')) {
      return {
        content: `🐄 Livestock integration can enhance farm productivity and sustainability! ${farmPersonality.experience}

**🐓 Popular farm animals:**
- **Chickens:** Eggs, meat, pest control, fertilizer
- **Goats:** Meat, milk, brush clearing, companionship
- **Sheep:** Wool, meat, milk, pasture management
- **Cattle:** Beef, dairy, land management
- **Pigs:** Meat, land clearing, waste processing

**🌾 Pasture management:**
- **Rotational grazing:** Prevent overgrazing, improve soil
- **Pasture improvement:** Seeding, fertilizing, weed control
- **Water systems:** Automatic waterers, pond management
- **Fencing:** Electric, permanent, temporary paddocks

**🏠 Infrastructure needs:**
- **Shelter:** Barns, run-in sheds, coops
- **Storage:** Feed, bedding, equipment
- **Handling:** Gates, chutes, loading areas
- **Biosecurity:** Quarantine areas, sanitation stations

**📋 Management considerations:**
- **Health:** Vaccination schedules, parasite control
- **Nutrition:** Balanced feed, mineral supplements
- **Breeding:** Selection, record keeping, genetic diversity
- **Regulations:** Zoning, permits, organic standards

${this.generateFarmOverview()}

**What type of livestock are you considering?** I can provide specific guidance on housing, feeding, and management requirements!`,
        metadata: {
          suggestedActions: ['Plan livestock integration', 'Design pasture systems', 'Research local regulations'],
          confidence: 0.88
        }
      }
    }

    // Technology and innovation questions
    if (message.includes('technology') || message.includes('sensor') || message.includes('automation') ||
        message.includes('drone') || message.includes('robot') || message.includes('app') ||
        message.includes('smart') || message.includes('iot') || message.includes('precision') ||
        message.includes('gps') || message.includes('data') || message.includes('monitor')) {
      return {
        content: `📱 Agricultural technology is revolutionizing farming efficiency! ${farmPersonality.approach}

**📊 Precision agriculture:**
- **GPS guidance:** Accurate planting, spraying, harvesting
- **Variable rate application:** Site-specific inputs
- **Yield mapping:** Data-driven decision making
- **Soil sampling:** Grid-based nutrient management

**🤖 Automation opportunities:**
- **Irrigation:** Smart controllers, soil moisture sensors
- **Monitoring:** Weather stations, crop cameras
- **Greenhouse:** Climate control, nutrient delivery
- **Livestock:** Automated feeding, health monitoring

**📱 Digital tools:**
- **Farm management software:** Record keeping, planning
- **Weather apps:** Forecasting, alerts, historical data
- **Market platforms:** Direct sales, price tracking
- **Educational resources:** Extension services, online courses

**🛰️ Emerging technologies:**
- **Drones:** Crop scouting, spraying, mapping
- **AI analysis:** Image recognition, predictive modeling
- **Blockchain:** Traceability, supply chain transparency
- **Renewable energy:** Solar panels, wind power, battery storage

${this.userFarmData?.farms.length ?
  `**Your current tech setup:** ${this.userFarmData.farms.map(farm =>
    `${farm.name} has ${farm.sensors.length} sensors monitoring conditions`
  ).join(', ')}` :
  '**Getting started:** Soil sensors and weather monitoring are great first steps!'}

**What agricultural technology interests you most?** I can recommend specific tools and implementation strategies!`,
        metadata: {
          suggestedActions: ['Evaluate technology needs', 'Start with basic sensors', 'Research automation options'],
          confidence: 0.91
        }
      }
    }

    // PRIORITY 5: Universal question handler - This catches EVERYTHING else
    // Remove the restrictive length and keyword requirements from the general advice section

    // Universal response for any question not caught above
    if (message.length > 0) { // ANY non-empty message gets a response
      // Analyze the question content to provide relevant guidance
      let questionType = "general farming"
      let specificGuidance = ""

      // Try to categorize the question
      if (message.includes('?') || message.includes('how') || message.includes('what') || message.includes('when') ||
          message.includes('where') || message.includes('why') || message.includes('which') || message.includes('can')) {
        questionType = "question"
        specificGuidance = "I can see you have a specific question! "
      }

      if (message.includes('problem') || message.includes('issue') || message.includes('wrong') ||
          message.includes('not working') || message.includes('dying') || message.includes('failing')) {
        questionType = "problem-solving"
        specificGuidance = "It sounds like you're dealing with a farming challenge. "
      }

      if (message.includes('learn') || message.includes('teach') || message.includes('explain') ||
          message.includes('understand') || message.includes('new') || message.includes('beginner')) {
        questionType = "educational"
        specificGuidance = "I love helping people learn about farming! "
      }

      return {
        content: `👨‍🌾 ${specificGuidance}I'm Dr. AgriBot, your comprehensive agricultural specialist, and I'm here to help with absolutely any farming question or challenge you have!

**🎯 You asked:** "${userMessage}"

${farmPersonality.greeting} Let me provide you with the most relevant guidance:

**🌟 Based on your question, I can help with:**
- **Crop-specific advice** - Growing guides for any plant you want to cultivate
- **Problem diagnosis** - Identifying and solving plant, soil, or pest issues
- **Seasonal planning** - What to do when throughout the farming year
- **Technical guidance** - Tools, techniques, and best practices
- **Business aspects** - Profitability, marketing, and farm management
- **Sustainable practices** - Organic methods and environmental stewardship

**📊 Your farming context:**
${this.generateFarmOverview()}

**💡 To give you the most helpful response:**
- Feel free to ask about any specific crops, problems, or farming topics
- Share details about your location, experience level, or goals
- Ask follow-up questions - I remember our conversation context
- I can provide both beginner-friendly and advanced agricultural guidance

${farmPersonality.notes}

**Let me address your specific interest!** Whether it's about ${questionType === 'problem-solving' ? 'solving farming problems' : questionType === 'educational' ? 'learning farming techniques' : 'general farming topics'}, I have the expertise to guide you through it.

**What would you like to know more about?** I can provide detailed, practical advice tailored to your specific farming situation! 🌾`,
        metadata: {
          suggestedActions: [
            'Ask about specific crops or techniques',
            'Describe any farming challenges you\'re facing',
            'Share your farming goals and experience level',
            'Request guidance on any agricultural topic'
          ],
          confidence: 0.80
        }
      }
    }

    // This should never be reached, but just in case
    return {
      content: `👨‍🌾 Hello! I'm Dr. AgriBot, ready to help with any farming question or challenge you might have!

${farmPersonality.greeting}

**🌟 I can assist with any agricultural topic:**
- Crop selection and growing guides
- Soil health and improvement
- Pest and disease management
- Irrigation and water management
- Farm tools and equipment
- Sustainable and organic practices
- Farm business and profitability

${this.generateFarmOverview()}

**What farming topic can I help you with today?** Just ask me anything - I'm designed to provide helpful agricultural guidance no matter what you're curious about! 🌾`,
      metadata: {
        suggestedActions: ['Ask any farming question', 'Share your farming goals', 'Describe any challenges'],
        confidence: 0.75
      }
    }
  }

  // New method to analyze farm personality from notes
  private analyzeFarmPersonality(): {
    experience: string
    approach: string
    greeting: string
    notes: string
  } {
    if (!this.userFarmData?.farms.length) {
      return {
        experience: "As someone starting their farming journey,",
        approach: "I recommend beginning with the basics:",
        greeting: "I'm excited to help you get started with farming!",
        notes: "Once you add your farms and sensors, I can provide personalized advice!"
      }
    }

    const allNotes = this.userFarmData.farms
      .map(farm => farm.notes || '')
      .join(' ')
      .toLowerCase()

    let experience = "Based on your farming setup,"
    let approach = "Here's my tailored approach for you:"
    let greeting = "I see you have some great farming operations!"
    let notes = ""

    // Analyze experience level from notes
    if (allNotes.includes('beginner') || allNotes.includes('new') || allNotes.includes('first time')) {
      experience = "I can see you're new to farming, which is wonderful!"
      approach = "As a beginner, I recommend starting with fundamentals:"
      greeting = "Welcome to the wonderful world of farming!"
    } else if (allNotes.includes('experienced') || allNotes.includes('years') || allNotes.includes('professional')) {
      experience = "I can tell you have farming experience,"
      approach = "Given your background, let's focus on optimization:"
      greeting = "Great to work with an experienced farmer!"
    }

    // Analyze farming style from notes
    if (allNotes.includes('organic') || allNotes.includes('sustainable')) {
      approach += "\n- Organic/sustainable methods are clearly important to you"
      notes += "🌱 I notice you value sustainable farming - I'll prioritize eco-friendly solutions.\n"
    }

    if (allNotes.includes('commercial') || allNotes.includes('business') || allNotes.includes('profit')) {
      approach += "\n- Commercial viability and efficiency focus"
      notes += "💼 I see this is a commercial operation - I'll focus on productivity and ROI.\n"
    }

    return { experience, approach, greeting, notes }
  }

  // New method to generate personalized farm analysis
  private generatePersonalizedFarmAnalysis(personality: any): {
    content: string
    metadata?: ChatMessage['metadata']
  } {
    if (!this.userFarmData?.farms.length) {
      return {
        content: `📊 I'd love to analyze your farm conditions, but I don't see any farms registered yet!

**To get personalized insights:**
1. Add your farm details in the app
2. Install sensors for real-time monitoring
3. Add notes about your farming goals and methods

${personality.greeting} Once you set up your farms, I can provide detailed analysis of:
- Soil conditions and sensor readings
- Personalized recommendations
- Location-specific advice
- Progress tracking over time

Ready to add your first farm? I'm here to help guide you through it!`,
        metadata: {
          suggestedActions: ['Add farm details', 'Install sensors', 'Set farming goals'],
          confidence: 0.80
        }
      }
    }

    let analysis = `📊 **Farm Analysis Report**\n\n`

    this.userFarmData.farms.forEach((farm, index) => {
      analysis += `**🏡 Farm ${index + 1}: ${farm.name}** (${farm.location})\n`

      if (farm.notes) {
        analysis += `📝 *Your notes: "${farm.notes}"*\n`
      }

      if (farm.sensors.length > 0) {
        analysis += `📡 **Sensor Status (${farm.sensors.length} active):**\n`
        farm.sensors.forEach(sensor => {
          if (sensor.latestReading) {
            const status = this.analyzeSensorStatus(sensor)
            analysis += `• ${sensor.name}: ${sensor.latestReading.value}${sensor.latestReading.unit} ${status.emoji} ${status.message}\n`
          } else {
            analysis += `• ${sensor.name}: No recent data ⚠️\n`
          }
        })
      } else {
        analysis += `📡 No sensors installed - consider adding monitoring equipment\n`
      }
      analysis += `\n`
    })

    analysis += `**🎯 Overall Assessment:**\n`
    analysis += `${personality.experience} your farm${this.userFarmData.farms.length > 1 ? 's are' : ' is'} showing ${this.getOverallHealthStatus()}.\n\n`

    const recommendations = this.generateTopRecommendations()
    analysis += `**💡 Top Recommendations:**\n${recommendations.join('\n')}\n\n`

    analysis += `Would you like me to dive deeper into any specific aspect of your farm management?`

    return {
      content: analysis,
      metadata: {
        suggestedActions: ['Check sensor readings', 'Review recommendations', 'Plan improvements'],
        confidence: 0.95
      }
    }
  }

  // New helper methods
  private generateFarmNotesInsight(farm: any): string {
    if (!farm.notes) return ""

    return `📝 **Your farm context:** "${farm.notes}" - This insight helps me tailor my recommendations specifically for your situation and goals.`
  }

  private generateFarmOverview(): string {
    if (!this.userFarmData?.farms.length) {
      return "Add your farm details for personalized recommendations!"
    }

    return this.userFarmData.farms.map(farm =>
      `- **${farm.name}** (${farm.location}): ${farm.sensors.length} sensors monitoring${farm.notes ? ` | *"${farm.notes.substring(0, 40)}${farm.notes.length > 40 ? '..."*' : ''}` : ''}`
    ).join('\n')
  }

  private analyzeSensorStatus(sensor: any): { emoji: string, message: string } {
    const sensorType = sensor.type.toLowerCase()
    const value = sensor.latestReading.value

    if (sensorType.includes('ph')) {
      if (value >= 6.0 && value <= 7.5) return { emoji: '✅', message: '(Optimal)' }
      if (value < 6.0) return { emoji: '🟡', message: '(Acidic - needs lime)' }
      if (value > 7.5) return { emoji: '🟡', message: '(Alkaline - needs sulfur)' }
    }

    if (sensorType.includes('moisture')) {
      if (value >= 40 && value <= 70) return { emoji: '✅', message: '(Good moisture)' }
      if (value < 40) return { emoji: '🔴', message: '(Needs water!)' }
      if (value > 70) return { emoji: '🟡', message: '(High moisture)' }
    }

    if (sensorType.includes('temp')) {
      if (value >= 18 && value <= 30) return { emoji: '✅', message: '(Good temperature)' }
      if (value > 30) return { emoji: '🔴', message: '(Heat stress risk!)' }
      if (value < 18) return { emoji: '🟡', message: '(Cool conditions)' }
    }

    return { emoji: '📊', message: '(Monitoring)' }
  }

  private getOverallHealthStatus(): string {
    if (!this.userFarmData?.farms.length) return "unknown status"

    let goodReadings = 0
    let totalReadings = 0

    this.userFarmData.farms.forEach(farm => {
      farm.sensors.forEach(sensor => {
        if (sensor.latestReading) {
          totalReadings++
          const status = this.analyzeSensorStatus(sensor)
          if (status.emoji === '✅') goodReadings++
        }
      })
    })

    if (totalReadings === 0) return "unknown status (no sensor data)"

    const healthPercent = (goodReadings / totalReadings) * 100
    if (healthPercent >= 80) return "excellent health 🌟"
    if (healthPercent >= 60) return "good condition ✅"
    if (healthPercent >= 40) return "fair condition ⚠️"
    return "needs attention 🔴"
  }

  private generateTopRecommendations(): string[] {
    const recommendations = []

    if (!this.userFarmData?.farms.length) {
      return ["Set up your first farm profile", "Install monitoring sensors", "Define your farming goals"]
    }

    this.userFarmData.farms.forEach(farm => {
      farm.sensors.forEach(sensor => {
        if (sensor.latestReading) {
          const status = this.analyzeSensorStatus(sensor)
          if (status.emoji === '🔴') {
            recommendations.push(`${farm.name}: Address ${sensor.name} immediately ${status.message}`)
          } else if (status.emoji === '🟡') {
            recommendations.push(`${farm.name}: Monitor ${sensor.name} closely ${status.message}`)
          }
        }
      })
    })

    if (recommendations.length === 0) {
      recommendations.push("All sensors showing good readings - maintain current practices!")
      recommendations.push("Consider expanding sensor coverage for better insights")
    }

    return recommendations.slice(0, 3) // Top 3 recommendations
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

  // New method to generate crop-specific advice
  private generateCropAdvice(crop: string, farmPersonality: any): {
    content: string
    metadata?: ChatMessage['metadata']
  } {
    const cropGuides: { [key: string]: any } = {
      'tomatoes': {
        title: '🍅 **Tomato Growing Guide:**',
        intro: 'Tomatoes are one of the most rewarding crops to grow!',
        climate: [
          '**Temperature:** 65-75°F (18-24°C) optimal',
          '**Season:** Warm season crop, plant after last frost',
          '**Days to harvest:** 70-85 days from transplant'
        ],
        growing: [
          '**Soil:** Well-draining, pH 6.0-6.8, rich in organic matter',
          '**Water:** 1-2 inches weekly, consistent moisture',
          '**Space:** 24-36 inches between plants',
          '**Support:** Cages or stakes required for most varieties'
        ],
        varieties: [
          '**Determinate:** Bush types, all fruit ripens at once (Roma, Celebrity)',
          '**Indeterminate:** Vining types, continuous harvest (Cherokee Purple, Brandywine)',
          '**Cherry:** Small fruits, great for containers (Sweet 100, Sun Gold)'
        ],
        tips: [
          'Mulch heavily to retain moisture and prevent disease',
          'Remove lower leaves to improve air circulation',
          'Harvest when fully colored but still firm'
        ]
      },
      'lettuce': {
        title: '🥬 **Lettuce Growing Guide:**',
        intro: 'Perfect for beginners and succession planting!',
        climate: [
          '**Temperature:** 45-65°F (7-18°C) optimal',
          '**Season:** Cool season crop, spring/fall planting',
          '**Days to harvest:** 45-65 days from seed'
        ],
        growing: [
          '**Soil:** Well-draining, pH 6.0-7.0, high in nitrogen',
          '**Water:** Light, frequent watering to keep soil moist',
          '**Space:** 4-8 inches between plants depending on variety',
          '**Shade:** Benefits from afternoon shade in hot weather'
        ],
        varieties: [
          '**Leaf lettuce:** Easy to grow, harvest individual leaves (Red Sails, Black Seeded Simpson)',
          '**Head lettuce:** Forms tight heads (Iceberg, Buttercrunch)',
          '**Romaine:** Upright growth, heat tolerant (Parris Island, Rouge d\'Hiver)'
        ],
        tips: [
          'Plant every 2 weeks for continuous harvest',
          'Harvest in morning when leaves are crisp',
          'Bolt quickly in hot weather - provide shade'
        ]
      },
      'carrots': {
        title: '🥕 **Carrot Growing Guide:**',
        intro: 'Great root crop that stores well!',
        climate: [
          '**Temperature:** 55-75°F (13-24°C) optimal',
          '**Season:** Cool season crop, can tolerate light frost',
          '**Days to harvest:** 70-80 days from seed'
        ],
        growing: [
          '**Soil:** Deep, loose, sandy soil, pH 6.0-6.8',
          '**Water:** Even moisture, avoid overwatering',
          '**Space:** Thin to 2 inches apart',
          '**Depth:** Plant seeds ¼ inch deep'
        ],
        varieties: [
          '**Nantes:** Sweet, cylindrical (Scarlet Nantes)',
          '**Chantenay:** Short, broad, good for heavy soils (Red Cored Chantenay)',
          '**Imperator:** Long, tapered (Imperator 58)'
        ],
        tips: [
          'Direct seed - carrots don\'t transplant well',
          'Keep soil consistently moist until germination',
          'Thin seedlings when 2 inches tall'
        ]
      },
      'peppers': {
        title: '🌶️ **Pepper Growing Guide:**',
        intro: 'From sweet bells to fiery hot peppers!',
        climate: [
          '**Temperature:** 70-80°F (21-27°C) optimal',
          '**Season:** Warm season crop, very frost sensitive',
          '**Days to harvest:** 70-90 days from transplant'
        ],
        growing: [
          '**Soil:** Well-draining, pH 6.0-6.8, moderate fertility',
          '**Water:** Deep, infrequent watering once established',
          '**Space:** 18-24 inches between plants',
          '**Support:** May need staking for heavy producers'
        ],
        varieties: [
          '**Sweet:** Bell peppers, banana peppers, pimientos',
          '**Hot:** Jalapeño, serrano, habanero, ghost pepper',
          '**Specialty:** Shishito, poblano, Hungarian wax'
        ],
        tips: [
          'Wait for soil to warm before transplanting',
          'Harvest regularly to encourage production',
          'Hot peppers get hotter with stress (less water)'
        ]
      },
      'herbs': {
        title: '🌿 **Herb Growing Guide:**',
        intro: 'Easy to grow and incredibly useful!',
        climate: [
          '**Temperature:** Most prefer 65-75°F (18-24°C)',
          '**Season:** Varies - some cool season, some warm',
          '**Harvest:** Most can be harvested continuously'
        ],
        growing: [
          '**Soil:** Well-draining, most prefer pH 6.0-7.0',
          '**Water:** Most prefer slightly dry conditions',
          '**Space:** Varies by herb, 6-18 inches apart',
          '**Light:** Most prefer full sun to partial shade'
        ],
        varieties: [
          '**Annual:** Basil, cilantro, dill, parsley',
          '**Perennial:** Rosemary, thyme, oregano, sage',
          '**Easy starters:** Basil, mint, parsley, chives'
        ],
        tips: [
          'Pinch flowers to keep leaves tender',
          'Harvest regularly to encourage growth',
          'Many herbs prefer lean soils - don\'t over-fertilize'
        ]
      }
    }

    const guide = cropGuides[crop]
    if (!guide) {
      return {
        content: `I'd love to help you with that crop! Could you be more specific about what you'd like to grow? I have detailed guides for tomatoes, lettuce, carrots, peppers, herbs, and many other crops.`,
        metadata: { confidence: 0.70 }
      }
    }

    let content = `${guide.title}\n\n${guide.intro} Here's everything you need to know:\n\n`

    content += `**🌡️ Climate Requirements:**\n${guide.climate.map((item: string) => `- ${item}`).join('\n')}\n\n`
    content += `**🌱 Growing Conditions:**\n${guide.growing.map((item: string) => `- ${item}`).join('\n')}\n\n`
    content += `**🌿 Popular Varieties:**\n${guide.varieties.map((item: string) => `- ${item}`).join('\n')}\n\n`
    content += `**💡 Pro Tips:**\n${guide.tips.map((item: string) => `- ${item}`).join('\n')}\n\n`

    // Add location-specific advice
    if (this.userFarmData?.farms.length) {
      content += `**📍 For your location${this.userFarmData.farms.length > 1 ? 's' : ''}:**\n`
      content += this.userFarmData.farms.map(farm =>
        `- **${farm.name}** (${farm.location}): ${farm.notes ? `Your notes mention "${farm.notes}" - ` : ''}Check your local frost dates and growing zone for optimal timing!`
      ).join('\n')
      content += '\n\n'
    }

    content += `${farmPersonality.notes}\n`
    content += `**Ready to get started?** Let me know if you need specific advice about varieties, timing, or growing techniques for your situation! 🌱`

    return {
      content,
      metadata: {
        suggestedActions: ['Choose appropriate varieties', 'Plan planting schedule', 'Prepare soil'],
        confidence: 0.92
      }
    }
  }
}
