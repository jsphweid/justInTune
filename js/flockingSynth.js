
var environment = flock.init();
environment.start();

var SYNTH = {

    // take in array and makes that number of synths using map
    makeSynths : function(size) {

        var s = SYNTH.makeKeyboardArr(size);

        return $.map(s, function (startingFreq, idx) {
            return flock.synth({
                synthDef: {
                    id: "carrier",
                    ugen: "flock.ugen.sin",
                    freq: startingFreq,
                    mul: {
                        ugen: "flock.ugen.asr",
                        gate: 0,
                        attack: 0.05,
                        sustain: 0.16,
                        release: 0.1
                    }
                }
            });
        });
    },

    makeSampler : function(size) {

        var s = SYNTH.makeKeyboardArr(size);

        return $.map(s, function (startingFreq, idx) {
            return flock.synth({
                synthDef: {
                    id: "sample",
                    ugen: "flock.ugen.readBuffer",
                    buffer: {
                        id: "note",
                        url: "/wav/noArticulation440.wav" 
                    },   // consider making it an mp3 if it works in all browsers as it is a much smaller file size                    },
                    phase: {
                        id: "phasor",
                        ugen: "flock.ugen.lfSaw",
                        freq: (.1),
                        mul: 0.5,
                        add: 0.5,
                    },
                    mul: {
                        ugen: "flock.ugen.asr",
                        gate: 0,
                        attack: 0.05,
                        sustain: 0.16,
                        release: 0.1
                    }
                }
            });
        });
    },

    makeKeyboardArr : function(size) {
        arr = [];
        for (let i = 0; i < size; i++) {
            arr.push(0);
        }
        return arr;
    }
}

// initialize synths
var synths = SYNTH.makeSynths(127);

// initialize samplers
var samplers = SYNTH.makeSampler(127);
// turn them all off by default, because I don't know how else to do it...
for (let i = 0; i < samplers.length; i++) {
    samplers[i].pause(); // I use pause because my intuition tells me it uses less processing power...
}



