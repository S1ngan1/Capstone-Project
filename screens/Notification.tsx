import React, { useState, useEffect } from 'react';
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
    RefreshControl,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons'; 
import NotiPiece from '../components/NotiPiece';
import BottomNavigation from '../components/BottomNavigation';
import { useAuthContext } from '../context/AuthContext';
import { Notification as NotificationInterface } from '../types/interfaces';

interface NotificationSection {
    id: string;
    fullContent: string;
    displayTime: string;
    section: 'Today' | 'Yesterday' | 'Earlier' | 'Other';
    level: 'urgent' | 'warning' | 'normal';
    isRead: boolean;
    actionButtons?: { label: string; onClick: () => void }[];
}

const Notification: React.FC = () => {
    const { notifications, markAsRead, refreshNotifications } = useAuthContext();
    const [isModalVisible, setModalVisible] = useState(false);
    const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const formatNotificationsForDisplay = (notifications: NotificationInterface[]): NotificationSection[] => {
        return notifications.map(notification => {
            const createdAt = new Date(notification.created_at);
            const now = new Date();
            const timeDiff = now.getTime() - createdAt.getTime();
            const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
            const hoursDiff = Math.floor(timeDiff / (1000 * 3600));
            const minutesDiff = Math.floor(timeDiff / (1000 * 60));

            let displayTime: string;
            let section: 'Today' | 'Yesterday' | 'Earlier' | 'Other';

            if (daysDiff === 0) {
                if (hoursDiff === 0) {
                    displayTime = minutesDiff <= 0 ? 'now' : `${minutesDiff}m`;
                } else {
                    displayTime = `${hoursDiff}h`;
                }
                section = 'Today';
            } else if (daysDiff === 1) {
                displayTime = '1d';
                section = 'Yesterday';
            } else if (daysDiff < 7) {
                displayTime = `${daysDiff}d`;
                section = 'Earlier';
            } else {
                displayTime = `${Math.floor(daysDiff / 7)}w`;
                section = 'Earlier';
            }

            return {
                id: notification.id,
                fullContent: notification.message || notification.content || 'No message',
                displayTime,
                section,
                level: notification.level,
                isRead: notification.is_read,
            };
        });
    };

    const displayNotifications = formatNotificationsForDisplay(notifications);
    const sections = [...new Set(displayNotifications.map(n => n.section))];

    const handleNotiPress = (id: string) => {
        console.log(`Notification ${id} pressed!`);
        markAsRead(id);
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

    const onRefresh = async () => {
        setRefreshing(true);
        refreshNotifications();
        setRefreshing(false);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Notifications</Text>
                <TouchableOpacity style={styles.searchIcon}>
                    <Ionicons name="search" size={24} color="#555" />
                </TouchableOpacity>
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollViewContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#00A388']}
                        tintColor={'#00A388'}
                    />
                }
            >
                {sections.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="notifications-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyTitle}>No Notifications</Text>
                        <Text style={styles.emptyText}>You're all caught up! No new notifications to show.</Text>
                    </View>
                ) : (
                    sections.map(section => (
                        <View key={section} style={styles.sectionContainer}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>{section}</Text>
                                {section === 'Today' && displayNotifications.filter(n => n.section === section).length > 3 && (
                                    <TouchableOpacity>
                                        <Text style={styles.seeAllText}>See all</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            {displayNotifications
                                .filter(n => n.section === section)
                                .map((notification, index, arr) => (
                                    <View key={notification.id}>
                                        <NotiPiece
                                            content={notification.fullContent}
                                            time={notification.displayTime}
                                            level={notification.level}
                                            isRead={notification.isRead}
                                            onPress={() => handleNotiPress(notification.id)}
                                            onMorePress={() => handleMorePress(notification.id)}
                                        />
                                        {index < arr.length - 1 && <View style={styles.separator} />}
                                    </View>
                                ))}
                        </View>
                    ))
                )}
            </ScrollView>

            <Modal
                animationType="slide"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                    <View style={styles.modalBackground}>
                        <TouchableWithoutFeedback onPress={() => {}}>
                            <View style={styles.modalContainer}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Notification Options</Text>
                                </View>
                                <TouchableOpacity style={styles.modalOption} onPress={handleDeleteNotification}>
                                    <MaterialIcons name="delete" size={24} color="#ff4444" />
                                    <Text style={styles.modalOptionText}>Delete</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.modalOption} onPress={() => setModalVisible(false)}>
                                    <MaterialIcons name="close" size={24} color="#666" />
                                    <Text style={styles.modalOptionText}>Cancel</Text>
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
        backgroundColor: '#F5F7FA',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    searchIcon: {
        padding: 5,
    },
    scrollViewContent: {
        paddingBottom: 100,
        flexGrow: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    sectionContainer: {
        marginTop: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    seeAllText: {
        fontSize: 14,
        color: '#00A388',
        fontWeight: '600',
    },
    separator: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginHorizontal: 20,
    },
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: Platform.OS === 'ios' ? 35 : 20,
    },
    modalHeader: {
        alignItems: 'center',
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    modalOptionText: {
        fontSize: 16,
        marginLeft: 15,
        color: '#333',
    },
});

export default Notification;
