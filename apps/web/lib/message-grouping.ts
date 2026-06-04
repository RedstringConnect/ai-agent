export type Turn =
  | { type: "user"; id: string; message: any }
  | { type: "agent"; id: string; messages: any[] }

export function groupMessagesByTurn(messages: any[]): Turn[] {
  const turns: Turn[] = []

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    // PHASE 4: Ensure deterministic IDs to prevent hydration mismatch and UI jumping
    const deterministicId = msg.id || `msg-${msg.createdAt || i}`
    
    if (msg.role === "user") {
      turns.push({ type: "user", id: deterministicId, message: msg })
    } else {
      // It's an assistant or tool message. Group it with the last agent turn if possible.
      if (turns.length > 0 && turns[turns.length - 1].type === "agent") {
        const lastAgentTurn = turns[turns.length - 1] as { type: "agent"; id: string; messages: any[] }
        lastAgentTurn.messages.push(msg)
      } else {
        // Create a new agent turn
        turns.push({ type: "agent", id: deterministicId, messages: [msg] })
      }
    }
  }

  return turns
}
