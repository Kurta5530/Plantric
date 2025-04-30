export const workflowSchema = {
  type: "object",
  required: ["thinking", "id", "name", "nodes"],
  properties: {
    thinking: {
      type: "string",
      description: 'Your thinking draft. Should start with "OK, now user requires me to ...". Just show your thinking process, DO NOT show the specificed steps,Remember DO NOT output more than 50 words total! You can use markdown format without code block.',
    },
    id: { type: "string" },
    name: { type: "string" },
    description: { type: "string" },
    nodes: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "action"],
        properties: {
          id: { type: "string" },
          action: {
            type: "object",
            required: ["name", "description"],
            properties: {
              name: { type: "string" },
              description: {
                type: "string",
                description: "Note that do not use \" mark.",
              },
            },
          },
        },
      },
    },
  },
};
