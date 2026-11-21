# Salah — iPhone app
A free prayer-times web app you can add to your iPhone Home Screen. Set to Derry by default; location can change with your permission. Works offline after a successful first load, except online comparisons, city lookups and the streamed adhan.

## Sound and notifications
Open Alerts. **Test adhan** checks sound while the app is active; **10-second alert** tests short foreground audio. You can also test GPS, notification permission and vibration support. Try locking your phone after starting the short test to check its limitations. **Export prayer calendar** requests an alert 15 minutes before each prayer; import the events and confirm alerts in iPhone Calendar. The calendar cannot automatically follow later travel or source changes.

**Important:** the app cannot reliably play an adhan or schedule its own reminders when closed or the phone is locked. GitHub Pages alone cannot send push reminders. iOS Safari doesn't provide normal web vibration, so Qibla alignment uses a visual pulse on iPhone. Qibla sensor readings need permission, magnetic correction and calibration; use the displayed true bearing and verify with a reliable compass if corrections fail.

## Accuracy

The app calculates solar times mathematically, but fixed angles are estimates of true dawn and red twilight, especially in Derry's summer. High-latitude fallback times are estimates too. Short sunrise, noon and sunset prayer-avoidance windows use approximate precautions. Do not treat any of these boundaries as an observed religious minute.
