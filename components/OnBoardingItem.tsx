import { StyleSheet, Text, View, ImageBackground, useWindowDimensions } from 'react-native';
import React from 'react';
import { OnboardingItemProps } from '../interfaces/OnBoarding';


const OnboardingItem = ({ item }: OnboardingItemProps) => {
  const { width, height } = useWindowDimensions();

  return (
    <View style={[styles.container, { width, height }]}>
      <ImageBackground source={item.image} style={[styles.image, { width, height}]} resizeMode="cover">
        
      <View style={styles.overlay} />

      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
      </ImageBackground>
    </View>
  );
};

export default OnboardingItem;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  image: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // màu đen 40% mờ
  },
  textContainer: {
    marginBottom: 80,
    paddingHorizontal: 30,
    zIndex: 1, // đảm bảo nằm trên overlay
  },
  title: {
    fontWeight: '800',
    fontSize: 30,
    marginBottom: 10,
    color: 'white',
    textAlign: 'center',
  },
  description: {
    fontWeight: '300',
    color: 'white',
    textAlign: 'center',
  },
});
