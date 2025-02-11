import { ScreenshotResult } from '../../types/tools.types';
import { getPageSize, sleep } from '../utils';

export async function key(tabId: number, key: string, coordinate?: [number, number]): Promise<any> {
  if (!coordinate) {
    coordinate = (await cursor_position(tabId)).coordinate;
  }
  await mouse_move(tabId, coordinate);
  let mapping: { [key: string]: string } = {};
  let keys = key.replace(/\s+/g, ' ').split(' ');
  let result;
  for (let i = 0; i < keys.length; i++) {
    let _key = keys[i];
    let keyEvents = {
      key: '',
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
    };
    if (_key.indexOf('+') > -1) {
      let mapped_keys = _key.split('+').map((k) => mapping[k] || k);
      for (let i = 0; i < mapped_keys.length - 1; i++) {
        let k = mapped_keys[i].toLowerCase();
        if (k == 'ctrl' || k == 'control') {
          keyEvents.ctrlKey = true;
        } else if (k == 'alt' || k == 'option') {
          keyEvents.altKey = true;
        } else if (k == 'shift') {
          keyEvents.shiftKey = true;
        } else if (k == 'meta' || k == 'command') {
          keyEvents.metaKey = true;
        } else {
          console.log('Unknown Key: ' + k);
        }
      }
      keyEvents.key = mapped_keys[mapped_keys.length - 1];
    } else {
      keyEvents.key = mapping[_key] || _key;
    }
    if (!keyEvents.key) {
      continue;
    }
    result = await chrome.tabs.sendMessage(tabId, {
      type: 'computer:key',
      coordinate,
      ...keyEvents,
    });
    await sleep(100);
  }
  return result;
}

export async function type(tabId: number, text: string, coordinate?: [number, number]): Promise<any> {
  if (!coordinate) {
    coordinate = (await cursor_position(tabId)).coordinate;
  }
  await mouse_move(tabId, coordinate);
  return await chrome.tabs.sendMessage(tabId, {
    type: 'computer:type',
    text,
    coordinate,
  });
}

export async function clear_input(tabId: number, coordinate?: [number, number]): Promise<any> {
  if (!coordinate) {
    coordinate = (await cursor_position(tabId)).coordinate;
  }
  await mouse_move(tabId, coordinate);
  return await chrome.tabs.sendMessage(tabId, {
    type: 'computer:type',
    text: '',
    coordinate,
  });
}

export async function mouse_move(tabId: number, coordinate: [number, number]): Promise<any> {
  return await chrome.tabs.sendMessage(tabId, {
    type: 'computer:mouse_move',
    coordinate,
  });
}

export async function left_click(tabId: number, coordinate?: [number, number]): Promise<any> {
  if (!coordinate) {
    coordinate = (await cursor_position(tabId)).coordinate;
  }
  return await chrome.tabs.sendMessage(tabId, {
    type: 'computer:left_click',
    coordinate,
  });
}

export async function left_click_drag(tabId: number, coordinate: [number, number]): Promise<any> {
  let from_coordinate = (await cursor_position(tabId)).coordinate;
  return await chrome.tabs.sendMessage(tabId, {
    type: 'computer:left_click_drag',
    from_coordinate,
    to_coordinate: coordinate,
  });
}

export async function right_click(tabId: number, coordinate?: [number, number]): Promise<any> {
  if (!coordinate) {
    coordinate = (await cursor_position(tabId)).coordinate;
  }
  return await chrome.tabs.sendMessage(tabId, {
    type: 'computer:right_click',
    coordinate,
  });
}

export async function double_click(tabId: number, coordinate?: [number, number]): Promise<any> {
  if (!coordinate) {
    coordinate = (await cursor_position(tabId)).coordinate;
  }
  return await chrome.tabs.sendMessage(tabId, {
    type: 'computer:double_click',
    coordinate,
  });
}

export async function screenshot(windowId: number): Promise<ScreenshotResult> {
  let dataUrl = await chrome.tabs.captureVisibleTab(windowId as number, {
    format: 'jpeg', // jpeg / png
    quality: 50, // 0-100
  });
  let data = dataUrl.substring(dataUrl.indexOf('base64,') + 7);
  return {
    image: {
      type: 'base64',
      media_type: dataUrl.indexOf('image/png') > -1 ? 'image/png' : 'image/jpeg',
      data: data,
    },
  };
}

export async function scroll_to(tabId: number, coordinate: [number, number]): Promise<any> {
  let from_coordinate = (await cursor_position(tabId)).coordinate;
  return await chrome.tabs.sendMessage(tabId, {
    type: 'computer:scroll_to',
    from_coordinate,
    to_coordinate: coordinate,
  });
}

export async function cursor_position(tabId: number): Promise<{
  coordinate: [number, number];
}> {
  let result: any = await chrome.tabs.sendMessage(tabId, {
    type: 'computer:cursor_position',
  });
  return { coordinate: result.coordinate as [number, number] };
}

export async function size(tabId?: number): Promise<[number, number]> {
  return await getPageSize(tabId);
}
