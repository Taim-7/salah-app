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

  const occasions = {
    ramadan: {
      name:'First fast of Ramadan', kind:'required', ruling:'Obligatory fast',
      notes:[
        'Ramadan is the ninth Hijri month, when the Qur’an was revealed. Allah prescribed fasting to help believers grow in taqwa, or mindfulness of Him. Those who miss days because of illness or travel make up the same number later.',
        'Eat suhur before true dawn. The fast starts at Fajr and ends at sunset, when Maghrib begins. The date in this calendar is an estimate. Follow the local announcement for the first day and Eid.'
      ],
      sources:[
        { name:'Qur’an 2:183–187', url:'https://quran.com/2/183-187',
          meaning:'These verses explain the purpose of fasting, the obligation in Ramadan, the allowance for illness and travel, and the hours of each day’s fast.' },
        { name:'Sahih al-Bukhari 38', url:'https://sunnah.com/bukhari:38',
          arabic:'مَنْ صَامَ رَمَضَانَ إِيمَانًا وَاحْتِسَابًا غُفِرَ لَهُ مَا تَقَدَّمَ مِنْ ذَنْبِهِ',
          meaning:'The Prophet ﷺ said that Allah forgives past sins for the person who fasts Ramadan with faith and seeks His reward.' },
        { name:'Sahih al-Bukhari 1909', url:'https://sunnah.com/bukhari:1909',
          meaning:'The Prophet ﷺ linked the start and end of fasting to seeing the crescent. If cloud hides it before Ramadan, complete thirty days of Sha’ban.' },
        { name:'Sahih al-Bukhari 1923', url:'https://sunnah.com/bukhari:1923',
          arabic:'تَسَحَّرُوا فَإِنَّ فِي السَّحُورِ بَرَكَةً',
          meaning:'The Prophet ﷺ encouraged eating suhur because the pre-dawn meal has blessing.' }
      ]
    },
    white: {
      name:'White Days', kind:'sunnah', ruling:'Sunnah fasts',
      notes:[
        'The White Days are the 13th, 14th and 15th of the Hijri month, named for the bright nights around the full moon. If you miss one, you can still follow the Sunnah of fasting three days that month by choosing another day.',
        'The 13th of Dhul-Hijjah is a Day of Tashriq, so the calendar gives the 14th and 15th that month. In Ramadan, these dates fall within the obligatory fast.'
      ],
      sources:[
        { name:'Abu Dawud 2449 (sahih, al-Albani)', url:'https://sunnah.com/abudawud:2449',
          arabic:'كَانَ رَسُولُ اللَّهِ صلى الله عليه وسلم يَأْمُرُنَا أَنْ نَصُومَ الْبِيضَ ثَلاَثَ عَشْرَةَ وَأَرْبَعَ عَشْرَةَ وَخَمْسَ عَشْرَةَ',
          meaning:'Ibn Milhan’s father reported that the Prophet ﷺ told them to fast the 13th, 14th and 15th.' },
        { name:'Sahih Muslim 1160', url:'https://sunnah.com/muslim:1160',
          meaning:'Aisha reported that the Prophet ﷺ fasted three days a month and would choose from different days.' },
        { name:'Sahih al-Bukhari 1997–98', url:'https://sunnah.com/bukhari:1997',
          meaning:'Aisha and Ibn Umar said fasting on the Days of Tashriq was allowed only for pilgrims who could not offer the required sacrifice.' }
      ]
    },
    arafah: {
      name:'Day of Arafah', kind:'sunnah', ruling:'Sunnah fast outside Hajj',
      notes:[
        'On 9 Dhul-Hijjah, pilgrims stand at Arafah as part of Hajj, then go to Muzdalifah. Muslims away from Hajj can observe the Sunnah fast. Follow the Dhul-Hijjah announcement of the community you fast with, as the local date can differ from Makkah’s.'
      ],
      sources:[
        { name:'Qur’an 2:198', url:'https://quran.com/2/198',
          meaning:'Allah tells pilgrims to remember Him at the Sacred Landmark in Muzdalifah after they leave Arafah.' },
        { name:'Sahih Muslim 1162a', url:'https://sunnah.com/muslim:1162a',
          meaning:'The Prophet ﷺ hoped that fasting Arafah would wipe away the sins of the previous and coming years.' },
        { name:'Sahih Muslim 1348', url:'https://sunnah.com/muslim:1348',
          arabic:'مَا مِنْ يَوْمٍ أَكْثَرَ مِنْ أَنْ يُعْتِقَ اللَّهُ فِيهِ عَبْدًا مِنَ النَّارِ مِنْ يَوْمِ عَرَفَةَ',
          meaning:'Aisha reported that Allah frees more people from the Fire on Arafah than on any other day.' },
        { name:'Sahih al-Bukhari 1661', url:'https://sunnah.com/bukhari:1661',
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
          meaning:'Allah commanded Musa to strike the sea with his staff. The sea split, saving Musa and those with him, and Pharaoh’s people drowned.' },
        { name:'Sahih al-Bukhari 2004', url:'https://sunnah.com/bukhari:2004',
          meaning:'Ibn Abbas reported that Musa fasted that day, and that the Prophet ﷺ did the same.' },
        { name:'Sahih al-Bukhari 2002', url:'https://sunnah.com/bukhari:2002',
          meaning:'Aisha reported that Quraysh also fasted this day, and that the fast became optional once Allah prescribed Ramadan.' },
        { name:'Sahih Muslim 1162a', url:'https://sunnah.com/muslim:1162a',
          meaning:'The Prophet ﷺ hoped that fasting Ashura would wipe away the sins of the previous year.' },
        { name:'Sahih Muslim 1134a', url:'https://sunnah.com/muslim:1134a',
          arabic:'فَإِذَا كَانَ الْعَامُ الْمُقْبِلُ إِنْ شَاءَ اللَّهُ صُمْنَا الْيَوْمَ التَّاسِعَ',
          meaning:'The Prophet ﷺ said that if he lived to the following year they would fast the 9th. He died before that Muharram came.' }
      ]
    },
    fitr: {
      name:'Eid al-Fitr', kind:'forbidden', ruling:'Do not fast',
      notes:[
        'Eid al-Fitr is on 1 Shawwal, after the end of Ramadan. It is a day to break the fast, thank Allah and attend the Eid prayer. Give Zakat al-Fitr before the prayer. The Prophet ﷺ ate an odd number of dates before going out to pray.',
        'After Eid, you can choose six days in a row for the Shawwal fasts or space them out over the rest of the month.'
      ],
      sources:[
        { name:'Qur’an 2:185', url:'https://quran.com/2/185',
          meaning:'Allah tells believers to complete the prescribed days and glorify Him for His guidance.' },
        { name:'Sahih Muslim 1137', url:'https://sunnah.com/muslim:1137',
          arabic:'إِنَّ هَذَيْنِ يَوْمَانِ نَهَى رَسُولُ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ عَنْ صِيَامِهِمَا',
          meaning:'Umar explained in his Eid sermon that the Prophet ﷺ forbade fasting on the day of breaking the fast and the day of sacrifice.' },
        { name:'Abu Dawud 1134 (sahih, al-Albani)', url:'https://sunnah.com/abudawud:1134',
          meaning:'When the Prophet ﷺ came to Madinah, he said Allah had given its people two better days to celebrate, Eid al-Fitr and Eid al-Adha.' },
        { name:'Sahih al-Bukhari 1509', url:'https://sunnah.com/bukhari:1509',
          meaning:'Ibn Umar reported that the Prophet ﷺ ordered people to give Zakat al-Fitr before they went out to the prayer.' },
        { name:'Sahih al-Bukhari 953', url:'https://sunnah.com/bukhari:953',
          meaning:'Anas reported how the Prophet ﷺ ate dates before the Eid prayer.' },
        { name:'Sahih Muslim 1164a', url:'https://sunnah.com/muslim:1164a',
          arabic:'مَنْ صَامَ رَمَضَانَ ثُمَّ أَتْبَعَهُ سِتًّا مِنْ شَوَّالٍ كَانَ كَصِيَامِ الدَّهْرِ',
          meaning:'The Prophet ﷺ likened the reward for fasting Ramadan followed by six days of Shawwal to the reward of fasting the whole year.' }
      ]
    },
    adha: {
      name:'Eid al-Adha', kind:'forbidden', ruling:'Do not fast',
      notes:[
        'Eid al-Adha is the festival of sacrifice on 10 Dhul-Hijjah. The Qur’an tells how Ibrahim saw in a dream that he was to sacrifice his son. When they both submitted to Allah, Allah spared the son and provided a sacrifice in his place.',
        'Those offering udhiyah start after the Eid prayer. The next three days, 11–13 Dhul-Hijjah, are the Days of Tashriq. The usual rule is to eat and drink on those days. Pilgrims who cannot offer the required Hajj sacrifice have an exception.'
      ],
      sources:[
        { name:'Qur’an 37:102–107', url:'https://quran.com/37/102-107',
          meaning:'Ibrahim’s son agreed to what Allah commanded. Allah called to Ibrahim after he carried out what he saw in the dream and gave a sacrifice in the boy’s place.' },
        { name:'Qur’an 22:36–37', url:'https://quran.com/22/36-37',
          meaning:'Eat from the sacrifice and feed those in need. Allah explains that what reaches Him is your taqwa.' },
        { name:'Sahih al-Bukhari 5560', url:'https://sunnah.com/bukhari:5560',
          arabic:'إِنَّ أَوَّلَ مَا نَبْدَأُ مِنْ يَوْمِنَا هَذَا أَنْ نُصَلِّيَ، ثُمَّ نَرْجِعَ فَنَنْحَرَ',
          meaning:'The Prophet ﷺ prayed Eid first, then returned to offer the sacrifice.' },
        { name:'Sahih al-Bukhari 1991–92', url:'https://sunnah.com/bukhari:1991',
          meaning:'The Prophet ﷺ forbade fasting on Eid al-Fitr and Eid al-Adha.' },
        { name:'Sahih Muslim 1141a–b', url:'https://sunnah.com/muslim:1141',
          meaning:'The Prophet ﷺ described Tashriq as days for eating, drinking and remembering Allah.' },
        { name:'Sahih al-Bukhari 1997–98', url:'https://sunnah.com/bukhari:1997',
          meaning:'Aisha and Ibn Umar reported the exception for the pilgrim unable to offer the required sacrifice.' }
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
    let whiteMonth;
    for (let i = 0; i <= 370; i++) {
      const date = new Date(+start + i * dayMs), hijri = parts(date);
      if (!hijri) continue;
      const { month, day, year } = hijri;
      const from = keyFor(date);
      if (month === 9 && day === 1) dates.ramadan ??= { from };
      if (month === 10 && day === 1) dates.fitr ??= { from };
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
      if (dates.ramadan && dates.fitr && dates.adha && fasts.arafah && fasts.ashura &&
          fasts.white && (day > 15 || whiteMonth !== `${year}-${month}`)) break;
    }
    return { dates, fasts };
  }

  root.SalahHijri = { label, upcoming, occasions };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.SalahHijri;
})(typeof window !== 'undefined' ? window : globalThis);
