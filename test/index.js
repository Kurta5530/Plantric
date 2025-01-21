import { Lyvo }  from '../src/lyvo.js';

const lyvo = new Lyvo();

const workflow = lyvo.generateWorkflow('');
const result = lyvo.execute(workflow, {
    callback (node) {
        console.log(node);
    }
});