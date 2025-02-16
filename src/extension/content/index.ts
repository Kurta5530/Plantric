declare const lyvo: any;

if (!(window as any).lyvo) {
  (window as any).lyvo = { lastMouseX: 0, lastMouseY: 0 };
}

lyvo.sub = function (event: string, callback: Function) {
  if (!lyvo.subListeners) {
    lyvo.subListeners = {};
  }
  if (event && callback) {
    lyvo.subListeners[event] = callback;
  }
};

document.addEventListener('mousemove', (event) => {
  lyvo.lastMouseX = event.clientX;
  lyvo.lastMouseY = event.clientY;
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  (async () => {
    try {
      switch (request.type) {
        case 'lyvo:message': {
          let result = null;
          if (lyvo.subListeners && lyvo.subListeners[request.event]) {
            try {
              result = await lyvo.subListeners[request.event](request.params);
            } catch (e) {
              console.log(e);
            }
          }
          sendResponse(result);
          break;
        }
        case 'page:getDetailLinks': {
          let result = await lyvo.getDetailLinks(request.search);
          sendResponse(result);
          break;
        }
        case 'page:getContent': {
          let result = await lyvo.getContent(request.search);
          sendResponse(result);
          break;
        }
        case 'computer:key': {
          sendResponse(key(request));
          break;
        }
        case 'computer:type': {
          sendResponse(type(request));
          break;
        }
        case 'computer:mouse_move': {
          sendResponse(mouse_move(request));
          break;
        }
        case 'computer:left_click': {
          sendResponse(simulateMouseEvent(request, ['mousedown', 'mouseup', 'click'], 0));
          break;
        }
        case 'computer:right_click': {
          sendResponse(simulateMouseEvent(request, ['mousedown', 'mouseup', 'contextmenu'], 2));
          break;
        }
        case 'computer:double_click': {
          sendResponse(
            simulateMouseEvent(
              request,
              ['mousedown', 'mouseup', 'click', 'mousedown', 'mouseup', 'click', 'dblclick'],
              0
            )
          );
          break;
        }
        case 'computer:left_click_drag': {
          sendResponse(left_click_drag(request));
          break;
        }
        case 'computer:scroll_to': {
          sendResponse(scroll_to(request));
          break;
        }
        case 'computer:cursor_position': {
          sendResponse({ coordinate: [lyvo.lastMouseX, lyvo.lastMouseY] });
          break;
        }
      }
    } catch (e) {
      console.log('onMessage error', e);
      sendResponse(false);
    }
  })();
  return true;
});

function key(request: any) {
  const event = new KeyboardEvent(request.keyEventType || 'keydown', {
    key: request.key,
    ctrlKey: request.ctrlKey,
    altKey: request.altKey,
    shiftKey: request.shiftKey,
    metaKey: request.metaKey,
    bubbles: true,
    cancelable: true,
  });
  let coordinate = request.coordinate as [number, number];
  let element = (document.activeElement ||
    document.elementFromPoint(coordinate[0], coordinate[1])) as any;
  if (element && element.focus) {
    element.focus();
  }
  let result = element?.dispatchEvent(event);
  console.log('key', element, request, result);
  return result;
}

function type(request: any) {
  let text = request.text as string;
  let element: any;
  if (request.xpath) {
    let xpath = request.xpath as string;
    let result = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );
    element = result.singleNodeValue;
  } else {
    let coordinate = request.coordinate as [number, number];
    element = document.elementFromPoint(coordinate[0], coordinate[1]) || document.activeElement;
  }
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
  console.log('type', input, request, result);
  return result;
}

function mouse_move(request: any) {
  let coordinate = request.coordinate as [number, number];
  let x = coordinate[0];
  let y = coordinate[1];
  const event = new MouseEvent('mousemove', {
    view: window,
    bubbles: true,
    cancelable: true,
    screenX: x,
    screenY: y,
    clientX: x,
    clientY: y,
  });
  let result = document.body.dispatchEvent(event);
  console.log('mouse_move', document.body, request, result);
  return result;
}

function simulateMouseEvent(request: any, eventTypes: Array<string>, button: 0 | 1 | 2) {
  let element: any;
  let coordinate;
  if (request.xpath) {
    let xpath = request.xpath as string;
    let result = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );
    element = result.singleNodeValue;
  } else {
    let coordinate = request.coordinate as [number, number];
    element = document.elementFromPoint(coordinate[0], coordinate[1]) || document.body;
  }
  const x = coordinate ? coordinate[0] : undefined;
  const y = coordinate ? coordinate[1] : undefined;
  let result = false;
  for (let i = 0; i < eventTypes.length; i++) {
    const event = new MouseEvent(eventTypes[i], {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
      button, // 0 left; 2 right
    });
    result = element.dispatchEvent(event);
    console.log('simulateMouse', element, { ...request, eventTypes, button }, result);
  }
  return result;
}

function scroll_to(request: any) {
  if (request.xpath) {
    let xpath = request.xpath as string;
    let result = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );
    let element = result.singleNodeValue as any;
    element.scrollIntoView({
      behavior: 'smooth'
    });
  } else {
    const to_coordinate = request.to_coordinate as [number, number];
    window.scrollTo({
      left: to_coordinate[0],
      top: to_coordinate[1],
      behavior: 'smooth',
    });
  }
  console.log('scroll_to', request);
}

function left_click_drag(request: any, steps = 10) {
  const from_coordinate = request.from_coordinate as [number, number];
  const to_coordinate = request.to_coordinate as [number, number];
  let startX = from_coordinate[0];
  let startY = from_coordinate[1];
  let endX = to_coordinate[0];
  let endY = to_coordinate[1];
  let element = document.elementFromPoint(startX, startY) || document.body;
  const mouseDownEvent = new MouseEvent('mousedown', {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: startX,
    clientY: startY,
    button: 0,
  });
  element.dispatchEvent(mouseDownEvent);
  for (let i = 1; i <= steps; i++) {
    const intermediateX = startX + (endX - startX) * (i / steps);
    const intermediateY = startY + (endY - startY) * (i / steps);
    const dragEvent = new MouseEvent('mousemove', {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: intermediateX,
      clientY: intermediateY,
      button: 0,
    });
    element.dispatchEvent(dragEvent);
  }
  const mouseUpEvent = new MouseEvent('mouseup', {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: endX,
    clientY: endY,
    button: 0,
  });
  console.log('left_click_drag', request);
  return element.dispatchEvent(mouseUpEvent);
}
