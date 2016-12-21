var mouseX = 0, mouseY = 0, windowHalfX = window.innerWidth / 2, windowHalfY = window.innerHeight / 2, camera, scene, renderer, material, container;
var analyser;
var buffer;
var audioBuffer;
var dropArea;
var audioContext;
var source1, source2, gainNode1, gainNode2, marsterGain;
var analyser1, analyser2;
var xhr;
var started = false;
var checkfilterload = false;
var index;
 
$(document).ready(function() {
 
	//Chrome is only browser to currently support Web Audio API
	var is_chrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
	var is_webgl = ( function () { try { return !! window.WebGLRenderingContext && !! document.createElement( 'canvas' ).getContext( 'experimental-webgl' ); } catch( e ) { return false; } } )();
 
 	if(!is_chrome){
 		$('#loading').html("This demo requires <a href='https://www.google.com/chrome'>Google Chrome</a>.");
 	} else if(!is_webgl){
 		$('#loading').html('Your graphics card does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation">WebGL</a>.<br />' +
 		'Find out how to get it <a href="http://get.webgl.org/">here</a>, or try restarting your browser.');
 	}else {
 		$('#loading').html('drop mp3 here or <a id="loadSample">load sample mp3</a>');
 		init();
 	}
 
});
 
nx.onload = function() {
 
 
	gui_filter_freq.on('*',function(data) {
 		biquad.frequency.value=60+Math.pow(20000,data.x);
 		biquad.Q.value = 10*data.y;
		source1.playbackRate=data.x
		
 	});
 	
 	button1.on('press', function(data) {
 	// some code using data.press, data.x, and data.y
 	
  		console.log("click");
  		console.log(gainNode1.gain.value);
  		
 		loadAudioBuffer("Like The Sun.mp3",2);

  		
		gainNode1.gain.exponentialRampToValueAtTime(0.01, 20);
  		gainNode2.gain.exponentialRampToValueAtTime(1, 15);
  		source1.stop(audioContext.currentTime+20);
  
	});
 	
 	vinyl1.on('*',function(data) {
		if(source1!=undefined){
 		source1.playbackRate=Math.pow(Math.E,2*vinyl1.speed-1);
		}
 	});
 
}		   
 
function init() {
 
	//init 3D scene
 	//container = document.createElement('div');
 	//document.body.appendChild(container);
 	//camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000000);
 	//camera.position.z = 2000;
 	//scene = new THREE.Scene();
 	//scene.add(camera);
 	//renderer = new THREE.WebGLRenderer({
 	//	antialias : false,
 	//	sortObjects : false
 	//});
 	//renderer.setSize(window.innerWidth, window.innerHeight);
 
 	//container.appendChild(renderer.domElement);
 
 	// stop the user getting a text cursor
 	//document.onselectStart = function() {
 	//	return false;
 	//};
 
 	//add stats
 	//stats = new Stats();
 	//stats.domElement.style.position = 'absolute';
 	//stats.domElement.style.top = '0px';
 	//container.appendChild(stats.domElement);
 
 	//init listeners
 	$("#loadSample").click( loadSampleAudio);
 	$(document).mousemove(onDocumentMouseMove);
 	//$(window).resize(onWindowResize);
 	document.addEventListener('drop', onDocumentDrop, false);
 	document.addEventListener('dragover', onDocumentDragOver, false);
 
 	onWindowResize(null);
 	audioContext = new window.AudioContext();
 
}
 
function loadSampleAudio() {
 	$('#loading').text("loading...");
 
 	source1 = audioContext.createBufferSource();
 	gainNode1 = audioContext.createGain();
 	analyser1 = audioContext.createAnalyser();
 	analyser1.smoothingTimeConstant = 0.1;
 	analyser1.fftSize = 1024;
 	
 	source2 = audioContext.createBufferSource();
 	gainNode2 = audioContext.createGain();
 	analyser2 = audioContext.createAnalyser();
 	analyser2.smoothingTimeConstant = 0.1;
 	analyser2.fftSize = 1024;
 	
 	biquad= audioContext.createBiquadFilter();
 	biquad.type = "lowpass";
 	biquad.Q.value=0;
 	biquad.frequency.value=21000;
 	checkfilterload=true;
 	
 	mixfilter= audioContext.createBiquadFilter();
 	mixfilter.type = "peaking";
 	mixfilter.Q.value=1;
 	mixfilter.frequency.value=250;
 	mixfilter.gain.value=0;
 	checkfilterload=true;
 	
 	marsterGain = audioContext.createGain();
 
 	// Connect audio processing graph
 	source1.connect(mixfilter);
 	mixfilter.connect(gainNode1);
 	source2.connect(gainNode2);
 	
 	gainNode1.connect(marsterGain);
 	gainNode2.connect(marsterGain);
 	
 	marsterGain.connect(biquad);
 	biquad.connect(audioContext.destination);
 	
  	source1.connect(analyser1);
  	source2.connect(analyser2);
  
	loadAudioBuffer("demo.mp3",1);

}
  
function loadAudioBuffer(url1,i) {
 
 	// Load asynchronously
 	var request = new XMLHttpRequest();
 	request.open("GET", url1, true);
 	request.responseType = "arraybuffer";
 
 	request.onload = function() {
 
 		audioContext.decodeAudioData(request.response, function(buffer) {
 			audioBuffer = buffer;
 			finishLoad(i);
 		}, function(e) {
 			console.log(e);
 		});
 
 
 	};
 	request.send();
 	
 	
 
 
 	// Load asynchronously
 	// var request = new XMLHttpRequest();
 	// request.open("GET", url, true);
 	// request.responseType = "arraybuffer";
 
 	// request.onload = function() {
 	// 	audioBuffer = audioContext.createBuffer(request.response, false );
 	// 	finishLoad();
 	// };
 
 	// request.send();
}
 
