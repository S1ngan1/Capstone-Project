import React, { useState } from 'react';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { View, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const UVSimple = () => {
    const [currentFill, setCurrentFill] = useState(0);
    const MAX_CUSTOM_FILL = 11;

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
        <LinearGradient
            colors={['#e7fbe8ff', '#cdffcfff']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.container}
        >
            <Text style={styles.UVText}>UV</Text>
            <AnimatedCircularProgress
                size={200}
                width={20}
                fill={scaledFill}
                tintColor={getTintColor(currentFill)}
                backgroundColor="#3d5875"
                rotation={240}
                arcSweepAngle={240}
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
        </LinearGradient>
    );
}

export default UVSimple;

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 15,
        margin: 15,
        padding: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        width: '90%',
        elevation: 8,
    },
    UVText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'black',
        marginBottom: 20,
        textAlign: 'left',
        width: '100%'
    },
    progressText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'black',
    },
    buttonContainer: {
        marginTop: 30,
    },
});
