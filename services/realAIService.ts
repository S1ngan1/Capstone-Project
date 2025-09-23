import { ChatMessage, UserFarmData } from './aiChatService'

// AI Provider Types
type AIProvider = 'openai' | 'claude' | 'copilot'

interface AIConfig {
  provider: AIProvider
  apiKey: string
  model?: string
  baseURL?: string
}

interface AIResponse {
  content: string
  metadata?: {
    suggestedActions?: string[]
    relatedSensors?: string[]
    confidence?: number
  }
}

export class RealAIService {
  private config: AIConfig
  private systemPrompt: string
  private isQuotaExceeded = false
  private lastQuotaCheck = 0
  private readonly QUOTA_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

  constructor(config: AIConfig) {
    this.config = config
    this.systemPrompt = this.createSystemPrompt()
  }

  private createSystemPrompt(): string {
    return `You are Dr. AgriBot, a world-renowned agricultural specialist and environmental expert with over 30 years of experience in farming, soil science, crop management, and sustainable agriculture.

YOUR EXPERTISE INCLUDES:
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
- Use emojis and visual formatting for better readability

🔧 CAPABILITIES:
- Analyze real-time sensor data from farms
- Provide weather-based recommendations
- Suggest optimal planting and harvesting times
- Troubleshoot farming problems
- Recommend equipment and tools
- Create customized farming schedules
- Help with crop selection based on conditions

IMPORTANT: Always reference the user's specific farm data when available. Provide specific, actionable advice rather than generic information.`
  }

  async generateResponse(
    userMessage: string,
    farmData: UserFarmData | null,
    conversationHistory: ChatMessage[]
  ): Promise<AIResponse> {
    try {
      const messages = this.buildMessageHistory(userMessage, farmData, conversationHistory)

      switch (this.config.provider) {
        case 'openai':
          return await this.callOpenAI(messages)
        case 'claude':
          return await this.callClaude(messages)
        case 'copilot':
          return await this.callCopilot(messages)
        default:
          throw new Error(`Unsupported AI provider: ${this.config.provider}`)
      }
    } catch (error) {
      console.error('Real AI Service Error:', error)
      return this.getFallbackResponse(userMessage, error as Error)
    }
  }

