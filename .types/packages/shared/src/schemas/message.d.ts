import { z } from "zod";
export declare const messageSchema: z.ZodObject<{
    id: z.ZodString;
    conversationId: z.ZodString;
    userId: z.ZodString;
    role: z.ZodEnum<{
        system: "system";
        user: "user";
        assistant: "assistant";
        tool: "tool";
    }>;
    content: z.ZodString;
    createdAt: z.ZodDate;
}, z.core.$strip>;
export declare const createMessageSchema: z.ZodObject<{
    conversationId: z.ZodString;
    role: z.ZodEnum<{
        system: "system";
        user: "user";
        assistant: "assistant";
        tool: "tool";
    }>;
    content: z.ZodString;
}, z.core.$strip>;
export type Message = z.infer<typeof messageSchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
//# sourceMappingURL=message.d.ts.map