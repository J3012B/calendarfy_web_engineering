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
		
		// Title
		cellTmpl.querySelector(".cell-title").innerText = entry.title;
		// Image
		if (entry.imageurl) {
			cellTmpl.querySelector(".cell-img").style.backgroundImage = 'url("' + entry.imageurl + '")';
		}
		// Location
		if (entry.location != null) {
			cellTmpl.querySelector(".cell-location").innerText = entry.location;
			cellTmpl.querySelector(".cell-location-btn").href = "https://www.google.de/maps/search/?api=1&query=" + entry.location.replace(/ /g,"+"); 
		} else {
			cellTmpl.querySelector(".cell-location").innerText = "";
			cellTmpl.querySelector(".cell-pin").remove();
		}
		// Foto Buttons
		cellTmpl.querySelector(".cell-add-foto-btn").onclick = function() {
			var entryID = entries[getIndexOfElement(this, ".cell-add-foto-btn")].id;
			openImgModal(entryID);
		}
		cellTmpl.querySelector(".cell-delete-foto-btn").onclick = function() {
			var entryID = entries[getIndexOfElement(this, ".cell-delete-foto-btn")].id;
			deleteImageFromEntry(entryID);
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
	IMAGE MODAL ===============================================
*/

function openImgModal(entryID) {
	var imageModal = document.querySelector("#img-modal");

	imageModal.style.display = "block";
}

/*
	MODAL =====================================================
*/

/* prepares modal for showing */
function prepareModal() {
	const modal = document.getElementById('modal');

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

	// Limit maximal file size for entry image
	// imageUploadInput.onchange = function() {
	//     if(this.files[0].size > 500000){
	//        alert("This file is too big! (max. 500 kB)");
	//        this.value = "";
	//     };
	// };

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
	    //"imagedata": "data:application/json;base64," + convertImageToBase64(document.getElementById("image-up").files[0])
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
// Sorts entries by date
function sortEntriesByDate(entries) {
	return entries.sort(function(a, b) {
    	return new Date(b.start) - new Date(a.start);
	});
}

// function convertImageToBase64(file) {
// 	var reader = new FileReader();
// 	reader.readAsDataURL(file);
//    	reader.onload = function () {
//     	return reader.result;
//    	};
//    	reader.onerror = function (error) {
//      	console.log("Couldn't convert file to base64: ", error);
//      	return "";
//    	};
// }









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
			sortEntriesByDate(entries);

			loadCells(entries);
		} else {
			console.warn(request.statusText, request.responseText);
		}
	});
}
function deleteEntry(id) {
	// DELETE event with specific id
	makeRequest(requestType.DELETE, url + "/events/" + id, function(request, event) {
		if (request.status >= 200 && request.status < 300) {
			console.log("Deleted event with id " + id + " successfully.");
			window.location.reload(true);
		} else {
			console.warn(request.statusText, request.responseText);
		}
	});
}
function createEntry(data) {

	data.imagedata = 'data:image/jpeg;base64,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';

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

function addImageToEntry(encodedImage, entryID) {

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

	var data = {
		data: "data:application/json;base64," + encodedImage
	};

	var request = new XMLHttpRequest();
	request.open("POST", url + "/images/" + entryID);
	request.setRequestHeader("Content-type", "application/json", true);
	request.addEventListener("load", function() {
		if (request.status >= 200 && request.status < 300) {
			console.log("Added an image to event with id " + entryID + " successfully.");
			window.location.reload(true);
		} else {
			console.warn(request.statusText, request.responseText);
		}
	});
	request.send(JSON.stringify(data));
}

function deleteImageFromEntry(entryID) {

	console.log("Delete image with id " + entryID);

	var request = new XMLHttpRequest();
	request.open("DELETE", url + "/images/" + entryID);
	//request.setRequestHeader("Content-type", "application/json", true);
	request.addEventListener("load", function() {
		if (request.status >= 200 && request.status < 300) {
			console.log("Deleted image from event with id " + entryID + " successfully.");
			window.location.reload(true);
		} else {
			console.warn(request.statusText, request.responseText);
		}
	});
	request.send();
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