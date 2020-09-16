/*
 * This flickr app consists of the 5 classes:
 * Gallery, SearchResult, LocalStorage, Message and Helpers.
 * They are all initialised in the bottom of this file.
 */

/*
 * Gallery.
 * Handles displaying photos in the gallery.
 */
class Gallery {

    constructor(lStorage) {

        // Dependencies
        this.lStorage = lStorage;

        // Find some elements.
        this.galleryEl = document.querySelector('.gallery');
        this.galleryButtonEl = document.querySelector('.gallery-button');
        this.galleryContentEl = document.querySelector('.gallery__content');
        this.galleryButtonLeftEl = document.querySelector('.gallery__control-left');
        this.galleryButtonRightEl = document.querySelector('.gallery__control-right');

        // Add event listeners.
        this.galleryEl.addEventListener('click', (e) => this.hideGallery(e));
        this.galleryButtonEl.addEventListener('click', () => this.displayGallery());
        this.galleryButtonLeftEl.addEventListener('click', () => this.navigateGalleryImage('left'));
        this.galleryButtonRightEl.addEventListener('click', () => this.navigateGalleryImage('right'));
    }

    /*
     * Handles showing next or previous
     * gallery image.
     * 'direction' is left|right.
     */
    navigateGalleryImage(direction) {

        // Get currently displayed image.
        const galleryListEl = this.galleryContentEl.querySelector('.gallery__list');
        const currentImageEl = galleryListEl.querySelector('.visible');
        if (!currentImageEl) return false;

        // Get next image and display it.
        const nextImageEl = direction === 'left' ? currentImageEl.previousSibling : currentImageEl.nextSibling;
        if (!nextImageEl) return false;
        currentImageEl.classList.remove('visible');
        nextImageEl.classList.add('visible');

        return true;
    }

    /*
     * Hides the gallery.
     */
    hideGallery(e) {

        const isGalleryClicked = e.target.classList.contains('gallery');
        if (!isGalleryClicked) return;

        // Hide it.
        this.galleryEl.classList.remove('visible');
        document.querySelector('.searchresults').classList.remove('clipped');
    }

    /*
     * Builds HTML from the image urls stored
     * in localStorage and inserts it into the DOM.
     */
    displayGallery() {

        // Remove previous gallery.
        const oldGallery = this.galleryContentEl.querySelector('.gallery__list');
        if (oldGallery) this.galleryContentEl.removeChild(oldGallery);

        // Get gallery images from Local Storage.
        const galleryImagesUrls = this.lStorage.get();

        // Loop through images json and return list of images.
        const imageHtmlListItems = galleryImagesUrls.reduce((prev, imageUrl, i) => {
            // Replace small image url with a url to larger image.
            const largeImageUrl = imageUrl.replace(/(_m\.jpg$)/, '.jpg');
            return `${prev}<li><img src=${largeImageUrl} alt='flickr-img-${i}' /><div class='gallery__X'>X</div></li>`;
        }, '');

        // Insert images list into DOM wrapped in <ul>.
        const imageHtmlList = `<ul class='gallery__list'>${imageHtmlListItems}</ul>`;
        this.galleryContentEl.insertAdjacentHTML('beforeend', imageHtmlList);

        // Display only first image...
        const firstImageEl = this.galleryContentEl.querySelector('.gallery__list').firstChild;
        if (firstImageEl) {
            firstImageEl.classList.add('visible');
        }
        // ...or message to user if no images in gallery.
        else {
            const noImageMessage = '<div>No images in gallery! Try searching for some...</div>';
            this.galleryContentEl.querySelector('.gallery__list').innerHTML = noImageMessage;
        }

        // Add click event listeners to the 'remove' icon.
        Array.from(this.galleryContentEl.querySelectorAll('.gallery__X'))
             .forEach(removeButton =>
                removeButton.addEventListener('click', (e) => this.removeImageFromGallery(e))
             );

        // Show gallery and blur the search results.
        this.galleryEl.classList.add('visible');
        document.querySelector('.searchresults').classList.add('clipped');
    }

