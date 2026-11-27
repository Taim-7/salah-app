(() => {
  'use strict';

  const source = (name, ar, url) => [name, url, ar];
  const evidence = (name, ar, en) => ({ name, ar, en });
  const uthaymin = 'https://old.binothaimeen.net/content/';
  const fawzanBook = 'https://al-sunan.org/vb/archive/index.php/t-10523.html';
  const taymiyyah = 'https://islamweb.net/ar/library/content/22/';

  window.SalahLessons.push(
    {
      id:'joining-prayer', title:'Joining prayer late', arTitle:'الدخول مع الإمام بعد بدء الصلاة',
      description:'How to join the imam and finish any rak’ahs you missed',
      arDescription:'إدراك الركعة، وإتمام ما فات، والدخول المتأخر في صلاة الجمعة',
      sections:[
        {
          title:'Join the imam where you find him', arTitle:'ادخل مع الإمام على حاله',
          en:`Walk to prayer calmly, even when it has started. Join the row and say the opening takbeer while standing if able. Then follow the imam in the position he is in. You can join while he is sitting or prostrating. Count a rak’ah when you catch its bow.

Count what you catch as the start of your own prayer. If you catch only the last rak’ah of Isha, that is your first. After the imam finishes, pray your second and sit for the first tashahhud. Then pray your third and fourth.`,
          ar:`امشِ إلى الصلاة بسكينة ولو بدأت. ادخل في الصف وكبّر تكبيرة الإحرام قائماً إن استطعت. ثم تابع الإمام على الحال التي وجدته عليها ولو كان جالساً أو ساجداً. وتُحسب لك الركعة بإدراك ركوعها.

احسب ما أدركته أول صلاتك. إذا أدركت آخر ركعة من العشاء فهي الأولى لك. فإذا سلّم الإمام، صلِّ الثانية واجلس للتشهد الأول، ثم أتمّ الثالثة والرابعة.`,
          evidence:[evidence('Sahih al-Bukhari 635', 'فَمَا أَدْرَكْتُمْ فَصَلُّوا، وَمَا فَاتَكُمْ فَأَتِمُّوا', 'Pray the part you catch and complete the part you missed.')],
          refs:[source('Al-Bukhari 635','البخاري ٦٣٥','https://sunnah.com/bukhari:635'),
            source('Uthman al-Khamees · Arriving calmly','عثمان الخميس · حكم إسراع المأموم لإدراك الركوع','https://othmanalkhamees.com/material/26735'),
            source('Ibn Baz · The latecomer’s first rak’ah','ابن باز · ما أول صلاة المسبوق؟','https://binbaz.org.sa/fatwas/15490/%D9%85%D8%A7-%D8%A7%D9%88%D9%84-%D8%B5%D9%84%D8%A7%D8%A9-%D8%A7%D9%84%D9%85%D8%B3%D8%A8%D9%88%D9%82')]
        },
        {
          title:'Catching the bow', arTitle:'إدراك الركعة بالركوع',
          en:`If the imam is already bowing, say the opening takbeer while standing. Then bow. Saying a second takbeer as you bend is recommended.

Most scholars count the rak’ah if you reach the bow before the imam rises. You are excused from reciting Al-Fatihah when you missed the standing. If the imam rises before you reach the bow, follow him and make up that rak’ah after he finishes.

Enter the row before you bow. The Prophet ﷺ told Abu Bakrah to avoid repeating what he had done when he bowed before reaching the row.`,
          ar:`إذا وجدت الإمام راكعاً، فكبّر تكبيرة الإحرام قائماً ثم اركع. ويستحب أن تكبّر تكبيرة أخرى وأنت تهوي إلى الركوع.

عند جمهور العلماء تُحسب لك الركعة إذا بلغت حد الركوع قبل أن يرفع الإمام منه. وتُعذر عن قراءة الفاتحة هنا لفوات القيام. وإذا رفع الإمام قبل أن تبلغ حد الركوع، فتابعه وأتمّ تلك الركعة بعد سلامه.

ادخل في الصف قبل الركوع. ونَهى النبي ﷺ أبا بكرة عن تكرار ما فعله حين ركع قبل أن يصل إلى الصف.`,
          evidence:[evidence('Sahih al-Bukhari 783','زَادَكَ اللَّهُ حِرْصًا وَلَا تَعُدْ', 'May Allah increase your eagerness. Do not do that again.')],
          refs:[source('Al-Bukhari 783','البخاري ٧٨٣','https://sunnah.com/bukhari:783'), source('Ibn Baz · Entering in ruku‘','ابن باز · دخول المسبوق في الركوع','https://binbaz.org.sa/fatwas/4173/%D9%85%D9%86-%D8%AF%D8%AE%D9%84-%D9%88%D8%A7%D9%84%D8%A7%D9%85%D8%A7%D9%85-%D8%B1%D8%A7%D9%83%D8%B9-%D9%87%D9%84-%D9%8A%D9%83%D8%A8%D8%B1-%D9%84%D9%84%D8%A7%D8%AD%D8%B1%D8%A7%D9%85-%D8%A7%D9%85-%D9%84%D9%84%D8%B1%D9%83%D9%88%D8%B9'),
            source('Ibn ‘Uthaymin · When the bow counts','ابن عثيمين · إدراك حد الركوع',uthaymin+'12217'),
            source('Al-Fawzan · Entering in ruku‘','الفوزان · حكم من أدرك الإمام راكعاً','https://www.al-eman.com/%D8%A7%D9%84%D9%81%D8%AA%D8%A7%D9%88%D9%89/%D8%AD%D9%83%D9%85%20%D9%85%D9%86%20%D8%A3%D8%AF%D8%B1%D9%83%20%D8%A7%D9%84%D8%A3%D9%85%D8%A7%D9%85%20%D8%B1%D8%A7%D9%83%D8%B9%D8%A7/i7892%26rs%26p7'),
            source('Al-Albani · Al-Fatihah and joining in the bow','الألباني · الفاتحة وإدراك الركوع','https://www.al-albany.com/audios/content/150833/%D8%A5%D8%B0%D8%A7-%D8%AF%D8%AE%D9%84-%D8%A7%D9%84%D8%B1%D8%AC%D9%84-%D9%85%D8%B9-%D8%A7%D9%84%D8%A5%D9%85%D8%A7%D9%85-%D9%81%D9%8A-%D8%A7%D9%84%D8%B5%D9%84%D8%A7%D8%A9-%D9%88%D9%87%D9%88-%D8%B1%D8%A7%D9%83%D8%B9-%D9%81%D9%82%D8%AF-%D8%A3%D8%AF%D8%B1%D9%83-%D8%A7%D9%84%D8%B1%D9%83%D8%B9%D8%A9-%D9%84%D9%83%D9%86-%D9%83%D9%8A%D9%81-%D8%A7%D9%84%D8%AC%D9%85%D8%B9-%D8%A8%D9%8A%D9%86-%D9%87%D8%B0%D8%A7-%D9%88%D8%A8%D9%8A%D9%86-%D9%82%D9%88%D9%84-%D8%A7%D9%84%D9%86%D8%A8%D9%8A-%D8%B5%D9%84%D9%89-%D8%A7%D9%84%D9%84%D9%87-%D8%B9%D9%84%D9%8A%D9%87-%D9%88%D8%B3%D9%84%D9%85-%D9%83%D9%84-%D8%B5%D9%84%D8%A7%D8%A9-%D9%84%D8%A7-%D9%8A%D9%82%D8%B1%D8%A3-%D9%81%D9%8A%D9%87%D8%A7-%D8%A8%D8%A3%D9%85-%D8%A7%D9%84%D9%83%D8%AA%D8%A7%D8%A8-%D9%81%D9%87%D9%8A-%D8%AE%D8%AF%D8%A7%D8%AC'),
            source('IslamQA · Catching the bow','الإسلام سؤال وجواب · إدراك الركعة بإدراك الركوع','https://islamqa.info/en/answers/45494')],
          comparisons:[{
            title:'Does catching the bow count?', arTitle:'هل تُدرك الركعة بالركوع؟',
            views:[
              {
                title:'The majority view', arTitle:'قول الجمهور',
                en:'The rak’ah counts when you catch the imam in the bow. The standing and recitation have already passed.',
                ar:'تُحسب الركعة إذا أدركت الإمام في الركوع؛ لأن القيام والقراءة قد فاتاك.',
                refs:[source('Al-Bukhari 783 · The report of Abu Bakrah','البخاري ٧٨٣ · حديث أبي بكرة','https://sunnah.com/bukhari:783')]
              },
              {
                title:'A minority view', arTitle:'قول الأقل',
                en:'You need to catch the standing and recitation for the rak’ah to count. Scholars taking this view point out that the report about Abu Bakrah does not explicitly say he counted the rak’ah.',
                ar:'يُشترط إدراك القيام والقراءة لاحتساب الركعة. ويستدل أصحاب هذا القول بأن حديث أبي بكرة لا يصرّح باحتساب تلك الركعة.',
                refs:[source('Al-Shawkani · Nayl al-Awtar, Ibn Hazm’s argument','الشوكاني · نيل الأوطار، استدلال ابن حزم','https://ablibrary.net/book_content/b/1646/242?lang=ar')]
              }
            ]
          }]
        },
        {
          title:'Arriving late for Jumu‘ah', arTitle:'إدراك صلاة الجمعة',
          en:`If you catch the bow of the second rak’ah, you have caught Jumu‘ah. Complete one rak’ah after the imam’s salaam.

If you arrive after the imam has risen from that bow, join him with the intention of praying Dhuhr. Then stand after his salaam and complete Dhuhr. A resident prays four rak’ahs.`,
          ar:`إذا أدركت ركوع الركعة الثانية فقد أدركت الجمعة. فصلِّ ركعة واحدة بعد سلام الإمام.

إذا دخلت بعدما رفع الإمام من ركوع الثانية، فادخل معه بنية الظهر. ثم قم بعد سلامه وأتمّ صلاة الظهر. والمقيم يصلي أربع ركعات.`,
          evidence:[evidence('An-Nasa’i 1425','مَنْ أَدْرَكَ مِنْ صَلَاةِ الْجُمُعَةِ رَكْعَةً فَقَدْ أَدْرَكَ', 'Whoever catches one rak’ah of the Friday prayer has caught it.')],
          refs:[source('An-Nasa’i 1425','النسائي ١٤٢٥','https://sunnah.com/nasai:1425'), source('Al-Bukhari 580','البخاري ٥٨٠','https://sunnah.com/bukhari:580'),
            source('Ibn Taymiyyah · Majmu‘ al-Fatawa 23, catching Jumu‘ah','ابن تيمية · مجموع الفتاوى ٢٣، إدراك الجمعة',taymiyyah+'2899'),
            source('Ibn Baz · Catching only prostration at Jumu‘ah','ابن باز · من لم يدرك من الجمعة إلا السجود','https://binbaz.org.sa/fatwas/5101/%D9%84%D9%85-%D9%8A%D8%AF%D8%B1%D9%83-%D9%85%D9%86-%D8%A7%D9%84%D8%AC%D9%85%D8%B9%D8%A9-%D8%A7%D9%84%D8%A7-%D8%A7%D9%84%D8%B3%D8%AC%D9%88%D8%AF')]
        }
      ]
    },
    {
      id:'sujood-al-sahw', title:'Sujood al-sahw', arTitle:'سجود السهو',
      description:'What to do after adding, missing or doubting part of a prayer',
      arDescription:'ما العمل عند الزيادة أو النقص أو الشك في الصلاة؟',
      sections:[
        {
          title:'Two prostrations for a mistake', arTitle:'سجدتان لجبر السهو',
          en:`Sujood al-sahw means two prostrations for certain mistakes in prayer. If you realise you are standing in an extra rak’ah, sit down. If you forgot the first tashahhud and have already stood fully, carry on and prostrate twice before the salaam. If you gave the salaam too early and remember soon afterwards while still in wudu, complete what you missed.

A missing bow or prostration needs to be made up. If you remember during the prayer, go back to it and continue from there. If you have already reached its place in the next rak’ah, count that rak’ah in place of the incomplete one. Finish the prayer and do sujood al-sahw.`,
          ar:`سجود السهو سجدتان تُشرعان لبعض أخطاء الصلاة. إذا علمت أنك في ركعة زائدة فاجلس. وإذا نسيت التشهد الأول واستتممت قائماً، فاستمر واسجد سجدتين قبل السلام. وإذا سلّمت قبل تمام الصلاة ثم تذكّرت قريباً وأنت على وضوئك فأتمّ ما فاتك.

إذا نسيت ركوعاً أو سجوداً فتداركه. إن تذكّرته أثناء الصلاة فارجع إليه وأكمل من موضعه. وإن بلغت موضعه من الركعة التالية، فاجعل تلك الركعة مكان الناقصة، وأتمّ صلاتك واسجد للسهو.`,
          evidence:[evidence('Sahih al-Bukhari 829', 'سَجَدَ سَجْدَتَيْنِ قَبْلَ أَنْ يُسَلِّمَ ثُمَّ سَلَّمَ', 'He prostrated twice before giving the salaam, then gave the salaam.')],
          refs:[source('Al-Bukhari 829 · The first tashahhud','البخاري ٨٢٩ · نسيان التشهد الأول','https://sunnah.com/bukhari:829'),
            source('Ibn ‘Uthaymin · A missed prostration','ابن عثيمين · من ترك سجدة',uthaymin+'9501'),
            source('Al-Bukhari 482 · Ending the prayer early','البخاري ٤٨٢ · السلام قبل تمام الصلاة','https://sunnah.com/bukhari:482'),
            source('Al-Fawzan · Al-Mulakhkhas al-Fiqhi, sujood al-sahw','الفوزان · الملخص الفقهي، باب السجود للسهو',fawzanBook)]
        },
        {
          title:'Before or after the salaam?', arTitle:'قبل السلام أم بعده؟',
          en:`Scholars use these cases to explain when to do the two prostrations.

1. If you added something by mistake, such as an extra rak’ah, prostrate after the salaam.
2. If you left out the first tashahhud and carried on praying, prostrate before the salaam.
3. If one count seems more likely, finish the prayer using that count and prostrate after the salaam.
4. If you cannot tell which count is right, use the smaller number and prostrate before the salaam. If you are unsure whether you prayed three or four, count three and pray one more.

If you gave the salaam too early, finish what you missed and give the salaam. Then prostrate twice and give the salaam again. When you prostrate after the salaam, give the salaam again afterwards.`,
          ar:`يذكر العلماء هذه الحالات لبيان موضع سجدتي السهو.

1. إذا زدت سهواً، كركعة زائدة، فاسجد بعد السلام.
2. إذا نسيت التشهد الأول وأكملت الصلاة فاسجد قبل السلام.
3. إذا ترجّح عندك أحد العددين فأتمّ الصلاة بناءً عليه واسجد بعد السلام.
4. إذا لم يترجّح عندك أحد العددين، فابنِ على الأقل واسجد قبل السلام. فمن شك بين ثلاث وأربع ولم يرجّح، حسبها ثلاثاً وصلّى ركعة أخرى.

إذا سلّمت مبكراً فأتمّ ما فاتك وسلّم. ثم اسجد سجدتين وسلّم مرة أخرى. وإذا سجدت للسهو بعد السلام فسلّم بعد السجدتين.`,
          evidence:[
            evidence('Sahih Muslim 571a','فَلْيَطْرَحِ الشَّكَّ وَلْيَبْنِ عَلَى مَا اسْتَيْقَنَ، ثُمَّ يَسْجُدُ سَجْدَتَيْنِ قَبْلَ أَنْ يُسَلِّمَ', 'Set doubt aside and build on what is certain. Then prostrate twice before giving the salaam.'),
            evidence('Sahih al-Bukhari 401','فَلْيَتَحَرَّ الصَّوَابَ فَلْيُتِمَّ عَلَيْهِ، ثُمَّ لِيُسَلِّمْ، ثُمَّ يَسْجُدُ سَجْدَتَيْنِ', 'Work out what is most likely correct, complete the prayer on that basis, give the salaam and then prostrate twice.')
          ],
          refs:[source('Muslim 571a','مسلم ٥٧١','https://sunnah.com/muslim:571a'), source('Al-Bukhari 401','البخاري ٤٠١','https://sunnah.com/bukhari:401'),
            source('Ibn Taymiyyah · Majmu‘ al-Fatawa 23:24–25','ابن تيمية · مجموع الفتاوى ٢٣:٢٤–٢٥','https://www.islamweb.net/ar/library/content/22/2766/%D9%81%D8%B5%D9%84-%D9%85%D8%AD%D9%84-%D8%B3%D8%AC%D9%88%D8%AF-%D8%A7%D9%84%D8%B3%D9%87%D9%88'),
            source('Ibn ‘Uthaymin · Reasons and timing','ابن عثيمين · أسباب سجود السهو ومتى يسجد؟',uthaymin+'9387'),
            source('Ibn Baz · Before or after the salaam?','ابن باز · متى يكون سجود السهو قبل السلام أو بعده؟','https://binbaz.org.sa/fatwas/21216/%D9%85%D8%AA%D9%89-%D9%8A%D9%83%D9%88%D9%86-%D8%B3%D8%AC%D9%88%D8%AF-%D8%A7%D9%84%D8%B3%D9%87%D9%88-%D9%82%D8%A8%D9%84-%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85-%D8%A7%D9%88-%D8%A8%D8%B9%D8%AF%D9%87'),
            source('Al-Bukhari 1226 · Praying an extra rak’ah','البخاري ١٢٢٦ · زيادة ركعة','https://sunnah.com/bukhari:1226'),
            source('Ibn Baz · An added rak’ah','ابن باز · الحكم إذا أتى الإمام بركعة زائدة','https://binbaz.org.sa/fatwas/20294/%D8%A7%D9%84%D8%AD%D9%83%D9%85-%D8%A7%D8%B0%D8%A7-%D8%A7%D8%AA%D9%89-%D8%A7%D9%84%D8%A7%D9%85%D8%A7%D9%85-%D8%A8%D8%B1%D9%83%D8%B9%D8%A9-%D8%B2%D8%A7%D9%89%D8%AF%D8%A9'),
            source('Al-Fawzan · Doubting the count','الفوزان · الملخص الفقهي، الشك في عدد الركعات',fawzanBook),
            source('Al-Fawzan · Before or after the salaam?','الفوزان · موضع سجود السهو','https://baheth.ieasybooks.com/ar/media/%D9%85%D8%AA%D9%89-%D9%8A%D9%83%D9%88%D9%86-%D8%B3%D8%AC%D9%88%D8%AF-%D8%A7%D9%84%D8%B3%D9%87%D9%88-%D9%82%D8%A8%D9%84-%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85-%D9%88%D9%85%D8%AA%D9%89-%D9%8A%D9%83%D9%88%D9%86-%D8%A8%D8%B9%D8%AF%D9%87-%D8%A3%D8%B1%D8%AC%D9%88-%D8%A8%D9%8A%D8%A7%D9%86-%D8%B0%D9%84%D9%83-%D8%A7%D9%84%D8%B4%D9%8A%D8%AE-%D8%B5%D8%A7%D9%84%D8%AD-%D8%A8%D9%86-%D9%81%D9%88%D8%B2%D8%A7%D9%86-%D8%A7%D9%84%D9%81%D9%88%D8%B2%D8%A7%D9%86-8659a6e4-ee22-40b1-8b95-7bf3c3c33053?cue=13014560')],
          comparisons:[{
            title:'Differences about timing', arTitle:'الخلاف في موضع السجود',
            views:[
              {
                title:'Timing depends on the mistake', arTitle:'الموضع بحسب سبب السهو',
                en:'The cases above use different timings for an addition, an omission and two kinds of doubt.',
                ar:'تفصّل الحالات المذكورة بين الزيادة والنقص ونوعي الشك.',
                refs:[source('Ibn Taymiyyah · Where to perform sujood al-sahw','ابن تيمية · موضع سجود السهو',taymiyyah+'2766/فصل-محل-سجود-السهو'),
                  source('Ibn ‘Uthaymin · Reasons and timing','ابن عثيمين · أسباب سجود السهو',uthaymin+'11919')]
              },
              {
                title:'Before the salaam in most cases', arTitle:'قبل السلام في أكثر الحالات',
                en:'Scholars also allow the two prostrations before or after the salaam. Some prefer before in most cases, even after adding a rak’ah. They prefer after if you finished early and then made up what you missed, or if you followed the likelier count.',
                ar:'أجاز علماء السجود قبل السلام وبعده. وفضّل بعضهم السجود قبله في أكثر الحالات ولو زاد ركعة، وبعده لمن سلّم مبكراً ثم أتمّ ما فاته أو بنى على غالب ظنه.',
                refs:[source('Ibn Baz · Before or after the salaam?','ابن باز · متى يكون سجود السهو؟','https://binbaz.org.sa/fatwas/21216/متى-يكون-سجود-السهو-قبل-السلام-او-بعده')]
              },
              {
                title:'Use the lower number when in doubt', arTitle:'البناء على الأقل عند الشك',
                en:'Some scholars tell you to use the lower, certain number when the count is in doubt, then prostrate before the salaam.',
                ar:'يرى بعض العلماء عند الشك في عدد الركعات البناء على العدد الأقل المتيقّن، ثم السجود قبل السلام.',
                refs:[source('Al-Fawzan · Doubting the count','الفوزان · الشك في عدد الركعات',fawzanBook)]
              }
            ]
          }]
        },
        {
          title:'When you are following an imam', arTitle:'سجود السهو خلف الإمام',
          en:`If you prayed all the rak’ahs with the imam, follow him in both prostrations, before or after the salaam.

If you joined late and the imam prostrates before his salaam, prostrate with him, then finish what you missed. Scholars give different advice for a latecomer when the imam prostrates after his salaam.`,
          ar:`إذا أدركت الصلاة كلها مع الإمام، فتابعه في سجدتي السهو قبل السلام أو بعده.

إذا دخلت متأخراً وسجد الإمام قبل سلامه، فاسجد معه ثم أتمّ ما فاتك. وللعلماء تفصيل في سجود المسبوق إذا سجد الإمام بعد السلام.`,
          evidence:[evidence('Sahih Muslim 414a','إِنَّمَا جُعِلَ الْإِمَامُ لِيُؤْتَمَّ بِهِ … وَإِذَا سَجَدَ فَاسْجُدُوا', 'The imam is there to be followed … When he prostrates, prostrate.')],
          refs:[source('Muslim 414a','مسلم ٤١٤','https://sunnah.com/muslim:414a')],
          comparisons:[{
            title:'If you joined late', arTitle:'سجود المسبوق',
            views:[
              {
                title:'Finish your own prayer first if the imam prostrates after his salaam', arTitle:'تُتمّ صلاتك إذا سجد الإمام بعد سلامه',
                en:'If the imam prostrated before his salaam and made the mistake while you were with him, prostrate twice again before your own salaam. If he prostrated after his salaam, complete your prayer first. Then prostrate after your own salaam and give the salaam again if you were there when the mistake happened. A mistake from before you joined calls for no separate prostrations under this view.',
                ar:'إذا سجد الإمام قبل سلامه ووقع سهوه وأنت معه، فأعد السجدتين قبل سلامك. وإذا سجد بعد سلامه، فأتمّ صلاتك أولاً. فإن وقع سهوه وأنت معه فاسجد بعد سلامك ثم سلّم. والسهو الذي وقع قبل دخولك لا يلزمك له سجود مستقل على هذا القول.',
                refs:[source('Ibn ‘Uthaymin · Prostrations when you joined late','ابن عثيمين · أحوال المسبوق في سجود السهو',uthaymin+'576')]
              },
              {
                title:'Follow the imam if you are still sitting', arTitle:'تابع الإمام إن بقيت جالساً',
                en:'If the imam prostrates after his salaam while you are still sitting, prostrate with him, then get up and complete your prayer. If you had already stood fully, finish your prayer and do the prostrations at the end.',
                ar:'إذا سجد الإمام بعد السلام وأنت لا تزال جالساً، فاسجد معه ثم قم فأتمّ صلاتك. وإن كنت قد استتممت قائماً، فأتمّ صلاتك واسجد للسهو في آخرها.',
                refs:[source('Ibn Baz · Prostrations after the imam’s salaam','ابن باز · سجود المسبوق مع الإمام بعد السلام','https://binbaz.org.sa/fatwas/8755/حكم-سجود-المسبوق-للسهو-مع-الامام-بعد-السلام')]
              }
            ]
          }]
        }
      ]
    },
    {
      id:'ghusl', title:'Ghusl', arTitle:'الغُسل',
      description:'How to do a full wash for prayer',
      arDescription:'الغسل المجزئ وصفة الغسل الكامل',
      sections:[
        {
          title:'The minimum for ghusl', arTitle:'الغسل المجزئ',
          en:`Ghusl is a full wash for prayer. Make the intention in your heart. Let water reach all your skin and the roots of your hair. Rinse your mouth and nose as part of the wash.

If you are doing ghusl to purify yourself after janabah, you can intend it to count for wudu as well. For a shower just to get clean, do wudu separately before you pray. If something breaks wudu during or after ghusl, renew your wudu.`,
          ar:`الغسل طهارة تشمل البدن كله للصلاة. انوِ الغسل بقلبك، وأوصل الماء إلى جميع البشرة وأصول الشعر. وتمضمض واستنشق في الغسل.

إذا اغتسلت من الجنابة، فلك أن تنوي رفع الحدث الأكبر والأصغر معاً. وإذا استحممت لمجرد التنظّف، فتوضأ للصلاة. وإذا حصل ناقض للوضوء أثناء الغسل أو بعده فتوضأ من جديد.`,
          evidence:[evidence('Qur’an 5:6','وَإِنْ كُنْتُمْ جُنُبًا فَاطَّهَّرُوا', 'If you are in a state of janabah, purify yourselves by washing.')],
          refs:[source('Al-Ma’idah 5:6','المائدة ٦','https://quran.com/5/6'), source('Ibn ‘Uthaymin · Minimum and complete washing','ابن عثيمين · الصفة المجزئة والكاملة',uthaymin+'821'),
            source('Ibn Baz · When ghusl counts as wudu','ابن باز · متى يجزئ الغسل عن الوضوء؟','https://binbaz.org.sa/fatwas/3807/الغسل-من-الجنابة-وغيرها-هل-يجزى-عن-الوضوء'),
            source('Muhammad ibn Shams al-Din · Ghusl and bathing','محمد بن شمس الدين · أحكام الاستحمام','https://mshmsdin.com/ar/7930'),
            source('Ibn Taymiyyah · Majmu‘ al-Fatawa 21:299, ghusl and wudu','ابن تيمية · مجموع الفتاوى ٢١:٢٩٩','https://www.islamweb.net/ar/library/content/22/2297/%D9%85%D8%B3%D8%A3%D9%84%D8%A9-%D8%A7%D8%BA%D8%AA%D8%B3%D9%84-%D9%88%D9%84%D9%85-%D9%8A%D8%AA%D9%88%D8%B6%D8%A3-%D9%81%D9%87%D9%84-%D9%8A%D8%AC%D8%B2%D9%8A%D9%87-%D8%B0%D9%84%D9%83')],
          comparisons:[
            {
              title:'Rinsing the mouth and nose', arTitle:'المضمضة والاستنشاق',
              views:[
                {
                  title:'Hanbali school', arTitle:'الحنابلة',
                  en:'Rinsing the mouth and nose is required for ghusl. Scholars taking this view include rinsing as part of washing the whole body.',
                  ar:'المضمضة والاستنشاق واجبان في الغسل. ويعدّ العلماء على هذا القول المضمضة والاستنشاق من غسل البدن.',
                  refs:[source('Dorar · Rinsing in ghusl','الدرر السنية · المضمضة والاستنشاق في الغسل','https://dorar.net/feqhia/487'),
                    source('Al-Bukhari 257','البخاري ٢٥٧','https://sunnah.com/bukhari:257')]
                },
                {
                  title:'Maliki and Shafi‘i schools', arTitle:'المالكية والشافعية',
                  en:'Rinsing the mouth and nose is Sunnah. Ghusl is still valid if you omit the rinses and complete the required washing.',
                  ar:'المضمضة والاستنشاق سنتان. ويصح الغسل بتركهما إذا أتيت بما يجب غسله.',
                  refs:[source('IslamWeb 175171 · Rinsing in ghusl and wudu','إسلام ويب ١٧٥١٧١ · المضمضة والاستنشاق في الغسل والوضوء','https://www.islamweb.net/ar/fatwa/print.php?id=175171')]
                }
              ]
            }
          ]
        },
        {
          title:'The fuller Sunnah wash', arTitle:'صفة الغسل الكامل',
          en:`Wash your hands and clean yourself where needed. Do wudu as for prayer. Wet the roots of your hair, pour water over your head three times, then wash the rest of your body, starting on the right. You can wash your feet at the end, as in one of the reports.

You can use a shower for ghusl. Make the intention and let the water reach your whole body.`,
          ar:`اغسل كفيك ونظّف موضع الأذى، ثم توضّأ وضوء الصلاة. خلّل أصول الشعر بالماء، وصبّ على رأسك الماء ثلاث مرات، ثم اغسل بقية بدنك مبتدئاً بالجانب الأيمن. ولك أن تغسل قدميك في آخر الغسل كما جاء في إحدى الروايات.

يصح الغسل تحت الدش بالنية ووصول الماء إلى جميع البدن.`,
          evidence:[evidence('Sahih al-Bukhari 248','ثُمَّ يَتَوَضَّأُ كَمَا يَتَوَضَّأُ لِلصَّلَاةِ … ثُمَّ يُفِيضُ الْمَاءَ عَلَى جِلْدِهِ كُلِّهِ', 'He then performed wudu as he did for prayer … then poured water over all his skin.')],
          refs:[source('Al-Bukhari 248','البخاري ٢٤٨','https://sunnah.com/bukhari:248'), source('Al-Bukhari 257','البخاري ٢٥٧','https://sunnah.com/bukhari:257'), source('Ibn Baz · How to perform ghusl','ابن باز · صفة الغسل من الجنابة','https://binbaz.org.sa/fatwas/13710/%D8%B5%D9%81%D8%A9-%D8%A7%D9%84%D8%BA%D8%B3%D9%84-%D9%85%D9%86-%D8%A7%D9%84%D8%AC%D9%86%D8%A7%D8%A8%D8%A9'),
            source('Al-Fawzan · Explanation of ghusl','الفوزان · شرح أحكام الغسل','https://baheth.ieasybooks.com/en/media/10-%D9%85%D9%86-220-%D8%B4%D8%B1%D8%AD-%D8%A7%D9%84%D9%85%D9%84%D8%AE%D8%B5-%D8%A7%D9%84%D9%81%D9%82%D9%87%D9%8A-%D8%A7%D9%84%D8%B7%D9%87%D8%A7%D8%B1%D8%A9-%D9%81%D9%8A-%D8%A3%D8%AD%D9%83%D8%A7%D9%85-%D8%A7%D9%84%D8%BA%D8%B3%D9%84-%D8%B5%D8%A7%D9%84%D8%AD-%D8%A7%D9%84%D9%81%D9%88%D8%B2%D8%A7%D9%86-%D9%81%D9%82%D9%87-%D9%83%D8%A8%D8%A7%D8%B1-%D8%A7%D9%84%D8%B9%D9%84%D9%85%D8%A7%D8%A1-36aab582-4543-49e4-8e29-d3db079ea362')]
        }
      ]
    },
    {
      id:'praying-while-ill', title:'Praying while ill or unable to stand', arTitle:'صلاة المريض ومن لا يستطيع القيام',
      description:'Which positions to use when illness limits your prayer',
      arDescription:'هيئة الصلاة عند العجز عن القيام أو السجود',
      sections:[
        {
          title:'Pray according to your ability', arTitle:'الصلاة حسب الاستطاعة',
          en:`Stand for an obligatory prayer if you can, using a support if needed. If standing is very hard or you reasonably fear it will make the illness worse, pray sitting. You can sit cross-legged during the parts you usually pray standing, or sit another way you can manage.

If you cannot sit, pray on your side, preferably your right if suitable. If you cannot lie on your side, pray on your back. Face the Qibla as far as you can. If you can stand for recitation but need to sit for another movement, do each part as you are able.`,
          ar:`صلِّ الفريضة قائماً إن استطعت، ولو مع الاعتماد على شيء. فإن شقّ القيام مشقة ظاهرة أو خفت أن يزيد المرض، فصلّ جالساً. لك أن تتربّع في موضع القيام، أو تجلس على هيئة أخرى تقدر عليها.

إذا عجزت عن الجلوس فصلِّ على جنبك، والأيمن أفضل إن تيسّر. فإن عجزت عن الصلاة على جنبك فصلِّ على ظهرك. واستقبل القبلة بحسب استطاعتك. فإذا قدرت على القيام للقراءة واحتجت إلى الجلوس في موضع آخر، فافعل كل جزء بحسب استطاعتك.`,
          evidence:[evidence('Sahih al-Bukhari 1117','صَلِّ قَائِمًا، فَإِنْ لَمْ تَسْتَطِعْ فَقَاعِدًا، فَإِنْ لَمْ تَسْتَطِعْ فَعَلَى جَنْبٍ', 'Pray standing. If you cannot, pray sitting. If you cannot do that, pray on your side.')],
          refs:[source('Al-Bukhari 1117','البخاري ١١١٧','https://sunnah.com/bukhari:1117'), source('Ibn Baz · How the sick person prays','ابن باز · صفة صلاة المريض','https://binbaz.org.sa/fatwas/9426/%D8%B5%D9%81%D8%A9-%D8%B5%D9%84%D8%A7%D8%A9-%D8%A7%D9%84%D9%85%D8%B1%D9%8A%D8%B6'),
            source('Ibn ‘Uthaymin · Purification and prayer for the sick','ابن عثيمين · كيفية وضوء المريض وصلاته',uthaymin+'8384'),
            source('Al-Fawzan · Prayer of those with excuses','الفوزان · باب صلاة أهل الأعذار','https://al-sunan.org/vb/showpost.php?p=24604&postcount=20')]
        },
        {
          title:'Bowing, prostrating and keeping the time', arTitle:'الركوع والسجود وأداء الصلاة في وقتها',
          en:`Bow and prostrate as far as you are able. If you cannot do one of those movements, tilt your head for it. Tilt lower for prostration than for bowing. If your ability changes during the prayer, move to the position you can manage.

Use water to prepare for prayer if you can use it safely. See Tayammum and Without purification materials if you cannot. Pray on time as best you can. If illness makes separate times very hard, scholars allow combining Dhuhr with Asr or Maghrib with Isha. Pray the full number of rak’ahs when you are at home.`,
          ar:`اركع واسجد بقدر استطاعتك. إذا عجزت عن أحدهما فأومئ برأسك له، واجعل إيماء السجود أخفض من الركوع. وإذا تغيّرت قدرتك أثناء الصلاة فانتقل إلى الهيئة التي تقدر عليها.

تطهّر بالماء إن أمكنك استعماله دون ضرر. وإذا عجزت، فانظر درس التيمم ودرس فاقد الطهورين. صلِّ في الوقت بحسب استطاعتك. وإذا شقّ على المريض أداء كل صلاة في وقتها، أجاز العلماء جمع الظهر مع العصر أو المغرب مع العشاء. والمقيم يتمّ عدد الركعات.`,
          evidence:[evidence('Qur’an 64:16','فَاتَّقُوا اللَّهَ مَا اسْتَطَعْتُمْ', 'Be mindful of Allah to the best of your ability.')],
          refs:[source('At-Taghabun 64:16','التغابن ١٦','https://quran.com/64/16'),
            source('Dorar · Combining prayers during illness','الدرر السنية · الجمع في المرض','https://dorar.net/feqhia/1530'), source('Ibn Taymiyyah · Majmu‘ al-Fatawa, vol. 24','ابن تيمية · مجموع الفتاوى، المجلد ٢٤','https://ar.wikisource.org/wiki/%D9%85%D8%AC%D9%85%D9%88%D8%B9_%D8%A7%D9%84%D9%81%D8%AA%D8%A7%D9%88%D9%89/%D8%A7%D9%84%D9%85%D8%AC%D9%84%D8%AF_%D8%A7%D9%84%D8%B1%D8%A7%D8%A8%D8%B9_%D9%88%D8%A7%D9%84%D8%B9%D8%B4%D8%B1%D9%88%D9%86'),
            source('Ibn ‘Uthaymin · Purification and prayer for the sick','ابن عثيمين · كيفية وضوء المريض وصلاته',uthaymin+'8384')]
        }
      ]
    },
    {
      id:'night-prayer', title:'Night prayer and Witr', arTitle:'قيام الليل والوتر',
      description:'When to pray, how to finish and what to do if you wake after Witr',
      arDescription:'وقت القيام وكيفية الوتر وما العمل إذا استيقظت بعده',
      sections:[
        {
          title:'When to pray Witr', arTitle:'وقت الوتر',
          en:`Pray Witr after you have prayed Isha and before true dawn, when Fajr begins. Witr is a prayer with an odd number of rak’ahs. Pray it near the end of the night if you expect to wake up. If you might sleep through it, pray it before bed.

The last third begins once two thirds of the time from Maghrib to the next Fajr have passed.`,
          ar:`صلِّ الوتر بعد صلاة العشاء وقبل طلوع الفجر الصادق. والوتر صلاة بعدد فردي من الركعات. إن كنت ترجو الاستيقاظ فالأفضل أن تؤخّره إلى آخر الليل، وإن خشيت ألّا تستيقظ فأوتر قبل نومك.

يبدأ الثلث الأخير بعد مضي ثلثي المدة من المغرب إلى الفجر التالي.`,
          evidence:[evidence('Sahih Muslim 755a','مَنْ خَافَ أَنْ لَا يَقُومَ مِنْ آخِرِ اللَّيْلِ فَلْيُوتِرْ أَوَّلَهُ، وَمَنْ طَمِعَ أَنْ يَقُومَ آخِرَهُ فَلْيُوتِرْ آخِرَ اللَّيْلِ', 'Whoever fears they will not get up towards the end of the night should pray Witr early. Whoever expects to get up should pray Witr towards its end.')],
          refs:[source('Muslim 755a','مسلم ٧٥٥','https://sunnah.com/muslim:755a'), source('Muslim 754b · Witr before dawn','مسلم ٧٥٤ · الوتر قبل الصبح','https://sunnah.com/muslim:754b'), source('Ibn ‘Uthaymin · Witr early or late','ابن عثيمين · الوتر أول الليل أو آخره',uthaymin+'9765'),
            source('Ibn Taymiyyah · Majmu‘ al-Fatawa 23:88–93','ابن تيمية · مجموع الفتاوى ٢٣:٨٨–٩٣','https://quranislam.github.io/fatwa/ibn-taymiyyah/fatwa345.html')]
        },
        {
          title:'Two at a time, then finish with Witr', arTitle:'مثنى مثنى ثم الوتر',
          en:`Pray the night prayer in pairs of two rak’ahs, giving the salaam after each pair. Finish with one rak’ah for Witr. The Sunnah also describes other ways to pray Witr, including five or seven rak’ahs with the salaam at the end.

If you prayed Witr and wake again later, you can pray more pairs. Keep the Witr you already prayed.`,
          ar:`صلِّ قيام الليل ركعتين ركعتين، وسلّم بعد كل ركعتين. واختم بركعة توتر بها. وفي السنة صفات أخرى للوتر، منها الإيتار بخمس أو سبع ركعات بتسليم في آخرها.

إذا أوترت ثم استيقظت آخر الليل، فلك أن تصلي ركعتين ركعتين، وتكتفي بالوتر الذي صلّيته.`,
          evidence:[
            evidence('Sahih al-Bukhari 990','صَلَاةُ اللَّيْلِ مَثْنَى مَثْنَى، فَإِذَا خَشِيَ أَحَدُكُمُ الصُّبْحَ صَلَّى رَكْعَةً وَاحِدَةً', 'Night prayer is offered two by two. If you fear dawn is near, pray one rak’ah.'),
            evidence('Jami‘ al-Tirmidhi 470','لَا وِتْرَانِ فِي لَيْلَةٍ', 'There are no two Witr prayers in one night.')
          ],
          refs:[source('Al-Bukhari 990','البخاري ٩٩٠','https://sunnah.com/bukhari:990'), source('Al-Tirmidhi 470','الترمذي ٤٧٠','https://sunnah.com/tirmidhi:470'),
            source('Ibn Baz · Waking after Witr','ابن باز · من أوتر أول الليل ثم قام آخره','https://binbaz.org.sa/fatwas/4237/%D9%83%D9%8A%D9%81-%D9%8A%D8%B5%D9%84%D9%8A-%D9%85%D9%86-%D8%A7%D9%88%D8%AA%D8%B1-%D8%A7%D9%88%D9%84-%D8%A7%D9%84%D9%84%D9%8A%D9%84-%D9%88%D9%82%D8%A7%D9%85-%D8%A7%D8%AE%D8%B1%D9%87'),
            source('Ibn ‘Uthaymin · Waking after Witr','ابن عثيمين · أوتر ثم استيقظ آخر الليل',uthaymin+'9765'),
            source('Al-Fawzan · Two Witr prayers in one night','الفوزان · حكم صلاة وترين في ليلة','https://al-fatawa.com/fatwa/99828/%D8%AD%D9%83%D9%85-%D8%B5%D9%84%D8%A7%D8%A9-%D9%88%D8%AA%D8%B1%D9%8A%D9%86-%D9%81%D9%8A-%D9%84%D9%8A%D9%84%D8%A9-%D8%A7%D9%84%D9%81%D9%88%D8%B2%D8%A7%D9%86')]
        },
        {
          title:'If you slept through Witr', arTitle:'قضاء الوتر لمن نام عنه',
          en:`You can make up your regular night prayer during Duha, the part of the morning after the sun has risen sufficiently and before midday. Pray an even number of rak’ahs. If you normally pray three, pray four as two pairs.

Scholars differ on whether you can make up Witr itself just after dawn and before praying Fajr.`,
          ar:`لك أن تقضي ما اعتدت من صلاة الليل في وقت الضحى، بعد ارتفاع الشمس وقبل الزوال. صلِّ عدداً زوجياً من الركعات. فمن اعتاد ثلاثاً صلى أربعاً، يسلّم من كل ركعتين.

واختلف العلماء في قضاء الوتر نفسه بعد طلوع الفجر وقبل أداء صلاة الفجر.`,
          evidence:[evidence('Sahih Muslim 746a','وَكَانَ إِذَا غَلَبَهُ نَوْمٌ أَوْ وَجَعٌ عَنْ قِيَامِ اللَّيْلِ صَلَّى مِنَ النَّهَارِ ثِنْتَيْ عَشْرَةَ رَكْعَةً', 'When sleep or illness kept him from the night prayer, he prayed twelve rak’ahs in the daytime.')],
          refs:[source('Muslim 746a','مسلم ٧٤٦','https://sunnah.com/muslim:746a'), source('Ibn Baz · Making up Witr','ابن باز · حكم قضاء الوتر','https://binbaz.org.sa/fatwas/20357/%D8%AD%D9%83%D9%85-%D9%82%D8%B6%D8%A7%D8%A1-%D8%A7%D9%84%D9%88%D8%AA%D8%B1'),
            source('Ibn ‘Uthaymin · Making up Witr in daytime','ابن عثيمين · قضاء صلاة الوتر في النهار',uthaymin+'9229'),
            source('Dorar · The time for Witr','الدرر السنية · أول وقت الوتر وآخره','https://dorar.net/feqhia/1239')],
          comparisons:[{
            title:'If you wake after dawn', arTitle:'إذا استيقظت بعد طلوع الفجر',
            views:[
              {
                title:'Make up the night prayer later', arTitle:'تقضي قيام الليل نهاراً',
                en:'Wait for Duha and make up the regular night prayer in pairs. The report from Aishah describes making up night prayer in the daytime with an even number of rak’ahs.',
                ar:'انتظر الضحى ثم اقضِ وردك من صلاة الليل شفعاً. وفي حديث عائشة قضاء قيام الليل نهاراً بعدد زوجي من الركعات.',
                refs:[source('Ibn Baz · Making up Witr in Duha','ابن باز · قضاء الوتر في الضحى','https://binbaz.org.sa/fatwas/20357/حكم-قضاء-الوتر'),
                  source('Ibn ‘Uthaymin · Making up the night prayer','ابن عثيمين · قضاء الوتر في النهار',uthaymin+'9229')]
              },
              {
                title:'Make up Witr before praying Fajr', arTitle:'تقضي الوتر قبل أداء الفجر',
                en:'If sleep or forgetfulness made you miss Witr, some scholars allow you to make it up after dawn before the obligatory Fajr prayer, if there is time.',
                ar:'إذا فاتك الوتر لنوم أو نسيان، أجاز بعض العلماء قضاءه بعد طلوع الفجر وقبل أداء فريضة الفجر إن اتّسع الوقت.',
                refs:[source('Ibn Taymiyyah · Majmu‘ al-Fatawa 23:89–91','ابن تيمية · مجموع الفتاوى ٢٣:٨٩–٩١','https://www.islamweb.net/ar/library/content/22/2802/مسألة-من-نام-عن-صلاة-الوتر')]
              }
            ]
          }]
        }
      ]
    }
  );
})();
