import React, { useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import Colors from "@/constants/colors";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

type Step = "phone" | "newpass" | "done";

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const [step, setStep] = useState<Step>("phone");
  const [telephone, setTelephone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  function handleNext() {
    setError("");
    if (!telephone.trim()) {
      setError("Veuillez saisir votre numéro de téléphone");
      return;
    }
    setStep("newpass");
  }

  async function handleReset() {
    setError("");
    if (!newPassword.trim()) {
      setError("Veuillez saisir un nouveau mot de passe");
      return;
    }
    if (newPassword.length < 4) {
      setError("Le mot de passe doit contenir au moins 4 caractères");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    setLoading(true);
    const result = await resetPassword(telephone.trim(), newPassword.trim());
    setLoading(false);
    if (result.ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep("done");
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(result.error || "Erreur réseau, réessayez.");
    }
  }

  if (step === "done") {
    return (
      <View style={styles.doneContainer}>
        <View style={styles.doneIcon}>
          <Feather name="check-circle" size={64} color={Colors.primary} />
        </View>
        <Text style={styles.title}>Mot de passe mis à jour !</Text>
        <Text style={styles.subtitle}>
          Votre nouveau mot de passe a bien été enregistré. Vous pouvez maintenant vous connecter.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.replace("/(auth)/login")}>
          <Feather name="log-in" size={18} color={Colors.white} />
          <Text style={styles.btnText}>Se connecter</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.background }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        <TouchableOpacity
          onPress={() => step === "newpass" ? setStep("phone") : router.back()}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>

        {/* Step indicators */}
        <View style={styles.steps}>
          {[1, 2].map((n) => (
            <View key={n} style={styles.stepItem}>
              <View style={[styles.stepDot, (step === "phone" ? 1 : 2) >= n && styles.stepDotActive]}>
                <Text style={[styles.stepNum, (step === "phone" ? 1 : 2) >= n && styles.stepNumActive]}>{n}</Text>
              </View>
              {n < 2 && <View style={[styles.stepLine, step === "newpass" && styles.stepLineActive]} />}
            </View>
          ))}
        </View>

        <View style={styles.iconWrap}>
          <Feather name={step === "phone" ? "phone" : "lock"} size={48} color={Colors.primary} />
        </View>

        {step === "phone" && (
          <>
            <Text style={styles.title}>Mot de passe oublié</Text>
            <Text style={styles.subtitle}>Saisissez le numéro de téléphone associé à votre compte.</Text>

            {error ? <View style={styles.errBox}><Text style={styles.errText}>{error}</Text></View> : null}

            <View style={styles.field}>
              <Text style={styles.label}>Numéro de téléphone</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 0612345678"
                placeholderTextColor={Colors.gray}
                value={telephone}
                onChangeText={setTelephone}
                keyboardType="phone-pad"
                autoFocus
              />
            </View>

            <TouchableOpacity style={styles.btn} onPress={handleNext}>
              <Text style={styles.btnText}>Continuer</Text>
              <Feather name="arrow-right" size={18} color={Colors.white} />
            </TouchableOpacity>
          </>
        )}

        {step === "newpass" && (
          <>
            <Text style={styles.title}>Nouveau mot de passe</Text>
            <Text style={styles.subtitle}>
              Choisissez un nouveau mot de passe pour{"\n"}
              <Text style={{ color: Colors.primary, fontFamily: "Inter_600SemiBold" }}>{telephone}</Text>
            </Text>

            {error ? <View style={styles.errBox}><Text style={styles.errText}>{error}</Text></View> : null}

            <View style={styles.field}>
              <Text style={styles.label}>Nouveau mot de passe</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, { flex: 1, borderWidth: 0 }]}
                  placeholder="Minimum 4 caractères"
                  placeholderTextColor={Colors.gray}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPass}
                  autoFocus
                />
                <TouchableOpacity onPress={() => setShowPass((v) => !v)} style={styles.eyeBtn}>
                  <Feather name={showPass ? "eye-off" : "eye"} size={20} color={Colors.gray} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Confirmer le mot de passe</Text>
              <TextInput
                style={styles.input}
                placeholder="Répétez le mot de passe"
                placeholderTextColor={Colors.gray}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPass}
              />
            </View>

            <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleReset} disabled={loading}>
              {loading ? <ActivityIndicator color={Colors.white} /> : (
                <>
                  <Feather name="check" size={18} color={Colors.white} />
                  <Text style={styles.btnText}>Enregistrer le mot de passe</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Retour à la connexion</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40, backgroundColor: Colors.background, gap: 16 },
  doneContainer: { flex: 1, paddingHorizontal: 32, backgroundColor: Colors.background, alignItems: "center", justifyContent: "center", gap: 16 },
  backBtn: { alignSelf: "flex-start" },
  steps: { flexDirection: "row", alignItems: "center", alignSelf: "center", gap: 0 },
  stepItem: { flexDirection: "row", alignItems: "center" },
  stepDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.border, alignItems: "center", justifyContent: "center" },
  stepDotActive: { backgroundColor: Colors.primary },
  stepNum: { fontSize: 14, fontWeight: "700", color: Colors.gray, fontFamily: "Inter_700Bold" },
  stepNumActive: { color: Colors.white },
  stepLine: { width: 40, height: 2, backgroundColor: Colors.border, marginHorizontal: 4 },
  stepLineActive: { backgroundColor: Colors.primary },
  iconWrap: { width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.primaryLighter, alignItems: "center", justifyContent: "center", alignSelf: "center" },
  doneIcon: { width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.primaryLighter, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  title: { fontSize: 24, fontWeight: "700", color: Colors.text, fontFamily: "Inter_700Bold", textAlign: "center" },
  subtitle: { fontSize: 14, color: Colors.textLight, textAlign: "center", fontFamily: "Inter_400Regular", lineHeight: 22 },
  errBox: { backgroundColor: "#FFEBEE", borderLeftWidth: 3, borderLeftColor: Colors.red, padding: 12, borderRadius: 10 },
  errText: { fontSize: 14, color: Colors.red, fontFamily: "Inter_400Regular" },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: "600", color: Colors.text, fontFamily: "Inter_600SemiBold" },
  input: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: Colors.text, fontFamily: "Inter_400Regular" },
  inputRow: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingRight: 12 },
  eyeBtn: { padding: 4 },
  btn: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: Colors.white, fontSize: 17, fontWeight: "700", fontFamily: "Inter_700Bold" },
  backLink: { alignItems: "center", marginTop: 4 },
  backLinkText: { color: Colors.primary, fontSize: 14, fontFamily: "Inter_500Medium" },
});
