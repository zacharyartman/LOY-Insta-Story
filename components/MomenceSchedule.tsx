"use client";
import { useEffect } from "react";

function MomenceSchedule() {
  useEffect(() => {
    const scheduleScript = document.createElement("script");
    scheduleScript.async = true;
    scheduleScript.type = "module";
    scheduleScript.src =
      "https://momence.com/plugin/host-schedule/host-schedule.js";
    scheduleScript.setAttribute("host_id", "35160");
    scheduleScript.setAttribute("teacher_ids", "[]");
    scheduleScript.setAttribute("location_ids", "[]");
    scheduleScript.setAttribute("tag_ids", "[]");
    scheduleScript.setAttribute("default_filter", "show-all");
    scheduleScript.setAttribute("hide_drop_in_price", "true");

    const scheduleDiv = document.getElementById("ribbon-schedule");
    if (scheduleDiv) {
      scheduleDiv.appendChild(scheduleScript);
    }

    return () => {
      if (scheduleDiv) {
        scheduleDiv.removeChild(scheduleScript);
      }
    };
  });

  return (
    <>

      <div
        className={`schedule-container overflow-hidden`}
      >
        <div id="ribbon-schedule"></div>
      </div>

    </>
  );
}

export default MomenceSchedule;
