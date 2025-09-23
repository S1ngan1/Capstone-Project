// Test file to verify AI service functionality
import claudeAIService from './claudeAIService';

const testAIService = async () => {
  console.log('🧪 Testing AI Service...');

  const mockFarmContext = {
    farmId: 'test-farm-123',
    farmName: 'Test Farm',
    farmLocation: 'Ho Chi Minh City, Vietnam',
    farmNotes: 'Small organic farm growing vegetables',
    sensorData: [
      {
        id: 'sensor-1',
        name: 'Soil Moisture Sensor',
        type: 'moisture',
        value: 25,
        unit: '%',
        status: 'active',
        timestamp: new Date().toISOString()
      },
      {
        id: 'sensor-2',
        name: 'Temperature Sensor',
        type: 'temperature',
        value: 38,
        unit: '°C',
        status: 'active',
        timestamp: new Date().toISOString()
      }
    ]
  };

  try {
    // Test analysis function
    console.log('Testing analyzeCurrentConditions...');
    const analysis = await claudeAIService.analyzeCurrentConditions(mockFarmContext);
    console.log('✅ Analysis result:', analysis);

    // Test quick suggestions
    console.log('Testing getQuickSuggestions...');
    const suggestions = await claudeAIService.getQuickSuggestions(mockFarmContext);
    console.log('✅ Suggestions:', suggestions);

    // Test generate response (this will likely fail without API key)
    console.log('Testing generateResponse...');
    const response = await claudeAIService.generateResponse('What should I do about low soil moisture?', mockFarmContext);
    console.log('✅ Response:', response);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Export for use in development
export default testAIService;
