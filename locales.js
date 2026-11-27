(() => {
  'use strict';

  // English is the lookup text. Template fields keep translated sentences in
  // their own word order while dates, values and place names stay intact.
  const copy = `
12° Fajr · 12° Isha|الفجر 12° · العشاء 12°
15° Fajr · 13° Isha|الفجر 15° · العشاء 13°
{minutes} minutes before|قبل الموعد بـ {minutes} دقيقة
Abu Bakr|أبو بكر
Add one fasted day|أضف يوماً صمته
Add one make-up fast|أضف يوماً قضيته
Add one missed day|أضف يوماً فاتك
Allow exact alarms|السماح بالمنبهات الدقيقة
Allow full-screen alarms|السماح بمنبّهات ملء الشاشة
Allow full-screen alarms to show the wake screen when your phone is locked.|اسمح بمنبّهات ملء الشاشة لتظهر شاشة المنبّه عند قفل هاتفك.
Allow Wake me to pop up on your screen in Android notification settings.|اسمح لمنبّه الاستيقاظ بالظهور على الشاشة في إعدادات إشعارات أندرويد.
Allow location|السماح بالموقع
Allow compass|السماح بالبوصلة
Allow location access to get your Qibla bearing.|اسمح بالوصول إلى الموقع لحساب اتجاه القبلة.
Allow location access to see your prayer times.|اسمح بالوصول إلى الموقع لعرض مواقيت الصلاة.
Allow location and compass|السماح بالموقع والبوصلة
Allow notifications|السماح بالإشعارات
An existing crossing stays in use. A missing crossing only tells you about the Sun’s position. The estimate cannot establish what the local sky looked like.|إذا بلغت الشمس الزاوية المحددة استُخدم وقت بلوغها. وإذا لم تبلغها فالنتيجة تقدير لحساب الوقت، ولا تصف ما يُرى في الأفق.
Angle fraction when missing|تقدير بجزء من الليل بحسب الزاوية
Angles estimate the religious signs. A missing crossing tells you about the Sun’s position.|تُستخدم الزوايا لتقدير العلامات الشرعية. عدم بلوغ الزاوية يبيّن موقع الشمس فقط.
App style|تصميم التطبيق
Appearance|المظهر
Audio file · up to 8 MB|ملف صوتي · حتى 8 ميغابايت
Back to today|العودة إلى اليوم
Calculated solar altitude. Dots mark the prayer timetable.|ارتفاع الشمس المحسوب. تشير النقاط إلى مواقيت الصلاة.
Calculating prayer times…|جارٍ حساب مواقيت الصلاة…
Calculating times…|جارٍ حساب المواقيت…
Calculation angles|زوايا الحساب
Chime|نغمة
Choose a date|اختر تاريخاً
Choose main timetable source|اختر مصدر المواقيت الرئيسي
Clear bell|جرس واضح
Clear entry|حذف التسجيل
Close date details|إغلاق تفاصيل التاريخ
Colour preset|الألوان
Compare missing-angle methods|مقارنة طرق التقدير عند غياب الزاوية
Compare prayer times|مقارنة مواقيت الصلاة
Compass accuracy|دقة البوصلة
Copy Safari link|نسخ رابط سفاري
Crescent|الهلال
Crossings only|أوقات بلوغ الزاوية فقط
Custom angles|زوايا مخصصة
Dates|التواريخ
Dayline|خط اليوم
Did you fast?|هل صمت؟
Differences from your main timetable|الفروق عن المواقيت الأساسية
Dimashqiya|الدمشقية
Derry|ديري
Londonderry|لندنديري
Strabane|سترابان
Limavady|ليمافادي
Dungiven|دنغيفن
Coleraine|كوليرين
Portrush|بورتروش
Portstewart|بورت ستيوارت
Omagh|أوماه
Belfast|بلفاست
Letterkenny|ليتركيني
Buncrana|بانكرانا
Muff|ماف
Bridgend|بريدجند
Moville|موفيل
Carndonagh|كارندونا
Malin Head|رأس مالين
Donegal Town|مدينة دونيغال
Dublin|دبلن
Cork|كورك
Galway|غالواي
Edinburgh|إدنبرة
Glasgow|غلاسكو
Lerwick|ليرويك
London|لندن
Birmingham|برمنغهام
Cardiff|كارديف
Northern Ireland|أيرلندا الشمالية
County Donegal|مقاطعة دونيغال
Ireland|أيرلندا
England|إنجلترا
Scotland|اسكتلندا
Shetland|شتلاند
Wales|ويلز
Dismiss prayer reminder|إغلاق تذكير الصلاة
Download adhan|تنزيل الأذان
E|شرق
Echo|صدى
Eid dates|مواعيد العيدين
Est.|تقديري
EST.|تقديري
Estimated Hijri date|التاريخ الهجري التقديري
Estimated dates. Check local moon announcements.|التواريخ تقديرية. راجع إعلان رؤية الهلال في منطقتك.
Fajr|الفجر
Fajr and Isha angles|زاويتا الفجر والعشاء
Fajr angle|زاوية الفجر
Fasted|صمت
Fasting|الصيام
Fasting log file|ملف سجل الصيام
Fasting view|عرض سجل الصيام
Fasts without dates|صيام دون تواريخ
First third|الثلث الأول
Focus|عرض موجز
Following GPS|يحدد موقعك تلقائياً
French UOIF · 12° / 12°|الاتحاد الإسلامي في فرنسا · 12° / 12°
Fri|الجمعة
From true north|من الشمال الحقيقي
Gentle chime|نغمة هادئة
Ghusl|الغسل
Half of the night (default)|نصف الليل (الافتراضي)
Half · show necessity period to Fajr|نصف الليل · إظهار وقت الضرورة إلى الفجر
Halfway|منتصف الليل
Hijri dates are unavailable on this device.|التواريخ الهجرية غير متاحة على هذا الجهاز.
Home Screen icon|أيقونة الشاشة الرئيسية
Home Screen icon design|تصميم أيقونة الشاشة الرئيسية
Horizon|الأفق
How the methods differ|الفرق بين الطرق
I need to make it up|عليّ قضاؤه
Icon page link|رابط صفحة الأيقونة
Iftar|الإفطار
Import a sound|استيراد صوت
Included in the fasted total above|يُحسب ضمن مجموع الأيام التي صمتها
Isha|العشاء
Isha alarm settings|إعدادات تنبيه العشاء
Isha angle|زاوية العشاء
Isha end time|نهاية وقت العشاء
Islamic dates|التواريخ الهجرية
Keep Salah on screen for these alerts. Tap Play sound to allow audio for this session.|أبقِ تطبيق صلاة ظاهراً لتلقي هذه التنبيهات. اضغط تشغيل الصوت للسماح بالصوت في هذه الجلسة.
Language|اللغة
Last valid day|آخر يوم بلغت فيه الشمس الزاوية
Learn|تعلّم
Load AlAdhan|تحميل مواقيت AlAdhan
Local relative|تقدير محلي نسبي
Local relative estimate|تقدير محلي نسبي
Local time|التوقيت المحلي
Location|الموقع
Location keeps your prayer times and Qibla up to date while Salah is open.|يحدّث الموقع مواقيت الصلاة واتجاه القبلة ما دام تطبيق صلاة مفتوحاً.
Location needed|يلزم تحديد الموقع
Log as a make-up fast|سجّل اليوم صيام قضاء
Log the selected day|سجّل اليوم المحدد
MWL angle pair · uses your summer rule|زوايا رابطة العالم الإسلامي · وفق طريقة التقدير التي اخترتها
Magnetic bearing|الاتجاه المغناطيسي
Main navigation|أقسام التطبيق
Make-up fasts|أيام القضاء
Mark as made up|سجّل أنه قُضي
Missed originally|فاتني في الأصل
Missing-angle method|طريقة التقدير عند غياب الزاوية
Mon|الاثنين
Month|شهر
Motion access lets Salah use your phone’s compass for Qibla.|يسمح الوصول إلى مستشعرات الحركة باستخدام بوصلة الهاتف لتحديد القبلة.
Muslim World League · 18° / 17°|رابطة العالم الإسلامي · 18° / 17°
N|شمال
Next comparison date|التاريخ التالي للمقارنة
Next day|اليوم التالي
Next prayer|الصلاة التالية
Next week|الأسبوع التالي
Next month|الشهر التالي
No imported audio saved.|لا يوجد صوت مستورد.
Not now|ليس الآن
Offline|بلا اتصال
On nights when Isha starts after the first third, the alarm uses the start of Isha.|إذا بدأ العشاء بعد الثلث الأول، يُحسب المنبه من بداية وقت العشاء.
One seventh|السُبع
One seventh when missing|التقدير بالسُبع عند غياب الزاوية
One seventh when missing (default)|التقدير بالسُبع عند غياب الزاوية (الافتراضي)
Open Salah battery settings|فتح إعدادات بطارية تطبيق صلاة
Open icon page|فتح صفحة الأيقونة
Open the icon page in Safari to add it to your Home Screen.|افتح صفحة الأيقونة في سفاري لإضافتها إلى الشاشة الرئيسية.
Other dates for worship|مواسم عبادة أخرى
Pause 30 seconds|إيقاف مؤقت لمدة 30 ثانية
Phone notifications|إشعارات الهاتف
Play sound|تشغيل الصوت
Prayer reminders settings|إعدادات تذكيرات الصلاة
Prayer time comparison|مقارنة مواقيت الصلاة
Prayer times|مواقيت الصلاة
Prayer times settings|إعدادات مواقيت الصلاة
Prayer timetable|جدول الصلاة
Prayer-time sound|صوت وقت الصلاة
Prayers|الصلوات
Praying while ill or unable to stand|صلاة المريض ومن لا يستطيع القيام
Pre-prayer reminder|تذكير قبل الصلاة
Previous comparison date|التاريخ السابق للمقارنة
Previous day|اليوم السابق
Previous week|الأسبوع السابق
Previous month|الشهر السابق
Qibla|القبلة
References|المراجع
Remind me|وقت التذكير
Remove saved audio|حذف الصوت المحفوظ
Repeat until stopped|التكرار حتى الإيقاف
Restore Salah access|استعادة أذونات تطبيق صلاة
Restore fasting log|استعادة سجل الصيام
Restore precise location|استعادة إذن الموقع الدقيق
Rule|الطريقة
S|جنوب
Salah — Prayer times|صلاة — مواقيت الصلاة
Sat|السبت
Save fasting log|حفظ سجل الصيام
Save settings|حفظ الإعدادات
Save your fasting log before replacing a Home Screen shortcut.|احفظ سجل الصيام قبل استبدال اختصار الشاشة الرئيسية.
Seasonal Tayba|تقدير طيبة الموسمي
Seasonal Tayba reference|تقدير طيبة الموسمي
Set up Salah|إعداد تطبيق صلاة
Settings|الإعدادات
Silent|صامت
Sound level|مستوى الصوت
Sounds|الأصوات
Sounds & reminders|الأصوات والتذكيرات
Start compass|تشغيل البوصلة
Stop|إيقاف
Stop wake alarm|إيقاف منبّه الاستيقاظ
Subtract one fasted day|اطرح يوماً صمته
Subtract one make-up fast|اطرح يوماً قضيته
Subtract one missed day|اطرح يوماً فاتك
Sun|الأحد
Sun’s altitude|ارتفاع الشمس
Tap Play sound to start audio for this session.|اضغط تشغيل الصوت للسماح بالصوت في هذه الجلسة.
Test alarm in 30 seconds|اختبار المنبه بعد 30 ثانية
The Isha reminder gives you 10 minutes’ notice before the preferred time. If you use the first third as your cutoff, it reminds you of that cutoff.|يظهر تذكير العشاء قبل الوقت الأفضل بعشر دقائق. وإذا اخترت الثلث الأول نهايةً للعشاء، يذكّرك بذلك الموعد.
The Sun's path today|مسار الشمس اليوم
The alarm repeats until you tap Stop. Your phone’s Alarms volume applies.|يتكرر المنبه حتى تضغط إيقاف. يتأثر الصوت بمستوى صوت المنبهات في الهاتف.
The night runs from sunset to the next Fajr.|يُحسب الليل من غروب الشمس إلى طلوع الفجر التالي.
Thu|الخميس
Time before Fajr|المدة قبل الفجر
Time before first third|المدة قبل الثلث الأول
Timetable|الجدول
To Makkah|إلى مكة
Today|اليوم
Tomorrow|غداً
Topics to add later|موضوعات ستُضاف لاحقاً
True bearing|الاتجاه الحقيقي
Tue|الثلاثاء
Turn access back on to use prayer alerts, prayer times and Qibla.|أعد منح الأذونات لاستخدام التنبيهات ومواقيت الصلاة والقبلة.
Turn on phone location|تشغيل الموقع في الهاتف
Upcoming fasts|أيام الصيام المقبلة
Upcoming prayer|الصلاة القادمة
Use my location|استخدم موقعي
Use the phone’s volume buttons to adjust overall loudness.|استخدم أزرار الهاتف لضبط مستوى الصوت العام.
Uses the adhan or chime and sound level selected above.|يستخدم الأذان أو النغمة ومستوى الصوت المحددين أعلاه.
W|غرب
Wake me|أيقظني
Wake me notification settings|إعدادات إشعار المنبه
Wed|الأربعاء
Week|أسبوع
When your angle has no crossing|عندما لا تبلغ الشمس الزاوية
Yes, I fasted|نعم، صمت
and|و
angle fraction|التقدير بجزء من الليل بحسب الزاوية
carries forward the last crossing’s clock time.|يستخدم توقيت آخر يوم بلغت فيه الشمس الزاوية.
estimates the missing prayer using Tayba.|يقدّر وقت الصلاة وفق طريقة طيبة.
fasted in total|مجموع ما صمت
fasting|الصيام
leaves the time blank.|يترك الوقت فارغاً.
salāh|صلاة
to make up|عليّ قضاؤها
use the local interval between sunset and sunrise.|يعتمدان على المدة المحلية بين غروب الشمس وشروقها.
uses annual local twilight fractions and five-minute steps at either end of the period.|يستخدم نسب الشفق المحلية السنوية وفواصل خمس دقائق عند طرفي المدة.
‹ All topics|› كل الموضوعات
`;

  const dynamic = `
90 minutes, subject to the 8° limit|90 دقيقة، مع مراعاة حد 8°
A little to the {direction}|أدر الهاتف قليلاً إلى {direction}
After sunset|بعد الغروب
After your selected end time|بعد وقت النهاية المحدد
Afternoon|بعد الظهر
AlAdhan Fajr is at or after the local sunrise time.|فجر AlAdhan يوافق الشروق المحلي أو يأتي بعده.
AlAdhan Isha does not follow the local sunset time.|عشاء AlAdhan لا يأتي بعد غروب الشمس المحلي.
AlAdhan Muslim World League|AlAdhan · رابطة العالم الإسلامي
AlAdhan could not be reached.|تعذّر الاتصال بخدمة AlAdhan.
AlAdhan is unavailable for this date. The timetable shows your local angle calculation.|مواقيت AlAdhan غير متاحة لهذا التاريخ. يعرض الجدول الحساب المحلي بالزوايا.
AlAdhan supplies Fajr and Isha. Daylight times use the local Sun calculation.|الفجر والعشاء من AlAdhan. أوقات النهار من الحساب المحلي لموقع الشمس.
AlAdhan · Moonsighting red preset|AlAdhan · إعداد رؤية الشفق الأحمر
Allow Salah notifications in your device settings.|اسمح بإشعارات تطبيق صلاة في إعدادات جهازك.
Allow location access to see your prayer times and Qibla.|اسمح بالوصول إلى الموقع لعرض المواقيت واتجاه القبلة.
Allow location for Salah in Android settings, then try again.|اسمح بالوصول إلى الموقع لتطبيق صلاة في إعدادات أندرويد ثم أعد المحاولة.
Allow location in your browser settings, then try again.|اسمح بالوصول إلى الموقع في إعدادات المتصفح ثم أعد المحاولة.
Allow notifications and exact alarms above.|اسمح بالإشعارات والمنبهات الدقيقة أعلاه.
Allow notifications and exact alarms for prayer alerts when Salah is closed.|اسمح بالإشعارات والمنبهات الدقيقة لتلقي تذكيرات الصلاة عند إغلاق التطبيق.
Amber sand|رملي كهرماني
Android is restricting Salah in the background. Check its battery settings.|يقيّد أندرويد عمل تطبيق صلاة في الخلفية. راجع إعدادات البطارية.
Android missed the test scheduled for {time}. Check permissions and battery settings, then try again.|لم ينفّذ أندرويد الاختبار المقرر في {time}. راجع الأذونات والبطارية ثم أعد المحاولة.
Android ran the last test at {time}. {result}|نفّذ أندرويد آخر اختبار في {time}. {result}
Android ran the last test at {time}.|نفّذ أندرويد آخر اختبار في {time}.
Approximate alignment|محاذاة تقريبية
Approximate guide. Check the bearings below.|الاتجاه تقريبي. راجع الاتجاهات أدناه.
Ashura and the day before|عاشوراء واليوم الذي قبله
Sunset {from} to dawn {to}|من مغرب {from} إلى فجر {to}
Asr|العصر
Asr time|وقت العصر
At the time|عند الموعد
Audio finished.|انتهى تشغيل الصوت.
Audio playback was blocked. Tap Play sound with Salah open.|تعذّر تشغيل الصوت. اضغط تشغيل الصوت أثناء فتح تطبيق صلاة.
Avoid general voluntary prayer until {time}|اترك النوافل المطلقة إلى {time}
Avoid optional prayers for about {minutes} minutes|اترك النوافل المطلقة لنحو {minutes} دقيقة
Before Fajr|قبل الفجر
Before sunrise|قبل الشروق
Between prayers|بين الصلوات
Calculated Isha is at {time} · end time at {deadline}.|العشاء المحسوب عند {time} · نهاية الوقت عند {deadline}.
Calculated Isha is at {time} · night marker at {marker}.|العشاء المحسوب عند {time} · الثلث الأول عند {marker}.
Cancel|إلغاء
Change to a regular fast|غيّر التسجيل إلى صيام عادي
Check date and location|تحقق من التاريخ والموقع
Check your prayer timetable for tonight.|راجع جدول الصلاة لهذه الليلة.
Checking notification access…|جارٍ التحقق من إذن الإشعارات…
Checking your new location…|جارٍ التحقق من موقعك الجديد…
Choose a fasting log saved from Salah.|اختر ملف سجل صيام محفوظاً من تطبيق صلاة.
Choose an adhan or chime above for the wake alarm.|اختر أذاناً أو نغمة من القائمة أعلاه لصوت المنبه.
Choose an audio file up to 8 MB.|اختر ملفاً صوتياً لا يتجاوز 8 ميغابايت.
Compass|البوصلة
Compass paused|البوصلة متوقفة مؤقتاً
Compass reading is weak|إشارة البوصلة ضعيفة
Compass reading jumped|تغيّرت قراءة البوصلة فجأة
Compass unavailable|البوصلة غير متاحة
Connect to the internet to download the adhan for scheduled playback.|اتصل بالإنترنت لتنزيل الأذان وتشغيله في المواعيد المحددة.
Cool slate|رمادي بارد
Copy this link and open it in Safari.|انسخ الرابط وافتحه في سفاري.
Could not ask for notification access.|تعذّر طلب إذن الإشعارات.
Could not get your location. Try again or move outdoors.|تعذّر تحديد موقعك. أعد المحاولة أو انتقل إلى مكان مفتوح.
Could not remove the saved sound.|تعذّر حذف الصوت المحفوظ.
Could not restore the fasting log.|تعذّرت استعادة سجل الصيام.
Could not save the imported sound.|تعذّر حفظ الصوت المستورد.
Could not save this count.|تعذّر حفظ العدد.
Could not save this entry.|تعذّر حفظ التسجيل.
Could not schedule alerts. Try reopening Salah.|تعذّرت جدولة التنبيهات. حاول فتح التطبيق من جديد.
Could not show the test. Reload Salah and try again.|تعذّر عرض إشعار الاختبار. أعد فتح التطبيق ثم حاول مجدداً.
Custom audio storage is unavailable.|تخزين الصوت المستورد غير متاح.
CURRENT|الآن
Dawn|الفجر الصادق
Dhuhr|الظهر
Dhuhr time|وقت الظهر
Downloading the adhan…|جارٍ تنزيل الأذان…
Duha time|وقت الضحى
Enter Fajr and Isha angles from 6° to 22°.|أدخل زاويتي الفجر والعشاء بين 6° و22°.
Enter a whole number of days.|أدخل عدداً صحيحاً من الأيام.
Entry cleared.|حُذف التسجيل.
est.|تقديري
Fajr ends|نهاية وقت الفجر
Fajr is unavailable under the selected method.|وقت الفجر غير متاح وفق الطريقة المحددة.
Fajr time|وقت الفجر
Fasting log ready to save.|سجل الصيام جاهز للحفظ.
Fasting log shared.|تمت مشاركة سجل الصيام.
Finding magnetic correction|جارٍ حساب التصحيح المغناطيسي
Finding your heading|جارٍ تحديد اتجاه الهاتف
Finding your location…|جارٍ تحديد موقعك…
First listed prayer|أول صلاة في الجدول
First listed prayer · estimate|أول صلاة في الجدول · تقديري
Fixed interval before sunrise|مدة ثابتة قبل الشروق
Following {place}|الموقع الحالي: {place}
Forbidden|وقت نهي
Forest green|أخضر غابي
From {time} if you’re able to delay Isha.|من {time} لمن استطاع تأخير العشاء.
From Qibla|عن القبلة
GPS area {latitude}, {longitude}|الموقع التقريبي {latitude}، {longitude}
Grant access for alerts when Salah is closed.|امنح الإذن لتلقي التنبيهات عند إغلاق التطبيق.
Half of the night|نصف الليل
Halfway through the night|منتصف الليل
Heading aligned|الاتجاه نحو القبلة
{state} · {degrees}° off|{state} · الفرق {degrees}°
Hold the phone flat and steady. If the reading stays paused, tap Restart compass.|أبقِ الهاتف مستوياً وثابتاً. إذا بقيت القراءة متوقفة، اضغط إعادة تشغيل البوصلة.
Hold the phone flat, away from metal.|أبقِ الهاتف مستوياً وبعيداً عن المعادن.
Hold your phone flat|أبقِ الهاتف مستوياً
Hold your phone flat and still.|أبقِ الهاتف مستوياً وثابتاً.
Hold your phone flat.|أبقِ الهاتف مستوياً.
Import an audio file first.|استورد ملفاً صوتياً أولاً.
In {timer}|بعد {timer}
{timer} · tomorrow|{timer} · غداً
{timer} · estimate|{timer} · تقديري
{timer} · tomorrow · estimate|{timer} · غداً · تقديري
In Safari, tap Share → Add to Home Screen.|في سفاري، اضغط مشاركة ثم إضافة إلى الشاشة الرئيسية.
In {minutes} minutes|بعد {minutes} دقيقة
Ireland time|توقيت أيرلندا
Isha begins later tonight|يبدأ العشاء في وقت لاحق من الليلة
Isha end time unavailable|نهاية وقت العشاء غير متاحة
Isha has yet to begin at this time|يبدأ العشاء بعد هذا الموعد
Isha starts after your selected end time.|يبدأ العشاء بعد وقت النهاية الذي اخترته.
Isha time|وقت العشاء
Isha time ends in {minutes}|ينتهي وقت العشاء بعد {minutes}
Isha time unavailable|وقت العشاء غير متاح
Isha · necessity period|العشاء · وقت الضرورة
Keep the phone flat.|أبقِ الهاتف مستوياً.
Keep the screen facing upwards.|اجعل الشاشة نحو الأعلى.
Load online|تحميل من الإنترنت
Loading AlAdhan times…|جارٍ تحميل مواقيت AlAdhan…
Loading sound…|جارٍ تحميل الصوت…
Loading…|جارٍ التحميل…
Local calculation|حساب محلي
Local media storage unavailable|تخزين الصوت المحلي غير متاح
Location is too imprecise. Try again outdoors.|الموقع غير دقيق بما يكفي. جرّب في مكان مفتوح.
Maghrib|المغرب
Maghrib time|وقت المغرب
Magnetic correction unavailable|التصحيح المغناطيسي غير متاح
Make-up count adjusted to {count}.|عُدّل عدد أيام القضاء إلى {count}.
Make-up fast|صيام قضاء
Make-up fasts cannot exceed the days fasted.|لا يمكن أن يزيد عدد أيام القضاء على مجموع الأيام التي صمتها.
Made up|تم قضاؤه
Media storage is busy|مخزن الصوت مشغول
Media storage operation failed|تعذّرت معالجة الصوت المحفوظ
Media storage unavailable|تخزين الصوت غير متاح
Midday|منتصف النهار
Midnight navy|كحلي ليلي
Mihrab|المحراب
Minaret|المئذنة
Missed|فاتني
Missing|غير متاح
Moonsighting|رؤية الهلال
Moonsighting red preset|إعداد الشفق الأحمر
Motion access was denied. Use the bearing below.|لم يُمنح إذن الحركة. استخدم الاتجاه أدناه.
Move away from metal and magnetic cases, then try again.|ابتعد عن المعدن والأغطية المغناطيسية ثم أعد المحاولة.
Move away from metal and remove any magnetic case, then check again.|ابتعد عن المعدن وانزع الغطاء المغناطيسي ثم جرّب مجدداً.
Move the phone slightly to refresh the reading.|حرّك الهاتف قليلاً لتحديث القراءة.
NEXT|التالي
NEXT PRAYER|الصلاة التالية
NEXT TIMETABLED PRAYER|الصلاة التالية في الجدول
Night|الليل
Night markers need the following day’s Fajr.|يتطلب حساب أجزاء الليل معرفة وقت الفجر التالي.
No fasts left to make up.|لا توجد أيام صيام متبقية للقضاء.
No upcoming time available|لا يتوفر موعد صلاة قادم
Ocean blue|أزرق محيطي
One length added to the noon shadow|عندما يصير الظل مثل طول الشيء زائداً ظل الزوال
Open Salah from your Home Screen to allow notifications.|افتح تطبيق صلاة من الشاشة الرئيسية للسماح بالإشعارات.
Open Salah over HTTPS on a device with location access.|افتح تطبيق صلاة برابط HTTPS على جهاز يتيح تحديد الموقع.
Open the copied link in Safari. Use Share → Add to Home Screen.|افتح الرابط المنسوخ في سفاري، ثم اضغط مشاركة وإضافة إلى الشاشة الرئيسية.
Open the icon page in Safari to add this design to your Home Screen.|افتح صفحة الأيقونة في سفاري لإضافة هذا التصميم إلى الشاشة الرئيسية.
PRAYER TIMES|مواقيت الصلاة
Paused for 30 seconds.|توقّف المنبه مؤقتاً لمدة 30 ثانية.
Playing adhan.|الأذان قيد التشغيل.
Playing chime.|النغمة قيد التشغيل.
Playing your sound.|الصوت قيد التشغيل.
Playing. Use the iPhone’s volume buttons for this recording.|الصوت قيد التشغيل. اضبطه بأزرار الصوت في آيفون.
Possible magnetic interference|تداخل مغناطيسي محتمل
Pray before the Sun yellows|صلِّ قبل اصفرار الشمس
Prayer|الصلاة
Prayer mat|سجادة الصلاة
Prayer notifications can appear while Salah is open.|يمكن أن تظهر تنبيهات الصلاة أثناء فتح التطبيق.
Prayer reminders are off in Android.|تذكيرات الصلاة مغلقة في أندرويد.
Prayer times and Qibla are available in the UK and Ireland.|مواقيت الصلاة والقبلة متاحة في المملكة المتحدة وأيرلندا.
Prayer-time sound is silent.|صوت الصلاة مضبوط على الصامت.
Prayer-time sound is silent. Reminder audio is ready.|صوت الصلاة مضبوط على الصامت. صوت التذكير جاهز.
Preferred time for Isha|الوقت الأفضل للعشاء
Preferred time for Isha begins|بداية الوقت الأفضل للعشاء
Preferred time for Isha in {minutes}|يبدأ الوقت الأفضل للعشاء بعد {minutes}
Previous night’s times unavailable|أوقات الليلة الماضية غير متاحة
Refresh location|تحديث الموقع
Repeating. Tap Stop to end.|يتكرر الصوت. اضغط إيقاف لإنهائه.
Restart compass|إعادة تشغيل البوصلة
Restored {number} entry.|تمت استعادة سجل واحد.
Restored {number} entries.|تمت استعادة {number} من السجلات.
Restored {number} entry and undated counts.|تمت استعادة سجل واحد والأعداد غير المؤرخة.
Restored {number} entries and undated counts.|تمت استعادة {number} من السجلات والأعداد غير المؤرخة.
Safari sets the icon when you add Salah to the Home Screen.|يعيّن سفاري الأيقونة عند إضافة تطبيق صلاة إلى الشاشة الرئيسية.
Salah test notification|إشعار اختبار من تطبيق صلاة
Saved locally · {size} MB|محفوظ على الجهاز · {size} ميغابايت
Saved sound removed.|حُذف الصوت المحفوظ.
Scheduled adhan is ready offline.|الأذان المجدول جاهز دون اتصال.
Dimashqiya is ready as a backup while your selected adhan is unavailable.|أذان الدمشقية جاهز احتياطياً إذا تعذّر تشغيل الأذان الذي اخترته.
Playing the Dimashqiya backup adhan.|يعمل الآن أذان الدمشقية الاحتياطي.
Last adhan · {prayer} · {time}|آخر أذان · {prayer} · {time}
Seasonal model|الحساب الموسمي
Selected date|التاريخ المحدد
Send test notification|إرسال إشعار اختبار
Set up prayer alerts|إعداد تنبيهات الصلاة
Settings saved.|حُفظت الإعدادات.
Sound saved. Tap Play sound to check it.|حُفظ الصوت. اضغط تشغيل الصوت للتأكد منه.
Sound saved. Tap Play sound to hear it.|حُفظ الصوت. اضغط تشغيل الصوت لسماعه.
Sound stopped.|توقّف الصوت.
Starting wake alarm…|جارٍ تشغيل منبّه الاستيقاظ…
Stop compass|إيقاف البوصلة
Storage error|خطأ في التخزين
Sunrise|الشروق
Sunset|الغروب
Tayba|طيبة
Tayba gives no Isha here because the Sun stays less than 8° below the horizon.|لا تحدد طيبة عشاءً هنا لأن الشمس لا تنخفض 8° تحت الأفق.
Test adhan in 30 seconds|اختبار الأذان بعد 30 ثانية
Test alert in 30 seconds|اختبار التنبيه بعد 30 ثانية
Test alert scheduled. You can lock your phone.|تمت جدولة الاختبار. يمكنك قفل هاتفك.
Test notification sent.|أُرسل إشعار الاختبار.
The Isha alarm is off or silent in Android.|تنبيه العشاء مغلق أو صامت في أندرويد.
The coordinates or calculation settings are invalid.|إحداثيات الموقع أو إعدادات الحساب غير صالحة.
The model finds no {angles} crossing. Estimate from {method}.|لا تبلغ الشمس الزاوية في {angles}. التقدير بطريقة {method}.
The night markers use an estimated next Fajr.|أجزاء الليل محسوبة على وقت فجر تقديري.
The phone could not give compass access. Use the bearing below.|تعذّر الوصول إلى البوصلة. استخدم الاتجاه أدناه.
The phone sent no compass heading. Use the bearing below.|لم يرسل الهاتف قراءة للبوصلة. استخدم الاتجاه أدناه.
The seasonal Tayba Fajr time is unavailable.|وقت الفجر بتقدير طيبة الموسمي غير متاح.
The sunrise, sunset or Asr calculation is unavailable for this place and date.|تعذّر حساب الشروق أو الغروب أو العصر لهذا الموقع والتاريخ.
The wake alarm sound is waiting to download.|صوت منبّه الاستيقاظ بانتظار التنزيل.
There are no fasting entries to save.|لا يوجد صيام مسجّل للحفظ.
This Fajr estimate also affects the calculated start of fasting. True dawn is the light spreading along the eastern horizon.|يؤثر تقدير الفجر في حساب بدء الصيام. الفجر الصادق هو الضوء المنتشر في الأفق الشرقي.
This Isha calculation overlaps the following Fajr, so there is no separate Isha time.|يتداخل وقت العشاء المحسوب مع الفجر التالي، فلا يظهر وقت مستقل للعشاء.
This browser can show reminders inside Salah.|يمكن لهذا المتصفح عرض التذكيرات داخل التطبيق.
This device gives no compass accuracy estimate.|لا يوفّر هذا الجهاز تقديراً لدقة البوصلة.
This phone gives no compass heading. Use the bearing below.|لا يوفّر هذا الهاتف قراءة للبوصلة. استخدم الاتجاه أدناه.
This recording is unavailable. Open Salah online to save it.|التسجيل غير متاح. افتح التطبيق مع اتصال بالإنترنت لحفظه.
Timing unavailable|الوقت غير متاح
Time unavailable|الوقت غير متاح
Times unavailable for this date and location.|المواقيت غير متاحة لهذا المكان والتاريخ.
to {time}|إلى {time}
Try compass again|إعادة محاولة تشغيل البوصلة
Turn {direction} {degrees}°|أدر الهاتف إلى {direction} بمقدار {degrees}°
Turn {direction}|أدر الهاتف إلى {direction}
left|اليسار
right|اليمين
Turn on Location in Android settings, then try again.|شغّل خدمة الموقع في أندرويد ثم أعد المحاولة.
Turn on Prayer times and choose Alert in Android.|شغّل إشعارات مواقيت الصلاة واختر التنبيه في أندرويد.
Turn on Precise location for Salah in Android settings, then try again.|شغّل الموقع الدقيق للتطبيق في إعدادات أندرويد ثم أعد المحاولة.
Turn on Wake me notifications in Android.|شغّل إشعارات منبّه الاستيقاظ في أندرويد.
Turn up Alarms in Android’s volume controls.|ارفع مستوى صوت المنبهات في أندرويد.
Turn up the sound level above to hear the alarm.|ارفع مستوى الصوت أعلاه لسماع المنبه.
Turn your phone upright|اجعل الهاتف بوضع طولي
UK time|توقيت المملكة المتحدة
Unavailable|غير متاح
Uncalibrated|غير معايرة
Until about {time}|إلى نحو {time}
Until {time}|إلى {time}
Use portrait orientation with the screen facing upwards.|استخدم الوضع الطولي واجعل الشاشة نحو الأعلى.
Use the bearing below, or open Salah over HTTPS on a phone with a compass.|استخدم الاتجاه أدناه أو افتح تطبيق صلاة برابط HTTPS على هاتف مزوّد ببوصلة.
Use the true bearing below.|استخدم الاتجاه الحقيقي أدناه.
Use your location on the Today screen to schedule prayer alerts.|حدّد موقعك من شاشة اليوم لجدولة تنبيهات الصلاة.
Use your location to compare prayer times.|حدّد موقعك لمقارنة مواقيت الصلاة.
Use your location to see local Fajr and iftar.|حدّد موقعك لعرض وقتي الفجر والإفطار.
Using local times for this date.|تُعرض المواقيت المحلية لهذا التاريخ.
Using local times while AlAdhan is unavailable.|تُعرض المواقيت المحلية عندما يتعذّر الوصول إلى AlAdhan.
Waiting for AlAdhan times.|بانتظار مواقيت AlAdhan.
Waiting for permission|بانتظار الإذن
Waiting for prayer times for your location.|بانتظار مواقيت الصلاة لموقعك.
Waiting for usable prayer times.|بانتظار مواقيت صلاة صالحة.
Waiting for your location|بانتظار تحديد موقعك
Wake alarm is ringing.|منبّه الاستيقاظ يعمل.
Wake alarm test scheduled. You can lock your phone.|تمت جدولة اختبار المنبه. يمكنك قفل هاتفك.
Your angles|زواياك
Your {angles}|زواياك {angles}
Your selected end time is {time}.|نهاية الوقت التي اخترتها عند {time}.
same time|نفس الوقت
{prayer} begins|دخل وقت {prayer}
{prayer} in {minutes}|{prayer} بعد {minutes}
{prayer} at {time} · {minutes} away|{prayer} عند {time} · بعد {minutes}
{title} · {body}|{title} · {body}
{number} minute|دقيقة واحدة
{number} minutes|{number} دقيقة
{number} min|{number} د
{number} km|{number} كم
{number}° now|{number}° الآن
{hours}h {minutes}m|{hours} س {minutes} د
{number} fasted this week|صمت {number} من أيام هذا الأسبوع
{number} fasted this month|صمت {number} من أيام هذا الشهر
{number} without dates|{number} دون تواريخ
{entry} saved.|حُفظ تسجيل {entry}.
Open Salah|افتح تطبيق صلاة
{logo} · Salah|{logo} · صلاة
{position} (estimate)|{position} (تقديري)
{time} (+1 day)|{time} (اليوم التالي)
{prayer} uses Tayba’s {method}.|تستخدم صلاة {prayer} تقدير طيبة بطريقة {method}.
({minutes} estimate)|({minutes} تقديري)
fixed interval before sunrise|مدة ثابتة قبل الشروق
90 minutes, subject to the 8° limit|90 دقيقة، مع مراعاة حد 8°
AlAdhan · Moonsighting red preset|AlAdhan · إعداد الشفق الأحمر
(next day)|اليوم التالي
(+1 day)|اليوم التالي
local calculation|حساب محلي
estimate|تقديري
waiting for AlAdhan|بانتظار AlAdhan
through {date}|حتى {date}
Next {time} · {place}|التالي {time} · {place}
`;

  const details = `
North-north-east|شمال شمال شرقي
North-east|شمال شرقي
East-north-east|شرق شمال شرقي
East-south-east|شرق جنوب شرقي
South-east|جنوب شرقي
South-south-east|جنوب جنوب شرقي
South-south-west|جنوب جنوب غربي
South-west|جنوب غربي
West-south-west|غرب جنوب غربي
West-north-west|غرب شمال غربي
North-west|شمال غربي
North-north-west|شمال شمال غربي
Turn ticks and alignment chime|نقرات الاقتراب ونغمة المحاذاة
Compass feedback|إشارات البوصلة
Fixed Isha interval|فاصل ثابت للعشاء
No {degrees} crossing on this date.|لا تبلغ الشمس {degrees} في هذا التاريخ.
This estimate gives no usable {prayer} time for the date.|لا يعطي هذا التقدير وقتاً صالحاً لصلاة {prayer} في هذا التاريخ.
{service} has no {prayer} time for the date.|لا تعطي {service} وقتاً لصلاة {prayer} في هذا التاريخ.
`;

  const table = new Map();
  const templates = [];
  const field = /\{(\w+)\}/g;
  const normalise = text => text.trim().replace(/\s+/g, ' ');
  const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const line of (copy + dynamic + details).trim().split('\n')) {
    const split = line.indexOf('|');
    if (split < 0) continue;
    const english = line.slice(0, split);
    const arabic = line.slice(split + 1);
    table.set(english, arabic);
    const fields = [...english.matchAll(field)].map(match => match[1]);
    if (fields.length) {
      const parts = english.split(field).filter((_, i) => i % 2 === 0);
      templates.push({ pattern:new RegExp('^' + parts.map(escape).join('(.+?)') + '$'), fields, arabic,
        specificity:parts.join('').length });
    }
  }
  templates.sort((a, b) => b.specificity - a.specificity);
  const format = (text, values) => text.replace(field, (match, key) => values[key] ?? match);

  function start(language) {
    const isArabic = language === 'ar';
    const uiLocale = isArabic ? 'ar' : 'en-GB';
    function t(text, values) {
      const key = normalise(text);
      if (values) return format(isArabic ? table.get(key) ?? text : text, values);
      if (!isArabic) return text;
      if (table.has(key)) return table.get(key);
      for (const { pattern, fields, arabic } of templates) {
        const match = pattern.exec(key);
        if (!match) continue;
        return format(arabic, Object.fromEntries(fields.map((name, i) => [name, t(match[i + 1])])));
      }
      return text;
    }
    if (isArabic) {
      const root = document.documentElement;
      root.lang = 'ar';
      root.dir = 'rtl';
      const attributes = ['aria-label', 'title', 'placeholder'];
      const skip = 'script, style, [data-localised]';
      function translateNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
          if (node.parentElement?.closest(skip)) return;
          const text = node.nodeValue;
          const translation = t(text);
          if (translation !== text) {
            node.nodeValue = text.match(/^\s*/)[0] + translation + text.match(/\s*$/)[0];
          }
        }
        if (node.nodeType !== Node.ELEMENT_NODE || node.closest(skip)) return;
        for (const key of attributes) {
          const text = node.getAttribute(key);
          if (text && t(text) !== text) node.setAttribute(key, t(text));
        }
        for (const child of node.childNodes) translateNode(child);
      }
      translateNode(root);
      new MutationObserver(changes => {
        for (const change of changes) {
          if (change.type !== 'childList') translateNode(change.target);
          else for (const node of change.addedNodes) translateNode(node);
        }
      }).observe(root, { childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:attributes });
    }
    return { t, uiLocale, isArabic };
  }

  function arabicReference(name) {
    return name.replace(/Sahih al-Bukhari|Al-Bukhari/g, 'البخاري')
      .replace(/Sahih Muslim|Muslim/g, 'مسلم')
      .replace(/Al-Tirmidhi|Jami‘ al-Tirmidhi/g, 'الترمذي')
      .replace(/Abu Dawud/g, 'أبو داود').replace(/Qur’an/g, 'القرآن')
      .replace(/Ibn Majah/g, 'ابن ماجه')
      .replace(/Surah Al-Mulk|Al-Mulk/g, 'سورة الملك')
      .replace(/Al-Ma’idah/g, 'المائدة').replace(/An-Nisa/g, 'النساء')
      .replace(/Al-Baqarah/g, 'البقرة').replace(/Ayat Al-Kursi/g, 'آية الكرسي')
      .replace(/An-Nasa’i|Al-Nasa’i/g, 'النسائي')
      .replace(/\(sahih, al-Albani\)/gi, '(صححه الألباني)')
      .replace(/Ibn Baz on choosing the six days/g, 'ابن باز · وقت صيام الست من شوال')
      .replace(/Ibn Baz on missed Ramadan fasts/g, 'ابن باز · قضاء رمضان قبل الست');
  }

  window.SalahLocale = { start, arabicReference };
})();
