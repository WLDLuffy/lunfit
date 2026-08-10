import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors, fonts, fontSize, radius, spacing } from '../theme';

/** `bg-card border border-border rounded-lg` from the prototype. */
export function Card({ style, children }: { style?: ViewStyle; children: React.ReactNode }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Small uppercase mono heading used above each card section. */
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing[4],
    gap: spacing[3],
  },
  sectionLabel: {
    fontFamily: fonts.mono.medium,
    fontSize: fontSize.xs - 1,
    color: colors.mutedForeground,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
