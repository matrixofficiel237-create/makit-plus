import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import Colors from "@/constants/colors";
import * as Haptics from "expo-haptics";

export default function LoginScreen() {
  const [telephone, setTelephone] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();

  async function handleLogin() {
    if (!telephone || !motDePasse) {
      setError("Veuillez remplir tous les champs");
      return;
    }
    setLoading(true);
    setError("");
    const user = await login(telephone, motDePasse);
    setLoading(false);
    if (user) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (user.role === "livreur") {
        router.replace("/(livreur)/orders");
      } else if (user.role === "admin") {
        router.replace("/(admin)/dashboard");
      } else if (user.role === "sous_admin") {
        router.replace("/(sous_admin)/dashboard");
      } else {
        router.replace("/(tabs)/home");
      }
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError("Numéro ou mot de passe incorrect");
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Makit+</Text>
          <Text style={styles.subtitle}>Connectez-vous à votre compte</Text>
        </View>

        <View style={styles.form}>
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={styles.label}>Numéro de téléphone</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 0612345678"
              placeholderTextColor={Colors.gray}
              value={telephone}
              onChangeText={setTelephone}
              keyboardType="default"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Mot de passe</Text>
            <TextInput
              style={styles.input}
              placeholder="Votre mot de passe"
              placeholderTextColor={Colors.gray}
              value={motDePasse}
              onChangeText={setMotDePasse}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            onPress={() => router.push("/(auth)/forgot")}
            style={styles.forgotLink}
          >
            <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.loginBtnText}>Se connecter</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => router.push("/(auth)/register")}
          >
            <Text style={styles.registerText}>
              Pas de compte ?{" "}
              <Text style={styles.registerBold}>Créer un compte</Text>
            </Text>
          </TouchableOpacity>

          {/* Comptes de test */}
          <View style={styles.testAccounts}>
            <Text style={styles.testTitle}>Comptes de démonstration :</Text>
            <Text style={styles.testItem}>🛒 Livreur : 0000000000 / livreur123</Text>
            <Text style={styles.testItem}>⚙️ Admin : admin / admin123</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
    gap: 8,
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.primary,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textLight,
    fontFamily: "Inter_400Regular",
  },
  form: {
    gap: 16,
  },
  errorBox: {
    backgroundColor: "#FFEBEE",
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.red,
  },
  errorText: {
    color: Colors.red,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    fontFamily: "Inter_600SemiBold",
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    fontFamily: "Inter_400Regular",
  },
  forgotLink: {
    alignSelf: "flex-end",
  },
  forgotText: {
    color: Colors.primary,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  loginBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  loginBtnText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  registerLink: {
    alignItems: "center",
    paddingTop: 8,
  },
  registerText: {
    fontSize: 15,
    color: Colors.textLight,
    fontFamily: "Inter_400Regular",
  },
  registerBold: {
    color: Colors.primary,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  testAccounts: {
    backgroundColor: Colors.primaryLighter,
    borderRadius: 12,
    padding: 14,
    gap: 6,
    marginTop: 8,
  },
  testTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primaryDark,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  testItem: {
    fontSize: 12,
    color: Colors.primaryDark,
    fontFamily: "Inter_400Regular",
  },
});
