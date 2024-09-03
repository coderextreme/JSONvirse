function loadJS(selector, json) {
        try {
		let browser = X3D.getBrowser();
                if (typeof browser !== 'undefined') {
			   // Import the X3D scene and handle the Promise
			   browser.createX3DFromString(json)
			      .then(function(importedScene) {
				 // Replace the current world with the imported scene
				 browser.replaceWorld(importedScene);
			      })
			      .catch(function(error) {
				 console.error('Error importing X3D scene:', error);
			      });
		} else {
			alert("X_ITE could not replaceWorld in loadJS()");
			console.error("X_ITE could not replaceWorld in loadJS()", selector, json);
		}
	} catch (e) {
		console.error(e);
	}
}

function loadURL(selector, url) {
        try {
		/*
		document.querySelector("#scene").setAttribute("url", "\""+url+"\"");
		*/
		let browser = X3D.getBrowser();
                if (typeof browser !== 'undefined') {
			   // Import the X3D scene and handle the Promise
			   console.log("url type", typeof url, url);
			   browser.loadURL(new X3D.MFString (url))
			      .then(() => {
				 console.log('Success importing URL:', url);
			      })
			      .catch(function(error) {
				 console.error('Error importing URL:', error);
			      });
		} else {
			console.error("X_ITE could not loadURL in loadURL()", selector, url);
		}
	} catch (e) {
		console.error(e);
	}
}
