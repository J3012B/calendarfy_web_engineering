var url = "http://www.dhbw.ramonbisswanger.de/calendar/3329493";







/*
	HELPER --------------------------------------------------------------------------------------
*/

var requestType = Object.freeze({"GET": "GET", "POST": "POST", "DELETE": "DELETE"});


/*
	DATA ---------------------------------------------------------------------------------------
*/

var entries = []; // all entries loaded
var currentMonth = new Date(); // date for month shown in calendar head
var modalID = 0; // ID of entry shown in modal


/*
	UI ---------------------------------------------------------------------------------------
*/

var cells = [];








/*
	FRONTEND -----------------------------------------------------------------------------------
*/

// load cells into list view
function loadCells(entries) {
	cells = [];

	for (var i = 0; i < entries.length; i++) {
		var entry = entries[i];

		var cellTmpl = document.getElementById("cell-template").content.cloneNode(true);
		cellTmpl.querySelector(".cell-title").innerText = entry.title;
		if (entry.location != null) {
			cellTmpl.querySelector(".cell-location").innerText = entry.location;
			cellTmpl.querySelector(".cell-location-btn").href = "https://www.google.de/maps/search/?api=1&query=" + entry.location.replace(/ /g,"+"); 
		} else {
			cellTmpl.querySelector(".cell-location").innerText = "";
			cellTmpl.querySelector(".cell-pin").remove();
		}
		// Date
		var startTime = formatDate(entry.start + ":00Z", "HH:mm");
		var startDate = formatDate(entry.start + ":00Z", "E, MMM d yyyy");
		var endTime = formatDate(entry.end + ":00Z", "HH:mm");
		cellTmpl.querySelector(".cell-time").innerText = startTime + " - " + endTime;
		cellTmpl.querySelector(".cell-date").innerText = startDate;
		// Buttons
		cellTmpl.querySelector(".cell-email-btn").setAttribute("href", "mailto:" + entry.organizer);
		if (entry.webpage != null) {
			cellTmpl.querySelector(".cell-public-btn").href = entry.webpage;
		} else {
			cellTmpl.querySelector(".cell-public-btn").style.display = "none";
		}
		cellTmpl.querySelector(".cell-delete-btn").onclick = function() {
			var cellIndex = getIndexOfElement(this, ".cell-delete-btn");
			deleteEntry(entries[cellIndex].id);
		};
		cellTmpl.querySelector(".cell-edit-btn").onclick = function() {
			openModal(entries[getIndexOfElement(this, ".cell-edit-btn")]);
		}


		var cell = cellTmpl.querySelector(".cell");
		cells.push(cell);

		$list.append(cellTmpl);
	
	}

	cells = document.querySelectorAll(".cell");

}

function updateCalendarMonthLbl() {
	var monthLbl = document.querySelector("#calendar-head div");

	monthLbl.innerText = $.format.date(currentMonth, "MMMM yyyy");;
}

/*
	MODAL -----------------------
*/

/* prepares modal for showing */
function prepareModal() {
	var modal = document.getElementById('modal');

	// When the user clicks anywhere outside of the modal, close it
	window.onclick = function(event) {
	    if (event.target == modal) {
	        modal.style.display = "none";
	    }
	}

	// Prepare Checkbox
	var startField = $(".modal-window #start-time-field");
	var endField = $(".modal-window #end-time-field");

	$(".modal-window #allday-cb").change(function() {

		startField.prop('disabled', this.checked);
		endField.prop('disabled', this.checked);
		startField.val("00:00");
		endField.val("23:59");
	});

	// Set Date Fields to today
	prepareDateFields();

}

/* prepares date fields in modal with default values */
function prepareDateFields() {
	var today = formatDate(new Date(), "yyyy-MM-dd"); // Today's date formatted
	var dateFields = document.querySelectorAll(".modal-window input[type=date]"); // [0]: Start, [1]: End

	// Set default values for date fields
	dateFields[0].value = today;
	dateFields[0].setAttribute("min", today);
	dateFields[1].value = today;
	dateFields[1].setAttribute("min", today);

	// Start Date Field did change
	dateFields[0].addEventListener("change", function() {
		var newStartDate = new Date(this.value); // User set a new start date
		dateFields[1].setAttribute("min", formatDate(newStartDate, "yyyy-MM-dd")); // Minimum Date of End is updated
		dateFields[1].value = formatDate(latestDate([newStartDate, new Date(dateFields[1].value)]), "yyyy-MM-dd");
	});

}

