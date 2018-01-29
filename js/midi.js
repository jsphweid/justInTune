(function(){
// from http://www.keithmcmillen.com/blog/making-music-in-the-browser-web-midi-api/	
	var notesOn = [];
	var log = console.log.bind(console), keyData = document.getElementById('key_data'), 
			deviceInfoInputs = document.getElementById('inputs'), deviceInfoOutputs = document.getElementById('outputs'), midi;
	
	var data, cmd, channel, type, note, velocity; // declares these variables in scope

	/*
	If the browser doesn't have this method .requestMIDIAccess,
	there is no support of the WebMIDI API
	.requestMIDIAccess contains device info
	*/
	if (navigator.requestMIDIAccess) {
	    navigator.requestMIDIAccess({
	        sysex: false // not sure what this means
	    }).then(onMIDISuccess, onMIDIFailure); // midiAccess object is sent along
	} else {
	    alert("No MIDI support in your browser.");
	}

	/*
	onMIDISuccess only runs once and basically establishes links or assigns certain
	functions to run when certain events occur, rather than calling these functions
	every time and passing in values.
	*/
	function onMIDISuccess(midiAccess) {
		midi = midiAccess; // copying the object with a shorter name, basically.
		var inputs = midi.inputs.values();
		for (var input = inputs.next(); input && !input.done; input = inputs.next()){
			input.value.onmidimessage = onMIDIMessage; // assigning functions
			listInputs(input); // run console logs
		}
		midi.onstatechange = onStateChange; // when a device is plugged in or unplugged
		showMIDIPorts(midi); // generate actual HTML
	}

	/*
	This function is called every time a MIDI Message/Event occurs.
	Basic handling is to extract relevant data from event and do
	things with it.
	*/
	function onMIDIMessage(event){
		data = event.data;
		// cmd = data[0] >> 4, // bitwise shifting, maybe /4 or something?
		// channel = data[0] & 0xf,
		type = data[0] & 0xf0; // channel agnostic message type. Thanks, Phil Burk.
		note = data[1];
		// velocity = data[2];

		// log('MIDI data', data);
		switch(type){
			case 144: // noteOn message 
				noteOn(note); // call noteOn function
				break;
			case 128: // noteOff message 
				noteOff(note); // call noteOff function
				break;
		}
	}

	function onStateChange(event){
		showMIDIPorts(midi); // re-run the dynamic HTML generation
		var port = event.port, state = port.state, name = port.name, type = port.type;
		if(type == "input")
			log("name", name, "port", port, "state", state);

	}

	function listInputs(inputs){
		var input = inputs.value;
			log("Input port : [ type:'" + input.type + "' id: '" + input.id + 
					"' manufacturer: '" + input.manufacturer + "' name: '" + input.name + 
					"' version: '" + input.version + "']");
	}


	function noteOn(midiNote) {
		// push notes to array of notes on
		notesOn.push(midiNote);
		notesOn.sort();
		routeEvents(notesOn);
	}

	function noteOff(midiNote) {
		// delete note from array of notes on
		var noteIndex = notesOn.indexOf(midiNote);
		if (noteIndex >= 0) {
			notesOn.splice(noteIndex, 1);
		}
		routeEvents(notesOn);
	}

	function onMIDIFailure(e) {
		log("No access to MIDI devices or your browser doesn't support WebMIDI API. Please use WebMIDIAPIShim " + e);
	}

	/*
	This simply generates some basic dynamic HTML content that reports
	basic properties of the current MIDI devices attached.
	*/
	function showMIDIPorts(midiAccess){
		var inputs = midiAccess.inputs,
				outputs = midiAccess.outputs, 
				html;
		html = '<div class="info"><h4>MIDI Inputs:</h4>';

		if (inputs.size === 0) {
			html += '<p>No midi devices are currently plugged in.</p>';
		}

		inputs.forEach(function(port){
			html += '<p>' + port.name + '<p>';
			html += '<p class="small">connection: ' + port.connection + '</p>';
			html += '<p class="small">state: ' + port.state + '</p>';
			html += '<p class="small">manufacturer: ' + port.manufacturer + '</p>';
			if(port.version){
				html += '<p class="small">version: ' + port.version + '</p>';
			}
		});
		$('#midi').empty();
		$('#midi').append(html);
	}

})();