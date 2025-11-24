import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getScheduleTemplates } from "@/lib/schedule";
import { ScheduleShell } from "./ScheduleShell";
import styles from "./schedule.module.css";
import { mapScheduleTemplateToCard } from "./types";

export default async function SchedulePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const templates = await getScheduleTemplates();
  const scheduleCards = templates.map((template) =>
    mapScheduleTemplateToCard(template),
  );

  return (
    <div className={styles.page}>
      <ScheduleShell initialSchedules={scheduleCards} />
    </div>
  );
}
