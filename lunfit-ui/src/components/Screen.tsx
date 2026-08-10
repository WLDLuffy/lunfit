import { useRouter } from 'expo-router';
import { User } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { alpha, colors, fonts, fontSize, radius, spacing } from '../theme';

type ScreenProps = {
  title: string;
  subtitle?: string;
  /** Shows the avatar button that opens the profile modal. */
  showProfile?: boolean;
  /** Set for full-bleed screens like Track, which draw their own map canvas. */
  scroll?: boolean;
  children?: React.ReactNode;
};

/**
 * The chrome shared by every tab: a dark header band over a scrolling body,
 * matching the prototype's `bg-[#0e0e16] border-b border-border` header.
 */
export function Screen({ title, subtitle, showProfile = true, scroll = true, children }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const body = <View style={styles.body}>{children}</View>;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing[4] }]}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {showProfile ? (
          <Pressable
            onPress={() => router.push('/profile')}
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            style={styles.avatar}
          >
            <User size={18} color={colors.primary} />
          </Pressable>
        ) : null}
      </View>

      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {body}
        </ScrollView>
      ) : (
        body
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[4],
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[6],
    backgroundColor: colors.chrome,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: {
    flex: 1,
    gap: spacing[1],
  },
  title: {
    fontFamily: fonts.display.bold,
    fontSize: fontSize['3xl'],
    color: colors.foreground,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(colors.primary, 0.1),
    borderWidth: 1,
    borderColor: alpha(colors.primary, 0.3),
  },
  scrollContent: {
    paddingBottom: spacing[10],
  },
  body: {
    flex: 1,
    padding: spacing[6],
    gap: spacing[4],
  },
});
