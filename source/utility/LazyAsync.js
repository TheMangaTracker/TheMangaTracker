'use strict';

var LazyAsync;

define([], function() {
    let CONTROLLER = Symbol('controller');
    let IS_BUSY = Symbol('isBusy');
    let IS_DISCARDED = Symbol('isDiscarded');

    LazyAsync = function(controller) {
        if (!(this instanceof LazyAsync)) {
            throw new Error('new keyword required');
        }
        
        this[CONTROLLER] = controller;
        this[IS_BUSY] = false;
        this[IS_DISCARDED] = false;
    };

    LazyAsync.prototype = {
        get isBusy() {
            return this[IS_BUSY];
        },    

        request(callbacks) {
            if (this[IS_DISCARDED]) {
                throw Error('Cannot request after .discard()');    
            }

            if (this[IS_BUSY]) {
                throw Error('Cannot request when .isBusy');    
            }

            let provide = function(value) {
                if (this[IS_DISCARDED]) {
                    return;    
                }
                
                this[IS_BUSY] = false;

                callbacks.whenProvided(value); 
            }.bind(this);

            let finish = function() {
                if (this[IS_DISCARDED]) {
                    return;    
                }

                this[IS_BUSY] = false;

                if (callbacks.whenFinished !== undefined) {
                    callbacks.whenFinished(); 
                }
            }.bind(this);
            
            let error = function(message) {
                if (this[IS_DISCARDED]) {
                    return;    
                }

                this[IS_BUSY] = false;

                if (callbacks.whenError !== undefined) {
                    callbacks.whenError(message); 
                }
                if (callbacks.whenFinished !== undefined) {
                    callbacks.whenFinished(); 
                }
            }.bind(this);

            this[IS_BUSY] = true;
            this[CONTROLLER].whenRequested(provide, finish, error);
        },

        discard() {
            if (!this[IS_DISCARDED]) {
                this[IS_DISCARDED] = true;
                this[IS_BUSY] = false;
                if (this[CONTROLLER].whenDiscarded !== undefined) {
                    this[CONTROLLER].whenDiscarded();
                }
            }
        },
    };
});
