import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { supabase } from '../lib/supabase'
const DatabaseDebugger = ({ farmId }: { farmId: string }) => {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    debugDatabase()
  }, [farmId])
  const debugDatabase = async () => {
    setLoading(true)
    const info: any = { farmId }
    try {
      console.log('=== DEBUGGING DATABASE FOR FARM:', farmId)
      // 1. Check if the farm exists
      const { data: farmData, error: farmError } = await supabase
        .from('farms')
        .select('*')
        .eq('id', farmId)
      info.farm = {
        exists: !farmError && farmData && farmData.length > 0,
        data: farmData,
        error: farmError?.message
      }
      console.log('Farm data:', info.farm)
      // 2. Check all sensors in the database
      const { data: allSensors, error: allSensorsError } = await supabase
        .from('sensor')
        .select('*')
      info.allSensors = {
        count: allSensors?.length || 0,
        data: allSensors,
        error: allSensorsError?.message
      }
      console.log('All sensors in database:', info.allSensors)
      // 3. Check sensors for this specific farm
      const { data: farmSensors, error: farmSensorsError } = await supabase
        .from('sensor')
        .select('*')
        .eq('farm_id', farmId)
      info.farmSensors = {
        count: farmSensors?.length || 0,
        data: farmSensors,
        error: farmSensorsError?.message
      }
      console.log('Sensors for this farm:', info.farmSensors)
      // 4. Check all sensor_data in the database
      const { data: allSensorData, error: allSensorDataError } = await supabase
        .from('sensor_data')
        .select('*')
        .limit(10)
      info.allSensorData = {
        count: allSensorData?.length || 0,
        data: allSensorData,
        error: allSensorDataError?.message
      }
      console.log('All sensor data in database:', info.allSensorData)
      // 5. If we have farm sensors, check their data
      if (farmSensors && farmSensors.length > 0) {
        const sensorIds = farmSensors.map(s => s.sensor_id)
        const { data: farmSensorData, error: farmSensorDataError } = await supabase
          .from('sensor_data')
          .select('*')
          .in('sensor_id', sensorIds)
          .limit(10)
        info.farmSensorData = {
          count: farmSensorData?.length || 0,
          data: farmSensorData,
          error: farmSensorDataError?.message
        }
        console.log('Sensor data for this farm:', info.farmSensorData)
      }
      // 6. Check if there are any farms at all
      const { data: allFarms, error: allFarmsError } = await supabase
        .from('farms')
        .select('*')
      info.allFarms = {
        count: allFarms?.length || 0,
        data: allFarms,
        error: allFarmsError?.message
      }
      console.log('All farms in database:', info.allFarms)
    } catch (error) {
      console.error('Debug error:', error)
      info.debugError = error.toString()
    }
    setDebugInfo(info)
    setLoading(false)
    console.log('=== COMPLETE DEBUG INFO ===')
    console.log(JSON.stringify(info, null, 2))
  }
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Debugging Database...</Text>
      </View>
    )
  }
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Database Debug Info</Text>
      <Text style={styles.farmId}>Farm ID: {farmId}</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Farm Exists:</Text>
        <Text style={styles.text}>{debugInfo.farm?.exists ? '✅ Yes' : '❌ No'}</Text>
        {debugInfo.farm?.error && (
          <Text style={styles.error}>Error: {debugInfo.farm.error}</Text>
        )}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Sensors Count:</Text>
        <Text style={styles.text}>{debugInfo.allSensors?.count || 0}</Text>
        {debugInfo.allSensors?.error && (
          <Text style={styles.error}>Error: {debugInfo.allSensors.error}</Text>
        )}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sensors for This Farm:</Text>
        <Text style={styles.text}>{debugInfo.farmSensors?.count || 0}</Text>
        {debugInfo.farmSensors?.error && (
          <Text style={styles.error}>Error: {debugInfo.farmSensors.error}</Text>
        )}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Sensor Data Count:</Text>
        <Text style={styles.text}>{debugInfo.allSensorData?.count || 0}</Text>
        {debugInfo.allSensorData?.error && (
          <Text style={styles.error}>Error: {debugInfo.allSensorData.error}</Text>
        )}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Farms Count:</Text>
        <Text style={styles.text}>{debugInfo.allFarms?.count || 0}</Text>
        {debugInfo.allFarms?.error && (
          <Text style={styles.error}>Error: {debugInfo.allFarms.error}</Text>
        )}
      </View>
      {debugInfo.debugError && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Debug Error:</Text>
          <Text style={styles.error}>{debugInfo.debugError}</Text>
        </View>
      )}
    </ScrollView>
  )
}
const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: 'white',
    margin: 10,
    borderRadius: 8,
    maxHeight: 300,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  farmId: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
    fontFamily: 'monospace',
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  text: {
    fontSize: 14,
    color: '#666',
  },
  error: {
    fontSize: 12,
    color: '#ff0000',
  },
})
export default DatabaseDebugger
