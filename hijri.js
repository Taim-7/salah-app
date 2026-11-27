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

  const tashriqDays = 'The Days of Tashriq are the three days after Eid al-Adha, from 11 to 13 Dhul-Hijjah, the month of Hajj. The name refers to the old practice of drying the meat from the sacrifice in the sun.';
  const tashriqHadith = {
    name:'Sahih Muslim 1141a–b', url:'https://sunnah.com/muslim:1141',
    arabic:'أَيَّامُ التَّشْرِيقِ أَيَّامُ أَكْلٍ وَشُرْبٍ … وَذِكْرٍ لِلَّهِ',
    meaning:'The days of Tashriq are days of eating, drinking … and remembering Allah.'
  };
  const tashriqException = {
    name:'Sahih al-Bukhari 1997–98', url:'https://sunnah.com/bukhari:1997',
    arabic:'لَمْ يُرَخَّصْ فِي أَيَّامِ التَّشْرِيقِ أَنْ يُصَمْنَ، إِلَّا لِمَنْ لَمْ يَجِدِ الْهَدْيَ',
    meaning:'Permission to fast during the days of Tashriq was given only to those who could not obtain the Hajj sacrificial animal.'
  };
  const shawwalHadith = {
    name:'Sahih Muslim 1164a', url:'https://sunnah.com/muslim:1164a',
    arabic:'مَنْ صَامَ رَمَضَانَ ثُمَّ أَتْبَعَهُ سِتًّا مِنْ شَوَّالٍ كَانَ كَصِيَامِ الدَّهْرِ',
    meaning:'Whoever fasts Ramadan and follows it with six days of Shawwal is as though they fasted the whole year.'
  };

  const occasions = {
    ramadan: {
      name:'First fast of Ramadan', kind:'required', ruling:'Obligatory fast',
      notes:[
        'Ramadan is the ninth Hijri month, when the Qur’an was revealed. Allah prescribed fasting to help believers grow in taqwa, or mindfulness of Him. Those who miss days because of illness or travel make up the same number later.',
        'Suhur is the meal before dawn. Finish eating and drinking by true dawn, when Fajr begins. Break the fast at sunset, when Maghrib begins. Confirm the first day of Ramadan and Eid with your local announcement.'
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
          meaning:'Begin fasting when you see it, and end the fast when you see it. If it is obscured from you, complete thirty days of Sha’ban.' },
        { name:'Sahih al-Bukhari 1923', url:'https://sunnah.com/bukhari:1923',
          arabic:'تَسَحَّرُوا فَإِنَّ فِي السَّحُورِ بَرَكَةً',
          meaning:'Eat suhur, for there is blessing in suhur.' }
      ]
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
        tashriqHadith, tashriqException
      ]
    },
    arafah: {
      name:'Day of Arafah', kind:'sunnah', ruling:'Sunnah fast outside Hajj',
      notes:[
        'On 9 Dhul-Hijjah, pilgrims gather for worship at Arafah, a plain near Makkah, then travel to Muzdalifah. If you are at home or otherwise away from Hajj, fasting that day is recommended. Pilgrims at Arafah generally keep their strength for worship by leaving the fast.',
        'Follow the Dhul-Hijjah announcement of the community you fast with. Its date can differ from Makkah’s.'
      ],
      sources:[
        { name:'Qur’an 2:198', url:'https://quran.com/2/198',
          arabic:'فَإِذَا أَفَضْتُمْ مِنْ عَرَفَاتٍ فَاذْكُرُوا اللَّهَ عِنْدَ الْمَشْعَرِ الْحَرَامِ',
          meaning:'When you depart from Arafat, remember Allah at the Sacred Landmark.' },
        { name:'Sahih Muslim 1162a', url:'https://sunnah.com/muslim:1162a',
          arabic:'صِيَامُ يَوْمِ عَرَفَةَ أَحْتَسِبُ عَلَى اللَّهِ أَنْ يُكَفِّرَ السَّنَةَ الَّتِي قَبْلَهُ وَالسَّنَةَ الَّتِي بَعْدَهُ',
          meaning:'For fasting the Day of Arafah, I hope for Allah to expiate the sins of the year before it and the year after it.' },
        { name:'Sahih Muslim 1348', url:'https://sunnah.com/muslim:1348',
          arabic:'مَا مِنْ يَوْمٍ أَكْثَرَ مِنْ أَنْ يُعْتِقَ اللَّهُ فِيهِ عَبْدًا مِنَ النَّارِ مِنْ يَوْمِ عَرَفَةَ',
          meaning:'There is no day on which Allah frees more servants from the Fire than the Day of Arafah.' },
        { name:'Sahih al-Bukhari 1661', url:'https://sunnah.com/bukhari:1661',
          arabic:'عَنْ أُمِّ الْفَضْلِ بِنْتِ الْحَارِثِ … فَأَرْسَلَتْ إِلَيْهِ بِقَدَحِ لَبَنٍ وَهُوَ وَاقِفٌ عَلَى بَعِيرِهِ فَشَرِبَهُ',
          meaning:'From Umm al-Fadl bint al-Harith … She sent him a cup of milk while he was on his camel, and he drank it.' }
      ]
    },
    ashura: {
      name:'Ashura', kind:'sunnah', ruling:'Sunnah fast',
      notes:[
        'Ashura is 10 Muharram. When the Prophet ﷺ came to Madinah, the Jews there told him they fasted because Allah had rescued the Children of Israel. The Prophet ﷺ said the Muslims had more right to Musa and fasted that day.',
        'Fasting Ashura became optional when Ramadan became obligatory. It is recommended to fast the 9th along with the 10th. If you miss the 9th, you can still fast Ashura on the 10th.'
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
          meaning:'For fasting the Day of Ashura, I hope for Allah to expiate the sins of the year before it.' },
        { name:'Sahih Muslim 1134a', url:'https://sunnah.com/muslim:1134a',
          arabic:'فَإِذَا كَانَ الْعَامُ الْمُقْبِلُ إِنْ شَاءَ اللَّهُ صُمْنَا الْيَوْمَ التَّاسِعَ',
          meaning:'If next year comes, Allah willing, we will fast the ninth day.' }
      ]
    },
    fitr: {
      name:'Eid al-Fitr', kind:'forbidden', ruling:'Do not fast',
      notes:[
        'Eid al-Fitr is on 1 Shawwal, the month after Ramadan. Fasting on Eid itself is forbidden. Give Zakat al-Fitr, the charity due at the end of Ramadan, before the Eid prayer. The Prophet ﷺ ate an odd number of dates before going out to pray.',
        'The six optional fasts of Shawwal can start the day after Eid. Choose six days before Shawwal ends, either in a row or with gaps between them.'
      ],
      sources:[
        { name:'Qur’an 2:185', url:'https://quran.com/2/185',
          arabic:'وَلِتُكْمِلُوا الْعِدَّةَ وَلِتُكَبِّرُوا اللَّهَ عَلَىٰ مَا هَدَاكُمْ وَلَعَلَّكُمْ تَشْكُرُونَ',
          meaning:'So that you complete the number of days, glorify Allah for guiding you, and may be grateful.' },
        { name:'Sahih Muslim 1137', url:'https://sunnah.com/muslim:1137',
          arabic:'إِنَّ هَذَيْنِ يَوْمَانِ نَهَى رَسُولُ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ عَنْ صِيَامِهِمَا',
          meaning:'These are two days on which Allah’s Messenger ﷺ forbade fasting.' },
        { name:'Abu Dawud 1134 (sahih, al-Albani)', url:'https://sunnah.com/abudawud:1134',
          arabic:'إِنَّ اللَّهَ قَدْ أَبْدَلَكُمْ بِهِمَا خَيْرًا مِنْهُمَا يَوْمَ الْأَضْحَى وَيَوْمَ الْفِطْرِ',
          meaning:'Allah has given you two better days in their place, the Day of Sacrifice and the Day of Breaking the Fast.' },
        { name:'Sahih al-Bukhari 1509', url:'https://sunnah.com/bukhari:1509',
          arabic:'أَمَرَ بِزَكَاةِ الْفِطْرِ قَبْلَ خُرُوجِ النَّاسِ إِلَى الصَّلَاةِ',
          meaning:'He ordered that Zakat al-Fitr be given before people went out to the prayer.' },
        { name:'Sahih al-Bukhari 953', url:'https://sunnah.com/bukhari:953',
          arabic:'كَانَ رَسُولُ اللَّهِ صلى الله عليه وسلم لَا يَغْدُو يَوْمَ الْفِطْرِ حَتَّى يَأْكُلَ تَمَرَاتٍ … وَيَأْكُلُهُنَّ وِتْرًا',
          meaning:'Allah’s Messenger ﷺ would not go out on Eid al-Fitr until he had eaten some dates … and he would eat an odd number.' },
        shawwalHadith
      ]
    },
    shawwal: {
      name:'Six days of Shawwal', kind:'sunnah', ruling:'Sunnah · Choose six days',
      notes:[
        'Shawwal is the month after Ramadan. Fasting six days in Shawwal is optional and recommended. Start from the day after Eid al-Fitr and finish before Shawwal ends. The dates shown are the whole period you can choose from.',
        'You can fast six days in a row or leave gaps and count any six days across the month. If you owe Ramadan fasts, Ibn Baz advised making those up before starting the six.'
      ],
      sources:[
        shawwalHadith,
        { name:'Ibn Baz on choosing the six days', url:'https://binbaz.org.sa/fatwas/15599/وقت-صيام-الست-من-شوال',
          arabic:'الْأَفْضَلُ الْبِدَارُ بِهَا قَبْلَ الْعَوَائِقِ، سَوَاءٌ مُتَتَابِعَةً، أَوْ مُفَرَّقَةً',
          meaning:'It is better to start them before obstacles arise, whether you fast them consecutively or spread them out.' },
        { name:'Ibn Baz on missed Ramadan fasts', url:'https://binbaz.org.sa/fatwas/12676/المشروع-ان-يبدا-بقضاء-رمضان-قبل-صيام-الست',
          arabic:'وَلِأَنَّ الْفَرْضَ أَهَمُّ فَكَانَ أَوْلَى بِالتَّقْدِيمِ',
          meaning:'The obligatory act carries more weight, so it deserves to come first.' }
      ]
    },
    adha: {
      name:'Eid al-Adha', kind:'forbidden', ruling:'Do not fast',
      notes:[
        'Eid al-Adha is the festival of sacrifice on 10 Dhul-Hijjah. The Qur’an tells how Ibrahim saw in a dream that he was to sacrifice his son. When they both submitted to Allah, Allah spared the son and provided a sacrifice in his place.',
        'Those offering udhiyah, the Eid sacrifice, start after the Eid prayer. Fasting is forbidden on Eid itself.',
        tashriqDays,
        'Spend the three days after Eid eating, drinking and remembering Allah. Skip fasting on those days. The exception is for a Hajj pilgrim who cannot provide the required Hajj sacrifice.'
      ],
      sources:[
        { name:'Qur’an 37:107', url:'https://quran.com/37/107',
          arabic:'وَفَدَيْنَاهُ بِذِبْحٍ عَظِيمٍ',
          meaning:'We ransomed him with a great sacrifice.' },
        { name:'Qur’an 22:36–37', url:'https://quran.com/22/36-37',
          arabic:'فَكُلُوا مِنْهَا وَأَطْعِمُوا الْقَانِعَ وَالْمُعْتَرَّ … لَنْ يَنَالَ اللَّهَ لُحُومُهَا وَلَا دِمَاؤُهَا وَلَٰكِنْ يَنَالُهُ التَّقْوَىٰ مِنْكُمْ',
          meaning:'Eat from them and feed the needy, those who refrain from asking and those who ask … Their meat and blood do not reach Allah, but your taqwa reaches Him.' },
        { name:'Sahih al-Bukhari 5560', url:'https://sunnah.com/bukhari:5560',
          arabic:'إِنَّ أَوَّلَ مَا نَبْدَأُ مِنْ يَوْمِنَا هَذَا أَنْ نُصَلِّيَ، ثُمَّ نَرْجِعَ فَنَنْحَرَ',
          meaning:'The first thing we do on this day is pray, then we return and offer the sacrifice.' },
        { name:'Sahih al-Bukhari 1991–92', url:'https://sunnah.com/bukhari:1991',
          arabic:'نَهَى النَّبِيُّ صلى الله عليه وسلم عَنْ صَوْمِ يَوْمِ الْفِطْرِ وَالنَّحْرِ',
          meaning:'The Prophet ﷺ forbade fasting on the Day of Breaking the Fast and the Day of Sacrifice.' },
        tashriqHadith, tashriqException
      ]
    },
    qadr: {
      name:'Last nights of Ramadan', kind:'worship', ruling:'Seek Laylat al-Qadr',
      notes:[
        'Seek Laylat al-Qadr during the last ten nights of Ramadan. Its worship is better than a thousand months. The Prophet ﷺ urged people to look for it in the odd nights. Ibn Baz advised striving on all the final nights, with particular attention to the odd ones.',
        'Night 21 starts at sunset before the daytime of 21 Ramadan. Each row date refers to the daytime the night leads into. The month can end after day 29 or day 30.',
        'Aishah asked what to say if she found Laylat al-Qadr. The Prophet ﷺ taught her to ask Allah for pardon.'
      ],
      sources:[
        { name:'Qur’an 97:3', url:'https://quran.com/97/3',
          arabic:'لَيْلَةُ الْقَدْرِ خَيْرٌ مِنْ أَلْفِ شَهْرٍ',
          meaning:'The Night of Decree is better than a thousand months.' },
        { name:'Sahih al-Bukhari 2017', url:'https://sunnah.com/bukhari:2017',
          arabic:'تَحَرَّوْا لَيْلَةَ الْقَدْرِ فِي الْوِتْرِ مِنَ الْعَشْرِ الْأَوَاخِرِ مِنْ رَمَضَانَ',
          meaning:'Seek Laylat al-Qadr in the odd nights of the last ten nights of Ramadan.' },
        { name:'Al-Tirmidhi 3513', url:'https://sunnah.com/tirmidhi:3513',
          arabic:'اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي',
          meaning:'O Allah, You pardon and love to pardon, so pardon me.' }
      ],
      refs:[{ name:'Ibn Baz · Laylat al-Qadr', arName:'ابن باز · علامة ليلة القدر', url:'https://binbaz.org.sa/fatwas/12989/%D8%B9%D9%84%D8%A7%D9%85%D8%A9-%D9%84%D9%8A%D9%84%D8%A9-%D8%A7%D9%84%D9%82%D8%AF%D8%B1' }]
    },
    dhulFirst: {
      name:'First nine days of Dhul-Hijjah', kind:'sunnah', ruling:'Optional fasting',
      notes:[
        'The first ten days of Dhul-Hijjah are a time to increase good deeds. Ibn Baz includes fasting among the good deeds you can do in the first nine days. Choose whichever of those days you can fast.',
        'One report describes the Prophet ﷺ fasting the nine days. Aishah said she never saw him fast during the first ten. Ibn Baz noted a problem in the transmission of the first report and held that fasting is still recommended because of the authentic report on doing good deeds in these days.',
        'Day 9 is Arafah, which has its own evidence for fasting by those outside Hajj. Day 10 is Eid al-Adha and fasting on it is forbidden.'
      ],
      sources:[
        { name:'Sahih al-Bukhari 969', url:'https://sunnah.com/bukhari:969',
          arabic:'مَا الْعَمَلُ فِي أَيَّامٍ أَفْضَلَ مِنْهَا فِي هَذِهِ',
          meaning:'Deeds done on other days are no better than those done on these days.' },
        { name:'Abu Dawud 2437', url:'https://sunnah.com/abudawud:2437',
          arabic:'كَانَ رَسُولُ اللَّهِ ﷺ يَصُومُ تِسْعَ ذِي الْحِجَّةِ',
          meaning:'The Messenger of Allah ﷺ used to fast the first nine days of Dhul-Hijjah.' },
        { name:'Sahih Muslim 1176a', url:'https://sunnah.com/muslim:1176a',
          arabic:'عَنْ عَائِشَةَ قَالَتْ: مَا رَأَيْتُ رَسُولَ اللَّهِ ﷺ صَائِمًا فِي الْعَشْرِ قَطُّ',
          meaning:'Aishah said, “I never saw Allah’s Messenger ﷺ fast during the ten days.”' }
      ],
      refs:[{ name:'Ibn Baz · Fasting Muharram, Sha’ban and Dhul-Hijjah', arName:'ابن باز · صيام محرم وشعبان وعشر ذي الحجة', url:'https://binbaz.org.sa/fatwas/12787/%D8%AD%D9%83%D9%85-%D8%B5%D9%8A%D8%A7%D9%85-%D9%85%D8%AD%D8%B1%D9%85-%D9%88%D8%B4%D8%B9%D8%A8%D8%A7%D9%86-%D9%88%D8%B9%D8%B4%D8%B1-%D8%B0%D9%8A-%D8%A7%D9%84%D8%AD%D8%AC%D8%A9' },
        { name:'Ibn Baz · The reports on fasting the first days', arName:'ابن باز · ما حكم صيام عشر ذي الحجة؟', url:'https://binbaz.org.sa/fatwas/6684/%D9%85%D8%A7-%D8%AD%D9%83%D9%85-%D8%B5%D9%8A%D8%A7%D9%85-%D8%B9%D8%B4%D8%B1-%D8%B0%D9%8A-%D8%A7%D9%84%D8%AD%D8%AC%D8%A9' }]
    },
    tashriq: {
      name:'Days of Tashriq', kind:'forbidden', ruling:'Do not fast',
      notes:[
        tashriqDays,
        'These are days of eating, drinking and remembering Allah. The exception to the ban on fasting is for a Hajj pilgrim who cannot provide the required Hajj sacrifice.'
      ],
      sources:[tashriqHadith, tashriqException]
    },
    muharram: {
      name:'Fasting in Muharram', kind:'sunnah', ruling:'Optional fasting',
      notes:[
        'The Prophet ﷺ recommended Muharram for voluntary fasting. Choose days that suit you. The 10th is Ashura, with its own evidence and the recommendation to fast the 9th with it.'
      ],
      sources:[
        { name:'Sahih Muslim 1163a', url:'https://sunnah.com/muslim:1163a',
          arabic:'أَفْضَلُ الصِّيَامِ بَعْدَ رَمَضَانَ شَهْرُ اللَّهِ الْمُحَرَّمُ',
          meaning:'The best fasting after Ramadan is in Allah’s month of Muharram.' }
      ],
      refs:[{ name:'Ibn Baz · Fasting in Muharram', arName:'ابن باز · صيام شهر محرم', url:'https://binbaz.org.sa/fatwas/12787/%D8%AD%D9%83%D9%85-%D8%B5%D9%8A%D8%A7%D9%85-%D9%85%D8%AD%D8%B1%D9%85-%D9%88%D8%B4%D8%B9%D8%A8%D8%A7%D9%86-%D9%88%D8%B9%D8%B4%D8%B1-%D8%B0%D9%8A-%D8%A7%D9%84%D8%AD%D8%AC%D8%A9' }]
    },
    shaban: {
      name:'Fasting in Sha’ban', kind:'sunnah', ruling:'Optional fasting',
      notes:[
        'Aishah reported that the Prophet ﷺ fasted more in Sha’ban than in the other months outside Ramadan. Ibn Baz advises fasting in Sha’ban without singling out the middle of the month for a special fast.',
        'The hadith about the approach of Ramadan gives an exception for a person who is already following their usual fast. Ibn Baz also accepted the report about the middle of Sha’ban and advised against starting a new voluntary fast after the middle if you were neither fasting earlier nor following a habit.'
      ],
      sources:[
        { name:'Sahih al-Bukhari 1969', url:'https://sunnah.com/bukhari:1969',
          arabic:'وَمَا رَأَيْتُهُ أَكْثَرَ صِيَامًا مِنْهُ فِي شَعْبَانَ',
          meaning:'I did not see him fast more in any month than he did in Sha’ban.' },
        { name:'Sahih al-Bukhari 1914', url:'https://sunnah.com/bukhari:1914',
          arabic:'لَا يَتَقَدَّمَنَّ أَحَدُكُمْ رَمَضَانَ بِصَوْمِ يَوْمٍ أَوْ يَوْمَيْنِ، إِلَّا أَنْ يَكُونَ رَجُلٌ كَانَ يَصُومُ صَوْمَهُ فَلْيَصُمْ ذَلِكَ الْيَوْمَ',
          meaning:'Do not fast a day or two just before Ramadan. Someone who normally fasts on that day may keep their fast.' }
      ],
      refs:[{ name:'Ibn Baz · Singling out mid-Sha’ban', arName:'ابن باز · حكم تخصيص النصف من شعبان', url:'https://binbaz.org.sa/fatwas/3103/%D8%AD%D9%83%D9%85-%D8%AA%D8%AE%D8%B5%D9%8A%D8%B5-%D9%84%D9%8A%D9%84%D8%A9-%D8%A7%D9%84%D9%86%D8%B5%D9%81-%D9%85%D9%86-%D8%B4%D8%B9%D8%A8%D8%A7%D9%86-%D9%88%D9%8A%D9%88%D9%85%D9%87%D8%A7-%D8%A8%D8%A7%D9%84%D8%B5%D9%8A%D8%A7%D9%85-%D9%88%D8%A7%D9%84%D9%82%D9%8A%D8%A7%D9%85' },
        { name:'Ibn Baz · Fasting after the middle of Sha’ban', arName:'ابن باز · صيام ما بعد نصف شعبان', url:'https://binbaz.org.sa/fatwas/31508/%D9%85%D8%A7-%D8%B5%D8%AD%D8%A9-%D8%AD%D8%AF%D9%8A%D8%AB-%D8%A7%D8%B0%D8%A7-%D8%A7%D9%86%D8%AA%D8%B5%D9%81-%D8%B4%D8%B9%D8%A8%D8%A7%D9%86-%D9%81%D9%84%D8%A7-%D8%AA%D8%B5%D9%88%D9%85%D9%88%D8%A7' }]
    }
  };

  const tashriqAr = 'أيام التشريق هي الأيام الثلاثة التي تلي عيد الأضحى، من ١١ إلى ١٣ ذي الحجة. وسُمّيت بذلك لأن الناس كانوا يجففون فيها لحم الأضاحي في الشمس.';
  const arabicCopy = {
    ramadan:['أول صيام رمضان', 'صيام واجب', [
      'رمضان هو الشهر التاسع من السنة الهجرية، وفيه أُنزل القرآن. فرض الله صيامه لتحقيق التقوى. ومن أفطر لمرض أو سفر قضى العدد نفسه من الأيام.',
      'السحور هو الأكل قبل الفجر. أمسك عن الطعام والشراب عند طلوع الفجر الصادق، وأفطر عند غروب الشمس ودخول المغرب. ارجع إلى إعلان رؤية الهلال في منطقتك لمعرفة أول رمضان والعيد.'
    ]],
    white:['الأيام البيض', 'صيام مستحب', [
      'الأيام البيض هي الثالث عشر والرابع عشر والخامس عشر من الشهر الهجري، وسُمّيت لبياض لياليها بنور القمر. صيامها مستحب، ويجوز اختيار غيرها لتحصيل سنة صيام ثلاثة أيام من كل شهر.',
      tashriqAr,
      'الثالث عشر من ذي الحجة من الأيام البيض وهو آخر أيام التشريق، فلا تصمه. يمكنك صيام الرابع عشر والخامس عشر واختيار يوم آخر لإكمال الثلاثة. وفي رمضان تدخل الأيام البيض في الصيام الواجب.'
    ]],
    arafah:['يوم عرفة', 'صيام مستحب لغير الحاج', [
      'في التاسع من ذي الحجة يقف الحجاج بعرفة قرب مكة ثم يدفعون إلى مزدلفة. يُستحب صيام عرفة لغير الحاج. والسنة للحاج الواقف بعرفة أن يفطر ليتقوّى على العبادة.',
      'اتبع إعلان دخول ذي الحجة في البلد الذي تصوم معه. وقد يختلف تاريخ دخول الشهر عن مكة.'
    ]],
    ashura:['عاشوراء', 'صيام مستحب', [
      'عاشوراء هو العاشر من محرم. لما قدم النبي ﷺ المدينة أخبره اليهود أنهم يصومونه لأن الله نجّى بني إسرائيل فيه. فذكر النبي ﷺ أن المسلمين أحق بموسى وصام ذلك اليوم.',
      'صار صيام عاشوراء مستحباً بعد فرض رمضان. يُستحب صيام التاسع مع العاشر، ومن فاته التاسع فله صيام العاشر.'
    ]],
    fitr:['عيد الفطر', 'يحرم الصيام', [
      'عيد الفطر هو الأول من شوال بعد رمضان. يحرم صيام يوم العيد. أخرج زكاة الفطر قبل صلاة العيد. وكان النبي ﷺ يأكل تمرات وتراً قبل خروجه إلى الصلاة.',
      'يمكن صيام ستة أيام من شوال بدءاً من اليوم التالي للعيد. صمها متتابعة أو متفرقة قبل انتهاء الشهر.'
    ]],
    shawwal:['ستة أيام من شوال', 'مستحب · اختر ستة أيام', [
      'شوال هو الشهر الذي يلي رمضان. يُستحب صوم ستة أيام منه بعد عيد الفطر وقبل نهاية الشهر. والتواريخ المعروضة هي المدة التي تختار منها الأيام.',
      'يجوز صيام الست متتابعة أو متفرقة. ويرى ابن باز تقديم قضاء ما فات من رمضان على صيام الست.'
    ]],
    adha:['عيد الأضحى', 'يحرم الصيام', [
      'عيد الأضحى هو العاشر من ذي الحجة. أخبر القرآن أن إبراهيم رأى في المنام أنه يذبح ابنه. فلما أسلما لأمر الله، فداه الله بذبح عظيم.',
      'يبدأ وقت الأضحية بعد صلاة العيد، ويحرم صيام يوم العيد.',
      tashriqAr,
      'أيام التشريق أيام أكل وشرب وذكر لله. لا تُصام إلا للحاج الذي لم يجد الهدي.'
    ]],
    qadr:['أواخر ليالي رمضان', 'تحرّي ليلة القدر', [
      'تحرَّ ليلة القدر في العشر الأواخر من رمضان. وهي خير من ألف شهر. أرشد النبي ﷺ إلى تحرّيها في الليالي الوترية. وبيّن ابن باز أن الاجتهاد مشروع في جميع الليالي الأخيرة، والأوتار آكد.',
      'تبدأ ليلة الحادي والعشرين من مغرب اليوم الذي يسبق نهار الحادي والعشرين. والتواريخ المعروضة هي تواريخ النهار التالي لكل ليلة. وقد يكون الشهر تسعة وعشرين أو ثلاثين يوماً.',
      'سألت عائشة رضي الله عنها النبي ﷺ عمّا تقوله إن وافقت ليلة القدر، فعلّمها أن تسأل الله العفو.'
    ]],
    dhulFirst:['التسعة الأولى من ذي الحجة', 'صيام تطوّع', [
      'تُستحب كثرة العمل الصالح في عشر ذي الحجة. وذكر ابن باز أن صيام التسعة الأولى منها من العمل الصالح. صم منها ما تيسّر لك.',
      'ورد أنه ﷺ كان يصوم التسعة، وقالت عائشة إنها لم تره صائماً في العشر. وذكر ابن باز اضطراباً في سند الرواية الأولى، ورأى استحباب الصيام لثبوت فضل العمل الصالح في هذه الأيام.',
      'التاسع يوم عرفة، وقد ورد دليل خاص على فضيلة صيامه لغير الحاج. والعاشر عيد الأضحى ويحرم صيامه.'
    ]],
    tashriq:['أيام التشريق', 'يحرم الصيام', [
      tashriqAr,
      'هي أيام أكل وشرب وذكر لله. ويُستثنى من النهي عن صيامها الحاج الذي لم يجد الهدي.'
    ]],
    muharram:['الصيام في محرم', 'صيام تطوّع', [
      'رغّب النبي ﷺ في صيام التطوع في شهر محرم. صم منه ما تيسّر لك. والعاشر عاشوراء، وقد ورد فيه دليل خاص ويُستحب صيام التاسع معه.'
    ]],
    shaban:['الصيام في شعبان', 'صيام تطوّع', [
      'أخبرت عائشة رضي الله عنها أن النبي ﷺ كان يكثر الصيام في شعبان. ورغّب ابن باز في الصيام فيه من غير تخصيص النصف منه بصيام.',
      'من وافق صيامه المعتاد يوماً أو يومين قبل رمضان جاز له صيامه، كما جاء في الحديث. وصحّح ابن باز حديث النهي عن الصيام بعد النصف، فنهى عن ابتداء التطوع بعده لمن لم يصم قبل النصف ولم تكن له عادة.'
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

  function upcoming(key) {
    const start = noon(key), today = parts(start);
    const dates = {}, fasts = {}, worship = {};
    if (!today) return { dates, fasts, worship };
    if (today.month === 9) dates.ramadan = { from:keyFor(new Date(+start - (today.day - 1) * dayMs)) };
    let whiteMonth, shawwalYear;
    const rangeYears = {};
    function addRange(group, id, date, hijri, first, last) {
      if (hijri.day < first || hijri.day > last) return;
      rangeYears[id] ??= hijri.year;
      if (hijri.year !== rangeYears[id]) return;
      group[id] ??= { from:keyFor(new Date(+date - (hijri.day - first) * dayMs)) };
      group[id].to = keyFor(date);
    }
    for (let i = 0; i <= 370; i++) {
      const date = new Date(+start + i * dayMs), hijri = parts(date);
      if (!hijri) continue;
      const { month, day, year } = hijri;
      const from = keyFor(date);
      if (month === 1) addRange(fasts, 'muharram', date, hijri, 1, 30);
      if (month === 8) addRange(fasts, 'shaban', date, hijri, 1, 30);
      if (month === 9) addRange(worship, 'qadr', date, hijri, 21, 30);
      if (month === 12) {
        addRange(fasts, 'dhulFirst', date, hijri, 1, 9);
        addRange(worship, 'tashriq', date, hijri, 11, 13);
      }
      if (month === 9 && day === 1) dates.ramadan ??= { from };
      if (month === 10 && day === 1) dates.fitr ??= { from };
      if (month === 10 && day >= 2) {
        shawwalYear ??= year;
        if (year === shawwalYear) {
          fasts.shawwal ??= { from:keyFor(new Date(+date - (day - 2) * dayMs)) };
          fasts.shawwal.to = from;
        }
      }
      if (month === 12 && day === 10) dates.adha ??= { from };
      if (month === 12 && day === 9) fasts.arafah ??= { from };
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

  root.SalahHijri = { label, upcoming, occasions, occasion };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.SalahHijri;
})(typeof window !== 'undefined' ? window : globalThis);
