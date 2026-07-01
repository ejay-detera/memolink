import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <NativeTabs
      backgroundColor={colors.backgroundElement}
      indicatorColor={colors.primary}
      labelStyle={{ selected: { color: colors.primary } }}>
      
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon>
          <SymbolView name="house.fill" tintColor={colors.primary} />
        </NativeTabs.Trigger.Icon>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="assistant">
        <NativeTabs.Trigger.Label>Assistant</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon>
          <SymbolView name="waveform.circle.fill" tintColor={colors.primary} />
        </NativeTabs.Trigger.Icon>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="medications">
        <NativeTabs.Trigger.Label>Meds</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon>
          <SymbolView name="pill.fill" tintColor={colors.primary} />
        </NativeTabs.Trigger.Icon>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="vault">
        <NativeTabs.Trigger.Label>Vault</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon>
          <SymbolView name="photo.on.rectangle.fill" tintColor={colors.primary} />
        </NativeTabs.Trigger.Icon>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="caregiver">
        <NativeTabs.Trigger.Label>Caregiver</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon>
          <SymbolView name="person.2.fill" tintColor={colors.primary} />
        </NativeTabs.Trigger.Icon>
      </NativeTabs.Trigger>

    </NativeTabs>
  );
}
