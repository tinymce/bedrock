WebDriver Support (2.47.0*)
==========

Firefox
--------

Browser: firefox

Installation:

* Works out of the box.

Chrome
-------

Browser: chrome

Installation:

* Install ChromeDriver onto your path. The link from (https://www.npmjs.com/package/selenium-webdriver) worked.

Safari
------

Browser: safari

Installation:

* Install a WebDriver as a Safari extension. This is an involved process:


1. Download Safari Driver jar (2.43.1) from maven link: (http://central.maven.org/maven2/org/seleniumhq/selenium/selenium-safari-driver/2.43.1/selenium-safari-driver-2.43.1.jar)
2. Unzip it (treat the jar as a zip)
3. Navigate to org/openqa/selenium
4. Double click "SafariDriver.safariextz"

Internet Explorer
-------------

Browser: ie

Installation:

1. Download http://selenium-release.storage.googleapis.com/2.53/IEDriverServer_x64_2.53.1.zip
2. Put the file IEDriverServer.exe onto your path

Edge (2.53.0)
-----

Browser: MicrosoftEdge

Installation:

1. Install the Edge Driver installer from https://www.npmjs.com/package/selenium-webdriver
2. Put in on your path (it's probably in "Program Files x86")

Note, I didn't actually get this working. It failed.


*: Selenium WebDriver 2.47.0 is the highest supported version of SauceLabs.

