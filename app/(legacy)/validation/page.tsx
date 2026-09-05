import { permanentRedirect } from "next/navigation";
import { getLocalizedPath } from "@/lib/localization";

export default function LegacyValidationPage() {
  permanentRedirect(getLocalizedPath("zh-CN", "/validation"));
}
