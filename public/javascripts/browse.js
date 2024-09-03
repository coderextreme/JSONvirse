function loadJS(selector, jsobj) {
        try {
		let browser = X3D.getBrowser();
                if (typeof browser !== 'undefined' && typeof browser.importJS !== 'undefined') {
			   // Import the X3D scene and handle the Promise
			   browser.importJS(jsobj)
			      .then(function(importedScene) {
				 // Replace the current world with the imported scene
				 browser.replaceWorld(importedScene);
			      })
			      .catch(function(error) {
				 console.error('Error importing X3D scene:', error);
			      });
                        // var importedScene = browser.importJS(jsobj);
                        // browser.replaceWorld(importedScene);
		} else {
			alert("X_ITE could not replaceWorld in loadJS()");
			console.error("X_ITE could not replaceWorld in loadJS()", selector, jsobj);
		}
	} catch (e) {
		console.error(e);
	}
}
