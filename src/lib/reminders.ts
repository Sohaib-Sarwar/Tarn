import { dayKey } from './dates'

/**
 * Opt in reminders without a server: a calendar file with one daily repeating event. The user's own
 * calendar app does the reminding. The title is deliberately plain so it reveals nothing.
 */
export function reminderIcs(time: string, url: string, now = new Date()): string {
  const [h, m] = time.split(':')
  const day = dayKey(now).replaceAll('-', '')
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Tarn//Check in//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:stillpoint-checkin-${day}@stillpoint.local`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${day}T${h}${m}00`,
    'DURATION:PT5M',
    'RRULE:FREQ=DAILY',
    'SUMMARY:Check in',
    `DESCRIPTION:A ten second check in. ${url}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Check in',
    'TRIGGER:PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}
