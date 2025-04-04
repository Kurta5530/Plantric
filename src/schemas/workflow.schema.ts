export const workflowSchema = {
  type: "object",
  required: ["thinking", "id", "name", "nodes"],
  properties: {
    thinking: {
      type: "string",
      description: "The Chain of Thought.",
    },
    id: { type: "string" },
    name: { type: "string" },
    description: { type: "string" },
    nodes: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "type", "action"],
        properties: {
          id: { type: "string" },
          type: {
            type: "string",
            enum: ["action"],    // only action nodes for now; reserved for future types like condition, loop, etc.
          },
          dependencies: {
            type: "array",
            items: { type: "string" },
          },
          output: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
            },
          },
          action: {
            type: "object",
            required: ["type", "name", "description"],
            properties: {
              type: {
                type: "string",
                // enum: ["prompt", "script", "hybrid"],
                enum: ["prompt"],
              },
              name: { type: "string" },
              description: { type: "string" },
              params: { type: "object" },
              tools: {
                type: "array",
                items: { type: "string" },   // enum values from tool registry will be dynamically populated
              },
            },
          },
        },
      },
    },
    variables: {
      type: "object",
      additionalProperties: true,
    },
  },
};
