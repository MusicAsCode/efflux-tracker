/**
 * The MIT License (MIT)
 *
 * Igor Zinken 2016-2020 - https://www.igorski.nl
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
import LZString from 'lz-string';
import { CompressString } from 'demolishedcompressor';
import unpack from 'demolishedcompressor/src/unpack';

let storage;

const StorageUtil =
{
    /**
     * initializes the storage mechanism
     *
     * @public
     */
    init() {
        // use LocalStorage
        storage = window.localStorage;
    },
    /**
     * verifies whether storage is available
     *
     * @public
     * @return {boolean}
     */
    isAvailable() {
        return typeof storage !== 'undefined';
    },
    /**
     * get an item from storage, returns a Promise
     *
     * @public
     * @param {string} key
     * @return {Promise}
     */
    async getItem( key ) {
        if ( !StorageUtil.isAvailable() ) {
            throw new Error( 'Storage not available' );
        }
        const data = storage.getItem( key );
        if ( !data ) {
            throw new Error( `Data for '${key}' not found'` );
        }
        return await decompress( data );
    },
    /**
     * set an item in storage, returns a Promise
     *
     * @param {string} key
     * @param {*} data
     * @return {Promise}
     */
    async setItem( key, data ){
        const compressedData = await compress( data );
        return new Promise(( resolve, reject ) => {
            if ( !StorageUtil.isAvailable() ) {
                reject( Error( 'Storage not available' ));
            }
            resolve( storage.setItem( key, compressedData ));
        });
    },
    /**
     * removes an item from storage, returns a Promise
     *
     * @param {string} key
     * @returns {Promise}
     */
    removeItem(key) {
        return new Promise(( resolve, reject ) => {
            if ( !StorageUtil.isAvailable() ) {
                reject( Error( 'Storage not available' ));
            }
            resolve(storage.removeItem(key));
        });
    }
};
export default StorageUtil;

/* internal methods */

// by compressing the stringified Objects we can maximize
// the amount data we can save in the applications quota in LocalStorage

async function compress( string ) {
    let compressedString;
    try {
        const /* Uint8Array */ data = await CompressString.Pngify( string );
        compressedString = JSON.stringify(Array.from( data ));
    }
    catch ( e ) {
        return string;
    }
    console.log(
        "Compressed " + string.length + " to " + compressedString.length + " (" +
        (( compressedString.length / string.length ) * 100 ).toFixed( 2 ) + "% of original size)"
    );
    return compressedString;
}

function decompress( string ) {
    let decompressedString;

    try {
        // decompress demolishedcompressor output
        const storedData = new Uint8Array( JSON.parse( string ));
        console.warn(unpack);
        return unpack( storedData );
    }
    catch ( e ) {
        try {
            // legacy songs used LZ compression instead of demolishedcompressor
            decompressedString = LZString.decompressFromUTF16( string );
        } catch ( e ) {
            return string;
        }
    }

    // shorter length implies that given string could not be decompressed
    // properly, meaning it was likely not compressed in the first place

    if ( !decompressedString || decompressedString.length < string.length )
        return string;
    else
        return decompressedString;
}
