import React, { useEffect } from "react";
import { View, Text, StyleSheet, Image, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import Colors from "@/constants/colors";

export default function SplashScreen() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        if (user) {
          if (user.role === "livreur") {
            router.replace("/(livreur)/orders");
          } else {
            router.replace("/(tabs)/home");
          }
        } else {
          router.replace("/(auth)/login");
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, user]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require("@/assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.tagline}>Le marché vient à vous avec Makit+</Text>
      {isLoading && (
        <ActivityIndicator color={Colors.white} size="large" style={styles.loader} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  logoContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  tagline: {
    fontSize: 18,
    color: Colors.white,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    paddingHorizontal: 40,
    opacity: 0.95,
  },
  loader: {
    marginTop: 20,
  },
});
