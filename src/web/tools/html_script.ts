import { ElementRect } from '../../types/tools.types';

export function exportFile(filename: string, type: string, content: string) {
  const blob = new Blob([content], { type: type });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

export function xpath(element: any): string {
  if (element.id !== '') {
    return '//*[@id=\"' + element.id + '\"]';
  }
  if (element == document.body) {
    return '/html/' + element.tagName.toLowerCase();
  }
  var ix = 1,
    siblings = element.parentNode.childNodes;
  for (var i = 0, l = siblings.length; i < l; i++) {
    var sibling = siblings[i];
    if (sibling == element) {
      return xpath(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + ix + ']';
    } else if (sibling.nodeType == 1 && sibling.tagName == element.tagName) {
      ix++;
    }
  }
  return '';
}

export function queryWithXpath(xpath: string) {
  let result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
  return result.singleNodeValue;
}

export function queryAllWithXpath(xpath: string): Array<any> {
  let result = document.evaluate(
    xpath,
    document,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null
  );
  let elements = [];
  for (let i = 0; i < result.snapshotLength; i++) {
    elements.push(result.snapshotItem(i));
  }
  return elements;
}

export function getDropdownOptions(xpath: string): {
  options: Array<{
    index: number;
    text: string;
    value?: string;
  }>;
  id?: string;
  name?: string;
} | null {
  const select = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    .singleNodeValue as any;
  if (!select) {
    return null;
  }
  return {
    options: Array.from(select.options).map((opt: any) => ({
      index: opt.index,
      text: opt.text.trim(),
      value: opt.value,
    })),
    id: select.id,
    name: select.name,
  };
}

export function selectDropdownOption(xpath: string, text: string): any {
  const select = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    .singleNodeValue as any;
  if (!select || select.tagName.toUpperCase() !== 'SELECT') {
    return { success: false, error: 'Select not found or invalid element type' };
  }
  const option = Array.from(select.options).find((opt: any) => opt.text.trim() === text) as any;
  if (!option) {
    return {
      success: false,
      error: 'Option not found',
      availableOptions: Array.from(select.options).map((o: any) => o.text.trim()),
    };
  }
  select.value = option.value;
  select.dispatchEvent(new Event('change'));
  return {
    success: true,
    selectedValue: option.value,
    selectedText: option.text.trim(),
  };
}

/**
 * Extract the elements related to html operability and wrap them into pseudo-html code.
 */
export function extractOperableElements(): string {
  // visible
  const isElementVisible = (element: any) => {
    const style = window.getComputedStyle(element);
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      element.offsetWidth > 0 &&
      element.offsetHeight > 0
    );
  };

  // element original index
  const getElementIndex = (element: any) => {
    const xpath = document.evaluate(
      'preceding::*',
      element,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    );
    return xpath.snapshotLength;
  };

  // exclude
  const addExclude = (excludes: any, children: any) => {
    for (let i = 0; i < children.length; i++) {
      excludes.push(children[i]);
      if (children[i].children) {
        addExclude(excludes, children[i].children);
      }
    }
  };

  // { pseudoId: element }
  let elementMap: any = {};
  let nextId = 1;
  let elements = [] as any[];
  let excludes = [] as any[];

  // operable element
  const operableSelectors = 'a, button, input, textarea, select';
  document.querySelectorAll(operableSelectors).forEach((element: any) => {
    if (isElementVisible(element) && excludes.indexOf(element) == -1) {
      const id = nextId++;
      elementMap[id.toString()] = element;

      const tagName = element.tagName.toLowerCase();
      const attributes = Array.from(element.attributes)
        .filter((attr: any) =>
          ['id', 'name', 'type', 'value', 'href', 'title', 'placeholder'].includes(attr.name)
        )
        .map((attr: any) => `${attr.name == 'id' ? 'target' : attr.name}="${attr.value}"`)
        .join(' ');

      elements.push({
        originalIndex: getElementIndex(element),
        id: id,
        html: `<${tagName} id="${id}" ${attributes}>${tagName == 'select' ? element.innerHTML : element.innerText || ''}</${tagName}>`,
      });

      addExclude(excludes, element.children);
    }
  });

  // short text element
  const textWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, {
    acceptNode: function (node: any) {
      if (node.matches(operableSelectors) || excludes.indexOf(node) != -1) {
        // skip
        return NodeFilter.FILTER_SKIP;
      }

      // text <= 100
      const text = node.innerText?.trim();
      if (
        isElementVisible(node) &&
        text &&
        text.length <= 100 &&
        text.length > 0 &&
        node.children.length === 0
      ) {
        return NodeFilter.FILTER_ACCEPT;
      }

      // skip
      return NodeFilter.FILTER_SKIP;
    },
  });

  let currentNode: any;
  while ((currentNode = textWalker.nextNode())) {
    const id = nextId++;
    elementMap[id.toString()] = currentNode;

    const tagName = currentNode.tagName.toLowerCase();
    elements.push({
      originalIndex: getElementIndex(currentNode),
      id: id,
      html: `<${tagName} id="${id}">${currentNode.innerText.trim()}</${tagName}>`,
    });
  }

  // element sort
  elements.sort((a, b) => a.originalIndex - b.originalIndex);

  // cache
  (window as any).operableElementMap = elementMap;
  // pseudo html
  return elements.map((e) => e.html).join('\n');
}

export function clickOperableElement(id: any): any {
  let element = (window as any).operableElementMap[id];
  if (!element) {
    return false;
  }
  if (element.click) {
    element.click();
  } else {
    element.dispatchEvent(
      new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
      })
    );
  }
  return true;
}

export function getOperableElementRect(id: any): ElementRect | null {
  let element = (window as any).operableElementMap[id];
  if (!element) {
    return null;
  }
  const rect = element.getBoundingClientRect();
  return {
    left: rect.left + window.scrollX,
    top: rect.top + window.scrollY,
    right: rect.right + window.scrollX,
    bottom: rect.bottom + window.scrollY,
    width: rect.right - rect.left,
    height: rect.bottom - rect.top,
  } as ElementRect;
}
