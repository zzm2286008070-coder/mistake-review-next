import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dailyReviewCalendar} from '../calendar.js';

test('daily calendar alarm starts at the next local occurrence including across year end',()=>{
  const now=new Date(2026,11,31,20,0,0);
  const file=dailyReviewCalendar('20:00',now);
  assert.ok(file.includes('DTSTART:20270101T200000\r\n'));
  assert.ok(file.includes('RRULE:FREQ=DAILY\r\n'));
  assert.ok(file.includes('BEGIN:VALARM\r\nACTION:DISPLAY\r\nTRIGGER:PT0M'));
  assert.ok(dailyReviewCalendar('20:01',now).includes('DTSTART:20261231T200100'));
  assert.throws(()=>dailyReviewCalendar('25:00',now));
});
