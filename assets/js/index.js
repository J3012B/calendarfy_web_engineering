var url = "http://www.dhbw.ramonbisswanger.de/calendar/3329493";







/*
	HELPER --------------------------------------------------------------------------------------
*/

var requestType = Object.freeze({"GET": "GET", "POST": "POST", "DELETE": "DELETE"});


/*
	DATA ---------------------------------------------------------------------------------------
*/

var _entries = []; // all entries loaded
var _entriesToShow = []; // filtered entries
var _categories = []; // all categories loaded
var _currentDate = new Date();
var _currentMonth = new Date(); // date for month shown in calendar head

var _currentRange = "Week"; // current range set (Day, Week, Month, Year, All)

/*
	UI ---------------------------------------------------------------------------------------
*/

var cells = [];








/*
	==========================================================================================================
	================================================ FRONTEND ================================================
	==========================================================================================================
*/

/*
	=========================================== LIST VIEW ============================================
*/

// load cells into list view
function loadCells(entries) {
	cells = [];
	$list.empty();

	if (entries.length == 0) {
		const msg = _currentRange === "All" ? "selection" : _currentRange.toLowerCase();
		$list.append('<div id="no-entries">There are no entries for this ' + msg + '</div>');
	}

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
			var entryID = _entriesToShow[getIndexOfElement(this, ".cell-add-foto-btn")];
			openImgModal(entryID);
		}
		cellTmpl.querySelector(".cell-delete-foto-btn").onclick = function() {
			var entryID = _entriesToShow[getIndexOfElement(this, ".cell-delete-foto-btn")].id;
			deleteImageFromEntry(entryID);
		}

		// Date
		var startTime = formatDate(entry.start + ":00Z", "HH:mm");
		var startDate = formatDate(entry.start + ":00Z", "E, MMM d yyyy");
		var endTime = formatDate(entry.end + ":00Z", "HH:mm");
		cellTmpl.querySelector(".cell-time").innerText = startTime + " - " + endTime;
		cellTmpl.querySelector(".cell-date").innerText = startDate;
		// Categories
		if (entry.categories.length == 0) {
			cellTmpl.querySelector(".cell-categories").innerHTML = '<div><i class="material-icons">assignment</i> <b>Assign categories</b></div>';
		}
		cellTmpl.querySelector(".cell-categories").onclick = function() {
			console.log("entries to show : " + _entriesToShow.length);
			console.log("entry cells     : " + document.querySelectorAll(".cell-categories").length);
			console.log("index of element: " + getIndexOfElement(this, ".cell-categories"));

			var entry = _entriesToShow[getIndexOfElement(this, ".cell-categories")];

			openCategoryModal(entry);
		}
		for (var j = 0; j < entry.categories.length; j++) {
			const category = entry.categories[j];
			cellTmpl.querySelector(".cell-categories").innerHTML += '<div class="category-color tooltip" style="background: ' + convertTextToColor(category.name) + '"><span class="tooltiptext">' + category.name + '</span></div>';
		}
		// Buttons
		cellTmpl.querySelector(".cell-email-btn").setAttribute("href", "mailto:" + entry.organizer);
		if (entry.webpage != null) {
			cellTmpl.querySelector(".cell-public-btn").href = entry.webpage;
		} else {
			cellTmpl.querySelector(".cell-public-btn").style.display = "none";
		}
		cellTmpl.querySelector(".cell-delete-btn").onclick = function() {
			var cellIndex = getIndexOfElement(this, ".cell-delete-btn");
			deleteEntry(_entriesToShow[cellIndex].id);
		};
		cellTmpl.querySelector(".cell-edit-btn").onclick = function() {
			openModal(_entriesToShow[getIndexOfElement(this, ".cell-edit-btn")]);
		}


		/*var cell = cellTmpl.querySelector(".cell");
		cells.push(cell);*/

		$list.append(cellTmpl);
	
	}

	cells = document.querySelectorAll(".cell");
}

