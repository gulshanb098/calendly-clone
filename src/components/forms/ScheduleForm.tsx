"use client";

import { DAYS_OF_WEEK_IN_ORDER } from "@/data/constants";
import { formatTimezoneOffset } from "@/lib/formatters";
import { timeToInt } from "@/lib/utils";
import { scheduleFormSchema } from "@/schema/schedule";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import { Fragment, useState } from "react";
import { FieldArrayWithId, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { saveSchedule } from "@/server/actions/schedule";

type ScheduleFormData = z.infer<typeof scheduleFormSchema>;

type DayOfWeek = (typeof DAYS_OF_WEEK_IN_ORDER)[number];

type Availability = {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
};

type GroupedAvailabilityMap = Partial<
  Record<
    DayOfWeek,
    (FieldArrayWithId<
      { availabilities: Availability[] },
      "availabilities",
      "id"
    > & { index: number })[]
  >
>;

interface Props {
  schedule?: {
    timezone: string;
    availabilities: Availability[];
  };
}

const ScheduleForm: React.FC<Props> = ({ schedule }) => {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: schedule
      ? {
          timezone: schedule.timezone,
          availabilities: (schedule.availabilities ?? []).toSorted(
            (a, b) => timeToInt(a.startTime) - timeToInt(b.startTime)
          ),
        }
      : {
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          availabilities: [],
        },
  });

  const {
    append: addAvailability,
    remove: removeAvailability,
    fields: availabilityFields,
  } = useFieldArray({ name: "availabilities", control: form.control });

  const groupedAvailabilityFields: GroupedAvailabilityMap = availabilityFields
    .map((field, index) => ({ ...field, index }))
    .reduce<GroupedAvailabilityMap>((acc, availability) => {
      const key = availability.dayOfWeek;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key]!.push({ ...availability });
      return acc;
    }, {} as GroupedAvailabilityMap);

  const onSubmit = async (data: ScheduleFormData) => {
    const response = await saveSchedule(data);

    if (response?.error) {
      form.setError("root", {
        message: "There was an error saving your schedule",
      });
    } else {
      setSuccessMessage("Schedule saved!");
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex gap-6 flex-col"
      >
        {form.formState.errors.root && (
          <div className="text-destructive text-sm">
            {form.formState.errors.root.message}
          </div>
        )}
        {successMessage && (
          <div className="text-green-500 text-sm">{successMessage}</div>
        )}
        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Timezone</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="w-full max-h-60 overflow-y-auto">
                  {Intl.supportedValuesOf("timeZone").map((timezone) => (
                    <SelectItem key={timezone} value={timezone}>
                      {timezone}
                      {` (${formatTimezoneOffset(timezone)})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-y-6">
          {DAYS_OF_WEEK_IN_ORDER.map((dayOfWeek) => (
            <div key={dayOfWeek}>
              <div className="flex items-center justify-between mb-2">
                <div className="capitalize text-sm font-semibold">
                  {dayOfWeek.substring(0, 3)}
                </div>
                <Button
                  type="button"
                  className="size-6 p-1"
                  variant="outline"
                  onClick={() => {
                    addAvailability({
                      dayOfWeek,
                      startTime: "9:00",
                      endTime: "17:00",
                    });
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex flex-col gap-2">
                {groupedAvailabilityFields[dayOfWeek]?.map(
                  (field, labelIndex) => (
                    <div
                      className="flex flex-col items-center gap-1 w-full"
                      key={field.id}
                    >
                      <div className="flex gap-2 items-center">
                        <FormField
                          control={form.control}
                          name={`availabilities.${field.index}.startTime`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  className="w-24"
                                  aria-label={`${dayOfWeek} Start Time ${
                                    labelIndex + 1
                                  }`}
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        -
                        <FormField
                          control={form.control}
                          name={`availabilities.${field.index}.endTime`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  className="w-24"
                                  aria-label={`${dayOfWeek} End Time ${
                                    labelIndex + 1
                                  }`}
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          className="size-6 p-1"
                          variant="destructiveGhost"
                          onClick={() => removeAvailability(field.index)}
                        >
                          <X />
                        </Button>
                      </div>
                      <FormMessage>
                        {form.formState.errors.availabilities?.at?.(field.index)
                          ?.root?.message || ""}
                      </FormMessage>
                      <FormMessage>
                        {form.formState.errors.availabilities?.at?.(field.index)
                          ?.startTime?.message || ""}
                      </FormMessage>
                      <FormMessage>
                        {form.formState.errors.availabilities?.at?.(field.index)
                          ?.endTime?.message || ""}
                      </FormMessage>
                    </div>
                  )
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 justify-end">
          <Button disabled={form.formState.isSubmitting} type="submit">
            Save
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ScheduleForm;
