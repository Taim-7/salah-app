# Salah

Salah is a prayer timetable for the UK and Ireland, with Derry as its starting location. It also has a Qibla compass, a fasting log and prayer reminders. The local timetable, built-in town search, Qibla bearing and fasting log work offline after the app has loaded once.

## Using Salah

Open the app at its HTTPS address in Safari and use **Share → Add to Home Screen**. For a local browser preview, run `python3 -m http.server 8000` from this folder and open `http://localhost:8000`.

Use **Settings → Compare prayer times** to choose your main timetable and see the other methods for the same date. **Load AlAdhan** fetches a comparison for the selected location and date. Selecting AlAdhan as your main timetable also fetches its times when needed. Cached times can work offline.

Choose Focus, Dayline or Horizon in **Settings → Appearance**. All three show the forbidden-time rows. **Home Screen icon** offers Crescent, Mihrab, Minaret, Compass and Prayer mat in each colour preset. Open the icon page in Safari before adding it to the Home Screen. An installed copy offers **Copy Safari link**. Save your fasting log before replacing a shortcut and restore it in the new copy.

In **Qibla**, tap **Start compass** and hold the phone flat. The arrow at the top marks the direction your phone faces. Follow the coloured arc towards the Qibla marker. The optional chime plays on alignment and when the compass has a problem. Green marks alignment with the phone’s reported heading. The accuracy shown is the phone’s estimate. The true bearing is also available for a separate compass.

In **Fasting**, choose a day to see Fajr and iftar and log a fast. A missed entry appears in **To make up** until you mark it as made up. Use **Fasts without dates** to type a total or adjust it with the minus and plus buttons. Salah stores both kinds of entry on your device. **Upcoming dates** shows Ramadan, both Eids and optional fasts.

In **Sounds**, use **Play sound** to start audio for the session. Pick how early the pre-prayer reminder appears from 15, 20, 25 or 30 minutes. The sound level controls the recordings and chimes in Salah. Gentle chime and Clear bell can repeat until stopped. Prayer-time sounds and reminders run while Salah is open.

## Prayer times

Salah starts with Derry, 15° for Fajr and 13° for Isha. Asr uses one shadow length beyond the noon shadow. True dawn is the light spreading across the eastern horizon and marks the start of fasting. Isha follows the fading of red twilight. Solar angles estimate those signs. If an angle crossing is missing, choose an estimate in Settings or choose **Crossings only** to leave the time blank. Tayba is also available as a full timetable or a fallback for missing times.

The Hijri date changes at local sunset. Salah estimates Hijri dates using Umm al-Qura, with the civil Hijri calendar as a fallback. Follow your local announcement for Ramadan and Eid.

Night markers run from sunset to the next Fajr. A missing Fajr leaves those markers unavailable.
