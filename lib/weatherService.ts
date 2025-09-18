// Weather service using Open Meteo API (free, no API key required)
import { getProvinceCoordinates } from './vietnameseProvinces'

export interface WeatherData {
  current: {
    temperature: number
    weatherCode: number
    windSpeed: number
    humidity: number
    feelsLike?: number
    condition?: string
  }
  daily: {
    date: string
    temperature: {
      max: number
      min: number
    }
    weatherCode: number
    precipitation?: number
    condition?: string
  }[]
  location?: string
}

export interface LocationCoordinates {
  latitude: number
  longitude: number
  name?: string
}

class WeatherService {
  private readonly baseUrl = 'https://api.open-meteo.com/v1'
  private readonly timeout = 15000 // 15 seconds timeout
  private readonly cache = new Map<string, { data: WeatherData; timestamp: number }>()
  private readonly cacheExpiry = 10 * 60 * 1000 // 10 minutes cache

  // Weather code to condition mapping for Open Meteo
  private getWeatherCondition(weatherCode: number): string {
    const weatherCodes: { [key: number]: string } = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      56: 'Light freezing drizzle',
      57: 'Dense freezing drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      66: 'Light freezing rain',
      67: 'Heavy freezing rain',
      71: 'Slight snow fall',
      73: 'Moderate snow fall',
      75: 'Heavy snow fall',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail'
    }
    return weatherCodes[weatherCode] || 'Unknown'
  }

  async getCurrentWeather(coordinates: LocationCoordinates): Promise<WeatherData> {
    try {
      const { latitude, longitude, name } = coordinates

      // Check cache first
      const cacheKey = `${latitude},${longitude}`
      const cached = this.cache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        console.log(`Using cached weather data for ${name || 'location'}`)
        return { ...cached.data, location: name || cached.data.location }
      }

      // Create AbortController for timeout handling
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const url = `${this.baseUrl}/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum&timezone=auto&forecast_days=7`

      console.log(`Fetching weather data for ${name || 'location'} at ${latitude}, ${longitude}`)

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SmartFarmAssistant/1.0',
          'Cache-Control': 'no-cache'
        }
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Weather API HTTP error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!data || !data.current || !data.daily) {
        throw new Error('Invalid weather data received from API')
      }

      const weatherData: WeatherData = {
        current: {
          temperature: Math.round(data.current.temperature_2m || 0),
          weatherCode: data.current.weather_code || 0,
          windSpeed: Math.round(data.current.wind_speed_10m || 0),
          humidity: Math.round(data.current.relative_humidity_2m || 0),
          feelsLike: Math.round(data.current.apparent_temperature || data.current.temperature_2m || 0),
          condition: this.getWeatherCondition(data.current.weather_code || 0)
        },
        daily: (data.daily.time || []).slice(0, 7).map((date: string, index: number) => ({
          date,
          temperature: {
            max: Math.round(data.daily.temperature_2m_max?.[index] || 0),
            min: Math.round(data.daily.temperature_2m_min?.[index] || 0),
          },
          weatherCode: data.daily.weather_code?.[index] || 0,
          precipitation: Math.round((data.daily.precipitation_sum?.[index] || 0) * 10) / 10,
          condition: this.getWeatherCondition(data.daily.weather_code?.[index] || 0)
        })),
        location: name || `${latitude}, ${longitude}`
      }

      // Cache the result
      this.cache.set(cacheKey, { data: weatherData, timestamp: Date.now() })

      console.log(`Successfully fetched weather for ${weatherData.location}`)
      return weatherData

    } catch (error: any) {
      console.error('Weather API error:', error)

      // Provide more specific error messages
      if (error.name === 'AbortError') {
        throw new Error(`Weather request timeout after ${this.timeout / 1000} seconds`)
      } else if (error.message?.includes('Network request failed')) {
        throw new Error('Network connection failed. Please check your internet connection.')
      } else if (error.message?.includes('JSON')) {
        throw new Error('Invalid response from weather service')
      }

      throw error
    }
  }

  async getWeatherByLocation(locationName: string): Promise<WeatherData> {
    try {
      console.log(`Getting weather for location: "${locationName}"`)

      // First try to get coordinates from Vietnamese provinces
      let coordinates = null
      const vietnameseCoords = getProvinceCoordinates(locationName)

      if (vietnameseCoords) {
        // Convert Vietnamese coordinate format to expected format
        coordinates = {
          latitude: vietnameseCoords.lat,
          longitude: vietnameseCoords.lon,
          name: locationName
        }
        console.log(`Found Vietnamese province coordinates for "${locationName}": ${vietnameseCoords.lat}, ${vietnameseCoords.lon}`)
      } else {
        // If not found in Vietnamese provinces, try geocoding as backup
        coordinates = await this.geocodeLocation(locationName)
      }

      if (!coordinates) {
        throw new Error(`Location "${locationName}" not found`)
      }

      return await this.getCurrentWeather(coordinates)
    } catch (error: any) {
      console.error(`Error getting weather for location "${locationName}":`, error)
      throw error
    }
  }

  private async geocodeLocation(locationName: string): Promise<LocationCoordinates | null> {
    try {
      // Use Open Meteo's geocoding API as backup
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationName)}&count=1&language=en&format=json`,
        {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'SmartFarmAssistant/1.0'
          }
        }
      )

      clearTimeout(timeoutId)

      if (!response.ok) {
        console.warn(`Geocoding API error: ${response.status}`)
        return null
      }

      const data = await response.json()

      if (!data.results || data.results.length === 0) {
        console.warn(`No geocoding results for "${locationName}"`)
        return null
      }

      const result = data.results[0]
      return {
        latitude: result.latitude,
        longitude: result.longitude,
        name: result.name || locationName
      }
    } catch (error) {
      console.warn(`Geocoding failed for "${locationName}":`, error)
      return null
    }
  }

  // Method to get default/demo weather data when API fails
  getDemoWeatherData(locationName?: string): WeatherData {
    return {
      current: {
        temperature: 28,
        weatherCode: 2,
        windSpeed: 12,
        humidity: 65,
        feelsLike: 31,
        condition: 'Partly cloudy'
      },
      daily: [
        {
          date: new Date().toISOString().split('T')[0],
          temperature: { max: 32, min: 24 },
          weatherCode: 2,
          precipitation: 0,
          condition: 'Partly cloudy'
        },
        {
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          temperature: { max: 30, min: 23 },
          weatherCode: 61,
          precipitation: 2.5,
          condition: 'Slight rain'
        },
        {
          date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
          temperature: { max: 29, min: 22 },
          weatherCode: 3,
          precipitation: 0,
          condition: 'Overcast'
        }
      ],
      location: locationName || 'Demo Location'
    }
  }

  // Method to get weather icon based on weather code and time of day
  getWeatherIcon(weatherCode: number, isDay: boolean = true): string {
    const dayIcons: { [key: number]: string } = {
      0: 'sunny',           // Clear sky
      1: 'partly-sunny',    // Mainly clear
      2: 'partly-sunny',    // Partly cloudy
      3: 'cloudy',          // Overcast
      45: 'cloudy',         // Fog
      48: 'cloudy',         // Depositing rime fog
      51: 'rainy',          // Light drizzle
      53: 'rainy',          // Moderate drizzle
      55: 'rainy',          // Dense drizzle
      56: 'rainy',          // Light freezing drizzle
      57: 'rainy',          // Dense freezing drizzle
      61: 'rainy',          // Slight rain
      63: 'rainy',          // Moderate rain
      65: 'rainy',          // Heavy rain
      66: 'rainy',          // Light freezing rain
      67: 'rainy',          // Heavy freezing rain
      71: 'snow',           // Slight snow fall
      73: 'snow',           // Moderate snow fall
      75: 'snow',           // Heavy snow fall
      77: 'snow',           // Snow grains
      80: 'rainy',          // Slight rain showers
      81: 'rainy',          // Moderate rain showers
      82: 'rainy',          // Violent rain showers
      85: 'snow',           // Slight snow showers
      86: 'snow',           // Heavy snow showers
      95: 'thunderstorm',   // Thunderstorm
      96: 'thunderstorm',   // Thunderstorm with slight hail
      99: 'thunderstorm'    // Thunderstorm with heavy hail
    }

    const nightIcons: { [key: number]: string } = {
      0: 'moon',            // Clear sky
      1: 'cloudy-night',    // Mainly clear
      2: 'cloudy-night',    // Partly cloudy
      3: 'cloudy',          // Overcast
      // Night uses same icons as day for precipitation
      ...Object.fromEntries(
        Object.entries(dayIcons)
          .filter(([code]) => parseInt(code) >= 45)
          .map(([code, icon]) => [code, icon])
      )
    }

    const icons = isDay ? dayIcons : nightIcons
    return icons[weatherCode] || (isDay ? 'partly-sunny' : 'cloudy-night')
  }

  // Method to get weather description (same as getWeatherCondition but public)
  getWeatherDescription(weatherCode: number): string {
    return this.getWeatherCondition(weatherCode)
  }
}

// Export singleton instance
export const weatherService = new WeatherService()
export default weatherService
