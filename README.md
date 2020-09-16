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

##Possible improvements

- Paginate search result. Now only displays first 100.
- Make gallery images selected on reload in search results.
- Spinner for slow search results.
- Lazy load images.
- Make control bar sticky.
- Build step for minifying and finger printing assets.

Enjoy!
