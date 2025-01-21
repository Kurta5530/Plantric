import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { workflowPropmts } from './prompts.js'

export class Lyvo {
    constructor(model) {
        this.options = {
            log: true,
        }
        this.model = model;
    }

    async invoke(task) {
        let workflow = [];

        const res = await this.model.invoke([{ role: "user", content: `${workflowPropmts}
${task}` }]);
        try {
            workflow = JSON.parse(res.content);
            // console.log(workflow)
        } catch (error) {
            return null;
        }
        return workflow;
    }

    execute(workflow, options) {
        this.options = options || this.options;
        workflow = workflow || [];

        this.recursiveTraverse(workflow, options.callback);
    }

    recursiveTraverse(input, callback) {
        let node = {};
        if (typeof input === 'object' && input !== null) {
          for (let key in input) {
            if (input.hasOwnProperty(key)) {
                node = {
                    key,
                    value: input[key],
                }
                callback({
                    ...node,
                    $: this.$.bind(node),
                });
                // Recursively call the function
                this.recursiveTraverse(input[key], callback);
            }
          }
        } else {
            // Callback value if it’s not an object or array
            node = {
                key: null,
                value: input,
            }
            callback({
                ...node,
                $: this.$.bind(node),
            });
        }
      }

    async $(node, task) {
        console.log(node)
        // const res = await this.model.invoke([{ role: "user", content: `${workflowPropmts}
// ${task}` }]);
        return task;
    }
}