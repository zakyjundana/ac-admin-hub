import { createFileRoute } from "@tanstack/react-router";
import { ShellRoute } from "@/components/AppShell";

export const Route = createFileRoute("/_app")({
  component: ShellRoute,
});

