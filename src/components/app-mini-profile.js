import { define, Component } from '@xinix/xin';
import html from './app-mini-profile.html';

import './app-mini-profile.css';

const chat = window.chat;

class AppMiniProfile extends Component {
  get template () {
    return html;
  }

  get props () {
    return Object.assign({}, super.props, {
      profile: {
        type: Object,
        value: {},
      },
    });
  }

  ready () {
    super.ready();

    chat.subscribe('profile', profile => this.set('profile', Object.assign({}, profile)));
  }
}

define('app-mini-profile', AppMiniProfile);