/* user opens modal */
function openModal(entry) {
	var modal = document.getElementById("modal");

	if (entry != null) {
		fillModal(entry);
		setModalButton(false);

		modalID = entry.id
	} else {
		clearModal();
		setModalButton(true);
	}

	prepareDateFields() // set default values for date inputs
	modal.style.display = "block"; // show modal
}

/* Sets style and functionality of the (Create/Edit)-Button */
function setModalButton(createNew) {
	var modalButton = $("#submit-btn");

	modalButton.off("click"); // remove event from button

	if (createNew) {
		modalButton.text("Create Entry");
		modalButton.removeClass("orange").addClass("blue");
		modalButton.on("click", function() {
			createEntry(retrieveModalData());
		});
	} else {
		modalButton.text("Update Entry");
		modalButton.removeClass("blue").addClass("orange");
		modalButton.on("click", function() {
			updateEntry(retrieveModalData());
		});
	}

}

function fillModal(entry) {
	$(".modal-window #title-tf").val(entry.title);
	$(".modal-window #location-tf").val(entry.location);
	$(".modal-window #start-date-field").val(formatDate(entry.start, "yyyy-MM-dd"));
	$(".modal-window #start-time-field").val(formatDate(entry.start + ":00Z", "HH:mm:ss.SSS"));
	$(".modal-window #end-date-field").val(formatDate(entry.end, "yyyy-MM-dd"));
	$(".modal-window #end-time-field").val(formatDate(entry.end + ":00Z", "HH:mm:ss.SSS"));
	$(".modal-window #start-time-field").prop('disabled', entry.allday);
	$(".modal-window #end-time-field").prop('disabled', entry.allday);
	$(".modal-window #allday-cb").prop('checked', entry.allday);
	$(".modal-window #organizer-tf").val(entry.organizer);
	$(".modal-window #webpage-tf").val(entry.webpage);
	$(".modal-window #title-tf").val(entry.title);
	$(".modal-window #location-tf").val(entry.location);
}

function clearModal() {
	$(".modal-window #title-tf").val("");
	$(".modal-window #location-tf").val("");
	prepareDateFields();
	$(".modal-window #start-time-field").val("");
	$(".modal-window #end-time-field").val("");
	$(".modal-window #allday-cb").prop('checked', false);
	$(".modal-window #status-select").val("Free");
	$(".modal-window #organizer-tf").val("");
	$(".modal-window #webpage-tf").val("");
}

function retrieveModalData() {
	var start = $("#start-date-field").val() + "T" + $("#start-time-field").val().substring(0,5);
	var end = $("#end-date-field").val() + "T" + $("#end-time-field").val().substring(0,5);

	var data = {
	    "title": $(".modal-window #title-tf").val(),
	    "location": $(".modal-window #location-tf").val(),
	    "organizer": $(".modal-window #organizer-tf").val(),
	    "start": start,
	    "end": end,
	    "status": $(".modal-window #status-select").val(),
	    "allday": $(".modal-window #allday-cb").prop('checked'),
	    "webpage": $(".modal-window #webpage-tf").val()
	};

	return data;
}


/*
	Element Events ---------------------------------------------------------------------------------------
*/

/* calendar: left arrow clicked */
function decreaseMonth() {
	currentMonth = new Date(currentMonth.setMonth(new Date(currentMonth.setDate(1)).getMonth() - 1));
	updateCalendarMonthLbl();
}
/* calendar: right arrow clicked */
function increaseMonth() {
	currentMonth = new Date(currentMonth.setMonth(new Date(currentMonth.setDate(1)).getMonth() + 1));
	updateCalendarMonthLbl();
}
/* modal:  */



/*
	Convert/Format ---------------------------------------------------------------------------------------
*/

