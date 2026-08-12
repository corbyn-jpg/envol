import { useEffect, useState } from "react";
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
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";

import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-context";
import { db } from "@/lib/firebase";
import { Colors, Fonts, type Season } from "@/constants/theme";

export default function Settings() {
  const { user, logOut } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [nameSaved, setNameSaved] = useState(false);
  const { themePreference, setThemePreference, primary } = useTheme();

  const themeOptions: { label: string; value: "auto" | Season }[] = [
    { label: "Auto (season-based)", value: "auto" },
    { label: "Summer", value: "summer" },
    { label: "Winter", value: "winter" },
    { label: "Autumn", value: "autumn" },
    { label: "Spring", value: "spring" },
  ];

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);

  useEffect(() => {
    if (!user) return;

    (async () => {
      //Create a snapshot of the one document user by their id
      const snapshot = await getDoc(doc(db, "users", user.uid));
      const data = snapshot.data();

      //Set display name to display name (? means if the data is null then don't try to read)
      if (data?.displayName) setDisplayName(data.displayName);
    })();
  }, [user]);

  //Adds display name to the user document
  async function handleSaveDisplayName() {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid), { displayName });
    setNameSaved(true);
  }

  //Handles password change
  async function handlePasswordChange() {
    setPasswordError(null);
    setPasswordSaved(false);

    if (!user || !user.email) return;

    //Ensures the new password is correct
    if (newPassword !== confirmNewPassword) {
      setPasswordError("New passwords don't match");
      return;
    }

    try {
      //Create credential that uses EmailAuthProvider which is a provider for generating EmailAuthCredential
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword,
      );

      //Re-authenticates a user using a fresh credential.
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      setPasswordSaved(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : "Something went wrong",
      );
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
        {/* Display name */}
        <View style={styles.section}>
          <ThemedText type="subtitle">Display Name</ThemedText>
          <ThemedText style={styles.hint}>Shown on the leaderboard</ThemedText>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={(text) => {
              setDisplayName(text);
              setNameSaved(false);
            }}
            placeholder="Your name"
          />
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: primary }]}
            onPress={handleSaveDisplayName}
          >
            <ThemedText style={styles.saveButtonText}>Save Name</ThemedText>
          </TouchableOpacity>
          {nameSaved && (
            <ThemedText style={[styles.savedText, { color: primary }]}>
              Saved!
            </ThemedText>
          )}
        </View>

        {/* Change the theme */}
        <View style={styles.section}>
          <ThemedText type="subtitle">Theme</ThemedText>
          {themeOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.themeOption,
                themePreference === option.value && {
                  backgroundColor: primary,
                  borderColor: primary,
                  
                },
              ]}
              onPress={() => setThemePreference(option.value)}
            >
              <ThemedText
                style={themePreference === option.value && styles.themeOptionTextActive}
              >
                {option.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Change password */}
        <View style={styles.section}>
          <ThemedText type="subtitle">Change Password</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="Current password"
            secureTextEntry
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />
          <TextInput
            style={styles.input}
            placeholder="New password"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm new password"
            secureTextEntry
            value={confirmNewPassword}
            onChangeText={setConfirmNewPassword}
          />
          {passwordError && (
            <ThemedText style={styles.errorText}>{passwordError}</ThemedText>
          )}
          {passwordSaved && (
            <ThemedText style={[styles.savedText, { color: primary }]}>
              Password updated!
            </ThemedText>
          )}
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: primary }]}
            onPress={handlePasswordChange}
          >
            <ThemedText style={styles.saveButtonText}>
              Update Password
            </ThemedText>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logOutButton} onPress={logOut}>
          <ThemedText style={styles.logOutButtonText}>Log Out</ThemedText>
        </TouchableOpacity>
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
    gap: 24,
    marginLeft: 24,
    marginRight: 24,
  },
  section: {
    gap: 8,
    marginBottom: 12,
  },
  hint: {
    fontSize: 12,
    opacity: 0.7,
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
  saveButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveButtonText: {
    color: Colors.background,
    fontFamily: Fonts.bodySemiBold,
  },
  savedText: {},
  errorText: {
    color: "#B00020",
  },
  themeOption: {
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: 8,
    padding: 12,
  },
  themeOptionTextActive: {
    color: '#fff',
  },
  logOutButton: {
    borderWidth: 1.5,
    borderColor: "#B00020",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  logOutButtonText: {
    color: "#B00020",
    fontFamily: Fonts.bodySemiBold,
  },
});