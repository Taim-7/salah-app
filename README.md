# Salah

Salah is a prayer timetable for the UK and Ireland, with Derry as its starting location. It also has a Qibla compass, a fasting log, a calendar of Islamic dates and prayer reminders. The local timetable, town search, Qibla bearing, fasting log and calendar work offline after the first visit.

## Using Salah

Open the app at its HTTPS address in Safari and use **Share → Add to Home Screen**. For a local browser preview, run `python3 -m http.server 8000` from this folder and open `http://localhost:8000`.

On first launch, Salah offers location and compass access where the browser supports them. Location following is the default when you allow access. It runs while Salah is visible and stops when the app goes into the background. Choose **Use saved location** or turn off following in **Settings → Location** to keep a fixed town.

Use **Settings → Compare prayer times** to choose your main timetable and see the other methods for the same date. **Load AlAdhan** fetches a comparison for the selected location and date. Selecting AlAdhan as your main timetable also fetches its times when needed. Cached times can work offline.

Choose Focus, Dayline or Horizon in **Settings → Appearance**. All three show the forbidden-time rows. **Home Screen icon** offers Crescent, Mihrab, Minaret, Compass and Prayer mat in each colour preset. Open the icon page in Safari before adding it to the Home Screen. An installed copy offers **Copy Safari link**. Save your fasting log before replacing a shortcut and restore it in the new copy.

In **Qibla**, tap **Start compass** and hold the phone flat, away from metal and magnetic cases. Follow the coloured arc towards the Qibla marker. The centre shows how far to turn. Green means the reported heading is within 2.5° of the Qibla. Salah shows the phone’s accuracy estimate if it provides one and marks approximate alignment separately. The optional chime plays when the reading settles in range or when the compass has a problem.

The **True bearing** and **Magnetic bearing** give the direction towards the Kaaba for the selected location. Use the value that matches the north reference of your compass. Salah uses the World Magnetic Model for its magnetic bearing and to correct the phone’s magnetic heading.

In **Fasting**, choose a day to see Fajr and iftar and log a fast. Use **Log as a make-up fast** on the day you fasted to cover an earlier missed day. If you only recorded the missed date, you can also use **Mark as made up** on that entry. Under **Fasts without dates**, **Make-up fasts** records how many of the days you entered as fasted were for making up missed days. The totals count dated and undated entries together, and a recorded make-up reduces **To make up** by one. Salah stores the log on your device.

**Dates** has separate sections for upcoming fasts and Eids. Each row gives the dates and whether fasting is obligatory, Sunnah or forbidden. Open a row for an explanation of the practice, Arabic excerpts, English meanings and source links. The Shawwal row gives the period in which you can choose your six days.

In **Sounds**, use **Play sound** to start audio for the session. Pick how early the pre-prayer reminder appears from 15, 20, 25 or 30 minutes. The sound level controls the recordings and chimes in Salah. Gentle chime and Clear bell can repeat until stopped. Prayer-time sounds and reminders run while Salah is open.

## Prayer times

Salah starts with Derry, 15° for Fajr and 13° for Isha. Asr uses one shadow length beyond the noon shadow. True dawn is the light spreading across the eastern horizon and marks the start of fasting. Isha follows the fading of red twilight. Solar angles estimate those signs. If an angle crossing is missing, choose an estimate in Settings or choose **Crossings only** to leave the time blank. Tayba is also available as a full timetable or a fallback for missing times.

The Hijri date changes at local sunset. Salah estimates Hijri dates using Umm al-Qura, with the civil Hijri calendar as a fallback. Follow your local announcement for Ramadan and Eid.

Night markers run from sunset to the next Fajr. A missing Fajr leaves those markers unavailable.
