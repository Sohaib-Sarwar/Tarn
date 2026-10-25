import type { AgeRange, BodySpot, CheckInStatus, Feeling, GoalKind, GoalMode, RoutineCategory, Trigger, UrgeOutcome, UrgeTool, Want } from './types'

/** Onboarding goal choices. "Both" creates two separate goals; nothing is ever combined automatically. */
export interface GoalChoice {
  id: 'reduce-porn' | 'stop-porn' | 'reduce-m' | 'stop-m' | 'both' | 'custom'
  title: string
  detail: string
}

export const GOAL_CHOICES: GoalChoice[] = [
  { id: 'reduce-porn', title: 'Reduce porn use', detail: 'Set a weekly limit that feels realistic.' },
  { id: 'stop-porn', title: 'Stop porn use', detail: 'Aim for none, one day at a time.' },
  { id: 'reduce-m', title: 'Reduce masturbation', detail: 'Set a weekly limit you choose.' },
  { id: 'stop-m', title: 'Stop masturbation', detail: 'Aim for none, for as long as you choose.' },
  { id: 'both', title: 'Track porn and masturbation separately', detail: 'Two goals, two counters, your rules for each.' },
  { id: 'custom', title: 'Something else', detail: 'Name your own habit and what counts.' },
]

export const KIND_DEFAULT_LABEL: Record<Exclude<GoalKind, 'custom'>, Record<GoalMode, string>> = {
  porn: { stop: 'No porn', reduce: 'Less porn' },
  masturbation: { stop: 'No masturbation', reduce: 'Less masturbation' },
}

export const KIND_NAME: Record<GoalKind, string> = { porn: 'Porn', masturbation: 'Masturbation', custom: 'Custom' }

