import { Message } from "@/types";
export declare abstract class ContextComporessor {
    abstract comporess(messages: Message[]): Message[];
}
export declare class NoComporess extends ContextComporessor {
    comporess(messages: Message[]): Message[];
}
export declare class SimpleQAComporess extends ContextComporessor {
    comporess(messages: Message[]): Message[];
}
