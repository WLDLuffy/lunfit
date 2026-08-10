import { StyleSheet, Text, View } from 'react-native';

import { Card } from './Card';
import { colors, fonts, fontSize, spacing } from '../theme';

/**
 * Scaffold marker for a screen whose Figma view hasn't been ported yet.
 * Delete each of these as the corresponding view lands.
 */
export function Pending({ view, notes }: { view: string; notes: string[] }) {
  return (
    <Card>
      <Text style={styles.heading}>{view} — not yet ported</Text>
      <View style={styles.list}>
        {notes.map((note) => (
          <Text key={note} style={styles.item}>
            ·  {note}
          </Text>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontFamily: fonts.body.semibold,
    fontSize: fontSize.sm,
    color: colors.foreground,
  },
  list: {
    gap: spacing[2],
  },
  item: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    lineHeight: 18,
  },
});
