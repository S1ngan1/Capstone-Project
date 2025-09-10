import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

// Added support for notification levels
interface NotiPieceProps {
  content: string;
  time: string;
  level: 'urgent' | 'warning' | 'normal';
  isRead: boolean;
  onPress?: () => void;
  onMorePress?: () => void; 
}

const NotiPiece: React.FC<NotiPieceProps> = ({ content, time, level, isRead, onPress, onMorePress }) => {
  const getIconForLevel = () => {
    switch (level) {
      case 'urgent':
        return '⚠️';
      case 'warning':
        return '⚡';
      case 'normal':
      default:
        return 'ℹ️';
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.container, !isRead && styles.unreadContainer]} 
      onPress={onPress} 
      activeOpacity={0.8}
    >
      {!isRead && <View style={styles.unreadIndicator} />}
      <Text style={styles.levelIcon}>{getIconForLevel()}</Text>
      <View style={styles.contentContainer}>
        <Text style={[styles.contentText, !isRead && styles.unreadText]}>{content}</Text>
        <Text style={styles.timeText}>{time}</Text>
      </View>
      <TouchableOpacity onPress={onMorePress} style={styles.moreIconContainer}>
        <Text style={styles.moreIcon}>•••</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
  },
  unreadContainer: {
    backgroundColor: '#f8f9fa',
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1a73e8',
    marginRight: 8,
  },
  levelIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  contentContainer: {
    flex: 1,
    marginLeft: 0,
    marginRight: 10, 
  },
  contentText: {
    color: '#333',
    fontSize: 14,
    lineHeight: 18,
  },
  unreadText: {
    fontWeight: 'bold',
  },
  timeText: {
    color: '#1a73e8',
    fontSize: 11,
    marginTop: 4,
  },
  moreIconContainer: {
    padding: 5, 
  },
  moreIcon: {
    fontSize: 18, 
    color: '#888',
    fontWeight: 'bold', 
  },
});

export default NotiPiece;