# Salah — free iPhone prayer-times comparison PWA

Salah is a free, static Progressive Web App (PWA) that you can publish on a public GitHub Pages repository and install on an iPhone Home Screen. No Apple Developer enrolment, subscription or app-store submission is needed. You control the source code and the chosen methods. The source code is public after publishing, while settings and your uploaded audio stay in browser storage on your device. Internet access is needed to obtain fresh online comparison results and to search cities; the astronomical methods work offline once the app is cached.

**This is a comparison and educational tool, not a verified observational timetable.** Do not assume the angle, the Tayba-derived implementation or an API result pinpoints true dawn or the loss of red twilight to an exact minute. Northern summer calculations need particular care.

## Usage

1. Open the HTTPS address in **Safari** on iPhone. Tap **Share → Add to Home Screen → Add** and select **Open as Web App** if shown. Open the new Salah icon once while online to allow the service worker to cache its assets.

## Comparison sources and what they actually mean

The **Compare** panel shows six methods in horizontally scrollable columns, with prayer times and minute differences for the same chosen location and local calendar date. A selectable source controls the **main timetable**, **next-prayer countdown**, **Islamic-night markers** and **calendar export**. Other columns remain visible for comparison.

| Column | Origin | Selectable for main timetable | Religious/technical caveat |
| --- | --- | --- | --- |
| Your selected angles | Offline solar calculation | Yes | French UOIF **12°/12°** (default), 15°/13°, 15°/15° or custom 6°–22° |
| Alternative angles | Offline solar calculation | No; select the corresponding pair in Settings | Default alternative to 12°/12° is 15°/13° |
| Tayba Trust guidance | **Our local implementation** of publicly described Tayba high-latitude method | Yes | Not Tayba's own timetable or an observation; impossible/unsupported red twilight cases are shown as unavailable |
| Moonsighting red twilight | **AlAdhan API**, method **15** with `shafaq=ahmer` | Yes | The API implementation of this preset, not an independently downloaded Moonsighting observation |
| French UOIF API | **AlAdhan API**, method **12** | Yes | Same French 12°/12° convention through a different calculation engine |
| Muslim World League API | **AlAdhan API**, method **3** | Yes | Different 18°/17° angles; may estimate high-latitude twilight differently |

**OpenFajr** publishes research and dated observed Fajr estimates for **Birmingham**. It is linked inside the app rather than inaccurately displayed as a Derry Fajr timetable. **Tayba Trust** provides methodology, not a live global online timetable endpoint. The three AlAdhan columns are *one provider's service with different calculation modes*, not three independent observations. Sources: https://openfajr.org/ , https://taybatrust.org/index.php/projects/establishing-dawn/34-dp-all-loc , https://www.moonsighting.com/how-we.html , https://aladhan.com/prayer-times-api .

For all API requests, Salah sends the **selected coordinates, date and time zone** to `api.aladhan.com`, and specifies `school=0`, the one-shadow **Shafi'i/Maliki/Hanbali** Asr convention rather than Hanafi. The Moonsighting preset asks for **red twilight**. The client checks the returned method number, timezone, prayer ordering and local dates; it shows explicit error/unavailable status rather than trusting incompatible data. Online results are cached for up to seven days on the device and can be refreshed manually. When the currently selected online source cannot supply today's results plus following Fajr, the main timetable **clearly warns that it has fallen back to your own angles**. It never pretends unavailable API results are known.

The URL request specifications have been checked against AlAdhan's published API documentation. Browser interactions with the provider were tested using **mock responses**, not a production end-to-end connection from an actual iPhone; confirm a live lookup after GitHub Pages deployment. If online provider response format or time-zone matching changes, the app will show an error and use the labelled fallback.

## Religious settings and astronomy

- Fajr begins at *true dawn*, when light spreads horizontally on the eastern horizon. Isha begins after the **red twilight disappears** according to the Hanbali, Shafi'i and Maliki approaches selected here. An astronomical depression angle is a prediction, not observed certainty.
- All Asr calculations and AlAdhan requests use **one shadow-length beyond the noon shadow**. The **Hanafi two-shadow calculation is not offered**.
- Islamic night runs from **Maghrib to next day's Fajr**. The **first third** is shown as the earlier preferred/choice-period boundary according to a Hanbali opinion; **half the night** is the later normal ending from Sahih Muslim 612 according to another view. The app explains that some Hanbali works discuss an allowance for genuine necessity until Fajr. If the calculated Isha start is already after either marker, the app warns you.
- The short sunrise, zenith and sunset prayer-restriction buffers are **practical approximations**, not legally precise limits. The after-Fajr and after-Asr restrictions depend in some interpretations on whether the corresponding prayer has actually been performed, and some reason-based or obligatory prayers have exceptions.
- Northern summer: if the angle is not reached, your own-angle column explicitly marks the chosen high-latitude fallback (**one seventh**, **angle fraction**, or **half-night**) as estimated. The Tayba-derived column has separate seasonal rules. No fallback is a verified observation.
- Geometric sunrise/sunset assumes about 0.833° apparent horizon correction and does not correct for your actual visible horizon, height above sea level, terrain or atmospheric refraction that day. Sunrise, sunset and twilight comparisons can differ by several minutes.

