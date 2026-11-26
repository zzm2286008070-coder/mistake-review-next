// Floating local times keep the daily event at the selected wall-clock time.
export function dailyReviewCalendar(time, now = new Date()) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('请选择提醒时间。');
  const [hours, minutes] = time.split(':').map(Number);
  const start = new Date(now);
  start.setHours(hours, minutes, 0, 0);
  if (start <= now) start.setDate(start.getDate() + 1);
  const pad = value => String(value).padStart(2, '0');
  const date = [start.getFullYear(), pad(start.getMonth() + 1), pad(start.getDate())].join('');
  const timestamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Mistake Review//Daily Review//ZH',
    'BEGIN:VEVENT', 'UID:daily-review@zzm2286008070-coder.github.io',
    'DTSTAMP:' + timestamp, 'DTSTART:' + date + 'T' + time.replace(':', '') + '00',
    'DURATION:PT5M', 'RRULE:FREQ=DAILY', 'TRANSP:TRANSPARENT', 'SUMMARY:复习错题',
    'URL:https://zzm2286008070-coder.github.io/mistake-review-next/#review',
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'TRIGGER:PT0M', 'DESCRIPTION:复习错题',
    'END:VALARM', 'END:VEVENT', 'END:VCALENDAR', ''
  ].join('\r\n');
}
