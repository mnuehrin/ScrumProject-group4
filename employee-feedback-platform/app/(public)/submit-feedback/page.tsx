import { redirect } from "next/navigation";

export default function SubmitFeedbackRedirect() {
  redirect("/submit");
}