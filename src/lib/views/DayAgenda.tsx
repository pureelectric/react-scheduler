import { useMemo } from "react";
import { format } from "date-fns";
import { AgendaDiv } from "../styles/styles";
import { ProcessedEvent } from "../types";
import useStore from "../hooks/useStore";
import { Typography } from "@mui/material";
import { filterTodayAgendaEvents, isTimeZonedToday } from "../helpers/generals";
import AgendaEventsList from "../components/events/AgendaEventsList";
import EmptyAgenda from "../components/events/EmptyAgenda";

type Props = {
  events: ProcessedEvent[];
};
const DayAgenda = ({ events }: Props) => {
  const { day, locale, selectedDate, translations, alwaysShowAgendaDays, timeZone } = useStore();
  const { headRenderer } = day!;

  const dayEvents = useMemo(() => {
    return filterTodayAgendaEvents(events, selectedDate);
  }, [events, selectedDate]);

  if (!alwaysShowAgendaDays && !dayEvents.length) {
    return <EmptyAgenda />;
  }

  const today = isTimeZonedToday({ dateLeft: selectedDate, timeZone });

  return (
    <AgendaDiv>
      <div className={`rs__agenda_row ${today ? "rs__today_cell" : ""}`}>
        <div className="rs__cell rs__agenda__cell">
          {typeof headRenderer === "function" ? (
            <div>{headRenderer(selectedDate)}</div>
          ) : (
            <Typography variant="body2">{format(selectedDate, "dd E", { locale })}</Typography>
          )}
        </div>
        <div className="rs__cell rs__agenda_items">
          {dayEvents.length > 0 ? (
            <AgendaEventsList day={selectedDate} events={dayEvents} />
          ) : (
            <Typography sx={{ padding: 1 }}>{translations.noDataToDisplay}</Typography>
          )}
        </div>
      </div>
    </AgendaDiv>
  );
};

export { DayAgenda };
