import { useAgent } from "@copilotkit/react-core/v2";

export function useStreamingMessages() {
  const { agent } = useAgent({ agentId: "default" });
  return (agent as any)?.messages ?? [];
}
