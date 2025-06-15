import { StyleSheet, Text, View, FlatList, Animated, ViewToken, TouchableOpacity } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import React, { useState, useRef } from 'react'

import slides from '../scripts/OnboardingSlides'
import OnboardingItem from './OnBoardingItem'

export default function Onboarding({ onFinish }: { onFinish: () => void }) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0)
  const scrollX = useRef(new Animated.Value(0)).current
  const slidesRef = useRef<FlatList>(null)

  const viewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    setCurrentSlideIndex(viewableItems[0]?.index || 0)
  }).current

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current

  const scrollToNext = () => {
    if (currentSlideIndex < slides.length - 1 && slidesRef.current) {
      slidesRef.current.scrollToIndex({ index: currentSlideIndex + 1 })
    } else {
      onFinish()
    }
  }

  return (
    <View style={styles.container}>
       <View style={{ flex: 3 }}>
          <FlatList data={slides} renderItem={({ item }) => <OnboardingItem item={item} />}
            horizontal
            showsHorizontalScrollIndicator
            pagingEnabled
            bounces={false}
            keyExtractor={(item) => item.id}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
              useNativeDriver: false,
            })}
            scrollEventThrottle={32}
            onViewableItemsChanged={viewableItemsChanged}
            viewabilityConfig={viewConfig}
          ref={slidesRef} />
        
        <View style={styles.footer}>
          <TouchableOpacity style={styles.button} onPress={scrollToNext}>
            <Text style={styles.buttonText}>
              {currentSlideIndex === slides.length - 1 ? 'Start' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
        <StatusBar style="auto" />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  footer: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#7DDA58',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    position: 'absolute',
    bottom: 40,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
})
