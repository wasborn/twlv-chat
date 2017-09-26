import { define } from '@xinix/xin';
import { View } from '@xinix/xin/views';
import html from './app-profile.html';

import './app-profile.css';

const { toast, chat, loading } = window;

class AppProfile extends View {
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

  async focusing () {
    await super.focusing();

    this.set('profile', Object.assign({}, chat.profile));
  }

  async doSave (evt) {
    evt.preventDefault();

    try {
      loading.show();
      await chat.setProfile(this.profile);
      loading.hide();
      toast.show('Profile updated');
    } catch (err) {
      loading.hide();
      toast.show('Failed updating profile, ' + err.message);
    }
  }
}

define('app-profile', AppProfile);