export const DURATIONS: { days: number | null; label: string }[] = [
  { days: 7, label: '7 days' },
  { days: 14, label: '14 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
  { days: null, label: 'No end date' },
]

export const WANTS: { id: Want; label: string }[] = [
  { id: 'focus', label: 'Focus' },
  { id: 'time', label: 'Free time' },
  { id: 'routines', label: 'Better routines' },
  { id: 'control', label: 'Stronger self control' },
  { id: 'offline', label: 'Less time online' },
  { id: 'sleep', label: 'Better sleep habits' },
  { id: 'presence', label: 'More presence' },
  { id: 'alignment', label: 'Personal or religious alignment' },
  { id: 'other', label: 'Something else' },
]

export const CHECKIN_CHOICES: { id: CheckInStatus; label: string; detail: string }[] = [
  { id: 'aligned', label: 'Stayed aligned with my goal', detail: 'Today counts.' },
  { id: 'urge', label: 'Had an urge and worked through it', detail: 'That is the skill. Today counts.' },
  { id: 'hard', label: 'Had a difficult day', detail: 'Still here. Today counts.' },
  { id: 'reset', label: 'Need a reset', detail: 'Choose which goal. Your history stays.' },
  { id: 'skip', label: 'Not ready to log today', detail: 'That is fine. Nothing is marked.' },
]

export const MOODS = ['Heavy', 'Low', 'Okay', 'Good', 'Bright']

export const TOOL_LABELS: Record<UrgeTool, string> = {
  breathe: 'Breathe',
  delay: 'Wait ten minutes',
  leave: 'Change rooms',
  walk: 'Take a short walk',
  device: 'Put the phone away',
  move: 'Move for two minutes',
  reason: 'Read my reason',
  focus: 'Start a focus task',
  write: 'Write what triggered it',
  contact: 'Message someone I trust',
}

export const TOOL_ORDER: UrgeTool[] = ['breathe', 'delay', 'walk', 'leave', 'device', 'move', 'reason', 'focus', 'write', 'contact']

/** Short, concrete guidance for the move away tools. */
export const TOOL_GUIDE: Partial<Record<UrgeTool, { title: string; steps: string[] }>> = {
  leave: { title: 'Change the room', steps: ['Stand up now.', 'Go somewhere with other people or more light.', 'Stay there until the timer ends.'] },
  walk: { title: 'Walk it off', steps: ['Shoes on, phone in your pocket.', 'Walk for at least five minutes.', 'Notice three things you can see on the way.'] },
  device: { title: 'Put the phone down', steps: ['Put it in another room, face down.', 'Do one thing with your hands: dishes, stretch, tidy.', 'Come back when the timer ends.'] },
  move: { title: 'Move for two minutes', steps: ['Twenty squats or a wall sit.', 'Ten slow push ups, any version.', 'Shake out your arms and breathe out long.'] },
}

export const TRIGGER_LABELS: Record<Trigger, string> = {
  boredom: 'Boredom',
  stress: 'Stress',
  loneliness: 'Loneliness',
  late: 'Late night scrolling',
  social: 'Social media',
  alone: 'Being alone',
  emotions: 'Difficult emotions',
  habit: 'Habit or routine',
  other: 'Something else',
  private: 'Prefer not to say',
}

export const TRIGGER_ORDER: Trigger[] = ['boredom', 'stress', 'loneliness', 'late', 'social', 'alone', 'emotions', 'habit', 'other', 'private']

export const OUTCOME_LABELS: Record<UrgeOutcome, string> = {
  passed: 'It passed',
  eased: 'It eased',
  acted: 'It did not pass this time',
  unsure: 'Not sure yet',
}

export const ROUTINE_CATALOG: { category: RoutineCategory; label: string; hint: string }[] = [
  { category: 'sleep', label: 'Wind down by 11', hint: 'Sleep routine' },
  { category: 'movement', label: 'Move for 20 minutes', hint: 'Movement or exercise' },
  { category: 'reading', label: 'Read 10 pages', hint: 'Reading' },
  { category: 'focus', label: 'One focus session', hint: 'Deep work' },
  { category: 'quiet', label: 'Five quiet minutes', hint: 'Meditation or reflection' },
  { category: 'learning', label: 'Practice a skill', hint: 'Learning' },
  { category: 'outdoors', label: 'Time outside', hint: 'Daylight and air' },
  { category: 'screenfree', label: 'Phone out of the bedroom', hint: 'Screen free time' },
  { category: 'social', label: 'Talk to someone', hint: 'Connection' },
  { category: 'practice', label: 'Personal practice', hint: 'Spiritual or personal' },
  { category: 'planning', label: 'Plan tomorrow', hint: 'Evening planning' },
]

export const MAX_ROUTINES = 5

export const PROMPTS = {
  morning: { title: 'Morning intention', question: 'What is one thing you want to do well today?' },
  evening: { title: 'Evening reflection', question: 'What went well, and what would you change tomorrow?' },
  weekly: { title: 'Weekly review', question: 'What patterns did you notice this week?' },
} as const

/** Rotating, calm headlines for Today. {n} is the day of the current run. */
export const DAY_LINES = ['Your path, your pace.', 'Steady wins.', 'Another day of showing up.', 'Quiet progress is still progress.']

export const RESET_LINES = [
  'That was one difficult moment. Your progress is still here.',
  'Reset the counter. Keep the lesson.',
  'One setback does not delete your previous work.',
]

export interface Source {
  label: string
  url: string
}

export interface TalkCard {
  id: string
  title: string
  body: string
  sources: Source[]
}

export interface TalkSection {
  id: 'established' | 'yours' | 'beliefs'
  title: string
  intro: string
  cards: TalkCard[]
}

const S = {
  icd: { label: 'WHO ICD 11, 6C72', url: 'https://icd.who.int/browse/2024-01/mms/en#1630268048' },
  ccMast: { label: 'Cleveland Clinic: Masturbation', url: 'https://my.clevelandclinic.org/health/articles/24332-masturbation' },
  ccCsb: { label: 'Cleveland Clinic: Compulsive sexual behavior', url: 'https://my.clevelandclinic.org/health/treatments/22690-sex-addiction-hypersexuality-and-compulsive-sexual-behavior' },
  antons: { label: 'Antons et al. 2022, systematic review', url: 'https://doi.org/10.1556/2006.2022.00061' },
  act: { label: 'Crosby and Twohig 2016, ACT trial', url: 'https://digitalcommons.usu.edu/psych_facpub/1355' },
  henry: { label: 'Henry et al. 2022, JMIR Formative Research', url: 'https://formative.jmir.org/2022/10/e39869' },
  harkin: { label: 'Harkin et al. 2016, Psychological Bulletin', url: 'https://eprints.whiterose.ac.uk/91437/' },
  lally: { label: 'Lally et al. 2010, habit formation', url: 'https://doi.org/10.1002/ejsp.674' },
  bowen: { label: 'Bowen and Marlatt 2009, urge surfing', url: 'https://pubmed.ncbi.nlm.nih.gov/20025372/' },
  ave: { label: 'Lapses and the abstinence violation effect', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3296289' },
  grubbs: { label: 'American Psychological Association, 2020', url: 'https://www.apa.org/news/press/releases/2020/02/religious-moral-porn-addiction' },
  jiang: { label: 'Jiang et al. 2003', url: 'https://doi.org/10.1631/jzus.2003.0236' },
  lifeline: { label: '988 Suicide and Crisis Lifeline', url: 'https://988lifeline.org' },
} satisfies Record<string, Source>

export const REAL_TALK: TalkSection[] = [
  {
    id: 'established',
    title: 'What medical sources establish',
    intro: 'Short, sourced, and careful about what is not known.',
    cards: [
      {
        id: 'normal',
        title: 'Masturbation is a normal behavior',
        body: 'Medical sources describe it as normal and common. Wanting to change a habit is a personal choice, not proof that something is wrong with you.',
        sources: [S.ccMast],
      },
      {
        id: 'control',
        title: 'The concern is control and impact, not a number',
        body: 'The WHO describes compulsive sexual behaviour disorder as a long lasting pattern of failing to control urges that causes marked distress or harms important parts of life. Frequency alone does not define it, and distress that comes only from moral disapproval is not enough. Tarn does not diagnose anyone.',
        sources: [S.icd],
      },
      {
        id: 'help',
        title: 'When to talk to a professional',
        body: 'If a habit keeps interfering with work, relationships, money or sleep, or you feel stuck despite trying, a qualified health or mental health professional can help. Therapy approaches based on CBT have the most research support so far, from a small number of trials.',
        sources: [S.ccCsb, S.antons, S.act],
      },
      {
        id: 'apps',
        title: 'What an app can and cannot do',
        body: 'A 2022 review of 170 apps in this space found none that cited evidence they work. Tarn is a self directed habit tool. It can help you notice patterns and practice skills. It is not treatment.',
        sources: [S.henry],
      },
    ],
  },
  {
    id: 'yours',
    title: 'What you can observe yourself',
    intro: 'Your own records are useful evidence about you, and only about you.',
    cards: [
      {
        id: 'monitor',
        title: 'Tracking progress helps people reach goals',
        body: 'Across 138 experiments, people who monitored progress toward a goal were more likely to reach it, especially when they wrote it down. That is why the check in exists.',
        sources: [S.harkin],
      },
      {
        id: 'habits',
        title: 'There is no magic number of days',
        body: 'In one study, new daily habits took from 18 to over 200 days to feel automatic, with a typical figure around 66. Your goal length is a planning choice, not a recovery deadline.',
        sources: [S.lally],
      },
      {
        id: 'urges',
        title: 'Urges rise and fall',
        body: 'In a small study of smokers, brief mindfulness instructions did not make urges weaker, but people acted on them less afterward. Noticing an urge without obeying it is a skill you can practice.',
        sources: [S.bowen],
      },
      {
        id: 'setbacks',
        title: 'How you treat a setback matters',
        body: 'Harsh self blame after a slip is linked with more slips. Treating it as information, not a verdict, is more useful. Your history and milestones stay when you reset.',
        sources: [S.ave],
      },
      {
        id: 'observe',
        title: 'Notice your own changes',
        body: 'Sleep, focus, mood and time offline are worth noting in your journal. They are your observations, not guaranteed effects of any goal.',
        sources: [],
      },
    ],
  },
  {
    id: 'beliefs',
    title: 'Community beliefs, not established facts',
    intro: 'Popular online. Not supported by the sources we reviewed.',
    cards: [
      {
        id: 'testosterone',
        title: '"Abstinence boosts testosterone"',
        body: 'This traces back to one small study of 28 men that saw a brief peak around day seven and no lasting rise. It has not been shown that abstinence raises testosterone over time.',
        sources: [S.jiang],
      },
      {
        id: 'powers',
        title: '"Day 90 rewires your brain"',
        body: 'There is no evidence for a universal schedule of brain rewiring, dopamine reset, higher intelligence, better fertility or guaranteed energy from abstinence. Tarn does not count down to any of these.',
        sources: [S.antons],
      },
      {
        id: 'labels',
        title: '"If it bothers you, you must be addicted"',
        body: 'Research finds that moral disapproval of a behavior predicts feeling addicted, separately from how often it happens. Your values matter, and you can act on them without a label.',
        sources: [S.grubbs],
      },
    ],
  },
]

export const CRISIS = {
  title: 'If you are in crisis',
  body: 'If you have thoughts of harming yourself, call or text 988 in the US, or your local emergency number.',
  source: S.lifeline,
}

export const BRAND = 'Tarn'

export const AGE_RANGES: { id: AgeRange; label: string }[] = [
  { id: '18-24', label: '18 to 24' },
  { id: '25-34', label: '25 to 34' },
  { id: '35-44', label: '35 to 44' },
  { id: '45-54', label: '45 to 54' },
  { id: '55+', label: '55 or older' },
]

export const BODY_SPOTS: { id: BodySpot; label: string }[] = [
  { id: 'chest', label: 'Chest' },
  { id: 'stomach', label: 'Stomach' },
  { id: 'head', label: 'Head' },
  { id: 'hands', label: 'Hands' },
  { id: 'whole', label: 'Whole body' },
  { id: 'unsure', label: 'Hard to say' },
]

export const FEELINGS: { id: Feeling; label: string }[] = [
  { id: 'calmer', label: 'Calmer' },
  { id: 'better', label: 'A little better' },
  { id: 'difficult', label: 'Still difficult' },
  { id: 'private', label: 'Prefer not to say' },
]

/** Next steps after breathing. No timers: an urge does not end at a set minute. */
export const NEXT_STEPS: { id: UrgeTool | 'finish'; title: string; guide: string[] }[] = [
  { id: 'leave', title: 'Change your environment', guide: ['Stand up and go somewhere with more light or other people.', 'Stay there a while. Notice what is around you.'] },
  { id: 'device', title: 'Put the device aside', guide: ['Put the phone or laptop in another room, face down.', 'Do one thing with your hands: tidy, stretch, make tea.'] },
  { id: 'walk', title: 'Take a short walk', guide: ['Shoes on, phone in your pocket.', 'Walk until you feel ready to come back. Notice three things you can see.'] },
  { id: 'focus', title: 'Start a simple task', guide: ['Pick one small thing you can finish.', 'Start it now. You can stop whenever you like.'] },
  { id: 'write', title: 'Write down the trigger', guide: [] },
  { id: 'reason', title: 'Return to your intention', guide: [] },
  { id: 'finish', title: 'Finish the exercise', guide: [] },
]

export function greeting(hour: number): string {
  if (hour < 5) return 'Still up'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

/** A suggested first intention for each goal. Always editable; never prescribed. */
export const SUGGESTED_INTENTIONS: Record<GoalKind, string[]> = {
  porn: ['Phone out of the bedroom', 'Take a short walk after dinner', 'Plan tomorrow'],
  masturbation: ['Wind down by 11', 'Take a short walk after dinner', 'Five quiet minutes'],
  custom: ['Take a short walk after dinner', 'Read 10 pages', 'Plan tomorrow'],
}

export const CALM_LINES = ['Take a breath. This moment will pass.', 'Pause. You do not have to act on every urge.']

export const KIND_WORDS = ['Showing up counts.', 'Keep what you learned.', 'One moment does not define your journey.']
