import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useT } from "@/i18n";
import { colors } from "@/theme";

type IconName = keyof typeof Ionicons.glyphMap;

const tabIcons: Record<string, IconName> = {
  index: "home-outline",
  varsity: "school-outline",
  medical: "medkit-outline",
  profile: "person-outline"
};

export default function TabsLayout() {
  const t = useT();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.teal700,
        tabBarInactiveTintColor: colors.ink500,
        tabBarLabelStyle: { fontFamily: "HindSiliguri_500Medium", fontSize: 11, marginTop: 1 },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.sand200,
          height: 64,
          paddingTop: 6,
          paddingBottom: 7
        },
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons
            name={focused ? tabIcons[route.name].replace("-outline", "") as IconName : tabIcons[route.name]}
            color={color}
            size={size}
          />
        )
      })}
    >
      <Tabs.Screen name="index" options={{ title: t("tab.home") }} />
      <Tabs.Screen name="varsity" options={{ title: t("tab.varsity") }} />
      <Tabs.Screen name="medical" options={{ title: t("tab.medical") }} />
      <Tabs.Screen name="profile" options={{ title: t("tab.profile") }} />
    </Tabs>
  );
}
