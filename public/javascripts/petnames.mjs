function petNameUpdateAndQuery(body) {
    const request = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body
    };
    fetch("/api/petnames", request)
      .then(response => response.json())
      .then(data => {
        $("#petnames").empty(); // Clear existing entries
	    $("#petnames").append('<tr><th>From Name</th><th>Relationship</th><th>To Name</th><th>Actions</th></tr>');
	    $("#petnames").append('<tr><td><input id="fromname"/></td><td><input id="relationshipname"/></td><td><input id="toname"/></td><td> <button id="add">Add</button> <button id="visit">Visit</button></td></tr>');
        data.forEach(entry => {
          $("#petnames").append(
		  `<tr><td><input type="checkbox" value="${entry[0]}"/>${entry[0]}</td><td>${entry[1]}</td><td><input type="checkbox" value="${entry[2]}"/>${entry[2]}</td></tr>`
	  );
        });
	  $('#add').click(function() {
	    let from = $('#fromname').val().replace(/[<>&]/g, " ");
	    let relationship = $('#relationshipname').val().replace(/[<>&]/g, " ");
	    let to = $('#toname').val().replace(/[<>&]/g, " ");
	    let body = JSON.stringify([ from, relationship, to ])
	  petNameUpdateAndQuery(body);
	    $('#fromname').val(from);
	    $('#relationshipname').val(relationship);
	    $('#toname').val(to);
	  });
	
	  $('#visit').click(function() {
		var values = [];
		$('input[type="checkbox"]:checked').each(function() {
		      values.push({"Session Petname": $(this).val(), "Session Token": "Super Secret Token", "Session Type": "Stanards Development Organization", "Session Link": null});
		});
		if (values.length) {
		    const request = {
		      method: 'POST',
		      headers: { 'Content-Type': 'application/json' },
		      body: JSON.stringify(values)
		    };
		    fetch("/api/group", request)
		      .then(response => response.json())
		      .then(data => {
			      $("body").append("Copy this to your app to visit sessions:").append("<br/");
			      $("body").append("<br/");
			      $("body").append('<textarea rows="10" cols="40">'+JSON.stringify(data, null, 2)+"</textarea>");
		      });
		}
	  });

      })
      .catch(error => console.error('Error:', error));
  }
try {
$(document).ready(function() {
  petNameUpdateAndQuery(null);
});
} catch (error) {
	console.error(error.message);
}
