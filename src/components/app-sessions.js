import { Component, define } from '@xinix/xin';
import html from './app-sessions.html';
import { Logger } from 'twlv-logger';

import './app-sessions.css';

const logger = new Logger('twlv-chat:components:app-sessions');
const { chat } = window;

class AppSessions extends Component {
  get template () {
    return html;
  }

  get props () {
    return Object.assign({}, super.props, {
      search: {
        type: String,
        value: '',
      },
      sessions: {
        type: Array,
        value: () => ([]),
      },
    });
  }

  ready () {
    super.ready();

    chat.subscribe('sessions', sessions => {
      this.set('sessions', (sessions || []).slice());
    });
  }
}

define('app-sessions', AppSessions);
