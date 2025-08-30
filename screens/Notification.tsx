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
    Alert,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons'; 
import NotiPiece from '../components/NotiPiece';
import BottomNavigation from '../components/BottomNavigation';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../context/AuthContext';

interface NotificationItem {
    id: string;
    content: string;
    level: 'urgent' | 'warning' | 'normal';
    timestamp: string;
    actionButtons?: Array<{
        label: string;
        onClick: () => void;
    }>;
}

const Notification: React.FC = () => {
    const { session } = useAuthContext();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setModalVisible] = useState(false);
    const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);

    // Generate mock notifications based on real sensor data
    const generateNotifications = async () => {
        try {
            if (!session?.user?.id) {
                setNotifications([]);
                setLoading(false);
                return;
            }

            // Get user's farms
            const { data: userFarms } = await supabase
                .from('farm_users')
                .select('farm_id, farms(name)')
                .eq('user_id', session.user.id);

            if (!userFarms || userFarms.length === 0) {
                setNotifications([{
                    id: 'no-farms',
                    content: 'Welcome! Add your first farm to start receiving notifications.',
                    level: 'normal',
                    timestamp: new Date().toISOString(),
                }]);
                setLoading(false);
                return;
            }

            const farmIds = userFarms.map(f => f.farm_id);

            // Get latest sensor readings
            const { data: sensorData } = await supabase
                .from('sensor_data')
                .select(`
                    sensor_id,
                    value,
                    created_at,
                    sensor(
                        sensor_name,
                        sensor_type,
                        farm_id,
                        farms(name)
                    )
                `)
                .in('sensor.farm_id', farmIds)
                .order('created_at', { ascending: false })
                .limit(20);

            const generatedNotifications: NotificationItem[] = [];

            // Generate notifications based on sensor data
            sensorData?.forEach((reading: any, index) => {
                const { sensor, value, created_at } = reading;
                const sensorType = sensor.sensor_type.toLowerCase();
                const farmName = sensor.farms.name;

                // pH notifications
                if (sensorType.includes('ph')) {
                    if (value < 6.0) {
                        generatedNotifications.push({
                            id: `ph_low_${index}`,
                            content: `🚨 ${farmName}: Soil pH too acidic (${value}). Plants may struggle to absorb nutrients.`,
                            level: 'urgent',
                            timestamp: created_at,
                        });
                    } else if (value > 8.0) {
                        generatedNotifications.push({
                            id: `ph_high_${index}`,
                            content: `⚠️ ${farmName}: Soil pH too alkaline (${value}). Consider adding sulfur.`,
                            level: 'warning',
                            timestamp: created_at,
                        });
                    }
                }

                // Temperature notifications
                if (sensorType.includes('temperature')) {
                    if (value > 35) {
                        generatedNotifications.push({
                            id: `temp_high_${index}`,
                            content: `🌡️ ${farmName}: High temperature alert (${value}°C). Consider shade or irrigation.`,
                            level: 'urgent',
                            timestamp: created_at,
                        });
                    } else if (value < 10) {
                        generatedNotifications.push({
                            id: `temp_low_${index}`,
                            content: `❄️ ${farmName}: Low temperature warning (${value}°C). Protect plants from frost.`,
                            level: 'warning',
                            timestamp: created_at,
                        });
                    }
                }

                // Soil moisture notifications
                if (sensorType.includes('moisture')) {
                    if (value < 30) {
                        generatedNotifications.push({
                            id: `moisture_low_${index}`,
                            content: `💧 ${farmName}: Low soil moisture (${value}%). Time to water your plants!`,
                            level: 'warning',
                            timestamp: created_at,
                        });
                    } else if (value > 80) {
                        generatedNotifications.push({
                            id: `moisture_high_${index}`,
                            content: `🌊 ${farmName}: Soil too wet (${value}%). Risk of root rot - improve drainage.`,
                            level: 'urgent',
                            timestamp: created_at,
                        });
                    }
                }
            });

            // Add some general notifications
            generatedNotifications.push({
                id: 'daily_summary',
                content: `📊 Daily summary ready for your ${userFarms.length} farm${userFarms.length > 1 ? 's' : ''}. Check your dashboard for insights.`,
                level: 'normal',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            });

            generatedNotifications.push({
                id: 'system_update',
                content: '🔄 System updated with latest AI recommendations. Check your Suggestions tab.',
                level: 'normal',
                timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            });

            setNotifications(generatedNotifications.slice(0, 10)); // Limit to 10 notifications
        } catch (error) {
            console.error('Error generating notifications:', error);
            setNotifications([{
                id: 'error',
                content: 'Unable to load notifications. Please try again later.',
                level: 'warning',
                timestamp: new Date().toISOString(),
            }]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        generateNotifications();
    }, [session]);

    const sections = [...new Set(notifications.map(n => n.level))];

    const handleNotiPress = (id: string) => {
        console.log(`Notification ${id} pressed!`);
    };

    const handleMorePress = (id: string) => {
        setSelectedNotificationId(id);
        setModalVisible(true);
    };

    const handleDeleteNotification = () => {
        if (selectedNotificationId) {
            setNotifications(prev => prev.filter(n => n.id !== selectedNotificationId));
            Alert.alert('Success', 'Notification deleted');
        }
        setModalVisible(false);
        setSelectedNotificationId(null);
    };

    const handleMarkAllRead = () => {
        Alert.alert('Success', 'All notifications marked as read');
    };

    const handleClearAll = () => {
        Alert.alert(
            'Clear All Notifications',
            'Are you sure you want to clear all notifications?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: () => {
                        setNotifications([]);
                        Alert.alert('Success', 'All notifications cleared');
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Notifications</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading notifications...</Text>
                </View>
                <BottomNavigation />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Notifications</Text>
                <View style={styles.headerActions}>
                    {notifications.length > 0 && (
                        <>
                            <TouchableOpacity
                                style={styles.headerActionButton}
                                onPress={handleMarkAllRead}
                            >
                                <Ionicons name="checkmark-done" size={20} color="#4CAF50" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.headerActionButton}
                                onPress={handleClearAll}
                            >
                                <Ionicons name="trash-outline" size={20} color="#f44336" />
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                {notifications.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyTitle}>No Notifications</Text>
                        <Text style={styles.emptyText}>You're all caught up! Check back later for updates.</Text>
                    </View>
                ) : (
                    sections.map(section => (
                        <View key={section} style={styles.sectionContainer}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>
                                    {section.toUpperCase()} ({notifications.filter(n => n.level === section).length})
                                </Text>
                            </View>
                            {notifications
                                .filter(n => n.level === section)
                                .map((notification, index, arr) => (
                                    <View key={notification.id}>
                                        <NotiPiece
                                            content={notification.content}
                                            time={notification.timestamp}
                                            level={notification.level}
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
                                        {index < arr.length - 1 && <View style={styles.itemDivider} />}
                                    </View>
                                ))
                            }
                        </View>
                    ))
                )}
            </ScrollView>

            {/* More Options Modal */}
            <Modal
                visible={isModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modalContainer}>
                                <TouchableOpacity
                                    style={styles.modalOption}
                                    onPress={handleDeleteNotification}
                                >
                                    <Ionicons name="trash-outline" size={20} color="#f44336" />
                                    <Text style={styles.modalOptionText}>Delete Notification</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.modalOption}
                                    onPress={() => setModalVisible(false)}
                                >
                                    <Ionicons name="close-outline" size={20} color="#666" />
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
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        ...Platform.select({
            ios: {
                paddingTop: 50,
            },
            android: {
                paddingTop: 35,
            },
        }),
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerActionButton: {
        padding: 8,
        marginLeft: 8,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
    },
    scrollViewContent: {
        paddingBottom: 100,
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
        marginTop: 20,
        marginBottom: 10,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    sectionContainer: {
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        letterSpacing: 0.5,
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#fff',
    },
    actionButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginLeft: 10,
    },
    primaryButton: {
        backgroundColor: '#4CAF50',
    },
    secondaryButton: {
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '500',
    },
    primaryButtonText: {
        color: '#fff',
    },
    secondaryButtonText: {
        color: '#333',
    },
    itemDivider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginHorizontal: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        margin: 40,
        minWidth: 200,
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
    },
    modalOptionText: {
        fontSize: 16,
        marginLeft: 12,
        color: '#333',
    },
});

export default Notification;
