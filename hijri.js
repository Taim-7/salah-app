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
  const shawwalHadith = {
    name:'Sahih Muslim 1164a', url:'https://sunnah.com/muslim:1164a',
    arabic:'مَنْ صَامَ رَمَضَانَ ثُمَّ أَتْبَعَهُ سِتًّا مِنْ شَوَّالٍ كَانَ كَصِيَامِ الدَّهْرِ',
    meaning:'Whoever fasts Ramadan and follows it with six days of Shawwal is as though they fasted the whole year.'
  };
  const fitrDeadline = {
    name:'Sahih al-Bukhari 1509', url:'https://sunnah.com/bukhari:1509',
    arabic:'أَمَرَ بِزَكَاةِ الْفِطْرِ قَبْلَ خُرُوجِ النَّاسِ إِلَى الصَّلَاةِ',
    meaning:'He ordered that Zakat al-Fitr be given before people went out to the prayer.'
  };
  const sacrificeHadith = {
    name:'Sahih al-Bukhari 5560', url:'https://sunnah.com/bukhari:5560',
    arabic:'إِنَّ أَوَّلَ مَا نَبْدَأُ مِنْ يَوْمِنَا هَذَا أَنْ نُصَلِّيَ، ثُمَّ نَرْجِعَ فَنَنْحَرَ',
    meaning:'The first thing we do on this day is pray, then we return and offer the sacrifice.'
  };
  const eidTakbir = {
    name:'Ibn Baz · When to say the Eid takbir', arName:'ابن باز · أوقات التكبير في العيدين',
    url:'https://binbaz.org.sa/fatwas/11941/اوقات-التكبير-وعدد-التكبيرات-في-صلاة-العيدين'
  };
  const sacrificeTiming = {
    name:'Ibn ‘Uthaymin · Time of the Eid sacrifice', arName:'ابن عثيمين · وقت الأضحية',
    url:'https://old.binothaimeen.net/content/954'
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
        'Eid al-Fitr is on 1 Shawwal, the month after Ramadan. Fasting on Eid itself is forbidden. Give Zakat al-Fitr, the charity due at the end of Ramadan, before the Eid prayer. The Prophet ﷺ ate an odd number of dates before going out to pray.',
        'Ibn Baz taught that saying the takbir, such as Allahu akbar, is recommended from sunset when Eid begins through the Eid sermon.',
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
        fitrDeadline,
        { name:'Sahih al-Bukhari 953', url:'https://sunnah.com/bukhari:953',
          arabic:'كَانَ رَسُولُ اللَّهِ صلى الله عليه وسلم لَا يَغْدُو يَوْمَ الْفِطْرِ حَتَّى يَأْكُلَ تَمَرَاتٍ … وَيَأْكُلُهُنَّ وِتْرًا',
          meaning:'Allah’s Messenger ﷺ would not go out on Eid al-Fitr until he had eaten some dates … and he would eat an odd number.' },
        shawwalHadith
      ],
      refs:[eidTakbir]
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
        'Fasting is forbidden on Eid. Ibn ‘Uthaymin said the time to offer udhiyah, the Eid sacrifice, runs from after the Eid prayer until sunset on 13 Dhul-Hijjah.',
        tashriqDays,
        'Spend the three days after Eid eating, drinking and remembering Allah. The general rule is to leave fasting on those days.'
      ],
      sources:[
        { name:'Qur’an 37:107', url:'https://quran.com/37/107',
          arabic:'وَفَدَيْنَاهُ بِذِبْحٍ عَظِيمٍ',
          meaning:'We ransomed him with a great sacrifice.' },
        { name:'Qur’an 22:36–37', url:'https://quran.com/22/36-37',
          arabic:'فَكُلُوا مِنْهَا وَأَطْعِمُوا الْقَانِعَ وَالْمُعْتَرَّ … لَنْ يَنَالَ اللَّهَ لُحُومُهَا وَلَا دِمَاؤُهَا وَلَٰكِنْ يَنَالُهُ التَّقْوَىٰ مِنْكُمْ',
          meaning:'Eat from them and feed the needy, those who refrain from asking and those who ask … Their meat and blood do not reach Allah, but your taqwa reaches Him.' },
        sacrificeHadith,
        { name:'Sahih al-Bukhari 1991–92', url:'https://sunnah.com/bukhari:1991',
          arabic:'نَهَى النَّبِيُّ صلى الله عليه وسلم عَنْ صَوْمِ يَوْمِ الْفِطْرِ وَالنَّحْرِ',
          meaning:'The Prophet ﷺ forbade fasting on the Day of Breaking the Fast and the Day of Sacrifice.' },
        tashriqHadith
      ],
      refs:[sacrificeTiming]
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
        'The first ten days of Dhul-Hijjah are a time to increase good deeds. Ibn Baz includes fasting among the good deeds you can do in the first nine days. Choose whichever of those days you can fast.',
        'One report describes the Prophet ﷺ fasting the nine days. Aishah said she never saw him fast during the first ten. Ibn Baz noted a problem in the transmission of the first report and held that fasting is still recommended because of the authentic report on doing good deeds in these days.',
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
      refs:[{ name:'Ibn Baz · Fasting Muharram, Sha’ban and Dhul-Hijjah', arName:'ابن باز · صيام محرم وشعبان وعشر ذي الحجة', url:'https://binbaz.org.sa/fatwas/12787/%D8%AD%D9%83%D9%85-%D8%B5%D9%8A%D8%A7%D9%85-%D9%85%D8%AD%D8%B1%D9%85-%D9%88%D8%B4%D8%B9%D8%A8%D8%A7%D9%86-%D9%88%D8%B9%D8%B4%D8%B1-%D8%B0%D9%8A-%D8%A7%D9%84%D8%AD%D8%AC%D8%A9' },
        { name:'Ibn Baz · The reports on fasting the first days', arName:'ابن باز · ما حكم صيام عشر ذي الحجة؟', url:'https://binbaz.org.sa/fatwas/6684/%D9%85%D8%A7-%D8%AD%D9%83%D9%85-%D8%B5%D9%8A%D8%A7%D9%85-%D8%B9%D8%B4%D8%B1-%D8%B0%D9%8A-%D8%A7%D9%84%D8%AD%D8%AC%D8%A9' }]
    },
    tashriq: {
      name:'Days of Tashriq', kind:'forbidden', ruling:'Do not fast',
      notes:[
        tashriqDays,
        'These are days of eating, drinking and remembering Allah. The general rule is to leave fasting on all three days.'
      ],
      sources:[tashriqHadith]
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
        'Do not start an optional fast a day or two before Ramadan. You can keep a fast that falls on a day you normally fast. If people are unsure whether the next day is Ramadan, wait for the announcement before starting the Ramadan fast.',
        'Ibn Baz accepted a report about the second half of Sha’ban. He advised against starting optional fasting after the halfway point unless you had already been fasting or follow a regular pattern. Ibn ‘Uthaymin allowed starting voluntary fasts in the second half before the last day or two.'
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
        { name:'Ibn Baz · Fasting after the middle of Sha’ban', arName:'ابن باز · صيام ما بعد نصف شعبان', url:'https://binbaz.org.sa/fatwas/31508/ما-صحة-حديث-اذا-انتصف-شعبان-فلا-تصوموا' },
        { name:'Ibn ‘Uthaymin · Explanation of Bulugh al-Maram', arName:'ابن عثيمين · شرح كتاب الصيام من بلوغ المرام',
          url:'https://baheth.ieasybooks.com/en/media/شرح-كتاب-الصيام-من-بلوغ-المرام-للشيخ-ابن-عثيمين-1?cue=1129000' }]
    },
    tarawih: {
      name:'Tarawih', kind:'worship', ruling:'Ramadan night prayer',
      notes:[
        'Tarawih is the optional night prayer in Ramadan. Pray it after Isha and before Fajr. Its first night comes before the first fast. The night after the last fast belongs to Eid once Shawwal is confirmed.',
        'You can pray alone or in a group. Ibn Baz explained that staying with the imam until he finishes earns the reward of praying a whole night.'
      ],
      sources:[
        { name:'Sahih al-Bukhari 37', url:'https://sunnah.com/bukhari:37',
          arabic:'مَنْ قَامَ رَمَضَانَ إِيمَانًا وَاحْتِسَابًا غُفِرَ لَهُ مَا تَقَدَّمَ مِنْ ذَنْبِهِ',
          meaning:'Whoever stands in prayer in Ramadan with faith and seeking reward will have their past sins forgiven.' },
        { name:'Al-Tirmidhi 806', url:'https://sunnah.com/tirmidhi:806',
          arabic:'إِنَّهُ مَنْ قَامَ مَعَ الْإِمَامِ حَتَّى يَنْصَرِفَ كُتِبَ لَهُ قِيَامُ لَيْلَةٍ',
          meaning:'Whoever prays with the imam until he finishes will be credited with a night of prayer.' }
      ],
      refs:[{ name:'Ibn Baz · Praying Tarawih with the imam', arName:'ابن باز · فضل إتمام التراويح مع الإمام',
        url:'https://binbaz.org.sa/fatwas/11721/من-اكتفى-بالتراويح-مع-الامام-هل-يكتب-له-قيام-ليلة' }]
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
    },
    takbir: {
      name:'Dhul-Hijjah takbir', kind:'worship', ruling:'Remember Allah',
      notes:[
        'Takbir means saying Allahu akbar, or “Allah is the Greatest”. Ibn Baz taught saying it at any time from the start of Dhul-Hijjah until sunset on the 13th.',
        'For people observing these days at home, Ibn Baz also recommended takbir after the five obligatory prayers, from Fajr on the Day of Arafah through Asr on 13 Dhul-Hijjah.'
      ],
      sources:[
        { name:'Qur’an 2:203', url:'https://quran.com/2/203', arabic:'وَاذْكُرُوا اللَّهَ فِي أَيَّامٍ مَعْدُودَاتٍ',
          meaning:'Remember Allah during the appointed days.' },
        { name:'Sahih al-Bukhari 969', url:'https://sunnah.com/bukhari:969',
          arabic:'مَا الْعَمَلُ فِي أَيَّامٍ أَفْضَلَ مِنْهَا فِي هَذِهِ',
          meaning:'Deeds done on other days are no better than those done on these days.' }
      ],
      refs:[{ name:'Ibn Baz · General takbir and takbir after prayer', arName:'ابن باز · التكبير المطلق والمقيد',
        url:'https://binbaz.org.sa/fatwas/5181/التكبير-المطلق-والمقيد' }]
    },
    udhiyah: {
      name:'Udhiyah', kind:'worship', ruling:'Eid sacrifice',
      notes:[
        'The period shown follows Ibn ‘Uthaymin’s ruling. It starts after the Eid prayer on 10 Dhul-Hijjah and ends at sunset on the 13th.',
        'Ibn Baz taught that if you intend to offer the sacrifice, leave your hair and nails untrimmed once Dhul-Hijjah begins until your sacrifice takes place. This applies to the person offering it. Other family members need only follow it if they are offering a sacrifice themselves.'
      ],
      sources:[
        sacrificeHadith,
        { name:'Sahih Muslim 1977e', url:'https://sunnah.com/muslim:1977e',
          arabic:'إِذَا رَأَيْتُمْ هِلَالَ ذِي الْحِجَّةِ وَأَرَادَ أَحَدُكُمْ أَنْ يُضَحِّيَ فَلْيُمْسِكْ عَنْ شَعَرِهِ وَأَظْفَارِهِ',
          meaning:'When you see the new moon of Dhul-Hijjah, whoever intends to offer a sacrifice should leave their hair and nails untrimmed.' }
      ],
      refs:[sacrificeTiming, { name:'Ibn Baz · Hair and nails when offering udhiyah', arName:'ابن باز · حكم أخذ الشعر والأظفار لمن أراد الأضحية',
        url:'https://binbaz.org.sa/fatwas/16859/من-احكام-الاضحية' }]
    },
    sacred: {
      name:'Sacred month', kind:'worship', ruling:'Four months in the Hijri year',
      notes:[
        'The four sacred months are Muharram, Rajab, Dhul-Qa’dah and Dhul-Hijjah. This card shows the current or next one. Allah tells us to take particular care to avoid wrongdoing during these months.',
        'Ibn Baz and Ibn ‘Uthaymin said that being a sacred month gives Rajab no special fast or celebration of its own. The White Days can still be observed as part of the usual monthly practice.'
      ],
      sources:[
        { name:'Qur’an 9:36', url:'https://quran.com/9/36',
          arabic:'مِنْهَا أَرْبَعَةٌ حُرُمٌ ۚ ذَٰلِكَ الدِّينُ الْقَيِّمُ ۚ فَلَا تَظْلِمُوا فِيهِنَّ أَنْفُسَكُمْ',
          meaning:'Four of them are sacred. That is the upright religion, so do not wrong yourselves during them.' },
        { name:'Sahih al-Bukhari 4662', url:'https://sunnah.com/bukhari:4662',
          arabic:'أَرْبَعَةٌ حُرُمٌ، ثَلَاثٌ مُتَوَالِيَاتٌ، ذُو الْقَعْدَةِ وَذُو الْحِجَّةِ وَالْمُحَرَّمُ وَرَجَبُ مُضَرَ',
          meaning:'Four are sacred. Three follow one another, Dhul-Qa’dah, Dhul-Hijjah and Muharram, along with Rajab of Mudar.' }
      ],
      refs:[{ name:'Ibn Baz · Specifying worship for Rajab', arName:'ابن باز · تخصيص رجب بعبادات',
        url:'https://binbaz.org.sa/fatwas/30667/حكم-تخصيص-شهر-رجب-بانواع-من-العبادات' },
        { name:'Ibn ‘Uthaymin · Fasts assigned to Rajab', arName:'ابن عثيمين · تخصيص أيام من رجب بالصوم',
          url:'https://old.binothaimeen.net/content/10543' }]
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
      'عيد الفطر هو الأول من شوال بعد رمضان. يحرم صيام يوم العيد. أخرج زكاة الفطر قبل صلاة العيد. وكان النبي ﷺ يأكل تمرات وتراً قبل خروجه إلى الصلاة.',
      'ذكر ابن باز استحباب التكبير، مثل قول «الله أكبر»، من غروب الشمس ليلة العيد إلى انتهاء خطبة العيد.',
      'يمكن صيام ستة أيام من شوال بدءاً من اليوم التالي للعيد. صمها متتابعة أو متفرقة قبل انتهاء الشهر.'
    ]],
    shawwal:['ستة أيام من شوال', 'مستحب · اختر ستة أيام', [
      'شوال هو الشهر الذي يلي رمضان. يُستحب صوم ستة أيام منه بعد عيد الفطر وقبل نهاية الشهر. والتواريخ المعروضة هي المدة التي تختار منها الأيام.',
      'يجوز صيام الست متتابعة أو متفرقة. ويرى ابن باز تقديم قضاء ما فات من رمضان على صيام الست.'
    ]],
    adha:['عيد الأضحى', 'يحرم الصيام', [
      'عيد الأضحى هو العاشر من ذي الحجة. أخبر القرآن أن إبراهيم رأى في المنام أنه يذبح ابنه. فلما أسلما لأمر الله، فداه الله بذبح عظيم.',
      'يحرم صيام يوم العيد. وبيّن ابن عثيمين أن وقت الأضحية يبدأ بعد صلاة العيد وينتهي بغروب شمس الثالث عشر من ذي الحجة.',
      tashriqAr,
      'أيام التشريق أيام أكل وشرب وذكر لله. والأصل ترك الصيام فيها.'
    ]],
    qadr:['أواخر ليالي رمضان', 'تحرّي ليلة القدر', [
      'ليلة القدر خير من ألف شهر. أمر النبي ﷺ بتحرّيها في العشر الأواخر من رمضان. وأكّد ابن باز فضل الليالي الوترية، وبيّن ابن تيمية أن الوتر قد يُحسب أيضاً بحسب ما بقي من الشهر. ولهذا أوصى الشيخان بالاجتهاد في الليالي كلها.',
      'ابدأ من غروب شمس يوم العشرين من رمضان. وتنتهي آخر ليلة بفجر آخر يوم صيام. وأوصى ابن باز بالاعتكاف، وهو لزوم المسجد للتفرّغ للعبادة، ولا سيما في العشر الأواخر.',
      'سألت عائشة رضي الله عنها النبي ﷺ عمّا تقوله إن وافقت ليلة القدر، فعلّمها أن تسأل الله العفو.'
    ]],
    dhulFirst:['التسعة الأولى من ذي الحجة', 'صيام تطوّع', [
      'تُستحب كثرة العمل الصالح في عشر ذي الحجة. وذكر ابن باز أن صيام التسعة الأولى منها من العمل الصالح. صم منها ما تيسّر لك.',
      'ورد أنه ﷺ كان يصوم التسعة، وقالت عائشة إنها لم تره صائماً في العشر. وذكر ابن باز اضطراباً في سند الرواية الأولى، ورأى استحباب الصيام لثبوت فضل العمل الصالح في هذه الأيام.',
      'التاسع يوم عرفة، وقد ورد حديث خاص في فضل صيامه. والعاشر عيد الأضحى ويحرم صيامه.'
    ]],
    tashriq:['أيام التشريق', 'يحرم الصيام', [
      tashriqAr,
      'هي أيام أكل وشرب وذكر لله. والأصل ترك الصيام في الأيام الثلاثة كلها.'
    ]],
    muharram:['الصيام في محرم', 'صيام تطوّع', [
      'رغّب النبي ﷺ في صيام التطوع في شهر محرم. صم منه ما تيسّر لك. والعاشر عاشوراء، وقد ورد فيه دليل خاص ويُستحب صيام التاسع معه.'
    ]],
    shaban:['الصيام في شعبان', 'صيام تطوّع', [
      'أخبرت عائشة رضي الله عنها أن النبي ﷺ كان يكثر الصيام في شعبان. ورغّب ابن باز في الصيام فيه من غير تخصيص النصف منه بصيام.',
      'لا تبدأ صيام التطوّع قبل رمضان بيوم أو يومين، ولك أن تصوم ما وافق عادتك. وإذا شك الناس في دخول رمضان فانتظر الإعلان قبل صيام أول يوم منه.',
      'صحّح ابن باز حديث النهي عن الصيام بعد النصف، فنهى عن ابتداء التطوّع بعده لمن لم يصم قبل النصف ولم تكن له عادة. وأجاز ابن عثيمين ابتداء التطوّع في النصف الثاني قبل اليوم أو اليومين الأخيرين.'
    ]],
    tarawih:['التراويح', 'قيام ليالي رمضان', [
      'التراويح صلاة تطوّع في ليالي رمضان، ووقتها بعد العشاء وقبل الفجر. الليلة الأولى تسبق أول يوم صيام، والليلة التي تلي آخر يوم صيام هي ليلة العيد بعد ثبوت دخول شوال.',
      'تجوز صلاتها منفرداً أو مع الجماعة. وبيّن ابن باز أن من قام مع الإمام حتى ينصرف كُتب له قيام ليلة.'
    ]],
    zakatFitr:['زكاة الفطر', 'تُخرج قبل صلاة العيد', [
      'زكاة الفطر صدقة واجبة عند انتهاء رمضان، وتُعطى للمحتاجين قبل صلاة العيد. وجاء في حديث ابن عمر أنهم كانوا يعطونها قبل العيد بيوم أو يومين. يعرض التقويم هذين اليومين وصباح العيد.',
      'أجاز ابن باز إخراجها قبل العيد بثلاثة أيام أيضاً. وإذا وكّلت أحداً بإخراجها فرتّب ذلك مبكراً لتصل إلى مستحقيها قبل الموعد.'
    ]],
    takbir:['التكبير في ذي الحجة', 'ذكر الله', [
      'التكبير هو قول «الله أكبر». وذكر ابن باز أنه يُستحب في كل وقت من دخول ذي الحجة إلى غروب شمس الثالث عشر منه.',
      'وذكر ابن باز أن من شهد هذه الأيام في بلده يُستحب له التكبير أيضاً بعد الصلوات الخمس، من فجر يوم عرفة إلى عصر الثالث عشر.'
    ]],
    udhiyah:['الأضحية', 'أضحية العيد', [
      'التاريخ المعروض على قول ابن عثيمين. يبدأ وقت الأضحية بعد صلاة العيد في العاشر من ذي الحجة وينتهي بغروب شمس الثالث عشر.',
      'ذكر ابن باز أن من أراد أن يضحّي يمسك عن أخذ شعره وأظفاره من دخول ذي الحجة حتى يضحّي. وهذا يخص من أراد أن يضحّي، ولا يشمل بقية أفراد أسرته إلا من أراد أن يضحّي بنفسه.'
    ]],
    sacred:['شهر حرام', 'الأشهر الحرم أربعة', [
      'الأشهر الحرم هي المحرم ورجب وذو القعدة وذو الحجة. يظهر هنا الشهر الحرام الحالي أو القادم. وقد أمر الله عباده باجتناب الظلم فيها.',
      'بيّن ابن باز وابن عثيمين أنه لا يُخصّ رجب بصيام أو احتفال. ويجوز صيام الأيام البيض فيه كسائر الشهور.'
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
      if (month === 1) addRange(fasts, 'muharram', date, hijri, 1, 30);
      if (month === 8) addRange(fasts, 'shaban', date, hijri, 1, 30);
      if ([1, 7, 11, 12].includes(month)) addRange(worship, 'sacred', date, hijri, 1, 30);
      if (month === 9) {
        addRange(dates, 'ramadan', date, hijri, 1, 30);
        addRange(worship, 'qadr', date, hijri, 21, 30);
      }
      if (month === 10) {
        addRange(fasts, 'shawwal', date, hijri, 2, 30);
        if (day === 1) {
          dates.fitr ??= { from };
          worship.zakatFitr ??= { from:keyFor(new Date(+date - 2 * dayMs)), to:from };
        }
      }
      if (month === 12) {
        addRange(fasts, 'dhulFirst', date, hijri, 1, 9);
        addRange(worship, 'takbir', date, hijri, 1, 13);
        addRange(worship, 'udhiyah', date, hijri, 10, 13);
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
    if (dates.ramadan) worship.tarawih = { ...dates.ramadan };
    return { dates, fasts, worship };
  }

  root.SalahHijri = { label, periodLabel, upcoming, occasions, occasion };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.SalahHijri;
})(typeof window !== 'undefined' ? window : globalThis);
