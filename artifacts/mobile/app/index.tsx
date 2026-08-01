import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";

const { width } = Dimensions.get("window");

export default function SplashScreen() {
  const { user, isLoading } = useAuth();

  const logoOpacity  = useRef(new Animated.Value(0)).current;
  const logoScale    = useRef(new Animated.Value(0.82)).current;
  const textOpacity  = useRef(new Animated.Value(0)).current;
  const textY        = useRef(new Animated.Value(16)).current;
  const barWidth     = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1 — Logo fade + scale
    Animated.parallel([
      Animated.timing(logoOpacity, { toValue: 1, duration: 550, useNativeDriver: false }),
      Animated.spring(logoScale,   { toValue: 1, tension: 60, friction: 9, useNativeDriver: false }),
    ]).start();

    // 2 — Brand name slides up
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 500, useNativeDriver: false }),
        Animated.spring(textY, { toValue: 0, tension: 70, friction: 10, useNativeDriver: false }),
      ]).start();
    }, 400);

    // 3 — Tagline fade
    setTimeout(() => {
      Animated.timing(taglineOpacity, { toValue: 1, duration: 500, useNativeDriver: false }).start();
    }, 750);

    // 4 — Progress bar fills over 2s
    setTimeout(() => {
      Animated.timing(barWidth, {
        toValue: width - 64,
        duration: 1800,
        useNativeDriver: false,
      }).start();
    }, 500);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        if (user) {
          if (user.role === "livreur")        router.replace("/(livreur)/orders");
          else if (user.role === "admin")     router.replace("/(admin)/dashboard");
          else if (user.role === "sous_admin") router.replace("/(sous_admin)/dashboard");
          else                                router.replace("/(tabs)/home");
        } else {
          router.replace("/(auth)/login");
        }
      }, 2600);
      return () => clearTimeout(timer);
    }
  }, [isLoading, user]);

  return (
    <View style={styles.container}>

      {/* Subtle top glow */}
      <View style={styles.topGlow} />

      {/* Center content */}
      <View style={styles.center}>
        {/* Logo */}
        <Animated.View style={[styles.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
          <View style={styles.logoCircle}>
            <Image
              source={require("@/assets/images/logo.png")}
              style={styles.logo}
              resizeMode="cover"
            />
          </View>
        </Animated.View>

        {/* Brand name */}
        <Animated.View style={{ opacity: textOpacity, transform: [{ translateY: textY }] }}>
          <Text style={styles.brand}>
            Makit<Text style={styles.brandPlus}>+</Text>
          </Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          Le marché vient à vous
        </Animated.Text>
      </View>

      {/* Bottom — progress bar */}
      <View style={styles.bottom}>
        <View style={styles.barTrack}>
          <Animated.View style={[styles.barFill, { width: barWidth }]} />
        </View>
        <Text style={styles.version}>v1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0C1F0C",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "web" ? 60 : 80,
    paddingBottom: Platform.OS === "web" ? 44 : 60,
  },

  topGlow: {
    position: "absolute",
    top: -120,
    left: "50%",
    marginLeft: -150,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#2E7D32",
    opacity: 0.18,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },

  logoWrap: {
    marginBottom: 8,
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  logoCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(78,160,78,0.4)",
  },
  logo: {
    width: 110,
    height: 110,
  },

  brand: {
    fontSize: 52,
    fontWeight: "800",
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    letterSpacing: -1.5,
  },
  brandPlus: {
    color: "#4CAF50",
    fontSize: 46,
  },

  tagline: {
    fontSize: 15,
    color: "rgba(255,255,255,0.45)",
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.5,
  },

  bottom: {
    alignItems: "center",
    gap: 14,
    width: "100%",
    paddingHorizontal: 32,
  },
  barTrack: {
    width: "100%",
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  barFill: {
    height: 3,
    borderRadius: 2,
    backgroundColor: "#4CAF50",
  },
  version: {
    fontSize: 11,
    color: "rgba(255,255,255,0.2)",
    fontFamily: "Inter_400Regular",
    letterSpacing: 1.5,
  },
});
