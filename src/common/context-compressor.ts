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
    const compress = (msg: Message, idx: number) => {
      if (msg.role == "system") {
        return msg;
      } else if (msg.role == "assistant") {
        if (idx == messages.length - 2) {
          return msg;
        } else if(typeof msg.content == "string") {
          const nextMessage = messages[idx+1];
          if(nextMessage.role == "assistant" && Array.isArray(nextMessage.content)) {
            return null;
          } else {
            return msg;
          }
        } else {
          const task = (msg.content[0] as ToolCall).input.userSidePrompt;
          const details = (msg.content[0] as ToolCall).input.thinking;
          return {
            "role": "assistant",
            "content": `<task>${task}</task><details>${details}</details>`,
          } as Message;
        }
      } else if (msg.role == "user" || typeof msg.content == "string") {
        if (idx == messages.length - 1 || idx == 1) {
          return msg;
        } else {
          let aiResponseMsg = messages[idx+1];
          if (typeof aiResponseMsg.content == "string") {
            aiResponseMsg = messages[idx+2];
          }
          const result = (aiResponseMsg.content[0] as ToolCall).input.observation;
          return {
            "role": "user",
            "content": `<result>${result}</result>`,
          } as Message;
        }
      } else {
        logger.warn("unknown message type, return null");
        return null;
      }
    }
    messages.forEach((msg, idx) => {
      logger.debug({idx, msg});
      const compressedMsg = compress(msg, idx);
      logger.debug(compressedMsg);
      if (compressedMsg) {
        comporessed.push(compressedMsg);
      } else {
        ;
      }
    });
    return comporessed;
  }
}
