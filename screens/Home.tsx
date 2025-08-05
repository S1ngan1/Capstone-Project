import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, ScrollView } from 'react-native';
import UVSimple from "../components/Charts/UVSimple";
import { PH } from '../components/Charts/PH';
import { Temperature } from '../components/Charts/Temperature';
import AccountImage from '../assets/images/account/background_account.png';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from "@react-navigation/native";
import BottomNavigation from '../components/BottomNavigation';

export type RootStackParamList = {
    Auth: undefined;
    Onboarding: undefined;
    Home: undefined;
    Farm: undefined;
    Suggestion: undefined;
    Profile: undefined;
    Settings: undefined;
    Notification: undefined;
};

const Home = () => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();

    return (
        <LinearGradient
            colors={['#e7fbe8ff', '#cdffcfff']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                <ImageBackground
                    source={AccountImage}
                    style={styles.headerBackground}
                    imageStyle={styles.headerImageStyle}
                >
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%'}}>
                        <View style={styles.headerTitle}>
                            <View style={styles.headerContent}>
                                <Text style={styles.usernameText}>Username</Text>
                                <Text style={styles.farmNameText}>Farm 1</Text>
                            </View>
                        </View>
                        <View style={styles.notiProfile}>
                            <TouchableOpacity
                                style={styles.profileIconContainer}
                                onPress={() => navigation.navigate("Notification")}
                            >
                                <Ionicons name="notifications" size={28} color="white" style={styles.icon} />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <Temperature />
                </ImageBackground>

                <View style={styles.chartBox}>
                    <UVSimple />
                </View>
                <PH />
            </ScrollView>

            <BottomNavigation />
        </LinearGradient>
    );
}

export default Home;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#cdffcfff',
        paddingBottom: 70,
    },
    scrollViewContent: {
        paddingBottom: 20,
    },
    headerTitle: {
        flexDirection: 'column',
    },
    headerBackground: {
        width: '100%',
        paddingTop: 50,
        paddingBottom: 30,
        backgroundColor: 'rgba(14, 89, 14, 1)',
        justifyContent: 'center',
        alignItems: 'flex-start',
        borderBottomEndRadius: 20,
    },
    headerImageStyle: {
        resizeMode: 'cover',
    },
    headerContent: {
        paddingLeft: 20,
    },
    usernameText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
    },
    farmNameText: {
        fontSize: 16,
        color: '#fff',
        marginBottom: 30,
    },
    icon: {
        marginHorizontal: 10,
    },
    notiProfile: {
        flexDirection: 'row',
        paddingRight: 20,
    },
    chartBox: {
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
    },
    profileIconContainer: {
    },
});
