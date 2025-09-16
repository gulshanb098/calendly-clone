"use server";

import { db } from "@/drizzle/db";
import { EventTable } from "@/drizzle/schema";
import { eventFormSchema } from "@/schema/events";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import z from "zod";

export const createEvent = async (
  unsafeData: z.infer<typeof eventFormSchema>
): Promise<{ error: boolean } | undefined> => {
  const { userId } = await auth();
  const { success, data } = eventFormSchema.safeParse(unsafeData);

  if (!success || userId === null) {
    return { error: true };
  }

  await db.insert(EventTable).values({
    ...data,
    clerkUserId: userId,
  });

  redirect("/events");
};

export const updateEvent = async (
  id: string,
  unsafeData: z.infer<typeof eventFormSchema>
): Promise<{ error: boolean } | undefined> => {
  const { userId } = await auth();
  const { success, data } = eventFormSchema.safeParse(unsafeData);

  if (!success || userId === null) {
    return { error: true };
  }

  const { rowCount } = await db
    .update(EventTable)
    .set({
      ...data,
    })
    .where(and(eq(EventTable.clerkUserId, userId), eq(EventTable.id, id)));

  if (rowCount === 0) {
    return { error: true };
  }

  redirect("/events");
};

export const deleteEvent = async (
  id: string
): Promise<{ error: boolean } | undefined> => {
  const { userId } = await auth();

  if (userId === null) {
    return { error: true };
  }

  const { rowCount } = await db
    .delete(EventTable)
    .where(and(eq(EventTable.clerkUserId, userId), eq(EventTable.id, id)));

  if (rowCount === 0) {
    return { error: true };
  }

  redirect("/events");
};
