export interface Exercise {
  id: string;
  name: string;
  muscle: string;
  equipment: string;
  videoUrl: string;
  thumbnail: string;
  tips: string;
  suggestedSets: number;
  suggestedReps: string;
  suggestedRestSeconds: number;
  defaultWeight: number;
}

export interface DaySession {
  dayNumber: number;
  title: string;
  focus: string;
  estimatedDuration: string;
  exercises: Exercise[];
}

export interface WeekPlan {
  weekNumber: number;
  title: string;
  days: DaySession[];
}

export interface Program {
  id: string;
  title: string;
  category: string;
  durationWeeks: number;
  frequency: string;
  level: string;
  image: string;
  shortDescription: string;
  tags: string[];
  sessionsCount: number;
  weeks: WeekPlan[];
}

export interface TrainerStat {
  value: string;
  label: string;
}

export interface GymDetails {
  address: string;
  hours: string;
  whatsapp: string;
  instagram: string;
  amenities: string[];
}

export interface TrainerInfo {
  name: string;
  role: string;
  gymName: string;
  tagline: string;
  subheadline: string;
  bio: string;
  stats: TrainerStat[];
  gymDetails: GymDetails;
}

export interface AppFeature {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface Testimonial {
  name: string;
  role: string;
  rating: number;
  quote: string;
  avatar: string;
}

export interface Transformation {
  name: string;
  result: string;
  duration: string;
  image: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  type: string;
  price: string;
  period: string;
  subtitle: string;
  badge?: string;
  isPopular: boolean;
  features: string[];
  ctaText: string;
}

export interface PersonalRecord {
  exercise: string;
  weight: string;
  date: string;
}

export interface UserState {
  name: string;
  avatar: string;
  streakDays: number;
  workoutsCompletedThisMonth: number;
  activeProgramId: string;
  currentWeek: number;
  currentDay: number;
  recentPRs: PersonalRecord[];
}

export interface SetLog {
  setNumber: number;
  weight: number | string;
  reps: number | string;
  completed: boolean;
}

export interface WorkoutSummary {
  sessionTitle: string;
  totalKg: number;
  completedSetsCount: number;
  logs: Record<string, SetLog[]>;
}
