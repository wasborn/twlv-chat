import { Component, define } from '@xinix/xin';
import html from './app-loading.html';

import './app-loading.css';

class AppLoading extends Component {
  get template () {
    return html;
  }

  show () {
    this.classList.add('visible');
  }

  hide () {
    this.classList.remove('visible');
  }
}

define('app-loading', AppLoading);
