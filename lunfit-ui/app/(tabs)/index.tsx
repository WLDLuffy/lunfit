import { Screen } from '../../src/components/Screen';
import { Pending } from '../../src/components/Pending';

export default function DashboardScreen() {
  return (
    <Screen title="Dashboard" subtitle="Week of Aug 3, 2026">
      <Pending
        view="Dashboard"
        notes={[
          'StatCard row — weekly miles, avg pace, streak, HR',
          'Weekly mileage area chart (recharts <AreaChart> → RN equivalent)',
          'Monthly mileage bar chart',
          'Recent activity preview list',
        ]}
      />
    </Screen>
  );
}
