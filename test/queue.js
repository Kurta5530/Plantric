import { MessageQueue }  from '../src/mq.js';

const mq = new MessageQueue();

const myJob = () => {
    setTimeout(() => {
        console.log('myjob done, send a message');
        mq.pub(`job-done`, {
            a: 'my job done'
        });
    }, 2000);
}

myJob();

mq.sub('job-done', (job) => {
    console.log('receied job done msg');
})