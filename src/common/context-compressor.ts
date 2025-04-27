import { Message, ToolCall } from "@/types";
import { logger } from "./log";

export abstract class ContextComporessor {
  public abstract comporess(messages: Message[]): Message[];
}

export class NoComporess extends ContextComporessor {
  public comporess(messages: Message[]): Message[] {
    logger.debug("ContextComporessor = NoComporess");
    let comporessed = JSON.parse(JSON.stringify(messages));
    logger.debug("comporessed:", comporessed);
    return comporessed;
  }
}



export class SimpleQAComporess extends ContextComporessor {
  public comporess(messages: Message[]): Message[] {
    logger.debug("ContextComporessor = SimpleQAComporess");
    logger.debug("messages:", JSON.stringify(messages));
    messages = JSON.parse(JSON.stringify(messages));
    let comporessed: Message[] = [];
    messages.forEach((msg, idx) => {
      if (msg.role == "system") {
        comporessed.push(msg);
      } else if (msg.role == "assistant") {
        if (idx == messages.length - 2 || typeof msg.content == "string") {
          comporessed.push(msg);
        } else {
          const task = (msg.content[0] as ToolCall).input.userSidePrompt;
          const details = (msg.content[0] as ToolCall).input.thinking;
          comporessed.push({
            "role": "assistant",
            "content": `<task>${task}</task><details>${details}</details>`,
          })
        }
      } else if (msg.role == "user" || typeof msg.content == "string") {
        if (idx == messages.length - 1) {
          comporessed.push(msg);
        } else {
          msg = messages[idx+1];
          try {
            const result = (msg.content[0] as ToolCall).input.observation;
            comporessed.push({
              "role": "user",
              "content": `<result>${result}</result>`,
            })
          } catch(e) {
            logger.error(e);
            logger.debug(messages);
            logger.debug(msg);
            logger.debug(idx);
            comporessed.push(msg);
          }
        }
      }
    })
    logger.debug("comporessed:", comporessed);
    return comporessed;
  }
}
