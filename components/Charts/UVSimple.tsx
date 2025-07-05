import React, { useState } from 'react';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { View, StyleSheet, Text } from 'react-native'; // Import Text component

const UVSimple = () => {
    // Use useState to manage the fill value, initialized to 0.
    const [currentFill, setCurrentFill] = useState(0);
    const MAX_CUSTOM_FILL = 11; 

    // Function to determine the tint color based on the fill value
    const getTintColor = (fillValue: number) => {
        if (fillValue >= 0 && fillValue <= 2) {
            return '#28a745'; 
        } else if (fillValue >= 3 && fillValue <= 5) {
            return '#ffc107'; 
        } else if (fillValue >= 6 && fillValue <= 7) {
            return '#fd7e14'; 
        } else if (fillValue >= 8 && fillValue <= 10) {
            return '#dc3545'; 
        } else if (fillValue === MAX_CUSTOM_FILL) { 
            return '#6f42c1'; 
        }
        return '#00e0ff';
    };

    const scaledFill = (currentFill / MAX_CUSTOM_FILL) * 100;

    return (
        <View style={styles.container}>
            <AnimatedCircularProgress
                size={120}
                width={15}
                fill={scaledFill} 
                tintColor={getTintColor(currentFill)} 
                backgroundColor="#3d5875"
                rotation={220}
                arcSweepAngle={280}
                lineCap='butt'
            >
                {
                    (fill: number) => (
                        <Text style={styles.progressText}>
                            {currentFill.toFixed(0)}
                        </Text>
                    )
                }
            </AnimatedCircularProgress>
            <View style={styles.buttonContainer}>
                <Text
                    onPress={() => setCurrentFill(Math.floor(Math.random() * (MAX_CUSTOM_FILL + 1)))}
                    style={styles.button}
                >
                    Set Random Fill
                </Text>
            </View>
        </View>
    );
}

export default UVSimple;

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center', 
        alignItems: 'center', 
        margin: 20,
    },
    progressText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#f0f0f0',
    },
    buttonContainer: {
        marginTop: 30,
    },
    button: {
        backgroundColor: '#007bff',
        color: '#fff',
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 30,
        fontSize: 18,
        fontWeight: '600',
        overflow: 'hidden', 
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    }
});
