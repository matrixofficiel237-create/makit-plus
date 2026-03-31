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
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";

const { width, height } = Dimensions.get("window");
const ND = false; // useNativeDriver — disabled for web compatibility

export default function SplashScreen() {
  const { user, isLoading } = useAuth();

  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const ring1Scale = useRef(new Animated.Value(0.5)).current;
  const ring1Opacity = useRef(new Animated.Value(0)).current;
  const ring2Scale = useRef(new Animated.Value(0.5)).current;
  const ring2Opacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslate = useRef(new Animated.Value(30)).current;
  const dot1 = useRef(new Animated.Value(0.25)).current;
  const dot2 = useRef(new Animated.Value(0.25)).current;
  const dot3 = useRef(new Animated.Value(0.25)).current;
  const blobOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Blobs fade in
    Animated.timing(blobOpacity, { toValue: 1, duration: 1000, useNativeDriver: ND }).start();

    // Logo entrance
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, tension: 55, friction: 8, useNativeDriver: ND }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: ND }),
    ]).start();

    // Pulsing ring after logo
    setTimeout(() => {
      const pulseRing = (scale: Animated.Value, opacity: Animated.Value, delay: number) =>
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(scale, { toValue: 1.5, duration: 800, useNativeDriver: ND }),
            Animated.timing(opacity, { toValue: 0.55, duration: 300, useNativeDriver: ND }),
          ]),
          Animated.parallel([
            Animated.timing(scale, { toValue: 2.1, duration: 700, useNativeDriver: ND }),
            Animated.timing(opacity, { toValue: 0, duration: 700, useNativeDriver: ND }),
          ]),
        ]);
      Animated.parallel([
        pulseRing(ring1Scale, ring1Opacity, 0),
        pulseRing(ring2Scale, ring2Opacity, 280),
      ]).start();
    }, 200);

    // Text slides up
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 700, useNativeDriver: ND }),
        Animated.spring(textTranslate, { toValue: 0, tension: 70, friction: 10, useNativeDriver: ND }),
      ]).start();
    }, 450);

    // Loading dots bounce loop
    const bounceDot = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 320, useNativeDriver: ND }),
          Animated.timing(dot, { toValue: 0.25, duration: 320, useNativeDriver: ND }),
          Animated.delay(650),
        ])
      );
    Animated.parallel([
      bounceDot(dot1, 0),
      bounceDot(dot2, 220),
      bounceDot(dot3, 440),
    ]).start();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        if (user) {
          if (user.role === "livreur") router.replace("/(livreur)/orders");
          else if (user.role === "admin") router.replace("/(admin)/dashboard");
          else if (user.role === "sous_admin") router.replace("/(sous_admin)/dashboard");
          else router.replace("/(tabs)/home");
        } else {
          router.replace("/(auth)/login");
        }
      }, 2600);
      return () => clearTimeout(timer);
    }
  }, [isLoading, user]);

  return (
    <LinearGradient
      colors={["#1A5C1E", "#266329", "#2E7D32", "#3D9142", "#4CAF50"]}
      locations={[0, 0.2, 0.5, 0.75, 1]}
      style={styles.container}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
    >
      {/* Background decorations */}
      <Animated.View style={[styles.blob1, { opacity: Animated.multiply(blobOpacity, 0.25) }]} />
      <Animated.View style={[styles.blob2, { opacity: Animated.multiply(blobOpacity, 0.18) }]} />
      <Animated.View style={[styles.blob3, { opacity: Animated.multiply(blobOpacity, 0.12) }]} />

      {/* Star dots scattered */}
      <View style={[styles.starDot, { top: height * 0.12, left: width * 0.12 }]} />
      <View style={[styles.starDot, { top: height * 0.22, right: width * 0.15 }]} />
      <View style={[styles.starDot, { top: height * 0.7, left: width * 0.08 }]} />
      <View style={[styles.starDot, { top: height * 0.8, right: width * 0.1 }]} />
      <View style={[styles.starDot, { top: height * 0.55, left: width * 0.82 }]} />

      {/* Center content */}
      <View style={styles.center}>
        {/* Pulsing rings */}
        <Animated.View style={[styles.ring, { transform: [{ scale: ring1Scale }], opacity: ring1Opacity }]} />
        <Animated.View style={[styles.ring, { transform: [{ scale: ring2Scale }], opacity: ring2Opacity }]} />

        {/* Logo */}
        <Animated.View style={[styles.logoOuter, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
          <View style={styles.logoGlow} />
          <View style={styles.logoInner}>
            <Image source={require("@/assets/images/logo.png")} style={styles.logo} resizeMode="cover" />
          </View>
        </Animated.View>

        {/* Brand text */}
        <Animated.View style={[styles.textBlock, { opacity: textOpacity, transform: [{ translateY: textTranslate }] }]}>
          <Text style={styles.brand}>Makit<Text style={styles.brandPlus}>+</Text></Text>
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <View style={styles.dividerDot} />
            <View style={styles.dividerLine} />
          </View>
          <Text style={styles.tagline}>Le marché vient à vous</Text>
          <Text style={styles.sub}>COURSES · LIVRAISON · SIMPLICITÉ</Text>
        </Animated.View>
      </View>

      {/* Bottom */}
      <Animated.View style={[styles.bottom, { opacity: textOpacity }]}>
        <View style={styles.dotsRow}>
          {[dot1, dot2, dot3].map((dot, i) => (
            <Animated.View
              key={i}
              style={[styles.dot, { opacity: dot, transform: [{ scaleY: dot }] }]}
            />
          ))}
        </View>
        <Text style={styles.version}>Makit+ · v1.0.0</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const LOGO_SIZE = 124;
const RING_SIZE = LOGO_SIZE + 16;

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "space-between", paddingTop: Platform.OS === "web" ? 60 : 80, paddingBottom: Platform.OS === "web" ? 40 : 56 },

  // Blobs
  blob1: { position: "absolute", top: -100, right: -90, width: 340, height: 340, borderRadius: 170, backgroundColor: "#ffffff" },
  blob2: { position: "absolute", bottom: -80, left: -110, width: 300, height: 300, borderRadius: 150, backgroundColor: "#ffffff" },
  blob3: { position: "absolute", top: "45%", right: -50, width: 160, height: 160, borderRadius: 80, backgroundColor: "#ffffff" },

  // Star dots
  starDot: { position: "absolute", width: 4, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.4)" },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 36 },

  // Rings
  ring: {
    position: "absolute",
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.6)",
  },

  // Logo
  logoOuter: {
    width: LOGO_SIZE + 24,
    height: LOGO_SIZE + 24,
    borderRadius: (LOGO_SIZE + 24) / 2,
    alignItems: "center",
    justifyContent: "center",
    ...(Platform.OS !== "web" ? {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.45,
      shadowRadius: 28,
      elevation: 24,
    } : {}),
  },
  logoGlow: {
    position: "absolute",
    width: LOGO_SIZE + 24,
    height: LOGO_SIZE + 24,
    borderRadius: (LOGO_SIZE + 24) / 2,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.4)",
  },
  logoInner: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
    backgroundColor: "#ffffff",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { width: LOGO_SIZE, height: LOGO_SIZE },

  // Text
  textBlock: { alignItems: "center", gap: 10 },
  brand: { fontSize: 56, fontWeight: "700", color: "#FFFFFF", fontFamily: "Inter_700Bold", letterSpacing: -2 },
  brandPlus: { color: "rgba(255,255,255,0.75)", fontSize: 48 },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dividerLine: { width: 36, height: 1.5, backgroundColor: "rgba(255,255,255,0.35)", borderRadius: 1 },
  dividerDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: "rgba(255,255,255,0.5)" },
  tagline: { fontSize: 17, color: "rgba(255,255,255,0.90)", fontFamily: "Inter_500Medium", letterSpacing: 0.3 },
  sub: { fontSize: 10, color: "rgba(255,255,255,0.45)", fontFamily: "Inter_400Regular", letterSpacing: 2.5 },

  // Bottom
  bottom: { alignItems: "center", gap: 12 },
  dotsRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: "rgba(255,255,255,0.7)" },
  version: { fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "Inter_400Regular", letterSpacing: 1.5 },
});