    /*
     * Removes image from local storage and DOM,
     * then navigates to next image.
     */
    removeImageFromGallery(e) {
        // Remove image from local storage.
        const imageSrc = e.target.previousSibling.src;
        this.lStorage.remove(imageSrc.replace(/(\.jpg$)/, '_m.jpg')); // <-- Replace... Ich!

        // Before removing image, we must navigate away from it.
        if (!this.navigateGalleryImage('right')) {
            if (!this.navigateGalleryImage('left')) {
                // Oh, no more images... Just end it and replace it all with some text.
                const noImageMessage = '<div>No more photos!</div>';
                this.galleryContentEl.querySelector('.gallery__list').innerHTML = noImageMessage;
                return;
            }
        }

        // Remove image (or actually the whole <li>) from DOM.
        const listItem = e.target.parentNode;
        listItem.parentNode.removeChild(listItem);
    }
}

/*
 * Search result.
 * Handles searching flickr for photos and
 * displaying and selecting photos.
 */
class SearchResult {

    constructor(helpers, message, lStorage) {

        // Dependencies
        this.helpers = helpers;
        this.message = message;
        this.lStorage = lStorage;

        // Vars
        this.flickrSearchURL = 'https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=b54580f369a7eeebecb2004dc429d08f&format=json&nojsoncallback=1';

        // Find some elements.
        this.searchInputTextEl = document.querySelector('.searchfield__input');
        this.searchButtonEl = document.querySelector('.searchfield__submit-button');
        this.searchResultsEl = document.querySelector('.searchresults');

        // Add event listeners.
        this.searchInputTextEl.addEventListener('keydown', (e) => {if (e.keyCode === 13) this.fetchFlickrSearchResult(e);});
        this.searchButtonEl.addEventListener('click', (e) => this.fetchFlickrSearchResult(e));

        // Init
        this.searchInputTextEl.focus();
    }

    /*
     * Fetch flickr photos and dispath handling
     * of the response.
     */
    fetchFlickrSearchResult(e) {
        e.preventDefault();

        // Show message if no search text was given.
        if (!this.searchInputTextEl.value) {
            this.message.displayMessage('You need to search for something...');
            return;
        }

        // Build url to fetch from with the text from search input field.
        const searchUrl = `${this.flickrSearchURL}&text=${this.searchInputTextEl.value}`;

        // Do fetch and handle response...
        fetch(searchUrl)
            .then(response => {
                return response.json();
            })
            .then(json => {
                this.displayFlickrSearchResult(json);
            })
            .catch(error => {
                console.log('Oops! Something went wrong...');
                console.log(error);
            });
    }

    /*
     * Build HTML from the response from flickr and
     * insert it into the DOM.
     */
    displayFlickrSearchResult(imagesJson) {

        // Remove previous search result and any message.
        const oldList = this.searchResultsEl.querySelector('.searchresults__list');
        if (oldList) this.searchResultsEl.removeChild(oldList);
        this.message.hideMessage();

        // Show message if search did not find anything.
        if (!imagesJson.photos || !imagesJson.photos.photo || imagesJson.photos.photo.length === 0) {
            this.message.displayMessage('No search results found...');
            return;
        }

        // Loop through images json and return list of images.
        const imageHtmlListItems = imagesJson.photos.photo.reduce((prev, image, i) => {
            const srcUrl = this.getImageUrl(image.farm, image.server, image.id, image.secret);
            return `${prev}<li><img src=${srcUrl} alt='flickr-img-${i}'/></li>`;
        }, '');

        // Insert images list into DOM wrapped in <ul>.
        const imageHtmlList = `<ul class='searchresults__list'>${imageHtmlListItems}</ul>`;
        this.searchResultsEl.insertAdjacentHTML('beforeend', imageHtmlList);

        // Add click event listeners to all images (or actually the wrapping <li>).
        Array.from(this.searchResultsEl.querySelectorAll('img'))
            .forEach(img => img.addEventListener('click', (e) => this.toggleImageSelected(e)));
    }

