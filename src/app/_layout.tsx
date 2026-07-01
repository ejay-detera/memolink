import { DefaultTheme, ThemeProvider, Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { View, Platform } from 'react-native';
import { useFonts, AtkinsonHyperlegible_400Regular, AtkinsonHyperlegible_700Bold } from '@expo-google-fonts/atkinson-hyperlegible';
import * as NavigationBar from 'expo-navigation-bar';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider } from '@/providers/auth-provider';
import { useAuth } from '@/hooks/use-auth';
import { Colors } from '@/constants/theme';

if (Platform.OS === 'android') {
  NavigationBar.setVisibilityAsync('hidden');
}

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isLoading } = useAuth();
  
  return (
    <View style={{ flex: 1 }}>
      <Slot />
      {isLoading && <AnimatedSplashOverlay />}
    </View>
  );
}

// Customize React Navigation's default theme to match our pure white background
const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.light.background,
    card: Colors.light.backgroundElement,
    text: Colors.light.text,
    border: Colors.light.outline,
    primary: Colors.light.primary,
  },
};

export default function TabLayout() {
  const [fontsLoaded, error] = useFonts({
    'AtkinsonHyperlegibleNext-Regular': AtkinsonHyperlegible_400Regular,
    'AtkinsonHyperlegibleNext-Bold': AtkinsonHyperlegible_700Bold,
  });

  if (!fontsLoaded && !error) {
    return null;
  }

  return (
    <ThemeProvider value={LightTheme}>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ThemeProvider>
  );
}
