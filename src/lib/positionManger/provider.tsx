import { useEffect, useState } from "react";
import { PositionManagerState, PositionContext } from "./context";
import useStore from "../hooks/useStore";
import { DefaultResource, FieldProps, ProcessedEvent, ResourceFields } from "../types";
import { getResourcedEvents, sortEventsByTheEarliest } from "../helpers/generals";
import { eachDayOfInterval, format, isSameDay, startOfDay } from "date-fns";

type Props = {
  children: React.ReactNode;
};

const setEventPositions = (events: ProcessedEvent[]) => {
  const slots: PositionManagerState["renderedSlots"][string] = {};
  let position = 0;
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const eventLength = eachDayOfInterval({ start: event.start, end: event.end });
    for (let i = 0; i < eventLength.length; i++) {
      const day = format(eventLength[i], "yyyy-MM-dd");
      if (slots[day]) {
        const positions = Object.values(slots[day]);
        while (positions.includes(position)) {
          position += 1;
        }
        slots[day][event.event_id] = position;
      } else {
        slots[day] = { [event.event_id]: position };
      }
    }

    // rest
    position = 0;
  }

  return slots;
};

const setEventPositionsWithResources = (
  events: ProcessedEvent[],
  resources: DefaultResource[],
  rFields: ResourceFields,
  fields: FieldProps[]
) => {
  const sorted = sortEventsByTheEarliest(events);
  const slots: PositionManagerState["renderedSlots"] = {};
  if (resources.length) {
    for (const resource of resources) {
      const resourcedEvents = getResourcedEvents(sorted, resource, rFields, fields);
      // Filter to only include multi-day or all-day events for positioning
      const multiDayEvents = resourcedEvents.filter(
        (e) => e.allDay || !isSameDay(startOfDay(e.start), startOfDay(e.end))
      );
      const positions = setEventPositions(multiDayEvents);
      slots[resource[rFields.idField]] = positions;
    }
  } else {
    const multiDayEvents = sorted.filter(
      (e) => e.allDay || !isSameDay(startOfDay(e.start), startOfDay(e.end))
    );
    slots.all = setEventPositions(multiDayEvents);
  }

  return slots;
};

export const PositionProvider = ({ children }: Props) => {
  const { events, resources, resourceFields, fields } = useStore();
  const [state, set] = useState<PositionManagerState>({
    renderedSlots: setEventPositionsWithResources(events, resources, resourceFields, fields),
  });

  useEffect(() => {
    set((prev) => ({
      ...prev,
      renderedSlots: setEventPositionsWithResources(events, resources, resourceFields, fields),
    }));
  }, [events, fields, resourceFields, resources]);

  const setRenderedSlot = (day: string, eventId: string, position: number, resourceId?: string) => {
    set((prev) => ({
      ...prev,
      renderedSlots: {
        ...prev.renderedSlots,
        [resourceId || "all"]: {
          ...prev.renderedSlots?.[resourceId || "all"],
          [day]: prev.renderedSlots?.[resourceId || "all"]?.[day]
            ? {
                ...prev.renderedSlots?.[resourceId || "all"]?.[day],
                [eventId]: position,
              }
            : { [eventId]: position },
        },
      },
    }));
  };

  return (
    <PositionContext.Provider
      value={{
        ...state,
        setRenderedSlot,
      }}
    >
      {children}
    </PositionContext.Provider>
  );
};