function finishLoad(i) {
 	if(i==1){
 		source1.buffer = audioBuffer;
 		source1.loop = true;
 		source1.start(0.0);
 		startViz();
 	}
 	if(i==2){
 		source2.buffer = audioBuffer;
 		source2.loop = true;
 		source2.start(0.0);
 		startViz();
 	}
}
 
function onDocumentMouseMove(event) {
 	mouseX = (event.clientX - windowHalfX);
 	mouseY = (event.clientY - windowHalfY);
}
 
function onWindowResize(event) {
 	windowHalfX = window.innerWidth / 2;
 	windowHalfY = window.innerHeight / 2;
 	//camera.aspect = window.innerWidth / window.innerHeight;
 	//camera.updateProjectionMatrix();
 	//renderer.setSize(window.innerWidth, window.innerHeight);
}
 
function animate() {
 	requestAnimationFrame(animate);
 	//render();
 	//stats.update();
}
 
//function render() {
 	//LoopVisualizer.update();
 
 	//var xrot = mouseX/window.innerWidth * Math.PI*2 + Math.PI;
 	//var yrot = mouseY/window.innerHeight* Math.PI*2 + Math.PI;
 
 	//LoopVisualizer.loopHolder.rotation.x += (-yrot - LoopVisualizer.loopHolder.rotation.x) * 0.3;
 	//LoopVisualizer.loopHolder.rotation.y += (xrot - LoopVisualizer.loopHolder.rotation.y) * 0.3;
 
 	//renderer.render(scene, camera);
//}
 
//filter reset
$(window).mouseup(function(){
 	
 	if(checkfilterload){
 		biquad.frequency.value=21000;
 		biquad.Q.value=0;
 	}
 	
});
 
//$(window).mousewheel(function(event, delta) {
 	//set camera Z
 	//camera.position.z -= delta * 50;
//});
 
 
function onDocumentDragOver(evt) {
 
 	$('#loading').show();
 	$('#loading').text("drop MP3...");
 	evt.stopPropagation();
 	evt.preventDefault();
 	return false;
}
 
 
//var droppedFiles=[], fileCount=0; index=0;
//var reader = new FileReader();
 
function onDocumentDrop(evt) {
 	evt.stopPropagation();
 	evt.preventDefault();
 
 	//clean up previous mp3
 	//if (source) source.disconnect();
 	//LoopVisualizer.remove();
 
 	$('#loading').show();
 	$('#loading').text("loading...");
 
 	var droppedFiles=evt.dataTransfer.files;
 	//droppedFiles.concat(evt.dataTransfer.files);
 	//fileCount = droppedFiles.length;
 	//index++;
 	
 	console.log(fileCount);
 
 	var reader = new FileReader();
 
 	reader.onload = function(fileEvent) {
 		var data = fileEvent.target.result;
 		initAudio(data);
 	};
 
 	reader.readAsArrayBuffer(droppedFiles[0]);
 	
 	//if(fileCount==1)
 	//	reader.readAsArrayBuffer(droppedFiles[index-1]);
 
}
 
//AllSongs = [];
//current = -1;
//function AddTracks(files) {
	
//	for (var i = 0; i < files.length; ++i) {
//		var file = files[i];
//		if (file.type.match(/audio.*/)) {
//			AllSongs.push(file);
//		}
//	}
//	if (current == -1) {
//		LoadAudioFile(AllSongs.length - files.length);
//	}
//	
//}
 
//function LoadAudioFile(index) {
 	
//	if (index < AllSongs.length) {
//		var reader = new FileReader();
//		reader.onload = function(d) {
//		var e = document.getElementById("player");
//		e.src = d.target.result;
//		e.setAttribute("type", AllSongs[index].type);
//		e.play();
//		current = index;
//	};
//	reader.readAsDataURL(AllSongs[index]);
//	} else {
//		current = -1;
//	}
	
//}

//function OnLoad() {
	
//	var e = document.getElementById("player");
//	e.addEventListener("ended", function() { LoadAudioFile(current + 1) }, false);
	
//}

	
function initAudio(data) {
	source1 = audioContext.createBufferSource();

	if(audioContext.decodeAudioData) {
		audioContext.decodeAudioData(data, function(buffer) {
			source1.buffer = buffer;
			createAudio();
		}, function(e) {
			console.log(e);
			$('#loading').text("cannot decode mp3");
		});
	} else {
		source1.buffer = audioContext.createBuffer(data, false );
		createAudio();
	}
}


function createAudio() {

	analyser = audioContext.createAnalyser();
	analyser.smoothingTimeConstant = 0.1;
	analyser.fftSize = 1024;

	biquad= audioContext.createBiquadFilter();
	biquad.type = "lowpass";
	biquad.Q.value=0;
	biquad.frequency.value=21000;
	
	checkfilterload=true;
	
	source1.connect(biquad);
	biquad.connect(audioContext.destination);
	source1.connect(analyser);
	source1.start(0);
	source1.loop = true;

	startViz();
}

function startViz(){

	$('#loading').hide();

	//LoopVisualizer.init();

	//if (!started){
		//started = true;
		//animate();
	//}

}
