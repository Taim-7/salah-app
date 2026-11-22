# Salah

Salah is a prayer timetable for the UK and Ireland, with Derry as its starting location. It also has a Qibla compass, a fasting log and prayer reminders. The local timetable, built-in town search, Qibla bearing and fasting log work offline after the app has loaded once.

## Using Salah

Open the app at its HTTPS address in Safari and use **Share → Add to Home Screen**. For a local browser preview, run `python3 -m http.server 8000` from this folder and open `http://localhost:8000`.

Use **Settings → Compare prayer times** to choose your main timetable and see the other methods for the same date. **Load AlAdhan** fetches a comparison for the selected location and date. Selecting AlAdhan as your main timetable also fetches its times when needed. Cached times can work offline.

Choose Focus, Dayline or Horizon in **Settings → Appearance**. All three show the forbidden-time rows. **Home Screen icon** offers Crescent, Mihrab, Minaret, Compass and Prayer mat in each colour preset. Open the icon page in Safari before adding it to the Home Screen. An installed copy offers **Copy Safari link**. Save your fasting log before replacing a shortcut and restore it in the new copy.

In **Qibla**, tap **Start compass** and hold the phone flat. The arrow at the top marks the direction your phone faces. Follow the coloured arc towards the Qibla marker. The optional chime plays on alignment and when the compass has a problem. Supported browsers can vibrate on alignment. On iPhone the visual cue and chime give the same guidance. The true bearing is also available for a separate compass.

In **Fasting**, choose a day to see Fajr and iftar and log a fast. A missed entry appears in **To make up** until you mark it as made up. Salah stores the log on your device.

In **Sounds**, use **Play sound** to start audio for the session. Pick how early the pre-prayer reminder appears from 15, 20, 25 or 30 minutes. The sound level controls the recordings and chimes in Salah. Closed reminders use system notifications, with sound and vibration set by your phone.

## Notifications while closed

Use Node.js 24 or later on an always-running host. Install the notification service from this folder. Set `SALAH_ORIGIN` to the exact HTTPS address people will open, including any app subfolder. Route that address to the Node process on port 8080 through your HTTPS host or reverse proxy. The process serves both the app and its notification API. For example, in PowerShell:

```powershell
npm --prefix server ci
$env:SALAH_ORIGIN = 'https://salah.example.org/'
node server/start.mjs
```

For a local preview of the service, omit `SALAH_ORIGIN` and open `http://localhost:8080`. The process listens on `127.0.0.1` by default. Set `SALAH_BIND` or `SALAH_PORT` to fit your hosting. The service stores its subscription data and signing keys in `.salah-notifications` in the host user’s home directory. Set `SALAH_DATA_DIR` to use another persistent directory. Use one running process per database. Keep that directory when updating the app so that existing subscriptions keep working.

On iPhone with iOS 16.4 or later, open Salah from the Home Screen, turn on **Sounds → Notifications while closed** and allow notifications when iOS asks. Tap **Send test notification**, then lock your phone. The service queues the test for about 10 to 25 seconds later. The device and the running service both need internet access. Check the Lock Screen and Focus settings if iOS delivers the notification quietly.

The service uses the last saved location, calculation method and reminder lead from the device. Changes sync when Salah is online. If you use AlAdhan as your timetable, the service also asks AlAdhan for that location’s prayer times. It omits reminders for times the chosen source cannot provide. The fasting log and imported audio stay on the device.

## Prayer times

Salah starts with Derry, 15° for Fajr and 13° for Isha. Asr uses one shadow length beyond the noon shadow. True dawn is the light spreading across the eastern horizon and marks the start of fasting. Isha follows the fading of red twilight. Solar angles estimate those signs. If an angle crossing is missing, choose an estimate in Settings or choose **Crossings only** to leave the time blank. Tayba is also available as a full timetable or a fallback for missing times.

Night markers run from sunset to the next Fajr. A missing Fajr leaves those markers unavailable. The forbidden-time rows estimate the short periods at sunrise, midday and sunset. The wider restriction on general optional prayer starts after you pray Fajr or Asr.
