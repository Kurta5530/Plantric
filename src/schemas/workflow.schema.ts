export const workflowSchema = {
    type: "object",
    required: ["version", "id", "name", "nodes"],
    properties: {
        version: { type: "string" },
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
                        enum: ["action", "condition", "loop"]
                    },
                    dependencies: {
                        type: "array",
                        items: { type: "string" }
                    },
                    input: {
                        type: "object",
                        properties: {
                            type: { type: "string" },
                            schema: { type: "object" }
                        }
                    },
                    output: {
                        type: "object",
                        properties: {
                            type: { type: "string" },
                            schema: { type: "object" }
                        }
                    },
                    action: {
                        type: "object",
                        required: ["type", "name"],
                        properties: {
                            type: {
                                type: "string",
                                enum: ["prompt", "script", "hybrid"]
                            },
                            name: { type: "string" },
                            params: { type: "object" },
                            tools: {
                                type: "array",
                                items: { type: "string" }
                            }
                        }
                    }
                }
            }
        },
        variables: {
            type: "object",
            additionalProperties: true
        }
    }
};
