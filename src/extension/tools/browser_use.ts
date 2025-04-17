import { BrowserUseParam, BrowserUseResult } from '../../types/tools.types';
import { Tool, InputSchema, ExecutionContext } from '../../types/action.types';
import { getWindowId, getTabId, sleep, injectScript, executeScript, getSelectorXpath } from '../utils';
import * as browser from './browser';

/**
 * Browser Use for general
 */
abstract class BrowserUse implements Tool<BrowserUseParam, BrowserUseResult> {
  abstract name: string;
  abstract description: string;
  abstract required(): string[];
  input_schema: InputSchema;

  constructor() {
    const required = this.required();
    let input_schema: any = {
      type: 'object',
      properties: {},
    };
    if (required.includes("index")) {
      input_schema.properties.index = {
        type: 'integer',
        description: 'The index of element, Operation elements must pass the corresponding index of the element',
      };
    }
    if (required.includes("text")) {
      input_schema.properties.text = {
        type: 'string',
        description: 'The input text.',
      };
    }
    input_schema.required = required;
    this.input_schema = input_schema;
  }

  checkParams(params: BrowserUseParam): void {
    if (this.input_schema.required) {
      for (const key of this.input_schema.required) {
        if (!(key in params)) {
          throw new Error(`'${key}' parameter is missing but required`);
        }
      }
    }
  }

  async execute(context: ExecutionContext, params: BrowserUseParam): Promise<BrowserUseResult> {
    this.checkParams(params);
    const tabId = await getTabId(context);
    const windowId = await getWindowId(context);
    const selector_xpath = getSelectorXpath(params.index, context.selectorMap);
    this.executeWithArgs(context, params, tabId, windowId, selector_xpath);
    const result = this.screenshotExtractElement(context, tabId, windowId);
    return result;
  }

  abstract executeWithArgs(
    context: ExecutionContext,
    params: BrowserUseParam,
    tabId: number,
    windowId: number,
    selectorXpath: string | undefined,
  ): Promise<void>;

  async screenshotExtractElement(
    context: ExecutionContext,
    tabId: number,
    windowId: number,
  ): Promise<BrowserUseResult> {
    console.log("execute 'screenshot_extract_element'...");
    await sleep(100);
    console.log("injectScript...");
    await injectScript(context.lyvoConfig.chromeProxy, tabId, 'build_dom_tree.js');
    await sleep(100);
    console.log("executeScript...");
    let element_result = await executeScript(context.lyvoConfig.chromeProxy, tabId, () => {
      return (window as any).get_clickable_elements(true);
    }, []);
    context.selector_map = element_result.selector_map;
    console.log("browser.screenshot...");
    let screenshot = await browser.screenshot(context.lyvoConfig.chromeProxy, windowId, true);
    console.log("executeScript #2...");
    await executeScript(context.lyvoConfig.chromeProxy, tabId, () => {
      return (window as any).remove_highlight();
    }, []);
    const result = { image: screenshot.image, text: element_result.element_str };
    console.log("execute 'screenshot_extract_element'...done");
    return result;
  }

  destroy(context: ExecutionContext) {
    delete context.selector_map;
  }
}

export class InputText extends BrowserUse {
  name: string = 'input_text';
  description: string = `Enter a string in the interactive element, If you need to press the Enter key, please end with '\\n'`;

  required(): string[] {
    return ["index", "text"];
  }

  async executeWithArgs(
    context: ExecutionContext,
    params: BrowserUseParam,
    tabId: number,
    windowId: number,
    selectorXpath: string | undefined,
  ): Promise<void> {
    await browser.clear_input_by(context.lyvoConfig.chromeProxy, tabId, selectorXpath, params.index);
    const result = await browser.type_by(context.lyvoConfig.chromeProxy, tabId, params.text as string, selectorXpath, params.index);
    await sleep(200);
    console.log("tool result", result);
  }
}

export class Click extends BrowserUse {
  name: string = 'click';
  description: string = `Click to element.`;

  required(): string[] {
    return ["index"];
  }

