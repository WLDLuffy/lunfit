import { Screen } from '../../src/components/Screen';
import { Pending } from '../../src/components/Pending';

export default function RunLogScreen() {
  return (
    <Screen title="Run Log" subtitle="4 runs · 25.7 mi this week">
      <Pending
        view="RunLog"
        notes={[
          'FlatList of runs from src/data/mock.ts',
          'RunTypeBadge — easy / long / tempo / base accents',
          'Per-run miles, pace, elapsed time',
        ]}
      />
    </Screen>
  );
}
