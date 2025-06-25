(function() {
    'use strict';

    // --- Core Simulation Classes (Modern ES6) ---

    class EventLoop {
        constructor() {
            this._events = [];
            this._current = undefined;
        }

        push(ev) {
            ev.time = (this._current ? this._current.time : 0) + ev.delay;
            this._events.push(ev);
            this._events.sort((a, b) => a.time - b.time);
        }

        pushImmediate(ev) {
            ev.time = this._current ? this._current.time : 0;
            this._events.unshift(ev);
        }

        nextEventDelay() {
            return (this._current && this._events.length) ? this._events[0].time - this._current.time : 0;
        }

        execute() {
            this._current = this._events.shift();
            this._current.run();
        }

        empty() {
            return this._events.length === 0;
        }
    }

    class Producer {
        constructor(eventLoop, consumer, { delay = [1000, 1000], count = 50 }) {
            this._eventLoop = eventLoop;
            this._consumer = consumer;
            this._state = 'paused';
            this._delay = { range: delay, value: this._rand(...delay) };
            this._count = count;
            this._chunk = { id: 0, progress: 0 };
            this._produced = 0;
            this._backpressure = false;

            this._consumer.subOnDrain(() => {
                this._backpressure = false;
                this.resume();
            });
        }
        
        _rand(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }

        toJSON() { return { state: this._state, chunk: this._chunk, backpressure: this._backpressure }; }

        updateDelay(newDelay) {
            this._delay.range = newDelay;
            this._delay.value = this._rand(...newDelay);
        }

        resume() {
            this._state = 'resuming';
            this._eventLoop.pushImmediate({ run: () => this._produce() });
        }

        _produce() {
            if (this._chunk === null) return this._end();
            this._state = 'producing';

            if (this._chunk.progress === 100) {
                this._delay.value = this._rand(...this._delay.range);
                this._produced++;
                this._eventLoop.push({ delay: 0, run: () => this._push() });
            } else {
                this._chunk.progress += 10;
                this._eventLoop.push({ delay: this._delay.value / 10, run: () => this._produce() });
            }
        }

        _push() {
            this._state = 'pushing';
            this._eventLoop.pushImmediate({
                run: () => {
                    this._backpressure = !this._consumer.write(this._chunk);
                    this._chunk = (this._produced < this._count) ? { id: this._chunk.id + 1, progress: 0 } : null;
                    if (this._backpressure) this._state = 'paused';
                    else this._produce();
                }
            });
        }

        _end() {
            this._state = 'ended';
            this._backpressure = false;
            this._eventLoop.push({ delay: 0, run: () => this._consumer.write(null) });
        }
    }

    class Consumer {
        constructor(eventLoop, { delay = [2000, 2000], capacity = 3 }) {
            this._eventLoop = eventLoop;
            this._state = 'idling';
            this._delay = { range: delay, value: this._rand(...delay) };
            this._queue = [];
            this._queueCap = capacity;
            this._chunk = undefined;
            this._draining = false;
            this._drainListeners = [];
            this._endCalled = false;
        }

        _rand(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }

        toJSON() { return { state: this._state, chunk: this._chunk, queue: { cap: this._queueCap, chunks: this._queue }, draining: this._draining }; }

        updateDelay(newDelay) {
            this._delay.range = newDelay;
            this._delay.value = this._rand(...newDelay);
        }

        write(chunk) {
            if (chunk === null) {
                this.end();
                return false;
            }
            this._queue.push(chunk);
            if (this._state === 'idling') this._resume();
            return this._queue.length < this._queueCap;
        }

        subOnDrain(cb) { this._drainListeners.push(cb); }
        
        end() { this._endCalled = true; }

        _resume() {
            this._state = 'resuming';
            this._eventLoop.pushImmediate({ run: () => this._pull() });
        }

        _pull() {
            this._state = 'pulling';
            this._draining = (this._queue.length === this._queueCap);
            if (this._draining) this._drainListeners.forEach(cb => cb());
            
            this._chunk = this._queue.shift();
            this._eventLoop.pushImmediate({ run: () => this._consume() });
        }

        _consume() {
            this._state = this._endCalled ? 'flushing' : 'consuming';
            this._draining = false;

            if (this._chunk.progress === 0) {
                this._delay.value = this._rand(...this._delay.range);
                this._eventLoop.push({
                    delay: 0,
                    run: () => {
                        if (this._queue.length === 0) {
                            this._chunk = undefined;
                            this._state = this._endCalled ? 'finished' : 'idling';
                        } else {
                            this._pull();
                        }
                    }
                });
            } else {
                this._chunk.progress -= 10;
                this._eventLoop.push({ delay: this._delay.value / 10, run: () => this._consume() });
            }
        }
    }

    class Renderer {
        constructor(canvas, dimX, dimY) {
            this._ctx = canvas.getContext('2d');
            this._width = canvas.width;
            this._height = canvas.height;
            this._dimX = dimX;
            this._dimY = dimY;
            this._unitX = this._width / this._dimX;
            this._unitY = this._height / this._dimY;

            this._prodW = 4; this._consW = 4; this._chunkW = 0.8;
            this._prodH = 1.6; this._consH = 1.6; this._chunkH = 0.8; this._queueW = 0.8;
        }

        clear() { this._ctx.clearRect(0, 0, this._width, this._height); }
        
        drawText(message, x, y, options = {}) {
            x *= this._unitX; y *= this._unitY;
            this._ctx.save();
            this._ctx.fillStyle = options.color || '#FFFFFF';
            this._ctx.font = options.font || `${this._unitY * 0.4}px Segoe UI`;
            this._ctx.textAlign = options.align || 'left';
            this._ctx.fillText(message, x, y);
            this._ctx.restore();
        }

        drawRect(x, y, w, h, options = {}) {
            this._ctx.fillStyle = options.color || '#000';
            this._ctx.fillRect(x * this._unitX, y * this._unitY, w * this._unitX, h * this._unitY);
        }

        _drawComponent(x, y, w, h, text, state) {
            this.drawRect(x, y, w, h, { color: '#2c2c2c' });
            const title = state.charAt(0).toUpperCase() + state.slice(1);
            this.drawText(title, x + w / 2, y + h * 0.3, { align: 'center' });
            if (text) this.drawText(text, x + w / 2, y + h * 0.8, { align: 'center', color: '#ccc' });
        }

        _drawChunk(chunk, x, y) {
            const color1 = '#03dac6'; const color2 = '#bb86fc';
            const payloadColor = (chunk.id % 2) ? color1 : color2;
            this.drawRect(x, y, this._chunkW, this._chunkH, { color: '#444444' });
            this.drawRect(x, y, this._chunkW * chunk.progress / 100, this._chunkH, { color: payloadColor });
            this.drawText(chunk.id, x + this._chunkW / 2, y + this._chunkH * 0.6, { align: 'center', color: '#000' });
        }

        _drawQueue(queue, offset = 0) {
            const x = (this._dimX - this._queueW) / 2;
            const y = this._prodH + 1;
            this.drawRect(x - 0.1, y - 0.1, this._queueW + 0.2, queue.cap + 0.2, { color: '#121212' });
            queue.chunks.forEach((chunk, i) => {
                this._drawChunk(chunk, x, y + queue.cap - i - 1 - offset);
            });
        }
        
        // Removed _drawPauseHint() as requested

        draw(scene) {
            this.clear();
            const { producer, consumer } = scene;
            const prodX = (this._dimX - this._prodW) / 2;
            const consY = this._prodH + 1 + consumer.queue.cap + 1;
            const consX = (this._dimX - this._consW) / 2;

            this._drawComponent(prodX, 0, this._prodW, this._prodH, 'Producer', producer.state);
            this._drawComponent(consX, consY, this._consW, this._consH, 'Consumer', consumer.state);
            
            if (producer.state === 'producing') this._drawChunk(producer.chunk, (this._dimX - this._chunkW) / 2, this._prodH);
            if (consumer.state === 'consuming' || consumer.state === 'flushing') this._drawChunk(consumer.chunk, (this._dimX - this._chunkW) / 2, consY - 1);

            this._drawQueue(consumer.queue);
            // No call to _drawPauseHint() here
        }
    }

    class Model {
        constructor(eventLoop, producer, consumer, renderer) {
            this._eventLoop = eventLoop;
            this._producer = producer;
            this._consumer = consumer;
            this._renderer = renderer;
            this._state = 'initial';
            this._tick = null;
        }

        start() {
            if (this._state === 'initial') this._producer.resume();
            if (this._state !== 'initial' && this._state !== 'paused') return;
            this._state = 'running';

            const run = () => {
                delete this._tick;
                if (this._eventLoop.empty()) {
                    this._state = 'finished';
                    this._renderer.draw(this._getState()); // Final render
                    return;
                }
                this._next();
                if (this._state === 'running') {
                    this._tick = setTimeout(run, this._eventLoop.nextEventDelay());
                }
            };
            run();
        }

        pause() {
            if (this._state !== 'running') return;
            if (this._tick) clearTimeout(this._tick);
            this._state = 'paused';
        }

        updateSpeeds(producerDelay, consumerDelay) {
            this._producer.updateDelay(producerDelay);
            this._consumer.updateDelay(consumerDelay);
            if (this._state === 'paused') {
                this._renderer.draw(this._getState());
            } else if (this._state === 'running') {
                // If running, the next event will pick up the new delay values
            }
        }


        isRunning() { return this._state === 'running'; }
        isPaused() { return this._state === 'paused'; }
        _next() {
            this._eventLoop.execute();
            this._renderer.draw(this._getState());
        }
        _getState() {
            return { producer: this._producer.toJSON(), consumer: this._consumer.toJSON() };
        }
    }

    // --- UI Controller ---

    let model;
    const canvasId = 'canvas';
    const dimX = 7;

    const defaultOptions = {
        // Adjusted "Fast" speeds for better visibility
        fastProducer: { producerDelay: [300, 400], consumerDelay: [800, 1200] },
        fastConsumer: { producerDelay: [800, 1200], consumerDelay: [300, 400] },
        // New "Slow" speeds
        slowProducer: { producerDelay: [1000, 2000], consumerDelay: [500, 1000] },
        slowConsumer: { producerDelay: [500, 1000], consumerDelay: [800, 1200] }
    };

    function start(options) {
        if (model && model.isRunning()) model.pause();

        if (!model || options.resetState) {
            const canvasContainer = document.getElementById('canvas-container');
            const canvas = document.getElementById(canvasId);
            
            const dimY = 5 + (options.queueCapacity || 4);
            canvas.width = canvasContainer.clientWidth;
            canvas.height = canvas.width * (dimY / dimX);

            const loop = new EventLoop();
            const consumer = new Consumer(loop, {
                delay: options.consumerDelay,
                capacity: options.queueCapacity
            });
            const producer = new Producer(loop, consumer, {
                delay: options.producerDelay,
                count: options.chunksCount
            });
            
            model = new Model(loop, producer, consumer, new Renderer(canvas, dimX, dimY));
        } else {
            model.updateSpeeds(options.producerDelay, options.consumerDelay);
        }
        
        model.start();
        updateOptionsPane(options);
    }

    function updateOptionsPane(options) {
        document.getElementById('chunks-count').value = options.chunksCount;
        document.getElementById('queue-cap').value = options.queueCapacity;
    }

    function readOptionsPane() {
        return {
            chunksCount: +document.getElementById('chunks-count').value,
            queueCapacity: +document.getElementById('queue-cap').value
        };
    }
    
    function rand(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }

    // --- Event Listeners ---
    document.getElementById('options-apply').addEventListener('click', () => {
        const options = { ...readOptionsPane(), resetState: true };
        // When applying, use current speeds or default if model doesn't exist
        options.producerDelay = model ? model._producer._delay.range : defaultOptions.fastProducer.producerDelay;
        options.consumerDelay = model ? model._consumer._delay.range : defaultOptions.fastProducer.consumerDelay;
        start(options);
    });

    document.getElementById('reset').addEventListener('click', () => {
        const options = { ...readOptionsPane(), resetState: true };
        options.producerDelay = defaultOptions.fastProducer.producerDelay;
        options.consumerDelay = defaultOptions.fastProducer.consumerDelay;
        start(options);
    });
    
    document.getElementById('preset-fast-producer').addEventListener('click', () => {
        const options = { ...readOptionsPane(), ...defaultOptions.fastProducer };
        start(options);
    });

    document.getElementById('preset-fast-consumer').addEventListener('click', () => {
        const options = { ...readOptionsPane(), ...defaultOptions.fastConsumer };
        start(options);
    });

    // New Event Listeners for Slow Presets
    document.getElementById('preset-slow-producer').addEventListener('click', () => {
        const options = { ...readOptionsPane(), ...defaultOptions.slowProducer };
        start(options);
    });

    document.getElementById('preset-slow-consumer').addEventListener('click', () => {
        const options = { ...readOptionsPane(), ...defaultOptions.slowConsumer };
        start(options);
    });

    document.getElementById('preset-random').addEventListener('click', () => {
        const options = {
            chunksCount: rand(6, 20),
            queueCapacity: rand(2, 6),
            // Adjusted random range to allow for wider variations including slower speeds
            producerDelay: [rand(500, 2500), rand(2501, 5000)], 
            consumerDelay: [rand(500, 2500), rand(2501, 5000)], 
            resetState: true
        };
        start(options);
    });
    
    document.getElementById(canvasId).addEventListener('click', () => {
        if (!model) return;
        if (model.isRunning()) model.pause();
        else if (model.isPaused()) model.start();
    });

    document.getElementById('pause-button').addEventListener('click', () => {
        if (!model) return;
        if (model.isRunning()) {
            model.pause();
        } else if (model.isPaused()) {
            model.start();
        }
    });
    
    document.getElementById('reset').click();

})();