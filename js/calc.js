'use strict';

var getJustFreqArray = function(midiNotes) {
	var numNotesDepressed = midiNotes.length;
	//
	// go
	//

	// // handle the condition if no notes are pressed...
	// if (numNotesDepressed === 0) return [];

	// handle the condition if only one note is depressed
	if (numNotesDepressed === 1) {
		h.lastWinner = [];
		h.updateRatioDiv([]);
		return [noteNumberToFrequency(midiNotes[0])];
	}

	return h.go(midiNotes);
}


var h = {

	lastWinner : [],

	// define all possible interval definitions
	intervalDefs : 	[
						[[1,1]], // 0 - unison
						[[15,16],[16,17],[25,27],[24,25]], // 1 - minor 2nd
						[[9,10],[8,9]], // 2 - major 2nd
						[[5,6],[16,19],[27,32]], // 3 - minor 3rd
						[[4,5],[7,9],[11,14]], // 4 - major 3rd
						[[3,4]], // 5 - perfect 4th
						[[5,7],[7,10],[18,25],[25,36],[32,45],[45,64]], // 6 - tritone [5,7],[7,10],[18,25]
						[[2,3]], // 7 - perfect 5th
						[[5,8],[7,11],[9,14]], // 8 - minor 6th
						[[3,5],[16,27],[19,32]], // 9 - major 6th, consider deleting 19, 32
						[[5,9],[9,16]], // 10 - minor 7th
						[[8,15],[17,32],[25,48],[27,50]] // 11 - major 7th
					],

	// all of this work has to be done just to get a COPY of a particular interval def
	getCopyOfIntervalDef : function(interval) {
		var newArr = [];
		for (var i = 0; i < h.intervalDefs[interval].length; i++) {
			newArr.push(h.intervalDefs[interval][i].slice()); // copy each element
		}
		return newArr;
	},
					
	// for intervals 12 and larger, this returns the reduced interval and the number
	// the numerator should be multiplied by in a simple array
	// example, an interval of 24 -> [0, 4], 13 -> [1, 2]
	getIntervalAndPower : function(currentInterval) {
		var numeratorMultiplier = 1;
		while (typeof h.intervalDefs[currentInterval] === 'undefined') { // while index out of range...
			currentInterval -= 12; // move the index / interval down an octave and try again
			numeratorMultiplier *= 2;
		}
		return [currentInterval, numeratorMultiplier];

	},


	// re-make with correct ratio
	getOctavizedIntervalDef : function(scaledInterval, _octaveMultiplier) { //$$$$ scaled interval just number not the interval def array
		var octaveMultiplier = _octaveMultiplier;
		var intervalDef = h.getCopyOfIntervalDef(scaledInterval);
		var ret = [];
		for (let i = 0; i < intervalDef.length; i++) {
			var numerator = intervalDef[i][1];
			var denominator = intervalDef[i][0];
			// not sure what I was thinking here, but I don't want to rethink it...
			// I think it is something like, make the 'simplest' fraction
			while (octaveMultiplier > 1) {
				if (denominator % 2 === 1) numerator *= 2;
				if (denominator % 2 === 0) denominator /= 2;
				octaveMultiplier /= 2;
			}

			ret.push([denominator, numerator]); // push
			octaveMultiplier = _octaveMultiplier // and reset
		}
		return ret;
	},


	// adapted code with help from Clay, don't really know how this works....
	permute : function(attrs) {

		function cloneArray(arr) {  
			var clone = [];
			for (let i = 0; i < arr.length; i++) {
				clone.push(arr[i].slice(0));
			}
			return clone;
		}


		function cycleThruCombos(s, attrs, k, comboList) {
			var a;
			var i = 0;
			while (attrs[k].length > i) {
				a = cloneArray(s); // list copy shallow or deep?? $$$$$
				a.push(attrs[k][i]);
				recurse(a, attrs, k + 1, comboList);
				i++;
			}
		}

		function recurse(s, attrs, k, comboList) {
			if (k === attrs.length) {
				comboList.push(s);
			} else {
				cycleThruCombos(s, attrs, k, comboList);
			}
			return comboList;
		}

		return recurse([], attrs, 0, []);
	},



	// list of differences between intervals
	// for example [10, 13, 19] -> [3, 6]
	makebasicIntervalArray : function(notesPlaying) {
		var intervalsBetweenNotesInNotesPlaying = [];

		// handle 1 note playing case
		if (notesPlaying.length === 1) return [0];
		
		// get difference
		for (let i = 0; i < notesPlaying.length - 1; i++) {
			var dif = notesPlaying[i+1] - notesPlaying[i];
			intervalsBetweenNotesInNotesPlaying.push(dif);
		}

		return intervalsBetweenNotesInNotesPlaying;
	},

	makeAllPossibleRatiosArray : function(basicIntervalArray) {
		var bigArrayOfPossibilities = [];

		for (let i = 0; i < basicIntervalArray.length; i++) {
			var interval = basicIntervalArray[i]; // an integer
			// dissect
			var dissectedInterval = h.getIntervalAndPower(interval);
			var simplifiedInterval = dissectedInterval[0];
			var multiplier = dissectedInterval[1];

			bigArrayOfPossibilities.push(h.getOctavizedIntervalDef(simplifiedInterval, multiplier));

		}
		// should this be separated?
		return h.permute(bigArrayOfPossibilities);
	},

	makeAllRatiosTable : function(bigArrayOfPossibilities, notesPlayingSize) {
		
		function flatten(ary) {
		    var ret = [];
		    for(var i = 0; i < ary.length; i++) {
		        if(Array.isArray(ary[i])) {
		            ret = ret.concat(flatten(ary[i]));
		        } else {
		            ret.push(ary[i]);
		        }
		    }
		    return ret;
		}

		// find Least Common Multiple of two numbers
		function calcLCM(x, y) {
			var greater, i = 0, lcm;
			if (x > y) greater = x;
			if (y > x) greater = y;
			while (i < 1) {
				if ((greater % x == 0) && (greater % y == 0)) {
					lcm = greater;
					i++;
				}
				if (i < 1){
					greater += 1;
				}
			}
			return lcm;
		}
		// not sure why I have to keep putting functions inside here to not lose scope...
		function multiplyItemsInList(theArray, byWhatNumber) {
			var ret = [];
			for (let i = 0; i < theArray.length; i++) {
				ret.push(theArray[i] * byWhatNumber);
			}
			return ret;
		}

		var allTables = [];

		// handle case where 1 note playing, not sure if this is necessary
		if (notesPlayingSize === 1) {
			allTables.push([1]);
			return allTables;
		}

		for (let h = 0; h < bigArrayOfPossibilities.length; h++) {
			var item = bigArrayOfPossibilities[h];
			var i = 0, leastCM, multi1, multi2, itemLength;
			var answer = [];
			item = flatten(item);
			itemLength = item.length;
			while (i < itemLength) {
				// first item
				if (i === 0){
					answer.push(item[i]);
					i++;
					continue;
				}

				// last item
				if (i === itemLength - 1) {
					answer.push(item[i]);
					break;
				}

				// not first or last, but same number, skip
				if ((i !== 0) && (item[i] === item[i + 1])){
					answer.push(item[i]);
					i += 2;
					continue;
				}

				// not first or last, and NOT same number (needs adjustment), maybe -2 should be -1?
				if ((i !== itemLength - 2) && (item[i] !== item[i+1])) {
					var leastCM = calcLCM(item[i], item[i+1]);
					multi1 = (leastCM / item[i]);
					multi2 = (leastCM / item[i+1]);
					answer.push(item[i]);
					if (multi1 !== 1) {
						answer = multiplyItemsInList(answer, multi1);
					}
					item[i+2] *= multi2;
					i += 2;
				}
			}
			allTables.push(answer);
			answer = [];
		}
		// display something about possibilities??> consult original
		return allTables;

	},

	selectLowestRatioArray : function(allTables) {
		var lastIndex = allTables[0].length - 1;
		var lastDigitsArray = [];
		var i = 0;

		// initialize winner
		var winner = allTables[0];

		for (let i = 0; i < allTables.length; i++) {
			if (allTables[i][lastIndex] < winner[lastIndex]) {
				// new winner
				winner = allTables[i];
			}
		}
		h.lastWinner = winner;
		return winner;
	},

	makeActualFreqTable : function(table, multiplierFrequency) {
		var ret = [];
		for (let i = 0; i < table.length; i++) {
			var freq = table[i] * multiplierFrequency;
			ret.push(freq); // non reduced freq????@?###$$$
		}
		return ret;
	},

	makeNoteFreqObj : function(notesPlaying, freqTable) {
		var retObj = {};
		for (let i = 0; i < freqTable.length; i++) {
			retObj[notesPlaying[i]] = freqTable[i];
		}
		return retObj;
	},

	// sort of bang??@>#@?##$$$, how would this be different
	deriveFromTopNote : function(winningRatioTable, notesPlaying) {
		var lastNum = winningRatioTable[winningRatioTable.length - 1]
		var ret = [];
		for (let i = 0; i < winningRatioTable.length; i++) {
			ret.push(winningRatioTable[i] / lastNum); // here we could make any freq divide by?
		}
		var topMidiNoteFreq = noteNumberToFrequency(notesPlaying[notesPlaying.length - 1]);
		return h.makeActualFreqTable(ret, topMidiNoteFreq);
	},

	updateRatioDiv : function() {
		var html = "";
		for (let i = 0; i < h.lastWinner.length; i++) {
			html += h.lastWinner[i];
			if (i != h.lastWinner.length - 1) html += ":"; // not last, add colon
		}
		$('.ratioTable').empty();
		$('.ratioTable').text(html);
	},

	// for the very end....
	go : function(noteNumArr) {
		// do I have to handle a [] case in here?

		var basicIntervalArray = h.makebasicIntervalArray(noteNumArr);
		var allPossibleArray = h.makeAllPossibleRatiosArray(basicIntervalArray);
		var allTables = h.makeAllRatiosTable(allPossibleArray, noteNumArr.length);
		var winner = h.selectLowestRatioArray(allTables);
		var freqTable = h.deriveFromTopNote(winner, noteNumArr);
		h.updateRatioDiv(winner)

		return freqTable;
	}
}
