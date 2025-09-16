import { DAYS_OF_WEEK_IN_ORDER } from "@/data/constants";
import { db } from "@/drizzle/db";
import { ScheduleAvailabilityTable } from "@/drizzle/schema";
import { getCalendarEventTimes } from "@/server/google-calendar";
import {
  addMinutes,
  areIntervalsOverlapping,
  isFriday,
  isMonday,
  isSaturday,
  isSunday,
  isThursday,
  isTuesday,
  isWednesday,
  isWithinInterval,
  setHours,
  setMinutes,
} from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { dateToTimeStringAndDayOfWeek } from "./formatters";

export const getValidTimesFromSchedule = async (
  timeInOrder: Date[],
  event: {
    clerkUserId: string;
    durationInMinutes: number;
  }
) => {
  const start = timeInOrder[0];
  const end = timeInOrder.at(-1);

  if (start === null || end === null || end === undefined) return [];

  const schedule = await db.query.ScheduleTable.findFirst({
    where: ({ clerkUserId: userIdCol }, { eq }) =>
      eq(userIdCol, event.clerkUserId),
    with: { availabilities: true },
  });

  if (schedule === null || schedule === undefined) return [];

  const groupedAvailabilities = schedule.availabilities.reduce((acc, a) => {
    (acc[a.dayOfWeek] ||= []).push(a);
    return acc;
  }, {} as Record<(typeof DAYS_OF_WEEK_IN_ORDER)[number], (typeof ScheduleAvailabilityTable.$inferSelect)[]>);

  const eventTimes = await getCalendarEventTimes(event.clerkUserId, {
    start,
    end,
  });

  return timeInOrder.filter((intervalDate) => {
    const availabilities = getAvailabilites(
      groupedAvailabilities,
      intervalDate,
      schedule.timezone
    );
    const eventInterval = {
      start: intervalDate,
      end: addMinutes(intervalDate, event.durationInMinutes),
    };

    return (
      eventTimes.every((eventTime) => {
        return !areIntervalsOverlapping(eventTime, eventInterval);
      }) &&
      availabilities?.some((avail) => {
        return (
          isWithinInterval(eventInterval.start, avail) &&
          isWithinInterval(eventInterval.end, avail)
        );
      })
    );
  });
};

const getAvailabilites = (
  groupedAvailabilities: Partial<
    Record<
      (typeof DAYS_OF_WEEK_IN_ORDER)[number],
      (typeof ScheduleAvailabilityTable.$inferSelect)[]
    >
  >,
  date: Date,
  timezone: string
) => {
  let availabilities:
    | (typeof ScheduleAvailabilityTable.$inferSelect)[]
    | undefined;

  if (isMonday(date)) {
    availabilities = groupedAvailabilities.monday;
  }
  if (isTuesday(date)) {
    availabilities = groupedAvailabilities.tuesday;
  }
  if (isWednesday(date)) {
    availabilities = groupedAvailabilities.wednesday;
  }
  if (isThursday(date)) {
    availabilities = groupedAvailabilities.thursday;
  }
  if (isFriday(date)) {
    availabilities = groupedAvailabilities.friday;
  }
  if (isSaturday(date)) {
    availabilities = groupedAvailabilities.saturday;
  }
  if (isSunday(date)) {
    availabilities = groupedAvailabilities.sunday;
  }

  if (availabilities === null) return [];

  return availabilities?.map((avail) => {
    const { timeString: startTime } = dateToTimeStringAndDayOfWeek(
      avail.startTime,
      timezone
    );
    const { timeString: endTime } = dateToTimeStringAndDayOfWeek(
      avail.endTime,
      timezone
    );
    const start = fromZonedTime(
      setMinutes(
        setHours(date, parseInt(startTime.split(":")[0])),
        parseInt(startTime.split(":")[1])
      ),
      timezone
    );

    const end = fromZonedTime(
      setMinutes(
        setHours(date, parseInt(endTime.split(":")[0])),
        parseInt(endTime.split(":")[1])
      ),
      timezone
    );

    return { start, end };
  });
};
