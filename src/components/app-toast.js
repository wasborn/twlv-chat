import { Component, define } from '@xinix/xin';
import html from './app-toast.html';

import './app-toast.css';

class AppToast extends Component {
  get template () {
    return html;
  }

  show (message = 'Oops...', timeout = 3000) {
    this.classList.remove('visible');
    this.set('message', message);
    this.classList.add('visible');

    this.async(() => {
      this.hide();
    }, timeout);
  }

  hide () {
    this.classList.remove('visible');
  }
}

define('app-toast', AppToast);
