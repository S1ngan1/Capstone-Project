import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    Platform,
    Modal,
    TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import NotiPiece from '../components/NotiPiece';
import BottomNavigation from '../components/BottomNavigation';

interface NotificationData {
    id: string;
    fullContent: string;
    displayTime: string;
    actionButtons?: { label: string; onClick: () => void }[];
}

const notifications: NotificationData[] = [
    {
        id: 'req1',
        fullContent: 'Temperature is 36 degrees Celcius. Please water your plant',
        displayTime: '5d',
    },
    {
        id: 'react1',
        fullContent: 'Humidity is 66%',
        displayTime: '3d',
    }
];

const Notification: React.FC = () => {
    const [isModalVisible, setModalVisible] = useState(false);
    const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);

    const handleNotiPress = (id: string) => {
        console.log(`Notification ${id} pressed!`);
    };

    const handleMorePress = (id: string) => {
        setSelectedNotificationId(id);
        setModalVisible(true);
    };

    const handleDeleteNotification = () => {
        if (selectedNotificationId) {
            console.log(`Deleting notification with ID: ${selectedNotificationId}`);
        }
        setModalVisible(false);
        setSelectedNotificationId(null);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Notifications</Text>
                <TouchableOpacity style={styles.searchIcon}>
                    <Ionicons name="search" size={24} color="#555" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                <View style={styles.sectionContainer}>
                    {notifications.map((notification, index) => (
                        <View key={notification.id}>
                            <NotiPiece
                                content={notification.fullContent}
                                time={notification.displayTime}
                                onPress={() => handleNotiPress(notification.id)}
                                onMorePress={() => handleMorePress(notification.id)}
                            />
                            {notification.actionButtons && notification.actionButtons.length > 0 && (
                                <View style={styles.actionButtonsContainer}>
                                    {notification.actionButtons.map(button => (
                                        <TouchableOpacity
                                            key={button.label}
                                            onPress={button.onClick}
                                            style={[
                                                styles.actionButton,
                                                (button.label === 'Confirm' || button.label === 'Join')
                                                    ? styles.primaryButton
                                                    : styles.secondaryButton,
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.actionButtonText,
                                                    (button.label === 'Confirm' || button.label === 'Join')
                                                        ? styles.primaryButtonText
                                                        : styles.secondaryButtonText,
                                                ]}
                                            >
                                                {button.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                            {index < notifications.length - 1 && <View style={styles.itemDivider} />}
                        </View>
                    ))}
                </View>
            </ScrollView>

            <Modal
                animationType="slide"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modalContent}>
                                <TouchableOpacity
                                    onPress={handleDeleteNotification}
                                    style={styles.deleteButton}
                                >
                                    <Text style={styles.deleteButtonText}>Delete Notification</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            <BottomNavigation />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#e7fbe8ff',
        paddingTop: Platform.OS === 'android' ? 25 : 0,
    },
    header: {
        paddingVertical: 18,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    searchIcon: {
        padding: 5,
    },
    scrollViewContent: {
        paddingBottom: 140,
    },
    sectionContainer: {
        backgroundColor: '#fff',
        marginTop: 10,
        borderRadius: 15,
        overflow: 'hidden',
        marginHorizontal: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        marginBottom: 10,
    },
    itemDivider: {
        height: 0.5,
        backgroundColor: '#f0f0f0',
        marginLeft: 16,
        marginRight: 0,
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 16,
        paddingBottom: 12,
        paddingTop: 4,
    },
    actionButton: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 6,
        marginLeft: 8,
    },
    primaryButton: {
        backgroundColor: '#00A388',
    },
    secondaryButton: {
        backgroundColor: '#e4e6eb',
    },
    actionButtonText: {
        fontSize: 13,
        fontWeight: '600',
    },
    primaryButtonText: {
        color: '#fff',
    },
    secondaryButtonText: {
        color: '#333',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
        width: '100%',
        alignSelf: 'center',
    },
    deleteButton: {
        paddingVertical: 15,
        alignItems: 'flex-start',
    },
    deleteButtonText: {
        fontSize: 16,
        color: '#e74c3c',
    },
});

export default Notification;
