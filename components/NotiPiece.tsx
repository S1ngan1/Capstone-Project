import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface NotiPieceProps {
  content: string;
  time: string;
  onPress?: () => void;
  onMorePress?: () => void; 
}

const NotiPiece: React.FC<NotiPieceProps> = ({ content, time, onPress, onMorePress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.contentContainer}>
        <Text style={styles.contentText}>{content}</Text>
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