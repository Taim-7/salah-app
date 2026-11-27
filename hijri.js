(function (root) {
  'use strict';

  const months = ['Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 'Jumada al-Ula', 'Jumada al-Akhirah',
    'Rajab', 'Sha’ban', 'Ramadan', 'Shawwal', 'Dhul-Qa’dah', 'Dhul-Hijjah'];
  const arabicMonths = ['محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة',
    'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'];
  const dayMs = 86400000;
  const noon = key => new Date(key + 'T12:00:00Z');
  const keyFor = date => date.toISOString().slice(0, 10);
  let formatter;
  for (const calendar of ['islamic-umalqura', 'islamic-civil']) {
    const candidate = new Intl.DateTimeFormat('en-GB', {
      calendar, timeZone:'UTC', numberingSystem:'latn', year:'numeric', month:'numeric', day:'numeric'
    });
    if (candidate.resolvedOptions().calendar === calendar) { formatter = candidate; break; }
  }

  const tashriqDays = 'The Days of Tashriq are the three days after Eid al-Adha, from 11 to 13 Dhul-Hijjah. The name refers to the old practice of drying the meat from the sacrifice in the sun.';
  const tashriqHadith = {
    name:'Sahih Muslim 1141a–b (combined wording)', arName:'مسلم ١١٤١ (بجمع الروايتين)', url:'https://sunnah.com/muslim:1141b',
    arabic:'أَيَّامُ التَّشْرِيقِ أَيَّامُ أَكْلٍ وَشُرْبٍ وَذِكْرٍ لِلَّهِ',
    meaning:'The Days of Tashriq are days of eating, drinking and remembering Allah.'
  };
  const fitrDeadline = {
    name:'Sahih al-Bukhari 1509', url:'https://sunnah.com/bukhari:1509',
    arabic:'أَمَرَ بِزَكَاةِ الْفِطْرِ قَبْلَ خُرُوجِ النَّاسِ إِلَى الصَّلَاةِ',
    meaning:'He ordered that Zakat al-Fitr be given before people went out to the prayer.'
  };

  const occasions = {
    ramadan: {
      name:'Ramadan fasting', kind:'required', ruling:'Obligatory fasts',
      notes:[
        'Ramadan is the ninth Hijri month, when the Qur’an was revealed. Allah prescribed fasting to help believers grow in taqwa, or mindfulness of Him. Those who miss days because of illness or travel make up the same number later.',
        'Suhur is the meal before dawn. Finish eating and drinking by true dawn, when Fajr begins. Break the fast at sunset, when Maghrib begins.',
        'Ramadan lasts 29 or 30 days. The dates here are estimates. Follow your local announcement for the start of fasting and for Eid.'
      ],
      sources:[
        { name:'Qur’an 2:187', url:'https://quran.com/2/187',
          arabic:'وَكُلُوا وَاشْرَبُوا حَتَّىٰ يَتَبَيَّنَ لَكُمُ الْخَيْطُ الْأَبْيَضُ مِنَ الْخَيْطِ الْأَسْوَدِ مِنَ الْفَجْرِ ثُمَّ أَتِمُّوا الصِّيَامَ إِلَى اللَّيْلِ',
          meaning:'Eat and drink until the white thread becomes distinct from the black thread at dawn. Then complete the fast until night.' },
        { name:'Sahih al-Bukhari 38', url:'https://sunnah.com/bukhari:38',
          arabic:'مَنْ صَامَ رَمَضَانَ إِيمَانًا وَاحْتِسَابًا غُفِرَ لَهُ مَا تَقَدَّمَ مِنْ ذَنْبِهِ',
          meaning:'Whoever fasts Ramadan with faith and seeking reward will have their past sins forgiven.' },
        { name:'Sahih al-Bukhari 1909', url:'https://sunnah.com/bukhari:1909',
          arabic:'صُومُوا لِرُؤْيَتِهِ، وَأَفْطِرُوا لِرُؤْيَتِهِ، فَإِنْ غُبِّيَ عَلَيْكُمْ فَأَكْمِلُوا عِدَّةَ شَعْبَانَ ثَلَاثِينَ',
          meaning:'Begin fasting when you see the new moon and end the month of fasting when you see it again. If clouds hide it from you, count thirty days of Sha’ban.' },
        { name:'Sahih al-Bukhari 1923', url:'https://sunnah.com/bukhari:1923',
          arabic:'تَسَحَّرُوا فَإِنَّ فِي السَّحُورِ بَرَكَةً',
          meaning:'Eat suhur, for there is blessing in suhur.' }
      ],
      refs:[{ name:'Ibn Baz · The start of the lunar month', arName:'ابن باز · اعتماد رؤية الهلال',
        url:'https://binbaz.org.sa/fatwas/10553/اعتماد-الرؤية-وعدم-اعتبار-اختلاف-المطالع' }]
    },
    white: {
      name:'White Days', kind:'sunnah', ruling:'Sunnah fasts',
      notes:[
        'The White Days are the 13th, 14th and 15th of a Hijri month, named for the bright nights around the full moon. Fasting on them is optional and recommended. You can also choose other days to follow the broader Sunnah of fasting three days that month.',
        tashriqDays,
        'The 13th of Dhul-Hijjah is both a White Day and the last day of Tashriq. Skip the fast on the 13th. You can fast the 14th and 15th, and pick another day that month if you want to fast three. In Ramadan, the White Days fall within the obligatory fast.'
      ],
      sources:[
        { name:'Abu Dawud 2449 (sahih, al-Albani)', url:'https://sunnah.com/abudawud:2449',
          arabic:'عَنِ ابْنِ مِلْحَانَ الْقَيْسِيِّ، عَنْ أَبِيهِ، قَالَ: كَانَ رَسُولُ اللَّهِ ﷺ يَأْمُرُنَا أَنْ نَصُومَ الْبِيضَ ثَلَاثَ عَشْرَةَ وَأَرْبَعَ عَشْرَةَ وَخَمْسَ عَشْرَةَ',
          meaning:'Ibn Milhan al-Qaysi narrated from his father, who said, “The Messenger of Allah ﷺ used to tell us to fast the White Days, the 13th, 14th and 15th.”' },
        { name:'Sahih Muslim 1160', url:'https://sunnah.com/muslim:1160',
          arabic:'يَصُومُ مِنْ كُلِّ شَهْرٍ ثَلَاثَةَ أَيَّامٍ … لَمْ يَكُنْ يُبَالِي مِنْ أَيِّ أَيَّامِ الشَّهْرِ يَصُومُ',
          meaning:'He would fast three days of each month … He did not mind which days of the month he fasted.' },
        tashriqHadith
      ],
      refs:[{ name:'Ibn ‘Uthaymin · The White Days', arName:'ابن عثيمين · صيام الأيام البيض',
        url:'https://old.binothaimeen.net/content/9729' }]
    },
    arafah: {
      name:'Day of Arafah', kind:'sunnah', ruling:'Sunnah fast',
      notes:[
        'The Day of Arafah falls on 9 Dhul-Hijjah. Fasting is recommended for people observing the day at home.',
        'Ibn ‘Uthaymin said to follow the date of 9 Dhul-Hijjah where you live. The app uses lunar estimates. Check the announcement of the community you fast with.',
        'Ibn Baz explained that the forgiveness mentioned in the hadith concerns minor sins. Major sins call for repentance.'
      ],
      sources:[
        { name:'Sahih Muslim 1162a', url:'https://sunnah.com/muslim:1162a',
          arabic:'صِيَامُ يَوْمِ عَرَفَةَ أَحْتَسِبُ عَلَى اللَّهِ أَنْ يُكَفِّرَ السَّنَةَ الَّتِي قَبْلَهُ وَالسَّنَةَ الَّتِي بَعْدَهُ',
          meaning:'For fasting on the Day of Arafah, I hope Allah will forgive the sins of the year before it and the year after it.' },
        { name:'Sahih Muslim 1348', url:'https://sunnah.com/muslim:1348',
          arabic:'مَا مِنْ يَوْمٍ أَكْثَرَ مِنْ أَنْ يُعْتِقَ اللَّهُ فِيهِ عَبْدًا مِنَ النَّارِ مِنْ يَوْمِ عَرَفَةَ',
          meaning:'There is no day on which Allah frees more servants from the Fire than the Day of Arafah.' }
      ],
      refs:[{ name:'Ibn ‘Uthaymin · Following the local date', arName:'ابن عثيمين · صيام يوم عرفة عند اختلاف المطالع',
        url:'https://albayan.co.uk/text.aspx?id=1318' },
        { name:'Ibn Baz · What the Arafah fast makes up for', arName:'ابن باز · هل صيام يوم عرفة يكفّر الكبائر؟',
          url:'https://binbaz.org.sa/fatwas/14260/هل-صيام-يوم-عرفة-يكفر-الكبائر' }]
    },
    ashura: {
      name:'Ashura', kind:'sunnah', ruling:'Sunnah fast',
      notes:[
        'Ashura is 10 Muharram. When the Prophet ﷺ came to Madinah, the Jews there told him they fasted because Allah had rescued the Children of Israel. The Prophet ﷺ said the Muslims had more right to Musa and fasted that day.',
        'Fasting Ashura became optional when Ramadan became obligatory. It is recommended to fast the 9th with the 10th. Ibn Baz said you can also fast the 10th with the 11th, or fast the 10th on its own.'
      ],
      sources:[
        { name:'Qur’an 26:65–66', url:'https://quran.com/26/65-66',
          arabic:'وَأَنْجَيْنَا مُوسَىٰ وَمَنْ مَعَهُ أَجْمَعِينَ ۝ ثُمَّ أَغْرَقْنَا الْآخَرِينَ',
          meaning:'We saved Musa and all who were with him. Then We drowned the others.' },
        { name:'Sahih al-Bukhari 2004', url:'https://sunnah.com/bukhari:2004',
          arabic:'فَأَنَا أَحَقُّ بِمُوسَى مِنْكُمْ … فَصَامَهُ وَأَمَرَ بِصِيَامِهِ',
          meaning:'“I have more right to Musa than you do” … So he fasted that day and commanded people to fast it.' },
        { name:'Sahih al-Bukhari 2002', url:'https://sunnah.com/bukhari:2002',
          arabic:'فَلَمَّا فُرِضَ رَمَضَانُ تَرَكَ يَوْمَ عَاشُورَاءَ، فَمَنْ شَاءَ صَامَهُ، وَمَنْ شَاءَ تَرَكَهُ',
          meaning:'When Ramadan became obligatory, he left the fast of Ashura. Whoever wished could fast it and whoever wished could leave it.' },
        { name:'Sahih Muslim 1162a', url:'https://sunnah.com/muslim:1162a',
          arabic:'وَصِيَامُ يَوْمِ عَاشُورَاءَ أَحْتَسِبُ عَلَى اللَّهِ أَنْ يُكَفِّرَ السَّنَةَ الَّتِي قَبْلَهُ',
          meaning:'For fasting on the Day of Ashura, I hope Allah will forgive the sins of the year before it.' },
        { name:'Sahih Muslim 1134a', url:'https://sunnah.com/muslim:1134a',
          arabic:'فَإِذَا كَانَ الْعَامُ الْمُقْبِلُ إِنْ شَاءَ اللَّهُ صُمْنَا الْيَوْمَ التَّاسِعَ',
          meaning:'If next year comes, Allah willing, we will fast the ninth day.' }
      ],
      refs:[{ name:'Ibn Baz · Fasting on, before and after Ashura', arName:'ابن باز · صيام عاشوراء ويوم قبله أو بعده',
        url:'https://binbaz.org.sa/fatwas/12711/عاشوراء-هل-الافضل-صيام-يوم-قبله-ام-بعده' }]
    },
    fitr: {
      name:'Eid al-Fitr', kind:'forbidden', ruling:'Do not fast',
      notes:[
        'Eid al-Fitr is on 1 Shawwal, the month after Ramadan. Fasting on Eid itself is forbidden. Give Zakat al-Fitr, the charity due at the end of Ramadan, before the Eid prayer.',
        'The Prophet ﷺ ate an odd number of dates before going out to pray.'
      ],
      sources:[
        { name:'Sahih Muslim 1137', url:'https://sunnah.com/muslim:1137',
          arabic:'إِنَّ هَذَيْنِ يَوْمَانِ نَهَى رَسُولُ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ عَنْ صِيَامِهِمَا',
          meaning:'These are two days on which Allah’s Messenger ﷺ forbade fasting.' },
        { name:'Abu Dawud 1134 (sahih, al-Albani)', url:'https://sunnah.com/abudawud:1134',
          arabic:'إِنَّ اللَّهَ قَدْ أَبْدَلَكُمْ بِهِمَا خَيْرًا مِنْهُمَا يَوْمَ الْأَضْحَى وَيَوْمَ الْفِطْرِ',
          meaning:'Allah has given you two better days in their place, the Day of Sacrifice and the Day of Breaking the Fast.' },
        fitrDeadline,
        { name:'Sahih al-Bukhari 953', url:'https://sunnah.com/bukhari:953',
          arabic:'كَانَ رَسُولُ اللَّهِ صلى الله عليه وسلم لَا يَغْدُو يَوْمَ الْفِطْرِ حَتَّى يَأْكُلَ تَمَرَاتٍ … وَيَأْكُلُهُنَّ وِتْرًا',
          meaning:'Allah’s Messenger ﷺ would not go out on Eid al-Fitr until he had eaten some dates … and he would eat an odd number.' }
      ]
    },
    adha: {
      name:'Eid al-Adha', kind:'forbidden', ruling:'Do not fast',
      notes:[
        'Eid al-Adha is the festival of sacrifice on 10 Dhul-Hijjah. The Qur’an tells how Ibrahim saw in a dream that he was to sacrifice his son. When they both submitted to Allah, Allah spared the son and provided a sacrifice in his place.',
        'Fasting is forbidden on Eid. The Days of Tashriq start the next day, on 11 Dhul-Hijjah.'
      ],
      sources:[
        { name:'Qur’an 37:107', url:'https://quran.com/37/107',
          arabic:'وَفَدَيْنَاهُ بِذِبْحٍ عَظِيمٍ',
          meaning:'We ransomed him with a great sacrifice.' },
        { name:'Sahih al-Bukhari 1991–92', url:'https://sunnah.com/bukhari:1991',
          arabic:'نَهَى النَّبِيُّ صلى الله عليه وسلم عَنْ صَوْمِ يَوْمِ الْفِطْرِ وَالنَّحْرِ',
          meaning:'The Prophet ﷺ forbade fasting on the Day of Breaking the Fast and the Day of Sacrifice.' }
      ]
    },
    qadr: {
      name:'Last nights of Ramadan', kind:'worship', ruling:'Seek Laylat al-Qadr',
      notes:[
        'The Qur’an says Laylat al-Qadr is better than a thousand months. The Prophet ﷺ taught Muslims to look for it in the last ten nights. Ibn Baz gave special attention to the odd nights. Ibn Taymiyyah explained that “odd” can also count backwards from the end of the month, so both advised making time for worship on every one of these nights.',
        'Start at sunset at the end of 20 Ramadan. The last night ends at dawn on the last day of fasting. Ibn Baz also recommended i‘tikaf, setting aside time to worship in the mosque, especially in this part of Ramadan.',
        'Aishah asked what to say if she found Laylat al-Qadr. The Prophet ﷺ taught her to ask Allah for pardon.'
      ],
      sources:[
        { name:'Qur’an 97:3', url:'https://quran.com/97/3',
          arabic:'لَيْلَةُ الْقَدْرِ خَيْرٌ مِنْ أَلْفِ شَهْرٍ',
          meaning:'The Night of Decree is better than a thousand months.' },
        { name:'Sahih al-Bukhari 2017', url:'https://sunnah.com/bukhari:2017',
          arabic:'تَحَرَّوْا لَيْلَةَ الْقَدْرِ فِي الْوِتْرِ مِنَ الْعَشْرِ الْأَوَاخِرِ مِنْ رَمَضَانَ',
          meaning:'Seek Laylat al-Qadr in the odd nights of the last ten nights of Ramadan.' },
        { name:'Sahih al-Bukhari 2026', url:'https://sunnah.com/bukhari:2026',
          arabic:'كَانَ يَعْتَكِفُ الْعَشْرَ الأَوَاخِرَ مِنْ رَمَضَانَ حَتَّى تَوَفَّاهُ اللَّهُ',
          meaning:'He used to observe i‘tikaf in the last ten days of Ramadan until he died.' },
        { name:'Al-Tirmidhi 3513', url:'https://sunnah.com/tirmidhi:3513',
          arabic:'اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي',
          meaning:'O Allah, You pardon and love to pardon, so pardon me.' }
      ],
      refs:[{ name:'Ibn Baz · Laylat al-Qadr', arName:'ابن باز · علامة ليلة القدر', url:'https://binbaz.org.sa/fatwas/12989/علامة-ليلة-القدر' },
        { name:'Ibn Taymiyyah · How to count the nights', arName:'ابن تيمية · كيف تُحسب ليالي الوتر؟',
          url:'https://ar.wikisource.org/wiki/مجموع_الفتاوى/المجلد_الخامس_والعشرون#سئل_عن_ليلة_القدر' },
        { name:'Ibn Baz · I‘tikaf', arName:'ابن باز · وقت الاعتكاف', url:'https://binbaz.org.sa/fatwas/17377/ما-هو-الاعتكاف-وهل-له-وقت-معين' }]
    },
    dhulFirst: {
      name:'First nine days of Dhul-Hijjah', kind:'sunnah', ruling:'Optional fasting',
      notes:[
        'Fasting is recommended on the first nine days of Dhul-Hijjah. You can fast on any of the days from the 1st to the 9th.',
        'A report describes the Prophet ﷺ fasting those days. Aishah said she did not see him fast then. Ibn Baz recommended fasting based on the hadith on the reward of good deeds in the first ten days.',
        'Day 9 is Arafah, which has its own hadith on fasting. Day 10 is Eid al-Adha and fasting on it is forbidden.'
      ],
      sources:[
        { name:'Sahih al-Bukhari 969', url:'https://sunnah.com/bukhari:969',
          arabic:'مَا الْعَمَلُ فِي أَيَّامٍ أَفْضَلَ مِنْهَا فِي هَذِهِ',
          meaning:'Deeds done on other days are no better than those done on these days.' },
        { name:'Abu Dawud 2437', url:'https://sunnah.com/abudawud:2437',
          arabic:'كَانَ رَسُولُ اللَّهِ ﷺ يَصُومُ تِسْعَ ذِي الْحِجَّةِ',
          meaning:'The report says Allah’s Messenger ﷺ used to fast the first nine days of Dhul-Hijjah.' },
        { name:'Sahih Muslim 1176a', url:'https://sunnah.com/muslim:1176a',
          arabic:'عَنْ عَائِشَةَ قَالَتْ: مَا رَأَيْتُ رَسُولَ اللَّهِ ﷺ صَائِمًا فِي الْعَشْرِ قَطُّ',
          meaning:'Aishah said, “I never saw Allah’s Messenger ﷺ fast during the ten days.”' }
      ],
      refs:[{ name:'Ibn Baz · Fasting the first days of Dhul-Hijjah', arName:'ابن باز · ما حكم صيام عشر ذي الحجة؟', url:'https://binbaz.org.sa/fatwas/6684/ما-حكم-صيام-عشر-ذي-الحجة' }]
    },
    tashriq: {
      name:'Days of Tashriq', kind:'forbidden', ruling:'Do not fast',
      notes:[
        tashriqDays,
        'These are days of eating, drinking and remembering Allah. The general rule is to leave fasting on all three days.'
      ],
      sources:[tashriqHadith]
    },
    zakatFitr: {
      name:'Zakat al-Fitr', kind:'required', ruling:'Due before the Eid prayer',
      notes:[
        'Zakat al-Fitr is charity at the end of Ramadan. Give it to people in need before the Eid prayer. Ibn Umar’s report describes giving it a day or two early. The calendar shows that window and the morning of Eid.',
        'Ibn Baz allowed giving it up to three days before Eid. If someone is handling it for you, arrange it early enough for it to reach people by the deadline.'
      ],
      sources:[
        fitrDeadline,
        { name:'Sahih al-Bukhari 1511', url:'https://sunnah.com/bukhari:1511',
          arabic:'وَكَانُوا يُعْطُونَ قَبْلَ الْفِطْرِ بِيَوْمٍ أَوْ يَوْمَيْنِ',
          meaning:'They used to give it a day or two before Eid al-Fitr.' }
      ],
      refs:[{ name:'Ibn Baz · When to give Zakat al-Fitr', arName:'ابن باز · وقت إخراج زكاة الفطر',
        url:'https://binbaz.org.sa/fatwas/6040/وقت-اخراج-زكاة-الفطر' }]
    }
  };

  const tashriqAr = 'أيام التشريق هي الأيام الثلاثة التي تلي عيد الأضحى، من ١١ إلى ١٣ ذي الحجة. وسُمّيت بذلك لأن الناس كانوا يجففون فيها لحم الأضاحي في الشمس.';
  const arabicCopy = {
    ramadan:['صيام رمضان', 'صيام واجب', [
      'رمضان هو الشهر التاسع من السنة الهجرية، وفيه أُنزل القرآن. فرض الله صيامه لتحقيق التقوى. ومن أفطر لمرض أو سفر قضى العدد نفسه من الأيام.',
      'السحور هو الأكل قبل الفجر. أمسك عن الطعام والشراب عند طلوع الفجر الصادق، وأفطر عند غروب الشمس ودخول المغرب.',
      'رمضان تسعة وعشرون أو ثلاثون يوماً. التواريخ هنا تقديرية. اتبع الإعلان المحلي لمعرفة بداية الصيام ويوم العيد.'
    ]],
    white:['الأيام البيض', 'صيام مستحب', [
      'الأيام البيض هي الثالث عشر والرابع عشر والخامس عشر من الشهر الهجري، وسُمّيت لبياض لياليها بنور القمر. صيامها مستحب، ويجوز اختيار غيرها لتحصيل سنة صيام ثلاثة أيام من كل شهر.',
      tashriqAr,
      'الثالث عشر من ذي الحجة من الأيام البيض وهو آخر أيام التشريق، فلا تصمه. يمكنك صيام الرابع عشر والخامس عشر واختيار يوم آخر لإكمال الثلاثة. وفي رمضان تدخل الأيام البيض في الصيام الواجب.'
    ]],
    arafah:['يوم عرفة', 'صيام مستحب', [
      'التاسع من ذي الحجة هو يوم عرفة، ويُستحب صيامه لمن شهد هذا اليوم في بلده.',
      'يرى ابن عثيمين أن تصوم التاسع من ذي الحجة بحسب تاريخ بلدك. تواريخ التطبيق تقديرية، فارجع إلى إعلان الجهة التي تصوم معها.',
      'بيّن ابن باز أن التكفير المذكور في الحديث للصغائر، وأما الكبائر فتحتاج إلى توبة.'
    ]],
    ashura:['عاشوراء', 'صيام مستحب', [
      'عاشوراء هو العاشر من محرم. لما قدم النبي ﷺ المدينة أخبره اليهود أنهم يصومونه لأن الله نجّى بني إسرائيل فيه. فذكر النبي ﷺ أن المسلمين أحق بموسى وصام ذلك اليوم.',
      'صار صيام عاشوراء مستحباً بعد فرض رمضان. يُستحب صيام التاسع مع العاشر. وذكر ابن باز جواز صيام العاشر مع الحادي عشر أو صيام العاشر وحده.'
    ]],
    fitr:['عيد الفطر', 'يحرم الصيام', [
      'عيد الفطر هو الأول من شوال بعد رمضان. يحرم صيام يوم العيد. أخرج زكاة الفطر قبل صلاة العيد.',
      'كان النبي ﷺ يأكل تمرات وتراً قبل خروجه إلى الصلاة.'
    ]],
    adha:['عيد الأضحى', 'يحرم الصيام', [
      'عيد الأضحى هو العاشر من ذي الحجة. أخبر القرآن أن إبراهيم رأى في المنام أنه يذبح ابنه. فلما أسلما لأمر الله، فداه الله بذبح عظيم.',
      'يحرم صيام يوم العيد. وتبدأ أيام التشريق في اليوم التالي، الحادي عشر من ذي الحجة.'
    ]],
    qadr:['أواخر ليالي رمضان', 'تحرّي ليلة القدر', [
      'ليلة القدر خير من ألف شهر. أمر النبي ﷺ بتحرّيها في العشر الأواخر من رمضان. وأكّد ابن باز فضل الليالي الوترية، وبيّن ابن تيمية أن الوتر قد يُحسب أيضاً بحسب ما بقي من الشهر. ولهذا أوصى الشيخان بالاجتهاد في الليالي كلها.',
      'ابدأ من غروب شمس يوم العشرين من رمضان. وتنتهي آخر ليلة بفجر آخر يوم صيام. وأوصى ابن باز بالاعتكاف، وهو لزوم المسجد للتفرّغ للعبادة، ولا سيما في العشر الأواخر.',
      'سألت عائشة رضي الله عنها النبي ﷺ عمّا تقوله إن وافقت ليلة القدر، فعلّمها أن تسأل الله العفو.'
    ]],
    dhulFirst:['التسعة الأولى من ذي الحجة', 'صيام تطوّع', [
      'يُستحب الصيام في التسعة الأولى من ذي الحجة. صم ما تيسّر لك من أول الشهر إلى التاسع.',
      'ورد أنه ﷺ كان يصوم التسعة، وقالت عائشة إنها لم تره صائماً فيها. وأوصى ابن باز بالصيام استدلالاً بالحديث الوارد في فضل العمل الصالح في العشر.',
      'التاسع يوم عرفة، وقد ورد حديث خاص في فضل صيامه. والعاشر عيد الأضحى ويحرم صيامه.'
    ]],
    tashriq:['أيام التشريق', 'يحرم الصيام', [
      tashriqAr,
      'هي أيام أكل وشرب وذكر لله. والأصل ترك الصيام في الأيام الثلاثة كلها.'
    ]],
    zakatFitr:['زكاة الفطر', 'تُخرج قبل صلاة العيد', [
      'زكاة الفطر صدقة واجبة عند انتهاء رمضان، وتُعطى للمحتاجين قبل صلاة العيد. وجاء في حديث ابن عمر أنهم كانوا يعطونها قبل العيد بيوم أو يومين. يعرض التقويم هذين اليومين وصباح العيد.',
      'أجاز ابن باز إخراجها قبل العيد بثلاثة أيام أيضاً. وإذا وكّلت أحداً بإخراجها فرتّب ذلك مبكراً لتصل إلى مستحقيها قبل الموعد.'
    ]]
  };

  function occasion(id, language = 'en') {
    const entry = occasions[id];
    if (language !== 'ar') return entry;
    const [name, ruling, notes] = arabicCopy[id];
    return { ...entry, name, ruling, notes };
  }

  function parts(date) {
    if (!formatter || !Number.isFinite(+date)) return null;
    const fields = Object.fromEntries(formatter.formatToParts(date).map(part => [part.type, Number(part.value)]));
    return months[fields.month - 1] && Number.isFinite(fields.day) && Number.isFinite(fields.year) ? fields : null;
  }

  function label(key, language = 'en') {
    const hijri = parts(noon(key));
    if (language === 'ar' && hijri) return [hijri.day, arabicMonths[hijri.month - 1], hijri.year, 'هـ'].join(' ');
    return hijri ? `${hijri.day} ${months[hijri.month - 1]} ${hijri.year} AH` : '';
  }

  function periodLabel(from, to, language = 'en') {
    const start = label(from, language);
    if (!to || from === to) return start;
    const end = label(to, language);
    const first = parts(noon(from)), last = parts(noon(to));
    if (first && last && first.month === last.month && first.year === last.year) return `${first.day}–${end}`;
    return `${start} – ${end}`;
  }

  function upcoming(key) {
    const start = noon(key), today = parts(start);
    const dates = {}, fasts = {}, worship = {};
    if (!today) return { dates, fasts, worship };
    let whiteMonth;
    const rangeMonths = {};
    function addRange(group, id, date, hijri, first, last) {
      if (hijri.day < first || hijri.day > last) return;
      const period = `${hijri.year}-${hijri.month}`;
      rangeMonths[id] ??= period;
      if (rangeMonths[id] !== period) return;
      group[id] ??= { from:keyFor(new Date(+date - (hijri.day - first) * dayMs)) };
      group[id].to = keyFor(date);
    }
    for (let i = 0; i <= 370; i++) {
      const date = new Date(+start + i * dayMs), hijri = parts(date);
      if (!hijri) continue;
      const { month, day, year } = hijri;
      const from = keyFor(date);
      if (month === 9) {
        addRange(dates, 'ramadan', date, hijri, 1, 30);
        addRange(worship, 'qadr', date, hijri, 21, 30);
      }
      if (month === 10 && day === 1) {
        dates.fitr ??= { from };
        worship.zakatFitr ??= { from:keyFor(new Date(+date - 2 * dayMs)), to:from };
      }
      if (month === 12) {
        addRange(fasts, 'dhulFirst', date, hijri, 1, 9);
        addRange(worship, 'tashriq', date, hijri, 11, 13);
        if (day === 9) fasts.arafah ??= { from };
        if (day === 10) dates.adha ??= { from };
      }
      if (month === 1 && day === 10) fasts.ashura ??= i ? { from:keyFor(new Date(+date - dayMs)), to:from } : { from };
      if (day >= 13 && day <= 15 && month !== 9 && !(month === 12 && day === 13)) {
        whiteMonth ??= `${year}-${month}`;
        if (whiteMonth === `${year}-${month}`) {
          if (fasts.white) fasts.white.to = from;
          else fasts.white = { from };
        }
      }
    }
    return { dates, fasts, worship };
  }

  root.SalahHijri = { label, periodLabel, upcoming, occasions, occasion };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.SalahHijri;
})(typeof window !== 'undefined' ? window : globalThis);
