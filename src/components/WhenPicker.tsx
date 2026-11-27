import React from 'react';
import { ScrollView, View } from 'react-native';
import { dayDiff, dayLabel, fmtTime, startOfDay } from '../time';
import { Chip, Label, Stepper } from './ui';

const LENGTHS = [60, 120, 180, 240, 360];

/**
 * Pick a day (chips: Today, Tomorrow, Sat…), a start time (±30 min) and how long it runs.
 * No extra date-picker library needed, and a weekend date is two taps away.
 */
export function WhenPicker({
  startsAt,
  lengthMin,
  onChange,
}: {
  startsAt: string;
  lengthMin: number;
  onChange: (v: { startsAt: string; lengthMin: number }) => void;
}) {
  const now = new Date();
  const start = new Date(startsAt);
  const end = new Date(start.getTime() + lengthMin * 60000);
  const selectedDay = dayDiff(start, now);

  const pickDay = (offset: number) => {
    const d = startOfDay(now);
    d.setDate(d.getDate() + offset);
    d.setHours(start.getHours(), start.getMinutes(), 0, 0);
    onChange({ startsAt: d.toISOString(), lengthMin });
  };
  const shiftStart = (mins: number) => {
    const next = new Date(start.getTime() + mins * 60000);
    if (next.getTime() < now.getTime() - 6 * 3600000) return; // allow events that started earlier today
    onChange({ startsAt: next.toISOString(), lengthMin });
  };
  const shiftLength = (mins: number) => onChange({ startsAt, lengthMin: Math.min(24 * 60, Math.max(30, lengthMin + mins)) });

  return (
    <View>
      <Label>Day</Label>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -24, marginBottom: 14 }} contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}>
        {[0, 1, 2, 3, 4, 5, 6].map((o) => {
          const d = startOfDay(now);
          d.setDate(d.getDate() + o);
          return <Chip key={o} label={dayLabel(d, now)} selected={selectedDay === o} onPress={() => pickDay(o)} />;
        })}
      </ScrollView>
      <Stepper label="Starts" value={fmtTime(start)} onMinus={() => shiftStart(-30)} onPlus={() => shiftStart(30)} />
      <Label>How long</Label>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
        {LENGTHS.map((m) => (
          <Chip key={m} label={`${m / 60}h`} selected={lengthMin === m} onPress={() => onChange({ startsAt, lengthMin: m })} style={{ flex: 1 }} />
        ))}
      </View>
      <Stepper
        label="Ends"
        value={`${fmtTime(end)}${dayDiff(end, start) > 0 ? ` (${dayLabel(end, now)})` : ''}`}
        onMinus={() => shiftLength(-30)}
        onPlus={() => shiftLength(30)}
      />
    </View>
  );
}
