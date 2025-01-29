export class MessageQueue {
    constructor() {
        this.queue = [];
        this.queueIndex = {};
    }

    pub(evtName, evtBody) {
        this.queue.push({
            evtName: evtName,
            [evtName]: {
                evtBody,
            },
        });
        this.queueIndex[evtName] = this.queue.length - 1;
        cb(this.queue[index]);
        // const p = new Promise((resolve, reject) => {
        //     setTimeout(() => {
        //         job();
        //         resolve();
        //     }, 1000);
        // })

        // p.then(() => {
        //     this.sub(evtName, {
        //         status: 'succced',
        //     },);
        //     this.queue.pop();
        // })
    }

    sub(evtName, cb) {
        // const index = this.queueIndex[evtName];
        // if(index !== undefined){
        //     cb(this.queue[index]);
        // }
    }

}