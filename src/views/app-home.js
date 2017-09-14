import { define } from '@xinix/xin';
import { View } from '@xinix/xin/views/view';
import html from './app-home.html';

import './app-home.css';

class AppHome extends View {
  get template () {
    return html;
  }
}

define('app-home', AppHome);
