import { Screen } from '../../src/components/Screen';
import { Pending } from '../../src/components/Pending';

export default function GoalsScreen() {
  return (
    <Screen title="Goals" subtitle="3 active">
      <Pending
        view="Goals"
        notes={[
          'Goal cards with progress bars (percent and day-count units)',
          'Deadline / remaining-time line',
          'Add-goal affordance',
        ]}
      />
    </Screen>
  );
}
