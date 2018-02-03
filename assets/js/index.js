var url = "http://www.dhbw.ramonbisswanger.de/calendar/3329493";










/*
	DATA
*/

var entries = [];
var currentMonth = new Date();


/*
	UI
*/

var cells = [];








/*
	FRONTEND
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
		var startTime = convertDateString(entry.start, "HH:mm");
		var startDate = convertDateString(entry.start, "E, MMM d yyyy");
		var endTime = convertDateString(entry.end, "HH:mm");
		cellTmpl.querySelector(".cell-time").innerText = startTime + " - " + endTime;
		cellTmpl.querySelector(".cell-date").innerText = startDate;
		// Buttons
		cellTmpl.querySelector(".cell-delete-btn").onclick = function() {
			var cellIndex = getIndexOfElement(this, ".cell-delete-btn");
			deleteEvent(entries[cellIndex].id);
		};
		cellTmpl.querySelector(".cell-edit-btn").onclick = function() {
			openModal(entry);
		}


		var cell = cellTmpl.querySelector(".cell");
		cells.push(cell);
		
		$list.append(cellTmpl);


		/*
		entryCellTmpl.querySelector(".cell-title").innerText = entry.title;
		entryCellTmpl.querySelector(".cell-img").src = "https://www.st-christophers.co.uk/__data/assets/image/0005/462614/prague_hero.jpg"
		
		// Date
		var startTime = convertDateString(entry.start + ":00Z", "HH:mm");
		var endTime = convertDateString(entry.end + ":00Z", "HH:mm");
		entryCellTmpl.querySelector(".cell-date").innerText = startTime + " - " + endTime;

		// Add Events
		var cell = entryCellTmpl.querySelector(".cell");

		cell.onclick = function() {
			console.log("Clicked on Cell");
		}

		cell.onmouseover = function() {
			this.style["background"] = "#F5F5F5";
		}

		cell.onmouseout = function() {
			this.style["background"] = "white";
		}

		cell.onmouseup = function() {
			this.style["background"] = "white";
		}

		cell.onmousemove = function() {
			this.style["background"] = "#F5F5F5";
		}
	*/

	
	}

	cells = document.querySelectorAll(".cell");

}

function updateCalendarMonthLbl() {
	var monthLbl = document.querySelector("#calendar-head div");

	monthLbl.innerText = $.format.date(currentMonth, "MMMM yyyy");;
}

// Modal
function prepareModal() {
	var modal = document.getElementById('modal');

	// When the user clicks anywhere outside of the modal, close it
	window.onclick = function(event) {
	    if (event.target == modal) {
	        modal.style.display = "none";
	    }
	}
}

function openModal(entry) {
	var modal = document.getElementById("modal");


	if (entry != null) {
		document.getElementById("modal-title-tf").innerText = entry.title;
	} else {

	}

	modal.style.display = "block";
}


/*
	Button Events
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
	Convert/Format
*/

function convertDateString(dateString, format) {
	/* Lookup Documentation @https://github.com/phstc/jquery-dateFormat */
	return $.format.date(dateString + ":00Z", format);
}

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
	BACKEND
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
			console.log("Deleted event with id=" + id + " successfully.");
			console.log(JSON.parse(request.responseText));
			location.reload(true);
		} else {
			console.warn(request.statusText, request.responseText);
		}
	});
	request.send();

}














/*
	Document loaded
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