function updateEntriesToShow() {
	_entriesToShow = filterEntriesByDateRange(_entries, getRangeOfDate(_currentDate, _currentRange));
	loadCells(_entriesToShow);
}

/*
	========================================= CALENDAR VIEW ==========================================
*/

function preparePeriodPicker() {
	const periodPicker = document.querySelector("#period-picker");
	periodPicker.value = _currentRange;

	periodPicker.onchange = function() {
		_currentRange = this.value; // "Day", "Week" or "Month"
		_entriesToShow = filterEntriesByDateRange(_entries, getRangeOfDate(_currentDate, _currentRange));

		loadCells(_entriesToShow);
		updatePeriodView();
	};
}

function updatePeriodView() {
	const periodView = document.querySelector("#period-view");

	switch (_currentRange) {
		case "Day":
			periodView.textContent = formatDate(_currentDate, "MMMM d yyyy");
			break;
		case "Week":
			const weekRange = getRangeOfDate(_currentDate, "Week");
			periodView.textContent = formatDate(weekRange.start, "MMM d") + " - " + formatDate(weekRange.end, "MMM d") + ", " + _currentDate.getFullYear();
			break;
		case "Month":
			periodView.textContent = formatDate(_currentDate, "MMMM yyyy");
			break; 
		case "Year":
			periodView.textContent = _currentDate.getFullYear();
			break;
		default:
			periodView.textContent = "All";
	}
}

function updateCalendar() {
	var monthLbl = document.querySelector("#calendar-head div");
	var calendarField = document.querySelector("#calendar-body tbody");

	/* Month Label */
	
	// Set inner text to current month
	monthLbl.innerText = $.format.date(_currentMonth, "MMMM yyyy");

	/* Calendar Field  */

	calendarField.innerHTML = "";
	const daysInCurrentMonth = getDaysInMonth(_currentMonth.getMonth(), _currentMonth.getFullYear());
	var weekDayOfFirst = new Date(_currentMonth.getFullYear(), _currentMonth.getMonth(), 1).getDay() - 1;
	weekDayOfFirst = (weekDayOfFirst < 0) ? 6 : weekDayOfFirst; // week day number of first day in current month

	var newTableBody = "<tr>";
	// generate empty cells in the beginning
	for (var i = 0; i < weekDayOfFirst; i++) {
		newTableBody += "<td></td>";
	}
	// generate the row with the first days
	for(var i = 0; i < 7 - weekDayOfFirst; i++) {
		newTableBody += "<td><div name=\"" + (i+1) + "\">" + (i+1) + "</div></td>";
	}
	newTableBody += "</tr>";

	// generate row 2 - row N
	const offset = 7 - weekDayOfFirst;
	for (var i = 0; i < daysInCurrentMonth - offset; i++) {
		newTableBody += ((i % 7 == 0) ? "<tr>" : "");
		newTableBody += ("<td><div name=\"" + (i+1+offset) + "\">" + (i+1+offset) + "</div></td>");
		newTableBody += ((i % 7 == 6) ? "</tr>" : "");
	}

	calendarField.innerHTML = newTableBody;

	/* Selection in Calendar Field */

	if (_currentMonth.getMonth() === _currentDate.getMonth() && _currentMonth.getFullYear() === _currentDate.getFullYear()) {
		const dateOfCurrentDate = new Date(_currentDate).getDate();
		const dateFieldToSelect = document.getElementsByName(dateOfCurrentDate)[0];

		dateFieldToSelect.className += " selected";
	}

	/* Event for Date Field */

	calendarField.querySelectorAll("div").forEach(function(dateField) {
		dateField.addEventListener("click", function() {
			calendarField.querySelectorAll("div").forEach(function(dateField) {
				dateField.classList.remove("selected");
			});

			const dateFieldDate = this.getAttribute("name");
			this.className += " selected";

			_currentDate = new Date(new Date(_currentMonth).getFullYear(), new Date(_currentMonth).getMonth(), dateFieldDate);

			updatePeriodView();
			updateEntriesToShow();
		});
	});

	
}

