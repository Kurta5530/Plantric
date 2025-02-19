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
  if (element == document.body) {
    return '/html/' + element.tagName.toLowerCase();
  }
  if (element.parentNode instanceof ShadowRoot) {
    let shadowRoot = element.parentNode as ShadowRoot;
    let parent = (shadowRoot.getRootNode() as any).host;
    return xpath(parent) + '//' + element.tagName.toLowerCase();
  } else {
    let sp;
    let parent;
    if (element.parentNode instanceof ShadowRoot) {
      sp = '//';
      let shadowRoot = element.parentNode as ShadowRoot;
      parent = (shadowRoot.getRootNode() as any).host;
    } else {
      sp = '/';
      parent = element.parentNode;
    }
    let siblings = parent.childNodes;
    if (siblings.length == 1) {
      return xpath(parent) + sp + element.tagName.toLowerCase();
    } else {
      let ix = 1;
      for (let i = 0, l = siblings.length; i < l; i++) {
        let sibling = siblings[i];
        if (sibling == element) {
          return xpath(parent) + sp + element.tagName.toLowerCase() + '[' + ix + ']';
        } else if (sibling.nodeType == 1 && sibling.tagName == element.tagName) {
          ix++;
        }
      }
      return '';
    }
  }
}

export function queryWithXpath(xpath: string) {
  let xpaths = xpath.split('//');
  if (xpaths.length == 1) {
    return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
      .singleNodeValue;
  }
  let element: any = document;
  for (let i = 0; i < xpaths.length; i++) {
    let _element = null;
    if (element instanceof ShadowRoot) {
      let _xpaths = xpaths[i].split('/');
      let current = _xpaths[0].toLowerCase();
      let ix = 1;
      for (let j = 0; j < element.childNodes.length; j++) {
        let tagName = (element.childNodes[j] as any).tagName;
        if (!tagName) {
          ix++;
          continue;
        }
        tagName = tagName.toLowerCase();
        if (current == tagName || current == tagName + '[' + ix + ']') {
          element = element.childNodes[j];
          let _xpath = _xpaths.slice(1).join('/');
          _element = document.evaluate(
            _xpath,
            element,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          ).singleNodeValue as any;
          break;
        } else {
          ix++;
        }
      }
    } else {
      _element = document.evaluate(
        xpaths[i],
        element,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue as any;
    }
    if (!_element) {
      return null;
    }
    if (_element.shadowRoot) {
      element = _element.shadowRoot;
    } else {
      element = _element;
    }
  }
  return element != document ? element : null;
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
