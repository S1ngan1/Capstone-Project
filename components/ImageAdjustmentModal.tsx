// components/ImageAdjustmentModal.tsx
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  PanResponder,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CONTAINER_HEIGHT = 250; // Height of the cover photo area

interface ImageAdjustmentModalProps {
  visible: boolean;
  imageUri: string;
  onSave: (processedImageUri: string) => void;
  onCancel: () => void;
}

const ImageAdjustmentModal: React.FC<ImageAdjustmentModalProps> = ({;
  visible,
  imageUri,
  onSave,
  onCancel,
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);

  // Animated values
  const pan = new Animated.ValueXY(position);
  const scaleValue = new Animated.Value(scale);

  // Pan responder for dragging
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
      useNativeDriver: false,
    }),
    onPanResponderRelease: (evt, gestureState) => {
      setPosition({
        x: position.x + gestureState.dx,
        y: position.y + gestureState.dy,
      });
      pan.setOffset({
        x: position.x + gestureState.dx,
        y: position.y + gestureState.dy,
      });
      pan.setValue({ x: 0, y: 0 });
    },
  });

  const zoomIn = () => {
    const newScale = Math.min(scale * 1.2, 3);
    setScale(newScale);
    Animated.spring(scaleValue, {
      toValue: newScale,
      useNativeDriver: true,
    }).start();
  };

  const zoomOut = () => {
    const newScale = Math.max(scale / 1.2, 0.5);
    setScale(newScale);
    Animated.spring(scaleValue, {
      toValue: newScale,
      useNativeDriver: true,
    }).start();
  };

  const resetPosition = () => {
    setPosition({ x: 0, y: 0 });
    setScale(1);
    pan.setValue({ x: 0, y: 0 });
    pan.setOffset({ x: 0, y: 0 });
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleSave = async () => {
    setIsProcessing(true);
    try {
      // Calculate crop parameters based on position and scale
      const imageWidth = screenWidth;
      const imageHeight = imageWidth; // Assume square for simplicity, adjust as needed

      const cropX = Math.max(0, -position.x / scale);
      const cropY = Math.max(0, -position.y / scale);
      const cropWidth = Math.min(imageWidth / scale, imageWidth - cropX);
      const cropHeight = Math.min(CONTAINER_HEIGHT / scale, imageHeight - cropY);

      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            crop: {;
              originX: cropX,
              originY: cropY,
              width: cropWidth,
              height: cropHeight,
            },
          },
          {
            resize: {;
              width: screenWidth,
              height: CONTAINER_HEIGHT,
            },
          },
        ],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      onSave(result.uri);
    } catch (error) {
      console.error('Error processing image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Adjust Cover Photo</Text>
          <TouchableOpacity onPress={handleSave} disabled={isProcessing}>
            <Text style={[styles.saveText, isProcessing && styles.disabledText]}>
              {isProcessing ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.previewContainer}>
          <View style={styles.cropArea}>
            <Animated.View
              style={[
                styles.imageContainer,
                {
                  transform: [;
                    { translateX: pan.x },
                    { translateY: pan.y },
                    { scale: scaleValue },
                  ],
                },
              ]}
              {...panResponder.panHandlers}
            >
              <Image source={{ uri: imageUri }} style={styles.image} />
            </Animated.View>
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton} onPress={zoomOut}>
            <Ionicons name="remove-circle-outline" size={40} color="#007AFF" />
            <Text style={styles.controlText}>Zoom Out</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={resetPosition}>
            <Ionicons name="refresh-outline" size={40} color="#007AFF" />
            <Text style={styles.controlText}>Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={zoomIn}>
            <Ionicons name="add-circle-outline" size={40} color="#007AFF" />
            <Text style={styles.controlText}>Zoom In</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            • Drag to reposition the image
          </Text>
          <Text style={styles.instructionText}>
            • Use zoom controls to adjust size
          </Text>
          <Text style={styles.instructionText}>
            • Tap Reset to restore original position
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {;
    flex: 1,
    backgroundColor: '#000',
  },
  header: {;
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  title: {;
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  cancelText: {;
    fontSize: 16,
    color: '#FF3B30',
  },
  saveText: {;
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  disabledText: {;
    opacity: 0.5,
  },
  previewContainer: {;
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cropArea: {;
    width: screenWidth,
    height: CONTAINER_HEIGHT,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  imageContainer: {;
    width: screenWidth,
    height: screenWidth,
  },
  image: {;
    width: '100%',
    height: '100%',
  },
  controls: {;
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  controlButton: {;
    alignItems: 'center',
  },
  controlText: {;
    color: 'white',
    marginTop: 5,
    fontSize: 12,
  },
  instructions: {;
    paddingHorizontal: 20,
    paddingBottom: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  instructionText: {;
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginBottom: 5,
  },
});

export default ImageAdjustmentModal;