  async executeWithArgs(
    context: ExecutionContext,
    params: BrowserUseParam,
    tabId: number,
    windowId: number,
    selectorXpath: string | undefined,
  ): Promise<void> {
    await browser.left_click_by(context.lyvoConfig.chromeProxy, tabId, selectorXpath, params.index);
    await sleep(100);
  }
}

export class RightClick extends BrowserUse {
  name: string = 'right_click';
  description: string = `Right-click on the element.`;

  required(): string[] {
    return ["index"];
  }

  async executeWithArgs(
    context: ExecutionContext,
    params: BrowserUseParam,
    tabId: number,
    windowId: number,
    selectorXpath: string | undefined,
  ): Promise<void> {
    await browser.right_click_by(context.lyvoConfig.chromeProxy, tabId, selectorXpath, params.index);
    await sleep(100);
  }
}

export class DoubleClick extends BrowserUse {
  name: string = 'double_click';
  description: string = `Double-click on the element.`;

  required(): string[] {
    return ["index"];
  }

  async executeWithArgs(
    context: ExecutionContext,
    params: BrowserUseParam,
    tabId: number,
    windowId: number,
    selectorXpath: string | undefined,
  ): Promise<void> {
    await browser.right_click_by(context.lyvoConfig.chromeProxy, tabId, selectorXpath, params.index);
    await sleep(100);
  }
}

export class ScrollTo extends BrowserUse {
  name: string = 'scroll_to';
  description: string = `Scroll to the specified element.`;

  required(): string[] {
    return ["index"];
  }

  async executeWithArgs(
    context: ExecutionContext,
    params: BrowserUseParam,
    tabId: number,
    windowId: number,
    selectorXpath: string | undefined,
  ): Promise<void> {
    await browser.scroll_to_by(context.lyvoConfig.chromeProxy, tabId, selectorXpath, params.index);
    await sleep(500);
  }
}

// duplication of src\extension\tools\extract_content.ts
// export class ExtractContent extends BrowserUse {
//   name: string = 'extract_content';
//   description: string = `Extract the text content of the current webpage.`;

//   required(): string[] {
//     return ["index"];
//   }

//   async executeWithArgs(
//     context: ExecutionContext,
//     params: BrowserUseParam,
//     tabId: number,
//     windowId: number,
//     selectorXpath: string | undefined,
//   ): Promise<void> {
//     let tab = await context.lyvoConfig.chromeProxy.tabs.get(tabId);
//     await injectScript(context.lyvoConfig.chromeProxy, tabId);
//     await sleep(200);
//     let content = await executeScript(context.lyvoConfig.chromeProxy, tabId, () => {
//       return lyvo.extractHtmlContent();
//     }, []);
//     const result = {
//       title: tab.title,
//       url: tab.url,
//       content: content,
//     };
//     return result;
//   }
// }

export class GetDropdownOptions extends BrowserUse {
  name: string = 'get_dropdown_options';
  description: string = `Get all options from a native dropdown element.`;

  required(): string[] {
    return ["index"];
  }

  async executeWithArgs(
    context: ExecutionContext,
    params: BrowserUseParam,
    tabId: number,
    windowId: number,
    selectorXpath: string | undefined,
  ): Promise<void> {
    browser.get_dropdown_options(context.lyvoConfig.chromeProxy, tabId, selectorXpath, params.index); await sleep(500);
  }
}

export class SelectDropdownOption extends BrowserUse {
  name: string = 'select_dropdown_option';
  description: string = `Select dropdown option for interactive element index by the text of the option you want to select.`;

  required(): string[] {
    return ["index", "text"];
  }

  async executeWithArgs(
    context: ExecutionContext,
    params: BrowserUseParam,
    tabId: number,
    windowId: number,
    selectorXpath: string | undefined,
  ): Promise<void> {
    if (params.index == null) {
      throw new Error('index parameter is required');
    }
    if (params.text == null) {
      throw new Error('text parameter is required');
    }
    await browser.select_dropdown_option(
      context.lyvoConfig.chromeProxy,
      tabId,
      params.text,
      selectorXpath,
      params.index
    );
  }
}
