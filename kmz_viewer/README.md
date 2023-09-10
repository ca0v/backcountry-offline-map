Deployed to [netlify](https://main--timely-tiramisu-ce5f14.netlify.app/kmz_viewer/deploy/index.html)


To disable showing js files in vscode explorer, modify the following in settings.json:
```
"files.exclude": {
    "**/*.js": true
}
```

To view KMZ files, first decompress them to KML files. Then, open the KML files in Google Earth.  You can also view them in leaflet using the following code:
```
var kmzParser = new L.KMZParser({
    onKMZLoaded: function(layer, name) {
        control.addOverlay(layer, name);
        layer.addTo(map);
    }
});

Install typescript support for leaflet:

npm install --save @types/leaflet

```

Create a web application for offline use:
```
https://developers.google.com/web/fundamentals/codelabs/offline/
```

Basically you need to create a manifest file and add the following to the html file:
```
<link rel="manifest" href="manifest.json">
```

To create a manifest file, use the following link:
```
https://app-manifest.firebaseapp.com/
```

To create a service worker, use the following link:
```
https://serviceworke.rs/
```

Maps can be found here:

```
https://ngmdb.usgs.gov/topoview/viewer/#11/45.0075/-72.5784
```

To make deploy.sh executable, use the following command:
```
chmod +x deploy.sh
```