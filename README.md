#Flickr gallery
Flickr gallery is a SPA where you can search for photos on Flickr and select some for viewing in a gallery.

There is no backend, just static files:

```
├── README.md
├── index.html
├── script.js
└── styles.css
```

For storing photos the app uses local storage.

The app has been tested on Chrome v.53, desktop only.

##Installing and running
Just unpack the zip in a folder and start a web server in there.
I used php's web server, like so:

```
php -S localhost:8080
```
Now point your browser to:

```
localhost:8080
```

##Possible improvements
* Paginate search result. Now only displays first 100.
* Make gallery images selected on reload in search results.
* Spinner for slow search results.
* Lazy load images.
* Make control bar sticky.
* Build step for minifying and finger printing assets.

Enjoy!

