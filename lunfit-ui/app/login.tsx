import { Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../src/lib/auth';
import { alpha, colors, fonts, fontSize, radius, spacing } from '../src/theme';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { createAccount, signIn, isLoading, error } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const isSignUp = mode === 'signup';

  async function onSubmit() {
    try {
      if (isSignUp) {
        await createAccount(email, password);
      } else {
        await signIn(email, password);
      }
    } catch {
      // surfaced via `error` from the auth context
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing[16], paddingBottom: insets.bottom + spacing[10] },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brand}>
          <Text style={styles.wordmark}>LUNFIT</Text>
          <Text style={styles.tagline}>Run further. Train smarter.</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.formHeader}>
            <Text style={styles.heading}>{isSignUp ? 'Create account' : 'Welcome back'}</Text>
            <Text style={styles.subheading}>
              {isSignUp
                ? 'Start your AI-coached running journey.'
                : 'Sign in to continue your training.'}
            </Text>
          </View>

          {isSignUp ? (
            <Field label="Name">
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Marcus Reid"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="words"
                autoComplete="name"
              />
            </Field>
          ) : null}

          <Field label="Email">
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              inputMode="email"
            />
          </Field>

          <Field label="Password">
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                style={styles.eyeButton}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff size={18} color={colors.mutedForeground} />
                ) : (
                  <Eye size={18} color={colors.mutedForeground} />
                )}
              </Pressable>
            </View>
          </Field>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            onPress={onSubmit}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.submit,
              (pressed || isLoading) && styles.submitPressed,
            ]}
            accessibilityRole="button"
          >
            {isLoading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={styles.submitLabel}>{isSignUp ? 'Create account' : 'Sign in'}</Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => setMode(isSignUp ? 'signin' : 'signup')}
            accessibilityRole="button"
            style={styles.switchMode}
          >
            <Text style={styles.switchModeLabel}>
              {isSignUp ? 'Already have an account? Sign in' : "No account? Create one"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing[6],
    gap: spacing[12],
  },
  brand: {
    gap: spacing[2],
  },
  wordmark: {
    fontFamily: fonts.display.extrabold,
    fontSize: fontSize['5xl'],
    color: colors.primary,
    letterSpacing: 2,
  },
  tagline: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
  },
  form: {
    gap: spacing[4],
  },
  formHeader: {
    gap: spacing[1],
    marginBottom: spacing[2],
  },
  heading: {
    fontFamily: fonts.display.bold,
    fontSize: fontSize['3xl'],
    color: colors.foreground,
  },
  subheading: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
  },
  field: {
    gap: spacing[2],
  },
  label: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.sm,
    color: colors.foreground,
  },
  input: {
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontFamily: fonts.body.regular,
    fontSize: fontSize.base,
    color: colors.foreground,
  },
  passwordRow: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: spacing[12],
  },
  eyeButton: {
    position: 'absolute',
    right: spacing[4],
    padding: spacing[1],
  },
  error: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    color: colors.destructive,
    backgroundColor: alpha(colors.destructive, 0.1),
    borderWidth: 1,
    borderColor: alpha(colors.destructive, 0.2),
    borderRadius: radius.md,
    padding: spacing[3],
  },
  submit: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[2],
  },
  submitPressed: {
    opacity: 0.85,
  },
  submitLabel: {
    fontFamily: fonts.body.semibold,
    fontSize: fontSize.base,
    color: colors.primaryForeground,
  },
  switchMode: {
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  switchModeLabel: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
  },
});
