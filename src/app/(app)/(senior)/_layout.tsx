import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useColorScheme } from "react-native";

import { Colors } from "@/constants/theme";

export default function SeniorTabLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];

  return (
    <NativeTabs
      backgroundColor={colors.backgroundElement}
      indicatorColor={colors.primary}
      labelStyle={{ selected: { color: colors.primary } }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="assistant">
        <NativeTabs.Trigger.Label>Assistant</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="waveform.circle.fill" md="assistant" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="medications">
        <NativeTabs.Trigger.Label>Meds</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="pill.fill" md="medication" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="vault">
        <NativeTabs.Trigger.Label>Vault</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="photo.fill.on.rectangle.fill"
          md="photo_library"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