    /*
     * Toggles the select state of an image and
     * updates the array of selected image urls.
     * The url array is then persisted in localStorage.
     */
    toggleImageSelected(e) {

        // Toggle .selected class on the <li>
        const isLiSelected = this.helpers.closest(e.target, 'li').classList.toggle('selected');

        // Add or remove from localStorage.
        if (isLiSelected) {
            this.lStorage.add(e.target.src);
        }
        else {
            this.lStorage.remove(e.target.src);
        }
    }

    /*
     * Builds a url to an flickr image from the data
     * received when fetching search results.
     */
    getImageUrl(farmId, serverId, id, secret) {
        return `https://farm${farmId}.staticflickr.com/${serverId}/${id}_${secret}_m.jpg`;
    }
}

/*
 * Local Storage.
 * Handles persisting gallery image data.
 */
class LocalStorage {

    constructor(helpers) {
        this.helpers = helpers;
    }

    /*
     * Adds an image to the stored array.
     */
    add(imageSrc) {
        const currentGallery = this.get();

        // Add image to storage unless it's already in there.
        if (!currentGallery.includes(imageSrc)) {
            const updatedGallery = [...currentGallery, imageSrc];
            this.set(updatedGallery);
        }
    }

    /*
     * Removes an image from the stored array.
     */
    remove(imageSrc) {
        const currentGallery = this.get();

        // Remove image from storage if it is in there.
        const index = currentGallery.indexOf(imageSrc);
        if(index > -1) {
            currentGallery.splice(index, 1);
            this.set(currentGallery);
        }
    }

    /*
     * Sets an array of images as the new stored array.
     */
    set(galleryArray) {
        localStorage.flickrGallery = JSON.stringify(galleryArray);
    }

    /*
     * Gets the stored array.
     */
    get() {
        return this.helpers.tryParseJson(localStorage.flickrGallery, []);
    }
}

/*
 * Message.
 * User message handling.
 */
class Message {

    constructor() {

        // Find some elements.
        this.messageContainerEl = document.querySelector('.message__container');

        // Add event listeners.
        this.messageContainerEl.addEventListener('click', () => this.hideMessage());
    }

    /*
     * Displays a message box for the user
     * with the supplied message.
     */
    displayMessage(message) {
        this.messageContainerEl.innerHTML = `<div class='message'>${message}</div>`;
        this.messageContainerEl.classList.add('visible');
    }

    /*
     * Hides the message box.
     */
    hideMessage() {
        this.messageContainerEl.innerHTML = '';
        this.messageContainerEl.classList.remove('visible');
    }
}

/*
 * Helpers.
 * Some good to have functionality.
 */
class Helpers {

    /*
     * Tries to parse json and return it.
     * Returns defaultValue if parse fails or
     * the parsed data is not of same type
     * as defaultValue.
     */
    tryParseJson(json, defaultValue = []) {
        try {
            const parsedJson = JSON.parse(json);
            if (typeof parsedJson !== typeof defaultValue) {
                return defaultValue;
            }
            return parsedJson;
        }
        catch(e) {
            return defaultValue;
        }
    }

    /*
     * Returns true if element (el) matches selector,
     * otherwise false.
     */
    matches(el, selector) {

        const parent = el.parentElement || this.document;
        const matches = parent.querySelectorAll(selector);
        let i = matches.length;

        while (--i >= 0 && matches.item(i) !== el) { /* Don't do anything... */ }
        return i > -1;
    }

    /*
     * Returns the closest parent of the provided element (el)
     * which matches the selector given.
     * If there isn't such an ancestor, it returns null.
     */
    closest(el, selector) {
        let parent = el.parentElement;
        while(parent) {
            if (this.matches(parent, selector)) {
                break;
            }
            parent = parent.parentElement;
        }

        return parent;
    }
}

// Fire it up! :)
const helpers = new Helpers();
const lStorage = new LocalStorage(helpers);
new SearchResult(helpers, new Message(), lStorage);
new Gallery(lStorage);
