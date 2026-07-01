import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * A custom hook to calculate the safe bottom padding needed for screens.
 * 
 * When a screen renders underneath the custom floating tab bar (`CaregiverTabBar` or `SeniorTabBar`),
 * we need to add enough bottom padding so that:
 * 1. The last item in a ScrollView/FlatList can scroll above the tab bar.
 * 2. Absolutely positioned Floating Action Buttons (FABs) don't get hidden behind it.
 *
 * @param hasTabBar Whether the current screen has the floating tab bar overlay.
 *                  Pass `true` for root tabs (default). Pass `false` for screens pushed onto the stack.
 */
export function useBottomSpace(hasTabBar: boolean = true) {
  const insets = useSafeAreaInsets();
  
  // The custom floating tab bar has:
  // - bottom: insets.bottom + 24
  // - height: ~64 (minHeight 48 + padding 16)
  // - gap: 16
  // Total safe offset needed = insets.bottom + 24 + 64 + 16 = insets.bottom + 104
  const TAB_BAR_OFFSET = 104; 
  
  if (hasTabBar) {
    return (insets.bottom || 16) + TAB_BAR_OFFSET;
  }
  
  // For screens without the tab bar, just return safe area + standard padding
  return (insets.bottom || 16) + 24; 
}
