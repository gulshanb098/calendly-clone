import { DAYS_OF_WEEK_IN_ORDER } from "@/data/constants";
import { setHours, setMinutes } from "date-fns";
import { format, fromZonedTime, toZonedTime } from "date-fns-tz";

export const formatEventDescription = (durationInMinutes: number): string => {
  const hours = Math.floor(durationInMinutes / 60);
  const minutes = durationInMinutes % 60;
  const minuteString = `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  const hourString = `${hours} hour${hours !== 1 ? "s" : ""}`;

  if (hours === 0) return minuteString;
  if (minutes === 0) return hourString;
  return `${hourString} ${minuteString}`;
};

export const formatTimezoneOffset = (timezone: string): string => {
  return (
    new Intl.DateTimeFormat(undefined, {
      timeZone: timezone,
      timeZoneName: "shortOffset",
    })
      .formatToParts()
      .find((part) => part.type === "timeZoneName")?.value || ""
  );
};

const DAYS_MAP: Record<string, number> = DAYS_OF_WEEK_IN_ORDER.reduce(
  (acc, day, idx) => {
    acc[day] = idx;
    return acc;
  },
  {} as Record<string, number>
);

// Adjust JS Day (Sun=0,..) to your Monday=0.. mapping
const jsDayToCustomIndex = (jsDay: number) => (jsDay === 0 ? 6 : jsDay - 1);

const getDateForDayOfWeek = (dayOfWeek: string, referenceDate: Date): Date => {
  const targetDayIndex = DAYS_MAP[dayOfWeek.toLowerCase()];
  if (targetDayIndex === undefined)
    throw new Error(`Invalid dayOfWeek: ${dayOfWeek}`);

  const currentDayIndex = jsDayToCustomIndex(referenceDate.getDay());
  const diffDays = targetDayIndex - currentDayIndex;
  return new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate() + diffDays
  );
};

export const timeStringToDate = (
  time: string, // "HH:mm" or "H:mm"
  dayOfWeek: string,
  timezone: string,
  referenceDate = new Date()
): Date => {
  // Get the date of the correct day in the current week
  const dayDate = getDateForDayOfWeek(dayOfWeek, referenceDate);

  const [hourStr, minuteStr] = time.split(":");
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  // Create a new Date with the correct time set
  const dateWithTime = setMinutes(setHours(dayDate, hour), minute);

  // Convert this date to the given timezone as a UTC Date object
  const zonedDate = fromZonedTime(dateWithTime, timezone);

  return zonedDate; // Date in UTC representing that local time in the timezone
};

// Convert stored UTC date to local time string and dayOfWeek
export const dateToTimeStringAndDayOfWeek = (date: Date, timeZone: string) => {
  // Convert UTC date to date in user's timezone
  const zonedDate = toZonedTime(date, timeZone);

  // Format time as "HH:mm"
  const timeString = format(zonedDate, "HH:mm", { timeZone });

  // Get local day of week (Monday = 0)
  const localDayIndex = jsDayToCustomIndex(zonedDate.getDay());
  const dayOfWeek = DAYS_OF_WEEK_IN_ORDER[localDayIndex];

  return { dayOfWeek, timeString };
};

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
});

export const formatDate = (date: Date) => {
  return dateFormatter.format(date);
};

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  timeStyle: "short",
});

export const formatTimeString = (date: Date) => {
  return timeFormatter.format(date);
};

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export const formatDateTime = (date: Date) => {
  return dateTimeFormatter.format(date);
};
