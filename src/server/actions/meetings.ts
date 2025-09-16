"use server";

import { db } from "@/drizzle/db";
import { getValidTimesFromSchedule } from "@/lib/get-valid-times-from-schedule";
import { meetingActionSchema } from "@/schema/meetings";
import { fromZonedTime } from "date-fns-tz";
import { redirect } from "next/navigation";
import z from "zod";
import { createCalendarEvent } from "../google-calendar";

export const createMeeting = async (
  unsafeData: z.infer<typeof meetingActionSchema>
) => {
  const { success, data } = meetingActionSchema.safeParse(unsafeData);

  if (!success) return { error: true };

  // check the event using the validated data
  const event = await db.query.EventTable.findFirst({
    where: ({ clerkUserId, isActive, id }, { eq, and }) =>
      and(
        eq(isActive, true),
        eq(id, data.eventId),
        eq(clerkUserId, data.clerkUserId)
      ),
  });

  if (!event) return { error: true };

  const startInTimeZone = fromZonedTime(data.startTime, data.timezone);
  const validTimes = await getValidTimesFromSchedule([startInTimeZone], event);
  if (!validTimes || validTimes.length === 0) return { error: true };

  await createCalendarEvent(
    data.clerkUserId,
    data.guestName,
    data.guestEmail,
    data.startTime,
    event.durationInMinutes,
    event.name,
    data.guestNotes
  );

  redirect(
    `/book/${data.clerkUserId}/${
      data.eventId
    }/success?startTime=${data.startTime.toISOString()}`
  );
};
