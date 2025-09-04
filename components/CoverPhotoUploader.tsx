import React, { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";

interface Props {
  userId: string;
}

export default function CoverPhotoUploader({ userId }: Props) {
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch cover photo từ DB
  const fetchCoverPhoto = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("cover_photo")
      .eq("id", userId)
      .single();

    if (error) {
      console.log("❌ Fetch error:", error);
    } else {
      setCoverUrl(data?.cover_photo ?? null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCoverPhoto();
  }, [userId]);

  // Chọn ảnh từ gallery
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Allow access to gallery to continue.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadImage(result.assets[0].uri);
    }
  };

  // Upload ảnh lên Supabase
  const uploadImage = async (uri: string) => {
    try {
      setUploading(true);

      // đọc file thành buffer
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const fileBuffer = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

      // tạo tên file
      const filename = `${userId}/cover_${Date.now()}.jpg`;

      // upload
      const { error: uploadError } = await supabase.storage
        .from("cover-photos")
        .upload(filename, fileBuffer, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // lấy public URL
      const { data } = supabase.storage
        .from("cover-photos")
        .getPublicUrl(filename);
      const publicUrl = data.publicUrl;

      // update DB
      const { error: dbError } = await supabase
        .from("profiles")
        .update({ cover_photo: publicUrl })
        .eq("id", userId);

      if (dbError) throw dbError;

      setCoverUrl(publicUrl);
      Alert.alert("✅ Success", "Cover photo updated!");
    } catch (err) {
      console.error("❌ Upload error:", err);
      Alert.alert("Upload failed", "Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : (
        <>
          <Image
            source={{
              uri:
                coverUrl ??
                "https://placehold.co/600x200?text=No+Cover+Photo",
            }}
            style={styles.coverPhoto}
          />
          
          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={pickImage}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="camera" size={28} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(14, 89, 14, 1)",
  },
  coverPhoto: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    top: 40,
    right: 60,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    zIndex: 1000, 
  },
  btnText: {
    color: "#fff",
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "500",
  },
});