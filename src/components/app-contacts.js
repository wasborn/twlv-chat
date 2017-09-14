import { Component, define } from '@xinix/xin';
import html from './app-contacts.html';
import { Logger } from 'twlv-logger';

import './app-contacts.css';

const logger = new Logger('twlv-chat:components:app-contacts');
const { chat } = window;

class AppContacts extends Component {
  get template () {
    return html;
  }

  get props () {
    return Object.assign({}, super.props, {
      search: {
        type: String,
        value: '',
      },
      contacts: {
        type: Array,
        value: () => ([]),
      },
    });
  }

  ready () {
    super.ready();

    chat.subscribe('contacts', contacts => {
      this.set('contacts', (contacts || []).slice());
    });
  }

  selectSession (contact) {
    console.log('>>', contact);
  }
}

define('app-contacts', AppContacts);
