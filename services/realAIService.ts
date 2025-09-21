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

  // OpenAI Integration
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
      throw new Error(`OpenAI API Error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || "I apologize, but I couldn't generate a proper response. Please try asking your question again."

    return {
      content,
      metadata: {
        confidence: 0.95,
        suggestedActions: this.extractSuggestedActions(content)
      }
    }
  }

  // Claude (Anthropic) Integration
  private async callClaude(messages: any[]): Promise<AIResponse> {
    // Convert messages format for Claude
    const systemMessage = messages.find(m => m.role === 'system')?.content || ''
    const conversationMessages = messages.filter(m => m.role !== 'system')

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model || 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        system: systemMessage,
        messages: conversationMessages,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`Claude API Error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.content[0]?.text || "I apologize, but I couldn't generate a proper response. Please try asking your question again."

    return {
      content,
      metadata: {
        confidence: 0.95,
        suggestedActions: this.extractSuggestedActions(content)
      }
    }
  }

  // GitHub Copilot Chat Integration (if available)
  private async callCopilot(messages: any[]): Promise<AIResponse> {
    // Note: This would require GitHub Copilot API access
    // For now, fallback to OpenAI format with different endpoint
    const response = await fetch(this.config.baseURL || 'https://api.github.com/copilot/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        messages: messages,
        model: this.config.model || 'gpt-4',
        max_tokens: 1000,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`Copilot API Error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || "I apologize, but I couldn't generate a proper response. Please try asking your question again."

    return {
      content,
      metadata: {
        confidence: 0.95,
        suggestedActions: this.extractSuggestedActions(content)
      }
    }
  }

  private extractSuggestedActions(content: string): string[] {
    const actions: string[] = []

    // Look for common action patterns in the response
    const actionPatterns = [
      /(?:try|consider|should|recommend|suggest)[\w\s]+(ing|ed|ion)\b/gi,
      /(?:steps?|actions?|recommendations?):\s*([^.]+)/gi,
      /(?:•|-|\*)\s*([^.•\-*\n]+)/g
    ]

    actionPatterns.forEach(pattern => {
      const matches = content.match(pattern)
      if (matches) {
        matches.slice(0, 3).forEach(match => { // Limit to 3 actions
          const cleaned = match.replace(/^(?:•|-|\*)\s*/, '').trim()
          if (cleaned.length > 10 && cleaned.length < 60) {
            actions.push(cleaned)
          }
        })
      }
    })

    return actions.slice(0, 3) // Return top 3 actions
  }

  private getFallbackResponse(userMessage: string, error: Error): AIResponse {
    return {
      content: `🤖 I'm experiencing some technical difficulties connecting to my AI systems right now.

**Your question:** "${userMessage}"

**Here's what I can suggest while I'm getting back online:**
- If it's about plant problems: Check for proper watering, lighting, and soil drainage
- For planting questions: Consider your local climate zone and current season
- For soil issues: Most plants prefer well-draining soil with pH 6.0-7.0
- For general farming: Focus on soil health as the foundation of good farming

**Technical details:** ${error.message}

Please try asking your question again in a moment, or feel free to ask about any specific farming topic! 🌱`,
      metadata: {
        confidence: 0.5,
        suggestedActions: ['Try asking again', 'Ask about specific crops', 'Check farming basics']
      }
    }
  }
}

// Configuration helper
export const createAIConfig = (
  provider: AIProvider,
  apiKey: string,
  model?: string,
  baseURL?: string
): AIConfig => ({
  provider,
  apiKey,
  model,
  baseURL
})

// Factory function for easy setup
export const createRealAI = (provider: AIProvider, apiKey: string): RealAIService => {
  const configs = {
    openai: { provider: 'openai' as const, apiKey, model: 'gpt-4o-mini' },
    claude: { provider: 'claude' as const, apiKey, model: 'claude-3-sonnet-20240229' },
    copilot: { provider: 'copilot' as const, apiKey, model: 'gpt-4' }
  }

  return new RealAIService(configs[provider])
}
