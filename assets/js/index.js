var url = "http://www.dhbw.ramonbisswanger.de/calendar/3329493";







/*
	HELPER --------------------------------------------------------------------------------------
*/

var requestType = Object.freeze({"GET": "GET", "POST": "POST", "DELETE": "DELETE"});


/*
	DATA ---------------------------------------------------------------------------------------
*/

var entries = []; // all entries loaded
var categories = []; // all categories loaded
var currentMonth = new Date(); // date for month shown in calendar head


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
			var entryID = entries[getIndexOfElement(this, ".cell-add-foto-btn")];
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
		// Categories
		cellTmpl.querySelector(".cell-categories").onclick = function() {
			var entry = entries[getIndexOfElement(this, ".cell-categories")];

			openCategoryModal(entry);
		}
		for (var j = 0; j < categories.length; j++) {
			const category = categories[j];
			cellTmpl.querySelector(".cell-categories").innerHTML += '<div class="category-color" style="background: ' + convertTextToColor(category.name) + '""></div>';
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

/*
	================================================ CATEGORY VIEW ================================================
*/

function loadCategoryCells() {
	const categoryList = document.querySelector("#category-list");

	for (var i = 0; i < categories.length; i++) {
		const category = categories[i];
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
			const category = categories[getIndexOfElement(this, ".category-cell .delete")];
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

function updateCalendarMonthLbl() {
	var monthLbl = document.querySelector("#calendar-head div");

	monthLbl.innerText = $.format.date(currentMonth, "MMMM yyyy");;
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


	for (var i = 0; i < categories.length; i++) {
		const category = categories[i];

		const cellTmpl = document.querySelector("#cat-modal-cell-template").content.cloneNode(true);

		cellTmpl.querySelector(".title").textContent = category.name;

		catList.append(cellTmpl);
	}
}

function openCategoryModal(entry) {
	const catModal 	= document.querySelector("#category-modal");
	const submitBtn = catModal.querySelector(".blue.button");

	// show category modal
	catModal.style.display = "block";

	// fill category modal with the entry data (true or false)
	for (var i = 0; i < categories.length; i++) {
		const category = categories[i];
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
		for (var i = 0; i < categories.length; i++) {
			const category = categories[i];
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

	return data;
}

/*
	Message Toast
*/

function printToast(message) {
	console.warn(message);
}


/*
	Element Events =========================================================================================
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

// encodes images with base64
function convertImageToBase64(image) {
    var canvas, ctx, dataURL, base64;
    canvas = document.createElement("canvas");
    ctx = canvas.getContext("2d");
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
    dataURL = canvas.toDataURL("image/png");
    base64 = dataURL.replace(/^data:image\/png;base64,/, "");
    return base64;
}

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

/*
	Calendar Entries
*/

function loadEntries() {
	makeRequest(requestType.GET, url + "/events", function(request, event) {
		if (request.status >= 200 && request.status < 300) {
			entries = JSON.parse(request.responseText);

			console.log("Fetched entries successfully (loaded " + entries.length + ")");
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
	/*
	console.log("Update entry with id " + modalID);
	console.log(data);

	data.id = modalID;

	*/

	// PUT new entry data to specific id
	var request = new XMLHttpRequest();
	request.open("PUT", url + "/events/" + data.id);
	request.setRequestHeader("Content-type", "application/json", true);
	request.addEventListener("load", function() {
		if (request.status >= 200 && request.status < 300) {
			console.log("Updated entry with id " + data.id + ": \n" + request.responseText);
			window.location.reload(true);
		} else {
			console.warn(request.statusText, request.responseText);
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
	Category Management
*/

function loadCategories() {
	makeRequest(requestType.GET, url + "/categories", function(request, event) {
		if (request.status >= 200 && request.status < 300) {
			categories = JSON.parse(request.responseText);
			sortBy(categories, "name");

			console.log("Fetched categories successfully (loaded " + categories.length + ")");
			loadCategoryCells();
			loadEntries(); // GET Event Data & create list cells
			loadCategoryModal();
		} else {
			console.warn(request.statusText, request.responseText);
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
		}
	});
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

	loadCategories(); // GET list with all categories

	// Category View
	prepareCategoryView();
	// Calendar View
	updateCalendarMonthLbl();
	// Modals
	prepareModals();

});