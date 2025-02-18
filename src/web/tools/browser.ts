import html2canvas from 'html2canvas';
import { ScreenshotResult } from '../../types/tools.types';

export function type(xpath: string, text: string): any {
  return do_input(xpath, text);
}

export function clear_input(xpath: string): any {
  return do_input(xpath, '');
}

export function left_click(xpath: string): any {
  return simulateMouseEvent(xpath, ['mousedown', 'mouseup', 'click'], 0);
}

export function right_click(xpath: string): any {
  return simulateMouseEvent(xpath, ['mousedown', 'mouseup', 'contextmenu'], 2);
}

export function double_click(xpath: string): any {
  return simulateMouseEvent(
    xpath,
    ['mousedown', 'mouseup', 'click', 'mousedown', 'mouseup', 'click', 'dblclick'],
    0
  );
}

export async function screenshot(): Promise<ScreenshotResult> {
  const canvas = await html2canvas(document.body, {
    scrollY: -window.scrollY,
    scrollX: -window.scrollX,
  });
  const dataUrl = canvas.toDataURL('image/png');
  let data = dataUrl.substring(dataUrl.indexOf('base64,') + 7);
  return {
    image: {
      type: 'base64',
      media_type: dataUrl.indexOf('image/png') > -1 ? 'image/png' : 'image/jpeg',
      data: data,
    },
  };
}

export function scroll_to(xpath: string): any {
  let result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
  let element = result.singleNodeValue as any;
  return element.scrollIntoView({
    behavior: 'smooth',
  });
}

export function extractHtmlContent(): string {
  let element = document.body;
  let main = element.querySelector('main');
  let content = '';
  if (main) {
    let articles = main.querySelectorAll('article');
    if (articles && articles.length > 0) {
      for (let i = 0; i < articles.length; i++) {
        content += articles[i].innerText.trim() + '\n';
      }
    } else {
      content += main.innerText.trim();
    }
  } else {
    let articles = element.querySelectorAll('article');
    if (articles && articles.length > 0) {
      for (let i = 0; i < articles.length; i++) {
        content += articles[i].innerText.trim() + '\n';
      }
    }
  }
  content = content.trim();
  if (!content) {
    content = element.innerText;
  }
  return content.replace(/\n+/g, '\n').replace(/ +/g, ' ').trim();
}

export function size(): [number, number] {
  return [
    window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
    window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight,
  ];
}

function do_input(xpath: string, text: string) {
  let query_result = document.evaluate(
    xpath,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  );
  let element = query_result.singleNodeValue as any;
  if (!element) {
    return;
  }
  let input: any;
  if (
    element.tagName == 'INPUT' ||
    element.tagName == 'TEXTAREA' ||
    element.childElementCount == 0
  ) {
    input = element;
  } else {
    input = element.querySelector('input') || element.querySelector('textarea') || element;
  }
  input.focus && input.focus();
  if (!text) {
    input.value = '';
  } else {
    input.value += text;
  }
  let result = input.dispatchEvent(new Event('input', { bubbles: true }));
  console.log('type', input, result);
  return result;
}

function simulateMouseEvent(xpath: string, eventTypes: Array<string>, button: 0 | 1 | 2) {
  let query_result = document.evaluate(
    xpath,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  );
  let element = query_result.singleNodeValue as any;
  let result = false;
  for (let i = 0; i < eventTypes.length; i++) {
    const event = new MouseEvent(eventTypes[i], {
      view: window,
      bubbles: true,
      cancelable: true,
      button, // 0 left; 2 right
    });
    result = element.dispatchEvent(event);
    console.log('simulateMouse', element, { xpath, eventTypes, button }, result);
  }
  return result;
}
