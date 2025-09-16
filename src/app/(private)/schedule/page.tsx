import ScheduleForm from "@/components/forms/ScheduleForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/drizzle/db";
import { dateToTimeStringAndDayOfWeek } from "@/lib/formatters";
import { auth } from "@clerk/nextjs/server";

const SchedulePage = async () => {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  const schedule = await db.query.ScheduleTable.findFirst({
    where: ({ clerkUserId }, { eq }) => eq(clerkUserId, userId),
    with: {
      availabilities: true,
    },
  });

  const availabilitiesFormatted =
    schedule?.availabilities.map(({ startTime, endTime }) => {
      const timezone = schedule?.timezone;
      const startDate =
        typeof startTime === "string" ? new Date(startTime) : startTime;
      const endDate = typeof endTime === "string" ? new Date(endTime) : endTime;

      const { dayOfWeek: startDay, timeString: startTimeStr } =
        dateToTimeStringAndDayOfWeek(startDate, timezone);
      const { dayOfWeek: endDay, timeString: endTimeStr } =
        dateToTimeStringAndDayOfWeek(endDate, timezone);

      return {
        dayOfWeek: startDay,
        startTime: startTimeStr,
        endTime: endTimeStr,
      };
    }) ?? [];

  const scheduleForForm = schedule
    ? {
        timezone: schedule.timezone,
        availabilities: availabilitiesFormatted,
      }
    : undefined;

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <ScheduleForm schedule={scheduleForForm} />
      </CardContent>
    </Card>
  );
};

export default SchedulePage;