## Follow my location

In Settings you can **Follow my location** (while Salah is open), tap **Use current GPS**, search for a city, or enter coordinates and an IANA timezone such as `Europe/London` or `Asia/Tokyo`. If granted permission, the app follows position in the foreground and checks again when reopened. Safari does not permit continuous geolocation from a closed PWA. City search sends the search term to Open-Meteo; GPS lookup may send the coordinates to BigDataCloud and Open-Meteo to retrieve place name and timezone. When place/timezone matching cannot be verified, Salah displays a warning.

## Sound and reminders

**While Salah is open:** Under **Alerts**, choose **Gentle two-tone**, **Clear bell**, **Silent**, or **My uploaded sound** (experimental, audio under 8 MB). Press **Hear sound** for a test, then **Arm while open**. The built-in tones are synthesised by the app; no copyrighted recording is included. Uploaded recordings are stored in **device-local IndexedDB** when supported; they are not sent to GitHub or AlAdhan. The browser may block automatic audio after locking the phone or placing the app in the background. Arming is reset every time the PWA is opened.

**When the iPhone is locked:** This static GitHub Pages version does **not** have a remote push service, so it cannot reliably send its own background notifications or play a complete adhan. On iOS 16.4+ Home Screen PWAs can use Web Push **if** a push service and application server are added, and a user grants permission from a user action. Apple says this does **not** require Apple Developer Program enrolment. A free hosted scheduler (for example, a suitable free serverless provider) would require extra development, persistent subscriptions and monitoring; no such backend is included here.

**Calendar alternative:** Choose an alert lead (at the prayer or 5, 10 or 15 minutes early), then press **Export prayer calendar (.ics)**. The downloaded file has five events per day with `VALARM` requests. It exports **30 days** from local angle/Tayba calculations, or **one day** from a selected online source if its data is loaded. A static export **does not update** with changing city, method or time zone. You can email the `.ics` file to yourself to import into Calendar, or upload it to a public GitHub Pages URL such as `https://YOUR-USERNAME.github.io/salah-app/salah-reminders.ics` and, on your iPhone, open **Calendar → Calendars → Add Calendar → Add Subscription Calendar**, paste the URL and subscribe. Apple also offers **Settings → Apps → Calendar → Calendar Accounts → Add Account → Other → Add Subscribed Calendar** on supported iOS versions. Turn on alerts for subscribed calendars and Calendar notifications in iPhone Settings. **Apple Calendar ultimately decides whether and how the alerts are shown; a subscription or `VALARM` does not guarantee every alert.** Test it before depending on it, and regenerate/re-upload the `.ics` before its range ends.

Apple documentation: https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers , https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/ , https://support.apple.com/en-gb/guide/iphone/iph3d1110d4/ios .

## Tests and boundaries

- The earlier solar engine passed **10,752 full-day** test cases across eight cities, two years and two angle pairs.
- The Tayba-derived model passed **4,704 sample full-day calculations** with the tested locations; it explicitly rejects cases where a usable twilight boundary cannot be estimated, such as missing 8° crossing on certain higher-latitude dates.
- AlAdhan URL and decode tests cover method IDs, red-twilight selection, one-shadow `school=0`, DST/UTC conversion, wrong date, wrong time zone and misordered times. The online provider **was mocked** in browser UI tests, so live server availability remains unverified.
- Browser layout and interaction tests passed at **320, 390, 768 and 1,280 pixels** with no overall horizontal overflow (the wide comparison table scrolls independently), selecting a source, changing angle settings, the sound controls and calendar export requests. Screenshots are included for reference.
- Version 2's Swiss Ephemeris comparison covered **554 sampled solar crossings**, with a maximum discrepancy of about **2.6 minutes** from the independent astronomical result. That only tests solar calculation, not visible red twilight or true dawn.
- A real iPhone Safari test remains outstanding for installation, offline caching, live API responses, location permissions, IndexedDB custom audio playback and the reliability of Calendar alert delivery.

The runtime app needs only `index.html`, `app.js`, `solar.js`, `providers.js`, `styles.css`, `sw.js`, `manifest.webmanifest` and the `icons` folder. Test scripts are supplied separately and not loaded on iPhone.
