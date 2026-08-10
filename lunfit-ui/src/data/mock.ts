/**
 * Fixture data lifted verbatim from the Figma Make prototype so the screens
 * render before workout-service exposes any endpoints. Swap these for the
 * `src/api` client once the backend controllers land.
 */
import type { DailyMiles, Goal, Message, MonthlyMiles, Run } from './types';

export const weeklyData: DailyMiles[] = [
  { day: 'Mon', miles: 4.2, pace: 8.5 },
  { day: 'Tue', miles: 0, pace: 0 },
  { day: 'Wed', miles: 6.8, pace: 8.1 },
  { day: 'Thu', miles: 3.5, pace: 8.8 },
  { day: 'Fri', miles: 0, pace: 0 },
  { day: 'Sat', miles: 10.3, pace: 8.3 },
  { day: 'Sun', miles: 5.1, pace: 8.0 },
];

export const recentRuns: Run[] = [
  { id: 1, date: 'Aug 3', name: 'Easy Recovery Run', miles: 5.1, pace: '8:02', time: '40:54', type: 'easy' },
  { id: 2, date: 'Aug 1', name: 'Long Run', miles: 10.3, pace: '8:19', time: '1:25:41', type: 'long' },
  { id: 3, date: 'Jul 30', name: 'Tempo Intervals', miles: 3.5, pace: '8:48', time: '30:48', type: 'tempo' },
  { id: 4, date: 'Jul 28', name: 'Mid-Week Base', miles: 6.8, pace: '8:06', time: '55:04', type: 'base' },
];

export const goals: Goal[] = [
  { id: 1, title: 'Half Marathon Sub-1:50', progress: 68, deadline: 'Oct 12, 2026', unit: '%' },
  { id: 2, title: 'Weekly 30 Miles', progress: 85, deadline: 'This Week', unit: '%' },
  { id: 3, title: '30-Day Streak', progress: 14, total: 30, deadline: 'Sep 4, 2026', unit: 'days' },
];

export const monthlyMileage: MonthlyMiles[] = [
  { month: 'Mar', miles: 62 },
  { month: 'Apr', miles: 78 },
  { month: 'May', miles: 91 },
  { month: 'Jun', miles: 105 },
  { month: 'Jul', miles: 118 },
  { month: 'Aug', miles: 29 },
];

export const initialMessages: Message[] = [
  {
    role: 'coach',
    text: "Hey Marcus! I've analyzed your last 4 weeks of training. Your aerobic base is building nicely — 118 miles in July is your biggest month yet. Ready to talk about your half marathon plan?",
    ts: '9:02 AM',
  },
  {
    role: 'user',
    text: "Yeah! I'm targeting sub-1:50 at Chicago in October. Am I on track?",
    ts: '9:04 AM',
  },
  {
    role: 'coach',
    text: "Based on your recent tempo pace of 8:48/mi and long run data, you're projecting around 1:53-1:55 right now. Totally reachable to close that gap in 10 weeks. I'd recommend adding one quality session per week — 6×800m at 7:30/mi pace — starting this Wednesday. Your recovery metrics look solid enough to handle it.",
    ts: '9:04 AM',
  },
];

/** Canned replies the prototype cycles through; replaced by a real LLM call later. */
export const coachResponses: string[] = [
  "Great question! Based on your recent training load, I'd recommend keeping tomorrow's run at an easy effort — HR below 140 BPM. Your body is still absorbing last Saturday's long run.",
  "Looking at your pace data, you've improved 12 seconds per mile on your easy runs since June. That's a strong aerobic adaptation signal — you're building real fitness.",
  'For your nutrition timing: try consuming 30-40g of carbs 45 minutes before runs over 7 miles. Your data shows pace drops on long runs after mile 8 — fueling earlier could help.',
  "Your rest days are actually working. The jump from 91 to 118 miles happened because you protected your recovery. Don't let motivation push you to run on rest days.",
  "I'd suggest a 10% mileage taper two weeks before your race. Based on your October 12 goal, that means your last big week should be September 21.",
];
