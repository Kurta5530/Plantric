export interface LyvoLlmConfig {
    apiUrl?: string;
    modelName?: string;
    apiKey?: string;
}

export type LyvoConfig = LyvoLlmConfig | string;

export interface LyvoInvokeParam {
    tools: Array<string>
}