  private buildMessageHistory(
    userMessage: string,
    farmData: UserFarmData | null,
    conversationHistory: ChatMessage[]
  ): any[] {
    const messages: any[] = [
      {
        role: 'system',
        content: this.systemPrompt + this.buildFarmDataContext(farmData)
      }
    ]

    // Add recent conversation history (last 10 messages)
    const recentHistory = conversationHistory.slice(-10)
    recentHistory.forEach(msg => {
      if (msg.role !== 'system') {
        messages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        })
      }
    })

    // Add current user message
    messages.push({
      role: 'user',
      content: userMessage
    })

    return messages
  }

  private buildFarmDataContext(farmData: UserFarmData | null): string {
    if (!farmData || farmData.farms.length === 0) {
      return "\n\nCURRENT USER CONTEXT: The user has no farms registered yet. Encourage them to set up their farm profile for personalized advice."
    }

    let context = "\n\nCURRENT USER'S FARM DATA:\n"

    farmData.farms.forEach((farm, index) => {
      context += `\nFarm ${index + 1}: ${farm.name}\n`
      context += `- Location: ${farm.location}\n`
      if (farm.notes) {
        context += `- User Notes: "${farm.notes}"\n`
      }

      if (farm.sensors.length > 0) {
        context += `- Active Sensors (${farm.sensors.length}):\n`
        farm.sensors.forEach(sensor => {
          if (sensor.latestReading) {
            const timeAgo = this.getTimeAgo(sensor.latestReading.timestamp)
            context += `  • ${sensor.name} (${sensor.type}): ${sensor.latestReading.value}${sensor.latestReading.unit} (${timeAgo})\n`
          } else {
            context += `  • ${sensor.name} (${sensor.type}): No recent data\n`
          }
        })
      } else {
        context += `- No sensors installed yet\n`
      }
    })

    context += "\nIMPORTANT: Reference this specific farm data in your response when relevant. Provide personalized advice based on their actual conditions and notes."

    return context
  }

  private getTimeAgo(timestamp: string): string {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return 'Recently'
  }

  // OpenAI Integration with quota handling
  private async callOpenAI(messages: any[]): Promise<AIResponse> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model || 'gpt-4o-mini',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text();

      // Handle quota exceeded error specifically
      if (response.status === 429) {
        this.isQuotaExceeded = true;
        this.lastQuotaCheck = Date.now();
        throw new Error(`429 OpenAI quota exceeded: ${errorText}`)
      }

      throw new Error(`OpenAI API Error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content ||
      "I apologize, but I couldn't generate a proper response. Please try asking your question again."

    return {
      content,
      metadata: {
        confidence: 0.9
      }
    }
  }

  // Claude Integration (placeholder)
  private async callClaude(messages: any[]): Promise<AIResponse> {
    throw new Error('Claude integration not yet implemented')
  }

  // Copilot Integration (placeholder)
  private async callCopilot(messages: any[]): Promise<AIResponse> {
    throw new Error('GitHub Copilot integration not yet implemented')
  }

  private getFallbackResponse(userMessage: string, error: Error): AIResponse {
    const isQuotaError = error.message.includes('429') || error.message.includes('quota');

    if (isQuotaError) {
      return {
        content: `🤖 I'm currently experiencing high demand and my OpenAI quota has been reached. However, I can still help with your farming question!\n\n${this.getOfflineAdvice(userMessage)}\n\n💡 **Tip**: My full AI capabilities will be restored soon. In the meantime, I'm providing guidance based on my agricultural knowledge base.`,
        metadata: {
          suggestedActions: this.getOfflineSuggestions(userMessage),
          confidence: 0.7
        }
      }
    }

    return {
      content: `🌱 I encountered a technical issue, but I'm still here to help with your farming needs!\n\n${this.getOfflineAdvice(userMessage)}\n\n🔧 If this issue persists, please try again in a few moments.`,
      metadata: {
        suggestedActions: this.getOfflineSuggestions(userMessage),
        confidence: 0.6
      }
    }
  }

  private getOfflineAdvice(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('soil') || lowerMessage.includes('ph')) {
      return `🌱 **Soil Health Guidelines:**\n• Test soil pH regularly (ideal: 6.0-7.0)\n• Add organic compost to improve structure\n• Avoid working wet soil to prevent compaction\n• Consider crop rotation for nutrient balance`;
    }

    if (lowerMessage.includes('water') || lowerMessage.includes('irrigation')) {
      return `💧 **Water Management Best Practices:**\n• Water deeply but less frequently\n• Check soil moisture 2-3 inches deep\n• Water in early morning to reduce evaporation\n• Use mulch to retain soil moisture`;
    }

    if (lowerMessage.includes('pest') || lowerMessage.includes('disease')) {
      return `🐛 **Pest & Disease Management:**\n• Inspect plants daily for early detection\n• Remove affected plant parts immediately\n• Encourage beneficial insects with companion plants\n• Use organic treatments when possible`;
    }

    return `🌾 **General Farming Advice:**\n• Monitor crops regularly for changes\n• Keep detailed farming records\n• Plan activities based on weather patterns\n• Maintain healthy soil as your foundation`;
  }

  private getOfflineSuggestions(message: string): string[] {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('soil')) {
      return ['Test soil pH', 'Add compost', 'Check drainage'];
    }

    if (lowerMessage.includes('water')) {
      return ['Check soil moisture', 'Adjust irrigation', 'Apply mulch'];
    }

    if (lowerMessage.includes('pest')) {
      return ['Daily plant inspection', 'Remove affected areas', 'Natural pest control'];
    }

    return ['Regular monitoring', 'Weather planning', 'Record keeping'];
  }

  // Reset quota status
  resetQuotaStatus(): void {
    if (this.isQuotaExceeded && Date.now() - this.lastQuotaCheck > this.QUOTA_CHECK_INTERVAL) {
      this.isQuotaExceeded = false;
      console.log('OpenAI quota status reset');
    }
  }

  getServiceStatus(): { isOnline: boolean, isQuotaExceeded: boolean, hasApiKey: boolean } {
    return {
      isOnline: !!this.config.apiKey && !this.isQuotaExceeded,
      isQuotaExceeded: this.isQuotaExceeded,
      hasApiKey: !!this.config.apiKey
    };
  }
}

// Factory function to create AI service instances
export const createAIService = (provider: AIProvider = 'openai'): RealAIService => {
  const apiKey = provider === 'openai'
    ? process.env.OPENAI_API_KEY || process.env.EXPO_PUBLIC_OPENAI_API_KEY
    : '';

  const configs = {
    openai: { provider: 'openai' as const, apiKey, model: 'gpt-4o-mini' },
    claude: { provider: 'claude' as const, apiKey: '', model: 'claude-3-haiku' },
    copilot: { provider: 'copilot' as const, apiKey: '', model: 'gpt-4' },
  }

  return new RealAIService(configs[provider]);
}

export default RealAIService;

