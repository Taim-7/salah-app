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
          en:`Walk to prayer calmly, even when it has started. Join the row, say the opening takbeer while standing if able, and then follow the imam in his present position. Join him if he is prostrating or sitting. That position alone does not count as a rak’ah.

Ibn Baz treats the part you catch with the imam as the beginning of your own prayer. When the imam finishes, stand to complete the units you missed. For example, if you catch only the last rak’ah of Isha, you have prayed your first. Pray your second and sit for the first tashahhud, then complete your third and fourth.`,
          ar:`امش إلى الصلاة بسكينة ولو بدأت. ادخل في الصف وكبّر تكبيرة الإحرام قائماً إن استطعت، ثم تابع الإمام على الحال التي وجدته عليها، ولو كان ساجداً أو جالساً. ولا تُحسب ركعة بمجرد إدراك السجود أو الجلوس.

اختار ابن باز أن ما أدركته مع الإمام أول صلاتك. فإذا سلّم الإمام فقُم فأتمّ ما فاتك. فلو أدركت آخر ركعة من العشاء فهي الأولى لك، ثم تأتي بالثانية وتجلس للتشهد الأول، ثم تتم الثالثة والرابعة.`,
          evidence:[evidence('Sahih al-Bukhari 635', 'فَمَا أَدْرَكْتُمْ فَصَلُّوا، وَمَا فَاتَكُمْ فَأَتِمُّوا', 'Pray the part you catch and complete the part you missed.')],
          refs:[source('Al-Bukhari 635','البخاري ٦٣٥','https://sunnah.com/bukhari:635'), source('Ibn Baz · The latecomer’s first rak’ah','ابن باز · ما أول صلاة المسبوق؟','https://binbaz.org.sa/fatwas/15490/%D9%85%D8%A7-%D8%A7%D9%88%D9%84-%D8%B5%D9%84%D8%A7%D8%A9-%D8%A7%D9%84%D9%85%D8%B3%D8%A8%D9%88%D9%82')]
        },
        {
          title:'Catching the bow', arTitle:'إدراك الركعة بالركوع',
          en:`Ibn Baz, Ibn ‘Uthaymin and Al-Fawzan count the rak’ah if you reach a valid bow before the imam rises from bowing. Ibn Baz and Al-Fawzan explain that the latecomer is excused from Al-Fatihah in this case because the standing position has passed. Ibn ‘Uthaymin says the opening takbeer is said standing before you bend. A second takbeer as you go into the bow is preferable.

In the report of Abu Bakrah, the Prophet ﷺ did not order him to repeat the rak’ah. Abu Bakrah had bowed before he reached the row. Enter the row first, even if you miss the bow. If the imam rises before you reach the bow, follow him and complete that rak’ah after he finishes.

Al-Albani also counts the rak’ah. He takes the general evidence on Al-Fatihah to allow an exception here. Ibn Hazm takes a different view, recorded by Al-Shawkani. He requires catching the standing and recitation. He argues that the report of Abu Bakrah contains no express statement that the Prophet ﷺ counted that rak’ah, and applies the command to complete whatever you miss. This is the minority view.`,
          ar:`يحسب ابن باز وابن عثيمين والفوزان الركعة لمن بلغ حد الركوع قبل أن يرفع الإمام منه. وبيّن ابن باز والفوزان أن المسبوق يُعذر عن الفاتحة هنا لفوات القيام. وبيّن ابن عثيمين أن تكبيرة الإحرام تُقال في القيام قبل الانحناء، وأن تكبيرةً أخرى للركوع أفضل.

لم يأمر النبي ﷺ أبا بكرة بإعادة الركعة، وكان قد ركع قبل أن يصل إلى الصف. ادخل في الصف أولاً ولو فاتك الركوع. وإن رفع الإمام قبل بلوغك حد الركوع فتابعه ثم أتم تلك الركعة بعد سلامه.

ويحسب الألباني الركعة أيضاً، ويرى أن هذا الموضع مستثنى من عموم أحاديث الفاتحة. ونقل الشوكاني عن ابن حزم قولاً آخر، وهو اشتراط إدراك القيام والقراءة. ويرى أن حديث أبي بكرة ليس فيه تصريح بالاعتداد بتلك الركعة، ويأخذ بعموم الأمر بإتمام ما فات. وهذا قول الأقل.`,
          evidence:[evidence('Sahih al-Bukhari 783','زَادَكَ اللَّهُ حِرْصًا وَلَا تَعُدْ', 'May Allah increase your eagerness. Do not do that again.')],
          refs:[source('Al-Bukhari 783','البخاري ٧٨٣','https://sunnah.com/bukhari:783'), source('Ibn Baz · Entering in ruku‘','ابن باز · دخول المسبوق في الركوع','https://binbaz.org.sa/fatwas/4173/%D9%85%D9%86-%D8%AF%D8%AE%D9%84-%D9%88%D8%A7%D9%84%D8%A7%D9%85%D8%A7%D9%85-%D8%B1%D8%A7%D9%83%D8%B9-%D9%87%D9%84-%D9%8A%D9%83%D8%A8%D8%B1-%D9%84%D9%84%D8%A7%D8%AD%D8%B1%D8%A7%D9%85-%D8%A7%D9%85-%D9%84%D9%84%D8%B1%D9%83%D9%88%D8%B9'),
            source('Ibn ‘Uthaymin · When the bow counts','ابن عثيمين · إدراك حد الركوع',uthaymin+'12217'),
            source('Al-Fawzan · Entering in ruku‘','الفوزان · حكم من أدرك الإمام راكعاً','https://www.al-eman.com/%D8%A7%D9%84%D9%81%D8%AA%D8%A7%D9%88%D9%89/%D8%AD%D9%83%D9%85%20%D9%85%D9%86%20%D8%A3%D8%AF%D8%B1%D9%83%20%D8%A7%D9%84%D8%A3%D9%85%D8%A7%D9%85%20%D8%B1%D8%A7%D9%83%D8%B9%D8%A7/i7892%26rs%26p7'),
            source('Al-Albani · Al-Fatihah and joining in the bow','الألباني · الفاتحة وإدراك الركوع','https://www.al-albany.com/audios/content/150833/%D8%A5%D8%B0%D8%A7-%D8%AF%D8%AE%D9%84-%D8%A7%D9%84%D8%B1%D8%AC%D9%84-%D9%85%D8%B9-%D8%A7%D9%84%D8%A5%D9%85%D8%A7%D9%85-%D9%81%D9%8A-%D8%A7%D9%84%D8%B5%D9%84%D8%A7%D8%A9-%D9%88%D9%87%D9%88-%D8%B1%D8%A7%D9%83%D8%B9-%D9%81%D9%82%D8%AF-%D8%A3%D8%AF%D8%B1%D9%83-%D8%A7%D9%84%D8%B1%D9%83%D8%B9%D8%A9-%D9%84%D9%83%D9%86-%D9%83%D9%8A%D9%81-%D8%A7%D9%84%D8%AC%D9%85%D8%B9-%D8%A8%D9%8A%D9%86-%D9%87%D8%B0%D8%A7-%D9%88%D8%A8%D9%8A%D9%86-%D9%82%D9%88%D9%84-%D8%A7%D9%84%D9%86%D8%A8%D9%8A-%D8%B5%D9%84%D9%89-%D8%A7%D9%84%D9%84%D9%87-%D8%B9%D9%84%D9%8A%D9%87-%D9%88%D8%B3%D9%84%D9%85-%D9%83%D9%84-%D8%B5%D9%84%D8%A7%D8%A9-%D9%84%D8%A7-%D9%8A%D9%82%D8%B1%D8%A3-%D9%81%D9%8A%D9%87%D8%A7-%D8%A8%D8%A3%D9%85-%D8%A7%D9%84%D9%83%D8%AA%D8%A7%D8%A8-%D9%81%D9%87%D9%8A-%D8%AE%D8%AF%D8%A7%D8%AC'),
            source('Al-Shawkani · Nayl al-Awtar, Ibn Hazm’s argument','الشوكاني · نيل الأوطار، استدلال ابن حزم','https://ablibrary.net/book_content/b/1646/242?lang=ar')]
        },
        {
          title:'Arriving late for Jumu‘ah', arTitle:'إدراك صلاة الجمعة',
          en:`Ibn Taymiyyah and Ibn Baz say that you catch Friday prayer by catching at least one rak’ah. If you catch the bow of the second rak’ah, complete one rak’ah after the imam’s salaam. If you only catch a prostration or the final sitting, you have missed Jumu‘ah. Join the imam and pray the full Dhuhr prayer, with four rak’ahs for a resident.`,
          ar:`يرى ابن تيمية وابن باز أن الجمعة تُدرك بإدراك ركعة. فمن أدرك ركوع الثانية أتى بركعة بعد سلام الإمام. ومن لم يدرك إلا السجود أو التشهد فقد فاتته الجمعة. يدخل مع الإمام ويصلي ظهراً أربع ركعات إن كان مقيماً.`,
          evidence:[evidence('Sahih al-Bukhari 580','مَنْ أَدْرَكَ رَكْعَةً مِنَ الصَّلَاةِ فَقَدْ أَدْرَكَ الصَّلَاةَ', 'Whoever catches one rak’ah of the prayer has caught the prayer.')],
          refs:[source('Al-Bukhari 580','البخاري ٥٨٠','https://sunnah.com/bukhari:580'), source('Ibn Taymiyyah · Majmu‘ al-Fatawa 23, catching Jumu‘ah','ابن تيمية · مجموع الفتاوى ٢٣، إدراك الجمعة',taymiyyah+'2899'),
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
          en:`Sujood al-sahw consists of two prostrations for certain mistakes in prayer. If you realise you are standing in an extra rak’ah, sit down as soon as you realise. If you forget the first tashahhud and have already stood up fully, continue and prostrate twice before the salaam. If you gave the salaam early and remember soon afterwards while still in wudu, complete what you missed. Two prostrations alone do not replace a missing pillar such as a bow or a prostration. Correct the missing pillar or replace that rak’ah as appropriate.`,
          ar:`سجود السهو سجدتان تُشرعان لأسباب من الزيادة أو النقص أو الشك. من علم وهو في ركعة زائدة جلس فوراً. ومن نسي التشهد الأول واستتم قائماً مضى وسجد سجدتين قبل السلام. ومن سلّم قبل تمام صلاته ثم تذكّر قريباً وهو على وضوئه أتم ما فاته. ولا يقوم سجود السهو وحده مقام ركن متروك كالركوع أو السجود، بل يُتدارك الركن أو تُعوَّض الركعة بحسب الحال.`,
          evidence:[evidence('Sahih al-Bukhari 829', 'سَجَدَ سَجْدَتَيْنِ قَبْلَ أَنْ يُسَلِّمَ ثُمَّ سَلَّمَ', 'He prostrated twice before giving the salaam, then gave the salaam.')],
          refs:[source('Al-Bukhari 829 · The first tashahhud','البخاري ٨٢٩ · نسيان التشهد الأول','https://sunnah.com/bukhari:829'),
            source('Al-Bukhari 482 · Ending the prayer early','البخاري ٤٨٢ · السلام قبل تمام الصلاة','https://sunnah.com/bukhari:482'),
            source('Al-Fawzan · Al-Mulakhkhas al-Fiqhi, sujood al-sahw','الفوزان · الملخص الفقهي، باب السجود للسهو',fawzanBook)]
        },
        {
          title:'Before or after the salaam?', arTitle:'قبل السلام أم بعده؟',
          en:`Ibn Taymiyyah and Ibn ‘Uthaymin gave these four cases.

1. If you added something by mistake, such as an extra rak’ah, prostrate after the salaam.
2. If you left out a duty such as the first tashahhud, prostrate before the salaam.
3. If you are unsure how many rak’ahs you have prayed and one number seems more likely, finish the prayer using that number and prostrate after the salaam.
4. If you have no idea which number is right, use the smaller number and prostrate before the salaam. If you are stuck between three and four, count three and pray one more.

If you gave the salaam too early, Ibn ‘Uthaymin treats that extra salaam as an addition. If you remember soon afterwards and still have wudu, finish praying and give the salaam. Then prostrate twice and give the salaam again.

Ibn Baz allows the prostrations on either side of the salaam. He prefers before in most cases, including an extra rak’ah, and after when you ended the prayer early and completed it, or when you followed the more likely count. Al-Fawzan gives the example of someone who notices an added rak’ah while still praying and directs them to sit and prostrate before the salaam. In a direct answer he also explains that both timings have evidence, including after the salaam in the case of ending early and then completing the prayer. On doubt about the count, his Al-Mulakhkhas al-Fiqhi instructs the reader to use the lower, certain number and prostrate before the salaam.

The command to work out the most likely count and the command to use certainty are both in authentic reports. Ibn Taymiyyah and Ibn ‘Uthaymin apply them to two different kinds of doubt. The extra-rak’ah report also gives a direct example of prostrations after the salaam, which the scholars differ on treating as the preferred timing in every case of addition.`,
          ar:`فرّق ابن تيمية وابن عثيمين بين أربع حالات.

1. إذا زدت شيئاً سهواً، كركعة زائدة، فاسجد بعد السلام.
2. إذا تركت واجباً كالتشهد الأول، فاسجد قبل السلام.
3. إذا شككت في عدد الركعات ورجّحت أحد العددين، فأتم الصلاة على ما ترجّح واسجد بعد السلام.
4. إذا لم تترجّح عندك زيادة ولا نقص، فابنِ على العدد الأقل واسجد قبل السلام. فمن تردد بين الثلاث والأربع بلا ترجيح جعلها ثلاثاً وأتى بركعة.

إذا سلّمت قبل تمام الصلاة، عدّ ابن عثيمين هذا السلام زيادة في الصلاة. فإن تذكرت قريباً وأنت على وضوء فأتم صلاتك وسلّم، ثم اسجد سجدتين وسلّم مرة أخرى.

ويجيز ابن باز السجود قبل السلام وبعده. ويفضل تقديمه في أكثر الأحوال، ومنها زيادة ركعة، وتأخيره عند السلام عن نقص ثم إتمام الصلاة، أو عند البناء على غالب الظن. وذكر الفوزان فيمن تنبه أثناء ركعة زائدة أن يجلس ويسجد قبل السلام. وبيّن في جواب له ثبوت السجود في الموضعين، ومن أمثلة تأخيره السلام عن نقص ثم إكمال الصلاة. وفي الشك في العدد ذكر في الملخص الفقهي البناء على الأقل المتيقن والسجود قبل السلام.

ثبت الأمر بالتحري وثبت الأمر بالبناء على اليقين. وحمل ابن تيمية وابن عثيمين كل حديث على حال من أحوال الشك. وثبت في حديث الركعة الزائدة السجود بعد السلام، واختلف العلماء هل هو الأفضل في كل زيادة.`,
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
            source('Al-Fawzan · Before or after the salaam?','الفوزان · موضع سجود السهو','https://baheth.ieasybooks.com/ar/media/%D9%85%D8%AA%D9%89-%D9%8A%D9%83%D9%88%D9%86-%D8%B3%D8%AC%D9%88%D8%AF-%D8%A7%D9%84%D8%B3%D9%87%D9%88-%D9%82%D8%A8%D9%84-%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85-%D9%88%D9%85%D8%AA%D9%89-%D9%8A%D9%83%D9%88%D9%86-%D8%A8%D8%B9%D8%AF%D9%87-%D8%A3%D8%B1%D8%AC%D9%88-%D8%A8%D9%8A%D8%A7%D9%86-%D8%B0%D9%84%D9%83-%D8%A7%D9%84%D8%B4%D9%8A%D8%AE-%D8%B5%D8%A7%D9%84%D8%AD-%D8%A8%D9%86-%D9%81%D9%88%D8%B2%D8%A7%D9%86-%D8%A7%D9%84%D9%81%D9%88%D8%B2%D8%A7%D9%86-8659a6e4-ee22-40b1-8b95-7bf3c3c33053?cue=13014560')]
        },
        {
          title:'When you are following an imam', arTitle:'سجود السهو خلف الإمام',
          en:`If you prayed all the rak’ahs with the imam, follow him in the two prostrations, whether he does them before or after the salaam. If you joined late, check when the imam prostrates.

1. Before his salaam. Prostrate with him, then complete the rak’ahs you missed. Ibn ‘Uthaymin says that if the mistake happened while you were praying with the imam, prostrate twice again before your own salaam. If it happened before you joined, following the imam was enough.
2. After his salaam. Ibn ‘Uthaymin says to finish your own prayer first. If you were with the imam when the mistake happened, prostrate after your own salaam and then give the salaam again. If the mistake happened before you joined, you have no prostrations to do for it.

Ibn Baz gives a different instruction for prostrations after the imam’s salaam. If the imam prostrates while you are still sitting, follow him and then stand to complete your prayer. If you have already stood fully, finish your prayer and make your prostrations at the end.`,
          ar:`إذا أدركت الصلاة كلها مع الإمام فتابعه في سجود السهو، سواء سجد قبل السلام أو بعده. وإن كنت مسبوقاً وعليك ركعات تتمها، فانظر متى سجد الإمام.

1. قبل سلامه. اسجد معه ثم أتم ما فاتك. وعند ابن عثيمين، إذا وقع سهو الإمام وأنت معه، فأعد سجدتي السهو قبل سلامك. وإن وقع قبل دخولك معه فيكفيك أن تسجد معه.
2. بعد سلامه. يرى ابن عثيمين أن تتم صلاتك أولاً. فإن وقع سهو الإمام وأنت معه فاسجد بعد سلامك ثم سلّم مرة أخرى. وإن وقع قبل دخولك معه فلا سجود عليك له.

وعند ابن باز، إذا سجد الإمام بعد السلام وأنت لا تزال جالساً، فاسجد معه ثم قم وأتم صلاتك. وإن كنت قد استتممت قائماً، فأتم صلاتك واسجد للسهو في آخرها.`,
          evidence:[evidence('Sahih Muslim 414a','إِنَّمَا جُعِلَ الْإِمَامُ لِيُؤْتَمَّ بِهِ … وَإِذَا سَجَدَ فَاسْجُدُوا', 'The imam is there to be followed … When he prostrates, prostrate.')],
          refs:[source('Muslim 414a','مسلم ٤١٤','https://sunnah.com/muslim:414a'), source('Ibn ‘Uthaymin · Prostrations when you joined late','ابن عثيمين · أحوال المسبوق في سجود السهو',uthaymin+'576'),
            source('Ibn Baz · Prostrations after the imam’s salaam', 'ابن باز · سجود المسبوق مع الإمام بعد السلام', 'https://binbaz.org.sa/fatwas/8755/حكم-سجود-المسبوق-للسهو-مع-الامام-بعد-السلام')]
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
          en:`Ghusl is a full wash for prayer. Make the intention in your heart, then wash your whole body. Let water reach all your skin and the roots of your hair.

Rinse your mouth and nose as part of the wash. Scholars differ on whether these rinses are required.

Qur’an 5:6 mentions janabah, a state that calls for ghusl before prayer. Ibn Taymiyyah held that this ghusl can also count as wudu. Ibn Baz said that you can intend both when you do this ghusl. If something breaks your wudu during or after the wash, do wudu again before you pray.`,
          ar:`الغسل طهارة تشمل البدن كله للصلاة. انوِ الغسل بقلبك، ثم عمّم البدن بالماء حتى يصل إلى جميع البشرة وأصول الشعر.

تمضمض واستنشق في الغسل. واختلف العلماء في وجوبهما.

ذكرت سورة المائدة (٦) الجنابة، وهي حالة توجب الغسل للصلاة. وبيّن ابن تيمية أن غسل الجنابة يجزئ عن الوضوء. وقال ابن باز إن من نوى بغسل الجنابة رفع الحدثين كفاه. وإذا حصل ناقض للوضوء أثناء الغسل أو بعده فتوضأ قبل الصلاة.`,
          evidence:[evidence('Qur’an 5:6','وَإِنْ كُنْتُمْ جُنُبًا فَاطَّهَّرُوا', 'If you are in a state of janabah, purify yourselves by washing.')],
          refs:[source('Al-Ma’idah 5:6','المائدة ٦','https://quran.com/5/6'), source('Ibn ‘Uthaymin · Minimum and complete washing','ابن عثيمين · الصفة المجزئة والكاملة',uthaymin+'821'),
            source('Ibn Baz · When ghusl counts as wudu','ابن باز · متى يجزئ الغسل عن الوضوء؟','https://binbaz.org.sa/fatwas/3807/الغسل-من-الجنابة-وغيرها-هل-يجزى-عن-الوضوء'),
            source('Ibn Taymiyyah · Majmu‘ al-Fatawa 21:299, ghusl and wudu','ابن تيمية · مجموع الفتاوى ٢١:٢٩٩','https://www.islamweb.net/ar/library/content/22/2297/%D9%85%D8%B3%D8%A3%D9%84%D8%A9-%D8%A7%D8%BA%D8%AA%D8%B3%D9%84-%D9%88%D9%84%D9%85-%D9%8A%D8%AA%D9%88%D8%B6%D8%A3-%D9%81%D9%87%D9%84-%D9%8A%D8%AC%D8%B2%D9%8A%D9%87-%D8%B0%D9%84%D9%83')],
          comparisons:[
            {
              title:'Rinsing the mouth and nose', arTitle:'المضمضة والاستنشاق',
              views:[
                {
                  title:'Hanbali school', arTitle:'الحنابلة',
                  en:'Rinsing the mouth and nose is required for ghusl. This is also the view of Ibn Taymiyyah, Ibn Baz and Ibn ‘Uthaymin.',
                  ar:'المضمضة والاستنشاق واجبان في الغسل. وهو اختيار ابن تيمية وابن باز وابن عثيمين.',
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
          en:`Wash your hands and clean yourself where needed. Do wudu as you would for prayer. Wet the roots of your hair, pour water over your head three times and wash the rest of your body, starting with the right side. Some reports mention washing the feet at the end. Ibn Baz and Al-Fawzan explain these steps from reports about the Prophet ﷺ.

You can use a shower for ghusl. Make the intention and let the water reach your whole body.`,
          ar:`اغسل كفيك ونظّف موضع الأذى، ثم توضأ وضوء الصلاة. خلّل أصول الشعر بالماء، وصب على رأسك الماء ثلاث مرات، ثم اغسل بقية بدنك مبتدئاً بالجانب الأيمن. وجاء تأخير غسل القدمين إلى آخر الغسل في بعض الروايات. ويشرح الفوزان وابن باز هذه الصفة بما ثبت من غسل النبي ﷺ. ويصح الغسل تحت الدش بالنية ووصول الماء إلى المواضع المطلوبة.`,
          evidence:[evidence('Sahih al-Bukhari 248','ثُمَّ يَتَوَضَّأُ كَمَا يَتَوَضَّأُ لِلصَّلَاةِ … ثُمَّ يُفِيضُ الْمَاءَ عَلَى جِلْدِهِ كُلِّهِ', 'He then performed wudu as he did for prayer … then poured water over all his skin.')],
          refs:[source('Al-Bukhari 248','البخاري ٢٤٨','https://sunnah.com/bukhari:248'), source('Ibn Baz · How to perform ghusl','ابن باز · صفة الغسل من الجنابة','https://binbaz.org.sa/fatwas/13710/%D8%B5%D9%81%D8%A9-%D8%A7%D9%84%D8%BA%D8%B3%D9%84-%D9%85%D9%86-%D8%A7%D9%84%D8%AC%D9%86%D8%A7%D8%A8%D8%A9'),
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
          en:`Stand for an obligatory prayer if you can, including with a support. If standing causes substantial hardship, or you reasonably fear that it would worsen the illness, pray seated. Face the Qibla as far as you can. If you cannot sit, pray on your side, with the right side preferred if suitable. Ibn Baz and Al-Fawzan describe lying on your back as an option when lying on your side is beyond your ability.

Ibn ‘Uthaymin mentions sitting cross-legged for the standing portion when practical. Al-Fawzan explains that a person may use whichever seated position is manageable. A person who can stand for recitation but needs to sit for another position does each part as they are able.`,
          ar:`صلِّ الفريضة قائماً إن استطعت ولو مع الاعتماد على شيء. فإن شق القيام مشقة ظاهرة أو خفت زيادة المرض صلِّ قاعداً. استقبل القبلة بحسب استطاعتك. فإن عجزت عن القعود فصلِّ على جنبك، والأيمن أفضل إن تيسّر. ويذكر ابن باز والفوزان الاستلقاء على الظهر لمن عجز عن الصلاة على جنبه.

ذكر ابن عثيمين التربع في موضع القيام عند تيسره، وبيّن الفوزان أن للمريض أن يجلس على الهيئة الممكنة. ومن قدر على القيام للقراءة واحتاج إلى الجلوس في موضع آخر فعل كل ركن بحسب استطاعته.`,
          evidence:[evidence('Sahih al-Bukhari 1117','صَلِّ قَائِمًا، فَإِنْ لَمْ تَسْتَطِعْ فَقَاعِدًا، فَإِنْ لَمْ تَسْتَطِعْ فَعَلَى جَنْبٍ', 'Pray standing. If you cannot, pray sitting. If you cannot do that, pray on your side.')],
          refs:[source('Al-Bukhari 1117','البخاري ١١١٧','https://sunnah.com/bukhari:1117'), source('Ibn Baz · How the sick person prays','ابن باز · صفة صلاة المريض','https://binbaz.org.sa/fatwas/9426/%D8%B5%D9%81%D8%A9-%D8%B5%D9%84%D8%A7%D8%A9-%D8%A7%D9%84%D9%85%D8%B1%D9%8A%D8%B6'),
            source('Ibn ‘Uthaymin · Purification and prayer for the sick','ابن عثيمين · كيفية وضوء المريض وصلاته',uthaymin+'8384'),
            source('Al-Fawzan · Prayer of those with excuses','الفوزان · باب صلاة أهل الأعذار','https://al-sunan.org/vb/showpost.php?p=24604&postcount=20')]
        },
        {
          title:'Bowing, prostrating and keeping the time', arTitle:'الركوع والسجود وأداء الصلاة في وقتها',
          en:`Bow and prostrate as far as you are able. If you cannot bow or prostrate, tilt your head for the movement you cannot do. Tilt your head lower for prostration than for a bow. Al-Fawzan says to change position if what you can do changes during the prayer.

Use water to prepare for prayer if you can do so safely. See Tayammum and Without purification materials if you cannot. Ibn Taymiyyah explained that even someone with very limited movement prays as much as they are able. Try to pray on time. If illness makes it hard to pray separately, you may combine Dhuhr with Asr or Maghrib with Isha. Pray the full number of rak’ahs when you are at home.`,
          ar:`اركع واسجد بقدر استطاعتك. إذا عجزت عن الركوع أو السجود فأومئ برأسك للركن الذي تعجز عنه، واجعل إيماء السجود أخفض من الركوع. وبيّن الفوزان أن المريض ينتقل إلى الوضع الذي يقدر عليه إذا تغيّرت قدرته أثناء الصلاة.

تطهّر بالماء إن أمكنك استعماله دون ضرر. وانظر باب التيمم وباب فاقد الطهورين إذا عجزت. وطبّق ابن تيمية قاعدة الصلاة بحسب الاستطاعة على شديد العجز. احرص على أداء الصلاة في وقتها. وإذا شق على المريض التفريق جاز له جمع الظهر مع العصر أو المغرب مع العشاء مع إتمام عدد الركعات للمقيم.`,
          evidence:[evidence('Qur’an 64:16','فَاتَّقُوا اللَّهَ مَا اسْتَطَعْتُمْ', 'Be mindful of Allah to the best of your ability.')],
          refs:[source('At-Taghabun 64:16','التغابن ١٦','https://quran.com/64/16'), source('Ibn Taymiyyah · Majmu‘ al-Fatawa, vol. 24','ابن تيمية · مجموع الفتاوى، المجلد ٢٤','https://ar.wikisource.org/wiki/%D9%85%D8%AC%D9%85%D9%88%D8%B9_%D8%A7%D9%84%D9%81%D8%AA%D8%A7%D9%88%D9%89/%D8%A7%D9%84%D9%85%D8%AC%D9%84%D8%AF_%D8%A7%D9%84%D8%B1%D8%A7%D8%A8%D8%B9_%D9%88%D8%A7%D9%84%D8%B9%D8%B4%D8%B1%D9%88%D9%86'),
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
          en:`Pray Witr after you have prayed Isha and before true dawn, when the time for Fajr begins. Witr means an odd number of rak’ahs. Ibn ‘Uthaymin recommends praying Witr near the end of the night if you expect to wake up. If you think you may sleep through it, pray Witr before bed. Ibn Taymiyyah describes Witr as one of the most strongly encouraged optional prayers.

The last third begins once two thirds of the interval from Maghrib to the next Fajr have passed. It is a separate marker from the first third used in the Isha reminder.`,
          ar:`صلِّ الوتر بعد صلاة العشاء وقبل طلوع الفجر الصادق، وهو وقت دخول صلاة الفجر. والوتر صلاة بعدد فردي من الركعات. وبيّن ابن عثيمين أن من يرجو القيام آخر الليل فالأفضل أن يؤخر وتره إليه، ومن خشي ألا يقوم أوتر قبل النوم. وذكر ابن تيمية أن الوتر من آكد صلوات التطوع.

يبدأ الثلث الأخير بعد مضي ثلثي المدة من المغرب إلى الفجر التالي. وهو غير وقت الثلث الأول الذي يُحسب منه تذكير العشاء.`,
          evidence:[evidence('Sahih Muslim 755a','مَنْ خَافَ أَنْ لَا يَقُومَ مِنْ آخِرِ اللَّيْلِ فَلْيُوتِرْ أَوَّلَهُ، وَمَنْ طَمِعَ أَنْ يَقُومَ آخِرَهُ فَلْيُوتِرْ آخِرَ اللَّيْلِ', 'Whoever fears they will not get up towards the end of the night should pray Witr early. Whoever expects to get up should pray Witr towards its end.')],
          refs:[source('Muslim 755a','مسلم ٧٥٥','https://sunnah.com/muslim:755a'), source('Muslim 754b · Witr before dawn','مسلم ٧٥٤ · الوتر قبل الصبح','https://sunnah.com/muslim:754b'), source('Ibn ‘Uthaymin · Witr early or late','ابن عثيمين · الوتر أول الليل أو آخره',uthaymin+'9765'),
            source('Ibn Taymiyyah · Majmu‘ al-Fatawa 23:88–93','ابن تيمية · مجموع الفتاوى ٢٣:٨٨–٩٣','https://quranislam.github.io/fatwa/ibn-taymiyyah/fatwa345.html')]
        },
        {
          title:'Two at a time, then finish with Witr', arTitle:'مثنى مثنى ثم الوتر',
          en:`A straightforward way is to pray in pairs of two rak’ahs, giving the salaam after each pair, then pray one rak’ah for Witr. Ibn Taymiyyah also describes other forms transmitted from the Sunnah, including five or seven with the salaam at the end. The number of rak’ahs and the way they are grouped can differ between the sound reports.

If you already prayed Witr and then wake later, Ibn Baz, Ibn ‘Uthaymin and Al-Fawzan say you may pray further pairs. Your earlier Witr stands, so leave out a second Witr.`,
          ar:`من الصفات الميسّرة أن تصلي ركعتين ركعتين وتسلّم من كل ركعتين، ثم توتر بركعة. وذكر ابن تيمية صفات أخرى ثابتة، منها الإيتار بخمس أو سبع لا يسلّم إلا في آخرها. وقد وردت صور صحيحة متعددة في العدد والصفة.

وإذا أوترت ثم استيقظت آخر الليل، فلك أن تصلي ركعتين ركعتين عند ابن باز وابن عثيمين والفوزان. ويبقى الوتر الأول فلا توتر مرة ثانية.`,
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
          en:`Ibn Baz and Ibn ‘Uthaymin recommend making up a missed nightly practice in the daytime with an even number of rak’ahs. If you usually pray three, you pray four, in two pairs. Ibn Baz prefers the Duha period. They cite Aishah’s report that the Prophet ﷺ prayed twelve rak’ahs during the day if sleep or illness had kept him from his night prayer.

Ibn Taymiyyah allows someone who wakes after dawn and has yet to pray Fajr to make up Witr before the Fajr prayer. He cites the practice of Ibn Umar and Aishah and the report about making up Witr after sleep or forgetfulness. He discusses making up the night prayer later in pairs as a separate matter.`,
          ar:`يستحب عند ابن باز وابن عثيمين قضاء صلاة الليل نهاراً شفعاً. فمن عادته أن يوتر بثلاث صلى أربعاً، يسلّم من كل ركعتين. ويفضل ابن باز وقت الضحى. ودليلهما حديث عائشة أن النبي ﷺ كان يصلي من النهار اثنتي عشرة ركعة إذا منعه من قيام الليل نوم أو وجع.

ويرى ابن تيمية أن من استيقظ بعد طلوع الفجر ولم يصل الفجر بعد، يقضي الوتر قبل صلاة الصبح. واستدل بفعل ابن عمر وعائشة وبحديث قضاء الوتر لمن نام عنه أو نسيه. وفرّق بين هذا وبين قضاء صلاة الليل نهاراً شفعاً.`,
          evidence:[evidence('Sahih Muslim 746a','وَكَانَ إِذَا غَلَبَهُ نَوْمٌ أَوْ وَجَعٌ عَنْ قِيَامِ اللَّيْلِ صَلَّى مِنَ النَّهَارِ ثِنْتَيْ عَشْرَةَ رَكْعَةً', 'When sleep or illness kept him from the night prayer, he prayed twelve rak’ahs in the daytime.')],
          refs:[source('Muslim 746a','مسلم ٧٤٦','https://sunnah.com/muslim:746a'), source('Ibn Baz · Making up Witr','ابن باز · حكم قضاء الوتر','https://binbaz.org.sa/fatwas/20357/%D8%AD%D9%83%D9%85-%D9%82%D8%B6%D8%A7%D8%A1-%D8%A7%D9%84%D9%88%D8%AA%D8%B1'),
            source('Ibn ‘Uthaymin · Making up Witr in daytime','ابن عثيمين · قضاء صلاة الوتر في النهار',uthaymin+'9229'),
            source('Ibn Taymiyyah · Majmu‘ al-Fatawa 23:89–91','ابن تيمية · مجموع الفتاوى ٢٣:٨٩–٩١','https://www.islamweb.com/ar/library/content/22/2802/مسألة-من-نام-عن-صلاة-الوتر')]
        }
      ]
    }
  );
})();
