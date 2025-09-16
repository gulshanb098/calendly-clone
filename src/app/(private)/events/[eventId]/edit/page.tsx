import EventForm from "@/components/forms/EventForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/drizzle/db";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";

export const revalidate = 0;

interface Props {
  params: Promise<{ eventId: string }>;
}

const EditEventPage: React.FC<Props> = async ({ params }: Props) => {
  const { eventId } = await params;
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  const event = await db.query.EventTable.findFirst({
    where: ({ id, clerkUserId }, { and, eq }) =>
      and(eq(clerkUserId, userId), eq(id, eventId)),
  });

  if (event == null) return notFound();

  const eventForm = event
    ? {
        id: event.id,
        name: event.name,
        durationInMinutes: event.durationInMinutes,
        isActive: event.isActive,
        description: event.description || "",
      }
    : undefined;

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">Edit Event</CardTitle>
      </CardHeader>
      <CardContent>
        <EventForm event={eventForm} />
      </CardContent>
    </Card>
  );
};

export default EditEventPage;
