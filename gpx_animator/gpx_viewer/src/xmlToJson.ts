export function xmlToJson(xml: Element) {
    // Create the return object
    var obj: any = {};

    if (xml.nodeType == 1) {
        // element
        // do attributes
        if (xml.attributes) {
            obj["@attributes"] = {};
            for (var j = 0; j < xml.attributes.length; j++) {
                var attribute = xml.attributes.item(j);
                if (attribute) {
                    obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
                }
            }
        }
    } else if (xml.nodeType == 3) {
        // text
        obj = xml.nodeValue;
    }

    // do children
    if (xml.hasChildNodes()) {
        for (var i = 0; i < xml.childNodes.length; i++) {
            var item = xml.childNodes.item(i);
            if (item) {
                var nodeName = item.nodeName;
                if (typeof obj[nodeName] == "undefined") {
                    obj[nodeName] = xmlToJson(item as Element);
                } else {
                    if (typeof obj[nodeName].push == "undefined") {
                        var old = obj[nodeName];
                        obj[nodeName] = [];
                        obj[nodeName].push(old);
                    }
                    obj[nodeName].push(xmlToJson(item as Element));
                }
            }
        }
    }
    return obj;
}
