/*! Copyright (c) 2013 - Peter Coles (mrcoles.com)
 *  Licensed under the MIT license: http://mrcoles.com/media/mit-license.txt
 %
 % reduced a large part of the code because I didn't need the functionality, then added more
 %
 */


(function() {

    //
    // Setup keys!
    //

    var notesOffset = 0;

    var blackKeys = {
        1: 1,
        3: 3,
        6: 1,
        8: 2,
        10: 3
    };
    $.each(blackKeys, function(k, v) {
        blackKeys[k] = ' black black'+v;;
    });

    function blackKeyClass(i) {
        return blackKeys[(i % 12) + (i < 0 ? 12 : 0)] || '';
    }

    var $keys = $('<div>', {'class': 'keys'}).appendTo('#piano');

    var buildingPiano = false;

    var isIos = navigator.userAgent.match(/(iPhone|iPad)/i);

    function buildPiano() {
        if (buildingPiano) return;
        buildingPiano = true;

        $keys.trigger('build-start.piano');
        $keys.empty().off('.play');

        function addKey(i) {
            function play(evt) {

                var $k = $keys.find('[data-key='+i+']').addClass('pressed');

                //TODO - it'd be nice to have a single event for triggering and reading
                // $keys.trigger('played-note.piano', [i, $k]);

            }
            $keys.on('note-'+i+'.play', play);
            var $key = $('<div>', {
                'class': 'key' + blackKeyClass(i),
                'data-key': i,
                mousedown: function(evt) { $keys.trigger('note-'+i+'.play'); }
            }).appendTo($keys);
        }

        // delayed for-loop to stop browser from crashing :'(
        // go slower on Chrome...
        var i = -12, max = 14, addDelay = /Chrome/i.test(navigator.userAgent) ? 10 : 0;
        (function go() {
            addKey(i + notesOffset);
            if (++i < max) {
                window.setTimeout(go, addDelay);
            } else {
                buildingPiano = false;
                $keys.trigger('build-done.piano');
            }
        })();
    }

    buildPiano();

    //
    // Setup keyboard interaction
    //

    var keyNotes = {
        /*a*/ 65: 0, // c
        /*w*/ 87: 1, // c#
        /*s*/ 83: 2, // d
        /*e*/ 69: 3, // d#
        /*d*/ 68: 4, // e
        /*f*/ 70: 5, // f
        /*t*/ 84: 6, // f#
        /*g*/ 71: 7, // g
        /*y*/ 89: 8, // g#
        /*h*/ 72: 9, // a
        /*u*/ 85: 10, // a#
        /*j*/ 74: 11, // b
        /*k*/ 75: 12, // c
        /*o*/ 79: 13, // c#
        /*l*/ 76: 14, // d
        /*p*/ 80: 15, // d#
        /*;*/ 186: 16, // e
        /*;*/ 59: 16, // e ... gotta figure out why it's sometimes 186 and sometimes 59
        /*,*/ 222: 17, // f
        /*]*/ 221: 18, // f#
        /*enter*/ 13: 19 // g
    };
    var notesShift = -12; // for the visual coordination
    var downKeys = {};

    function isModifierKey(evt) {
        return evt.metaKey || evt.shiftKey || evt.altKey;
    }

    $(window).keydown(function(evt) {
        var keyCode = evt.keyCode;
        // prevent repeating keys
        if (!downKeys[keyCode] && !isModifierKey(evt)) {
            downKeys[keyCode] = 1;
            var key = keyNotes[keyCode];
            if ((typeof key != 'undefined') && (evt.keyCode !== 32)) {
                $keys.trigger('note-'+(key+notesShift+notesOffset)+'.play');
                routeEvents(translate(downKeys), false);
                // debugger;
                evt.preventDefault();
            } else if (evt.keyCode == 188) {
                notesShift = -12;
            } else if (evt.keyCode == 190) {
                notesShift = 0;
            } else if (keyCode == 37 || keyCode == 39) {
                notesOffset += (keyCode == 37 ? -1 : 1) * 12;
                buildPiano();
            }
        }
    }).keyup(function(evt) {

        var keyCode = evt.keyCode;
        downKeys[keyCode] = 1;
        var key = keyNotes[keyCode];
        if (typeof key != 'undefined') {
            $keys.find('[data-key='+(key+notesShift+notesOffset)+']').removeClass('pressed');
            evt.preventDefault();
        } else if (evt.keyCode == 188) {
            notesShift = -12;
        } else if (evt.keyCode == 190) {
            notesShift = 0;
        } else if (keyCode == 37 || keyCode == 39) {
            notesOffset += (keyCode == 37 ? -1 : 1) * 12;
            buildPiano();
        }

        delete downKeys[evt.keyCode];
        if (evt.keyCode !== 32) routeEvents(translate(downKeys), false);
    });

    // prevent quick find... it's apprently some chrome extension...
    $(window).keydown(function(evt) {
        if (evt.target.nodeName != 'INPUT' && evt.target.nodeName != 'TEXTAREA') {
            if (evt.keyCode == 222) {
                evt.preventDefault();
                return false;
            }
        }
        return true;
    });

    function translate(obj) {
        arr = Object.keys(obj);
        newArr = [];
        $(arr).each(function(i, keyCode) {
            var v;
            switch (Number(keyCode)) {
                case 65: v = 48; break; 
                case 87: v = 49; break; 
                case 83: v = 50; break; 
                case 69: v = 51; break; 
                case 68: v = 52; break; 
                case 70: v = 53; break; 
                case 84: v = 54; break; 
                case 71: v = 55; break; 
                case 89: v = 56; break; 
                case 72: v = 57; break; 
                case 85: v = 58; break; 
                case 74: v = 59; break; 
                case 75: v = 60; break; 
                case 79: v = 61; break; 
                case 76: v = 62; break; 
                case 80: v = 63; break; 
                case 186: v= 64; break; 
                case 59: v = 64; break; 
                case 222: v= 65; break; 
                case 221: v= 67; break; 
            }
            if (typeof v !== 'undefined') {
                newArr.push(v); // convert the string to number and add it
            }
        });
        return newArr;
    }
})();
