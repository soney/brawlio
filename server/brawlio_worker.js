onmessage = function(e) {
	console.log("WORKER START", e);
	while(true){}
    postMessage({ test : 'this is a test' });
};

onclose = function() {
    console.log('Worker shuttting down.');
};
