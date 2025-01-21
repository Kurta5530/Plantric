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
            console.log(workflow)
        } catch (error) {
            return null;
        }
        return workflow;
    }

    execute(workflow, options) {
        this.options = options || this.options;
        // workflow = workflow || [];

        console.log('workflow');

        this.recursiveTraverse(workflow);
    }

    recursiveTraverse(input) {
        if (typeof input === 'object' && input !== null) {
          for (let key in input) {
            if (input.hasOwnProperty(key)) {
              console.log(key + ':');
              this.recursiveTraverse(input[key]); // Recursively call the function
            }
          }
        } else {
          console.log(input); // Print value if it’s not an object or array
        }
      }

    $() {

    }
}