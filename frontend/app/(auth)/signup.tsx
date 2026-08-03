import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import { OrnateDivider } from "@/components/ornate-divider";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-context";
import { Colors, Fonts } from "@/constants/theme";

export default function SignupScreen() {
  const { signUp } = useAuth();
  const { primary } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSignup() {
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setSubmitting(true);
    //Attempt signup; if Firebase rejects it, catch sets the error message.finally always re-enables the button, whether it succeeded or failed.
    try {
      await signUp(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    //Safe area view adds automatic padding so the content is always visible
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* ScrollView lets the form scroll instead of getting clipped when
            content + keyboard don't fit the screen */}
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedText type="title" style={styles.title}>
            Envol
          </ThemedText>
          <OrnateDivider/>
          <ThemedText style={styles.subtitle}>Sign up to start searching</ThemedText>

          <View style={styles.card}>
            {/*Email input */}
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={Colors.text + "80"}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            {/*Password input */}
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={Colors.text + "80"}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {/*Confirm password input */}
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor={Colors.text + "80"}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            {error && <ThemedText style={styles.error}>{error}</ThemedText>}

            {/*Handles Submit */}
            <TouchableOpacity
              style={[styles.button, { backgroundColor: primary }]}
              onPress={handleSignup}
              disabled={submitting}
            >
              <ThemedText style={styles.buttonText}>
                {submitting ? "Signing up..." : "Sign Up"}
              </ThemedText>
            </TouchableOpacity>
          </View>

          <Link href="/login" style={styles.link}>
            <ThemedText style={[styles.linkText, { color: primary }]}>Have an account? Log In</ThemedText>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 12,
  },
  title: { textAlign: "center" },
  subtitle: { textAlign: "center", marginBottom: 8 },
  card: {
    width: "100%",
    borderWidth: 1.5,
    borderColor: Colors.accent,
    borderRadius: 12,
    padding: 20,
    gap: 12,
    backgroundColor: "#fff",
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: Fonts.body,
    color: Colors.text,
    backgroundColor: "#fff",
  },
  error: { color: "#B00020", fontFamily: Fonts.body },
  button: {
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 4,
  },
  buttonText: { color: Colors.background, fontFamily: Fonts.bodySemiBold },
  link: { marginTop: 4, alignSelf: "center" },
  linkText: {},
});
