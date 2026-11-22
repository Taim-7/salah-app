# Salah

A prayer-times web app for the UK and Ireland. It installs to an iPhone Home Screen and can calculate prayer times without an internet connection.

## What it does

Salah shows daily prayer times, a Qibla direction, a comparison of calculation methods, and the first third and halfway point of the Islamic night. It has a 12-hour clock, three dark colour choices, and a 15-minute Calendar reminder export.

The default calculation is 15° for Fajr and 13° for Isha, with one-shadow Asr. Settings also include French 12°/12°, Muslim World League, and custom angles. The comparison includes a locally calculated method based on Tayba Trust's published guidance and a Moonsighting method provided by AlAdhan.

## Using it

The app is hosted on GitHub Pages. Open the published site in Safari and use **Share → Add to Home Screen**. The main timetable and Qibla bearing work offline after the first online visit and successful caching. iOS may clear stored site data, so reopen Salah online after an update. Live online comparisons and city search need internet access.

The Sounds tab includes three recordings by [alsuleiman-lab](https://github.com/alsuleiman-lab/athkar-audio), used with permission from the owner. The app attempts to save the three recordings automatically when opened online. Audio plays when the app is open; it is not a reliable locked-screen alarm. iPhone Calendar alerts depend on iOS settings.

## Accuracy

The prayer times are calculations. Fajr and Isha can differ from locally observed true dawn and red twilight, particularly during northern summers. When a selected angle cannot be reached, Salah shows an estimated time. The Qibla compass also depends on iPhone sensor accuracy and magnetic correction.

Calculation references: [SunCalc](https://github.com/mourner/suncalc), [Tayba Trust](https://taybatrust.org/index.php/projects/establishing-dawn/34-dp-all-loc), [Moonsighting](https://www.moonsighting.com/how-we.html), [AlAdhan API](https://aladhan.com/prayer-times-api).
