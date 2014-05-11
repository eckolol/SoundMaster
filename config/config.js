"use strict"


var test = require('./env/test'),
    prod = require('./env/prod'),
    dev  = require('./env/dev');

module.exports = function(){
    switch(process.env.NODE_ENV){
        case 'development':
            return dev;

        case 'test':
            return test;

        case 'production':
            return prod;

        default:
            return prod;
    }
};
