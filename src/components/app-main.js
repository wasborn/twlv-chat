import { define } from '@xinix/xin';
import { App } from '@xinix/xin/components/app';
import html from './app-main.html';

import './app-main.css';

import '@xinix/xin/middlewares';
import './app-mini-profile';
import './app-search';
import './app-sessions';
import './app-loading';
import './app-toast';

class AppMain extends App {
  get template () {
    return html;
  }
}

define('app-main', AppMain);
