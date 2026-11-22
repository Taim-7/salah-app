# Salah

Salah is a prayer timetable for the UK and Ireland, with Derry as its starting location. It also has a Qibla compass, a fasting log, a calendar of Islamic dates and prayer reminders. The local timetable, town search, Qibla bearing, fasting log and calendar work offline after the first visit.

## Using Salah

Open the app at its HTTPS address in Safari and use **Share → Add to Home Screen**. For a local browser preview, run `python3 -m http.server 8000` from this folder and open `http://localhost:8000`.

Use **Settings → Compare prayer times** to choose your main timetable and see the other methods for the same date. **Load AlAdhan** fetches a comparison for the selected location and date. Selecting AlAdhan as your main timetable also fetches its times when needed. Cached times can work offline.

Choose Focus, Dayline or Horizon in **Settings → Appearance**. All three show the forbidden-time rows. **Home Screen icon** offers Crescent, Mihrab, Minaret, Compass and Prayer mat in each colour preset. Open the icon page in Safari before adding it to the Home Screen. An installed copy offers **Copy Safari link**. Save your fasting log before replacing a shortcut and restore it in the new copy.

In **Qibla**, tap **Start compass** and hold the phone flat. The arrow at the top marks the direction your phone faces. Follow the coloured arc towards the Qibla marker. The dial turns green when the phone reports a heading within 3° of the Qibla, with the remaining difference shown in the centre. The optional chime plays on alignment and when the compass has a problem. The accuracy shown is the phone’s estimate. The true bearing gives the starting direction towards the Kaaba from geographic north. Salah uses the World Magnetic Model to correct magnetic headings on iPhone and Android.

In **Fasting**, choose a day to see Fajr and iftar and log a fast. Use **Log as a make-up fast** on the day you fasted to cover an earlier missed day. If you only recorded the missed date, you can also use **Mark as made up** on that entry. Under **Fasts without dates**, **Make-up fasts** records how many of the days you entered as fasted were for making up missed days. The totals count dated and undated entries together, and a recorded make-up reduces **To make up** by one. Salah stores the log on your device.

**Dates** has separate sections for upcoming fasts and Eids. Each row gives the dates and whether fasting is obligatory, Sunnah or forbidden. Open a row for the background and links to the Qur’an or hadith.

In **Sounds**, use **Play sound** to start audio for the session. Pick how early the pre-prayer reminder appears from 15, 20, 25 or 30 minutes. The sound level controls the recordings and chimes in Salah. Gentle chime and Clear bell can repeat until stopped. Prayer-time sounds and reminders run while Salah is open.

## Prayer times

Salah starts with Derry, 15° for Fajr and 13° for Isha. Asr uses one shadow length beyond the noon shadow. True dawn is the light spreading across the eastern horizon and marks the start of fasting. Isha follows the fading of red twilight. Solar angles estimate those signs. If an angle crossing is missing, choose an estimate in Settings or choose **Crossings only** to leave the time blank. Tayba is also available as a full timetable or a fallback for missing times.

The Hijri date changes at local sunset. Salah estimates Hijri dates using Umm al-Qura, with the civil Hijri calendar as a fallback. Follow your local announcement for Ramadan and Eid.

Night markers run from sunset to the next Fajr. A missing Fajr leaves those markers unavailable.
