import { createFileRoute } from "@tanstack/react-router";
import { OSTApp } from "@/components/ost/OSTApp";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return <OSTApp />;
}
