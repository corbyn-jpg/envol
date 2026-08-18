import { useState } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  type TextInputProps,
} from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Fonts } from "@/constants/theme";

// A password field with a show/hide toggle. Takes the same props as TextInput so
// it drops in wherever a plain secureTextEntry input already was. The border sits
// on the wrapper rather than the input, so the icon lives inside the field.
export function PasswordInput({ style, ...rest }: TextInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrapper}>
      <TextInput
        {...rest}
        style={[styles.input, style]}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor={Colors.text + "80"}
      />

      <TouchableOpacity
        style={styles.toggle}
        onPress={() => setVisible(!visible)}
        accessibilityRole="button"
        accessibilityLabel={visible ? "Hide password" : "Show password"}
      >
        <IconSymbol
          name={visible ? "eye.slash" : "eye"}
          size={20}
          color={Colors.text}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    fontFamily: Fonts.body,
    color: Colors.text,
  },
  toggle: {
    padding: 12,
  },
});
