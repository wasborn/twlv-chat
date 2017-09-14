import { bootstrap } from '@xinix/xin/core';
import { Chat } from './lib/chat';

if (module.hot) {
  module.hot.accept();
}

(async function () {
  // use below polyfill to support unsupported customElements v0
  if (!window.customElements) {
    await import('@webcomponents/custom-elements');
  }

  bootstrap({
    // 'env.debug': true,
    'view.loaders': [
      {
        test: /^app-/,
        load (view) {
          return import(`./views/${view.name}`);
        },
      },
    ],
  });

  let chat = new Chat();
  await chat.connect();

  window.chat = chat;

  await import('./components/app-main');

  document.addEventListener('started', () => {
    setTimeout(() => {
      document.body.removeAttribute('unresolved');
    }, 100);
  });
})();
