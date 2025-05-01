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
    messages = JSON.parse(JSON.stringify(messages));
    let comporessed: Message[] = [];
    messages.forEach((msg, idx) => {
      logger.debug({idx, msg});
      if (msg.role == "system") {
        comporessed.push(msg);
      } else if (msg.role == "assistant") {
        if (idx == messages.length - 2) {
          comporessed.push(msg);
        } else if(typeof msg.content == "string") {
          const nextMessage = messages[idx+1];
          if(nextMessage.role == "assistant" && Array.isArray(nextMessage.content)) {
            ;
          } else {
            comporessed.push(msg);
          }
        } else {
          const task = (msg.content[0] as ToolCall).input.userSidePrompt;
          const details = (msg.content[0] as ToolCall).input.thinking;
          comporessed.push({
            "role": "assistant",
            "content": `<task>${task}</task><details>${details}</details>`,
          })
        }
      } else if (msg.role == "user" || typeof msg.content == "string") {
        if (idx == messages.length - 1 || idx == 1) {
          comporessed.push(msg);
        } else {
          let aiResponseMsg = messages[idx+1];
          if (typeof aiResponseMsg.content == "string") {
            aiResponseMsg = messages[idx+2];
          }
          const result = (aiResponseMsg.content[0] as ToolCall).input.observation;
          comporessed.push({
            "role": "user",
            "content": `<result>${result}</result>`,
          })
        }
      }
    })
    return comporessed;
  }
}
