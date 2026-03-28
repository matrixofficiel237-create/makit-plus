import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import Colors from "@/constants/colors";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

export default function ForgotPasswordScreen() {
  const [telephone, setTelephone] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const { forgotPassword } = useAuth();

  async function handleReset() {
    if (!telephone) {
      setIsError(true);
      setMessage("Veuillez saisir votre numéro de téléphone");
      return;
    }
    setLoading(true);
    const found = await forgotPassword(telephone);
    setLoading(false);
    if (found) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsError(false);
      setMessage("Un SMS de réinitialisation vous sera envoyé prochainement.");
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setIsError(true);
      setMessage("Aucun compte associé à ce numéro.");
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.iconContainer}>
          <Feather name="lock" size={48} color={Colors.primary} />
        </View>

        <Text style={styles.title}>Mot de passe oublié</Text>
        <Text style={styles.subtitle}>
          Entrez votre numéro de téléphone pour récupérer votre compte
        </Text>

        {message ? (
          <View style={[styles.msgBox, isError ? styles.msgError : styles.msgSuccess]}>
            <Text style={[styles.msgText, { color: isError ? Colors.red : Colors.primaryDark }]}>
              {message}
            </Text>
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
            keyboardType="phone-pad"
          />
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleReset}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.btnText}>Récupérer mon compte</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Retour à la connexion</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    backgroundColor: Colors.background,
    gap: 16,
  },
  backBtn: {
    alignSelf: "flex-start",
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primaryLighter,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginVertical: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
  },
  msgBox: {
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 3,
  },
  msgError: {
    backgroundColor: "#FFEBEE",
    borderLeftColor: Colors.red,
  },
  msgSuccess: {
    backgroundColor: Colors.primaryLighter,
    borderLeftColor: Colors.primary,
  },
  msgText: {
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
  btn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  backLink: {
    alignItems: "center",
  },
  backLinkText: {
    color: Colors.primary,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
