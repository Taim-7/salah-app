(function (root) {
  'use strict';

  const months = ['Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 'Jumada al-Ula', 'Jumada al-Akhirah',
    'Rajab', 'Sha’ban', 'Ramadan', 'Shawwal', 'Dhul-Qa’dah', 'Dhul-Hijjah'];
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
    meaning:'The Prophet ﷺ described Tashriq as days of eating, drinking and remembering Allah. The last phrase is from the second narration.'
  };
  const tashriqException = {
    name:'Sahih al-Bukhari 1997–98', url:'https://sunnah.com/bukhari:1997',
    arabic:'لَمْ يُرَخَّصْ فِي أَيَّامِ التَّشْرِيقِ أَنْ يُصَمْنَ، إِلَّا لِمَنْ لَمْ يَجِدِ الْهَدْيَ',
    meaning:'Aisha and Ibn Umar said fasting on these days was allowed only for the Hajj pilgrim who could not provide the required sacrificial animal.'
  };
  const shawwalHadith = {
    name:'Sahih Muslim 1164a', url:'https://sunnah.com/muslim:1164a',
    arabic:'مَنْ صَامَ رَمَضَانَ ثُمَّ أَتْبَعَهُ سِتًّا مِنْ شَوَّالٍ كَانَ كَصِيَامِ الدَّهْرِ',
    meaning:'Fasting Ramadan and then six days of Shawwal is like fasting the whole year in reward.'
  };

  const occasions = {
    ramadan: {
      name:'First fast of Ramadan', kind:'required', ruling:'Obligatory fast',
      notes:[
        'Ramadan is the ninth Hijri month, when the Qur’an was revealed. Allah prescribed fasting to help believers grow in taqwa, or mindfulness of Him. Those who miss days because of illness or travel make up the same number later.',
        'Suhur is the meal before dawn. Finish eating and drinking by true dawn, when Fajr begins. Break the fast at sunset, when Maghrib begins. Confirm the first day of Ramadan and Eid with your local announcement.'
      ],
      sources:[
        { name:'Qur’an 2:183–187', url:'https://quran.com/2/183-187',
          arabic:'وَكُلُوا وَاشْرَبُوا حَتَّىٰ يَتَبَيَّنَ لَكُمُ الْخَيْطُ الْأَبْيَضُ مِنَ الْخَيْطِ الْأَسْوَدِ مِنَ الْفَجْرِ ثُمَّ أَتِمُّوا الصِّيَامَ إِلَى اللَّيْلِ',
          meaning:'Eat and drink until the white thread of dawn becomes clear against the dark of night. Then keep the fast until night begins.' },
        { name:'Sahih al-Bukhari 38', url:'https://sunnah.com/bukhari:38',
          arabic:'مَنْ صَامَ رَمَضَانَ إِيمَانًا وَاحْتِسَابًا غُفِرَ لَهُ مَا تَقَدَّمَ مِنْ ذَنْبِهِ',
          meaning:'The Prophet ﷺ said that Allah forgives past sins for the person who fasts Ramadan with faith and seeks His reward.' },
        { name:'Sahih al-Bukhari 1909', url:'https://sunnah.com/bukhari:1909',
          arabic:'صُومُوا لِرُؤْيَتِهِ، وَأَفْطِرُوا لِرُؤْيَتِهِ، فَإِنْ غُبِّيَ عَلَيْكُمْ فَأَكْمِلُوا عِدَّةَ شَعْبَانَ ثَلَاثِينَ',
          meaning:'The Prophet ﷺ linked the start and end of fasting to seeing the crescent. If cloud hides it before Ramadan, complete thirty days of Sha’ban.' },
        { name:'Sahih al-Bukhari 1923', url:'https://sunnah.com/bukhari:1923',
          arabic:'تَسَحَّرُوا فَإِنَّ فِي السَّحُورِ بَرَكَةً',
          meaning:'The Prophet ﷺ encouraged eating suhur because the pre-dawn meal has blessing.' }
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
          arabic:'كَانَ رَسُولُ اللَّهِ صلى الله عليه وسلم يَأْمُرُنَا أَنْ نَصُومَ الْبِيضَ ثَلاَثَ عَشْرَةَ وَأَرْبَعَ عَشْرَةَ وَخَمْسَ عَشْرَةَ',
          meaning:'Ibn Milhan’s father reported that the Prophet ﷺ told them to fast the 13th, 14th and 15th.' },
        { name:'Sahih Muslim 1160', url:'https://sunnah.com/muslim:1160',
          arabic:'يَصُومُ مِنْ كُلِّ شَهْرٍ ثَلَاثَةَ أَيَّامٍ … لَمْ يَكُنْ يُبَالِي مِنْ أَيِّ أَيَّامِ الشَّهْرِ يَصُومُ',
          meaning:'Aisha said the Prophet ﷺ fasted three days each month and did not keep to particular dates.' },
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
          meaning:'Allah tells pilgrims to remember Him at the Sacred Landmark in Muzdalifah after they leave Arafah.' },
        { name:'Sahih Muslim 1162a', url:'https://sunnah.com/muslim:1162a',
          arabic:'صِيَامُ يَوْمِ عَرَفَةَ أَحْتَسِبُ عَلَى اللَّهِ أَنْ يُكَفِّرَ السَّنَةَ الَّتِي قَبْلَهُ وَالسَّنَةَ الَّتِي بَعْدَهُ',
          meaning:'The Prophet ﷺ hoped that fasting Arafah would wipe away the sins of the previous and coming years.' },
        { name:'Sahih Muslim 1348', url:'https://sunnah.com/muslim:1348',
          arabic:'مَا مِنْ يَوْمٍ أَكْثَرَ مِنْ أَنْ يُعْتِقَ اللَّهُ فِيهِ عَبْدًا مِنَ النَّارِ مِنْ يَوْمِ عَرَفَةَ',
          meaning:'Aisha reported that Allah frees more people from the Fire on Arafah than on any other day.' },
        { name:'Sahih al-Bukhari 1661', url:'https://sunnah.com/bukhari:1661',
          arabic:'فَأَرْسَلَتْ إِلَيْهِ بِقَدَحِ لَبَنٍ وَهُوَ وَاقِفٌ عَلَى بَعِيرِهِ فَشَرِبَهُ',
          meaning:'Umm al-Fadl sent milk to the Prophet ﷺ at Arafah during Hajj. He drank it in front of the people.' }
      ]
    },
    ashura: {
      name:'Ashura', kind:'sunnah', ruling:'Sunnah fast',
      notes:[
        'Ashura is 10 Muharram. When the Prophet ﷺ came to Madinah, the Jews there told him they fasted because Allah had rescued the Children of Israel. The Prophet ﷺ said the Muslims had more right to Musa and fasted that day.',
        'Fasting Ashura became optional when Ramadan became obligatory. It is recommended to fast the 9th along with the 10th. If you miss the 9th, you can still fast Ashura on the 10th.'
      ],
      sources:[
        { name:'Qur’an 26:63–66', url:'https://quran.com/26/63-66',
          arabic:'وَأَنْجَيْنَا مُوسَىٰ وَمَنْ مَعَهُ أَجْمَعِينَ ۝ ثُمَّ أَغْرَقْنَا الْآخَرِينَ',
          meaning:'Allah saved Musa and everyone with him, then drowned the others.' },
        { name:'Sahih al-Bukhari 2004', url:'https://sunnah.com/bukhari:2004',
          arabic:'فَأَنَا أَحَقُّ بِمُوسَى مِنْكُمْ … فَصَامَهُ وَأَمَرَ بِصِيَامِهِ',
          meaning:'The Prophet ﷺ said he had more right to Musa. He fasted Ashura and told the Muslims to fast it.' },
        { name:'Sahih al-Bukhari 2002', url:'https://sunnah.com/bukhari:2002',
          arabic:'فَلَمَّا فُرِضَ رَمَضَانُ تَرَكَ يَوْمَ عَاشُورَاءَ، فَمَنْ شَاءَ صَامَهُ، وَمَنْ شَاءَ تَرَكَهُ',
          meaning:'Aisha reported that, once Ramadan fasting became obligatory, people could choose whether to fast Ashura.' },
        { name:'Sahih Muslim 1162a', url:'https://sunnah.com/muslim:1162a',
          arabic:'وَصِيَامُ يَوْمِ عَاشُورَاءَ أَحْتَسِبُ عَلَى اللَّهِ أَنْ يُكَفِّرَ السَّنَةَ الَّتِي قَبْلَهُ',
          meaning:'The Prophet ﷺ hoped that fasting Ashura would wipe away the sins of the previous year.' },
        { name:'Sahih Muslim 1134a', url:'https://sunnah.com/muslim:1134a',
          arabic:'فَإِذَا كَانَ الْعَامُ الْمُقْبِلُ إِنْ شَاءَ اللَّهُ صُمْنَا الْيَوْمَ التَّاسِعَ',
          meaning:'The Prophet ﷺ said that if he lived to the following year they would fast the 9th. He died before that Muharram came.' }
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
          meaning:'Allah tells believers to complete the prescribed days and glorify Him for His guidance.' },
        { name:'Sahih Muslim 1137', url:'https://sunnah.com/muslim:1137',
          arabic:'إِنَّ هَذَيْنِ يَوْمَانِ نَهَى رَسُولُ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ عَنْ صِيَامِهِمَا',
          meaning:'Umar explained in his Eid sermon that the Prophet ﷺ forbade fasting on the day of breaking the fast and the day of sacrifice.' },
        { name:'Abu Dawud 1134 (sahih, al-Albani)', url:'https://sunnah.com/abudawud:1134',
          arabic:'إِنَّ اللَّهَ قَدْ أَبْدَلَكُمْ بِهِمَا خَيْرًا مِنْهُمَا يَوْمَ الْأَضْحَى وَيَوْمَ الْفِطْرِ',
          meaning:'When the Prophet ﷺ came to Madinah, he said Allah had given its people two better days to celebrate, Eid al-Fitr and Eid al-Adha.' },
        { name:'Sahih al-Bukhari 1509', url:'https://sunnah.com/bukhari:1509',
          arabic:'أَمَرَ بِزَكَاةِ الْفِطْرِ قَبْلَ خُرُوجِ النَّاسِ إِلَى الصَّلَاةِ',
          meaning:'Ibn Umar reported that the Prophet ﷺ ordered people to give Zakat al-Fitr before they went out to the prayer.' },
        { name:'Sahih al-Bukhari 953', url:'https://sunnah.com/bukhari:953',
          arabic:'كَانَ رَسُولُ اللَّهِ صلى الله عليه وسلم لَا يَغْدُو يَوْمَ الْفِطْرِ حَتَّى يَأْكُلَ تَمَرَاتٍ … وَيَأْكُلُهُنَّ وِتْرًا',
          meaning:'Anas reported that the Prophet ﷺ ate an odd number of dates before going out on Eid al-Fitr.' },
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
          meaning:'He advised starting early when you can, and said you can fast the days in a row or spread them out.' },
        { name:'Ibn Baz on missed Ramadan fasts', url:'https://binbaz.org.sa/fatwas/12676/المشروع-ان-يبدا-بقضاء-رمضان-قبل-صيام-الست',
          arabic:'وَلِأَنَّ الْفَرْضَ أَهَمُّ فَكَانَ أَوْلَى بِالتَّقْدِيمِ',
          meaning:'He gave priority to making up the missed Ramadan days because those fasts are obligatory.' }
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
        { name:'Qur’an 37:102–107', url:'https://quran.com/37/102-107',
          arabic:'وَفَدَيْنَاهُ بِذِبْحٍ عَظِيمٍ',
          meaning:'Allah provided a great sacrifice in place of Ibrahim’s son.' },
        { name:'Qur’an 22:36–37', url:'https://quran.com/22/36-37',
          arabic:'فَكُلُوا مِنْهَا وَأَطْعِمُوا الْقَانِعَ وَالْمُعْتَرَّ … لَنْ يَنَالَ اللَّهَ لُحُومُهَا وَلَا دِمَاؤُهَا وَلَٰكِنْ يَنَالُهُ التَّقْوَىٰ مِنْكُمْ',
          meaning:'Eat from the sacrifice and feed those in need. Allah says that what reaches Him is your taqwa, or mindfulness of Him.' },
        { name:'Sahih al-Bukhari 5560', url:'https://sunnah.com/bukhari:5560',
          arabic:'إِنَّ أَوَّلَ مَا نَبْدَأُ مِنْ يَوْمِنَا هَذَا أَنْ نُصَلِّيَ، ثُمَّ نَرْجِعَ فَنَنْحَرَ',
          meaning:'The Prophet ﷺ prayed Eid first, then returned to offer the sacrifice.' },
        { name:'Sahih al-Bukhari 1991–92', url:'https://sunnah.com/bukhari:1991',
          arabic:'نَهَى النَّبِيُّ صلى الله عليه وسلم عَنْ صَوْمِ يَوْمِ الْفِطْرِ وَالنَّحْرِ',
          meaning:'The Prophet ﷺ forbade fasting on Eid al-Fitr and Eid al-Adha.' },
        tashriqHadith, tashriqException
      ]
    }
  };

  function parts(date) {
    if (!formatter || !Number.isFinite(+date)) return null;
    const fields = Object.fromEntries(formatter.formatToParts(date).map(part => [part.type, Number(part.value)]));
    return months[fields.month - 1] && Number.isFinite(fields.day) && Number.isFinite(fields.year) ? fields : null;
  }

  function label(key) {
    const hijri = parts(noon(key));
    return hijri ? `${hijri.day} ${months[hijri.month - 1]} ${hijri.year} AH` : '';
  }

  function upcoming(key) {
    const start = noon(key), today = parts(start);
    const dates = {}, fasts = {};
    if (!today) return { dates, fasts };
    if (today.month === 9) dates.ramadan = { from:keyFor(new Date(+start - (today.day - 1) * dayMs)) };
    let whiteMonth, shawwalYear;
    for (let i = 0; i <= 370; i++) {
      const date = new Date(+start + i * dayMs), hijri = parts(date);
      if (!hijri) continue;
      const { month, day, year } = hijri;
      const from = keyFor(date);
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
      if (dates.ramadan && dates.fitr && dates.adha && fasts.arafah && fasts.ashura && fasts.shawwal &&
          !(month === 10 && year === shawwalYear) && fasts.white && (day > 15 || whiteMonth !== `${year}-${month}`)) break;
    }
    return { dates, fasts };
  }

  root.SalahHijri = { label, upcoming, occasions };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.SalahHijri;
})(typeof window !== 'undefined' ? window : globalThis);
