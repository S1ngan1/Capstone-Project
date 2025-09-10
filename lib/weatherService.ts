// Weather service using Open Meteo API
import { getProvinceCoordinates } from './vietnameseProvinces'
export interface WeatherData {
  current: {
    temperature: number
    weatherCode: number
    windSpeed: number
    humidity: number
    feelsLike?: number
  }
  daily: {
    date: string
    temperature: {
      max: number
      min: number
    }
    weatherCode: number
    precipitation?: number
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
  async getCurrentWeather(coordinates: LocationCoordinates): Promise<WeatherData> {
    try {
      const { latitude, longitude } = coordinates
      const response = await fetch(
        `${this.baseUrl}/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum&timezone=auto&forecast_days=7`
      )
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`)
      }
      const data = await response.json()
      return {
        current: {
          temperature: Math.round(data.current.temperature_2m || 0),
          weatherCode: data.current.weather_code || 0,
          windSpeed: Math.round(data.current.wind_speed_10m || 0),
          humidity: Math.round(data.current.relative_humidity_2m || 0),
          feelsLike: Math.round(data.current.apparent_temperature || data.current.temperature_2m || 0),
        },
        daily: data.daily.time.map((date: string, index: number) => ({
          date,
          temperature: {
            max: Math.round(data.daily.temperature_2m_max[index] || 0),
            min: Math.round(data.daily.temperature_2m_min[index] || 0),
          },
          weatherCode: data.daily.weather_code[index] || 0,
          precipitation: Math.round((data.daily.precipitation_sum[index] || 0) * 10) / 10,
        })),
        location: coordinates.name,
      }
    } catch (error) {
      console.error('Weather API error:', error)
      throw error
    }
  }
  async getWeatherByLocation(locationName: string): Promise<WeatherData> {
    try {
      const coordinates = await this.getLocationCoordinates(locationName)
      return await this.getCurrentWeather({
        ...coordinates,
        name: locationName,
      })
    } catch (error) {
      console.error(`Error getting weather for location "${locationName}":`, error)
      throw error
    }
  }
  async getLocationCoordinates(locationName: string): Promise<LocationCoordinates> {
    try {
      // First, try to get coordinates from Vietnamese provinces data
      const provinceCoords = getProvinceCoordinates(locationName)
      if (provinceCoords) {
        return {
          latitude: provinceCoords.lat,
          longitude: provinceCoords.lon,
          name: locationName,
        }
      }
      // If not found in provinces, try geocoding API
      const geocodeResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationName)}&count=1&language=en&format=json`
      )
      if (!geocodeResponse.ok) {
        throw new Error(`Geocoding API error: ${geocodeResponse.status}`)
      }
      const geocodeData = await geocodeResponse.json()
      if (!geocodeData.results || geocodeData.results.length === 0) {
        // If geocoding fails, try with English name if it's a Vietnamese province
        const englishName = this.getEnglishLocationName(locationName)
        if (englishName && englishName !== locationName) {
          const englishResponse = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(englishName)}&count=1&language=en&format=json`
          )
          if (englishResponse.ok) {
            const englishData = await englishResponse.json()
            if (englishData.results && englishData.results.length > 0) {
              const result = englishData.results[0]
              return {
                latitude: result.latitude,
                longitude: result.longitude,
                name: locationName,
              }
            }
          }
        }
        throw new Error(`Location not found: ${locationName}`)
      }
      const result = geocodeData.results[0]
      return {
        latitude: result.latitude,
        longitude: result.longitude,
        name: locationName,
      }
    } catch (error) {
      console.error('Error fetching location coordinates:', error)
      throw error
    }
  }
  private getEnglishLocationName(vietnameseName: string): string | null {
    // Map common Vietnamese location names to English
    const nameMap: { [key: string]: string } = {
      'Thành phố Hồ Chí Minh': 'Ho Chi Minh City',
      'Hà Nội': 'Hanoi',
      'Đà Nẵng': 'Da Nang',
      'Hải Phòng': 'Hai Phong',
      'Cần Thơ': 'Can Tho',
      'Biên Hòa': 'Bien Hoa',
      'Huế': 'Hue',
      'Nha Trang': 'Nha Trang',
      'Buôn Ma Thuột': 'Buon Ma Thuot',
      'Quy Nhon': 'Quy Nhon',
      'Vũng Tàu': 'Vung Tau',
      'Nam Định': 'Nam Dinh',
      'Phan Thiết': 'Phan Thiet',
      'Long Xuyên': 'Long Xuyen',
      'Hạ Long': 'Ha Long',
      'Thái Nguyên': 'Thai Nguyen',
      'Thanh Hóa': 'Thanh Hoa',
      'Rạch Giá': 'Rach Gia',
      'Cà Mau': 'Ca Mau',
      'Vinh': 'Vinh',
    }
    return nameMap[vietnameseName] || null
  }
  getWeatherDescription(weatherCode: number): string {
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
      71: 'Slight snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail',
    }
    return weatherCodes[weatherCode] || 'Unknown'
  }
  getWeatherIcon(weatherCode: number, isDay: boolean = true): string {
    // Map weather codes to valid Ionicons
    const iconMap: { [key: number]: { day: string; night: string } } = {
      0: { day: 'sunny-outline', night: 'moon-outline' },
      1: { day: 'sunny-outline', night: 'moon-outline' },
      2: { day: 'partly-sunny-outline', night: 'cloudy-night-outline' },
      3: { day: 'cloudy-outline', night: 'cloudy-outline' },
      45: { day: 'eye-off-outline', night: 'eye-off-outline' },
      48: { day: 'eye-off-outline', night: 'eye-off-outline' },
      51: { day: 'rainy-outline', night: 'rainy-outline' },
      53: { day: 'rainy-outline', night: 'rainy-outline' },
      55: { day: 'rainy-outline', night: 'rainy-outline' },
      56: { day: 'rainy-outline', night: 'rainy-outline' },
      57: { day: 'rainy-outline', night: 'rainy-outline' },
      61: { day: 'rainy-outline', night: 'rainy-outline' },
      63: { day: 'rainy-outline', night: 'rainy-outline' },
      65: { day: 'rainy-outline', night: 'rainy-outline' },
      66: { day: 'rainy-outline', night: 'rainy-outline' },
      67: { day: 'rainy-outline', night: 'rainy-outline' },
      71: { day: 'snow-outline', night: 'snow-outline' },
      73: { day: 'snow-outline', night: 'snow-outline' },
      75: { day: 'snow-outline', night: 'snow-outline' },
      77: { day: 'snow-outline', night: 'snow-outline' },
      80: { day: 'rainy-outline', night: 'rainy-outline' },
      81: { day: 'rainy-outline', night: 'rainy-outline' },
      82: { day: 'rainy-outline', night: 'rainy-outline' },
      85: { day: 'snow-outline', night: 'snow-outline' },
      86: { day: 'snow-outline', night: 'snow-outline' },
      95: { day: 'thunderstorm-outline', night: 'thunderstorm-outline' },
      96: { day: 'thunderstorm-outline', night: 'thunderstorm-outline' },
      99: { day: 'thunderstorm-outline', night: 'thunderstorm-outline' },
    }
    const icons = iconMap[weatherCode] || { day: 'sunny-outline', night: 'moon-outline' }
    return isDay ? icons.day : icons.night
  }
  // Add the missing getWeatherForFarm function
  async getWeatherForFarm(farmLocation: string): Promise<WeatherData | null> {
    try {
      if (!farmLocation) {
        console.warn('No farm location provided')
        return null
      }
      return await this.getWeatherByLocation(farmLocation)
    } catch (error) {
      console.error(`Error getting weather for farm location "${farmLocation}":`, error)
      return null
    }
  }
}
export const weatherService = new WeatherService()
export default weatherService
