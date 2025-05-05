export declare const workflowSchema: {
    type: string;
    required: string[];
    properties: {
        thinking: {
            type: string;
            description: string;
        };
        id: {
            type: string;
        };
        name: {
            type: string;
        };
        description: {
            type: string;
        };
        nodes: {
            type: string;
            items: {
                type: string;
                required: string[];
                properties: {
                    id: {
                        type: string;
                    };
                    action: {
                        type: string;
                        required: string[];
                        properties: {
                            name: {
                                type: string;
                            };
                            description: {
                                type: string;
                                description: string;
                            };
                        };
                    };
                };
            };
        };
    };
};
