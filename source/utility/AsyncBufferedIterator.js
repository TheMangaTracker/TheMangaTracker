'use strict';

var AsyncBufferedIterator;

define([], function() {
    let CONTROLLER = Symbol('controller');
    let ITEMS = Symbol('items');
    let CONSUMERS = Symbol('consumers');
    let IS_ACQUIRING_MORE = Symbol('isAcquiringMore');
    let IS_CLOSED = Symbol('isClosed');
    let PUMP = Symbol('pump');

    AsyncBufferedIterator = function(controller) {
        if (!(this instanceof AsyncBufferedIterator)) {
            return new AsyncBufferedIterator(controller);     
        }
        
        this[CONTROLLER] = controller;
        this[ITEMS] = [];
        this[CONSUMERS] = [];
        this[IS_ACQUIRING_MORE] = false;
        this[IS_CLOSED] = false;
    };

    AsyncBufferedIterator.prototype[PUMP] = function() {
        while (this[CONSUMERS].length > 0 && this[ITEMS].length > 0) {
            let consumer = this[CONSUMERS].shift();
            let item = this[ITEMS].shift();
            consumer.whenProvidedNext(item);
        } 
        
        if (this[IS_CLOSED]) {
            while (this[CONSUMERS].length > 0) {
                let consumer = this[CONSUMERS].shift();
                if (consumer.whenNoNext !== undefined) {
                    consumer.whenNoNext();
                }
            } 
        } else if (this[CONSUMERS].length > 0 && !this[IS_ACQUIRING_MORE]) {
            this[IS_ACQUIRING_MORE] = true;
            this[CONTROLLER].whenNeedMore(function(newItems) {
                this[IS_ACQUIRING_MORE] = false;
                for (let newItem of newItems) {
                    this[ITEMS].push(newItem);
                }   
                this[PUMP]();
            }.bind(this), function() {
                this[IS_ACQUIRING_MORE] = false;
                this.close();
            }.bind(this));     
        }
    };

    AsyncBufferedIterator.prototype.requestNext = function(consumer) {
        this[CONSUMERS].push(consumer);
        this[PUMP]();
    };

    AsyncBufferedIterator.prototype.close = function() {
        if (!this[IS_CLOSED]) {
            this[IS_CLOSED] = true;
            if (this[CONTROLLER].whenClosed !== undefined) {
                this[CONTROLLER].whenClosed();
            }
            this[PUMP]();
        }
    };
});
