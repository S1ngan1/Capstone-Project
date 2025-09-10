import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { supabase } from '../lib/supabase';

const DatabaseInspector = ({ farmId }: { farmId: string }) => {
  const [inspectionResults, setInspectionResults] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    inspectDatabase();
  }, [farmId]);

  const inspectDatabase = async () => {
    setLoading(true);
    const results: any = { farmId };

    try {
      console.log('🔍 DEEP INSPECTION FOR FARM:', farmId);

      // 1. Test different query approaches for sensors
      console.log('Testing sensor queries...');

      // Try with explicit column selection
      const { data: sensorsExplicit, error: sensorsExplicitError } = await supabase
        .from('sensor')
        .select('sensor_id, sensor_name, sensor_type, farm_id')
        .eq('farm_id', farmId);

      results.sensorsExplicit = {
        count: sensorsExplicit?.length || 0,
        data: sensorsExplicit,
        error: sensorsExplicitError?.message
      };

      // Try without farm_id filter to see all sensors
      const { data: allSensorsRaw, error: allSensorsRawError } = await supabase
        .from('sensor')
        .select('sensor_id, sensor_name, sensor_type, farm_id');

      results.allSensorsRaw = {
        count: allSensorsRaw?.length || 0,
        data: allSensorsRaw,
        error: allSensorsRawError?.message
      };

      // Try with string comparison
      const { data: sensorsString, error: sensorsStringError } = await supabase
        .from('sensor')
        .select('*')
        .eq('farm_id', farmId.toString());

      results.sensorsString = {
        count: sensorsString?.length || 0,
        data: sensorsString,
        error: sensorsStringError?.message
      };

      // 2. Check current user and session
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      results.currentUser = {
        id: user?.id,
        email: user?.email,
        error: userError?.message
      };

      // 3. Test farm_id exact matching
      console.log('Testing farm_id matching...');
      if (allSensorsRaw && allSensorsRaw.length > 0) {
        const farmIdMatches = allSensorsRaw.filter(sensor => {
          console.log(`Comparing: "${sensor.farm_id}" === "${farmId}"`);
          console.log(`Types: ${typeof sensor.farm_id} vs ${typeof farmId}`);
          return sensor.farm_id === farmId;
        });

        results.farmIdMatches = {
          count: farmIdMatches.length,
          data: farmIdMatches,
          comparisons: allSensorsRaw.map(sensor => ({
            sensor_id: sensor.sensor_id,
            stored_farm_id: sensor.farm_id,
            target_farm_id: farmId,
            types_match: typeof sensor.farm_id === typeof farmId,
            values_equal: sensor.farm_id === farmId,
            string_equal: sensor.farm_id?.toString() === farmId?.toString()
          }))
        };
      }

      // 4. Test sensor_data table
      const { data: sensorDataSample, error: sensorDataError } = await supabase
        .from('sensor_data')
        .select('*')
        .limit(5);

      results.sensorDataSample = {
        count: sensorDataSample?.length || 0,
        data: sensorDataSample,
        error: sensorDataError?.message
      };

    } catch (error) {
      console.error('🚨 Inspection error:', error);
      results.inspectionError = error.toString();
    }

    setInspectionResults(results);
    setLoading(false);

    console.log('🔍 === COMPLETE INSPECTION RESULTS ===');
    console.log(JSON.stringify(results, null, 2));
  };

  const retestQueries = () => {
    inspectDatabase();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🔍 Deep Database Inspection...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔍 Database Deep Inspection</Text>
      <Text style={styles.farmId}>Target Farm ID: {farmId}</Text>

      <TouchableOpacity style={styles.refreshButton} onPress={retestQueries}>
        <Text style={styles.refreshText}>🔄 Re-run Tests</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Explicit Column Query:</Text>
        <Text style={styles.text}>Count: {inspectionResults.sensorsExplicit?.count || 0}</Text>
        {inspectionResults.sensorsExplicit?.error && (
          <Text style={styles.error}>Error: {inspectionResults.sensorsExplicit.error}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 All Sensors (No Filter):</Text>
        <Text style={styles.text}>Count: {inspectionResults.allSensorsRaw?.count || 0}</Text>
        {inspectionResults.allSensorsRaw?.data && inspectionResults.allSensorsRaw.data.length > 0 && (
          <Text style={styles.code}>
            First sensor: {JSON.stringify(inspectionResults.allSensorsRaw.data[0], null, 2)}
          </Text>
        )}
        {inspectionResults.allSensorsRaw?.error && (
          <Text style={styles.error}>Error: {inspectionResults.allSensorsRaw.error}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔗 Farm ID Matching Analysis:</Text>
        <Text style={styles.text}>Matches Found: {inspectionResults.farmIdMatches?.count || 0}</Text>
        {inspectionResults.farmIdMatches?.comparisons && (
          <ScrollView horizontal style={styles.comparisonsContainer}>
            <Text style={styles.code}>
              {JSON.stringify(inspectionResults.farmIdMatches.comparisons, null, 2)}
            </Text>
          </ScrollView>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📈 Sensor Data Sample:</Text>
        <Text style={styles.text}>Count: {inspectionResults.sensorDataSample?.count || 0}</Text>
        {inspectionResults.sensorDataSample?.data && inspectionResults.sensorDataSample.data.length > 0 && (
          <Text style={styles.code}>
            Sample: {JSON.stringify(inspectionResults.sensorDataSample.data[0], null, 2)}
          </Text>
        )}
        {inspectionResults.sensorDataSample?.error && (
          <Text style={styles.error}>Error: {inspectionResults.sensorDataSample.error}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👤 Current User:</Text>
        <Text style={styles.text}>
          ID: {inspectionResults.currentUser?.id || 'None'}
        </Text>
        <Text style={styles.text}>
          Email: {inspectionResults.currentUser?.email || 'None'}
        </Text>
      </View>

      {inspectionResults.inspectionError && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚨 Inspection Error:</Text>
          <Text style={styles.error}>{inspectionResults.inspectionError}</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    margin: 10,
    borderRadius: 8,
    maxHeight: 500,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2c3e50',
  },
  farmId: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
    fontFamily: 'monospace',
    backgroundColor: '#e9ecef',
    padding: 8,
    borderRadius: 4,
  },
  refreshButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    alignItems: 'center',
  },
  refreshText: {
    color: 'white',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  text: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  code: {
    fontSize: 10,
    fontFamily: 'monospace',
    backgroundColor: '#f1f3f4',
    padding: 8,
    borderRadius: 4,
    color: '#333',
  },
  error: {
    fontSize: 12,
    color: '#dc3545',
    fontWeight: 'bold',
  },
  comparisonsContainer: {
    maxHeight: 100,
  },
});

export default DatabaseInspector;
