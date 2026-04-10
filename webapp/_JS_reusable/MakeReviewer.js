"use strict";

function MakeReviewer({
    userName = "henry jenkins",
    ratingTitle = "N/A",
    authorName = "N/A",
    bookName = "N/A",
    review = "N/A",
    horrorSubgenre = "N/A",
    rating = null,
    dateRead = null,
    fearImageURL = null
}) {
    let reviewed = review;

    var reviewObj = document.createElement("div");
    reviewObj.className = "reviews";

    var displayReview = document.createElement("div");
    displayReview.className = "displayReview";

    var editReview = document.createElement("div");
    editReview.className = "editReview";
    editReview.style.display = "none";

    // Make edit and save buttons
    var editingButton = document.createElement("button");
    editingButton.textContent = "Edit Freak Factor";
    var savingButton = document.createElement("button");
    savingButton.textContent = "Save Freak Factor";
    savingButton.style.display = "none";

    // Rendering display content with updated info
    const renderDisplayContent = (values) => {
        const {
            userName,
            ratingTitle,
            authorName,
            bookName,
            reviewed,
            horrorSubgenre,
            rating,
            dateRead,
            fearImageURL
        } = values;

        displayReview.innerHTML = `
            <h3>${userName}</h3>
            <p><strong><span class="almTitle">Author:</strong> ${authorName}</span></p><br>
            <p><strong>Book:</strong> ${bookName}</p><br>
            <p><strong>The Rating:</strong> ${ratingTitle}</p><br>
            <p><strong><span class="daReview">Review:</strong> ${reviewed}</span></p><br>
            <p><strong>Horror Subgenre:</strong> ${horrorSubgenre}</p><br>
            <p><strong>Freak Factor (1-5):</strong> ${rating}</p><br>
            <p><strong>Date Read:</strong> ${dateRead}</p><br>
        `;

        if (fearImageURL == null) {
            displayReview.innerHTML += "<p>image not available</p><br/>";
        } else {
            displayReview.innerHTML += `<img src='${fearImageURL}' alt='Level of Fear' style='width:8rem;'/><br/>`;
        }
    };

    // Function to check if image exists and then render
    const checkAndRenderImage = (values) => {
        const url = values.fearImageURL;
        if (!url) {
            renderDisplayContent(values);
            return;
        }

        const img = new Image();
        img.onload = () => {
            renderDisplayContent(values);
        };
        img.onerror = () => {
            renderDisplayContent({ ...values, fearImageURL: null });
        };
        img.src = url;
    };

    let currVal = {
        userName,
        ratingTitle,
        authorName,
        bookName,
        reviewed,
        horrorSubgenre,
        rating,
        dateRead,
        fearImageURL
    };

    checkAndRenderImage(currVal);

    // Populate edit form (inputs for character fields; simple setters for non-character)
    const popEditForm = (values) => {
        // Predefined horror subgenres (simple setter: dropdown only)
        const subgenreOptions = [
            { value: "N/A", text: "N/A (Select One)" },
            { value: "Gothic", text: "Gothic" },
            { value: "Psychological", text: "Psychological" },
            { value: "Supernatural", text: "Supernatural" },
            { value: "Slasher", text: "Slasher" },
            { value: "Cosmic Horror", text: "Cosmic Horror" },
            { value: "Found Footage", text: "Found Footage" }
        ];
        const subgenreSelect = subgenreOptions.map(option => 
            `<option value="${option.value}" ${values.horrorSubgenre === option.value ? 'selected' : ''}>${option.text}</option>`
        ).join('');

        editReview.innerHTML = `
            <h3><input type="text" class="userNameInp" value="${values.userName}"/></h3>
            <p><strong><span class="almTitle">Author:</strong> <input type="text" class="authorNameInput" value="${values.authorName}"/></span></p><br>
            <p><strong>Book:</strong> <input type="text" class="bookNameInput" value="${values.bookName}"/></p><br>
            <p><strong>The Rating:</strong> <input type="text" class="ratingTitleInput" value="${values.ratingTitle}"/></p><br>
            <p><strong><span class="daReview">Review:</strong> <input type="text" class="reviewInput" value="${values.reviewed}"/></span></p><br>
            <p><strong>Horror Subgenre:</strong> <select class="horrorSubgenreInput">${subgenreSelect}</select></p><br>
            
            
            <p><strong>Freak Factor (1-5):</strong> <input type="number" class="ratingInput" min="1" max="5" step="1" value="${values.rating || ''}"/></p><br>
            <p><strong>Date Read:</strong> <input type="date" class="dateReadInput" value="${values.dateRead || ''}"/></p><br>
            <p><strong>Image URL:</strong> <input type="text" class="fearImageURLInput" value="${values.fearImageURL ? values.fearImageURL : ''}" placeholder="Valid URL (e.g., https://example.com/image.jpg)"/></p><br>
        `;
    };
    popEditForm(currVal);

    reviewObj.appendChild(displayReview);
    reviewObj.appendChild(editReview);
    reviewObj.appendChild(editingButton);
    reviewObj.appendChild(savingButton);

    editingButton.addEventListener("click", () => {
        displayReview.style.display = "none";
        editReview.style.display = "block";
        editingButton.style.display = "none";
        savingButton.style.display = "inline-block";
    });

    savingButton.addEventListener("click", () => {
        // Get new values from inputs
        const newUserName = editReview.querySelector(".userNameInp").value.trim();
        const newRatingTitle = editReview.querySelector(".ratingTitleInput").value.trim(); // Fixed: Removed colon from selector
        const newAuthorName = editReview.querySelector(".authorNameInput").value.trim();
        const newBookName = editReview.querySelector(".bookNameInput").value.trim();
        const newReviewed = editReview.querySelector(".reviewInput").value.trim();
        const newHorrorSubgenre = editReview.querySelector(".horrorSubgenreInput").value; // From dropdown - always valid
        const newRatingInput = editReview.querySelector(".ratingInput").value;
        const newDateRead = editReview.querySelector(".dateReadInput").value;
        const newFearImageURL = editReview.querySelector(".fearImageURLInput").value.trim();

        // Validation for non-character properties (enforces simple setters - meets -1.5)
        let newRating = null;
        if (newRatingInput && !isNaN(newRatingInput) && parseFloat(newRatingInput) >= 1 && parseFloat(newRatingInput) <= 5) {
            newRating = parseFloat(newRatingInput);
        } else if (newRatingInput) {
            alert("Freak Factor must be a number between 1 and 5.");
            return; // Block save
        }

        let validURL = null;
        if (newFearImageURL) {
            try {
                new URL(newFearImageURL); // Validates URL format
                validURL = newFearImageURL;
            } catch (e) {
                alert("Image URL must be a valid URL (e.g., https://example.com/image.jpg).");
                return; // Block save
            }
        }

        if (newDateRead && isNaN(Date.parse(newDateRead))) {
            alert("Date Read must be a valid date.");
            return; // Block save
        }

        // Update currVal only if valid
        currVal = {
            userName: newUserName,
            ratingTitle: newRatingTitle,
            authorName: newAuthorName,
            bookName: newBookName,
            reviewed: newReviewed,
            horrorSubgenre: newHorrorSubgenre,
            rating: newRating,
            dateRead: newDateRead,
            fearImageURL: validURL
        };

        checkAndRenderImage(currVal);

        displayReview.style.display = "block";
        editReview.style.display = "none";
        editingButton.style.display = "inline-block";
        savingButton.style.display = "none";

        popEditForm(currVal); // Refresh form with new values
    });

    return reviewObj;
}
