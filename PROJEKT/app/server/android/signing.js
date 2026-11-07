/* SHA-256/HMAC nach FIPS 180-4/RFC 2104. ES5 und UTF-8, ohne Plattform-Cryptoannahme. */
MischWerkModules.attachAndroidSigning = function (runtime) {
    'use strict';
    var constants = [
        0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
        0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
        0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
        0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
        0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
        0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
        0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
        0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
    ];
    function utf8(text) {
        var bytes = [], i, code, next;
        for (i = 0; i < text.length; i += 1) {
            code = text.charCodeAt(i);
            if (code >= 0xd800 && code <= 0xdbff) {
                next = text.charCodeAt(i + 1);
                if (next >= 0xdc00 && next <= 0xdfff) { code = 0x10000 + ((code - 0xd800) << 10) + next - 0xdc00; i += 1; }
                else { code = 0xfffd; }
            } else if (code >= 0xdc00 && code <= 0xdfff) { code = 0xfffd; }
            if (code < 128) { bytes.push(code); }
            else if (code < 2048) { bytes.push(192 | code >>> 6, 128 | code & 63); }
            else if (code < 65536) { bytes.push(224 | code >>> 12, 128 | code >>> 6 & 63, 128 | code & 63); }
            else { bytes.push(240 | code >>> 18, 128 | code >>> 12 & 63, 128 | code >>> 6 & 63, 128 | code & 63); }
        }
        return bytes;
    }
    function rotate(value, count) { return value >>> count | value << 32 - count; }
    function sha256(input) {
        var bytes = input.slice(), bits = input.length * 8, high = Math.floor(bits / 4294967296), low = bits >>> 0;
        var state = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
        var words = [], offset, i, x, y, a, b, c, d, e, f, g, h, first, second, result = [];
        bytes.push(128); while (bytes.length % 64 !== 56) { bytes.push(0); }
        for (i = 24; i >= 0; i -= 8) { bytes.push(high >>> i & 255); }
        for (i = 24; i >= 0; i -= 8) { bytes.push(low >>> i & 255); }
        for (offset = 0; offset < bytes.length; offset += 64) {
            for (i = 0; i < 16; i += 1) {
                x = offset + i * 4; words[i] = bytes[x] << 24 | bytes[x + 1] << 16 | bytes[x + 2] << 8 | bytes[x + 3];
            }
            for (i = 16; i < 64; i += 1) {
                x = words[i - 15]; y = words[i - 2];
                words[i] = (words[i - 16] + (rotate(x, 7) ^ rotate(x, 18) ^ x >>> 3) + words[i - 7] +
                    (rotate(y, 17) ^ rotate(y, 19) ^ y >>> 10)) | 0;
            }
            a = state[0]; b = state[1]; c = state[2]; d = state[3]; e = state[4]; f = state[5]; g = state[6]; h = state[7];
            for (i = 0; i < 64; i += 1) {
                first = (h + (rotate(e, 6) ^ rotate(e, 11) ^ rotate(e, 25)) + (e & f ^ ~e & g) + constants[i] + words[i]) | 0;
                second = ((rotate(a, 2) ^ rotate(a, 13) ^ rotate(a, 22)) + (a & b ^ a & c ^ b & c)) | 0;
                h = g; g = f; f = e; e = d + first | 0; d = c; c = b; b = a; a = first + second | 0;
            }
            x = [a,b,c,d,e,f,g,h]; for (i = 0; i < 8; i += 1) { state[i] = state[i] + x[i] | 0; }
        }
        for (i = 0; i < 32; i += 1) { result.push(state[i >> 2] >>> (24 - i % 4 * 8) & 255); }
        return result;
    }
    runtime.androidHmacSha256 = function (key, text) {
        if (typeof key !== 'string' || typeof text !== 'string' || key.length > 4096 || text.length > 300000) {
            throw new Error('ANDROID_SIGN_INPUT');
        }
        var bytes = utf8(key), inner = [], outer = [], i;
        if (bytes.length > 64) { bytes = sha256(bytes); }
        for (i = 0; i < 64; i += 1) { inner.push((bytes[i] || 0) ^ 54); outer.push((bytes[i] || 0) ^ 92); }
        return sha256(outer.concat(sha256(inner.concat(utf8(text))))).map(function (value) {
            return ('0' + value.toString(16)).slice(-2);
        }).join('');
    };
    runtime.androidSignFields = function (payload, key, ts, nonce) {
        if (typeof payload !== 'string' || payload.length > 256000 || typeof ts !== 'string' || !/^[1-9][0-9]*$/.test(ts) ||
                Number(ts) > 9007199254740991 || typeof nonce !== 'string' || !/^[A-Za-z0-9]{16}$/.test(nonce)) {
            throw new Error('ANDROID_SIGN_FIELDS');
        }
        return { payload: payload, ts: ts, nonce: nonce, sig: runtime.androidHmacSha256(key, 'v1.' + ts + '.' + nonce + '.' + payload) };
    };
    runtime.createAndroidSignedData = function (body, key) {
        var now = runtime.now();
        if (typeof now !== 'number' || !isFinite(now) || now <= 0 || Math.floor(now) !== now || now > 9007199254740991 ||
                typeof RandomOperations === 'undefined' || typeof RandomOperations.getRandomString !== 'function') {
            throw new Error('ANDROID_SIGN_UNAVAILABLE');
        }
        var nonce = String(RandomOperations.getRandomString(16, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'));
        return runtime.androidSignFields(JSON.stringify(body), key, String(now), nonce);
    };
};
