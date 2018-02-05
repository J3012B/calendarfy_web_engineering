var url = "http://www.dhbw.ramonbisswanger.de/calendar/3329493";










/*
	DATA ---------------------------------------------------------------------------------------
*/

var entries = [];
var currentMonth = new Date();


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
		cellTmpl.querySelector(".cell-location").innerText = entry.location;
		cellTmpl.querySelector(".cell-location-btn").href = "https://www.google.de/maps/search/?api=1&query=" + entry.location.replace(/ /g,"+"); 
		// Date
		var startTime = formatDate(entry.start + ":00Z", "HH:mm");
		var startDate = formatDate(entry.start + ":00Z", "E, MMM d yyyy");
		var endTime = formatDate(entry.end + ":00Z", "HH:mm");
		cellTmpl.querySelector(".cell-time").innerText = startTime + " - " + endTime;
		cellTmpl.querySelector(".cell-date").innerText = startDate;
		// Buttons
		cellTmpl.querySelector(".cell-delete-btn").onclick = function() {
			var cellIndex = getIndexOfElement(this, ".cell-delete-btn");
			deleteEvent(entries[cellIndex].id);
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
		setModalButton(false);

		document.getElementById("title-tf").value = entry.title;
		$("#location-tf").val(entry.location);

		console.log($("#location-tf").val());
	} else {
		setModalButton(true);
	}

	modal.style.display = "block";
}

/*  */
function setModalButton(createNew) {

	if (createNew) {
		$("#submit-btn").text("Create Entry");
	} else {
		$("#submit-btn").text("Update Entry");
	}
}

function fillModal(entry) {

}

function clearModal() {

}


/*
	DOM Events ---------------------------------------------------------------------------------------
*/

function decreaseMonth() {
	currentMonth = new Date(currentMonth.setMonth(new Date(currentMonth.setDate(1)).getMonth() - 1));
	updateCalendarMonthLbl();
}
function increaseMonth() {
	currentMonth = new Date(currentMonth.setMonth(new Date(currentMonth.setDate(1)).getMonth() + 1));
	updateCalendarMonthLbl();
}



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

function loadEvents() {
	// GET all events from server
	var request = new XMLHttpRequest();
	request.open("GET", url + "/events");
	request.addEventListener("load", function(event) {
		if (request.status >= 200 && request.status < 300) {
			entries = JSON.parse(request.responseText);

			console.log("Fetching data successful (loaded " + entries.length + " event(s))");

			loadCells(entries);
		} else {
			console.warn(request.statusText, request.responseText);
		}
	});
	request.send();
}

function deleteEvent(id) {
	// DELETE event with specific id
	var request = new XMLHttpRequest();
	request.open("DELETE", url + "/events/" + id);
	request.addEventListener("load", function(event) {
		if (request.status >= 200 && request.status < 300) {
			console.log("Deleted event with id " + id + " successfully.");
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

	// Modal View
	document.getElementById("floating-btn").onclick = function() { openModal(null); }


	loadEvents(); // GET Event Data & create list cells
	updateCalendarMonthLbl();
	prepareModal();

});