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
        'Allah prescribed fasting so that believers may grow in mindfulness of Him. Ramadan is the month in which the Qur’an came down. Those who miss days through illness or travel make them up later.',
        'The Prophet ﷺ taught Muslims to begin and end Ramadan according to the new moon. When the crescent cannot be seen because of cloud, the month is completed as thirty days.'
      ],
      sources:[['Qur’an 2:183–185', 'https://quran.com/2/183-185'], ['Sahih al-Bukhari 1909', 'https://sunnah.com/bukhari:1909'],
        ['Sahih Muslim 1081b', 'https://sunnah.com/muslim:1081b']]
    },
    white: {
      name:'White Days', kind:'sunnah', ruling:'Sunnah fasts',
      notes:[
        'The White Days fall around the full moon, on the 13th, 14th and 15th of the Hijri month. The Prophet ﷺ encouraged fasting on these dates. He also advised Abu Hurayrah to fast three days each month.',
        'The 13th of Dhul-Hijjah falls within the Days of Tashriq. The calendar leaves it out of the optional fasts.'
      ],
      sources:[['Abu Dawud 2449 (sahih, al-Albani)', 'https://sunnah.com/abudawud:2449'],
        ['Sahih al-Bukhari 1981', 'https://sunnah.com/bukhari:1981'], ['Sahih al-Bukhari 1997–98', 'https://sunnah.com/bukhari:1997']]
    },
    arafah: {
      name:'Day of Arafah', kind:'sunnah', ruling:'Sunnah fast outside Hajj',
      notes:[
        'On 9 Dhul-Hijjah, pilgrims gather at Arafah. The Qur’an tells them to remember Allah at the Sacred Landmark in Muzdalifah after they leave Arafah.',
        'The Prophet ﷺ said he hoped Allah would forgive the sins of the previous and coming year through this fast. While at Arafah during Hajj, he drank milk in front of the people.'
      ],
      sources:[['Qur’an 2:198', 'https://quran.com/2/198'], ['Sahih Muslim 1162a', 'https://sunnah.com/muslim:1162a'],
        ['Sahih al-Bukhari 1661', 'https://sunnah.com/bukhari:1661']]
    },
    ashura: {
      name:'Ashura', kind:'sunnah', ruling:'Sunnah fast',
      notes:[
        'Ashura is 10 Muharram. The Qur’an tells how Allah split the sea and saved Musa and those with him. In Ibn Abbas’s report, the Jews of Madinah said Musa fasted on this day. The Prophet ﷺ said Muslims were closer to Musa and fasted it too.',
        'The Prophet ﷺ hoped that fasting Ashura would wipe away the past year’s sins. He also said he intended to fast the 9th the following year, so the calendar includes the day before when it is still ahead.'
      ],
      sources:[['Qur’an 26:63–66', 'https://quran.com/26/63-66'], ['Sahih al-Bukhari 2004', 'https://sunnah.com/bukhari:2004'],
        ['Sahih Muslim 1162a', 'https://sunnah.com/muslim:1162a'], ['Sahih Muslim 1134a', 'https://sunnah.com/muslim:1134a']]
    },
    fitr: {
      name:'Eid al-Fitr', kind:'forbidden', ruling:'Do not fast',
      notes:[
        'Eid al-Fitr is on 1 Shawwal and marks the end of Ramadan. The Qur’an tells believers to complete the prescribed days and glorify Allah for His guidance. The Prophet ﷺ forbade fasting on both Eids.',
        'When the Prophet ﷺ came to Madinah, he said Allah had given its people two better days to celebrate, the day of breaking the fast and the day of sacrifice. He instructed people to give Zakat al-Fitr before the Eid prayer.'
      ],
      sources:[['Qur’an 2:185', 'https://quran.com/2/185'], ['Sahih al-Bukhari 1991–92', 'https://sunnah.com/bukhari:1991'],
        ['Abu Dawud 1134 (sahih, al-Albani)', 'https://sunnah.com/abudawud:1134'], ['Sahih al-Bukhari 1509', 'https://sunnah.com/bukhari:1509']]
    },
    adha: {
      name:'Eid al-Adha', kind:'forbidden', ruling:'Do not fast',
      notes:[
        'Eid al-Adha is the festival of sacrifice on 10 Dhul-Hijjah. The Qur’an tells believers to eat from the sacrifice and share the meat with people in need. The Prophet ﷺ prayed Eid before offering the sacrifice and forbade fasting on Eid.',
        'Fasting is also generally forbidden on the next three days, the Days of Tashriq. Pilgrims who cannot offer the required Hajj sacrifice have an exception.'
      ],
      sources:[['Qur’an 22:36', 'https://quran.com/22/36'], ['Sahih al-Bukhari 5560', 'https://sunnah.com/bukhari:5560'],
        ['Sahih al-Bukhari 1991–92', 'https://sunnah.com/bukhari:1991'], ['Sahih al-Bukhari 1997–98', 'https://sunnah.com/bukhari:1997']]
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
