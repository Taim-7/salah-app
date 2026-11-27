(() => {
  'use strict';

  const proof = (name, ar, en) => ({ name, ar, en });
  const kursi = proof('Ayat Al-Kursi · Qur’an 2:255',
    'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ',
    'Allah, none has the right to be worshipped except Him, the Ever-Living, the Sustainer of all. Neither drowsiness nor sleep overtakes Him. All that is in the heavens and the earth belongs to Him. Who can intercede with Him except with His permission? He knows what is before them and what is behind them. They grasp only what He wills of His knowledge. His Kursi extends over the heavens and the earth. Preserving them does not tire Him. He is the Most High, the Magnificent.');
  const tawhid = 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ';
  const tawhidMeaning = 'None has the right to be worshipped except Allah alone, without partner. To Him belong the dominion and all praise, and He has power over all things.';
  const glorifying = proof('Muslim 772','سُبْحَانَ رَبِّيَ الْعَظِيمِ · سُبْحَانَ رَبِّيَ الْأَعْلَى','Glory be to my Lord, the Magnificent · Glory be to my Lord, the Most High.');
  const bowForgiveness = proof('Al-Bukhari 794','سُبْحَانَكَ اللَّهُمَّ رَبَّنَا وَبِحَمْدِكَ، اللَّهُمَّ اغْفِرْ لِي','Glory and praise be to You, O Allah, our Lord. O Allah, forgive me.');

  window.SalahLessonEvidence = {
    wudu:[
      [
        proof('Muslim 226a','عَنْ حُمْرَانَ مَوْلَى عُثْمَانَ أَنَّ عُثْمَانَ … قَالَ: رَأَيْتُ رَسُولَ اللَّهِ ﷺ تَوَضَّأَ نَحْوَ وُضُوئِي هَذَا',
          'Humran, the freedman of Uthman, narrated that Uthman … said, “I saw Allah’s Messenger ﷺ perform wudu like this wudu of mine.”'),
        proof('Al-Bukhari 1','إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى','Actions are judged according to intentions, and each person will have what they intended.')
      ],
      [proof('Qur’an 5:6','يَا أَيُّهَا الَّذِينَ آمَنُوا إِذَا قُمْتُمْ إِلَى الصَّلَاةِ فَاغْسِلُوا وُجُوهَكُمْ وَأَيْدِيَكُمْ إِلَى الْمَرَافِقِ وَامْسَحُوا بِرُءُوسِكُمْ وَأَرْجُلَكُمْ إِلَى الْكَعْبَيْنِ',
        'You who believe, when you rise for prayer, wash your faces and hands and arms up to the elbows, wipe your heads and wash your feet up to the ankles.')],
      [
        proof('Muslim 234','أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
          'I bear witness that none has the right to be worshipped except Allah alone without partner, and I bear witness that Muhammad is His servant and Messenger.'),
        proof('Al-Tirmidhi 55','اللَّهُمَّ اجْعَلْنِي مِنَ التَّوَّابِينَ وَاجْعَلْنِي مِنَ الْمُتَطَهِّرِينَ','O Allah, make me one of those who repent and one of those who purify themselves.')
      ],
      [
        proof('Muslim 225','لَا يَقْبَلُ اللَّهُ صَلَاةَ أَحَدِكُمْ إِذَا أَحْدَثَ حَتَّى يَتَوَضَّأَ','Allah does not accept the prayer of someone who has broken wudu until they perform wudu.'),
        proof('Abu Dawud 181','مَنْ مَسَّ ذَكَرَهُ فَلْيَتَوَضَّأْ','Whoever touches his penis should perform wudu.'),
        proof('Muslim 360a','أَتَوَضَّأُ مِنْ لُحُومِ الْإِبِلِ؟ قَالَ: نَعَمْ فَتَوَضَّأْ مِنْ لُحُومِ الْإِبِلِ','“Should I perform wudu after eating camel meat?” He said, “Yes, perform wudu after eating camel meat.”')
      ]
    ],
    prayer:[
      [proof('Al-Bukhari 631','صَلُّوا كَمَا رَأَيْتُمُونِي أُصَلِّي','Pray as you have seen me pray.')],
      [
        proof('Al-Bukhari 756','لَا صَلَاةَ لِمَنْ لَمْ يَقْرَأْ بِفَاتِحَةِ الْكِتَابِ','There is no prayer for the person who does not recite the Opening of the Book.'),
        glorifying, bowForgiveness,
        proof('Al-Bukhari 799','رَبَّنَا وَلَكَ الْحَمْدُ حَمْدًا كَثِيرًا طَيِّبًا مُبَارَكًا فِيهِ','Our Lord, all praise belongs to You, abundant, good and blessed praise.'),
        proof('Al-Bukhari 812','أُمِرْتُ أَنْ أَسْجُدَ عَلَى سَبْعَةِ أَعْظُمٍ: عَلَى الْجَبْهَةِ، وَأَشَارَ بِيَدِهِ عَلَى أَنْفِهِ، وَالْيَدَيْنِ وَالرُّكْبَتَيْنِ وَأَطْرَافِ الْقَدَمَيْنِ',
          'I was commanded to prostrate on seven points. The forehead, and he pointed to his nose, both hands, both knees and the ends of the feet.'),
        proof('Muslim 482','أَقْرَبُ مَا يَكُونُ الْعَبْدُ مِنْ رَبِّهِ وَهُوَ سَاجِدٌ فَأَكْثِرُوا الدُّعَاءَ','A servant is nearest to his Lord while prostrating, so make abundant supplication.'),
        proof('Abu Dawud 874','رَبِّ اغْفِرْ لِي، رَبِّ اغْفِرْ لِي','My Lord, forgive me. My Lord, forgive me.'),
        proof('Al-Bukhari 831','التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ، السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ، السَّلَامُ عَلَيْنَا وَعَلَى عِبَادِ اللَّهِ الصَّالِحِينَ، أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
          'All greetings, prayers and good things belong to Allah. Peace, Allah’s mercy and His blessings be upon you, O Prophet. Peace be upon us and upon Allah’s righteous servants. I bear witness that none has the right to be worshipped except Allah and that Muhammad is His servant and Messenger.'),
        proof('Al-Bukhari 3370','اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ',
          'O Allah, honour Muhammad and the family of Muhammad as You honoured Ibrahim and the family of Ibrahim. You are Praiseworthy, Glorious.')
      ],
      [proof('Al-Bukhari 757','ارْجِعْ فَصَلِّ فَإِنَّكَ لَمْ تُصَلِّ … ثُمَّ ارْكَعْ حَتَّى تَطْمَئِنَّ رَاكِعًا',
        'Go back and pray, for you have not prayed … then bow until you are at ease in the bowing position.')]
    ],
    travel:[
      [
        proof('Qur’an 4:101','وَإِذَا ضَرَبْتُمْ فِي الْأَرْضِ فَلَيْسَ عَلَيْكُمْ جُنَاحٌ أَنْ تَقْصُرُوا مِنَ الصَّلَاةِ','When you travel through the land, there is no blame on you for shortening the prayer.'),
        proof('Muslim 686a','صَدَقَةٌ تَصَدَّقَ اللَّهُ بِهَا عَلَيْكُمْ فَاقْبَلُوا صَدَقَتَهُ','It is a gift that Allah has given you, so accept His gift.'),
        proof('Al-Bukhari 1102','صَحِبْتُ النَّبِيَّ ﷺ فَكَانَ لَا يَزِيدُ فِي السَّفَرِ عَلَى رَكْعَتَيْنِ وَأَبَا بَكْرٍ وَعُمَرَ وَعُثْمَانَ كَذَلِكَ',
          'I accompanied the Prophet ﷺ and he did not pray more than two rak’ahs while travelling. Abu Bakr, Umar and Uthman did the same.')
      ],
      [],
      [proof('Abu Dawud 1235','أَقَامَ رَسُولُ اللَّهِ ﷺ بِتَبُوكَ عِشْرِينَ يَوْمًا يَقْصُرُ الصَّلَاةَ','Allah’s Messenger ﷺ stayed in Tabuk for twenty days, shortening the prayer.')],
      [
        proof('Muslim 706a','جَمَعَ رَسُولُ اللَّهِ ﷺ فِي غَزْوَةِ تَبُوكَ بَيْنَ الظُّهْرِ وَالْعَصْرِ وَبَيْنَ الْمَغْرِبِ وَالْعِشَاءِ',
          'On the Tabuk expedition, Allah’s Messenger ﷺ joined Dhuhr with Asr and joined Maghrib with Isha.'),
        proof('Muslim 705d','جَمَعَ رَسُولُ اللَّهِ ﷺ بَيْنَ الظُّهْرِ وَالْعَصْرِ وَالْمَغْرِبِ وَالْعِشَاءِ بِالْمَدِينَةِ فِي غَيْرِ خَوْفٍ وَلَا مَطَرٍ',
          'Allah’s Messenger ﷺ joined Dhuhr with Asr and Maghrib with Isha in Madinah without fear or rain.')
      ]
    ],
    tayammum:[
      [
        proof('Qur’an 5:6','فَلَمْ تَجِدُوا مَاءً فَتَيَمَّمُوا صَعِيدًا طَيِّبًا فَامْسَحُوا بِوُجُوهِكُمْ وَأَيْدِيكُمْ مِنْهُ',
          'If you find no water, use clean earth and wipe your faces and hands with it.'),
        proof('Al-Bukhari 335','جُعِلَتْ لِيَ الْأَرْضُ مَسْجِدًا وَطَهُورًا','The earth was made for me a place to pray and a means to purify.')
      ],
      [
        proof('Abu Dawud 336','إِنَّمَا كَانَ يَكْفِيهِ أَنْ يَتَيَمَّمَ','It would have been enough for him to perform tayammum.'),
        proof('Abu Dawud 334','فَتَيَمَّمْتُ ثُمَّ صَلَّيْتُ بِأَصْحَابِي الصُّبْحَ','So I performed tayammum and then led my companions in the dawn prayer.')
      ],
      [proof('Muslim 368a','إِنَّمَا كَانَ يَكْفِيكَ أَنْ تَقُولَ بِيَدَيْكَ هَكَذَا … ثُمَّ مَسَحَ الشِّمَالَ عَلَى الْيَمِينِ وَظَاهِرَ كَفَّيْهِ وَوَجْهَهُ',
        'It would have been enough to do this with your hands … then he wiped his right with his left, the backs of his hands and his face.')],
      [proof('Al-Tirmidhi 124','إِنَّ الصَّعِيدَ الطَّيِّبَ طَهُورُ الْمُسْلِمِ وَإِنْ لَمْ يَجِدِ الْمَاءَ عَشْرَ سِنِينَ، فَإِذَا وَجَدَ الْمَاءَ فَلْيُمِسَّهُ بَشَرَتَهُ',
        'Clean earth is a means of purification for a Muslim even if he finds no water for ten years. When he finds water, he should apply it to his skin.')]
    ],
    'without-purification':[
      [],
      [
        proof('Al-Bukhari 336','فَأَدْرَكَتْهُمُ الصَّلَاةُ وَلَيْسَ مَعَهُمْ مَاءٌ فَصَلَّوْا بِغَيْرِ وُضُوءٍ','The time for prayer came while they had no water, so they prayed without wudu.'),
        proof('Qur’an 2:286','لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا','Allah tasks no soul beyond its capacity.'),
        proof('Al-Bukhari 7288','وَإِذَا أَمَرْتُكُمْ بِأَمْرٍ فَأْتُوا مِنْهُ مَا اسْتَطَعْتُمْ','When I command you to do something, do as much of it as you are able.')
      ]
    ],
    remembrance:[
      [
        proof('Al-Bukhari 744','اللَّهُمَّ بَاعِدْ بَيْنِي وَبَيْنَ خَطَايَايَ كَمَا بَاعَدْتَ بَيْنَ الْمَشْرِقِ وَالْمَغْرِبِ، اللَّهُمَّ نَقِّنِي مِنْ خَطَايَايَ كَمَا يُنَقَّى الثَّوْبُ الْأَبْيَضُ مِنَ الدَّنَسِ، اللَّهُمَّ اغْسِلْنِي مِنْ خَطَايَايَ بِالثَّلْجِ وَالْمَاءِ وَالْبَرَدِ',
          'O Allah, put distance between me and my sins as You put distance between east and west. Cleanse me of my sins as a white garment is cleansed of dirt. Wash me of my sins with snow, water and hail.'),
        proof('Abu Dawud 775','سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ، وَتَبَارَكَ اسْمُكَ، وَتَعَالَى جَدُّكَ، وَلَا إِلَهَ غَيْرُكَ',
          'Glory and praise be to You, O Allah. Blessed is Your name and exalted is Your majesty. None has the right to be worshipped except You.')
      ],
      [
        glorifying, bowForgiveness,
        proof('Muslim 487','سُبُّوحٌ قُدُّوسٌ رَبُّ الْمَلَائِكَةِ وَالرُّوحِ','Perfectly Glorified, Perfectly Holy, Lord of the angels and the Spirit.')
      ],
      [
        proof('Muslim 772','سُبْحَانَ رَبِّيَ الْأَعْلَى','Glory be to my Lord, the Most High.'),
        proof('Muslim 483','اللَّهُمَّ اغْفِرْ لِي ذَنْبِي كُلَّهُ دِقَّهُ وَجِلَّهُ، وَأَوَّلَهُ وَآخِرَهُ، وَعَلَانِيَتَهُ وَسِرَّهُ',
          'O Allah, forgive all my sins, the small and the great, the first and the last, the open and the secret.'),
        proof('Muslim 482','أَقْرَبُ مَا يَكُونُ الْعَبْدُ مِنْ رَبِّهِ وَهُوَ سَاجِدٌ فَأَكْثِرُوا الدُّعَاءَ','A servant is nearest to his Lord while prostrating, so make abundant supplication.')
      ],
      [
        proof('Muslim 588a','اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ عَذَابِ جَهَنَّمَ، وَمِنْ عَذَابِ الْقَبْرِ، وَمِنْ فِتْنَةِ الْمَحْيَا وَالْمَمَاتِ، وَمِنْ شَرِّ فِتْنَةِ الْمَسِيحِ الدَّجَّالِ',
          'O Allah, I seek refuge in You from the punishment of Hell, the punishment of the grave, the trials of life and death, and the evil trial of the False Messiah.'),
        proof('Al-Bukhari 834','اللَّهُمَّ إِنِّي ظَلَمْتُ نَفْسِي ظُلْمًا كَثِيرًا، وَلَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ، فَاغْفِرْ لِي مَغْفِرَةً مِنْ عِنْدِكَ وَارْحَمْنِي، إِنَّكَ أَنْتَ الْغَفُورُ الرَّحِيمُ',
          'O Allah, I have wronged myself greatly, and none forgives sins except You. Grant me forgiveness from You and have mercy on me. You are the Forgiving, the Merciful.')
      ],
      [
        proof('Muslim 591','أَسْتَغْفِرُ اللَّهَ … اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
          'I ask Allah to forgive me … O Allah, You are Peace and from You comes peace. Blessed are You, Possessor of majesty and honour.'),
        proof('Al-Bukhari 844',tawhid+'، اللَّهُمَّ لَا مَانِعَ لِمَا أَعْطَيْتَ، وَلَا مُعْطِيَ لِمَا مَنَعْتَ، وَلَا يَنْفَعُ ذَا الْجَدِّ مِنْكَ الْجَدُّ',
          tawhidMeaning+' O Allah, none can hold back what You give, and none can give what You hold back. Before You, a person’s wealth and rank cannot benefit them.'),
        proof('Muslim 597a','سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَاللَّهُ أَكْبَرُ … '+tawhid,
          'Glory be to Allah, praise belongs to Allah, and Allah is the Greatest … '+tawhidMeaning),
        kursi,
        proof('Abu Dawud 1522','اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ','O Allah, help me remember You, thank You and worship You well.')
      ],
      [
        proof('Al-Bukhari 6306','اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي، فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
          'O Allah, You are my Lord, and none has the right to be worshipped except You. You created me and I am Your servant. I keep to Your covenant and promise as far as I can. I seek refuge in You from the evil I have done. I acknowledge Your favour to me and I acknowledge my sin. Forgive me, for none forgives sins except You.'),
        kursi,
        proof('Abu Dawud 5082','قُلْ هُوَ اللَّهُ أَحَدٌ وَالْمُعَوِّذَتَيْنِ حِينَ تُمْسِي وَحِينَ تُصْبِحُ ثَلَاثَ مَرَّاتٍ تَكْفِيكَ مِنْ كُلِّ شَيْءٍ',
          'Recite Al-Ikhlas and the two protecting surahs in the evening and morning, three times. They will suffice you against everything.'),
        proof('Muslim 2723','أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ … أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ',
          'We have entered the morning and all dominion belongs to Allah. All praise belongs to Allah … We have entered the evening and all dominion belongs to Allah.'),
        proof('Al-Tirmidhi 3391','اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ',
          'O Allah, by You we enter the morning and by You we enter the evening. By You we live and by You we die. To You is the resurrection.'),
        proof('Abu Dawud 5088','بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
          'In the name of Allah, with whose name nothing on earth or in the heavens can harm. He is the All-Hearing, the All-Knowing.'),
        proof('Abu Dawud 5072','رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ ﷺ نَبِيًّا','I am content with Allah as my Lord, Islam as my religion and Muhammad ﷺ as my Prophet.'),
        proof('Abu Dawud 5081','حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ',
          'Allah is enough for me. None has the right to be worshipped except Him. In Him I put my trust. He is the Lord of the Mighty Throne.'),
        proof('Muslim 2692','سُبْحَانَ اللَّهِ وَبِحَمْدِهِ','Glory and praise be to Allah.')
      ]
    ],
    'al-mulk':[
      [
        proof('Abu Dawud 1400','سُورَةٌ مِنَ الْقُرْآنِ ثَلَاثُونَ آيَةً شَفَعَتْ لِرَجُلٍ حَتَّى غُفِرَ لَهُ، وَهِيَ تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ',
          'A surah from the Qur’an of thirty verses interceded for a man until he was forgiven. It is the surah that begins, “Blessed is the One in whose hand is all dominion.”'),
        proof('Al-Tirmidhi 2890','هِيَ الْمَانِعَةُ هِيَ الْمُنْجِيَةُ، تُنْجِيهِ مِنْ عَذَابِ الْقَبْرِ','It protects and delivers him, saving him from the punishment of the grave.'),
        proof('Al-Tirmidhi 2892','كَانَ لَا يَنَامُ حَتَّى يَقْرَأَ الم تَنْزِيلُ وَتَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ',
          'He did not go to sleep until he had recited Alif Lam Mim Tanzil and Tabaraka Alladhi Bi-Yadihi al-Mulk.')
      ]
    ]
  };
})();
