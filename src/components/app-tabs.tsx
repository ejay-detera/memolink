import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

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
        <NativeTabs.Trigger.Icon 
          sf={{
            default: 'house',
            selected: 'house.fill',
          }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="assistant">
        <NativeTabs.Trigger.Label>Assistant</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon 
          sf={{
            default: 'waveform.circle',
            selected: 'waveform.circle.fill',
          }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="medications">
        <NativeTabs.Trigger.Label>Meds</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon 
          sf={{
            default: 'pill',
            selected: 'pill.fill',
          }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="vault">
        <NativeTabs.Trigger.Label>Vault</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon 
          sf={{
            default: 'photo.on.rectangle',
            selected: 'photo.fill.on.rectangle.fill',
          }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="caregiver">
        <NativeTabs.Trigger.Label>Caregiver</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon 
          sf={{
            default: 'person.2',
            selected: 'person.2.fill',
          }}
        />
      </NativeTabs.Trigger>

    </NativeTabs>
  );
}
