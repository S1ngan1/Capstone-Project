import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import UVSimple from "../components/Charts/UVSimple";
import { PH } from "../components/Charts/PH";
import { Temperature } from "../components/Charts/Temperature";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import BottomNavigation from "../components/BottomNavigation";
import { useAuthContext } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import CoverPhotoUploader from "../components/CoverPhotoUploader";

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
  const { session } = useAuthContext();
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    const fetchUsername = async () => {
      if (session?.user?.id) {
        const { data, error } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", session.user.id)
          .single();

        if (!error && data) {
          setUsername(data.username);
        } else {
          console.error("Error fetching username:", error);
        }
      }
    };

    fetchUsername();
  }, [session]);

  return (
    <LinearGradient
      colors={["#e7fbe8ff", "#cdffcfff"]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Cover photo + Header */}
        <View style={styles.headerBackground}>
          {/* Cover uploader as background */}
          {session?.user?.id && (
            <CoverPhotoUploader userId={session.user.id} />
          )}

          {/* Header content with higher z-index */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitle}>
              <View style={styles.headerContent}>
                <Text style={styles.usernameText}>
                  {username || "Loading..."}
                </Text>
                <Text style={styles.farmNameText}>Farm 1</Text>
              </View>
            </View>

            <View style={styles.actionButtons}>
              {/* Notification Button */}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate("Notification")}
              >
                <Ionicons name="notifications" size={28} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.temperatureContainer}>
            <Temperature />
          </View>
        </View>

        {/* Charts */}
        <View style={styles.chartBox}>
          <UVSimple />
        </View>
        <PH />
      </ScrollView>

      <BottomNavigation />
    </LinearGradient>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#cdffcfff",
    paddingBottom: 70,
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  headerTitle: {
    flexDirection: "column",
  },
   headerBackground: {
    width: "100%",
    height: 280, 
    backgroundColor: "rgba(14, 89, 14, 1)", // Fallback color
    justifyContent: "flex-end", // Align content to bottom
    alignItems: "flex-start",
    borderBottomEndRadius: 20,
    position: "relative",
    overflow: "hidden", 
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderBottomEndRadius: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    width: "100%",
    zIndex: 10,
    paddingTop: 50,
    position: "absolute",
    top: 0,
  },
  
  headerContent: {
    paddingLeft: 20,
  },
  
  usernameText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10, // Reduced margin
    textShadowColor: "rgba(0, 0, 0, 0.8)", // Stronger shadow
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  
  farmNameText: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 15, // Reduced margin
    textShadowColor: "rgba(0, 0, 0, 0.8)", // Stronger shadow
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  
  actionButtons: {
    flexDirection: "row",
    paddingRight: 20,
    alignItems: "center",
  },
  
  temperatureContainer: {
    zIndex: 10,
    width: "100%",
    paddingBottom: 20,
  },
  actionButton: {
    marginHorizontal: 5,
  },
  chartBox: {
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
  },
});
