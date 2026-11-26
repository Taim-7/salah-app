(() => {
  'use strict';

  const index = document.getElementById('learnIndex');
  const article = document.getElementById('learnArticle');
  const title = document.getElementById('lessonTitle');
  const content = document.getElementById('lessonContent');
  const languageButtons = [...article.querySelectorAll('[data-lesson-language]')];
  let activeTopic;

  function element(tag, text) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function language(node, lang) {
    node.dataset.lessonText = lang;
    node.lang = lang === 'ar' ? 'ar' : 'en-GB';
    if (lang === 'ar') node.dir = 'rtl';
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

  function renderSection(section) {
    const card = element('section');
    card.className = 'lesson-section';
    card.append(language(element('h3', section.title), 'en'), language(element('h3', section.arTitle), 'ar'));
    if (section.verses) {
      const bismillah = language(element('p', 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ'), 'ar');
      const verses = element('ol');
      verses.className = 'lesson-verses';
      for (const verse of section.verses) {
        const line = element('li');
        line.append(language(element('p', verse.ar), 'ar'), language(element('p', verse.en), 'en'));
        verses.append(line);
      }
      card.append(bismillah, verses);
    } else {
      const arabic = lessonText(section.ar, 'ar');
      arabic.className = 'lesson-arabic';
      card.append(lessonText(section.en, 'en'), arabic);
    }
    if (section.refs?.length) {
      const refs = element('footer');
      refs.className = 'lesson-references';
      for (const [name, url] of section.refs) {
        const link = element('a', name);
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        refs.append(link);
      }
      card.append(refs);
    }
    return card;
  }

  function open(topic, button) {
    activeTopic = button;
    title.textContent = topic.title;
    content.replaceChildren(...topic.sections.map(renderSection));
    index.hidden = true;
    article.hidden = false;
    window.scrollTo({ top: 0, behavior: 'instant' });
    title.focus({ preventScroll: true });
  }

  function close() {
    if (article.hidden) return false;
    article.hidden = true;
    index.hidden = false;
    activeTopic?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
    return true;
  }

  for (const topic of window.SalahLessons) {
    const button = element('button');
    button.className = 'learn-topic';
    button.type = 'button';
    button.dataset.topic = topic.id;
    const chevron = element('span', '›');
    chevron.setAttribute('aria-hidden', 'true');
    button.append(element('strong', topic.title), element('small', topic.description), chevron);
    button.addEventListener('click', () => open(topic, button));
    document.getElementById('learnTopics').append(button);
  }
  document.getElementById('backToLearn').addEventListener('click', close);
  for (const button of languageButtons) {
    button.addEventListener('click', () => {
      article.dataset.language = button.dataset.lessonLanguage;
      for (const other of languageButtons) other.setAttribute('aria-pressed', String(other === button));
    });
  }
  window.SalahLearn = { close };
})();
