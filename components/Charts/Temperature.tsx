import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function Temperature() {
    //THIS WILL BE REPLACED BY AN ACTUAL DATA FROM API
    const todayTemp = 20;
    const tomorrowTemp = 20;

    return (
        <View style={styles.container}>
            <View style={styles.dayContainer}>
                <Ionicons name="sunny-outline" size={24} color="#FFD700" style={styles.weatherIcon} />
                <Text style={styles.dayText}>Today</Text>
                <Text style={styles.tempText}>{todayTemp}°C</Text>
            </View>

            <View style={styles.dayContainer}>
                <Ionicons name="cloudy-outline" size={24} color="#ADD8E6" style={styles.weatherIcon} />
                <Text style={styles.dayText}>Tomorrow</Text>
                <Text style={styles.tempText}>{tomorrowTemp}°C</Text>
            </View>

             <View style={styles.dayContainer}>
                <Ionicons name="sunny-outline" size={24} color="#FFD700" style={styles.weatherIcon} />
                <Text style={styles.dayText}>Friday</Text>
                <Text style={styles.tempText}>20°C</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 15,
        paddingVertical: 15,
        paddingHorizontal: 10,
        marginHorizontal: 20,
        marginTop: 20,
        width: '90%',
    },
    dayContainer: {
        alignItems: 'center',
    },
    weatherIcon: {
        marginBottom: 5,
    },
    dayText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: 2,
    },
    tempText: {
        fontSize: 18,
        color: '#fff',
        fontWeight: '600',
    },
    
});
