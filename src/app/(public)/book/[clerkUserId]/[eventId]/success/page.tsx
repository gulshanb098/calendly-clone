import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/drizzle/db";
import { formatDateTime } from "@/lib/formatters";
import { clerkClient } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";

export const revalidate = 0;

interface Props {
  params: {
    clerkUserId: string;
    eventId: string;
  };
  searchParams: {
    startTime: string;
  };
}

const SuccessPage: React.FC<Props> = async ({
  params,
  searchParams,
}: Props) => {
  const { clerkUserId, eventId } = params;
  const { startTime } = searchParams;

  const event = await db.query.EventTable.findFirst({
    where: ({ clerkUserId: userCol, isActive, id }, { eq, and }) =>
      and(eq(isActive, true), eq(id, eventId), eq(userCol, clerkUserId)),
  });

  if (!event) notFound();

  const calendarUser = await (await clerkClient()).users.getUser(clerkUserId);
  const startTimeDate = new Date(startTime);

  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>
          Successfully Booked {event.name} with {calendarUser.fullName}
        </CardTitle>
        <CardDescription>{formatDateTime(startTimeDate)}</CardDescription>
      </CardHeader>
      <CardContent>
        You should receive an email confirmation shortly. You can safely close
        this page now.
      </CardContent>
    </Card>
  );
};

export default SuccessPage;
