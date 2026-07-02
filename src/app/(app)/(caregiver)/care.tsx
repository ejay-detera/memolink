import { View, StyleSheet, Pressable, ScrollView, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useBottomSpace } from "@/hooks/use-bottom-space";

import { Colors, Spacing, Rounded, MaxContentWidth, Shadows } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function CaregiverPortalPage() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];
  const router = useRouter();
  const bottomSpace = useBottomSpace();

  const gridItems = [
    { id: "1", title: "Daily Routines", icon: "sunny", color: "#FF9800" },
    { id: "2", title: "Medical Appointments", icon: "calendar", color: "#2196F3" },
    { id: "3", title: "Personal Events", icon: "people", color: "#9C27B0" },
    { id: "4", title: "Medication Schedules", icon: "medical", color: "#F44336" },
  ];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.header}>
          <ThemedText style={[styles.title, { color: colors.text }]}>Caregiver Portal</ThemedText>
        </View>
        <ScrollView style={styles.content} contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomSpace + Spacing.five }]}>
          <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>Welcome to the Caregiver Portal.</ThemedText>
          
          <View style={styles.gridContainer}>
            {gridItems.map((item) => (
              <Pressable 
                key={item.id} 
                style={({ pressed }) => [
                  styles.gridItem, 
                  { backgroundColor: colors.backgroundElement },
                  pressed && { opacity: 0.8 }
                ]}
                onPress={() => {
                  if (item.id === "1") {
                    router.push("/routines");
                  } else if (item.id === "2") {
                    router.push("/appointments");
                  } else if (item.id === "3") {
                    router.push("/events");
                  } else if (item.id === "4") {
                    router.push("/medications");
                  }
                }}
              >
                <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                  <Ionicons name={item.icon as any} size={32} color={item.color} />
                </View>
                <ThemedText style={[styles.itemTitle, { color: colors.text }]}>{item.title}</ThemedText>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
  },
  title: {
    fontSize: 32,
    fontFamily: "AtkinsonHyperlegibleNext-Bold",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: Spacing.five,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: Spacing.three,
  },
  gridItem: {
    width: "48%",
    aspectRatio: 1,
    borderRadius: Rounded.lg,
    padding: Spacing.four,
    alignItems: "center",
    justifyContent: "center",
    ...(Shadows.card as any),
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: Rounded.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.three,
  },
  itemTitle: {
    fontSize: 16,
    fontFamily: "AtkinsonHyperlegibleNext-Bold",
    textAlign: "center",
  },
});