/*
	========================================= CATEGORY VIEW ==========================================
*/

function loadCategoryCells() {
	const categoryList = document.querySelector("#category-list");

	for (var i = 0; i < _categories.length; i++) {
		const category = _categories[i];
		var cellTmpl = document.querySelector("#category-cell-template").content.cloneNode(true);

		// cell
		cellTmpl.querySelector(".category-cell").onmouseover = function() {
			this.querySelector(".delete").style.visibility = "visible";
		}
		cellTmpl.querySelector(".category-cell").onmouseleave = function() {
			this.querySelector(".delete").style.visibility = "hidden";
		}

		// color div
		cellTmpl.querySelector(".category-color").style.background = convertTextToColor(category.name);
		// title label
		cellTmpl.querySelector(".title").textContent = category.name;
		// delete button
		cellTmpl.querySelector(".delete").onclick = function() {
			const category = _categories[getIndexOfElement(this, ".category-cell .delete")];
			console.log("Will delete category with id " + category.id + "");
			deleteCategory(category.id);
		}

		categoryList.append(cellTmpl);
	}
}
function prepareCategoryView() {
	const textInput = document.querySelector("#add-category input");
	const addBtn 	= document.querySelector("#add-category div.blue.button");

	addBtn.onclick = function() {
		createCategory(textInput.value);
		textInput.value = "";
	}
}

/*
	============================================ MODALS ==============================================
*/

/* hides all modal windows */
function hideAllModals() {
	var allModals = document.querySelectorAll(".modal");

	allModals.forEach(function(modal) {
		modal.style.display = "none";
	});
}

/*
	IMAGE MODAL ===============================================
*/

function openImgModal(entry) {
	var imgModal = document.querySelector("#img-modal");
	var imgInput = document.querySelector("#img-modal #image-input");
	var imgUploadBtn = document.querySelector("#img-modal .submit-btn");
	// Clear file input
	imgInput.value = "";
	// Show Modal
	imgModal.style.display = "block";
	// Set style of upload button
	if (entry.imageurl) {
		imgUploadBtn.textContent = "Update Image";
		imgUploadBtn.classList.remove("blue");
		imgUploadBtn.classList.add("orange");
	} else {
		imgUploadBtn.textContent = "Upload Image";
		imgUploadBtn.classList.remove("orange");
		imgUploadBtn.classList.add("blue");
	}
	// Set event for upload button
	imgUploadBtn.onclick = function() {
		const file = imgInput.files[0];

		var reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = function () {
			const encodedFile = reader.result;
			addImageToEntry(encodedFile, entry.id);
		};
		reader.onerror = function (error) {
			console.log("Couldn't convert file to base64: ", error);
			printToast("No file selected or bad conversion")
			return "";
		};
	}
}

/*
	CATEGORY MODAL ============================================
*/

function loadCategoryModal() {
	const catModal 	= document.querySelector("#category-modal");
	const catList 	= catModal.querySelector(".categories");

	for (var i = 0; i < _categories.length; i++) {
		const category = _categories[i];

		const cellTmpl = document.querySelector("#cat-modal-cell-template").content.cloneNode(true);

		// Color
		cellTmpl.querySelector(".category-color").style.background = convertTextToColor(category.name);
		// Title
		cellTmpl.querySelector(".title").textContent = category.name;

		catList.append(cellTmpl);
	}
}
function openCategoryModal(entry) {
	const catModal 	= document.querySelector("#category-modal");
	const submitBtn = catModal.querySelector(".blue.button");

	// set title
	catModal.querySelector("h2").textContent = entry.title;

	// show category modal
	catModal.style.display = "block";

	// fill category modal with the entry data (true or false)
	for (var i = 0; i < _categories.length; i++) {
		const category = _categories[i];
		const checkbox = catModal.querySelectorAll('input[type="checkbox"]')[i];

		checkbox.checked = false;

		for (var j = 0; j < entry.categories.length; j++) {
			if (entry.categories[j].name === category.name) {
				checkbox.checked = true;
				break;
			}
		}
	}

	// update entry, when button is clicked
	submitBtn.onclick = function() {
		entry.categories = [];
		for (var i = 0; i < _categories.length; i++) {
			const category = _categories[i];
			const checkboxValue = catModal.querySelectorAll('input[type="checkbox"]')[i].checked;

			if (checkboxValue != false) {
				entry.categories.push(category);
			}
		}

		updateEntry(entry)
	}
}

