# Salah

Salah is a prayer timetable for the UK and Ireland. It also has a Qibla compass, a fasting log, a calendar of Islamic dates and prayer reminders. After the first visit, the local timetable and Qibla work offline if the device can get its position. The fasting log and calendar also work offline.

## Using Salah

Open the app at its HTTPS address in Safari and use **Share → Add to Home Screen**. For a local browser preview, run `python3 -m http.server 8000` from this folder and open `http://localhost:8000`.

On first launch, Salah offers location and compass access where the browser supports them. It updates prayer times and Qibla as you move. Location tracking runs while Salah is visible. Returning to Salah starts a fresh location lookup. The timetable and compass appear when your device supplies a current position. Use **Settings → Location** to retry.

Use **Settings → Compare prayer times** to choose your main timetable and see the other methods for the same date. **Load AlAdhan** fetches a comparison for the selected location and date. Selecting AlAdhan as your main timetable also fetches its times when needed. Cached times can work offline.

Choose Focus, Dayline or Horizon in **Settings → Appearance**. All three show the forbidden-time rows. **Home Screen icon** offers Crescent, Mihrab, Minaret, Compass and Prayer mat in each colour preset. Open the icon page in Safari before adding it to the Home Screen. An installed copy offers **Copy Safari link**. Save your fasting log before replacing a shortcut and restore it in the new copy.

In **Qibla**, tap **Start compass** and hold the phone flat in portrait, away from metal and magnetic cases. Follow the coloured arc towards the Qibla marker. The centre shows how far to turn. Green means the reported heading is within 2.5° of the Qibla. Salah shows the phone’s accuracy estimate when available and labels approximate alignment. If the heading jumps and the phone’s motion readings cannot confirm the turn, the dial pauses. Hold the phone steady or tap **Restart compass** to take a fresh reading. The optional chime plays when the reading settles in range or when the compass has a problem.

The **True bearing** and **Magnetic bearing** give the direction towards the Kaaba from your current location. Use the value that matches the north reference of your compass. Salah uses the World Magnetic Model for its magnetic bearing and to correct the phone’s magnetic heading.

In **Fasting**, choose a day to see Fajr and iftar and log a fast. Use **Log as a make-up fast** on the day you fasted to cover an earlier missed day. If you only recorded the missed date, you can also use **Mark as made up** on that entry. Under **Fasts without dates**, **Make-up fasts** records how many of the days you entered as fasted were for making up missed days. The totals count dated and undated entries together, and a recorded make-up reduces **To make up** by one. Salah stores the log on your device.

**Dates** has separate sections for upcoming fasts and Eids. Each row gives the dates and whether fasting is obligatory, Sunnah or forbidden. Open a row for an explanation of the practice, Arabic excerpts, English meanings and source links. The Shawwal row gives the period in which you can choose your six days.

In **Sounds**, pick a pre-prayer reminder of 15, 20, 25 or 30 minutes. The first-third warning is on by default. It uses a separate five-minute lead and appears when the timetable can calculate that night’s marker. In **Phone notifications**, tap **Allow notifications** and check for the test alert. On iPhone, open Salah from the Home Screen. Keep Salah on screen for scheduled alerts. If you return during a reminder window, Salah can show the time still left.

Use **Play sound** to start audio for the session. The sound level controls the recordings and chimes in Salah. Gentle chime and Clear bell can repeat until stopped.

## Prayer times

The initial angles are 15° for Fajr and 13° for Isha. Asr uses one shadow length beyond the noon shadow. True dawn is the light spreading across the eastern horizon and marks the start of fasting. Isha follows the fading of red twilight. Solar angles estimate those signs. If an angle crossing is missing, choose an estimate in Settings or choose **Crossings only** to leave the time blank. Tayba is also available as a full timetable or a fallback for missing times.

The Hijri date changes at local sunset. Salah estimates Hijri dates using Umm al-Qura, with the civil Hijri calendar as a fallback. Follow your local announcement for Ramadan and Eid.

Night markers run from sunset to the next Fajr. A missing Fajr leaves those markers unavailable.
