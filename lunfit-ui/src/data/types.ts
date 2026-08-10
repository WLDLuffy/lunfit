import type { RunType } from '../theme';

export type Run = {
  id: number;
  /** Short display date, e.g. "Aug 3". Server records will carry an ISO date instead. */
  date: string;
  name: string;
  miles: number;
  /** Formatted mm:ss per mile, e.g. "8:02". */
  pace: string;
  /** Formatted elapsed time, e.g. "40:54" or "1:25:41". */
  time: string;
  type: RunType;
};

export type DailyMiles = { day: string; miles: number; pace: number };

export type MonthlyMiles = { month: string; miles: number };

export type Goal = {
  id: number;
  title: string;
  progress: number;
  /** Present only for count-based goals; percent goals leave it undefined. */
  total?: number;
  deadline: string;
  unit: '%' | 'days';
};

export type Message = {
  role: 'user' | 'coach';
  text: string;
  ts: string;
};
