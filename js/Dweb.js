exports.TransportHTTP = require('./TransportHTTP'); // Note this used to cause a problem in bundle I believe
exports.Block = require('./Block');
exports.SmartDict = require("./SmartDict");
exports.KeyPair = require("./KeyPair");
exports.Signature = require("./Signature");
exports.CommonList = require("./CommonList");
exports.AccessControlList = require("./AccessControlList");
exports.KeyChain = require('./KeyChain');
exports.TransportIPFS = require('./TransportIPFS');
//* Later libraries //TODO-REL4 comment out before REL4
exports.StructuredBlock = require('./StructuredBlock');
exports.MutableBlock = require("./MutableBlock");
//*/

exports.table2class = { // Each of these needs a constructor that takes data and is ok with no other parameters, (otherwise define a set of these methods as factories)
    "cl": "CommonList",
    "sb": "StructuredBlock",
    "kc": "KeyChain",
    "kp": "KeyPair",
    "mb": "MutableBlock",
    "acl": "AccessControlList",
    "sd": "SmartDict",
};



Url = require("url"); // Doesnt appear to be needed - also gets node interface which looks different

// Javascript library for dweb
// The crypto uses https://github.com/jedisct1/libsodium.js but https://github.com/paixaop/node-sodium may also be suitable if we move to node

exports.utils = {}; //utility functions
exports.errors = require("./Errors");
exports.transports = {}; // Transports - instances NOT CLASSES of loaded transports

/* Only applicable to HTTP...
    exports.dwebserver = 'localhost';
    //exports.dwebserver = '192.168.1.156';
    exports.dwebport = '4243';
*/
exports.keychains = [];
exports.transportpriority = []; // First on list is top priority

// ==== OBJECT ORIENTED JAVASCRIPT ===============

// Utility function to print a array of items but just show number and last.
exports.utils.consolearr  = (arr) => ((arr && arr.length >0) ? [arr.length+" items inc:", arr[arr.length-1]] : arr );

// Utility functions

exports.utils.mergeTypedArraysUnsafe = function(a, b) { // Take care of inability to concatenate typed arrays
    //http://stackoverflow.com/questions/14071463/how-can-i-merge-typedarrays-in-javascript also has a safe version
    const c = new a.constructor(a.length + b.length);
    c.set(a);
    c.set(b, a.length);
    return c;
};

//TODO-STREAM, use this code and return stream from p_rawfetch that this can be applied to
exports.utils.p_streamToBuffer = function(stream, verbose) {
    // resolve to a promise that returns a stream.
    // Note this comes form one example ...
    // There is another example https://github.com/ipfs/js-ipfs/blob/master/examples/exchange-files-in-browser/public/js/app.js#L102 very different
    return new Promise((resolve, reject) => {
        try {
            let chunks = [];
            stream
                .on('data', (chunk) => { if (verbose) console.log('on', chunk.length); chunks.push(chunk); })
                .once('end', () => { if (verbose) console.log('end chunks', chunks.length); resolve(Buffer.concat(chunks)); })
                .on('error', (err) => { // Note error behavior untested currently
                    console.log("Error event in p_streamToBuffer",err);
                    reject(new Dweb.errors.TransportError('Error in stream'))
                });
            stream.resume();
        } catch (err) {
            console.log("Error thrown in p_streamToBuffer", err);
            reject(err);
        }
    })
}
//TODO-STREAM, use this code and return stream from p_rawfetch that this can be applied to
//TODO-STREAM debugging in streamToBuffer above, copy to here when fixed above
exports.utils.p_streamToBlob = function(stream, mimeType, verbose) {
    // resolve to a promise that returns a stream - currently untested as using Buffer
    return new Promise((resolve, reject) => {
        try {
            let chunks = [];
            stream
                .on('data', (chunk)=>chunks.push(chunk))
                .once('end', () =>
                    resolve(mimeType
                        ? new Blob(chunks, { type: mimeType })
                        : new Blob(chunks)))
                .on('error', (err) => { // Note error behavior untested currently
                    console.log("Error event in p_streamToBuffer",err);
                    reject(new Dweb.errors.TransportError('Error in stream'))
                })
            stream.resume();
        } catch(err) {
            console.log("Error thrown in p_streamToBlob",err);
            reject(err);
        }
    })
}

exports.transport = function(url) {
    /*
    Pick between associated transports based on URL

    url     URL or string that can be parsed into a URL
    returns subclass of Transport that can support this kind of URL or undefined if none.
    throws  Error (should be TransportError but out of scope) if URL parsing fails
    */
    //TODO-efficiency, could parse URL once at higher level and pass URL down
    if (url && (typeof url === 'string')) {
        url = Url.parse(url);    // For efficiency, only parse once.
    }
    return exports.transportpriority.find((t) => t.supports(url))  // First transport that can support this URL
};
