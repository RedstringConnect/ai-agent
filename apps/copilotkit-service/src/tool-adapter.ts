// import { dynamicTool, jsonSchema } from "ai"

// interface TanStackTool {
//   name: string
//   description: string
//   inputSchema?: Record<string, unknown>
//   execute?: ((args: any, executionContext?: any) => any) | undefined
// }

// export function convertTanStackToolsToAISDK(
//   tanstackTools: TanStackTool[],
//   executionContext?: any,
// ): Record<string, any> {
//   const result: Record<string, any> = {}

//   for (const t of tanstackTools) {
//     result[t.name] = dynamicTool({
//       description: t.description,
//       inputSchema: jsonSchema((t.inputSchema ?? {}) as Record<string, unknown>),
//       execute: async (args: any) => {
//         if (!t.execute) {
//           return JSON.stringify({ error: `Tool ${t.name} has no executor` })
//         }
//         return t.execute(args, executionContext)
//       },
//     })
//   }

//   return result
// }