/*
	MODAL =====================================================
*/

/* prepares modal for showing */
function prepareModals() {
	const modal 		= document.querySelector("#modal");
	const imgModal 		= document.querySelector("#img-modal");
	const categoryModal = document.querySelector("#category-modal");

	// When the user clicks anywhere outside of the modal, close it
	window.addEventListener("click", function(event) {
	    if (event.target == modal || event.target == imgModal || event.target == categoryModal) {
	        event.target.style.display = "none";
	    }
	});

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

	/*
		Image Modal
	*/

	// Check if file has a proper size, when a file was selected
	document.querySelector("#image-input").onchange = function() {
		if (this.files[0].size > 500000) {
			alert("This file is too big! (max. 500 kB)");
	        this.value = "";
	    };
	}
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
	var modal = document.querySelector("#modal");

	prepareDateFields() // set default values for date inputs

	if (entry != null) {
		fillModal(entry);
		setModalButton(entry.id) // prepares the submit button (create new OR update old)
	} else {
		clearModal();
		setModalButton(null);
	}
	
	modal.style.display = "block"; // show modal
	modal.scrollTo(0, 0);
}
/* Sets style and functionality of the (Create/Edit)-Button */
function setModalButton(id) {
	var modalButton = $("#modal .submit-btn");

	modalButton.off("click"); // remove event from button

	if (!id) {
		modalButton.text("Create Entry");
		modalButton.removeClass("orange").addClass("blue");
		modalButton.on("click", function() {
			createEntry(retrieveModalData());
		});
	} else {
		modalButton.text("Update Entry");
		modalButton.removeClass("blue").addClass("orange");
		modalButton.on("click", function() {
			const data = retrieveModalData();
			data.id = id;
			updateEntry(data);
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
	$(".modal-window #status-select").val(entry.status);
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
	const start = $("#start-date-field").val() + "T" + $("#start-time-field").val().substring(0,5);
	const end = $("#end-date-field").val() + "T" + $("#end-time-field").val().substring(0,5);

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

	console.log("Status is: " + data.status);

	return data;
}

/*
	TOAST =====================================================
*/

function printToast(message) {
	var toast = document.querySelector("#toast");

	toast.textContent = message;

    toast.className = "show";
    // After 3 seconds, remove the show class from DIV
    setTimeout(function() { 
    	toast.className = toast.className.replace("show", ""); 
    }, 3000);
}


/*
	Element Events =========================================================================================
*/

/* calendar: left arrow clicked */
function decreaseMonth() {
	_currentMonth = new Date(_currentMonth.setMonth(new Date(_currentMonth.setDate(1)).getMonth() - 1));
	updateCalendar();
}
/* calendar: right arrow clicked */
function increaseMonth() {
	_currentMonth = new Date(_currentMonth.setMonth(new Date(_currentMonth.setDate(1)).getMonth() + 1));
	updateCalendar();
}


/*
	==========================================================================================================
	============================================= CONVERT/FORMAT =============================================
	==========================================================================================================
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
    	return new Date(a.start) - new Date(b.start);
	});
}

// Sorts array of objects by specified property
function sortBy(array, property) {
	return array.sort(function(a, b) {
		return a[property] > b[property];
	});
}

// Checks if array contains specified item
function arrayContainsItem(array, item) {
	for (var i = 0; i < array.length; i++) {
		if (array[i] === item) {
			return true;
		}
	}
	return false;
}

// returns all entries, which begin in the specified range
function filterEntriesByDateRange(array, range) {
	var result = [];

	for (var i = 0; i < array.length; i++) {
		const item = array[i];

		if (isDateInRange(new Date(item.start), range)) {
			result.push(item);
		}
	}

	return result;
}

// returns a start and an end date (f.i. 23.03.18) which represents either the 
//		1. day of a date    -> start: 0:00 23.03.18, end: 23:59 23.03.18
//		2. week of a date   -> start: 0:00 19.03.18, end: 23:59 25.03.18
//		3. month of a date  -> start: 0:00  1.03.18, end: 23:59 31.03.18
function getRangeOfDate(date, rangeName) {
	var start = date;
	var end = date;

	switch (rangeName) {
		case "Day":
			start = start.setHours(0, 0, 0);
			end = end.setHours(23, 59, 59);
			break;
		case "Week":
			start = getMonday(start).setHours(0, 0, 0);
			end = getSunday(end).setHours(23, 59, 0);
			break;
		case "Month":
			start = new Date(start.getFullYear(), start.getMonth(), 1);
			end = new Date(end.getFullYear(), end.getMonth() + 1, 0);
			break;
		case "Year":
			start = new Date(start.getFullYear(), 0, 1);
			end = new Date(end.getFullYear(), 11, 31);
			break;
		default:
			start = new Date(2000, 0, 1);
			end = new Date(3000, 0, 1);
	}

	return {
		start: new Date(new Date(start).setHours(0,0,0)),
		end: new Date(new Date(end).setHours(23, 59, 0))
	};
}

// returns the monday of the week of a given date
function getMonday(d) {
  d = new Date(d);
  var day = d.getDay(),
      diff = d.getDate() - day + (day == 0 ? -6:1); // adjust when day is sunday
  return new Date(d.setDate(diff));
}
// returns the sunday of the week of a given date
function getSunday(d) {
  d = new Date(d);
  var day = d.getDay(),
      diff = d.getDate() + (7 - day) - (day == 0 ? 7:0); // adjust when day is sunday
  return new Date(d.setDate(diff));
}

// checks if given date is in between given range
function isDateInRange(date, range) {
	return (range.start <= date && date <= range.end);
}

// returns the count of days in a given month
function getDaysInMonth(month, year) {
	return new Date(year, month+1, 0).getDate();
};


// generates color from string ===============================
function convertTextToColor(text) {
	return "#" + intToRGB(hashCode(text));
}

function hashCode(str) { // java String#hashCode
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
       hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
} 

function intToRGB(i){
    var c = (i & 0x00FFFFFF)
        .toString(16)
        .toUpperCase();

    return "00000".substring(0, 6 - c.length) + c;
}

// ===========================================================










/*
	==========================================================================================================
	================================================ BACKEND =================================================
	==========================================================================================================
*/

function makeRequest(requestType, requestURL, callback) {
	var request = new XMLHttpRequest();

	request.open(requestType, requestURL);
	request.addEventListener("load", function(event) {
		callback(request, event);
	});
	request.send();
}

/*
	Calendar Entries
*/

function loadEntries() {
	makeRequest(requestType.GET, url + "/events", function(request, event) {
		if (request.status >= 200 && request.status < 300) {
			_entries = JSON.parse(request.responseText); // save entries
			sortEntriesByDate(_entries); // sort entries
			updateEntriesToShow(); // update entries, which are displayed

			console.log("Fetched entries successfully (loaded " + _entries.length + ")");
		} else {
			console.warn(request.statusText, request.responseText);
			printToast("Couldn't load entries");
		}
	});
}
function deleteEntry(id) {
	// DELETE event with specific id
	makeRequest(requestType.DELETE, url + "/events/" + id, function(request, event) {
		if (request.status >= 200 && request.status < 300) {
			console.log("Deleted event with id " + id + " successfully.");

			for (var i = 0; i < _entries.length; i++) {
				if (_entries[i].id === id) 
					_entries.splice(i, 1);
			}
			updateEntriesToShow();
		} else {
			console.warn(request.statusText, request.responseText);
			printToast("Couldn't delete entry");
		}
	});
}
function createEntry(data) {
	// POST new entry
	var request = new XMLHttpRequest();
	request.open("POST", url + "/events/");
	request.setRequestHeader("Content-type", "application/json", true);
	request.addEventListener("load", function() {
		if (request.status >= 200 && request.status < 300) {
			console.log("Created new entry: \n" + request.responseText);

			const newEntry = JSON.parse(request.responseText);
			_entries.push(newEntry)
			sortEntriesByDate(_entries);
			updateEntriesToShow();
			hideAllModals();
		} else {
			console.warn(request.statusText, request.responseText);
			printToast("Couldn't create a new entry: " + JSON.parse(request.responseText).description);
		}
	});
	request.send(JSON.stringify(data));
}
function updateEntry(data) {
	// PUT new entry data to specific id
	var request = new XMLHttpRequest();
	request.open("PUT", url + "/events/" + data.id);
	request.setRequestHeader("Content-type", "application/json", true);
	request.addEventListener("load", function() {
		if (request.status >= 200 && request.status < 300) {
			console.log("Updated entry with id " + data.id + ": \n" + request.responseText);
			
			const updatedEntry = JSON.parse(request.responseText);
			for (var i = 0; i < _entries.length; i++) {
				if (_entries[i].id === updatedEntry.id) {
					_entries.splice(i, 1);
				}
			} // remove old entry
			_entries.push(updatedEntry) // add new entry
			sortEntriesByDate(_entries);
			updateEntriesToShow();
			hideAllModals();
		} else {
			console.warn(request.statusText, request.responseText);
			printToast("Couldn't update entry");
		}
	});
	request.send(JSON.stringify(data));
}

/*
	Image Handling
*/

function addImageToEntry(encodedImage, entryID) {
	var data = {
		imagedata: encodedImage
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
			printToast("Couln't add image to entry");
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
			printToast("Couln't delete image from entry");
		}
	});
	request.send();
}

/*
	Category Management
*/

function loadCategories() {
	makeRequest(requestType.GET, url + "/categories", function(request, event) {
		if (request.status >= 200 && request.status < 300) {
			_categories = JSON.parse(request.responseText);
			sortBy(_categories, "name");

			console.log("Fetched categories successfully (loaded " + _categories.length + ")");
			loadCategoryCells();
			loadEntries(); // GET Event Data & create list cells
			loadCategoryModal();
		} else {
			console.warn(request.statusText, request.responseText);
			printToast("Couln't load categories");
		}
	});
}
function createCategory(name) {
	var data = {
		name: name
	};

	var request = new XMLHttpRequest();
	request.open(requestType.POST, url + "/categories");
	request.setRequestHeader("Content-type", "application/json", true);
	request.addEventListener("load", function() {
		if (request.status >= 200 && request.status < 300) {
			console.log("Created new category '" + name + "' successfully");
			window.location.reload(true);
		} else {
			console.warn(request.statusText, request.responseText);
			printToast("Couln't create category");
		}
	});
	request.send(JSON.stringify(data));
}
function deleteCategory(categoryID) {
	makeRequest(requestType.DELETE, url + "/categories/" + categoryID, function(request, event) {
		if (request.status >= 200 && request.status < 300) {
			console.log("Deleted category with id " + categoryID + "successfully");

			window.location.reload(true);
		} else {
			console.warn(request.statusText, request.responseText);
			printToast("Couln't delete category");
		}
	});
}














/*
	==========================================================================================================
	============================================ DOCOUMENT LOADED ============================================
	==========================================================================================================
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

	loadCategories(); // GET list with all categories

	// Period Picker
	preparePeriodPicker();
	updatePeriodView();
	// Category View
	prepareCategoryView();
	// Calendar View
	updateCalendar();
	// Modals
	prepareModals();

});