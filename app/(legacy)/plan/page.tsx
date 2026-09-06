import { permanentRedirect } from "next/navigation";

export default function LegacyPlanPage() {
  permanentRedirect("/zh-CN/plan");
}
