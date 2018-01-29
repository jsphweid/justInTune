'use strict';

///////////////////////////////////////////////
///////////////// UTILS ///////////////////////
///////////////////////////////////////////////
var calcJust = true;
var useSampler = false;

function noteNumberToFrequency(note) {
	return 440.0 * Math.pow(2, (note - 69.0) / 12.0);
}

function isInArray(value, array) {
  return array.indexOf(value) > -1;
}


//////////////////////////////////////////////
//////////////////   GO   ////////////////////
//////////////////////////////////////////////

// use spacebar to toggle equal vs. just
$(document).ready(function() { 
	window.onkeydown = function(e) {
	    if(e.keyCode == 32 && e.target == document.body) {
	    	toggleJustOrEqual();
	    	routeEvents(currentKeys, true);
	        e.preventDefault();
	        return false;
	    }
	};
});

function toggleJustOrEqual() {
	if (calcJust) {
    	$('#currentlyUsing').text('Currently Using: Equal temperament');
    	$('.ratioTable').empty();
		calcJust = !calcJust;
	} else {
		$('#currentlyUsing').text('Currently Using: Just Intonation');
		h.updateRatioDiv();
		calcJust = !calcJust;
	}
}

var previousKeys = []; // made this because I don't want to deal with piano.js any more...
var currentKeys = []; // global so that spacebar can retrigger automatically

function releaseNotes(arr) {
	for (let i = 0; i < arr.length; i++) {
		if (useSampler) {
			samplers[arr[i]].set("sample.mul.gate", 0);
			// samplers[arr[i]].pause(); // $$$$ pause may cause it to be abrupt....
		} else {
			synths[arr[i]].set("carrier.mul.gate", 0); // release synth
		}

	}
}


function routeEvents(midiNotesPressedDown, spacebar) {

	// 1. update current keys, previous keys, and release notes...
	currentKeys = midiNotesPressedDown.slice();
	if (!spacebar) {
		var notesToRelease = [];
		for (let i = 0; i < previousKeys.length; i++) {
			if (!isInArray(previousKeys[i], midiNotesPressedDown)) notesToRelease.push(previousKeys[i]);
		}
		releaseNotes(notesToRelease);
		previousKeys = midiNotesPressedDown.slice(); // update
	}
	console.log(midiNotesPressedDown);

	// 2. display them in the html
	displayNotesDepressed(midiNotesPressedDown);

	// 3a. if empty, turn don't go further.
	if (midiNotesPressedDown.length === 0) return;
	// 3b. if over 6, return
	if (midiNotesPressedDown.length > 6) return;

	// 4. order the fresh batch of notes depressed
	midiNotesPressedDown = midiNotesPressedDown.sort(function(a, b) {
		return a - b;
	});

	// 5. get corresponding frequencies from either just or equal temperament
	var freqArray = [];
	if (calcJust) {
		freqArray = getJustFreqArray(midiNotesPressedDown);
	} else {
		freqArray = getEqualTemperamentFreqArray(midiNotesPressedDown);
	}

	// 6. bind it to an object / dictionary 
	var obj = {};
	for (let i = 0; i < midiNotesPressedDown.length; i++) {
		obj[midiNotesPressedDown[i]] = freqArray[i];
	}

	// 7. send it off to the synth to be played
	generateSounds(obj);
}


function displayNotesDepressed(midiNotesPressed) {
	var $print = $('#print');
	$print.empty();
	var str = "";
	$(midiNotesPressed).each(function(i, v) {
		if (i !== midiNotesPressed.length - 1) { // don't add the comma on the last one
			str += v + ", ";
		} else {
			str += v;
		}
	});
	$print.append(str);

}

function getEqualTemperamentFreqArray(midiNotes) {
	return $.map(midiNotes, function(midiNote) {
		return noteNumberToFrequency(midiNote)
	})
}

function generateSounds(notesOnObject) {
	if (!useSampler) {
		Object.keys(notesOnObject).map(function(midiNote) {
			var frequency = notesOnObject[midiNote];
			if (synths[midiNote].get("carrier.freq") !== frequency) {
				synths[midiNote].set("carrier.freq", frequency); // update freq
			}
			if (synths[midiNote].get("carrier.mul.gate") === 0) {
				synths[midiNote].set("carrier.mul.gate", 1)
			}
		});
	} else { /// is sample...........
		Object.keys(notesOnObject).map(function(midiNote) {
			var frequencyTrans = translateFor440(notesOnObject[midiNote]);
			samplers[midiNote].play();
			if (samplers[midiNote].get("phasor.freq") !== frequencyTrans) {
				samplers[midiNote].set("phasor.freq", frequencyTrans); // update freqTrans
			}
			if (samplers[midiNote].get("sample.mul.gate") === 0) {
				samplers[midiNote].set("sample.mul.gate", 1)
			}
		});	
	}
}

function translateFor440(freq) {
	return (freq / 440) * .1;
}

