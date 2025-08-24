import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

const Farm = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation(); 
  
  // Mock data for farm
  const farm = {
    name: "Củ Chi",
    location: "Củ Chi",
    harvestDate: "Dec, 24 2024",
    yield: "7500 Kg/ha",
    imageUrl: "https://image.vietnamnews.vn/uploadvnnews/Article/2017/4/4/HA0589135849PM.JPG"
  };

  return (
    <ImageBackground
      source={{ uri: farm.imageUrl }}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={[styles.overlay, { paddingTop: insets.top }]}>

        <BlurView intensity={30} style={styles.headerContainer}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => navigation.goBack()} 
          >
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{farm.name}</Text>
            <Text style={styles.headerSubtitle}>{farm.location}</Text>
          </View>
          <TouchableOpacity style={styles.iconButton}>
            <MaterialIcons name="switch-access-shortcut" size={24} color="#333" style={styles.itemIcon} />
          </TouchableOpacity>
        </BlurView>
        

        <View style={styles.controlButtons}>
          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="add" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="remove" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="locate" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <BlurView intensity={30} style={[styles.infoBox, { bottom: insets.bottom + 20 }]}>
          <View style={styles.infoContent}>
            <LinearGradient
              colors={['#e7fbe8ff', '#cdffcfff']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.infoGradient}
            >
              <View style={styles.infoRow}>
                {/* Placeholder image/icon */}
                <View style={styles.infoImagePlaceholder}>
                  <Ionicons name="image" size={40} color="#333" />
                </View>
                <View>
                  <Text style={styles.infoTitle}>{farm.name}</Text>
                  <Text style={styles.infoText}>Harvest On {farm.harvestDate}</Text>
                  <Text style={styles.infoYield}>{farm.yield}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </BlurView>
        </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 50,
    marginHorizontal: 20,
    marginTop: 20,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#555',
  },
  iconButton: {
    padding: 8,
  },
  controlButtons: {
    position: 'absolute',
    right: 20,
    top: Constants.statusBarHeight + 100,
    alignItems: 'center',
  },
  controlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 50,
    padding: 10,
    marginVertical: 5,
  },
  infoBox: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 20,
    padding: 10,
    marginBottom: 10,
  },
  infoContent: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  infoGradient: {
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoImagePlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: '#fff',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#555',
  },
  infoYield: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 5,
  },
  itemIcon: {
    marginRight: 15,
  },
});

export default Farm;
