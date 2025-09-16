"use server";
import { clerkClient } from "@clerk/nextjs/server";
import { google } from "googleapis";
import { addMinutes, endOfDay, startOfDay } from "date-fns";

export const getCalendarEventTimes = async (
  clerkUserId: string,
  { start, end }: { start: Date; end: Date }
) => {
  const oAuthClient = await getOAuthClient(clerkUserId);
  const events = await google.calendar("v3").events.list({
    calendarId: "primary",
    eventTypes: ["default"],
    singleEvents: true,
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    maxResults: 2500,
    auth: oAuthClient,
  });

  return (
    events.data.items
      ?.map((event) => {
        if (event?.start?.date !== null && event?.end?.date !== null) {
          return {
            start: startOfDay(event.start.date),
            end: endOfDay(event.end.date),
          };
        }

        if (event?.start?.dateTime !== null && event?.end?.dateTime !== null) {
          return {
            start: new Date(event.start.date),
            end: new Date(event.end.date),
          };
        }
      })
      .filter((date) => date !== null) || []
  );
};

export const createCalendarEvent = async (
  clerkUserId: string,
  guestName: string,
  guestEmail: string,
  startTime: Date,
  durationInMinutes: number,
  eventName: string,
  guestNotes?: string | null
) => {
  const oAuthClient = await getOAuthClient(clerkUserId);
  if (!oAuthClient) return;

  const calendarUser = await (await clerkClient()).users.getUser(clerkUserId);
  if (!calendarUser || !calendarUser.primaryEmailAddress) {
    throw new Error("Clerk user has no email");
  }

  const calendarEvent = await google.calendar("v3").events.insert({
    calendarId: "primary",
    auth: oAuthClient,
    sendUpdates: "all",
    requestBody: {
      attendees: [
        { email: guestEmail, displayName: guestName },
        {
          email: calendarUser.primaryEmailAddress.emailAddress,
          displayName: calendarUser.fullName,
          responseStatus: "accepted",
        },
      ],
      description: guestNotes ? `Additional Details: ${guestNotes}` : undefined,
      start: {
        dateTime: startTime.toISOString(),
      },
      end: {
        dateTime: addMinutes(startTime, durationInMinutes).toISOString(),
      },
      summary: `${guestName} + ${calendarUser.fullName}: ${eventName}`,
    },
  });

  return calendarEvent.data;
};

const getOAuthClient = async (clerkUserId: string) => {
  const token = await (
    await clerkClient()
  ).users.getUserOauthAccessToken(clerkUserId, "oauth_google");

  if (token.data.length === 0 || token.data[0].token === null) {
    return;
  }

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    process.env.GOOGLE_OAUTH_REDIRECT_URL
  );

  client.setCredentials({ access_token: token.data[0].token });
  return client;
};
