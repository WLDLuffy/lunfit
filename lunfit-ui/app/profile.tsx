import { useRouter } from 'expo-router';
import { LogOut, X } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Pending } from '../src/components/Pending';
import { useAuth } from '../src/lib/auth';
import { alpha, colors, fonts, fontSize, radius, spacing } from '../src/theme';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut } = useAuth();

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing[4] }]}>
        <Text style={styles.title}>Profile</Text>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Close profile"
          style={styles.close}
        >
          <X size={20} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pending
          view="Profile"
          notes={[
            'Avatar, name and lifetime stats header',
            'Achievement / award row',
            'Settings rows — notifications, privacy, connected devices, edit profile',
          ]}
        />

        <Pressable
          onPress={async () => {
            await signOut();
            // The auth gate redirects to /login; dismiss the modal so it isn't
            // left sitting over the login screen.
            router.dismissAll();
          }}
          style={({ pressed }) => [styles.signOut, pressed && styles.signOutPressed]}
          accessibilityRole="button"
        >
          <LogOut size={16} color={colors.destructive} />
          <Text style={styles.signOutLabel}>Sign out</Text>
        </Pressable>
      </ScrollView>
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
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[6],
    backgroundColor: colors.chrome,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontFamily: fonts.display.bold,
    fontSize: fontSize['3xl'],
    color: colors.foreground,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  close: {
    padding: spacing[2],
  },
  content: {
    padding: spacing[6],
    gap: spacing[4],
  },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: alpha(colors.destructive, 0.3),
    backgroundColor: alpha(colors.destructive, 0.1),
  },
  signOutPressed: {
    opacity: 0.8,
  },
  signOutLabel: {
    fontFamily: fonts.body.semibold,
    fontSize: fontSize.sm,
    color: colors.destructive,
  },
});
