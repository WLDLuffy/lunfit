import { Screen } from '../../src/components/Screen';
import { Pending } from '../../src/components/Pending';

export default function CoachScreen() {
  return (
    <Screen title="AI Coach" subtitle="Trained on your last 4 weeks">
      <Pending
        view="AICoach"
        notes={[
          'Message thread from src/data/mock.ts (initialMessages)',
          'Composer with send button + KeyboardAvoidingView',
          'Canned replies cycle through coachResponses until an LLM is wired up',
        ]}
      />
    </Screen>
  );
}
