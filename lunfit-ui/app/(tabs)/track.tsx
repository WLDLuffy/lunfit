import { Screen } from '../../src/components/Screen';
import { Pending } from '../../src/components/Pending';

export default function TrackScreen() {
  return (
    <Screen title="Track" subtitle="Ready to run">
      <Pending
        view="LiveRun"
        notes={[
          'Map canvas — prototype fakes it with inline SVG; needs a real map',
          'useRunTimer + formatTime elapsed clock',
          'Play / pause / stop controls',
          'Live distance, pace and HR readouts',
        ]}
      />
    </Screen>
  );
}
