// Global polyfills must be set up BEFORE any other imports
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import 'react-native-url-polyfill/auto';
import 'fast-text-encoding';
import 'react-native-get-random-values';
import '@ethersproject/shims';

import { Buffer } from 'buffer';
import cryptoPolyfill from './cryptoPolyfill';
import { Readable, Writable } from 'stream-browserify';
import EventEmitter from 'eventemitter3';
import http from 'http-browserify';
import https from 'https-browserify';

import { registerRootComponent } from 'expo';
import App from './App';

// Now register the root component directly
registerRootComponent(App);

// Set up globals BEFORE importing the app
global.Buffer = Buffer;
if (typeof global.crypto !== 'object') {
  global.crypto = {};
}
Object.assign(global.crypto, cryptoPolyfill);
global.Readable = Readable;
global.Writable = Writable;
global.EventEmitter = EventEmitter;
global.http = http;
global.https = https;
