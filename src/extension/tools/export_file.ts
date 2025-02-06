import { Tool, InputSchema } from "../../types/action.types";
import { getCurrentTabId } from "../utils";

/**
 * Export file
 */
export class ExportFile implements Tool {
  name: string;
  description: string;
  input_schema: InputSchema;

  constructor() {
    this.name = "export_file";
    this.description = "Content exported as a file, support text format";
    this.input_schema = {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "Export file content",
        },
        fileType: {
          type: "string",
          description: "File format type",
          enum: ["txt", "csv", "md", "html", "js", "xml", "json", "yml", "sql"],
        },
        filename: {
          type: "string",
          description: "File name",
        },
      },
      required: ["fileType", "content"],
    };
  }

  /**
   * export
   *
   * @param {*} params { fileType: 'csv', content: 'field1,field2\ndata1,data2' }
   * @returns { success: true }
   */
  async execute(params: unknown): Promise<unknown> {
    if (
      typeof params !== "object" ||
      params === null ||
      !("content" in params)
    ) {
      throw new Error(
        'Invalid parameters. Expected an object with a "content" property.'
      );
    }
    let { fileType, filename, content } = params as any;
    if (!fileType) {
      fileType = "txt";
    }
    let type = "text/plain";
    switch (fileType) {
      case "csv":
        type = "text/csv";
        break;
      case "md":
        type = "text/markdown";
        break;
      case "html":
        type = "text/html";
        break;
      case "js":
        type = "application/javascript";
        break;
      case "xml":
        type = "text/xml";
        break;
      case "json":
        type = "application/json";
        break;
    }
    if (!filename) {
      filename = new Date().getTime() + "." + fileType;
    }
    let tabId = await getCurrentTabId();
    await chrome.scripting.executeScript({
      target: { tabId: tabId as number },
      func: exportFile,
      args: [filename, type, content],
    });
    return { success: true };
  }
}

function exportFile(filename: string, type: string, content: string) {
  const blob = new Blob([content], { type: type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
