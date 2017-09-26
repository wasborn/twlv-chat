import { Component, define } from '@xinix/xin';
import html from './app-search.html';
import { Logger } from 'twlv-logger';

import './app-search.css';

const logger = new Logger('twlv-chat:components:app-search');
const { chat } = window;

class AppSearch extends Component {
  get template () {
    return html;
  }

  get props () {
    return Object.assign({}, super.props, {
      search: {
        type: String,
        value: '',
        observer: 'doSearch(search)',
      },
    });
  }

  async doSearch (search) {
    if (!search) {
      return;
    }

    let result = await chat.search(search);
    logger.log('doSearch %o', search, result);
  }
}

define('app-search', AppSearch);