// Takes date and returns formatted date string
function formatDate(date, format) {
	/* Lookup Documentation @https://github.com/phstc/jquery-dateFormat */
	return $.format.date(date, format);
}
// Compares dates and returns the latest one
function latestDate(dates) {
	return new Date(Math.max.apply(null, dates));
}
// Takes dom element and class selector and returns index of element in class selector list
function getIndexOfElement(element, selector) {
	var elementList = document.querySelectorAll(selector);

	for (var i = 0; i < elementList.length; i++) {
		if (element == elementList[i]) {
			return i;
		}
	}

	return -1;
}









/*
	BACKEND ---------------------------------------------------------------------------------------
*/

function makeRequest(requestType, requestURL, callback) {
	var request = new XMLHttpRequest();

	request.open(requestType, requestURL);
	request.addEventListener("load", function(event) {
		callback(request, event);
	});
	request.send();
}

function loadEntries() {
	makeRequest(requestType.GET, url + "/events", function(request, event) {
		if (request.status >= 200 && request.status < 300) {
			entries = JSON.parse(request.responseText);

			console.log("Fetching data successful (loaded " + entries.length + " event(s))");

			loadCells(entries);
		} else {
			console.warn(request.statusText, request.responseText);
		}
	});
}

function deleteEntry(id) {
	// DELETE event with specific id
<<<<<<< HEAD
	makeRequest(requestType.DELETE, url + "/events" + id, function(request, event) {
=======
	makeRequest(requestType.DELETE, url + "/events/" + id, function(request, event) {
>>>>>>> master
		if (request.status >= 200 && request.status < 300) {
			console.log("Deleted event with id " + id + " successfully.");
			window.location.reload(true);
		} else {
			console.warn(request.statusText, request.responseText);
		}
	});
<<<<<<< HEAD
=======

>>>>>>> master
}

function createEntry(data) {

	console.log("Create entry");

	// POST new entry
	var request = new XMLHttpRequest();
	request.open("POST", url + "/events/");
	request.setRequestHeader("Content-type", "application/json", true);
	request.addEventListener("load", function() {
		if (request.status >= 200 && request.status < 300) {
			console.log("Created new entry: \n" + request.responseText);
			window.location.reload(true);
		} else {
			console.warn(request.statusText, request.responseText);
		}
	});
	request.send(JSON.stringify(data));
	
}

function updateEntry(data) {
	console.log("Update entry with id " + modalID);
	console.log(data);

	data.id = modalID;

	// PUT new entry data to specific id
	var request = new XMLHttpRequest();
	request.open("PUT", url + "/events/" + modalID);
	request.setRequestHeader("Content-type", "application/json", true);
	request.addEventListener("load", function() {
		if (request.status >= 200 && request.status < 300) {
			console.log("Updated entry with id " + modalID + ": \n" + request.responseText);
			window.location.reload(true);
		} else {
			console.warn(request.statusText, request.responseText);
		}
	});
	request.send(JSON.stringify(data));

}

function addImageToEvent(image, id) {
	/*

	This method adds (or updates) an image to an existing event.
	/{user}/images/{event-id}
	POST
	•	event-id – Unique ID of the selected event (see “list” web service)

	Image content as form data with Content Type multipart/form-data
	•	file – Bildinhalt

	Alternatively, Base64-encoded image data via JSON-with Content Type application/json:
	{
	    "data": "data:ContentType;base64,ImageContent"
	}
	In case of success the following message is returned:

	{
	    "success": true,
	    "id": 5
	}
	•	The event ID needs to be referencing a valid event for the current account.
	•	The image is in JPEG / PNG format.
	•	The image does not exceed maximum size of 500 kB.

	*/
}














/*
	Document loaded ---------------------------------------------------------------------------------------
*/

$(document).ready(function() {
	// List
	$list = $("#list");

	// Calendar
	calendarBtns = document.querySelectorAll("#calendar-head a");
	calendarBtns[0].addEventListener("click", function() { decreaseMonth() });
	calendarBtns[1].addEventListener("click", function() { increaseMonth() });

	// Floating Button
	document.getElementById("floating-btn").onclick = function() { openModal(null); }

	// Modal View
	$(".modal-window #submit-btn").on("click", function() {
		console.log(this + " clicked");
	});


	loadEntries(); // GET Event Data & create list cells
	updateCalendarMonthLbl();
	prepareModal();

});