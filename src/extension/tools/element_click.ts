import { Tool, InputSchema, ExecutionContext } from '../../types/action.types';

/**
 * Element click
 */
export class ElementClick implements Tool<any, any> {
  name: string;
  description: string;
  input_schema: InputSchema;

  constructor() {
    this.name = 'element_click';
    this.description = 'click element';
    this.input_schema = {
      type: 'object',
      properties: {
        element: {
          type: 'string',
          description: 'Element title',
        },
      },
      required: ['element'],
    };
  }

  async execute(context: ExecutionContext, params: any): Promise<any> {
    if (typeof params !== 'object' || params === null || !('content' in params)) {
      throw new Error('Invalid parameters. Expected an object with a "content" property.');
    }
    // button, span, lable, a, img, input, textarea, strlen ＜ 30
    // TODO ....
    throw new Error('Not implemented');
  }
}

function xpath(element: any) {
  return (function (element) {
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
        return (
          arguments.callee(element.parentNode) +
          '/' +
          element.tagName.toLowerCase() +
          '[' +
          ix +
          ']'
        );
      } else if (sibling.nodeType == 1 && sibling.tagName == element.tagName) {
        ix++;
      }
    }
  })(arguments[0]);
}
