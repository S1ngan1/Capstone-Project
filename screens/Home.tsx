import React from 'react';
import { View, Text, StyleSheet } from 'react-native'; // Import View, Text, and StyleSheet for styling
import UVSimple from "../components/Charts/UVSimple";
// Assuming Temperature is also a React Native component as UVSimple is
// If Temperature is a web component, you would need to adjust accordingly or create a separate web version.
import { Temperature } from "../components/Charts/Temperature";

const Home = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.usernameText}>Username</Text>
            <Text style={styles.farmNameText}>Farm 1</Text>
            <UVSimple />
            <Temperature />
        </View>
    );
}

export default Home;

const styles = StyleSheet.create({
    container: {
        flex: 1, 
        backgroundColor: '#1a3b2c', 
        alignItems: 'center', 
        paddingTop: 50, 
    },
    usernameText: {
        fontSize: 32, 
        fontWeight: 'bold',
        color: '#fff', 
        marginBottom: 5, 
    },
    farmNameText: {
        fontSize: 18, 
        color: '#fff', 
        marginBottom: 30, 
    },
});
