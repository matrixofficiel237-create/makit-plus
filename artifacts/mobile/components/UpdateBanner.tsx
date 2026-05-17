import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Animated,
  Modal,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { UpdateInfo } from "@/hooks/useAppUpdate";

interface UpdateBannerProps {
  updateInfo: UpdateInfo;
  onDismiss: () => void;
}

export function UpdateBanner({ updateInfo, onDismiss }: UpdateBannerProps) {
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 10,
    }).start();
  }, []);

  function handleDownload() {
    Linking.openURL(updateInfo.apkUrl).catch(() => {});
  }

  if (Platform.OS === "web") return null;

  return (
    <Modal
      transparent
      visible
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            {
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [120, 0],
                  }),
                },
              ],
              opacity: slideAnim,
            },
          ]}
        >
          {/* Icône */}
          <View style={styles.iconWrap}>
            <Feather name="download-cloud" size={32} color={Colors.primary} />
          </View>

          {/* Texte */}
          <View style={styles.textWrap}>
            <Text style={styles.title}>Mise à jour disponible</Text>
            <Text style={styles.version}>Version {updateInfo.version}</Text>
            <Text style={styles.notes}>{updateInfo.releaseNotes}</Text>
          </View>

          {/* Boutons */}
          <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload} activeOpacity={0.85}>
            <Feather name="download" size={18} color="#fff" />
            <Text style={styles.downloadBtnText}>Télécharger la mise à jour</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.laterBtn} onPress={onDismiss}>
            <Text style={styles.laterText}>Plus tard</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
    paddingBottom: 32,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryLighter,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  textWrap: {
    alignItems: "center",
    marginBottom: 20,
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  version: {
    fontSize: 13,
    color: Colors.primary,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
    marginTop: 2,
  },
  notes: {
    fontSize: 14,
    color: "#666",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
  },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    width: "100%",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  downloadBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  laterBtn: {
    marginTop: 14,
    paddingVertical: 8,
  },
  laterText: {
    color: "#888",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
