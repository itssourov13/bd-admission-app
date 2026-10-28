import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/theme";

/** A lightweight, app-specific mark. This intentionally does not reuse ScholarHub branding artwork. */
export function Logo({ size = 48 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size }}>
      <LinearGradient
        colors={[colors.teal500, colors.teal800]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ width: size, height: size, borderRadius: size * 0.28, alignItems: "center", justifyContent: "center" }}
      >
        <Ionicons name="school" size={size * 0.56} color={colors.white} />
      </LinearGradient>
    </View>
  );
}
