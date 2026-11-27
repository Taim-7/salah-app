(() => {
  'use strict';

  const index = document.getElementById('learnIndex');
  const article = document.getElementById('learnArticle');
  const title = document.getElementById('lessonTitle');
  const content = document.getElementById('lessonContent');
  let activeTopic;

  function element(tag, text) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function language(node, lang) {
    node.lang = lang === 'ar' ? 'ar' : 'en-GB';
    node.dir = lang === 'ar' ? 'rtl' : 'ltr';
    return node;
  }

  function lessonText(text, lang) {
    const block = language(element('div'), lang);
    for (const paragraph of text.split('\n\n')) {
      if (/^1\. /.test(paragraph)) {
        const list = element('ol');
        for (const point of paragraph.split('\n')) list.append(element('li', point.replace(/^\d+\. /, '')));
        block.append(list);
      } else {
        block.append(element('p', paragraph));
      }
    }
    return block;
  }

  function renderEvidence(quote, isArabic) {
    const block = element('blockquote');
    block.className = 'lesson-evidence';
    block.append(language(element('p', quote.ar), 'ar'));
    if (!isArabic) block.append(language(element('p', quote.en), 'en'));
    if (quote.name) {
      const name = isArabic ? quote.arName || SalahLocale.arabicReference(quote.name) : quote.name;
      block.append(element('cite', name));
    }
    return block;
  }

  function renderReferences(sources, isArabic) {
    const refs = element('footer');
    refs.className = 'lesson-references';
    for (const [name, url, arName] of sources) {
      const link = element('a', isArabic ? arName || SalahLocale.arabicReference(name) : name);
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      refs.append(link);
    }
    return refs;
  }

  function renderComparisons(comparisons, isArabic) {
    const panel = element('details');
    panel.className = 'lesson-views';
    panel.append(element('summary', isArabic ? 'أقوال العلماء' : 'Scholarly views'));
    for (const comparison of comparisons) {
      const group = element('div');
      group.className = 'lesson-view-group';
      group.append(element('h4', isArabic ? comparison.arTitle : comparison.title));
      for (const view of comparison.views) {
        const entry = element('div');
        entry.className = 'lesson-view';
        entry.append(element('strong', isArabic ? view.arTitle : view.title),
          element('p', isArabic ? view.ar : view.en), renderReferences(view.refs, isArabic));
        group.append(entry);
      }
      panel.append(group);
    }
    return panel;
  }

  function renderSection(section, isArabic, existingEvidence) {
    const card = element('section');
    card.className = 'lesson-section';
    card.dataset.localised = '';
    card.append(element('h3', isArabic ? section.arTitle : section.title));
    if (section.verses) {
      card.append(language(element('p', 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ'), 'ar'));
      const verses = element('ol');
      verses.className = 'lesson-verses';
      for (const verse of section.verses) {
        const line = element('li');
        line.append(language(element('p', verse.ar), 'ar'));
        if (!isArabic) line.append(language(element('p', verse.en), 'en'));
        verses.append(line);
      }
      card.append(verses);
    } else {
      card.append(lessonText(isArabic ? section.ar : section.en, isArabic ? 'ar' : 'en'));
      const quotes = section.evidence || existingEvidence;
      for (const proof of quotes || []) card.append(renderEvidence(proof, isArabic));
    }
    if (section.refs?.length) card.append(renderReferences(section.refs, isArabic));
    if (section.comparisons?.length) card.append(renderComparisons(section.comparisons, isArabic));
    return card;
  }

  function open(topic, button, isArabic) {
    activeTopic = button;
    title.textContent = isArabic ? topic.arTitle : topic.title;
    const evidence = window.SalahLessonEvidence[topic.id];
    content.replaceChildren(...topic.sections.map((section, i) => renderSection(section, isArabic, evidence?.[i])));
    index.hidden = true;
    article.hidden = false;
    window.scrollTo({ top:0, behavior:'instant' });
    title.focus({ preventScroll:true });
  }

  function close() {
    if (article.hidden) return false;
    article.hidden = true;
    index.hidden = false;
    activeTopic?.focus({ preventScroll:true });
    window.scrollTo({ top:0, behavior:'instant' });
    return true;
  }

  function init(isArabic) {
    const topics = document.getElementById('learnTopics');
    for (const topic of window.SalahLessons) {
      const button = element('button');
      button.className = 'learn-topic';
      button.type = 'button';
      button.dataset.topic = topic.id;
      const chevron = element('span', isArabic ? '‹' : '›');
      chevron.setAttribute('aria-hidden', 'true');
      button.append(element('strong', isArabic ? topic.arTitle : topic.title),
        element('small', isArabic ? topic.arDescription : topic.description), chevron);
      button.addEventListener('click', () => open(topic, button, isArabic));
      topics.append(button);
    }
  }

  document.getElementById('backToLearn').addEventListener('click', close);
  window.SalahLearn = { init, close };
})();
